from django.db import models
from django.core.exceptions import ValidationError
from apps.usuarios.models import User
from apps.clientes.models import Customer, ServiceRequest
import uuid


class WorkOrder(models.Model):
    """
    CRITICAL REFACTOR: Complete state machine for field service operations.
    Includes all missing fields for SaaS compliance.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending - Awaiting Assignment'
        ASSIGNED = 'ASSIGNED', 'Assigned to Technician'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit (Traveling to Site)'
        IN_SERVICE = 'IN_SERVICE', 'In Service (At Site)'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        URGENT = 'URGENT', 'Urgent'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'usuarios.Company',
        on_delete=models.CASCADE,
        related_name='work_orders',
        null=True,
        blank=True
    )
    
    # Original relationships
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='work_orders')
    technician = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_orders',
        limit_choices_to={'role': 'TECHNICIAN'}
    )
    service_request = models.OneToOneField(
        ServiceRequest, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='work_order'
    )
    
    # CRITICAL: Public tracking token (customer can track without login, like Uber)
    tracking_token = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        help_text="Public token for customer tracking without login"
    )
    
    # CRITICAL: Customer final-mile data (copy in order for audit trail)
    customer_name = models.CharField(max_length=150, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    customer_email = models.EmailField(blank=True)
    service_location_address = models.TextField(blank=True, help_text="Service site address")
    customer_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    customer_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Status and priority
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    
    # Scheduling
    scheduled_date = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # CRITICAL: Arrival time for audit (when technician reached site)
    arrived_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    # Offline sync
    mobile_id = models.CharField(max_length=100, blank=True)
    offline_flag = models.BooleanField(default=False)
    sync_status = models.CharField(
        max_length=15,
        choices=[
            ('PENDING', 'Pending Sync'),
            ('SYNCING', 'Syncing'),
            ('SYNCED', 'Synced'),
            ('CONFLICT', 'Conflict'),
        ],
        default='PENDING'
    )
    
    # CRITICAL: Completion validation fields
    customer_signature_required = models.BooleanField(default=True)
    evidence_photos_required = models.BooleanField(default=True)
    materials_required = models.BooleanField(default=False)
    
    # Timestamps for audit trail
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'work_orders'
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['technician', 'status']),
            models.Index(fields=['tracking_token']),
            models.Index(fields=['mobile_id']),
            models.Index(fields=['-created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.pk} - {self.customer.name} ({self.get_status_display()})"

    def clean(self):
        """Validate state transitions and completion requirements"""
        if self.status == self.Status.COMPLETED:
            if self.customer_signature_required and not self.signature:
                raise ValidationError("Customer signature is required before completing order")
            if self.evidence_photos_required and not self.evidences.exists():
                raise ValidationError("Evidence photos are required before completing order")

    def save(self, *args, **kwargs):
        # Auto-generate tracking token if not set
        if not self.tracking_token:
            self.tracking_token = str(uuid.uuid4()).replace('-', '')[:32]
        self.full_clean()
        super().save(*args, **kwargs)



class Evidence(models.Model):
    """Evidence photos with location and sync tracking"""
    class SyncStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        UPLOADING = 'UPLOADING', 'Uploading'
        SYNCED = 'SYNCED', 'Synced'
        ERROR = 'ERROR', 'Error'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='evidences')
    file = models.ImageField(upload_to='evidences/')
    
    # Location at time of evidence capture
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    captured_at = models.DateTimeField()
    sync_status = models.CharField(
        max_length=15, 
        choices=SyncStatus.choices, 
        default=SyncStatus.PENDING
    )
    
    # Mobile sync tracking
    mobile_id = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evidences'
        indexes = [
            models.Index(fields=['work_order', 'sync_status']),
            models.Index(fields=['mobile_id']),
        ]
        ordering = ['-captured_at']

    def __str__(self):
        return f"Evidence #{self.pk} - Order #{self.work_order.pk}"


class Signature(models.Model):
    """Customer signature with mobile sync tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    work_order = models.OneToOneField(WorkOrder, on_delete=models.CASCADE, related_name='signature')
    image = models.ImageField(upload_to='signatures/')
    signer_name = models.CharField(max_length=150)
    signer_phone = models.CharField(max_length=20, blank=True)
    signer_email = models.EmailField(blank=True)
    
    # Mobile sync
    mobile_id = models.CharField(max_length=100, blank=True)
    
    signed_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'signatures'
        indexes = [
            models.Index(fields=['work_order']),
            models.Index(fields=['mobile_id']),
        ]

    def __str__(self):
        return f"Signature - Order #{self.work_order.pk}"


class SimulationEvent(models.Model):
    """Testing/simulation events for development"""
    class EventType(models.TextChoices):
        INCIDENT = 'INCIDENT', 'Incident'
        FAILURE = 'FAILURE', 'Failure'
        TEST = 'TEST', 'Test'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PROCESSED = 'PROCESSED', 'Processed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=15, choices=EventType.choices)
    description = models.TextField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'simulation_events'
        ordering = ['-created_at']

    def __str__(self):
        return f"Simulation #{self.pk} - {self.event_type}"

