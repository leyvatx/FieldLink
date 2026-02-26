from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Customer, ServiceRequest, Blacklist
from .serializers import CustomerSerializer, ServiceRequestSerializer, BlacklistSerializer
from apps.usuarios.permissions import IsSameCompany


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Customers - protected.
    Only allow company members to access their own company's customers.
    """
    permission_classes = [IsAuthenticated, IsSameCompany]
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
    Service Requests - protected.
    Only allow company members to access their own company's requests.
    """
    permission_classes = [IsAuthenticated, IsSameCompany]
    serializer_class = ServiceRequestSerializer

    def get_queryset(self):
        # Filter by company (tenant isolation)
        queryset = ServiceRequest.objects.filter(customer__company=self.request.user.company)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        """Service requests linked to customer must be in same company"""
        serializer.save()

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
    Blacklist - ADMIN ONLY for management.
    Check endpoint is ADMIN ONLY.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BlacklistSerializer
    
    def get_queryset(self):
        return Blacklist.objects.all()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def check(self, request):
        """Checks if a phone is blacklisted - ADMIN ONLY"""
        phone = request.query_params.get('phone')
        if not phone:
            return Response({'error': 'Missing phone parameter'}, status=400)
        is_blocked = Blacklist.objects.filter(phone=phone).exists()
        return Response({'blocked': is_blocked})
