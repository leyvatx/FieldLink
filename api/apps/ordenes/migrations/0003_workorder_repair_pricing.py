import decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='workorder',
            name='labor_cost_total',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10),
        ),
        migrations.AddField(
            model_name='workorder',
            name='labor_tier',
            field=models.CharField(blank=True, choices=[('BASIC', 'Basic'), ('MEDIUM', 'Medium'), ('ADVANCED', 'Advanced')], max_length=10),
        ),
        migrations.AddField(
            model_name='workorder',
            name='material_cost_total',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10),
        ),
        migrations.AddField(
            model_name='workorder',
            name='repair_total',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10),
        ),
        migrations.AddField(
            model_name='workorder',
            name='transport_cost_total',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10),
        ),
        migrations.AddField(
            model_name='workorder',
            name='transport_tier',
            field=models.CharField(blank=True, choices=[('NEAR', 'Near'), ('MEDIUM', 'Medium'), ('FAR', 'Far')], max_length=10),
        ),
    ]
