from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Customer, ServiceRequest, Blacklist
from .serializers import CustomerSerializer, ServiceRequestSerializer, BlacklistSerializer
from apps.usuarios.permissions import IsSameCompany, IsDispatcherOrOwner
from apps.usuarios.models import Company


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
        serializer.save(company=self.request.user.company)


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

    @action(detail=True, methods=['post'])
    def validate_otp(self, request, pk=None):
        """Simulates OTP validation"""
        service_request = self.get_object()
        service_request.otp_validated = True
        service_request.save()
        return Response({'message': 'OTP validated successfully'})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approves the request"""
        service_request = self.get_object()
        service_request.status = 'VALIDATED'
        service_request.save()
        return Response({'message': 'Request approved'})

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
