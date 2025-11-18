import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, EstadoCuotasBombero, PagoCuota
from voluntarios.utils_tesoreria import obtener_precio_cuota
from decimal import Decimal

print("=" * 80)
print("PRUEBA CON CRISTIAN VERA - ESTUDIANTE")
print("=" * 80)

# Buscar a Cristian Vera
voluntarios = Voluntario.objects.filter(nombre__icontains='cristian', apellido_paterno__icontains='vera')
print(f"\n[BUSQUEDA] Encontrados: {voluntarios.count()} voluntario(s)")

if voluntarios.exists():
    voluntario = voluntarios.first()
    print(f"\n[VOLUNTARIO]")
    print(f"  ID: {voluntario.id}")
    print(f"  Nombre: {voluntario.nombre} {voluntario.apellido_paterno} {voluntario.apellido_materno or ''}")
    print(f"  RUT: {voluntario.rut}")
    print(f"  Compania: {voluntario.compania}")
    
    # Estado de cuotas
    print(f"\n[ESTADO DE CUOTAS]")
    try:
        estado = EstadoCuotasBombero.objects.get(voluntario=voluntario)
        print(f"  Es estudiante: {estado.es_estudiante}")
        print(f"  Cuotas desactivadas: {estado.cuotas_desactivadas}")
        
        if estado.es_estudiante:
            print(f"  Fecha activacion: {estado.fecha_activacion_estudiante}")
            print(f"  Observaciones: {estado.observaciones_estudiante}")
    except EstadoCuotasBombero.DoesNotExist:
        print(f"  [INFO] No tiene registro de estado")
        estado = None
    
    # Precio que se le cobra
    print(f"\n[PRECIO QUE SE COBRA]")
    precio = obtener_precio_cuota(voluntario)
    print(f"  Precio actual: ${precio}")
    
    if estado and estado.es_estudiante:
        print(f"  Estado: ESTUDIANTE")
        print(f"  Esperado: $2.000")
        if precio == Decimal('2000'):
            print(f"  [OK] Precio correcto!")
        else:
            print(f"  [ERROR] Precio incorrecto! Deberia ser $2.000")
    else:
        print(f"  Estado: REGULAR")
        print(f"  Esperado: $7.000")
    
    # Pagos registrados
    print(f"\n[PAGOS REGISTRADOS EN 2025]")
    pagos = PagoCuota.objects.filter(voluntario=voluntario, anio=2025)
    print(f"  Total pagos: {pagos.count()}")
    if pagos.exists():
        for pago in pagos:
            print(f"  - Mes {pago.mes}: ${pago.monto_pagado} ({pago.fecha_pago})")
    
    print(f"\n" + "=" * 80)
    print("URLS PARA PROBAR")
    print("=" * 80)
    print(f"""
1. PERFIL:
   http://127.0.0.1:8000/sistema.html
   Buscar: Cristian Vera

2. CUOTAS:
   http://127.0.0.1:8000/cuotas-beneficios.html?id={voluntario.id}
   
3. PDF CUOTAS:
   http://127.0.0.1:8000/api/voluntarios/{voluntario.id}/pdf-cuotas/2025/
   
4. ENDPOINT ESTADO:
   http://127.0.0.1:8000/api/voluntarios/{voluntario.id}/estado-cuotas-simple/
    """)
    
    print("=" * 80)
    print("QUE VERIFICAR")
    print("=" * 80)
    print(f"""
    EN PERFIL (sistema.html):
    - Boton "Estudiante" (azul) en lugar de "Activar Estudiante"
    - O "Activar Estudiante" (verde) si aun no esta activado
    
    EN CUOTAS (cuotas-beneficios.html):
    - TAG verde "ESTUDIANTE" junto al nombre
    - Select muestra SOLO "Cuota Estudiante - $2.000"
    - Select esta DESHABILITADO
    - Al registrar pago, guarda $2.000 (no $7.000)
    
    EN PDF:
    - Valor Cuota: $2.000
    - Deuda calculada: meses_pendientes x $2.000
    """)
    
else:
    print("\n[ERROR] No se encontro a Cristian Vera")
    print("Voluntarios disponibles:")
    todos = Voluntario.objects.all()[:10]
    for v in todos:
        print(f"  - {v.nombre} {v.apellido_paterno} (ID: {v.id})")

print("=" * 80)
