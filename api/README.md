## Installation

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create PostgreSQL database:
```sql
CREATE DATABASE fieldlink;
```

4. Set environment variables:
```powershell
$env:DB_NAME="fieldlink"
$env:DB_USER="postgres"
$env:DB_PASSWORD=""
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
```

5. Run migrations:
```bash
python manage.py makemigrations usuarios clientes ordenes inventario tracking
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run server:
```bash
python manage.py runserver
```

## Endpoints

### API Documentation
- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- Admin: `http://127.0.0.1:8000/admin`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

### Users
- `GET/POST /api/users/` - List/Create users
- `GET/PUT/DELETE /api/users/{id}/` - User detail
- `GET /api/users/technicians/` - Technicians only
- `GET /api/users/admins/` - Admins only

### Plans
- `GET/POST /api/plans/` - Subscription plans
- `GET/POST /api/user-plans/` - User plan assignments

### Customers
- `GET/POST /api/customers/` - List/Create customers
- `GET/POST /api/service-requests/` - Service requests
- `POST /api/service-requests/{id}/validate_otp/` - Validate OTP
- `POST /api/service-requests/{id}/approve/` - Approve request
- `GET/POST /api/blacklist/` - Blacklist
- `GET /api/blacklist/check/?phone=xxx` - Check phone

### Work Orders
- `GET/POST /api/work-orders/` - List/Create orders
- `POST /api/work-orders/{id}/assign/` - Assign technician
- `POST /api/work-orders/{id}/start/` - Start order
- `POST /api/work-orders/{id}/complete/` - Complete order
- `GET/POST /api/evidences/` - Multimedia evidences
- `GET/POST /api/signatures/` - Digital signatures
- `GET/POST /api/simulations/` - Test events

### Inventory
- `GET/POST /api/materials/` - Materials catalog
- `GET/POST /api/technician-inventory/` - Stock per technician
- `POST /api/technician-inventory/{id}/restock/` - Restock
- `GET/POST /api/used-materials/` - Materials used in orders

### Tracking
- `GET/POST /api/locations/` - Technician locations
- `GET /api/locations/latest/?technician=id` - Latest location

## Project Structure

```
api/
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── usuarios/      # Users, Plans
│   ├── clientes/      # Customers, Requests, Blacklist
│   ├── ordenes/       # Work Orders, Evidences, Signatures
│   ├── inventario/    # Materials, Inventory
│   └── tracking/      # GPS Locations
├── manage.py
└── requirements.txt
```
