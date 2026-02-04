from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TechnicianLocation
from .serializers import TechnicianLocationSerializer


class TechnicianLocationViewSet(viewsets.ModelViewSet):
    queryset = TechnicianLocation.objects.select_related('technician').all()
    serializer_class = TechnicianLocationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        technician = self.request.query_params.get('technician')
        if technician:
            queryset = queryset.filter(technician_id=technician)
        return queryset

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Gets the latest location of a technician"""
        technician = request.query_params.get('technician')
        if not technician:
            return Response({'error': 'Missing technician parameter'}, status=400)
        location = TechnicianLocation.objects.filter(technician_id=technician).first()
        if location:
            serializer = self.get_serializer(location)
            return Response(serializer.data)
        return Response({'message': 'No locations found'}, status=404)
