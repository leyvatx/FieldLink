from django.db import models
from apps.usuarios.models import User
from apps.ordenes.models import WorkOrder


class Material(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'materials'

    def __str__(self):
        return self.name


class TechnicianInventory(models.Model):
    technician = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='inventory',
        limit_choices_to={'role': 'TECHNICIAN'}
    )
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='inventories')
    current_quantity = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'technician_inventory'
        unique_together = ['technician', 'material']

    def __str__(self):
        return f"{self.technician.name} - {self.material.name}: {self.current_quantity}"


class UsedMaterial(models.Model):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='used_materials')
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name='usages')
    quantity_used = models.IntegerField()

    class Meta:
        db_table = 'used_materials'

    def __str__(self):
        return f"Order #{self.work_order.pk} - {self.material.name}: {self.quantity_used}"
