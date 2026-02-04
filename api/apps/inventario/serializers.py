from rest_framework import serializers
from .models import Material, TechnicianInventory, UsedMaterial


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'
        read_only_fields = ['id']


class TechnicianInventorySerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)

    class Meta:
        model = TechnicianInventory
        fields = ['id', 'technician', 'technician_name', 'material', 'material_name',
                  'current_quantity', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class UsedMaterialSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)

    class Meta:
        model = UsedMaterial
        fields = ['id', 'work_order', 'material', 'material_name', 'quantity_used']
        read_only_fields = ['id']
