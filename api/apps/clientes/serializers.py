from rest_framework import serializers
from .models import Cliente, SolicitudServicio, ListaNegra


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'
        read_only_fields = ['id', 'fecha_registro']


class SolicitudServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitudServicio
        fields = '__all__'
        read_only_fields = ['id', 'fecha_solicitud', 'otp_validado']


class ListaNegraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListaNegra
        fields = '__all__'
        read_only_fields = ['id', 'fecha_bloqueo']
