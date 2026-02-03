from django.db import models
from apps.usuarios.models import Usuario
from apps.ordenes.models import OrdenServicio


class Material(models.Model):
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    unidad = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'materiales'
        verbose_name = 'Material'
        verbose_name_plural = 'Materiales'

    def __str__(self):
        return self.nombre


class InventarioTecnico(models.Model):
    tecnico = models.ForeignKey(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name='inventario',
        limit_choices_to={'rol': 'TECNICO'}
    )
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='inventarios')
    cantidad_actual = models.IntegerField(default=0)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventario_tecnico'
        verbose_name = 'Inventario de Técnico'
        verbose_name_plural = 'Inventarios de Técnicos'
        unique_together = ['tecnico', 'material']

    def __str__(self):
        return f"{self.tecnico.nombre} - {self.material.nombre}: {self.cantidad_actual}"


class MaterialUsado(models.Model):
    orden = models.ForeignKey(OrdenServicio, on_delete=models.CASCADE, related_name='materiales_usados')
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name='usos')
    cantidad_usada = models.IntegerField()

    class Meta:
        db_table = 'materiales_usados'
        verbose_name = 'Material Usado'
        verbose_name_plural = 'Materiales Usados'

    def __str__(self):
        return f"Orden #{self.orden.pk} - {self.material.nombre}: {self.cantidad_usada}"
