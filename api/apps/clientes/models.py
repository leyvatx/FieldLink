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


class PublicLanding(models.Model):
    """
    Public landing page configuration per company.
    Shared with customers to submit service requests.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'usuarios.Company',
        on_delete=models.CASCADE,
        related_name='public_landings',
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140)

    headline = models.CharField(max_length=180, blank=True)
    subtitle = models.TextField(blank=True)
    cta_text = models.CharField(max_length=80, default='Enviar solicitud')

    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        'usuarios.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_public_landings'
    )
    updated_by = models.ForeignKey(
        'usuarios.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_public_landings'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'public_landings'
        unique_together = [['company', 'slug']]
        indexes = [
            models.Index(fields=['company', 'is_active']),
            models.Index(fields=['company', 'is_default']),
            models.Index(fields=['company', 'slug']),
        ]
        ordering = ['name']

    def __str__(self):
        return f"{self.company.name} - {self.name}"


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
    landing = models.ForeignKey(
        PublicLanding,
        on_delete=models.SET_NULL,
        related_name='service_requests',
        null=True,
        blank=True
    )
    
    # Customer info (may not be registered user)
    customer_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
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

