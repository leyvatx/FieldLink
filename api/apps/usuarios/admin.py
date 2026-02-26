from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Company, CompanyConfiguration, SubscriptionPlan, CompanyPlan


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'name', 'role', 'company', 'is_active']
    list_filter = ['role', 'is_active', 'company']
    search_fields = ['email', 'name']
    ordering = ['email']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Info', {'fields': ('name', 'phone', 'role', 'company', 'mobile_id')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'name', 'password1', 'password2', 'role', 'company')}),
    )


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'subscription_plan', 'is_active']
    list_filter = ['is_active', 'subscription_plan']
    search_fields = ['name', 'slug']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CompanyConfiguration)
class CompanyConfigurationAdmin(admin.ModelAdmin):
    list_display = ['company', 'primary_color', 'enable_customer_tracking']
    list_filter = ['enable_customer_tracking', 'enable_offline_mode']
    search_fields = ['company__name']


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'monthly_price', 'max_technicians', 'allows_offline']


@admin.register(CompanyPlan)
class CompanyPlanAdmin(admin.ModelAdmin):
    list_display = ['company', 'plan', 'start_date', 'status']
    list_filter = ['status', 'plan']
