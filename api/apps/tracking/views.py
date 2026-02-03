from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import UbicacionTecnico
from .serializers import UbicacionTecnicoSerializer


class UbicacionTecnicoViewSet(viewsets.ModelViewSet):
    queryset = UbicacionTecnico.objects.select_related('tecnico').all()
    serializer_class = UbicacionTecnicoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        tecnico = self.request.query_params.get('tecnico')
        if tecnico:
            queryset = queryset.filter(tecnico_id=tecnico)
        return queryset

    @action(detail=False, methods=['get'])
    def ultima(self, request):
        """Obtiene la última ubicación de un técnico"""
        tecnico = request.query_params.get('tecnico')
        if not tecnico:
            return Response({'error': 'Falta parámetro tecnico'}, status=400)
        ubicacion = UbicacionTecnico.objects.filter(tecnico_id=tecnico).first()
        if ubicacion:
            serializer = self.get_serializer(ubicacion)
            return Response(serializer.data)
        return Response({'mensaje': 'Sin ubicaciones registradas'}, status=404)
