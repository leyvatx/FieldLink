from django.contrib import admin
from .models import Cliente, SolicitudServicio, ListaNegra


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'telefono', 'estado_validacion', 'fecha_registro']
    list_filter = ['estado_validacion']
    search_fields = ['nombre', 'telefono']


@admin.register(SolicitudServicio)
class SolicitudServicioAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre_cliente', 'telefono', 'estado', 'otp_validado', 'fecha_solicitud']
    list_filter = ['estado', 'otp_validado']


@admin.register(ListaNegra)
class ListaNegraAdmin(admin.ModelAdmin):
    list_display = ['telefono', 'motivo', 'fecha_bloqueo']
    search_fields = ['telefono']
