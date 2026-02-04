from django.db import models
from apps.usuarios.models import User


class TechnicianLocation(models.Model):
    technician = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='locations',
        limit_choices_to={'role': 'TECHNICIAN'}
    )
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'technician_locations'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.technician.name} - {self.timestamp}"
