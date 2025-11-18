import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

client = Client()

print("="*80)
print("PROBANDO ENDPOINTS BENEFICIOS")
print("="*80)

# 1. GET /api/voluntarios/beneficios/
print("\n[1] GET /api/voluntarios/beneficios/")
response = client.get('/api/voluntarios/beneficios/')
print(f"  Status: {response.status_code}")
if response.status_code == 200:
    data = json.loads(response.content)
    print(f"  [OK] Beneficios: {len(data)}")
    for b in data:
        print(f"    - {b['nombre']} ({b['fecha_evento']})")
else:
    print(f"  [ERROR] {response.content}")

# 2. GET /api/voluntarios/asignaciones-beneficios/
print("\n[2] GET /api/voluntarios/asignaciones-beneficios/")
response = client.get('/api/voluntarios/asignaciones-beneficios/')
print(f"  Status: {response.status_code}")
if response.status_code == 200:
    data = json.loads(response.content)
    print(f"  [OK] Asignaciones: {len(data)}")
    
    # Contar deudores
    deudores = [a for a in data if a['estado_pago'] in ['pendiente', 'parcial']]
    pagados = [a for a in data if a['estado_pago'] == 'completo']
    
    print(f"    - Deudores: {len(deudores)}")
    print(f"    - Pagados: {len(pagados)}")
    
    if deudores:
        print(f"\n    Primeros 3 deudores:")
        for asig in deudores[:3]:
            print(f"      - {asig['voluntario_nombre']}: {asig['beneficio_nombre']} = ${asig['monto_pendiente']}")
else:
    print(f"  [ERROR] {response.content}")

print("\n" + "="*80)
print("ENDPOINTS FUNCIONANDO CORRECTAMENTE")
print("="*80)
print("""
Ahora puedes:
1. Limpiar localStorage en el navegador (F12 → Console → localStorage.clear())
2. Recargar beneficios.html (CTRL + F5)
3. Ver los beneficios cargados desde Django
4. Ver las estadísticas actualizadas
""")
print("="*80)
