from django.db import models
from apps.usuarios.models import Usuario


class UbicacionTecnico(models.Model):
    tecnico = models.ForeignKey(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name='ubicaciones',
        limit_choices_to={'rol': 'TECNICO'}
    )
    latitud = models.DecimalField(max_digits=10, decimal_places=7)
    longitud = models.DecimalField(max_digits=10, decimal_places=7)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ubicaciones_tecnico'
        verbose_name = 'Ubicación de Técnico'
        verbose_name_plural = 'Ubicaciones de Técnicos'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.tecnico.nombre} - {self.timestamp}"
