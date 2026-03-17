from rest_framework import serializers
from .models import WorkOrder, Evidence, Signature, SimulationEvent


class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = '__all__'
        read_only_fields = ['id']


class SignatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signature
        fields = '__all__'
        read_only_fields = ['id', 'signed_at']


class WorkOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    evidences = EvidenceSerializer(many=True, read_only=True)
    signature = SignatureSerializer(read_only=True)

    class Meta:
        model = WorkOrder
        fields = ['id', 'customer', 'customer_name', 'technician', 'technician_name',
                  'service_request', 'status', 'priority', 'scheduled_date',
                  'started_at', 'arrived_at', 'completed_at', 'notes', 'offline_flag',
                  'service_location_address', 'customer_latitude', 'customer_longitude',
                  'customer_phone', 'customer_email', 'tracking_token',
                  'created_at', 'evidences', 'signature']
        read_only_fields = ['id', 'created_at']


class WorkOrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    technician_name = serializers.CharField(source='technician.name', read_only=True)

    class Meta:
        model = WorkOrder
        fields = ['id', 'customer', 'customer_name', 'technician', 'technician_name',
                  'status', 'priority', 'scheduled_date', 'offline_flag',
                  'service_location_address', 'customer_latitude', 'customer_longitude',
                  'customer_phone', 'tracking_token', 'arrived_at']


class SimulationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimulationEvent
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
