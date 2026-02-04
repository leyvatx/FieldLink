from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import WorkOrder, Evidence, Signature, SimulationEvent
from .serializers import (
    WorkOrderSerializer, WorkOrderListSerializer,
    EvidenceSerializer, SignatureSerializer, SimulationEventSerializer
)


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.select_related('customer', 'technician').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkOrderListSerializer
        return WorkOrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        technician = self.request.query_params.get('technician')
        priority = self.request.query_params.get('priority')
        
        if status:
            queryset = queryset.filter(status=status)
        if technician:
            queryset = queryset.filter(technician_id=technician)
        if priority:
            queryset = queryset.filter(priority=priority)
        return queryset

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assigns a technician to the order"""
        order = self.get_object()
        technician_id = request.data.get('technician_id')
        if not technician_id:
            return Response({'error': 'technician_id is required'}, status=400)
        order.technician_id = technician_id
        order.status = 'ASSIGNED'
        order.save()
        return Response({'message': 'Technician assigned'})

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Starts the order"""
        order = self.get_object()
        order.status = 'IN_PROGRESS'
        order.started_at = timezone.now()
        order.save()
        return Response({'message': 'Order started'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Completes the order"""
        order = self.get_object()
        order.status = 'COMPLETED'
        order.completed_at = timezone.now()
        order.save()
        return Response({'message': 'Order completed'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancels the order"""
        order = self.get_object()
        order.status = 'CANCELLED'
        order.save()
        return Response({'message': 'Order cancelled'})


class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.select_related('work_order').all()
    serializer_class = EvidenceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        order = self.request.query_params.get('order')
        if order:
            queryset = queryset.filter(work_order_id=order)
        return queryset


class SignatureViewSet(viewsets.ModelViewSet):
    queryset = Signature.objects.select_related('work_order').all()
    serializer_class = SignatureSerializer


class SimulationEventViewSet(viewsets.ModelViewSet):
    queryset = SimulationEvent.objects.all()
    serializer_class = SimulationEventSerializer

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Marks the event as processed"""
        event = self.get_object()
        event.status = 'PROCESSED'
        event.save()
        return Response({'message': 'Event processed'})
