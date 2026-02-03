from rest_framework import serializers
from .models import UbicacionTecnico


class UbicacionTecnicoSerializer(serializers.ModelSerializer):
    tecnico_nombre = serializers.CharField(source='tecnico.nombre', read_only=True)

    class Meta:
        model = UbicacionTecnico
        fields = ['id', 'tecnico', 'tecnico_nombre', 'latitud', 'longitud', 'timestamp']
        read_only_fields = ['id', 'timestamp']
