import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, EstadoCuotasBombero

print("=" * 80)
print("TEST: VERIFICAR ESTADO ESTUDIANTE")
print("=" * 80)

voluntario = Voluntario.objects.get(id=7)
print(f"\nVoluntario: {voluntario.nombre} {voluntario.apellido_paterno}")

try:
    estado = EstadoCuotasBombero.objects.get(voluntario=voluntario)
    print(f"\n[ESTADO]")
    print(f"  - Es estudiante: {estado.es_estudiante}")
    print(f"  - Cuotas desactivadas: {estado.cuotas_desactivadas}")
    print(f"  - Fecha activacion: {estado.fecha_activacion_estudiante}")
    print(f"  - Observaciones: {estado.observaciones_estudiante}")
except EstadoCuotasBombero.DoesNotExist:
    print("\n[ERROR] No tiene estado de cuotas")

print("\n" + "=" * 80)
print("ENDPOINT QUE DEBE FUNCIONAR:")
print(f"  GET: http://127.0.0.1:8000/api/voluntarios/7/estado-cuotas-simple/")
print("=" * 80)
