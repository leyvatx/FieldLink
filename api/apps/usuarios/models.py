from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class Company(models.Model):
    """
    Tenant entity for SaaS multi-tenancy and data isolation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(unique=True, max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Plan reference - Company has ONE active plan
    subscription_plan = models.ForeignKey(
        'SubscriptionPlan',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='companies'
    )
    plan_start_date = models.DateField(null=True, blank=True)
    plan_end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_trial = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)  # Soft delete

    class Meta:
        db_table = 'companies'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
            models.Index(fields=['-created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} (Tenant)"


class CompanyConfiguration(models.Model):
    """
    Dynamic configuration for white-label tenant customization.
    """
    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name='configuration'
    )
    
    # Branding
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#0066CC')  # Hex color
    secondary_color = models.CharField(max_length=7, default='#FFFFFF')
    
    # Contact
    whatsapp_number = models.CharField(max_length=20, blank=True)
    support_email = models.EmailField(blank=True)
    support_phone = models.CharField(max_length=20, blank=True)
    
    # Features
    enable_customer_tracking = models.BooleanField(default=True)
    enable_offline_mode = models.BooleanField(default=False)
    enable_material_approval = models.BooleanField(default=True)
    max_offline_sync_days = models.IntegerField(default=7)
    
    # Notifications
    notify_on_completion = models.BooleanField(default=True)
    notify_on_technician_arrived = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'company_configurations'

    def __str__(self):
        return f"Config - {self.company.name}"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrator'
        TECHNICIAN = 'TECHNICIAN', 'Technician'
        MANAGER = 'MANAGER', 'Manager'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # CRITICAL: Company relationship - every user belongs to ONE company (tenant)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='users'
    )
    
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.TECHNICIAN)
    
    # Offline sync
    mobile_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Device ID for offline sync conflict resolution"
    )
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)  # Soft delete

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'company_id']

    class Meta:
        db_table = 'users'
        unique_together = [['email', 'company']]
        indexes = [
            models.Index(fields=['company', 'role']),
            models.Index(fields=['is_active']),
            models.Index(fields=['mobile_id']),
        ]

    def __str__(self):
        return f"{self.name} ({self.role}) @ {self.company.name}"



class SubscriptionPlan(models.Model):
    """
    Subscription tiers available for companies.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    annual_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Limits
    max_technicians = models.IntegerField(default=5)
    max_work_orders_per_month = models.IntegerField(default=100)
    max_photos_per_order = models.IntegerField(default=5)
    max_materials_per_order = models.IntegerField(default=20)
    
    # Features
    allows_offline = models.BooleanField(default=False)
    realtime_tracking = models.BooleanField(default=False)
    material_approval_workflow = models.BooleanField(default=False)
    api_access = models.BooleanField(default=False)
    custom_branding = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscription_plans'
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} - ${self.monthly_price}/mo"


class CompanyPlan(models.Model):
    """
    Subscription tracking at company level (not user level).
    """
    class PlanStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        CANCELLED = 'CANCELLED', 'Cancelled'
        EXPIRED = 'EXPIRED', 'Expired'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name='active_plan_record'
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='company_subscriptions')
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=PlanStatus.choices, default=PlanStatus.ACTIVE)
    
    # Payment tracking
    next_billing_date = models.DateField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'company_plans'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['company']),
        ]

    def __str__(self):
        return f"{self.company.name} - {self.plan.name}"

