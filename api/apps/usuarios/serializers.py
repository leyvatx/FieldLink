from rest_framework import serializers
from .models import Usuario, PlanSuscripcion, PlanUsuario


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre', 'telefono', 'rol', 'is_active', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre', 'telefono', 'rol', 'password']

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)


class PlanSuscripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanSuscripcion
        fields = '__all__'


class PlanUsuarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    plan_nombre = serializers.CharField(source='plan.nombre', read_only=True)

    class Meta:
        model = PlanUsuario
        fields = ['id', 'usuario', 'usuario_nombre', 'plan', 'plan_nombre', 
                  'fecha_inicio', 'fecha_fin', 'estado_plan']
