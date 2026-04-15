from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import MaterialApproval, UsedMaterial


def _refresh_work_order_pricing(work_order):
    if work_order is None:
        return

    work_order.refresh_pricing(save=True)


@receiver(post_save, sender=UsedMaterial)
def refresh_pricing_after_used_material_save(sender, instance, **kwargs):
    _refresh_work_order_pricing(instance.work_order)


@receiver(post_delete, sender=UsedMaterial)
def refresh_pricing_after_used_material_delete(sender, instance, **kwargs):
    _refresh_work_order_pricing(instance.work_order)


@receiver(post_save, sender=MaterialApproval)
def refresh_pricing_after_approval_save(sender, instance, **kwargs):
    _refresh_work_order_pricing(instance.work_order)


@receiver(post_delete, sender=MaterialApproval)
def refresh_pricing_after_approval_delete(sender, instance, **kwargs):
    _refresh_work_order_pricing(instance.work_order)
