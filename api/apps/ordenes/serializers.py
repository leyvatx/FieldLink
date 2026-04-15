from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from .models import Evidence, Signature, SimulationEvent, WorkOrder


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
    material_cost_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)
    labor_cost_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)
    transport_cost_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)
    repair_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)

    def validate(self, attrs):
        customer = attrs.get('customer') or getattr(self.instance, 'customer', None)
        address = attrs.get('service_location_address')
        request = self.context.get('request')
        company = getattr(getattr(request, 'user', None), 'company', None) or getattr(self.instance, 'company', None)
        labor_tier = attrs.get('labor_tier', getattr(self.instance, 'labor_tier', ''))
        transport_tier = attrs.get('transport_tier', getattr(self.instance, 'transport_tier', ''))
        creating = self.instance is None
        pricing_fields_updated = any(field in attrs for field in ['labor_tier', 'transport_tier'])

        if address is None and self.instance is not None:
            address = self.instance.service_location_address

        normalized_address = (address or '').strip()
        if not normalized_address:
            raise serializers.ValidationError({
                'service_location_address': 'La ubicacion del servicio es obligatoria.'
            })

        if creating and not labor_tier:
            raise serializers.ValidationError({
                'labor_tier': 'Selecciona el nivel de mano de obra.'
            })

        if creating and not transport_tier:
            raise serializers.ValidationError({
                'transport_tier': 'Selecciona el nivel de transporte.'
            })

        if creating or pricing_fields_updated:
            configuration = None
            if company:
                try:
                    configuration = company.configuration
                except ObjectDoesNotExist:
                    configuration = None
            if not configuration or not configuration.repair_pricing_ready:
                raise serializers.ValidationError({
                    'error': 'Debes configurar tus tarifas antes de continuar'
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

    def create(self, validated_data):
        instance = super().create(validated_data)
        instance.refresh_pricing(save=True)
        return instance

    def update(self, instance, validated_data):
        pricing_fields_updated = any(field in validated_data for field in ['labor_tier', 'transport_tier'])
        instance = super().update(instance, validated_data)

        if pricing_fields_updated:
            instance.refresh_pricing(save=True)

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('customer_latitude') is not None:
            data['customer_latitude'] = float(data['customer_latitude'])
        if data.get('customer_longitude') is not None:
            data['customer_longitude'] = float(data['customer_longitude'])
        return data

    class Meta:
        model = WorkOrder
        fields = [
            'id', 'customer', 'customer_name', 'technician', 'technician_name',
            'service_request', 'status', 'priority', 'scheduled_date',
            'started_at', 'arrived_at', 'completed_at', 'notes', 'offline_flag',
            'labor_tier', 'transport_tier',
            'material_cost_total', 'labor_cost_total', 'transport_cost_total', 'repair_total',
            'service_location_address', 'customer_latitude', 'customer_longitude',
            'customer_phone', 'customer_email', 'tracking_token',
            'created_at', 'evidences', 'signature'
        ]
        read_only_fields = ['id', 'created_at', 'tracking_token']


class WorkOrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    material_cost_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)
    labor_cost_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)
    transport_cost_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)
    repair_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)

    class Meta:
        model = WorkOrder
        fields = [
            'id', 'customer', 'customer_name', 'technician', 'technician_name',
            'status', 'priority', 'scheduled_date', 'offline_flag',
            'labor_tier', 'transport_tier',
            'material_cost_total', 'labor_cost_total', 'transport_cost_total', 'repair_total',
            'service_location_address', 'customer_latitude', 'customer_longitude',
            'customer_phone', 'tracking_token', 'arrived_at'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('customer_latitude') is not None:
            data['customer_latitude'] = float(data['customer_latitude'])
        if data.get('customer_longitude') is not None:
            data['customer_longitude'] = float(data['customer_longitude'])
        return data


class SimulationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimulationEvent
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
