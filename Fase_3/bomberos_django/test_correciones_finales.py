import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, CicloCuotas, PagoCuota
from decimal import Decimal
from datetime import date

print("=" * 80)
print("TEST: CORRECCIONES FINALES")
print("=" * 80)

# Paso 1: Verificar ciclo activo
print("\n[PASO 1] Verificar ciclo activo...")
ciclo = CicloCuotas.objects.filter(activo=True).first()
if ciclo:
    print(f"  [OK] Ciclo activo: {ciclo.anio}")
    print(f"    - Precio Regular: ${ciclo.precio_cuota_regular}")
    print(f"    - Precio Estudiante: ${ciclo.precio_cuota_estudiante}")
else:
    print("  [ERROR] No hay ciclo activo")
    exit(1)

# Paso 2: Seleccionar voluntario
print("\n[PASO 2] Seleccionar voluntario Juan Monje...")
voluntario = Voluntario.objects.get(id=7)
print(f"  [OK] {voluntario.nombre} {voluntario.apellido_paterno} (ID: {voluntario.id})")

# Paso 3: Ver pagos del voluntario en ciclo activo
print(f"\n[PASO 3] Ver pagos del voluntario en ciclo {ciclo.anio}...")
pagos = PagoCuota.objects.filter(
    voluntario=voluntario,
    anio=ciclo.anio
).order_by('mes')

print(f"  [INFO] Total pagos: {pagos.count()}")
if pagos.exists():
    print("\n  Detalle de pagos:")
    for p in pagos:
        print(f"    - Mes {p.mes}: ${p.monto_pagado} ({p.fecha_pago})")
else:
    print("  [INFO] No hay pagos registrados")

# Paso 4: Verificar configuración de cuotas
print(f"\n[PASO 4] Verificar configuración de cuotas...")
from voluntarios.models import ConfiguracionCuotas
config = ConfiguracionCuotas.objects.first()
if config:
    print(f"  [OK] Configuracion:")
    print(f"    - Precio Regular: ${config.precio_regular}")
    print(f"    - Precio Estudiante: ${config.precio_estudiante}")
else:
    print("  [ERROR] No hay configuracion")

print("\n" + "=" * 80)
print("PRUEBAS MANUALES")
print("=" * 80)
print(f"""
1. VERIFICAR ESTADOS EN CUOTAS:
   - URL: http://127.0.0.1:8000/cuotas-beneficios.html?id=7
   - CTRL + F5 para recargar
   - Verificar:
     a) Año mostrado: {ciclo.anio}
     b) Meses pagados: VERDE
     c) Meses NO pagados: ROJO (NO "Futuro")
     d) Total pagos mostrados: {pagos.count()}

2. VERIFICAR FORMULARIO DE CREAR CICLO:
   - URL: http://127.0.0.1:8000/admin-ciclos-cuotas.html
   - CTRL + F5 para recargar
   - Click en "Nuevo Ciclo"
   - Verificar:
     a) NO aparecen campos de precio
     b) Solo: Año, Fecha Inicio, Fecha Fin, Observaciones, Activo
     c) Mensaje informativo sobre configuración de precios

3. CREAR CICLO 2026 PARA PROBAR:
   - En admin-ciclos-cuotas.html
   - Click "Nuevo Ciclo"
   - Año: 2026
   - Fecha Inicio: 2026-01-01
   - Fecha Fin: 2026-12-31
   - Guardar
   - El ciclo debe tomar precios de configuración (${config.precio_regular}/${config.precio_estudiante})

4. PROBAR CAMBIO DE CICLO:
   - Activar ciclo 2026
   - Volver a cuotas del voluntario
   - CTRL + F5
   - Verificar que el año cambió a 2026
   - Todos los meses deben estar en ROJO (pendientes)
   - Checkboxes habilitados
""")
print("=" * 80)
