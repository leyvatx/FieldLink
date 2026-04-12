"""
Management command: seed_test

Creates a complete test dataset for the Flink mobile app:
  - 1 Company
  - 1 Owner  (owner@flink.test / 1234)
  - 1 Supervisor (supervisor@flink.test / 1234)
  - 3 Technicians (tecnico1-3@flink.test / 1234)
  - 3 Materials + warehouse stock + technician inventory
  - 5 Customers (with coordinates in CDMX)
  - 3 Service Requests (PENDING / VALIDATED / REJECTED)
  - 5 Work Orders (various statuses, with coordinates)
  - Used materials + approval records on finished orders
  - Technician location pings (so the map shows data)

Usage:
    python manage.py seed_test
    python manage.py seed_test --reset   # wipes the test data first
"""

import uuid
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.usuarios.models import Company, User
from apps.clientes.models import Customer, ServiceRequest
from apps.ordenes.models import WorkOrder
from apps.inventario.models import (
    Material, CentralWarehouse, TechnicianInventory,
    UsedMaterial, MaterialApproval,
)
from apps.tracking.models import TechnicianLocation


PASSWORD = '1234'

COMPANY_DATA = {
    'name':  'Flink Test Company',
    'slug':  'flink-test',
    'email': 'info@flink.test',
    'phone': '555-0100',
    'city':  'Ciudad de Mexico',
}

USERS = [
    {'email': 'owner@flink.test',      'name': 'Owner Flink',      'role': 'COMPANY'},
    {'email': 'supervisor@flink.test', 'name': 'Supervisor Flink', 'role': 'SUPERVISOR'},
    {'email': 'tecnico1@flink.test',   'name': 'Carlos Ruiz',      'role': 'TECHNICIAN'},
    {'email': 'tecnico2@flink.test',   'name': 'Ana Torres',       'role': 'TECHNICIAN'},
    {'email': 'tecnico3@flink.test',   'name': 'Luis Mendez',      'role': 'TECHNICIAN'},
]

MATERIALS = [
    {'name': 'Cable UTP Cat6',         'unit': 'metros',  'sku': 'CAB-UTP-CAT6'},
    {'name': 'Tomacorriente doble',    'unit': 'piezas',  'sku': 'TOM-DOBLE'},
    {'name': 'Cinta aislante',         'unit': 'rollos',  'sku': 'CIN-AIS'},
    {'name': 'Interruptor simple',     'unit': 'piezas',  'sku': 'INT-SIMPLE'},   # stock BAJO
    {'name': 'Caja conduit 1/2"',      'unit': 'piezas',  'sku': 'CAJ-COND'},    # SIN STOCK
]

# (lat, lon) — puntos en Tijuana, BC
CUSTOMERS = [
    {'name': 'Restaurante El Rodeo',   'phone': '6641001001', 'address': 'Blvd. Agua Caliente 4500, Tijuana',   'lat': '32.5150', 'lon': '-117.0220'},
    {'name': 'Oficinas Zona Rio',      'phone': '6641001002', 'address': 'Paseo de los Heroes 96, Zona Rio',    'lat': '32.5180', 'lon': '-117.0260'},
    {'name': 'Hotel Lucerna',          'phone': '6641001003', 'address': 'Paseo de los Heroes 10902, Tijuana',  'lat': '32.5196', 'lon': '-117.0200'},
    {'name': 'Consultorio Centro',     'phone': '6641001004', 'address': 'Av. Revolucion 900, Centro, Tijuana', 'lat': '32.5300', 'lon': '-117.0350'},
    {'name': 'Local Playas',           'phone': '6641001005', 'address': 'Av. del Pacifico 200, Playas TJ',     'lat': '32.5000', 'lon': '-117.1200'},
]

# Ubicaciones de los tecnicos en el mapa
TECH_LOCATIONS = [
    {'email': 'tecnico1@flink.test', 'lat': '32.5170', 'lon': '-117.0240'},
    {'email': 'tecnico2@flink.test', 'lat': '32.5120', 'lon': '-117.0280'},
    {'email': 'tecnico3@flink.test', 'lat': '32.5220', 'lon': '-117.0150'},
]


