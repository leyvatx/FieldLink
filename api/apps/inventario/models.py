from django.db import models
from django.core.exceptions import ValidationError
from apps.usuarios.models import User
from apps.ordenes.models import WorkOrder
import uuid


class Material(models.Model):
    """Core material catalog"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=20)  # "unit", "meter", "kg", etc.
    sku = models.CharField(max_length=50, unique=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        db_table = 'materials'
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class CentralWarehouse(models.Model):
    """
    Central warehouse inventory tracking for company stock.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'usuarios.Company',
        on_delete=models.CASCADE,
        related_name='central_warehouse',
        null=True,
        blank=True
    )
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='warehouse_stock')
    
    quantity_available = models.IntegerField(default=0)
    quantity_reserved = models.IntegerField(default=0)  # Reserved for orders
    quantity_damaged = models.IntegerField(default=0)   # Damaged stock
    
    minimum_threshold = models.IntegerField(default=10)  # Reorder point
    reorder_quantity = models.IntegerField(default=50)
    
    last_restocked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'central_warehouse'
        unique_together = ['company', 'material']
        indexes = [
            models.Index(fields=['company', 'material']),
        ]

    def __str__(self):
        return f"{self.company.name} - {self.material.name}: {self.quantity_available}"

    @property
    def quantity_usable(self):
        return self.quantity_available - self.quantity_reserved


class TechnicianInventory(models.Model):
    """Field technician mobile inventory"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    technician = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='inventory',
        limit_choices_to={'role': 'TECHNICIAN'}
    )
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='technician_inventories')
    current_quantity = models.IntegerField(default=0)
    
    # Mobile sync
    mobile_id = models.CharField(max_length=100, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'technician_inventory'
        unique_together = ['technician', 'material']
        indexes = [
            models.Index(fields=['technician']),
            models.Index(fields=['mobile_id']),
        ]

    def __str__(self):
        return f"{self.technician.name} - {self.material.name}: {self.current_quantity}"


class UsedMaterial(models.Model):
    """
    Materials consumed during work order execution.
    Phase 2 of 3-phase inventory approval workflow.
    """
    class ApprovalStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Admin Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        ADJUSTED = 'ADJUSTED', 'Adjusted by Admin'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='used_materials'
    )
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name='usages')
    quantity_used = models.IntegerField()
    
    # Mobile sync tracking
    mobile_id = models.CharField(max_length=100, blank=True)
    
    # Photos of used materials (evidence)
    photos = models.ManyToManyField(
        'ordenes.Evidence',
        blank=True,
        help_text="Photos of materials in use for verification"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'used_materials'
        indexes = [
            models.Index(fields=['work_order']),
            models.Index(fields=['mobile_id']),
        ]

    def __str__(self):
        return f"Order #{self.work_order.pk} - {self.material.name}: {self.quantity_used}"


class MaterialApproval(models.Model):
    """
    Admin approval workflow for material usage.
    Phase 3 of 3-phase inventory control system.
    """
    class ApprovalStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        ADJUSTED = 'ADJUSTED', 'Quantity Adjusted'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    used_material = models.OneToOneField(
        UsedMaterial,
        on_delete=models.CASCADE,
        related_name='approval'
    )
    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='material_approvals'
    )
    
    # Status
    status = models.CharField(max_length=15, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    
    # Approval details
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='material_approvals',
        limit_choices_to={'role__in': ['OWNER', 'DISPATCHER']}
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Adjustment if rejected/adjusted
    approved_quantity = models.IntegerField(null=True, blank=True, help_text="Final approved quantity (if adjusted)")
    rejection_reason = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'material_approvals'
        indexes = [
            models.Index(fields=['work_order', 'status']),
            models.Index(fields=['reviewed_by']),
        ]

    def __str__(self):
        return f"Approval #{self.pk} - {self.get_status_display()}"


class RestockHistory(models.Model):
    """
    Complete audit trail of all inventory movements.
    Tracks every restock, consumption, and adjustment event.
    """
    class RestockType(models.TextChoices):
        MANUAL_ADD = 'MANUAL_ADD', 'Manual Add'
        RETURN = 'RETURN', 'Return from Technician'
        CONSUMPTION = 'CONSUMPTION', 'Consumption Approved'
        ADJUSTMENT = 'ADJUSTMENT', 'Inventory Adjustment'
        PURCHASE = 'PURCHASE', 'Purchase/Delivery'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    warehouse = models.ForeignKey(
        CentralWarehouse,
        on_delete=models.CASCADE,
        related_name='restock_history'
    )
    
    restock_type = models.CharField(max_length=20, choices=RestockType.choices)
    quantity_change = models.IntegerField()  # Can be negative for consumption
    
    related_approval = models.ForeignKey(
        MaterialApproval,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="If related to material approval"
    )
    related_work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="If related to work order"
    )
    
    # Action by
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='restock_actions'
    )
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'restock_history'
        indexes = [
            models.Index(fields=['warehouse']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['restock_type']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_restock_type_display()} - {self.warehouse.material.name}: {self.quantity_change:+d}"

