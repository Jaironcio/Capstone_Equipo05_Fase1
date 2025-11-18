import urllib.request

print("=" * 60)
print("PRUEBAS DE PDFs DE CUOTAS")
print("=" * 60)

# Test 1: PDF de cuotas individual (voluntario ID 8, año 2024)
print("\n[TEST 1] Generar PDF de cuotas para voluntario ID 8, año 2024...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/8/pdf-cuotas/2024/')
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        content_type = response.headers.get('Content-Type')
        content_length = len(response.read())
        
        print(f"Status: {status_code}")
        print(f"Content-Type: {content_type}")
        print(f"Size: {content_length} bytes")
        
        if status_code == 200 and content_type == 'application/pdf':
            print("EXITO - PDF generado correctamente")
            print("Ver en navegador: http://127.0.0.1:8000/api/voluntarios/8/pdf-cuotas/2024/")
        else:
            print(f"ERROR - Status o tipo incorrecto")
            
except urllib.error.HTTPError as e:
    print(f"ERROR HTTP {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"ERROR: {e}")

# Test 2: PDF de deudores del año 2024
print("\n[TEST 2] Generar PDF de deudores para año 2024...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/pdf-deudores-cuotas/2024/')
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        content_type = response.headers.get('Content-Type')
        content_length = len(response.read())
        
        print(f"Status: {status_code}")
        print(f"Content-Type: {content_type}")
        print(f"Size: {content_length} bytes")
        
        if status_code == 200 and content_type == 'application/pdf':
            print("EXITO - PDF de deudores generado")
            print("Ver en navegador: http://127.0.0.1:8000/api/voluntarios/pdf-deudores-cuotas/2024/")
        else:
            print(f"ERROR - Status o tipo incorrecto")
            
except urllib.error.HTTPError as e:
    print(f"ERROR HTTP {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"ERROR: {e}")

# Test 3: PDF sin especificar año (usa año actual)
print("\n[TEST 3] PDF sin especificar año (usa año actual)...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/8/pdf-cuotas/')
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        
        print(f"Status: {status_code}")
        
        if status_code == 200:
            print("EXITO - PDF con año actual generado")
            print("Ver en navegador: http://127.0.0.1:8000/api/voluntarios/8/pdf-cuotas/")
        else:
            print(f"ERROR - Status: {status_code}")
            
except urllib.error.HTTPError as e:
    print(f"ERROR HTTP {e.code}")
except Exception as e:
    print(f"ERROR: {e}")

print("\n" + "=" * 60)
print("PRUEBAS PDF COMPLETADAS")
print("=" * 60)
print("\nPara visualizar los PDFs:")
print("1. Abre http://127.0.0.1:8000/api/voluntarios/8/pdf-cuotas/2024/")
print("2. Abre http://127.0.0.1:8000/api/voluntarios/pdf-deudores-cuotas/2024/")
print("3. Verifica el grid de 12 meses con colores")
print("4. Verifica los datos del voluntario")
print("=" * 60)
