"""
Probar el endpoint de API de voluntarios
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
import json

client = Client()

print("=" * 80)
print("PROBANDO ENDPOINT API DE VOLUNTARIOS")
print("=" * 80)

# Probar el endpoint de lista de voluntarios
response = client.get('/api/voluntarios/')

print(f"\nStatus Code: {response.status_code}")

if response.status_code == 200:
    try:
        data = response.json()
        print(f"Total voluntarios devueltos: {len(data)}")
        
        # Mostrar solo los activos
        activos = [v for v in data if v.get('estado_bombero') == 'activo']
        print(f"Total activos: {len(activos)}")
        
        print("\nVOLUNTARIOS ACTIVOS:")
        print("-" * 80)
        
        for vol in activos:
            nombre = vol.get('nombre', '')
            apellido = vol.get('apellido_paterno', '')
            clave = vol.get('clave_bombero', 'N/A')
            fecha_ingreso = vol.get('fecha_ingreso', 'N/A')
            
            print(f"- {nombre} {apellido} (Clave: {clave})")
            print(f"  Fecha ingreso: {fecha_ingreso}")
            
            # Si tiene el campo de categoría calculada
            if 'categoria_bombero' in vol:
                print(f"  Categoría: {vol['categoria_bombero']}")
            
            if 'antiguedad_anos' in vol:
                print(f"  Antigüedad: {vol['antiguedad_anos']} años")
            
            print()
        
        # Buscar específicamente los 3 que nos interesan
        print("\n" + "=" * 80)
        print("VERIFICANDO LOS 3 VOLUNTARIOS ESPECIFICOS:")
        print("=" * 80)
        
        ruts_buscar = ['6.882.268-5', '3.768.935-7', '18.036.532-8']
        
        for rut in ruts_buscar:
            encontrado = next((v for v in data if v.get('rut') == rut), None)
            if encontrado:
                print(f"\n[OK] Encontrado: {encontrado.get('nombre')} {encontrado.get('apellido_paterno')}")
                print(f"     RUT: {encontrado.get('rut')}")
                print(f"     Clave: {encontrado.get('clave_bombero')}")
                print(f"     Fecha ingreso: {encontrado.get('fecha_ingreso')}")
                print(f"     Estado: {encontrado.get('estado_bombero')}")
            else:
                print(f"\n[X] NO encontrado: RUT {rut}")
        
    except json.JSONDecodeError:
        print("[ERROR] No se pudo decodificar JSON")
        print(response.content[:500])
else:
    print(f"[ERROR] Respuesta no exitosa")
    print(response.content[:500])

print("\n" + "=" * 80)
print("PROBANDO ENDPOINT SIMPLE (sin DRF)")
print("=" * 80)

# Probar endpoint simple
response2 = client.get('/api/voluntarios/lista-activos-simple/')

print(f"\nStatus Code: {response2.status_code}")

if response2.status_code == 200:
    try:
        data2 = response2.json()
        print(f"Total voluntarios (simple): {len(data2)}")
        
        activos2 = [v for v in data2 if v.get('estado_bombero') == 'activo']
        print(f"Total activos (simple): {len(activos2)}")
        
    except:
        print("[ERROR] Endpoint simple no funciona")
else:
    print(f"[ERROR] Endpoint simple retorna {response2.status_code}")
