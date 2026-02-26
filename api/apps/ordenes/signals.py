"""
CRITICAL FIX #8: Django signals for WorkOrder state machine.
Validates completion requirements before marking order as FINALIZADA.
"""

from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from .models import WorkOrder


@receiver(pre_save, sender=WorkOrder)
def validate_work_order_completion(sender, instance, **kwargs):
    """
    Enforce strict validation when WorkOrder transitions to COMPLETED status.
    Prevents marking orders complete without required documentation.
    """
    # Check if this is a status transition to COMPLETED
    if instance.status == WorkOrder.Status.COMPLETED:
        try:
            # Current instance from DB
            previous_instance = WorkOrder.objects.get(pk=instance.pk)
            is_status_transition = previous_instance.status != instance.status
        except WorkOrder.DoesNotExist:
            is_status_transition = True
        
        if is_status_transition:
            # Customer signature validation
            if instance.customer_signature_required:
                if not hasattr(instance, 'signature') or instance.signature is None:
                    raise ValidationError(
                        "⚠️ SIGNATURE REQUIRED: Cannot complete work order without customer signature. "
                        "Collect signature before marking as FINALIZADA."
                    )
            
            # Evidence photos validation
            if instance.evidence_photos_required:
                evidence_count = instance.evidences.count()
                if evidence_count == 0:
                    raise ValidationError(
                        "⚠️ PHOTOS REQUIRED: Cannot complete work order without evidence photos. "
                        "Take at least 1 photo before marking as FINALIZADA."
                    )
            
            # Material usage validation
            if instance.materials_required:
                used_materials_count = instance.used_materials.count()
                if used_materials_count == 0:
                    raise ValidationError(
                        "⚠️ MATERIALS REQUIRED: This order requires material registration. "
                        "Log materials used before marking as FINALIZADA."
                    )
                
                # Check that all materials have approval pending (not in progress)
                pending_approvals = instance.material_approvals.filter(
                    status__in=['PENDING', 'ADJUSTED']
                ).exists()
                if pending_approvals:
                    raise ValidationError(
                        "⚠️ MATERIALS NOT APPROVED: Cannot complete order with pending material approvals. "
                        "Wait for admin approval of materials used."
                    )


@receiver(pre_save, sender=WorkOrder)
def auto_set_arrival_time(sender, instance, **kwargs):
    """
    Auto-record arrival time when transitioning to IN_SERVICE status.
    This marks when the technician started work.
    """
    if instance.status == WorkOrder.Status.IN_SERVICE:
        try:
            previous_instance = WorkOrder.objects.get(pk=instance.pk)
            if previous_instance.status != instance.status and not instance.arrived_at:
                from django.utils import timezone
                instance.arrived_at = timezone.now()
        except WorkOrder.DoesNotExist:
            pass


@receiver(pre_save, sender=WorkOrder)
def auto_set_completion_time(sender, instance, **kwargs):
    """
    Auto-record completion time when transitioning to COMPLETED status.
    """
    if instance.status == WorkOrder.Status.COMPLETED:
        try:
            previous_instance = WorkOrder.objects.get(pk=instance.pk)
            if previous_instance.status != instance.status and not instance.completed_at:
                from django.utils import timezone
                instance.completed_at = timezone.now()
        except WorkOrder.DoesNotExist:
            pass


# Register signals
from django.apps import AppConfig

class OrdenesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ordenes'
    
    def ready(self):
        import apps.ordenes.signals
