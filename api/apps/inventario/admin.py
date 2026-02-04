from django.contrib import admin
from .models import Material, TechnicianInventory, UsedMaterial


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['name', 'unit', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(TechnicianInventory)
class TechnicianInventoryAdmin(admin.ModelAdmin):
    list_display = ['technician', 'material', 'current_quantity', 'updated_at']
    list_filter = ['technician']


@admin.register(UsedMaterial)
class UsedMaterialAdmin(admin.ModelAdmin):
    list_display = ['work_order', 'material', 'quantity_used']
