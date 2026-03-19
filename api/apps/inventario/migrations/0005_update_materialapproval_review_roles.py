from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0004_alter_materialapproval_reviewed_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='materialapproval',
            name='reviewed_by',
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={'role__in': ['COMPANY', 'SUPERVISOR']},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='material_approvals',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
