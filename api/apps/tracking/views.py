from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import TechnicianLocation, LocationGeoFence
from .serializers import TechnicianLocationSerializer, LocationGeoFenceSerializer
from apps.usuarios.permissions import IsSameCompany, IsAdmin


class TechnicianLocationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Technician locations - protected.
    Admins: can see all technicians in their company
    Technicians: can only see their own locations
    """
    permission_classes = [IsAuthenticated, IsSameCompany]
    serializer_class = TechnicianLocationSerializer

    def get_queryset(self):
        """Filter by company"""
        queryset = TechnicianLocation.objects.filter(
            technician__company=self.request.user.company
        ).select_related('technician', 'work_order')
        
        # Technicians only see their own locations
        if self.request.user.role == 'TECHNICIAN':
            queryset = queryset.filter(technician=self.request.user)
        
        # Filter by technician (admin only)
        technician = self.request.query_params.get('technician')
        if technician:
            if self.request.user.role == 'TECHNICIAN' and technician != str(self.request.user.id):
                return TechnicianLocation.objects.none()
            queryset = queryset.filter(technician_id=technician)
        
        # Filter by work order
        work_order = self.request.query_params.get('work_order')
        if work_order:
            queryset = queryset.filter(work_order_id=work_order)
        
        return queryset.order_by('-timestamp')

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest location of a technician"""
        technician = request.query_params.get('technician')
        
        if not technician:
            if request.user.role == 'TECHNICIAN':
                technician = request.user.id
            else:
                return Response(
                    {'error': 'technician parameter required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            if request.user.role == 'TECHNICIAN' and str(technician) != str(request.user.id):
                return Response(
                    {'error': 'Unauthorized'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            location = TechnicianLocation.objects.filter(
                technician_id=technician,
                technician__company=request.user.company
            ).order_by('-timestamp').first()
            
            if location:
                serializer = self.get_serializer(location)
                return Response(serializer.data)
            return Response(
                {'error': 'No locations found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class LocationGeoFenceViewSet(viewsets.ModelViewSet):
    """
    Geofence validation - admin only.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = LocationGeoFenceSerializer

    def get_queryset(self):
        """Filter by company"""
        return LocationGeoFence.objects.filter(
            work_order__company=self.request.user.company
        )


# ============================================================================
# PUBLIC TRACKING ENDPOINT (NO LOGIN REQUIRED)
# ============================================================================
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers

@extend_schema(responses={200: inline_serializer('PublicTrackingResponse', fields={'id': drf_serializers.CharField(), 'status': drf_serializers.CharField(), 'status_display': drf_serializers.CharField(), 'customer_name': drf_serializers.CharField(), 'technician_name': drf_serializers.CharField()})})
@api_view(['GET'])
@permission_classes([AllowAny])
def public_tracking_view(request, tracking_token):
    """
    Public work order tracking - NO LOGIN REQUIRED.
    Customer can track order using public tracking_token.
    GET /api/tracking/public/{tracking_token}/
    Returns: current status, technician location, arrival time
    """
    from apps.ordenes.models import WorkOrder
    
    try:
        work_order = WorkOrder.objects.get(tracking_token=tracking_token)
    except WorkOrder.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Return public information only
    data = {
        'id': str(work_order.id),
        'status': work_order.status,
        'status_display': work_order.get_status_display(),
        'customer_name': work_order.customer_name or work_order.customer.name,
        'technician_name': work_order.technician.name if work_order.technician else 'Not assigned',
        'assigned_at': work_order.scheduled_date,
        'arrived_at': work_order.arrived_at,
        'completed_at': work_order.completed_at,
    }
    
    # If in transit or in service, show current location
    if work_order.status in ['IN_TRANSIT', 'IN_SERVICE']:
        latest_location = work_order.technician_locations.order_by('-timestamp').first()
        if latest_location:
            data['technician_location'] = {
                'latitude': latest_location.latitude,
                'longitude': latest_location.longitude,
                'timestamp': latest_location.timestamp,
                'accuracy_meters': latest_location.accuracy_meters,
            }
    
    return Response(data)
