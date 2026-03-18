from rest_framework import serializers
from .models import Customer, ServiceRequest, Blacklist


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class ServiceRequestSerializer(serializers.ModelSerializer):
    is_suspicious = serializers.SerializerMethodField(read_only=True)
    suspicious_reasons = serializers.SerializerMethodField(read_only=True)
    work_order_id = serializers.UUIDField(source='work_order.id', read_only=True)
    work_order_status = serializers.CharField(source='work_order.status', read_only=True)
    technician_name = serializers.CharField(source='work_order.technician.name', read_only=True)

    class Meta:
        model = ServiceRequest
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'otp_validated']

    def _get_suspicious_reasons(self, obj):
        if obj.status == ServiceRequest.Status.VALIDATED:
            return []

        reasons = []
        if not obj.otp_validated:
            reasons.append('otp_unvalidated')
        if obj.company_id and Blacklist.objects.filter(
            company_id=obj.company_id,
            phone=obj.phone
        ).exists():
            reasons.append('blacklisted_phone')
        return reasons

    def get_is_suspicious(self, obj):
        return len(self._get_suspicious_reasons(obj)) > 0

    def get_suspicious_reasons(self, obj):
        return self._get_suspicious_reasons(obj)


class BlacklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blacklist
        fields = '__all__'
        read_only_fields = ['id', 'blocked_at']
