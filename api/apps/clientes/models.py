from django.db import models


class Cliente(models.Model):
    class EstadoValidacion(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        VALIDADO = 'VALIDADO', 'Validado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'

    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    direccion = models.TextField()
    estado_validacion = models.CharField(
        max_length=15, 
        choices=EstadoValidacion.choices, 
        default=EstadoValidacion.PENDIENTE
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'clientes'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return self.nombre


class SolicitudServicio(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        VALIDADA = 'VALIDADA', 'Validada'
        RECHAZADA = 'RECHAZADA', 'Rechazada'

    nombre_cliente = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    direccion = models.TextField()
    descripcion = models.TextField(blank=True)
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.PENDIENTE)
    otp_validado = models.BooleanField(default=False)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'solicitudes_servicio'
        verbose_name = 'Solicitud de Servicio'
        verbose_name_plural = 'Solicitudes de Servicio'

    def __str__(self):
        return f"Solicitud #{self.pk} - {self.nombre_cliente}"


class ListaNegra(models.Model):
    telefono = models.CharField(max_length=20, unique=True)
    motivo = models.TextField()
    fecha_bloqueo = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lista_negra'
        verbose_name = 'Número en Lista Negra'
        verbose_name_plural = 'Lista Negra'

    def __str__(self):
        return self.telefono
