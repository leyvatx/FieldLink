from django.contrib import admin
from .models import OrdenServicio, Evidencia, Firma, SimulacionEvento


@admin.register(OrdenServicio)
class OrdenServicioAdmin(admin.ModelAdmin):
    list_display = ['id', 'cliente', 'tecnico', 'estado', 'prioridad', 'fecha_programada']
    list_filter = ['estado', 'prioridad']
    search_fields = ['cliente__nombre', 'tecnico__nombre']


@admin.register(Evidencia)
class EvidenciaAdmin(admin.ModelAdmin):
    list_display = ['id', 'orden', 'fecha_captura', 'sync_estado']
    list_filter = ['sync_estado']


@admin.register(Firma)
class FirmaAdmin(admin.ModelAdmin):
    list_display = ['id', 'orden', 'nombre_firmante', 'fecha_firma']


@admin.register(SimulacionEvento)
class SimulacionEventoAdmin(admin.ModelAdmin):
    list_display = ['id', 'tipo_evento', 'estado', 'fecha_creacion']
    list_filter = ['tipo_evento', 'estado']
