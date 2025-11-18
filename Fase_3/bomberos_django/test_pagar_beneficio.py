import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from voluntarios.models import Voluntario, AsignacionBeneficio

client = Client()

print("="*80)
print("PROBANDO BOTONES DE PAGAR BENEFICIOS")
print("="*80)

# Obtener un voluntario con beneficios asignados
voluntario = Voluntario.objects.filter(estado_bombero='activo').first()
asignacion = AsignacionBeneficio.objects.filter(
    voluntario=voluntario, 
    estado_pago='pendiente'
).first()

if not asignacion:
    print("[ERROR] No hay asignaciones pendientes para probar")
    print("Creando asignación de prueba...")
    # Ya deberían existir por el test anterior
    asignacion = AsignacionBeneficio.objects.first()

if asignacion:
    print(f"\n[ASIGNACIÓN DE PRUEBA]")
    print(f"ID: {asignacion.id}")
    print(f"Voluntario: {asignacion.voluntario.nombre_completo()}")
    print(f"Beneficio: {asignacion.beneficio.nombre}")
    print(f"Tarjetas disponibles: {asignacion.tarjetas_disponibles}")
    print(f"Estado: {asignacion.estado_pago}")
    print(f"Monto pendiente: ${asignacion.monto_pendiente}")
    
    # ========== PRUEBA 1: PAGAR BENEFICIO ==========
    print("\n" + "="*80)
    print("1. PROBANDO PAGAR BENEFICIO")
    print("="*80)
    
    if asignacion.tarjetas_disponibles > 0:
        payload_pagar = {
            'asignacion_id': asignacion.id,
            'cantidad_tarjetas': min(2, asignacion.tarjetas_disponibles),
            'fecha_pago': '2025-11-17',
            'metodo_pago': 'Efectivo',
            'observaciones': 'Pago de prueba desde script'
        }
        
        print(f"Payload: {json.dumps(payload_pagar, indent=2)}")
        
        response = client.post(
            '/api/voluntarios/pagar-beneficio-simple/',
            data=json.dumps(payload_pagar),
            content_type='application/json'
        )
        
        print(f"\nStatus: {response.status_code}")
        if response.status_code == 200:
            result = json.loads(response.content)
            print(f"[OK] {result.get('mensaje')}")
            print(f"Tarjetas vendidas: {result.get('tarjetas_vendidas')}")
            print(f"Monto pagado: ${result.get('monto_pagado')}")
            print(f"Nuevo estado: {result.get('nuevo_estado')}")
        else:
            print(f"[ERROR] {response.content.decode()}")
    else:
        print("[SKIP] No hay tarjetas disponibles")
    
    # Recargar asignación
    asignacion.refresh_from_db()
    
    # ========== PRUEBA 2: VENTA EXTRA ==========
    print("\n" + "="*80)
    print("2. PROBANDO VENTA EXTRA")
    print("="*80)
    
    payload_extra = {
        'asignacion_id': asignacion.id,
        'cantidad_tarjetas': 3,
        'fecha_pago': '2025-11-17',
        'metodo_pago': 'Efectivo',
        'observaciones': 'Venta extra de prueba'
    }
    
    print(f"Payload: {json.dumps(payload_extra, indent=2)}")
    
    response = client.post(
        '/api/voluntarios/venta-extra-simple/',
        data=json.dumps(payload_extra),
        content_type='application/json'
    )
    
    print(f"\nStatus: {response.status_code}")
    if response.status_code == 200:
        result = json.loads(response.content)
        print(f"[OK] {result.get('mensaje')}")
        print(f"Extras vendidas: {result.get('extras_vendidas')}")
        print(f"Monto: ${result.get('monto')}")
    else:
        print(f"[ERROR] {response.content.decode()}")
    
    # Recargar asignación
    asignacion.refresh_from_db()
    
    # ========== PRUEBA 3: LIBERAR TARJETAS ==========
    print("\n" + "="*80)
    print("3. PROBANDO LIBERAR TARJETAS")
    print("="*80)
    
    if asignacion.tarjetas_disponibles > 0:
        payload_liberar = {
            'asignacion_id': asignacion.id,
            'tipo': 'parcial',
            'cantidad': min(2, asignacion.tarjetas_disponibles),
            'motivo': 'Liberación de prueba desde script'
        }
        
        print(f"Payload: {json.dumps(payload_liberar, indent=2)}")
        
        response = client.post(
            '/api/voluntarios/liberar-tarjetas-simple/',
            data=json.dumps(payload_liberar),
            content_type='application/json'
        )
        
        print(f"\nStatus: {response.status_code}")
        if response.status_code == 200:
            result = json.loads(response.content)
            print(f"[OK] {result.get('mensaje')}")
            print(f"Tarjetas liberadas: {result.get('tarjetas_liberadas')}")
            print(f"Tarjetas disponibles: {result.get('tarjetas_disponibles')}")
        else:
            print(f"[ERROR] {response.content.decode()}")
    else:
        print("[SKIP] No hay tarjetas disponibles")
    
    # Estado final
    asignacion.refresh_from_db()
    print("\n" + "="*80)
    print("ESTADO FINAL DE LA ASIGNACIÓN")
    print("="*80)
    print(f"Tarjetas asignadas: {asignacion.tarjetas_asignadas}")
    print(f"Tarjetas vendidas: {asignacion.tarjetas_vendidas}")
    print(f"Tarjetas extras: {asignacion.tarjetas_extras_vendidas}")
    print(f"Tarjetas liberadas: {asignacion.tarjetas_liberadas}")
    print(f"Tarjetas disponibles: {asignacion.tarjetas_disponibles}")
    print(f"Monto pagado: ${asignacion.monto_pagado}")
    print(f"Monto pendiente: ${asignacion.monto_pendiente}")
    print(f"Estado: {asignacion.estado_pago}")

print("\n" + "="*80)
