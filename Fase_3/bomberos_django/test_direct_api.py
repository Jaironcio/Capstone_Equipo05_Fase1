"""
Test directo del endpoint sin usar Django Test Client
Esto fuerza a Python a recargar los módulos
"""
import os
import sys
import django

# Limpiar caché de módulos importados
if 'voluntarios.views_tesoreria' in sys.modules:
    del sys.modules['voluntarios.views_tesoreria']
if 'config.settings' in sys.modules:
    del sys.modules['config.settings']

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

print("=" * 60)
print("TEST DIRECTO - FORZANDO RECARGA")
print("=" * 60)

# Importar después de setup
from django.conf import settings

print("\n[1] VERIFICAR CONFIGURACIÓN GLOBAL:")
print(f"   DEFAULT_PERMISSION_CLASSES: {settings.REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']}")

from voluntarios.views_tesoreria import PagoCuotaViewSet

print("\n[2] VERIFICAR VIEWSET:")
print(f"   permission_classes: {PagoCuotaViewSet.permission_classes}")
print(f"   authentication_classes: {PagoCuotaViewSet.authentication_classes}")

# Probar con el client
from django.test import Client
import json

client = Client()

print("\n[3] TEST GET:")
response = client.get('/api/voluntarios/pagos-cuotas/')
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print("   OK GET FUNCIONA!")
else:
    print(f"   ERROR: {response.content.decode()}")

print("\n[4] TEST POST:")
payload = {
    'voluntario_id': 7,
    'mes': 1,
    'anio': 2025,
    'monto': 5000,
    'fecha_pago': '2025-11-17',
    'metodo_pago': 'Efectivo',
    'observaciones': 'Test'
}

response = client.post(
    '/api/voluntarios/pagos-cuotas/',
    data=json.dumps(payload),
    content_type='application/json'
)

print(f"   Status: {response.status_code}")
if response.status_code in [200, 201]:
    print("   OK POST FUNCIONA!")
    data = json.loads(response.content)
    print(f"   Creado: ID={data.get('id')}")
else:
    print(f"   ERROR: {response.content.decode()}")

print("\n" + "=" * 60)
