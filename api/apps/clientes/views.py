from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer, ServiceRequest, Blacklist
from .serializers import CustomerSerializer, ServiceRequestSerializer, BlacklistSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(validation_status=status)
        return queryset


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

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
    queryset = Blacklist.objects.all()
    serializer_class = BlacklistSerializer

    @action(detail=False, methods=['get'])
    def check(self, request):
        """Checks if a phone is blacklisted"""
        phone = request.query_params.get('phone')
        if not phone:
            return Response({'error': 'Missing phone parameter'}, status=400)
        is_blocked = Blacklist.objects.filter(phone=phone).exists()
        return Response({'blocked': is_blocked})
