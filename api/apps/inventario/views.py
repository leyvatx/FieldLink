from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import (
    Material, TechnicianInventory, UsedMaterial,
    CentralWarehouse, MaterialApproval, RestockHistory
)
from .serializers import (
    MaterialSerializer, TechnicianInventorySerializer, UsedMaterialSerializer,
    CentralWarehouseSerializer, MaterialApprovalSerializer, RestockHistorySerializer
)
from apps.usuarios.permissions import IsDispatcherOrOwner, IsTechnician, IsSameCompany
from apps.usuarios.models import User


class MaterialViewSet(viewsets.ModelViewSet):
    """
    Material catalog.
    Staff can manage, technicians can read.
    """
    serializer_class = MaterialSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsDispatcherOrOwner()]

    def get_queryset(self):
        queryset = Material.objects.all()

        if self.request.user.role == 'TECHNICIAN':
            queryset = queryset.filter(is_active=True)

        sku = self.request.query_params.get('sku')
        if sku:
            queryset = queryset.filter(sku=sku)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset.order_by('name')

    def destroy(self, request, *args, **kwargs):
        """Soft delete material instead of removing historic references."""
        material = self.get_object()
        material.is_active = False
        material.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CentralWarehouseViewSet(viewsets.ModelViewSet):
    """
    Central warehouse inventory - OWNER and DISPATCHER.
    """
    permission_classes = [IsAuthenticated, IsDispatcherOrOwner, IsSameCompany]
    serializer_class = CentralWarehouseSerializer
    
    def get_queryset(self):
        """Filter by company"""
        return CentralWarehouse.objects.filter(
            company=self.request.user.company
        ).select_related('material')

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

    @action(detail=False, methods=['post'])
    def receive_stock(self, request):
        """
        Register stock entry into central warehouse.
        Creates the warehouse row if it does not exist.
        """
        material_id = request.data.get('material')
        quantity = int(request.data.get('quantity', 0))
        notes = request.data.get('notes', '')
        minimum_threshold = request.data.get('minimum_threshold')
        reorder_quantity = request.data.get('reorder_quantity')

        if not material_id:
            return Response(
                {'error': 'material is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:
            return Response(
                {'error': 'quantity must be greater than zero'},
                status=status.HTTP_400_BAD_REQUEST
            )

        material = get_object_or_404(Material, id=material_id)

        with transaction.atomic():
            warehouse, _ = CentralWarehouse.objects.get_or_create(
                company=request.user.company,
                material=material,
                defaults={
                    'quantity_available': 0,
                    'quantity_reserved': 0,
                    'quantity_damaged': 0,
                    'minimum_threshold': int(minimum_threshold or 10),
                    'reorder_quantity': int(reorder_quantity or 50),
                }
            )

            warehouse.quantity_available += quantity
            if minimum_threshold is not None:
                warehouse.minimum_threshold = int(minimum_threshold)
            if reorder_quantity is not None:
                warehouse.reorder_quantity = int(reorder_quantity)
            warehouse.last_restocked_at = timezone.now()
            warehouse.save()

            RestockHistory.objects.create(
                warehouse=warehouse,
                restock_type=RestockHistory.RestockType.PURCHASE,
                quantity_change=quantity,
                performed_by=request.user,
                notes=notes or f'Entrada a almacen de {material.name}',
            )

        serializer = self.get_serializer(warehouse)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
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
    serializer_class = TechnicianInventorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action == 'log_usage':
            return [IsAuthenticated(), IsTechnician()]
        return [IsAuthenticated(), IsDispatcherOrOwner()]

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

    def _transfer_stock_to_technician(self, *, technician, material, quantity, notes, request_user):
        if quantity <= 0:
            raise ValidationError('quantity must be greater than zero')

        warehouse, _ = CentralWarehouse.objects.get_or_create(
            company=request_user.company,
            material=material,
            defaults={
                'quantity_available': 0,
                'quantity_reserved': 0,
                'quantity_damaged': 0,
                'minimum_threshold': 10,
                'reorder_quantity': 50,
            }
        )

        if warehouse.quantity_available < quantity:
            raise ValidationError(
                f'Not enough stock in central warehouse. Available: {warehouse.quantity_available}'
            )

        inventory, _ = TechnicianInventory.objects.get_or_create(
            technician=technician,
            material=material,
            defaults={'current_quantity': 0}
        )

        inventory.current_quantity += quantity
        inventory.save()

        warehouse.quantity_available -= quantity
        warehouse.last_restocked_at = timezone.now()
        warehouse.save()

        RestockHistory.objects.create(
            warehouse=warehouse,
            restock_type=RestockHistory.RestockType.ADJUSTMENT,
            quantity_change=-quantity,
            performed_by=request_user,
            notes=notes or f'Entrega a tecnico {technician.name}',
        )

        return inventory

    @action(detail=False, methods=['post'])
    def assign_stock(self, request):
        """
        Assign stock from warehouse to technician.
        Creates technician inventory row if it does not exist.
        """
        technician_id = request.data.get('technician')
        material_id = request.data.get('material')
        quantity = int(request.data.get('quantity', 0))
        notes = request.data.get('notes', '')

        if not technician_id or not material_id:
            return Response(
                {'error': 'technician and material are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        technician = get_object_or_404(
            User,
            id=technician_id,
            company=request.user.company,
            role='TECHNICIAN'
        )
        material = get_object_or_404(Material, id=material_id)

        try:
            inventory = self._transfer_stock_to_technician(
                technician=technician,
                material=material,
                quantity=quantity,
                notes=notes,
                request_user=request.user,
            )
        except ValidationError as exc:
            return Response(
                {'error': str(exc.detail[0] if hasattr(exc, 'detail') else exc)},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(inventory)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDispatcherOrOwner])
    def restock(self, request, pk=None):
        """
        Admin restock technician inventory and log warehouse movement.
        """
        inventory = self.get_object()
        quantity = int(request.data.get('quantity', 0))
        notes = request.data.get('notes', '')

        with transaction.atomic():
            try:
                inventory = self._transfer_stock_to_technician(
                    technician=inventory.technician,
                    material=inventory.material,
                    quantity=quantity,
                    notes=notes,
                    request_user=request.user,
                )
            except ValidationError as exc:
                return Response(
                    {'error': str(exc.detail[0] if hasattr(exc, 'detail') else exc)},
                    status=status.HTTP_400_BAD_REQUEST
                )

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
        """Technician can only log material usage for their own orders."""
        work_order = serializer.validated_data['work_order']
        quantity_used = serializer.validated_data['quantity_used']
        material = serializer.validated_data['material']

        if work_order.company_id != self.request.user.company_id:
            raise PermissionDenied('You can only register materials for orders in your company')

        if (
            self.request.user.role == 'TECHNICIAN'
            and work_order.technician_id != self.request.user.id
        ):
            raise PermissionDenied('You can only register materials for your own orders')

        technician_inventory = None
        if self.request.user.role == 'TECHNICIAN':
            technician_inventory = TechnicianInventory.objects.filter(
                technician=self.request.user,
                material=material,
            ).first()
            if technician_inventory is None:
                raise ValidationError('This material is not assigned to your inventory')
            if quantity_used > technician_inventory.current_quantity:
                raise ValidationError(
                    f'Not enough stock in your inventory. Available: {technician_inventory.current_quantity}'
                )

        with transaction.atomic():
            if technician_inventory is not None:
                technician_inventory.current_quantity -= quantity_used
                technician_inventory.save(update_fields=['current_quantity', 'updated_at'])
            serializer.save(mobile_id=self.request.user.mobile_id)


class MaterialApprovalViewSet(viewsets.ModelViewSet):
    """
    Material usage approval workflow - OWNER and DISPATCHER.
    """
    permission_classes = [IsAuthenticated, IsDispatcherOrOwner]
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
    Inventory restock audit trail - OWNER and DISPATCHER.
    """
    permission_classes = [IsAuthenticated, IsDispatcherOrOwner]
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
