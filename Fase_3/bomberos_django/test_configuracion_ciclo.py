import urllib.request
import json

print("=" * 60)
print("PRUEBA: CONFIGURACION -> CICLO")
print("=" * 60)

# Test 1: Configurar precios
print("\n[TEST 1] Configurar precios (6000 / 4000)...")
try:
    data = {
        'precio_regular': 6000,
        'precio_estudiante': 4000
    }
    
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/voluntarios/configuracion-cuotas-simple/',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print(f"  [OK] Configuración guardada:")
        print(f"    - Precio Regular: ${result['precio_regular']}")
        print(f"    - Precio Estudiante: ${result['precio_estudiante']}")
        print(f"    - Ciclo actualizado: {result.get('ciclo_actualizado', False)}")
        
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 2: Verificar ciclo activo
print("\n[TEST 2] Verificar ciclo activo...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/ciclos-cuotas-simple/?activo=true')
    with urllib.request.urlopen(req) as response:
        ciclos = json.loads(response.read().decode('utf-8'))
        
        if ciclos:
            ciclo = ciclos[0]
            print(f"  [OK] Ciclo activo encontrado:")
            print(f"    - Año: {ciclo['anio']}")
            print(f"    - Precio Regular: ${ciclo['precio_cuota_regular']}")
            print(f"    - Precio Estudiante: ${ciclo['precio_cuota_estudiante']}")
            
            # Verificar si los precios coinciden
            if ciclo['precio_cuota_regular'] == 6000 and ciclo['precio_cuota_estudiante'] == 4000:
                print(f"  [OK] Los precios del ciclo están actualizados!")
            else:
                print(f"  [ERROR] Los precios del ciclo NO coinciden con la configuración")
        else:
            print(f"  [INFO] No hay ciclo activo")
            
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 3: Crear nuevo ciclo
print("\n[TEST 3] Crear nuevo ciclo 2026...")
try:
    data = {
        'anio': 2026,
        'fecha_inicio': '2026-01-01',
        'fecha_fin': '2026-12-31',
        'observaciones': 'Ciclo de prueba 2026',
        'activo': False
        # NO especificamos precios, deberían tomarse de la configuración
    }
    
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/voluntarios/ciclos-cuotas-simple/',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req) as response:
        ciclo = json.loads(response.read().decode('utf-8'))
        print(f"  [OK] Ciclo 2026 creado:")
        print(f"    - Precio Regular: ${ciclo['precio_cuota_regular']}")
        print(f"    - Precio Estudiante: ${ciclo['precio_cuota_estudiante']}")
        
        if ciclo['precio_cuota_regular'] == 6000 and ciclo['precio_cuota_estudiante'] == 4000:
            print(f"  [OK] El nuevo ciclo tomó los precios de la configuración!")
        else:
            print(f"  [ERROR] El nuevo ciclo NO tomó los precios de la configuración")
        
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"  [INFO] {error_body}")  # Puede fallar si ya existe
except Exception as e:
    print(f"  [ERROR] {e}")

print("\n" + "=" * 60)
print("FLUJO COMPLETO")
print("=" * 60)
print("\n1. Configurar Cuotas → Guarda en ConfiguracionCuotas")
print("2. Configurar Cuotas → Actualiza ciclo activo automáticamente")
print("3. Crear Ciclo Nuevo → Toma precios de ConfiguracionCuotas")
print("\nREFRESCA LA PAGINA (Ctrl + F5) para ver los cambios")
print("=" * 60)
