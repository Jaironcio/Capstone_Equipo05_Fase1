import urllib.request

print("=" * 60)
print("VERIFICACION DE BOTONES AGREGADOS")
print("=" * 60)

# Test 1: Verificar que sidebar-django.js tiene los botones
print("\n[TEST 1] Verificar botones en sidebar...")
try:
    with open('static/js/sidebar-django.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('Configurar Cuotas' in content, 'Botón "Configurar Cuotas"'),
            ('Ciclos de Cuotas' in content, 'Botón "Ciclos de Cuotas"'),
            ('configurar-cuotas.html' in content, 'URL Configurar Cuotas'),
            ('admin-ciclos-cuotas.html' in content, 'URL Admin Ciclos'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "FALTA"
            print(f"  [{status}] {desc}")
        
        if all(c[0] for c in checks):
            print("\nEXITO - Botones en sidebar correctos")
        else:
            print("\nERROR - Faltan algunos botones")
            
except Exception as e:
    print(f"ERROR: {e}")

# Test 2: Verificar botón PDF en template
print("\n[TEST 2] Verificar botón PDF en cuotas-beneficios.html...")
try:
    with open('templates/cuotas-beneficios.html', 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('generarPDFCuotas' in content, 'Función generarPDFCuotas()'),
            ('Generar PDF Cuotas' in content, 'Texto del botón'),
            ('btn-danger' in content, 'Clase CSS del botón'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "FALTA"
            print(f"  [{status}] {desc}")
        
        if all(c[0] for c in checks):
            print("\nEXITO - Botón PDF en template correcto")
        else:
            print("\nERROR - Falta el botón PDF")
            
except Exception as e:
    print(f"ERROR: {e}")

# Test 3: Verificar función JS
print("\n[TEST 3] Verificar función JavaScript...")
try:
    with open('static/js/cuotas-django.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('function generarPDFCuotas' in content, 'Declaración de función'),
            ('pdf-cuotas' in content, 'Endpoint PDF'),
            ('window.open' in content, 'Abrir PDF en nueva ventana'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "FALTA"
            print(f"  [{status}] {desc}")
        
        if all(c[0] for c in checks):
            print("\nEXITO - Función JavaScript correcta")
        else:
            print("\nERROR - Falta la función JS")
            
except Exception as e:
    print(f"ERROR: {e}")

# Test 4: Verificar que las rutas HTML existen
print("\n[TEST 4] Verificar rutas HTML...")
try:
    urls = [
        ('http://127.0.0.1:8000/configurar-cuotas.html', 'Configurar Cuotas'),
        ('http://127.0.0.1:8000/admin-ciclos-cuotas.html', 'Admin Ciclos'),
        ('http://127.0.0.1:8000/cuotas-beneficios.html', 'Cuotas/Beneficios'),
    ]
    
    for url, nombre in urls:
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                status = response.getcode()
                print(f"  [OK] {nombre} - Status {status}")
        except urllib.error.HTTPError as e:
            print(f"  [ERROR] {nombre} - HTTP {e.code}")
        except Exception as e:
            print(f"  [ERROR] {nombre} - {str(e)}")
    
except Exception as e:
    print(f"ERROR: {e}")

print("\n" + "=" * 60)
print("VERIFICACION COMPLETADA")
print("=" * 60)
print("\nBOTONES AGREGADOS:")
print("1. Sidebar > FINANZAS > 'Configurar Cuotas'")
print("2. Sidebar > FINANZAS > 'Ciclos de Cuotas'")
print("3. Cuotas Form > 'Generar PDF Cuotas'")
print("=" * 60)
