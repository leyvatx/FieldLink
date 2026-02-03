from django.contrib import admin
from .models import Material, InventarioTecnico, MaterialUsado


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'unidad', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre']


@admin.register(InventarioTecnico)
class InventarioTecnicoAdmin(admin.ModelAdmin):
    list_display = ['tecnico', 'material', 'cantidad_actual', 'fecha_actualizacion']
    list_filter = ['tecnico']


@admin.register(MaterialUsado)
class MaterialUsadoAdmin(admin.ModelAdmin):
    list_display = ['orden', 'material', 'cantidad_usada']
