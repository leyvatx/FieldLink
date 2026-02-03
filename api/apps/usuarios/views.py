from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Usuario, PlanSuscripcion, PlanUsuario
from .serializers import (
    UsuarioSerializer, UsuarioCreateSerializer,
    PlanSuscripcionSerializer, PlanUsuarioSerializer
)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer

    @action(detail=False, methods=['get'])
    def tecnicos(self, request):
        """Lista solo técnicos"""
        tecnicos = Usuario.objects.filter(rol='TECNICO', is_active=True)
        serializer = UsuarioSerializer(tecnicos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def admins(self, request):
        """Lista solo administradores"""
        admins = Usuario.objects.filter(rol='ADMIN', is_active=True)
        serializer = UsuarioSerializer(admins, many=True)
        return Response(serializer.data)


class PlanSuscripcionViewSet(viewsets.ModelViewSet):
    queryset = PlanSuscripcion.objects.all()
    serializer_class = PlanSuscripcionSerializer


class PlanUsuarioViewSet(viewsets.ModelViewSet):
    queryset = PlanUsuario.objects.select_related('usuario', 'plan').all()
    serializer_class = PlanUsuarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        usuario_id = self.request.query_params.get('usuario')
        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)
        return queryset
