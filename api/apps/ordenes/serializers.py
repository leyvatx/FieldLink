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

    def validate(self, attrs):
        customer = attrs.get('customer') or getattr(self.instance, 'customer', None)
        address = attrs.get('service_location_address')

        if address is None:
            if self.instance is not None:
                address = self.instance.service_location_address
            elif customer is not None:
                address = customer.address

        normalized_address = (address or '').strip()
        if not normalized_address:
            raise serializers.ValidationError({
                'service_location_address': 'La ubicación del servicio es obligatoria.'
            })

        attrs['service_location_address'] = normalized_address

        if customer is not None:
            attrs.setdefault('customer_name', customer.name or '')
            attrs.setdefault('customer_phone', customer.phone or '')
            attrs.setdefault('customer_email', customer.email or '')

            customer_address = (customer.address or '').strip()
            if normalized_address == customer_address:
                attrs.setdefault('customer_latitude', customer.latitude)
                attrs.setdefault('customer_longitude', customer.longitude)
            elif 'service_location_address' in attrs:
                attrs.setdefault('customer_latitude', None)
                attrs.setdefault('customer_longitude', None)

        return attrs

    class Meta:
        model = WorkOrder
        fields = ['id', 'customer', 'customer_name', 'technician', 'technician_name',
                  'service_request', 'status', 'priority', 'scheduled_date',
                  'started_at', 'arrived_at', 'completed_at', 'notes', 'offline_flag',
                  'service_location_address', 'customer_latitude', 'customer_longitude',
                  'customer_phone', 'customer_email', 'tracking_token',
                  'created_at', 'evidences', 'signature']
        read_only_fields = ['id', 'created_at', 'tracking_token']


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
