import urllib.request
import json

print("=" * 60)
print("PRUEBA DE CORRECCIONES")
print("=" * 60)

# Test 1: Endpoint de configuración simple
print("\n[TEST 1] Probar endpoint de configuración sin autenticación...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/configuracion-cuotas-simple/')
    with urllib.request.urlopen(req) as response:
        config = json.loads(response.read().decode('utf-8'))
        print(f"  [OK] Configuración cargada:")
        print(f"    - Precio Regular: ${config['precio_regular']}")
        print(f"    - Precio Estudiante: ${config['precio_estudiante']}")
except urllib.error.HTTPError as e:
    print(f"  [ERROR] HTTP {e.code}")
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 2: Verificar que el JS maneja arrays correctamente
print("\n[TEST 2] Verificar manejo de arrays en JavaScript...")
try:
    with open('static/js/cuotas-django.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('Array.isArray(data)' in content, 'Verificación de array'),
            ('this.pagosCuotas = []' in content, 'Inicialización como array vacío'),
            ('configuracion-cuotas-simple' in content, 'Endpoint simple'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "ERROR"
            print(f"  [{status}] {desc}")
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 3: Verificar lógica de meses
print("\n[TEST 3] Verificar lógica de meses futuros...")
try:
    with open('static/js/cuotas-django.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('const mesActual = ahora.getMonth() + 1' in content, 'Obtener mes actual'),
            ('numeroMes > mesActual' in content, 'Comparación de mes'),
            ("estadoTexto = 'Futuro'" in content, 'Estado futuro'),
            ("estadoTexto = 'Pendiente'" in content, 'Estado pendiente'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "ERROR"
            print(f"  [{status}] {desc}")
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 4: Verificar versión actualizada
print("\n[TEST 4] Verificar versión v=10.0...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/cuotas-beneficios.html?id=1')
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
        
        if 'cuotas-django.js?v=10.0' in content:
            print("  [OK] Version 10.0 detectada")
        else:
            print("  [ERROR] Version antigua")
except Exception as e:
    print(f"  [ERROR] {e}")

print("\n" + "=" * 60)
print("SOLUCIONES APLICADAS")
print("=" * 60)
print("\n1. Endpoint sin autenticacion: /configuracion-cuotas-simple/")
print("2. pagosCuotas siempre es un array (nunca undefined)")
print("3. Logica de meses corregida:")
print("   - Noviembre 2024 = PENDIENTE (estamos en Nov 2024)")
print("   - Diciembre 2024 = FUTURO (aun no llega)")
print("   - Enero-Oct 2024 = PENDIENTE (ya pasaron)")
print("\n4. Version 10.0 para forzar cache")
print("\nPRESIONA Ctrl + F5 para ver los cambios")
print("=" * 60)
