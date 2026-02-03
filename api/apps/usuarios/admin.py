from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, PlanSuscripcion, PlanUsuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ['email', 'nombre', 'rol', 'is_active']
    list_filter = ['rol', 'is_active']
    search_fields = ['email', 'nombre']
    ordering = ['email']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Info', {'fields': ('nombre', 'telefono', 'rol')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'nombre', 'password1', 'password2', 'rol')}),
    )


@admin.register(PlanSuscripcion)
class PlanSuscripcionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'precio_mensual', 'max_incidentes', 'permite_offline']


@admin.register(PlanUsuario)
class PlanUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'plan', 'fecha_inicio', 'estado_plan']
    list_filter = ['estado_plan', 'plan']
