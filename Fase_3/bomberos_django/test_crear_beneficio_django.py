import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from voluntarios.models import Beneficio, AsignacionBeneficio, Voluntario

client = Client()

print("="*80)
print("PROBANDO CREAR BENEFICIO CON ASIGNACIONES AUTOMATICAS")
print("="*80)

# 1. Contar voluntarios activos
voluntarios_activos = Voluntario.objects.filter(estado_bombero='activo')
print(f"\n[VOLUNTARIOS ACTIVOS] Total: {voluntarios_activos.count()}")

# 2. Crear beneficio via API
print(f"\n[CREANDO BENEFICIO via API]")
payload = {
    'nombre': 'Curanto Junio Django',
    'descripcion': 'Beneficio de prueba creado desde Django',
    'fecha_evento': '2025-06-15',
    'precio_tarjeta': 5000,
    'tarjetas_voluntarios': 8,
    'tarjetas_honorarios_cia': 5,
    'tarjetas_honorarios_cuerpo': 3,
    'tarjetas_insignes': 2
}

response = client.post(
    '/api/voluntarios/crear-beneficio-simple/',
    data=json.dumps(payload),
    content_type='application/json'
)

print(f"  Status: {response.status_code}")

if response.status_code == 201:
    result = json.loads(response.content)
    print(f"  [OK] {result['mensaje']}")
    print(f"  Beneficio ID: {result['beneficio_id']}")
    print(f"  Nombre: {result['nombre']}")
    print(f"  Asignaciones creadas: {result['asignaciones_creadas']}")
    
    # 3. Verificar en BD
    beneficio_id = result['beneficio_id']
    beneficio = Beneficio.objects.get(id=beneficio_id)
    asignaciones = AsignacionBeneficio.objects.filter(beneficio=beneficio)
    
    print(f"\n[VERIFICACION EN BD]")
    print(f"  Beneficio: {beneficio.nombre}")
    print(f"  Asignaciones totales: {asignaciones.count()}")
    print(f"  Deudores: {asignaciones.filter(estado_pago='pendiente').count()}")
    
    # Mostrar primeras 5 asignaciones
    print(f"\n  Primeras 5 asignaciones:")
    for asig in asignaciones[:5]:
        print(f"    - {asig.voluntario.nombre}: {asig.tarjetas_asignadas} tarjetas = ${asig.monto_total}")
    
    print(f"\n[OK] Beneficio creado con TODAS las asignaciones automaticas!")
    print(f"     Ahora si deberias ver {asignaciones.count()} deudores en beneficios.html")
else:
    print(f"  [ERROR] {response.content.decode()}")

print("\n" + "="*80)
print("AHORA NECESITAS:")
print("="*80)
print("""
1. Cambiar beneficios.js por beneficios-django.js
2. O modificar el formulario en beneficios.html para usar este endpoint
3. El endpoint es: POST /api/voluntarios/crear-beneficio-simple/
""")
print("="*80)
