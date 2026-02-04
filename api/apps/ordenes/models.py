from django.db import models
from apps.usuarios.models import User
from apps.clientes.models import Customer, ServiceRequest


class WorkOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        URGENT = 'URGENT', 'Urgent'

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
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    offline_flag = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'work_orders'

    def __str__(self):
        return f"Order #{self.pk} - {self.customer.name}"


class Evidence(models.Model):
    class SyncStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        UPLOADING = 'UPLOADING', 'Uploading'
        SYNCED = 'SYNCED', 'Synced'
        ERROR = 'ERROR', 'Error'

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='evidences')
    file = models.ImageField(upload_to='evidences/')
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    captured_at = models.DateTimeField()
    sync_status = models.CharField(
        max_length=15, 
        choices=SyncStatus.choices, 
        default=SyncStatus.SYNCED
    )

    class Meta:
        db_table = 'evidences'

    def __str__(self):
        return f"Evidence #{self.pk} - Order #{self.work_order.pk}"


class Signature(models.Model):
    work_order = models.OneToOneField(WorkOrder, on_delete=models.CASCADE, related_name='signature')
    image = models.ImageField(upload_to='signatures/')
    signer_name = models.CharField(max_length=150)
    signed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'signatures'

    def __str__(self):
        return f"Signature - Order #{self.work_order.pk}"


class SimulationEvent(models.Model):
    class EventType(models.TextChoices):
        INCIDENT = 'INCIDENT', 'Incident'
        FAILURE = 'FAILURE', 'Failure'
        TEST = 'TEST', 'Test'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PROCESSED = 'PROCESSED', 'Processed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    event_type = models.CharField(max_length=15, choices=EventType.choices)
    description = models.TextField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'simulation_events'

    def __str__(self):
        return f"Simulation #{self.pk} - {self.event_type}"
