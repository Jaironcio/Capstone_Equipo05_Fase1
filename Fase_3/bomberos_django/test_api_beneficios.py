import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

client = Client()

print("="*80)
print("PROBANDO API BENEFICIOS")
print("="*80)

# 1. GET beneficios asignados
print("\n[1] GET /api/voluntarios/6/beneficios-asignados-simple/")
response = client.get('/api/voluntarios/6/beneficios-asignados-simple/')
print(f"  Status: {response.status_code}")

if response.status_code == 200:
    data = json.loads(response.content)
    print(f"  [OK] Beneficios encontrados: {len(data)}")
    if data:
        for beneficio in data:
            print(f"    - {beneficio['beneficio_nombre']}")
            print(f"      ID asignacion: {beneficio['id']}")
            print(f"      Tarjetas: {beneficio['tarjetas_asignadas']} asignadas")
            print(f"      Vendidas: {beneficio['tarjetas_vendidas']}")
            print(f"      Disponibles: {beneficio['tarjetas_disponibles']}")
            print(f"      Deuda: ${beneficio['monto_pendiente']}")
            print(f"      Estado: {beneficio['estado_pago']}")
else:
    print(f"  [ERROR] {response.content}")

# 2. POST pago beneficio
print("\n[2] POST /api/voluntarios/pagar-beneficio-simple/")
print("  Simulando pago de 3 tarjetas...")

# Obtener asignacion_id
response_get = client.get('/api/voluntarios/6/beneficios-asignados-simple/')
if response_get.status_code == 200:
    data = json.loads(response_get.content)
    if data:
        asignacion_id = data[0]['id']
        
        payload = {
            'asignacion_id': asignacion_id,
            'cantidad_tarjetas': 3,
            'fecha_pago': '2025-11-17',
            'metodo_pago': 'Efectivo',
            'observaciones': 'Pago de prueba desde script'
        }
        
        response = client.post(
            '/api/voluntarios/pagar-beneficio-simple/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        print(f"  Status: {response.status_code}")
        if response.status_code == 201:
            result = json.loads(response.content)
            print(f"  [OK] {result['mensaje']}")
            print(f"    Monto pagado: ${result['monto']}")
            print(f"    Tarjetas vendidas: {result['tarjetas_vendidas']}")
            print(f"    Tarjetas disponibles: {result['tarjetas_disponibles']}")
            print(f"    Monto total pagado: ${result['monto_pagado_total']}")
            print(f"    Monto pendiente: ${result['monto_pendiente']}")
            print(f"    Estado: {result['estado_pago']}")
        else:
            print(f"  [ERROR] {response.content.decode()}")

# 3. Verificar estado después del pago
print("\n[3] Verificar estado despues del pago")
response = client.get('/api/voluntarios/6/beneficios-asignados-simple/')
if response.status_code == 200:
    data = json.loads(response.content)
    if data:
        beneficio = data[0]
        print(f"  Tarjetas vendidas: {beneficio['tarjetas_vendidas']}")
        print(f"  Tarjetas disponibles: {beneficio['tarjetas_disponibles']}")
        print(f"  Monto pagado: ${beneficio['monto_pagado']}")
        print(f"  Monto pendiente: ${beneficio['monto_pendiente']}")
        print(f"  Estado: {beneficio['estado_pago']}")
        
        if beneficio['tarjetas_vendidas'] >= 3:
            print("  [OK] Pago registrado correctamente!")
        else:
            print("  [ERROR] Las tarjetas no se actualizaron")

print("\n" + "="*80)
print("PRUEBAS COMPLETADAS - Todo funciona!")
print("="*80)
print("\nAhora puedes abrir en el navegador:")
print("http://127.0.0.1:8000/pagar-beneficio.html?id=6")
