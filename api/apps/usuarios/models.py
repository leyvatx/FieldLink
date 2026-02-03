from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'ADMIN')
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    class Rol(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        TECNICO = 'TECNICO', 'Técnico'

    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20, blank=True)
    rol = models.CharField(max_length=10, choices=Rol.choices, default=Rol.TECNICO)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.nombre} ({self.rol})"


class PlanSuscripcion(models.Model):
    nombre = models.CharField(max_length=50)
    precio_mensual = models.DecimalField(max_digits=10, decimal_places=2)
    max_incidentes = models.IntegerField(default=3)
    permite_offline = models.BooleanField(default=False)
    max_fotos = models.IntegerField(default=1)
    tracking_tiempo_real = models.BooleanField(default=False)

    class Meta:
        db_table = 'planes_suscripcion'
        verbose_name = 'Plan de Suscripción'
        verbose_name_plural = 'Planes de Suscripción'

    def __str__(self):
        return self.nombre


class PlanUsuario(models.Model):
    class EstadoPlan(models.TextChoices):
        ACTIVO = 'ACTIVO', 'Activo'
        SUSPENDIDO = 'SUSPENDIDO', 'Suspendido'
        CANCELADO = 'CANCELADO', 'Cancelado'

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='planes')
    plan = models.ForeignKey(PlanSuscripcion, on_delete=models.PROTECT, related_name='usuarios')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    estado_plan = models.CharField(max_length=15, choices=EstadoPlan.choices, default=EstadoPlan.ACTIVO)

    class Meta:
        db_table = 'planes_usuario'
        verbose_name = 'Plan de Usuario'
        verbose_name_plural = 'Planes de Usuario'

    def __str__(self):
        return f"{self.usuario.nombre} - {self.plan.nombre}"
