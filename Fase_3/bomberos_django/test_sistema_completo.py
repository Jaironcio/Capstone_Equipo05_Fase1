import urllib.request
import json

print("=" * 60)
print("PRUEBA COMPLETA DEL SISTEMA DE CUOTAS")
print("=" * 60)

# Test 1: Verificar que NO hay ciclos
print("\n[TEST 1] Verificar que los ciclos fueron eliminados...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/ciclos-cuotas-simple/')
    with urllib.request.urlopen(req) as response:
        ciclos = json.loads(response.read().decode('utf-8'))
        print(f"  Ciclos encontrados: {len(ciclos)}")
        if len(ciclos) == 0:
            print("  [OK] Todos los ciclos fueron eliminados")
        else:
            print("  [INFO] Hay ciclos existentes")
            for c in ciclos:
                print(f"    - Ciclo {c['anio']}: {'ACTIVO' if c['activo'] else 'Inactivo'}")
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 2: Crear nuevo ciclo 2025
print("\n[TEST 2] Crear ciclo 2025 (01/01/2025 - 31/12/2025)...")
try:
    data = {
        'anio': 2025,
        'fecha_inicio': '2025-01-01',
        'fecha_fin': '2025-12-31',
        'precio_cuota_regular': 6000,
        'precio_cuota_estudiante': 4000,
        'observaciones': 'Ciclo de cuotas 2025',
        'activo': True
    }
    
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/voluntarios/ciclos-cuotas-simple/',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req) as response:
        ciclo = json.loads(response.read().decode('utf-8'))
        print(f"  [OK] Ciclo creado:")
        print(f"    - Año: {ciclo['anio']}")
        print(f"    - Fechas: {ciclo['fecha_inicio']} a {ciclo['fecha_fin']}")
        print(f"    - Cuota Regular: ${ciclo['precio_cuota_regular']}")
        print(f"    - Cuota Estudiante: ${ciclo['precio_cuota_estudiante']}")
        print(f"    - Estado: {'ACTIVO' if ciclo['activo'] else 'Inactivo'}")
        
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"  [ERROR] HTTP {e.code}: {error_body}")
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 3: Verificar configuración de precios
print("\n[TEST 3] Verificar configuración de precios...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/configuracion-cuotas/')
    with urllib.request.urlopen(req) as response:
        config = json.loads(response.read().decode('utf-8'))
        print(f"  [OK] Configuración cargada:")
        print(f"    - Precio Regular: ${config['precio_regular']}")
        print(f"    - Precio Estudiante: ${config['precio_estudiante']}")
        
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 4: Verificar frontend actualizado
print("\n[TEST 4] Verificar frontend con precios dinámicos...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/cuotas-beneficios.html?id=1')
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
        
        checks = [
            ('cuotas-django.js?v=9.0' in content, 'Version 9.0 del JS'),
            ('Cargando precios...' in content, 'Select sin precios hardcodeados'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "ERROR"
            print(f"  [{status}] {desc}")
            
except Exception as e:
    print(f"  [ERROR] {e}")

print("\n" + "=" * 60)
print("RESUMEN")
print("=" * 60)
print("\n✅ CAMBIOS REALIZADOS:")
print("1. Ciclos eliminados - Puedes crear uno nuevo")
print("2. Ciclos con fechas: 01/01/año a 31/12/año")
print("3. Precios dinámicos desde configuración")
print("4. Select se actualiza automáticamente")
print("\n📋 PRÓXIMOS PASOS:")
print("1. Presiona Ctrl + F5 en el navegador")
print("2. Ve a 'Configurar Cuotas' y cambia los precios")
print("3. Ve a 'Ciclos de Cuotas' y crea el ciclo 2025")
print("4. Los precios del ciclo se mostrarán en el formulario")
print("=" * 60)
