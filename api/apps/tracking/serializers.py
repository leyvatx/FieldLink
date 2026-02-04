from rest_framework import serializers
from .models import TechnicianLocation


class TechnicianLocationSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)

    class Meta:
        model = TechnicianLocation
        fields = ['id', 'technician', 'technician_name', 'latitude', 'longitude', 'timestamp']
        read_only_fields = ['id', 'timestamp']
