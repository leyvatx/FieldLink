from django.db import models
import uuid


class Customer(models.Model):
    """
    End customers receiving service (not system users).
    """
    class ValidationStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        VALIDATED = 'VALIDATED', 'Validated'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'usuarios.Company',
        on_delete=models.CASCADE,
        related_name='customers',
        null=True,
        blank=True
    )
    
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    validation_status = models.CharField(
        max_length=15, 
        choices=ValidationStatus.choices, 
        default=ValidationStatus.PENDING
    )
    
    # Keep customer history
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'customers'
        unique_together = [['company', 'phone']]
        indexes = [
            models.Index(fields=['company', 'validation_status']),
            models.Index(fields=['phone']),
        ]

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class ServiceRequest(models.Model):
    """
    Service requests from customers, converted to work orders by admin.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        VALIDATED = 'VALIDATED', 'Validated'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'usuarios.Company',
        on_delete=models.CASCADE,
        related_name='service_requests',
        null=True,
        blank=True
    )
    
    # Customer info (may not be registered user)
    customer_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField()
    
    # Service details
    description = models.TextField(blank=True)
    service_type = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    otp_validated = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'service_requests'
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['-created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Request #{self.pk} - {self.customer_name}"


class Blacklist(models.Model):
    """
    Block fraudulent or problematic customers.
    Stores blacklisted phone numbers for fraud prevention.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'usuarios.Company',
        on_delete=models.CASCADE,
        related_name='blacklisted_numbers',
        null=True,
        blank=True
    )
    phone = models.CharField(max_length=20)
    reason = models.TextField()
    blocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blacklist'
        unique_together = [['company', 'phone']]
        indexes = [
            models.Index(fields=['company', 'phone']),
        ]

    def __str__(self):
        return f"{self.phone} - {self.reason[:50]}"