class Command(BaseCommand):
    help = 'Seed completo de prueba: empresa, usuarios, clientes, ordenes, materiales, aprobaciones'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina los datos de prueba antes de re-seedear',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self._reset()

        with transaction.atomic():
            company   = self._seed_company()
            users     = self._seed_users(company)
            materials = self._seed_materials(company, users)
            customers = self._seed_customers(company)
            self._seed_service_requests(company, customers)
            orders    = self._seed_work_orders(company, customers, users)
            self._seed_used_materials(orders, materials, users)
            self._seed_tech_locations(users)

        self.stdout.write(self.style.SUCCESS('\nSeed completado. Credenciales (contrasena: 1234):\n'))
        self.stdout.write('  Owner:       owner@flink.test')
        self.stdout.write('  Supervisor:  supervisor@flink.test')
        self.stdout.write('  Tecnico 1:   tecnico1@flink.test')
        self.stdout.write('  Tecnico 2:   tecnico2@flink.test')
        self.stdout.write('  Tecnico 3:   tecnico3@flink.test\n')

    # ── Company ───────────────────────────────────────────────────────────────

    def _seed_company(self):
        company, created = Company.objects.get_or_create(
            slug=COMPANY_DATA['slug'],
            defaults=COMPANY_DATA,
        )
        self._log('Empresa', company.name, created)
        return company

    # ── Users ─────────────────────────────────────────────────────────────────

    def _seed_users(self, company):
        result = {}
        for data in USERS:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={'name': data['name'], 'role': data['role'], 'company': company},
            )
            if created:
                user.set_password(PASSWORD)
                user.save(update_fields=['password'])
            self._log(data['role'], data['email'], created)
            result[data['email']] = user
        return result

    # ── Materials + stock ─────────────────────────────────────────────────────

    def _seed_materials(self, company, users):
        tecnico1 = users['tecnico1@flink.test']
        tecnico2 = users['tecnico2@flink.test']
        tecnico3 = users['tecnico3@flink.test']

        result = {}
        # warehouse_stock: [OK=200, OK=50, OK=30, BAJO=5 (min 10), SIN_STOCK=0]
        warehouse_stock    = [200, 50, 30, 5, 0]
        warehouse_min      = [10,  10, 10, 10, 10]
        tech_stock = {
            'tecnico1@flink.test': [12, 6, 2, 1, 0],
            'tecnico2@flink.test': [8,  4, 3, 0, 0],
            'tecnico3@flink.test': [5,  2, 1, 0, 0],
        }

        for i, mat_data in enumerate(MATERIALS):
            mat, created = Material.objects.get_or_create(
                sku=mat_data['sku'],
                defaults={'name': mat_data['name'], 'unit': mat_data['unit']},
            )
            self._log('Material', mat.name, created)
            result[mat_data['sku']] = mat

            # Central warehouse
            wh, wh_created = CentralWarehouse.objects.get_or_create(
                company=company,
                material=mat,
                defaults={
                    'quantity_available': warehouse_stock[i],
                    'minimum_threshold': warehouse_min[i],
                },
            )
            if wh_created:
                label = 'SIN STOCK' if warehouse_stock[i] == 0 else (
                    'BAJO' if warehouse_stock[i] < warehouse_min[i] else 'OK'
                )
                self.stdout.write(f'    Almacen: {warehouse_stock[i]} {mat.unit} [{label}]')

            # Technician inventory
            for email, tecnico in [
                ('tecnico1@flink.test', tecnico1),
                ('tecnico2@flink.test', tecnico2),
                ('tecnico3@flink.test', tecnico3),
            ]:
                qty = tech_stock[email][i]
                TechnicianInventory.objects.get_or_create(
                    technician=tecnico,
                    material=mat,
                    defaults={'current_quantity': qty},
                )

        return result

    # ── Customers ─────────────────────────────────────────────────────────────

    def _seed_customers(self, company):
        result = []
        for data in CUSTOMERS:
            cust, created = Customer.objects.get_or_create(
                company=company,
                phone=data['phone'],
                defaults={
                    'name':              data['name'],
                    'address':           data['address'],
                    'latitude':          data['lat'],
                    'longitude':         data['lon'],
                    'validation_status': 'VALIDATED',
                },
            )
            self._log('Cliente', cust.name, created)
            result.append(cust)
        return result

    # ── Service requests ──────────────────────────────────────────────────────

    def _seed_service_requests(self, company, customers):
        requests_data = [
            {'customer_name': customers[0].name, 'phone': customers[0].phone,
             'address': customers[0].address, 'status': 'PENDING',
             'service_type': 'instalacion', 'description': 'Instalar red ethernet en salon principal'},
            {'customer_name': customers[1].name, 'phone': customers[1].phone,
             'address': customers[1].address, 'status': 'VALIDATED',
             'service_type': 'mantenimiento', 'description': 'Revision periodica de instalacion electrica'},
            {'customer_name': customers[2].name, 'phone': customers[2].phone,
             'address': customers[2].address, 'status': 'REJECTED',
             'service_type': 'reparacion', 'description': 'Falla en contacto electrico'},
        ]
        for data in requests_data:
            sr, created = ServiceRequest.objects.get_or_create(
                company=company,
                phone=data['phone'],
                status=data['status'],
                defaults=data,
            )
            self._log(f'Solicitud ({data["status"]})', sr.customer_name, created)

    # ── Work orders ───────────────────────────────────────────────────────────

    def _seed_work_orders(self, company, customers, users):
        tecnico1 = users['tecnico1@flink.test']
        tecnico2 = users['tecnico2@flink.test']
        tecnico3 = users['tecnico3@flink.test']
        now = timezone.now()

        orders_data = [
            {
                'label': 'PENDING — sin asignar',
                'customer': customers[0], 'status': 'PENDING', 'priority': 'HIGH',
                'technician': None, 'notes': 'Instalar 3 puntos de red en oficina',
                'lat': customers[0].latitude, 'lon': customers[0].longitude,
                'scheduled': now + timedelta(days=1),
            },
            {
                'label': 'ASSIGNED — Carlos',
                'customer': customers[1], 'status': 'ASSIGNED', 'priority': 'MEDIUM',
                'technician': tecnico1, 'notes': 'Revision de tablero electrico',
                'lat': customers[1].latitude, 'lon': customers[1].longitude,
                'scheduled': now + timedelta(hours=3),
            },
            {
                'label': 'IN_TRANSIT — Ana',
                'customer': customers[2], 'status': 'IN_TRANSIT', 'priority': 'HIGH',
                'technician': tecnico2, 'notes': 'Reparacion urgente de corto',
                'lat': customers[2].latitude, 'lon': customers[2].longitude,
                'scheduled': now,
            },
            {
                'label': 'IN_SERVICE — Luis',
                'customer': customers[3], 'status': 'IN_SERVICE', 'priority': 'MEDIUM',
                'technician': tecnico3, 'notes': 'Instalacion de tomacorrientes',
                'lat': customers[3].latitude, 'lon': customers[3].longitude,
                'scheduled': now - timedelta(hours=1),
            },
            {
                'label': 'COMPLETED — Carlos',
                'customer': customers[4], 'status': 'COMPLETED', 'priority': 'LOW',
                'technician': tecnico1, 'notes': 'Cambio de cableado completado',
                'lat': customers[4].latitude, 'lon': customers[4].longitude,
                'scheduled': now - timedelta(days=1),
            },
        ]

        result = {}
        for data in orders_data:
            token = uuid.uuid4().hex[:32]
            customer = data['customer']
            order, created = WorkOrder.objects.get_or_create(
                company=company,
                customer=customer,
                status=data['status'],
                defaults={
                    'tracking_token':              token,
                    'technician':                 data['technician'],
                    'priority':                   data['priority'],
                    'notes':                      data['notes'],
                    'customer_name':              customer.name,
                    'customer_phone':             customer.phone,
                    'service_location_address':   customer.address,
                    'customer_latitude':          data['lat'],
                    'customer_longitude':         data['lon'],
                    'scheduled_date':             data['scheduled'],
                    'customer_signature_required': False,
                    'evidence_photos_required':   False,
                },
            )
            self._log(f'Orden ({data["status"]})', data['label'], created)
            result[data['status']] = order

        return result

    # ── Used materials + approvals ────────────────────────────────────────────

    def _seed_used_materials(self, orders, materials, users):
        supervisor = users['supervisor@flink.test']
        cable = materials['CAB-UTP-CAT6']
        tomacorriente = materials['TOM-DOBLE']
        cinta = materials['CIN-AIS']

        # Orden IN_SERVICE: material usado, aprobacion pendiente
        order_service = orders.get('IN_SERVICE')
        if order_service:
            um, created = UsedMaterial.objects.get_or_create(
                work_order=order_service,
                material=tomacorriente,
                defaults={'quantity_used': 4},
            )
            if created:
                MaterialApproval.objects.get_or_create(
                    used_material=um,
                    work_order=order_service,
                    defaults={'status': 'PENDING'},
                )
                self._log('Aprobacion (PENDING)', f'4 {tomacorriente.unit} de {tomacorriente.name}', True)

        # Orden COMPLETED: dos materiales, uno aprobado y otro ajustado
        order_done = orders.get('COMPLETED')
        if order_done:
            um_cable, created = UsedMaterial.objects.get_or_create(
                work_order=order_done,
                material=cable,
                defaults={'quantity_used': 15},
            )
            if created:
                MaterialApproval.objects.get_or_create(
                    used_material=um_cable,
                    work_order=order_done,
                    defaults={
                        'status': 'APPROVED',
                        'reviewed_by': supervisor,
                        'reviewed_at': timezone.now(),
                    },
                )
                self._log('Aprobacion (APPROVED)', f'15 {cable.unit} de {cable.name}', True)

            um_cinta, created = UsedMaterial.objects.get_or_create(
                work_order=order_done,
                material=cinta,
                defaults={'quantity_used': 3},
            )
            if created:
                MaterialApproval.objects.get_or_create(
                    used_material=um_cinta,
                    work_order=order_done,
                    defaults={
                        'status': 'ADJUSTED',
                        'reviewed_by': supervisor,
                        'reviewed_at': timezone.now(),
                        'approved_quantity': 2,
                    },
                )
                self._log('Aprobacion (ADJUSTED)', f'3->2 {cinta.unit} de {cinta.name}', True)

    # ── Technician locations ──────────────────────────────────────────────────

    def _seed_tech_locations(self, users):
        for data in TECH_LOCATIONS:
            tecnico = users[data['email']]
            loc, created = TechnicianLocation.objects.get_or_create(
                technician=tecnico,
                defaults={'latitude': data['lat'], 'longitude': data['lon']},
            )
            self._log('Ubicacion', f'{tecnico.name} ({data["lat"]}, {data["lon"]})', created)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _log(self, kind, name, created):
        tag = 'Creado  ' if created else 'Existente'
        self.stdout.write(f'  [{tag}] {kind:22} {name}')

    def _reset(self):
        emails = [u['email'] for u in USERS]
        d_locs,   _ = TechnicianLocation.objects.filter(technician__email__in=emails).delete()
        d_approvals, _ = MaterialApproval.objects.filter(work_order__company__slug=COMPANY_DATA['slug']).delete()
        d_used,   _ = UsedMaterial.objects.filter(work_order__company__slug=COMPANY_DATA['slug']).delete()
        d_orders, _ = WorkOrder.objects.filter(company__slug=COMPANY_DATA['slug']).delete()
        d_sr,     _ = ServiceRequest.objects.filter(company__slug=COMPANY_DATA['slug']).delete()
        d_custs,  _ = Customer.objects.filter(company__slug=COMPANY_DATA['slug']).delete()
        d_tinv,   _ = TechnicianInventory.objects.filter(technician__email__in=emails).delete()
        d_wh,     _ = CentralWarehouse.objects.filter(company__slug=COMPANY_DATA['slug']).delete()
        d_users,  _ = User.objects.filter(email__in=emails).delete()
        d_comp,   _ = Company.objects.filter(slug=COMPANY_DATA['slug']).delete()
        self.stdout.write(self.style.WARNING(
            f'Reset: {d_comp} empresa, {d_users} usuarios, {d_custs} clientes, '
            f'{d_orders} ordenes, {d_sr} solicitudes, {d_approvals} aprobaciones eliminados.'
        ))
