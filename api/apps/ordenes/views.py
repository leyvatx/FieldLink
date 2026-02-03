from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import OrdenServicio, Evidencia, Firma, SimulacionEvento
from .serializers import (
    OrdenServicioSerializer, OrdenServicioListSerializer,
    EvidenciaSerializer, FirmaSerializer, SimulacionEventoSerializer
)


class OrdenServicioViewSet(viewsets.ModelViewSet):
    queryset = OrdenServicio.objects.select_related('cliente', 'tecnico').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return OrdenServicioListSerializer
        return OrdenServicioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado')
        tecnico = self.request.query_params.get('tecnico')
        prioridad = self.request.query_params.get('prioridad')
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if tecnico:
            queryset = queryset.filter(tecnico_id=tecnico)
        if prioridad:
            queryset = queryset.filter(prioridad=prioridad)
        return queryset

    @action(detail=True, methods=['post'])
    def asignar(self, request, pk=None):
        """Asigna un técnico a la orden"""
        orden = self.get_object()
        tecnico_id = request.data.get('tecnico_id')
        if not tecnico_id:
            return Response({'error': 'Falta tecnico_id'}, status=400)
        orden.tecnico_id = tecnico_id
        orden.estado = 'ASIGNADA'
        orden.save()
        return Response({'mensaje': 'Técnico asignado'})

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Inicia la orden"""
        orden = self.get_object()
        orden.estado = 'EN_CURSO'
        orden.fecha_inicio = timezone.now()
        orden.save()
        return Response({'mensaje': 'Orden iniciada'})

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finaliza la orden"""
        orden = self.get_object()
        orden.estado = 'FINALIZADA'
        orden.fecha_fin = timezone.now()
        orden.save()
        return Response({'mensaje': 'Orden finalizada'})

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela la orden"""
        orden = self.get_object()
        orden.estado = 'CANCELADA'
        orden.save()
        return Response({'mensaje': 'Orden cancelada'})


class EvidenciaViewSet(viewsets.ModelViewSet):
    queryset = Evidencia.objects.select_related('orden').all()
    serializer_class = EvidenciaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        orden = self.request.query_params.get('orden')
        if orden:
            queryset = queryset.filter(orden_id=orden)
        return queryset


class FirmaViewSet(viewsets.ModelViewSet):
    queryset = Firma.objects.select_related('orden').all()
    serializer_class = FirmaSerializer


class SimulacionEventoViewSet(viewsets.ModelViewSet):
    queryset = SimulacionEvento.objects.all()
    serializer_class = SimulacionEventoSerializer

    @action(detail=True, methods=['post'])
    def procesar(self, request, pk=None):
        """Marca el evento como procesado"""
        evento = self.get_object()
        evento.estado = 'PROCESADO'
        evento.save()
        return Response({'mensaje': 'Evento procesado'})
