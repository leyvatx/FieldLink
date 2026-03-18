from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.utils import timezone
from .models import Customer, ServiceRequest, Blacklist
from .serializers import CustomerSerializer, ServiceRequestSerializer, BlacklistSerializer
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
            'validation_status': Customer.ValidationStatus.VALIDATED,
        }
        customer, _ = Customer.objects.get_or_create(
            company=self.request.user.company,
            phone=service_request.phone,
            defaults=customer_defaults,
        )

        customer.name = service_request.customer_name
        customer.email = service_request.email
        customer.address = service_request.address
        customer.validation_status = Customer.ValidationStatus.VALIDATED
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

@api_view(['POST'])
@permission_classes([AllowAny])
def public_service_request_view(request, company_slug):
    """
    Public service request intake.
    POST /api/public/companies/{company_slug}/service-requests/
    """
    try:
        company = Company.objects.get(slug=company_slug, is_active=True)
    except Company.DoesNotExist:
        return Response(
            {'error': 'Company not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    payload = {
        'company': company.id,
        'customer_name': request.data.get('customer_name', '').strip(),
        'phone': request.data.get('phone', '').strip(),
        'email': request.data.get('email', '').strip(),
        'address': request.data.get('address', '').strip(),
        'description': request.data.get('description', '').strip(),
        'service_type': request.data.get('service_type', '').strip(),
    }

    serializer = ServiceRequestSerializer(data=payload)
    if serializer.is_valid():
        service_request = serializer.save(company=company)
        response = ServiceRequestSerializer(service_request).data
        return Response(response, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
