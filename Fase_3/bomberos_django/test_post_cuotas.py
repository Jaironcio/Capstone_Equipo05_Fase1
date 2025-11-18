import urllib.request
import json

# Datos del pago (usar ID 8 que acabamos de crear)
data = {
    "voluntario_id": 8,
    "mes": 11,
    "anio": 2024,
    "monto": 5000,
    "fecha_pago": "2024-11-17",
    "metodo_pago": "Efectivo"
}

print("Probando POST a /api/voluntarios/pagos-cuotas-simple/")
print(f"Datos: {json.dumps(data, indent=2)}")
print()

try:
    # Convertir datos a JSON
    json_data = json.dumps(data).encode('utf-8')
    
    # Crear request
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/voluntarios/pagos-cuotas-simple/',
        data=json_data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    # Hacer el request
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        response_body = response.read().decode('utf-8')
        
        print(f"Status Code: {status_code}")
        print(f"Response: {response_body}")
        
        if status_code == 201:
            print("\nPOST EXITOSO! El endpoint funciona correctamente")
        else:
            print(f"\nError: {status_code}")
        
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
