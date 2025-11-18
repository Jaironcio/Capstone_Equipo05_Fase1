import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import CicloCuotas

print("Activando ciclo 2025...")

# Desactivar todos
CicloCuotas.objects.all().update(activo=False)

# Activar 2025
ciclo = CicloCuotas.objects.filter(anio=2025).first()
if ciclo:
    ciclo.activo = True
    ciclo.save()
    print(f"[OK] Ciclo 2025 activado")
else:
    print("[ERROR] No existe ciclo 2025")
