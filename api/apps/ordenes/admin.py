from django.contrib import admin
from .models import WorkOrder, Evidence, Signature, SimulationEvent


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'technician', 'status', 'priority', 'scheduled_date']
    list_filter = ['status', 'priority']
    search_fields = ['customer__name', 'technician__name']


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ['id', 'work_order', 'captured_at', 'sync_status']
    list_filter = ['sync_status']


@admin.register(Signature)
class SignatureAdmin(admin.ModelAdmin):
    list_display = ['id', 'work_order', 'signer_name', 'signed_at']


@admin.register(SimulationEvent)
class SimulationEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'event_type', 'status', 'created_at']
    list_filter = ['event_type', 'status']
