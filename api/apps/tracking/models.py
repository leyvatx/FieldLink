from django.db import models
from apps.usuarios.models import User
from apps.ordenes.models import WorkOrder
import uuid


class TechnicianLocation(models.Model):
    """
    Technician location tracking linked to work orders.
    Enables complete audit trail for GPS positions during service.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Link to WorkOrder for complete audit trail
    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='technician_locations',
        null=True,
        blank=True,
        help_text="Work order being serviced when location was recorded"
    )
    
    technician = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='locations',
        limit_choices_to={'role': 'TECHNICIAN'}
    )
    
    # Location
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    
    # Accuracy estimate (from GPS)
    accuracy_meters = models.IntegerField(null=True, blank=True)
    
    # Mobile sync
    mobile_id = models.CharField(max_length=100, blank=True)
    sync_status = models.CharField(
        max_length=15,
        choices=[
            ('PENDING', 'Pending Sync'),
            ('SYNCED', 'Synced'),
        ],
        default='PENDING'
    )
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'technician_locations'
        indexes = [
            models.Index(fields=['technician', '-timestamp']),
            models.Index(fields=['work_order']),
            models.Index(fields=['mobile_id']),
            models.Index(fields=['sync_status']),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.technician.name} @ ({self.latitude}, {self.longitude}) - {self.timestamp}"


class LocationGeoFence(models.Model):
    """
    Geofence validation - verify if technician arrived at service location.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    work_order = models.OneToOneField(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='geofence'
    )
    
    # Expected location
    expected_latitude = models.DecimalField(max_digits=10, decimal_places=7)
    expected_longitude = models.DecimalField(max_digits=10, decimal_places=7)
    
    # Geofence radius in meters
    radius_meters = models.IntegerField(default=100)
    
    # Validation results
    is_validated = models.BooleanField(default=False)
    validated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'location_geofences'

    def __str__(self):
        return f"Geofence - Order #{self.work_order.pk}"

