import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import ConfiguracionCuotas, CicloCuotas

print("=" * 60)
print("ESTADO DE LA BASE DE DATOS")
print("=" * 60)

# Configuración
config = ConfiguracionCuotas.objects.first()
print("\n=== CONFIGURACION DE CUOTAS ===")
if config:
    print(f"Precio Regular: ${config.precio_regular}")
    print(f"Precio Estudiante: ${config.precio_estudiante}")
else:
    print("No hay configuración guardada")

# Ciclos
print("\n=== CICLOS DE CUOTAS ===")
ciclos = CicloCuotas.objects.all().order_by('-anio')

if not ciclos:
    print("No hay ciclos creados")
else:
    for c in ciclos:
        estado = "ACTIVO" if c.activo else "Inactivo"
        print(f"\nCiclo {c.anio} ({estado}):")
        print(f"  - Fecha Inicio: {c.fecha_inicio}")
        print(f"  - Fecha Fin: {c.fecha_fin}")
        print(f"  - Cuota Regular: ${c.precio_cuota_regular}")
        print(f"  - Cuota Estudiante: ${c.precio_cuota_estudiante}")
        print(f"  - Total Recaudado: ${c.total_recaudado}")

print("\n" + "=" * 60)
