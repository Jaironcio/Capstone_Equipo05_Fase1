import urllib.request

print("=" * 60)
print("VERIFICACION DE VERSIONES ACTUALIZADAS")
print("=" * 60)

# Test 1: Verificar versión de cuotas-django.js
print("\n[TEST 1] Verificar versión en cuotas-beneficios.html...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/cuotas-beneficios.html?id=1')
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
        
        if 'cuotas-django.js?v=8.0' in content:
            print("  [OK] Version 8.0 detectada - Cache forzado")
        else:
            print("  [ERROR] Version antigua")
            
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 2: Verificar versión del sidebar
print("\n[TEST 2] Verificar versión en sistema.html...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/sistema.html')
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
        
        if 'sidebar-django.js?v=13.0' in content:
            print("  [OK] Version 13.0 detectada - Cache forzado")
        else:
            print("  [ERROR] Version antigua")
            
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 3: Verificar que el JS tiene la función
print("\n[TEST 3] Verificar función en cuotas-django.js...")
try:
    with open('static/js/cuotas-django.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
        if 'function generarPDFCuotas()' in content:
            print("  [OK] Funcion generarPDFCuotas() presente")
        else:
            print("  [ERROR] Funcion no encontrada")
            
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 4: Verificar botones en sidebar
print("\n[TEST 4] Verificar botones en sidebar-django.js...")
try:
    with open('static/js/sidebar-django.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('Configurar Cuotas' in content, 'Configurar Cuotas'),
            ('Ciclos de Cuotas' in content, 'Ciclos de Cuotas'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "ERROR"
            print(f"  [{status}] {desc}")
            
except Exception as e:
    print(f"  [ERROR] {e}")

print("\n" + "=" * 60)
print("SOLUCION AL PROBLEMA")
print("=" * 60)
print("\n1. Version incrementada: cuotas-django.js?v=8.0")
print("2. Version incrementada: sidebar-django.js?v=13.0")
print("\nPASOS PARA VER LOS CAMBIOS:")
print("1. Recarga la pagina con Ctrl + F5 (forzar recarga)")
print("2. O abre DevTools > Application > Clear Storage > Clear site data")
print("3. Vuelve a cargar la pagina")
print("\nDESPUES DE ESTO:")
print("- El boton PDF funcionara")
print("- Veras los botones en el sidebar (Configurar Cuotas, Ciclos)")
print("=" * 60)
