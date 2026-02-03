from django.contrib import admin
from .models import UbicacionTecnico


@admin.register(UbicacionTecnico)
class UbicacionTecnicoAdmin(admin.ModelAdmin):
    list_display = ['tecnico', 'latitud', 'longitud', 'timestamp']
    list_filter = ['tecnico']
