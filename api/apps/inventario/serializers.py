from rest_framework import serializers
from .models import (
    Material, TechnicianInventory, UsedMaterial,
    CentralWarehouse, MaterialApproval, RestockHistory
)


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'description', 'unit', 'sku', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class CentralWarehouseSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    quantity_usable = serializers.SerializerMethodField(read_only=True)
    needs_restock = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = CentralWarehouse
        fields = [
            'id', 'material', 'material_name', 'material_unit',
            'quantity_available', 'quantity_reserved', 'quantity_damaged',
            'quantity_usable', 'minimum_threshold', 'reorder_quantity',
            'needs_restock', 'last_restocked_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_restocked_at']
    
    def get_quantity_usable(self, obj):
        return obj.quantity_available - obj.quantity_reserved
    
    def get_needs_restock(self, obj):
        return obj.quantity_usable < obj.minimum_threshold


class TechnicianInventorySerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)

    class Meta:
        model = TechnicianInventory
        fields = [
            'id', 'technician', 'technician_name', 'material', 'material_name',
            'material_unit', 'current_quantity', 'mobile_id', 'updated_at', 'synced_at'
        ]
        read_only_fields = ['id', 'updated_at', 'synced_at']


class UsedMaterialSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    work_order_id = serializers.CharField(source='work_order.id', read_only=True)
    approval_status = serializers.CharField(source='approval.status', read_only=True, allow_null=True)

    class Meta:
        model = UsedMaterial
        fields = [
            'id', 'work_order', 'work_order_id', 'material', 'material_name',
            'material_unit', 'quantity_used', 'approval_status', 'mobile_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MaterialApprovalSerializer(serializers.ModelSerializer):
    used_material_detail = serializers.SerializerMethodField(read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True, allow_null=True)

    class Meta:
        model = MaterialApproval
        fields = [
            'id', 'used_material', 'used_material_detail', 'work_order',
            'status', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'approved_quantity', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'reviewed_at']
    
    def get_used_material_detail(self, obj):
        return {
            'id': str(obj.used_material.id),
            'material': obj.used_material.material.name,
            'quantity_used': obj.used_material.quantity_used
        }


class RestockHistorySerializer(serializers.ModelSerializer):
    warehouse_material = serializers.CharField(source='warehouse.material.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.name', read_only=True, allow_null=True)
    related_order_id = serializers.CharField(source='related_work_order.id', read_only=True, allow_null=True)

    class Meta:
        model = RestockHistory
        fields = [
            'id', 'warehouse', 'warehouse_material', 'restock_type',
            'quantity_change', 'related_approval', 'related_work_order',
            'related_order_id', 'performed_by', 'performed_by_name',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
