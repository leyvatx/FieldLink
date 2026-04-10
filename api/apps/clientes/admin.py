from django.contrib import admin
from .models import Customer, ServiceRequest, Blacklist, PublicLanding


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'validation_status', 'created_at']
    list_filter = ['validation_status']
    search_fields = ['name', 'phone']


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer_name', 'phone', 'landing', 'status', 'otp_validated', 'created_at']
    list_filter = ['status', 'otp_validated']


@admin.register(Blacklist)
class BlacklistAdmin(admin.ModelAdmin):
    list_display = ['phone', 'reason', 'blocked_at']
    search_fields = ['phone']


@admin.register(PublicLanding)
class PublicLandingAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'company', 'is_active', 'is_default', 'updated_at']
    list_filter = ['is_active', 'is_default']
    search_fields = ['name', 'slug', 'company__name']
