import urllib.request
import json

API_BASE = 'http://127.0.0.1:8000/api/voluntarios'
API_SIMPLE = 'http://127.0.0.1:8000/api/voluntarios/ciclos-cuotas-simple'

def hacer_request(url, method='GET', data=None):
    """Helper para hacer requests"""
    try:
        if data:
            json_data = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(
                url,
                data=json_data,
                headers={'Content-Type': 'application/json'},
                method=method
            )
        else:
            req = urllib.request.Request(url, method=method)
        
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_body = response.read().decode('utf-8')
            return status_code, json.loads(response_body) if response_body else {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return e.code, json.loads(error_body) if error_body else {}

print("=" * 60)
print("PRUEBAS DEL SISTEMA DE CICLOS DE CUOTAS")
print("=" * 60)

# Test 1: Crear ciclo 2024
print("\n[TEST 1] Crear ciclo 2024...")
status, response = hacer_request(
    f'{API_SIMPLE}/',
    'POST',
    {
        'anio': 2024,
        'fecha_inicio': '2024-01-01',
        'fecha_fin': '2024-12-31',
        'activo': True,
        'precio_cuota_regular': 5000,
        'precio_cuota_estudiante': 3000,
        'observaciones': 'Ciclo de cuotas 2024'
    }
)
print(f"Status: {status}")
if status == 201:
    print("EXITO - Ciclo 2024 creado")
    ciclo_2024_id = response['id']
    print(f"ID: {ciclo_2024_id}")
else:
    print(f"ERROR: {response}")
    ciclo_2024_id = None

# Test 2: Crear ciclo 2025
print("\n[TEST 2] Crear ciclo 2025...")
status, response = hacer_request(
    f'{API_SIMPLE}/',
    'POST',
    {
        'anio': 2025,
        'fecha_inicio': '2025-01-01',
        'fecha_fin': '2025-12-31',
        'activo': False,
        'precio_cuota_regular': 5500,
        'precio_cuota_estudiante': 3500,
        'observaciones': 'Ciclo de cuotas 2025'
    }
)
print(f"Status: {status}")
if status == 201:
    print("EXITO - Ciclo 2025 creado")
    ciclo_2025_id = response['id']
    print(f"ID: {ciclo_2025_id}")
else:
    print(f"ERROR: {response}")
    ciclo_2025_id = None

# Test 3: Listar ciclos
print("\n[TEST 3] Listar todos los ciclos...")
status, response = hacer_request(f'{API_SIMPLE}/')
print(f"Status: {status}")
if status == 200:
    print(f"EXITO - {len(response.get('results', response)) if isinstance(response, dict) and 'results' in response else len(response)} ciclos encontrados")
    if isinstance(response, list):
        for ciclo in response:
            print(f"  - Ciclo {ciclo['anio']}: {'Activo' if ciclo['activo'] else 'Inactivo'}, {'Cerrado' if ciclo['cerrado'] else 'Abierto'}")
else:
    print(f"ERROR: {response}")

# Test 4: Obtener estadísticas del ciclo 2024
if ciclo_2024_id:
    print(f"\n[TEST 4] Obtener estadísticas del ciclo 2024...")
    status, response = hacer_request(f'{API_SIMPLE}/{ciclo_2024_id}/estadisticas/')
    print(f"Status: {status}")
    if status == 200:
        print("EXITO - Estadisticas:")
        print(f"  Total pagos: {response['total_pagos']}")
        print(f"  Total recaudado: ${response['total_recaudado']}")
        print(f"  Voluntarios que pagaron: {response['voluntarios_que_pagaron']}")
        print(f"  Voluntarios activos: {response['voluntarios_activos']}")
        print(f"  % Cumplimiento: {response['porcentaje_cumplimiento']}%")
    else:
        print(f"ERROR: {response}")

# Test 5: Activar ciclo 2025
if ciclo_2025_id:
    print(f"\n[TEST 5] Activar ciclo 2025...")
    status, response = hacer_request(
        f'{API_SIMPLE}/{ciclo_2025_id}/activar/',
        'POST'
    )
    print(f"Status: {status}")
    if status == 200:
        print("EXITO - Ciclo 2025 activado")
        print(f"  Activo: {response['activo']}")
    else:
        print(f"ERROR: {response}")

# Test 6: Verificar que 2024 se desactivó
if ciclo_2024_id:
    print(f"\n[TEST 6] Verificar que ciclo 2024 se desactivó...")
    status, response = hacer_request(f'{API_SIMPLE}/?anio=2024')
    print(f"Status: {status}")
    if status == 200:
        ciclo_2024 = response[0] if response else None
        if ciclo_2024 and not ciclo_2024['activo']:
            print("EXITO - Ciclo 2024 está inactivo (correcto)")
        else:
            print("ERROR - Ciclo 2024 sigue activo (debería estar inactivo)")
    else:
        print(f"ERROR: {response}")

# Test 7: Cerrar ciclo 2024
if ciclo_2024_id:
    print(f"\n[TEST 7] Cerrar ciclo 2024...")
    status, response = hacer_request(
        f'{API_SIMPLE}/{ciclo_2024_id}/cerrar/',
        'POST'
    )
    print(f"Status: {status}")
    if status == 200:
        print("EXITO - Ciclo 2024 cerrado")
        print(f"  Cerrado: {response['cerrado']}")
        print(f"  Fecha cierre: {response.get('fecha_cierre', 'N/A')}")
    else:
        print(f"ERROR: {response}")

# Test 8: Intentar cerrar de nuevo (debería fallar)
if ciclo_2024_id:
    print(f"\n[TEST 8] Intentar cerrar ciclo 2024 de nuevo (debe fallar)...")
    status, response = hacer_request(
        f'{API_SIMPLE}/{ciclo_2024_id}/cerrar/',
        'POST'
    )
    print(f"Status: {status}")
    if status == 400:
        print("EXITO - Error esperado: " + response.get('error', ''))
    else:
        print(f"ERROR - Deberia haber fallado pero status: {status}")

# Test 9: Reabrir ciclo 2024
if ciclo_2024_id:
    print(f"\n[TEST 9] Reabrir ciclo 2024...")
    status, response = hacer_request(
        f'{API_SIMPLE}/{ciclo_2024_id}/reabrir/',
        'POST'
    )
    print(f"Status: {status}")
    if status == 200:
        print("EXITO - Ciclo 2024 reabierto")
        print(f"  Cerrado: {response['cerrado']}")
    else:
        print(f"ERROR: {response}")

# Test 10: Filtrar solo ciclos activos
print(f"\n[TEST 10] Filtrar solo ciclos activos...")
status, response = hacer_request(f'{API_SIMPLE}/?activo=true')
print(f"Status: {status}")
if status == 200:
    print(f"EXITO - {len(response)} ciclo(s) activo(s)")
    for ciclo in response:
        print(f"  - Ciclo {ciclo['anio']}")
else:
    print(f"ERROR: {response}")

print("\n" + "=" * 60)
print("PRUEBAS COMPLETADAS")
print("=" * 60)
