import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import CicloCuotas, PagoCuota, MovimientoFinanciero, ConfiguracionCuotas

print("=" * 80)
print("VERIFICACION FINAL")
print("=" * 80)

# Verificar ciclos
print("\n[CICLOS]")
ciclos = CicloCuotas.objects.all()
print(f"Total: {ciclos.count()}")
for c in ciclos:
    estado = "ACTIVO" if c.activo else "Inactivo"
    print(f"  - Ciclo {c.anio} ({estado})")
    print(f"    Precio Regular: ${c.precio_cuota_regular}")
    print(f"    Precio Estudiante: ${c.precio_cuota_estudiante}")

# Verificar pagos
print("\n[PAGOS DE CUOTAS]")
pagos = PagoCuota.objects.all()
print(f"Total: {pagos.count()}")
if pagos.exists():
    for p in pagos:
        print(f"  - Voluntario {p.voluntario_id}, Mes {p.mes}/{p.anio}: ${p.monto_pagado}")

# Verificar movimientos
print("\n[MOVIMIENTOS FINANCIEROS DE CUOTAS]")
movimientos = MovimientoFinanciero.objects.filter(categoria='cuota')
print(f"Total: {movimientos.count()}")

# Verificar configuración
print("\n[CONFIGURACION DE CUOTAS]")
config = ConfiguracionCuotas.objects.first()
if config:
    print(f"  Precio Regular: ${config.precio_regular}")
    print(f"  Precio Estudiante: ${config.precio_estudiante}")

print("\n" + "=" * 80)
print("RESUMEN")
print("=" * 80)
print(f"""
Estado actual:
  - Ciclos: {ciclos.count()}
  - Pagos: {pagos.count()}
  - Movimientos de cuotas: {movimientos.count()}
  
Sistema listo para pruebas:
  1. Admin Ciclos: http://127.0.0.1:8000/admin-ciclos-cuotas.html
  2. Cuotas Voluntario: http://127.0.0.1:8000/cuotas-beneficios.html?id=7
  
IMPORTANTE: Presiona CTRL + F5 en ambas paginas
""")
print("=" * 80)
