from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from .models import Customer, ServiceRequest, Blacklist, PublicLanding
from .serializers import (
    CustomerSerializer,
    ServiceRequestSerializer,
    BlacklistSerializer,
    PublicLandingSerializer,
)
from apps.usuarios.permissions import IsSameCompany, IsDispatcherOrOwner
from apps.usuarios.models import Company, User
from apps.ordenes.models import WorkOrder


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Customers - OWNER and DISPATCHER can manage.
    Tenant isolation enforced.
    """
    permission_classes = [IsAuthenticated, IsDispatcherOrOwner, IsSameCompany]
    serializer_class = CustomerSerializer

    def get_queryset(self):
        # Filter by company (tenant isolation)
        queryset = Customer.objects.filter(company=self.request.user.company)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(validation_status=status)
        return queryset

    def perform_create(self, serializer):
        """Add company to new customer"""
        serializer.save(
            company=self.request.user.company,
            validation_status=Customer.ValidationStatus.VALIDATED,
        )


def _ensure_single_default_landing(company, preferred_landing=None):
    """
    Keep exactly one default landing per company when landings exist.
    Prefer active defaults and avoid leaving a company without default.
    """
    queryset = PublicLanding.objects.filter(company=company)
    if not queryset.exists():
        return

    if preferred_landing and preferred_landing.is_default:
        queryset.exclude(pk=preferred_landing.pk).filter(is_default=True).update(is_default=False)
        if not preferred_landing.is_active:
            preferred_landing.is_active = True
            preferred_landing.save(update_fields=['is_active', 'updated_at'])
        return

    defaults = list(queryset.filter(is_default=True).order_by('-is_active', 'created_at'))
    if defaults:
        keeper = defaults[0]
        for item in defaults[1:]:
            if item.is_default:
                item.is_default = False
                item.save(update_fields=['is_default', 'updated_at'])
        if not keeper.is_active:
            keeper.is_active = True
            keeper.save(update_fields=['is_active', 'updated_at'])
        return

    candidate = preferred_landing
    if not candidate or candidate.company_id != company.id:
        candidate = queryset.filter(is_active=True).order_by('created_at').first()
    if not candidate:
        candidate = queryset.order_by('created_at').first()

    if candidate and not candidate.is_active:
        candidate.is_active = True
        candidate.save(update_fields=['is_active', 'updated_at'])
    if candidate and not candidate.is_default:
        candidate.is_default = True
        candidate.save(update_fields=['is_default', 'updated_at'])


class PublicLandingViewSet(viewsets.ModelViewSet):
    """
    Public landing configurations for customer intake forms.
    COMPANY and SUPERVISOR can manage landings for their own tenant.
    """
    permission_classes = [IsAuthenticated, IsDispatcherOrOwner]
    serializer_class = PublicLandingSerializer

    def get_queryset(self):
        return PublicLanding.objects.filter(company=self.request.user.company).order_by(
            '-is_default',
            '-is_active',
            'name',
        )

    @transaction.atomic
    def perform_create(self, serializer):
        landing = serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user,
        )
        _ensure_single_default_landing(self.request.user.company, preferred_landing=landing)

    @transaction.atomic
    def perform_update(self, serializer):
        landing = serializer.save(updated_by=self.request.user)
        _ensure_single_default_landing(self.request.user.company, preferred_landing=landing)

    @transaction.atomic
    def perform_destroy(self, instance):
        company = instance.company
        instance.delete()
        _ensure_single_default_landing(company)


class ServiceRequestViewSet(viewsets.ModelViewSet):
    """
    Service Requests - OWNER and DISPATCHER can manage.
    Tenant isolation enforced.
    """
    permission_classes = [IsAuthenticated, IsDispatcherOrOwner, IsSameCompany]
    serializer_class = ServiceRequestSerializer

    def get_queryset(self):
        # Filter by company (tenant isolation)
        queryset = ServiceRequest.objects.filter(company=self.request.user.company)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        """Service requests linked to customer must be in same company"""
        serializer.save(company=self.request.user.company)

    def _get_or_create_customer(self, service_request):
        customer_defaults = {
            'name': service_request.customer_name,
            'email': service_request.email,
            'address': service_request.address,
            'latitude': service_request.latitude,
            'longitude': service_request.longitude,
            'validation_status': Customer.ValidationStatus.VALIDATED,
        }
        customer, _ = Customer.objects.get_or_create(
            company=self.request.user.company,
            phone=service_request.phone,
            defaults=customer_defaults,
        )

        previous_address = (customer.address or '').strip()
        next_address = (service_request.address or '').strip()
        customer.name = service_request.customer_name
        customer.email = service_request.email
        customer.address = next_address
        customer.validation_status = Customer.ValidationStatus.VALIDATED
        if service_request.latitude is not None and service_request.longitude is not None:
            customer.latitude = service_request.latitude
            customer.longitude = service_request.longitude
        elif previous_address != next_address:
            customer.latitude = None
            customer.longitude = None
        customer.save()
        return customer

    def _resolve_technician(self, technician_id):
        if not technician_id:
            return None

        try:
            return User.objects.get(
                id=technician_id,
                company=self.request.user.company,
                role='TECHNICIAN'
            )
        except User.DoesNotExist:
            raise ValueError('Technician not found or not in your company')

    @action(detail=True, methods=['post'])
    def validate_otp(self, request, pk=None):
        """Simulates OTP validation"""
        service_request = self.get_object()
        service_request.otp_validated = True
        service_request.save()
        return Response({'message': 'OTP validated successfully'})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approves the request, creates a work order, and optionally assigns it.
        Payload:
          - technician_id (optional)
        """
        service_request = self.get_object()
        technician_id = request.data.get('technician_id')

        if service_request.status == ServiceRequest.Status.REJECTED:
            return Response(
                {'error': 'Rejected requests cannot be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            technician = self._resolve_technician(technician_id)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            customer = self._get_or_create_customer(service_request)

            order_defaults = {
                'company': self.request.user.company,
                'customer': customer,
                'customer_name': service_request.customer_name,
                'customer_phone': service_request.phone,
                'customer_email': service_request.email,
                'service_location_address': service_request.address,
                'customer_latitude': customer.latitude,
                'customer_longitude': customer.longitude,
                'notes': service_request.description,
                'status': WorkOrder.Status.PENDING,
            }

            work_order, _ = WorkOrder.objects.get_or_create(
                service_request=service_request,
                defaults=order_defaults,
            )

            work_order.company = self.request.user.company
            work_order.customer = customer
            work_order.customer_name = service_request.customer_name
            work_order.customer_phone = service_request.phone
            work_order.customer_email = service_request.email
            work_order.service_location_address = service_request.address
            work_order.customer_latitude = customer.latitude
            work_order.customer_longitude = customer.longitude
            work_order.notes = service_request.description

            if technician:
                work_order.technician = technician
                work_order.status = WorkOrder.Status.ASSIGNED
                work_order.scheduled_date = work_order.scheduled_date or timezone.now()
            elif not work_order.technician_id:
                work_order.status = WorkOrder.Status.PENDING

            work_order.save()

            service_request.status = ServiceRequest.Status.VALIDATED
            service_request.validated_at = timezone.now()
            service_request.save(update_fields=['status', 'validated_at', 'updated_at'])

        serializer = self.get_serializer(service_request)
        payload = serializer.data
        payload['message'] = 'Request approved'
        return Response(payload)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rejects the request"""
        service_request = self.get_object()
        service_request.status = 'REJECTED'
        service_request.save()
        return Response({'message': 'Request rejected'})


class BlacklistViewSet(viewsets.ModelViewSet):
    """
    Blacklist - OWNER ONLY for management.
    """
    permission_classes = [IsAuthenticated, IsDispatcherOrOwner]
    serializer_class = BlacklistSerializer
    
    def get_queryset(self):
        return Blacklist.objects.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def check(self, request):
        """Checks if a phone is blacklisted - ADMIN ONLY"""
        phone = request.query_params.get('phone')
        if not phone:
            return Response({'error': 'Missing phone parameter'}, status=400)
        is_blocked = Blacklist.objects.filter(
            company=request.user.company,
            phone=phone
        ).exists()
        return Response({'blocked': is_blocked})


# ============================================================================
# PUBLIC SERVICE REQUEST (NO LOGIN REQUIRED)
# ============================================================================

def _normalize_host(raw_host):
    host = (raw_host or '').strip().lower()
    if ':' in host:
        host = host.split(':', 1)[0]
    return host


def _extract_company_slug_from_host(request):
    host = _normalize_host(request.get_host())
    if not host:
        return ''

    reserved = set(getattr(settings, 'PUBLIC_RESERVED_SUBDOMAINS', []))
    root_domain = (getattr(settings, 'PUBLIC_ROOT_DOMAIN', '') or '').strip().lower()

    if root_domain:
        if host == root_domain:
            return ''

        suffix = f'.{root_domain}'
        if host.endswith(suffix):
            subdomain = host[:-len(suffix)]
            if subdomain and '.' not in subdomain and subdomain not in reserved:
                return subdomain
            return ''

    # Local development fallback: {slug}.localhost
    if host.endswith('.localhost'):
        subdomain = host[:-len('.localhost')]
        if subdomain and '.' not in subdomain and subdomain not in reserved:
            return subdomain

    return ''


def _resolve_public_company(request, company_slug=''):
    slug_candidate = (company_slug or '').strip().lower()
    if not slug_candidate:
        slug_candidate = (request.query_params.get('company_slug') or '').strip().lower()

    if not slug_candidate:
        request_payload_slug = (request.data.get('company_slug') or '').strip().lower()
        slug_candidate = request_payload_slug

    if not slug_candidate:
        slug_candidate = _extract_company_slug_from_host(request)

    if not slug_candidate:
        return None, 'Empresa no identificada'

    try:
        company = Company.objects.get(slug=slug_candidate, is_active=True)
    except Company.DoesNotExist:
        return None, 'Empresa no encontrada'

    return company, None


def _build_public_landing_links(request, company_slug, landing_slug=''):
    base_host = _normalize_host(request.get_host())
    base_scheme = 'https' if request.is_secure() else 'http'
    base_path_url = f'{base_scheme}://{base_host}/solicitud/{company_slug}'

    if landing_slug:
        path_url = f'{base_path_url}/l/{landing_slug}'
    else:
        path_url = base_path_url

    base_subdomain_url = None
    subdomain_url = None
    root_domain = (getattr(settings, 'PUBLIC_ROOT_DOMAIN', '') or '').strip().lower()
    if root_domain:
        base_subdomain_url = f'https://{company_slug}.{root_domain}/solicitud'
        if landing_slug:
            subdomain_url = f'{base_subdomain_url}/l/{landing_slug}'
        else:
            subdomain_url = base_subdomain_url

    return {
        'path_url': path_url,
        'subdomain_url': subdomain_url,
        'base_path_url': base_path_url,
        'base_subdomain_url': base_subdomain_url,
    }


def _resolve_public_landing(company, request, landing_slug=''):
    slug_candidate = (landing_slug or '').strip().lower()
    if not slug_candidate:
        slug_candidate = (request.query_params.get('landing_slug') or '').strip().lower()
    if not slug_candidate and hasattr(request, 'data'):
        slug_candidate = (request.data.get('landing_slug') or '').strip().lower()

    if slug_candidate:
        try:
            landing = PublicLanding.objects.get(
                company=company,
                slug=slug_candidate,
                is_active=True,
            )
        except PublicLanding.DoesNotExist:
            return None, 'Landing no encontrada'
        return landing, None

    landing = company.public_landings.filter(is_active=True, is_default=True).first()
    if landing:
        return landing, None

    landing = company.public_landings.filter(is_active=True).order_by('created_at').first()
    if landing:
        return landing, None

    return None, None


def _create_public_service_request(request, company, landing=None):
    payload = {
        'company': company.id,
        'landing': landing.id if landing else None,
        'customer_name': request.data.get('customer_name', '').strip(),
        'phone': request.data.get('phone', '').strip(),
        'email': request.data.get('email', '').strip(),
        'address': request.data.get('address', '').strip(),
        'latitude': request.data.get('latitude') or None,
        'longitude': request.data.get('longitude') or None,
        'description': request.data.get('description', '').strip(),
        'service_type': request.data.get('service_type', '').strip(),
    }

    serializer = ServiceRequestSerializer(data=payload)
    if serializer.is_valid():
        service_request = serializer.save(company=company, landing=landing)
        response = ServiceRequestSerializer(service_request).data
        return Response(response, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_landing_view(request):
    """
    Resolve public landing by subdomain/host or explicit company_slug query param.
    Optional query params:
      - company_slug
      - landing_slug
    GET /api/public/landing/
    """
    company, error = _resolve_public_company(request)
    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    landing, landing_error = _resolve_public_landing(company, request)
    if landing_error:
        return Response({'error': landing_error}, status=status.HTTP_404_NOT_FOUND)

    configuration = getattr(company, 'configuration', None)
    logo_url = None
    if configuration and configuration.logo:
        logo_url = request.build_absolute_uri(configuration.logo.url)

    response = {
        'company_name': company.name,
        'company_slug': company.slug,
        'support_email': configuration.support_email if configuration else company.email,
        'support_phone': configuration.support_phone if configuration else company.phone,
        'whatsapp_number': configuration.whatsapp_number if configuration else '',
        'primary_color': configuration.primary_color if configuration else '#0066CC',
        'secondary_color': configuration.secondary_color if configuration else '#FFFFFF',
        'logo_url': logo_url,
        'landing_name': landing.name if landing else '',
        'landing_slug': landing.slug if landing else '',
        'headline': landing.headline if landing else '',
        'subtitle': landing.subtitle if landing else '',
        'cta_text': landing.cta_text if landing else 'Enviar solicitud',
        'links': _build_public_landing_links(
            request,
            company.slug,
            landing_slug=landing.slug if landing else '',
        ),
    }
    return Response(response)


@api_view(['POST'])
@permission_classes([AllowAny])
def public_service_request_view(request, company_slug):
    """
    Public service request intake.
    POST /api/public/companies/{company_slug}/service-requests/
    """
    company, error = _resolve_public_company(request, company_slug=company_slug)
    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    landing, landing_error = _resolve_public_landing(company, request)
    if landing_error:
        return Response({'error': landing_error}, status=status.HTTP_404_NOT_FOUND)

    return _create_public_service_request(request, company, landing=landing)


@api_view(['POST'])
@permission_classes([AllowAny])
def public_service_request_by_landing_view(request, company_slug, landing_slug):
    """
    Public service request intake by explicit company + landing slug.
    POST /api/public/companies/{company_slug}/landings/{landing_slug}/service-requests/
    """
    company, error = _resolve_public_company(request, company_slug=company_slug)
    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    landing, landing_error = _resolve_public_landing(company, request, landing_slug=landing_slug)
    if landing_error:
        return Response({'error': landing_error}, status=status.HTTP_404_NOT_FOUND)

    return _create_public_service_request(request, company, landing=landing)


@api_view(['POST'])
@permission_classes([AllowAny])
def public_service_request_by_host_view(request):
    """
    Public service request intake resolved by subdomain/host.
    POST /api/public/service-requests/
    Optional fallback: body.company_slug
    """
    company, error = _resolve_public_company(request)
    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    landing, landing_error = _resolve_public_landing(company, request)
    if landing_error:
        return Response({'error': landing_error}, status=status.HTTP_404_NOT_FOUND)

    return _create_public_service_request(request, company, landing=landing)
