from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import WorkOrder, Evidence, Signature, SimulationEvent
from .serializers import (
    WorkOrderSerializer, WorkOrderListSerializer,
    EvidenceSerializer, SignatureSerializer, SimulationEventSerializer
)
from apps.usuarios.permissions import IsSameCompany, IsOwner, IsDispatcherOrOwner, IsTechnician


class WorkOrderViewSet(viewsets.ModelViewSet):
    """
    Work orders - with tenant isolation.
    OWNER/DISPATCHER: full access to all company orders
    TECHNICIAN: can only access their own assigned orders
    """
    permission_classes = [IsAuthenticated, IsSameCompany]

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkOrderListSerializer
        return WorkOrderSerializer

    def get_queryset(self):
        """Filter by company (tenant isolation)"""
        queryset = WorkOrder.objects.filter(
            company=self.request.user.company
        ).select_related('customer', 'technician')
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by technician (only owners/dispatchers can filter others)
        technician = self.request.query_params.get('technician')
        if technician:
            if self.request.user.role == 'TECHNICIAN' and technician != str(self.request.user.id):
                return WorkOrder.objects.none()
            queryset = queryset.filter(technician_id=technician)
        elif self.request.user.role == 'TECHNICIAN':
            # Technicians only see their assigned orders
            queryset = queryset.filter(technician=self.request.user)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        """Add company to new order"""
        serializer.save(company=self.request.user.company)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDispatcherOrOwner])
    def assign(self, request, pk=None):
        """Assign technician to order (OWNER or DISPATCHER)"""
        order = self.get_object()
        technician_id = request.data.get('technician_id')
        
        if not technician_id:
            return Response(
                {'error': 'technician_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.usuarios.models import User
            technician = User.objects.get(
                id=technician_id,
                company=request.user.company,
                role='TECHNICIAN'
            )
            order.technician = technician
            order.status = WorkOrder.Status.ASSIGNED
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Technician not found or not in your company'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsTechnician])
    def start_transit(self, request, pk=None):
        """Technician starts traveling to site"""
        order = self.get_object()
        if order.technician != request.user:
            return Response(
                {'error': 'You can only update your own orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status != WorkOrder.Status.ASSIGNED:
            return Response(
                {'error': f'Cannot transition from {order.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = WorkOrder.Status.IN_TRANSIT
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsTechnician])
    def arrive(self, request, pk=None):
        """Technician has arrived at site, starting service"""
        order = self.get_object()
        if order.technician != request.user:
            return Response(
                {'error': 'You can only update your own orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status != WorkOrder.Status.IN_TRANSIT:
            return Response(
                {'error': f'Cannot transition from {order.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = WorkOrder.Status.IN_SERVICE
        order.arrived_at = timezone.now()
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsTechnician])
    def complete(self, request, pk=None):
        """Mark order as completed"""
        order = self.get_object()
        if order.technician != request.user:
            return Response(
                {'error': 'You can only complete your own orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status != WorkOrder.Status.IN_SERVICE:
            return Response(
                {'error': f'Cannot complete from {order.get_status_display()} state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            order.status = WorkOrder.Status.COMPLETED
            order.save()  # Triggers validation in signals
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDispatcherOrOwner])
    def cancel(self, request, pk=None):
        """Cancel order (OWNER or DISPATCHER)"""
        order = self.get_object()
        order.status = WorkOrder.Status.CANCELLED
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)


class EvidenceViewSet(viewsets.ModelViewSet):
    """
    Work order evidence photos - protected.
    Technicians can only upload for their own orders.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EvidenceSerializer

    def get_queryset(self):
        """Filter by company"""
        queryset = Evidence.objects.filter(
            work_order__company=self.request.user.company
        ).select_related('work_order')
        
        # Technicians only see their own evidence
        if self.request.user.role == 'TECHNICIAN':
            queryset = queryset.filter(work_order__technician=self.request.user)
        
        # Filter by order
        order = self.request.query_params.get('order')
        if order:
            queryset = queryset.filter(work_order_id=order)
        
        return queryset.order_by('-captured_at')
    
    def perform_create(self, serializer):
        """Set mobile_id"""
        serializer.save(mobile_id=self.request.user.mobile_id)


class SignatureViewSet(viewsets.ModelViewSet):
    """
    Work order signatures - protected.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SignatureSerializer

    def get_queryset(self):
        """Filter by company"""
        queryset = Signature.objects.filter(
            work_order__company=self.request.user.company
        ).select_related('work_order')
        
        # Technicians only see their own signatures
        if self.request.user.role == 'TECHNICIAN':
            queryset = queryset.filter(work_order__technician=self.request.user)
        
        return queryset.order_by('-signed_at')
    
    def perform_create(self, serializer):
        """Set mobile_id"""
        serializer.save(mobile_id=self.request.user.mobile_id)


class SimulationEventViewSet(viewsets.ModelViewSet):
    """
    Simulation events - OWNER ONLY.
    For testing/development.
    """
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = SimulationEvent.objects.all()
    serializer_class = SimulationEventSerializer

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Mark event as processed"""
        event = self.get_object()
        event.status = 'PROCESSED'
        event.save()
        serializer = self.get_serializer(event)
        return Response(serializer.data)
