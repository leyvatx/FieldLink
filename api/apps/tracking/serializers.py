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
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('latitude') is not None:
            data['latitude'] = float(data['latitude'])
        if data.get('longitude') is not None:
            data['longitude'] = float(data['longitude'])
        return data


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
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('expected_latitude') is not None:
            data['expected_latitude'] = float(data['expected_latitude'])
        if data.get('expected_longitude') is not None:
            data['expected_longitude'] = float(data['expected_longitude'])
        return data