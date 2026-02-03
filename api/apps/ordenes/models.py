from django.db import models
from apps.usuarios.models import Usuario
from apps.clientes.models import Cliente, SolicitudServicio


class OrdenServicio(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ASIGNADA = 'ASIGNADA', 'Asignada'
        EN_CURSO = 'EN_CURSO', 'En Curso'
        FINALIZADA = 'FINALIZADA', 'Finalizada'
        CANCELADA = 'CANCELADA', 'Cancelada'

    class Prioridad(models.TextChoices):
        BAJA = 'BAJA', 'Baja'
        MEDIA = 'MEDIA', 'Media'
        ALTA = 'ALTA', 'Alta'
        URGENTE = 'URGENTE', 'Urgente'

    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='ordenes')
    tecnico = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='ordenes_asignadas',
        limit_choices_to={'rol': 'TECNICO'}
    )
    solicitud = models.OneToOneField(
        SolicitudServicio, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='orden'
    )
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.PENDIENTE)
    prioridad = models.CharField(max_length=10, choices=Prioridad.choices, default=Prioridad.MEDIA)
    fecha_programada = models.DateTimeField(null=True, blank=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    offline_flag = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ordenes_servicio'
        verbose_name = 'Orden de Servicio'
        verbose_name_plural = 'Órdenes de Servicio'

    def __str__(self):
        return f"Orden #{self.pk} - {self.cliente.nombre}"


class Evidencia(models.Model):
    class SyncEstado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ENVIANDO = 'ENVIANDO', 'Enviando'
        SINCRONIZADA = 'SINCRONIZADA', 'Sincronizada'
        ERROR = 'ERROR', 'Error'

    orden = models.ForeignKey(OrdenServicio, on_delete=models.CASCADE, related_name='evidencias')
    archivo = models.ImageField(upload_to='evidencias/')
    latitud = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitud = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    fecha_captura = models.DateTimeField()
    sync_estado = models.CharField(
        max_length=15, 
        choices=SyncEstado.choices, 
        default=SyncEstado.SINCRONIZADA
    )

    class Meta:
        db_table = 'evidencias'
        verbose_name = 'Evidencia'
        verbose_name_plural = 'Evidencias'

    def __str__(self):
        return f"Evidencia #{self.pk} - Orden #{self.orden.pk}"


class Firma(models.Model):
    orden = models.OneToOneField(OrdenServicio, on_delete=models.CASCADE, related_name='firma')
    firma_imagen = models.ImageField(upload_to='firmas/')
    nombre_firmante = models.CharField(max_length=150)
    fecha_firma = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'firmas'
        verbose_name = 'Firma'
        verbose_name_plural = 'Firmas'

    def __str__(self):
        return f"Firma - Orden #{self.orden.pk}"


class SimulacionEvento(models.Model):
    class TipoEvento(models.TextChoices):
        INCIDENTE = 'INCIDENTE', 'Incidente'
        FALLA = 'FALLA', 'Falla'
        PRUEBA = 'PRUEBA', 'Prueba'

    class Estado(models.TextChoices):
        ACTIVO = 'ACTIVO', 'Activo'
        PROCESADO = 'PROCESADO', 'Procesado'
        CANCELADO = 'CANCELADO', 'Cancelado'

    tipo_evento = models.CharField(max_length=15, choices=TipoEvento.choices)
    descripcion = models.TextField()
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.ACTIVO)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'simulaciones_evento'
        verbose_name = 'Simulación de Evento'
        verbose_name_plural = 'Simulaciones de Evento'

    def __str__(self):
        return f"Simulación #{self.pk} - {self.tipo_evento}"
