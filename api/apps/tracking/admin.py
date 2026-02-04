from django.contrib import admin
from .models import TechnicianLocation


@admin.register(TechnicianLocation)
class TechnicianLocationAdmin(admin.ModelAdmin):
    list_display = ['technician', 'latitude', 'longitude', 'timestamp']
    list_filter = ['technician']
