from rest_framework import serializers
from .models import OrdenServicio, Evidencia, Firma, SimulacionEvento


class EvidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidencia
        fields = '__all__'
        read_only_fields = ['id']


class FirmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firma
        fields = '__all__'
        read_only_fields = ['id', 'fecha_firma']


class OrdenServicioSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    tecnico_nombre = serializers.CharField(source='tecnico.nombre', read_only=True)
    evidencias = EvidenciaSerializer(many=True, read_only=True)
    firma = FirmaSerializer(read_only=True)

    class Meta:
        model = OrdenServicio
        fields = ['id', 'cliente', 'cliente_nombre', 'tecnico', 'tecnico_nombre',
                  'solicitud', 'estado', 'prioridad', 'fecha_programada',
                  'fecha_inicio', 'fecha_fin', 'observaciones', 'offline_flag',
                  'fecha_creacion', 'evidencias', 'firma']
        read_only_fields = ['id', 'fecha_creacion']


class OrdenServicioListSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    tecnico_nombre = serializers.CharField(source='tecnico.nombre', read_only=True)

    class Meta:
        model = OrdenServicio
        fields = ['id', 'cliente', 'cliente_nombre', 'tecnico', 'tecnico_nombre',
                  'estado', 'prioridad', 'fecha_programada', 'offline_flag']


class SimulacionEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimulacionEvento
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion']
