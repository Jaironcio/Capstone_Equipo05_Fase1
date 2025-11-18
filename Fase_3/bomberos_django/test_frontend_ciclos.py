import urllib.request

print("=" * 60)
print("PRUEBA RAPIDA DEL FRONTEND DE CICLOS DE CUOTAS")
print("=" * 60)

# Test: Acceder al HTML
print("\n[TEST] Acceder a /admin-ciclos-cuotas.html...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/admin-ciclos-cuotas.html')
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        content = response.read().decode('utf-8')
        
        print(f"Status: {status_code}")
        
        if status_code == 200:
            # Verificar que contenga elementos clave
            checks = [
                ('Administración de Ciclos de Cuotas' in content, 'Título presente'),
                ('admin-ciclos-cuotas.js' in content, 'JavaScript incluido'),
                ('modalCiclo' in content, 'Modal presente'),
                ('listaCiclos' in content, 'Contenedor de lista presente'),
                ('dashboardActivo' in content, 'Dashboard presente'),
            ]
            
            print("\nVerificaciones:")
            for check, desc in checks:
                status = "OK" if check else "FALTA"
                print(f"  [{status}] {desc}")
            
            if all(c[0] for c in checks):
                print("\nEXITO - Pagina HTML correcta")
            else:
                print("\nADVERTENCIA - Algunos elementos faltan")
        else:
            print(f"ERROR - Status inesperado: {status_code}")
            
except urllib.error.HTTPError as e:
    print(f"ERROR HTTP {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"ERROR: {e}")

# Test: Verificar que el JS existe
print("\n[TEST] Verificar archivo JavaScript...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/static/js/admin-ciclos-cuotas.js')
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        content = response.read().decode('utf-8')
        
        print(f"Status: {status_code}")
        
        if status_code == 200:
            # Verificar funciones clave
            checks = [
                ('cargarCiclos' in content, 'Función cargarCiclos'),
                ('activarCiclo' in content, 'Función activarCiclo'),
                ('cerrarCiclo' in content, 'Función cerrarCiclo'),
                ('verEstadisticas' in content, 'Función verEstadisticas'),
                ('API_BASE' in content, 'Constante API_BASE'),
            ]
            
            print("Verificaciones:")
            for check, desc in checks:
                status = "OK" if check else "FALTA"
                print(f"  [{status}] {desc}")
            
            if all(c[0] for c in checks):
                print("\nEXITO - JavaScript correcto")
            else:
                print("\nADVERTENCIA - Algunas funciones faltan")
        else:
            print(f"ERROR - Status inesperado: {status_code}")
            
except urllib.error.HTTPError as e:
    print(f"ERROR HTTP {e.code}")
except Exception as e:
    print(f"ERROR: {e}")

print("\n" + "=" * 60)
print("PRUEBAS FRONTEND COMPLETADAS")
print("=" * 60)
print("\nPara probar el frontend completo:")
print("1. Abre http://127.0.0.1:8000/admin-ciclos-cuotas.html")
print("2. Verifica que se carguen los ciclos 2024 y 2025")
print("3. Prueba crear un nuevo ciclo")
print("4. Prueba activar, cerrar y ver estadisticas")
print("=" * 60)
