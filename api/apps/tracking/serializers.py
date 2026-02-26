from rest_framework import serializers
from .models import TechnicianLocation, LocationGeoFence


class TechnicianLocationSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    work_order_id = serializers.CharField(source='work_order.id', read_only=True, allow_null=True)

    class Meta:
        model = TechnicianLocation
        fields = [
            'id', 'technician', 'technician_name', 'work_order_id',
            'latitude', 'longitude', 'accuracy_meters', 'timestamp',
            'mobile_id', 'sync_status', 'synced_at'
        ]
        read_only_fields = ['id', 'timestamp', 'synced_at']


class LocationGeoFenceSerializer(serializers.ModelSerializer):
    work_order_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LocationGeoFence
        fields = [
            'id', 'work_order', 'work_order_detail',
            'expected_latitude', 'expected_longitude', 'radius_meters',
            'is_validated', 'validated_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_work_order_detail(self, obj):
        return {
            'id': str(obj.work_order.id),
            'customer': obj.work_order.customer.name
        }
