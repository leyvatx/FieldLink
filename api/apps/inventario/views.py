from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import (
    Material, TechnicianInventory, UsedMaterial,
    CentralWarehouse, MaterialApproval, RestockHistory
)
from .serializers import (
    MaterialSerializer, TechnicianInventorySerializer, UsedMaterialSerializer,
    CentralWarehouseSerializer, MaterialApprovalSerializer, RestockHistorySerializer
)
from apps.usuarios.permissions import IsAdmin, IsTechnician, IsSameCompany


class MaterialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Material catalog - read-only.
    All authenticated users can view.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MaterialSerializer
    
    def get_queryset(self):
        queryset = Material.objects.filter(is_active=True)
        
        # Optional filter
        sku = self.request.query_params.get('sku')
        if sku:
            queryset = queryset.filter(sku=sku)
        
        return queryset.order_by('name')


class CentralWarehouseViewSet(viewsets.ModelViewSet):
    """
    Central warehouse inventory - ADMIN ONLY.
    """
    permission_classes = [IsAuthenticated, IsAdmin, IsSameCompany]
    serializer_class = CentralWarehouseSerializer
    
    def get_queryset(self):
        """Filter by company"""
        return CentralWarehouse.objects.filter(
            company=self.request.user.company
        ).select_related('material')
    
    @action(detail=True, methods=['post'])
    def check_threshold(self, request, pk=None):
        """Check if warehouse is below reorder threshold"""
        warehouse = self.get_object()
        if warehouse.quantity_usable < warehouse.minimum_threshold:
            return Response({
                'needs_restock': True,
                'current_quantity': warehouse.quantity_usable,
                'minimum': warehouse.minimum_threshold,
                'suggested_order': warehouse.reorder_quantity
            })
        return Response({'needs_restock': False})


class TechnicianInventoryViewSet(viewsets.ModelViewSet):
    """
    Technician field inventory - ADMIN can view all, TECHNICIAN can view own.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TechnicianInventorySerializer
    
    def get_queryset(self):
        queryset = TechnicianInventory.objects.select_related('technician', 'material')
        
        # Filter by company
        queryset = queryset.filter(technician__company=self.request.user.company)
        
        # Technicians only see their own inventory
        if self.request.user.role == 'TECHNICIAN':
            queryset = queryset.filter(technician=self.request.user)
        
        # Optional filter
        technician = self.request.query_params.get('technician')
        if technician:
            if self.request.user.role == 'TECHNICIAN' and technician != str(self.request.user.id):
                return TechnicianInventory.objects.none()
            queryset = queryset.filter(technician_id=technician)
        
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsTechnician])
    def log_usage(self, request, pk=None):
        """
        Technician logs material usage for current work order.
        """
        inventory = self.get_object()
        if inventory.technician != request.user:
            return Response(
                {'error': 'Can only log own inventory'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        quantity = int(request.data.get('quantity', 0))
        work_order_id = request.data.get('work_order_id')
        
        if not work_order_id:
            return Response(
                {'error': 'work_order_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity <= 0 or quantity > inventory.current_quantity:
            return Response(
                {'error': f'Invalid quantity. Available: {inventory.current_quantity}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deduct from inventory
        inventory.current_quantity -= quantity
        inventory.save()
        
        serializer = self.get_serializer(inventory)
        return Response(serializer.data)


class UsedMaterialViewSet(viewsets.ModelViewSet):
    """
    Materials used in work orders - pending admin approval.
    """
    permission_classes = [IsAuthenticated, IsSameCompany]
    serializer_class = UsedMaterialSerializer
    
    def get_queryset(self):
        """Filter by company"""
        queryset = UsedMaterial.objects.filter(
            work_order__company=self.request.user.company
        ).select_related('work_order', 'material')
        
        # Technicians only see their own
        if self.request.user.role == 'TECHNICIAN':
            queryset = queryset.filter(work_order__technician=self.request.user)
        
        # Optional filters
        order = self.request.query_params.get('order')
        if order:
            queryset = queryset.filter(work_order_id=order)
        
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(approval__status=status_param)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set mobile_id for offline tracking"""
        serializer.save(mobile_id=self.request.user.mobile_id)


class MaterialApprovalViewSet(viewsets.ModelViewSet):
    """
    Material usage approval workflow - ADMIN ONLY.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = MaterialApprovalSerializer
    
    def get_queryset(self):
        """Filter by company"""
        return MaterialApproval.objects.filter(
            work_order__company=self.request.user.company
        ).select_related('used_material', 'reviewed_by')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve material usage"""
        approval = self.get_object()
        approval.status = 'APPROVED'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.approved_quantity = approval.used_material.quantity_used
        approval.save()
        
        serializer = self.get_serializer(approval)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject material usage"""
        approval = self.get_object()
        approval.status = 'REJECTED'
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.rejection_reason = request.data.get('reason', '')
        approval.save()
        
        serializer = self.get_serializer(approval)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        """Adjust approved quantity"""
        approval = self.get_object()
        new_quantity = int(request.data.get('quantity', 0))
        
        if new_quantity > approval.used_material.quantity_used:
            return Response(
                {'error': 'Adjusted quantity cannot exceed original'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        approval.status = 'ADJUSTED'
        approval.approved_quantity = new_quantity
        approval.reviewed_by = request.user
        approval.reviewed_at = timezone.now()
        approval.save()
        
        serializer = self.get_serializer(approval)
        return Response(serializer.data)


class RestockHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Inventory restock audit trail - ADMIN ONLY.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = RestockHistorySerializer
    
    def get_queryset(self):
        """Filter by company"""
        queryset = RestockHistory.objects.filter(
            warehouse__company=self.request.user.company
        ).select_related('warehouse', 'related_approval', 'related_work_order', 'performed_by')
        
        # Filter by type
        restock_type = self.request.query_params.get('type')
        if restock_type:
            queryset = queryset.filter(restock_type=restock_type)
        
        return queryset.order_by('-created_at')
