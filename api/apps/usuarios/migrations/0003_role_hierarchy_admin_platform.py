from django.db import migrations, models


def migrate_roles_forward(apps, schema_editor):
    User = apps.get_model('usuarios', 'User')

    User.objects.filter(is_superuser=True).update(role='ADMIN', company=None)
    User.objects.filter(is_superuser=False, role='OWNER').update(role='COMPANY')
    User.objects.filter(is_superuser=False, role='DISPATCHER').update(role='SUPERVISOR')


def migrate_roles_backward(apps, schema_editor):
    User = apps.get_model('usuarios', 'User')

    User.objects.filter(role='ADMIN').update(role='OWNER')
    User.objects.filter(role='COMPANY').update(role='OWNER')
    User.objects.filter(role='SUPERVISOR').update(role='DISPATCHER')


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0002_alter_user_company_alter_user_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Admin (Platform / Dev)'),
                    ('COMPANY', 'Company (Business Admin)'),
                    ('SUPERVISOR', 'Supervisor (Operations Lead)'),
                    ('TECHNICIAN', 'Technician (Field Worker)'),
                ],
                default='TECHNICIAN',
                max_length=15,
            ),
        ),
        migrations.RunPython(migrate_roles_forward, migrate_roles_backward),
    ]
