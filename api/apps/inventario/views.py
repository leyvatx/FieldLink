from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Material, InventarioTecnico, MaterialUsado
from .serializers import MaterialSerializer, InventarioTecnicoSerializer, MaterialUsadoSerializer


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        return queryset


class InventarioTecnicoViewSet(viewsets.ModelViewSet):
    queryset = InventarioTecnico.objects.select_related('tecnico', 'material').all()
    serializer_class = InventarioTecnicoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        tecnico = self.request.query_params.get('tecnico')
        if tecnico:
            queryset = queryset.filter(tecnico_id=tecnico)
        return queryset

    @action(detail=True, methods=['post'])
    def reabastecer(self, request, pk=None):
        """Reabastece inventario del técnico"""
        inventario = self.get_object()
        cantidad = request.data.get('cantidad', 0)
        inventario.cantidad_actual += int(cantidad)
        inventario.save()
        return Response({'cantidad_actual': inventario.cantidad_actual})


class MaterialUsadoViewSet(viewsets.ModelViewSet):
    queryset = MaterialUsado.objects.select_related('orden', 'material').all()
    serializer_class = MaterialUsadoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        orden = self.request.query_params.get('orden')
        if orden:
            queryset = queryset.filter(orden_id=orden)
        return queryset
