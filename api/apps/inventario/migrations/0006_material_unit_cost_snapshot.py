import decimal

from django.db import migrations, models


def backfill_used_material_unit_cost(apps, schema_editor):
    Material = apps.get_model('inventario', 'Material')
    UsedMaterial = apps.get_model('inventario', 'UsedMaterial')

    material_costs = {
        material.id: material.unit_cost
        for material in Material.objects.all().only('id', 'unit_cost')
    }

    for used_material in UsedMaterial.objects.all().only('id', 'material_id'):
        UsedMaterial.objects.filter(pk=used_material.pk).update(
            unit_cost_snapshot=material_costs.get(used_material.material_id, decimal.Decimal('0.00'))
        )


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0005_update_materialapproval_review_roles'),
    ]

    operations = [
        migrations.AddField(
            model_name='material',
            name='unit_cost',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10),
        ),
        migrations.AddField(
            model_name='usedmaterial',
            name='unit_cost_snapshot',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10),
        ),
        migrations.RunPython(backfill_used_material_unit_cost, migrations.RunPython.noop),
    ]
