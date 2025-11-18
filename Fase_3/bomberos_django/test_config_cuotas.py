import urllib.request
import json

print("=" * 60)
print("PRUEBA DE CONFIGURACION DE CUOTAS")
print("=" * 60)

# Test 1: Leer configuración actual
print("\n[TEST 1] Leer configuración actual...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/configuracion-cuotas-simple/')
    with urllib.request.urlopen(req) as response:
        config = json.loads(response.read().decode('utf-8'))
        print(f"  Precio Regular: ${config['precio_regular']}")
        print(f"  Precio Estudiante: ${config['precio_estudiante']}")
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 2: Actualizar configuración
print("\n[TEST 2] Actualizar configuración (6000 / 4000)...")
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
        print(f"  [OK] Configuración actualizada:")
        print(f"    Precio Regular: ${result['precio_regular']}")
        print(f"    Precio Estudiante: ${result['precio_estudiante']}")
        
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"  [ERROR] HTTP {e.code}: {error_body}")
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 3: Verificar que se guardó
print("\n[TEST 3] Verificar que se guardó...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/configuracion-cuotas-simple/')
    with urllib.request.urlopen(req) as response:
        config = json.loads(response.read().decode('utf-8'))
        
        if config['precio_regular'] == '6000' and config['precio_estudiante'] == '4000':
            print(f"  [OK] Configuración guardada correctamente:")
            print(f"    Precio Regular: ${config['precio_regular']}")
            print(f"    Precio Estudiante: ${config['precio_estudiante']}")
        else:
            print(f"  [ERROR] Los precios no se guardaron correctamente")
            
except Exception as e:
    print(f"  [ERROR] {e}")

print("\n" + "=" * 60)
print("PASOS PARA PROBAR EN EL NAVEGADOR")
print("=" * 60)
print("\n1. Presiona Ctrl + F5")
print("2. Ve a: Configurar Cuotas")
print("3. Cambia los precios (ejemplo: 6000 / 4000)")
print("4. Click en 'Guardar Configuracion'")
print("5. Ve a: Cuotas de un voluntario")
print("6. El select debe mostrar:")
print("   - Cuota Regular - $6.000")
print("   - Cuota Estudiante - $4.000")
print("\nLos cambios se guardan en la base de datos (no localStorage)")
print("=" * 60)
