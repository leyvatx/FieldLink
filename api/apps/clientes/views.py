from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cliente, SolicitudServicio, ListaNegra
from .serializers import ClienteSerializer, SolicitudServicioSerializer, ListaNegraSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado_validacion=estado)
        return queryset


class SolicitudServicioViewSet(viewsets.ModelViewSet):
    queryset = SolicitudServicio.objects.all()
    serializer_class = SolicitudServicioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset

    @action(detail=True, methods=['post'])
    def validar_otp(self, request, pk=None):
        """Simula validación OTP"""
        solicitud = self.get_object()
        solicitud.otp_validado = True
        solicitud.save()
        return Response({'mensaje': 'OTP validado correctamente'})

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprueba la solicitud"""
        solicitud = self.get_object()
        solicitud.estado = 'VALIDADA'
        solicitud.save()
        return Response({'mensaje': 'Solicitud aprobada'})

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechaza la solicitud"""
        solicitud = self.get_object()
        solicitud.estado = 'RECHAZADA'
        solicitud.save()
        return Response({'mensaje': 'Solicitud rechazada'})


class ListaNegraViewSet(viewsets.ModelViewSet):
    queryset = ListaNegra.objects.all()
    serializer_class = ListaNegraSerializer

    @action(detail=False, methods=['get'])
    def verificar(self, request):
        """Verifica si un teléfono está en lista negra"""
        telefono = request.query_params.get('telefono')
        if not telefono:
            return Response({'error': 'Falta parámetro telefono'}, status=400)
        existe = ListaNegra.objects.filter(telefono=telefono).exists()
        return Response({'bloqueado': existe})
