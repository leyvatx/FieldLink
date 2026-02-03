from rest_framework import serializers
from .models import Material, InventarioTecnico, MaterialUsado


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'
        read_only_fields = ['id']


class InventarioTecnicoSerializer(serializers.ModelSerializer):
    tecnico_nombre = serializers.CharField(source='tecnico.nombre', read_only=True)
    material_nombre = serializers.CharField(source='material.nombre', read_only=True)

    class Meta:
        model = InventarioTecnico
        fields = ['id', 'tecnico', 'tecnico_nombre', 'material', 'material_nombre',
                  'cantidad_actual', 'fecha_actualizacion']
        read_only_fields = ['id', 'fecha_actualizacion']


class MaterialUsadoSerializer(serializers.ModelSerializer):
    material_nombre = serializers.CharField(source='material.nombre', read_only=True)

    class Meta:
        model = MaterialUsado
        fields = ['id', 'orden', 'material', 'material_nombre', 'cantidad_usada']
        read_only_fields = ['id']
