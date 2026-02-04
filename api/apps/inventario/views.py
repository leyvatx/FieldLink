from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Material, TechnicianInventory, UsedMaterial
from .serializers import MaterialSerializer, TechnicianInventorySerializer, UsedMaterialSerializer


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class TechnicianInventoryViewSet(viewsets.ModelViewSet):
    queryset = TechnicianInventory.objects.select_related('technician', 'material').all()
    serializer_class = TechnicianInventorySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        technician = self.request.query_params.get('technician')
        if technician:
            queryset = queryset.filter(technician_id=technician)
        return queryset

    @action(detail=True, methods=['post'])
    def restock(self, request, pk=None):
        """Restocks technician inventory"""
        inventory = self.get_object()
        quantity = request.data.get('quantity', 0)
        inventory.current_quantity += int(quantity)
        inventory.save()
        return Response({'current_quantity': inventory.current_quantity})


class UsedMaterialViewSet(viewsets.ModelViewSet):
    queryset = UsedMaterial.objects.select_related('work_order', 'material').all()
    serializer_class = UsedMaterialSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        order = self.request.query_params.get('order')
        if order:
            queryset = queryset.filter(work_order_id=order)
        return queryset
