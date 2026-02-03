# FieldLink API - Backend

API REST para el sistema de gestión de servicios de campo (FSM).

## Requisitos

- Python 3.10+
- PostgreSQL 14+

## Instalación

1. Crear entorno virtual:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar base de datos PostgreSQL:
```sql
CREATE DATABASE fieldlink;
```

4. Variables de entorno (opcional):
```bash
set DB_NAME=fieldlink
set DB_USER=postgres
set DB_PASSWORD=tu_password
set DB_HOST=localhost
set DB_PORT=5432
```

5. Ejecutar migraciones:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Crear superusuario:
```bash
python manage.py createsuperuser
```

7. Ejecutar servidor:
```bash
python manage.py runserver
```

## Endpoints

### Documentación API
- Swagger UI: `http://localhost:8000/api/docs/`
- Schema OpenAPI: `http://localhost:8000/api/schema/`

### Usuarios
- `GET/POST /api/usuarios/` - Listar/Crear usuarios
- `GET/PUT/DELETE /api/usuarios/{id}/` - Detalle usuario
- `GET /api/usuarios/tecnicos/` - Solo técnicos
- `GET /api/usuarios/admins/` - Solo admins

### Planes
- `GET/POST /api/planes/` - Planes de suscripción
- `GET/POST /api/planes-usuario/` - Asignación de planes

### Clientes
- `GET/POST /api/clientes/` - Listar/Crear clientes
- `GET/POST /api/solicitudes/` - Solicitudes de servicio
- `POST /api/solicitudes/{id}/validar_otp/` - Validar OTP
- `POST /api/solicitudes/{id}/aprobar/` - Aprobar solicitud
- `GET/POST /api/lista-negra/` - Lista negra
- `GET /api/lista-negra/verificar/?telefono=xxx` - Verificar teléfono

### Órdenes
- `GET/POST /api/ordenes/` - Listar/Crear órdenes
- `POST /api/ordenes/{id}/asignar/` - Asignar técnico
- `POST /api/ordenes/{id}/iniciar/` - Iniciar orden
- `POST /api/ordenes/{id}/finalizar/` - Finalizar orden
- `GET/POST /api/evidencias/` - Evidencias multimedia
- `GET/POST /api/firmas/` - Firmas digitales
- `GET/POST /api/simulaciones/` - Eventos de prueba

### Inventario
- `GET/POST /api/materiales/` - Catálogo de materiales
- `GET/POST /api/inventario-tecnico/` - Stock por técnico
- `POST /api/inventario-tecnico/{id}/reabastecer/` - Reabastecer
- `GET/POST /api/materiales-usados/` - Materiales usados en órdenes

### Tracking
- `GET/POST /api/ubicaciones/` - Ubicaciones de técnicos
- `GET /api/ubicaciones/ultima/?tecnico=id` - Última ubicación

## Estructura del Proyecto

```
api/
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── usuarios/      # Usuarios, Planes
│   ├── clientes/      # Clientes, Solicitudes, Lista Negra
│   ├── ordenes/       # Órdenes, Evidencias, Firmas
│   ├── inventario/    # Materiales, Inventario
│   └── tracking/      # Ubicaciones GPS
├── manage.py
└── requirements.txt
```
