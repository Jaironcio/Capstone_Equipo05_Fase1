import os
import sys
import django
import json

# Fix encoding for Windows
sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver
from django.test import Client

print("="*60)
print("DIAGNOSTICO COMPLETO DE PAGOS-CUOTAS")
print("="*60)

# 1. Verificar URLs registradas
print("\n[1] URLs REGISTRADAS:")
resolver = get_resolver()
found_pagos = False
for pattern in resolver.url_patterns:
    if hasattr(pattern, 'url_patterns'):
        for sub in pattern.url_patterns:
            pattern_str = str(sub.pattern)
            if 'pagos-cuotas' in pattern_str:
                print(f"   ✅ ENCONTRADO: {pattern_str}")
                found_pagos = True

if not found_pagos:
    print("   ❌ NO SE ENCONTRÓ 'pagos-cuotas' en las URLs")

# 2. Verificar ViewSet
print("\n[2] VERIFICAR VIEWSET:")
try:
    from voluntarios.views_tesoreria import PagoCuotaViewSet
    print(f"   ✅ PagoCuotaViewSet importado correctamente")
    print(f"   - permission_classes: {PagoCuotaViewSet.permission_classes}")
    print(f"   - authentication_classes: {PagoCuotaViewSet.authentication_classes}")
except Exception as e:
    print(f"   ❌ ERROR al importar: {e}")

# 3. Verificar Modelo
print("\n[3] VERIFICAR MODELO:")
try:
    from voluntarios.models import PagoCuota
    print(f"   ✅ Modelo PagoCuota existe")
    print(f"   - Campos: {[f.name for f in PagoCuota._meta.fields]}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# 4. Verificar Serializer
print("\n[4] VERIFICAR SERIALIZERS:")
try:
    from voluntarios.serializers import PagoCuotaSerializer, CrearPagoCuotaSerializer
    print(f"   ✅ PagoCuotaSerializer OK")
    print(f"   ✅ CrearPagoCuotaSerializer OK")
    
    # Mostrar campos esperados
    from rest_framework import serializers
    s = CrearPagoCuotaSerializer()
    print(f"   - Campos requeridos: {list(s.fields.keys())}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# 5. Probar endpoint GET con Django Test Client
print("\n[5] PROBAR GET /api/voluntarios/pagos-cuotas/:")
try:
    client = Client()
    response = client.get('/api/voluntarios/pagos-cuotas/')
    print(f"   - Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"   ✅ GET funciona correctamente")
        data = json.loads(response.content)
        print(f"   - Datos: {data}")
    else:
        print(f"   ❌ ERROR {response.status_code}")
        print(f"   - Respuesta: {response.content.decode()}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

# 6. Probar endpoint POST con Django Test Client
print("\n[6] PROBAR POST /api/voluntarios/pagos-cuotas/:")
try:
    client = Client()
    payload = {
        'voluntario_id': 7,
        'mes': 1,
        'anio': 2025,
        'monto': 5000,
        'fecha_pago': '2025-11-17',
        'metodo_pago': 'Efectivo',
        'observaciones': 'Test desde script'
    }
    
    print(f"   - Payload: {json.dumps(payload, indent=4)}")
    
    response = client.post(
        '/api/voluntarios/pagos-cuotas/',
        data=json.dumps(payload),
        content_type='application/json'
    )
    
    print(f"   - Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        print(f"   ✅ POST funciona correctamente!")
        data = json.loads(response.content)
        print(f"   - Respuesta: {json.dumps(data, indent=4)}")
    else:
        print(f"   ❌ ERROR {response.status_code}")
        print(f"   - Respuesta completa: {response.content.decode()}")
        
        # Intentar parsear como JSON
        try:
            error_data = json.loads(response.content)
            print(f"   - Error JSON: {json.dumps(error_data, indent=4)}")
        except:
            pass
            
except Exception as e:
    print(f"   ❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("FIN DEL DIAGNÓSTICO")
print("="*60)
