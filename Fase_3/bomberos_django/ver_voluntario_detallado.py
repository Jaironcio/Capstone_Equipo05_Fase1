import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario

# Obtener el último voluntario por ID
v = Voluntario.objects.order_by('-id').first()

if v:
    print(f"\n[INFO] Voluntario ID: {v.id}")
    print(f"  Nombre: {v.nombre_completo()}")
    print(f"  Clave: {v.clave_bombero}")
    print(f"  Estado: {v.estado_bombero}")
    print(f"\n[ANTIGÜEDAD]")
    print(f"  antiguedad_congelada: {v.antiguedad_congelada}")
    print(f"  fecha_congelamiento: {v.fecha_congelamiento}")
    print(f"  fecha_descongelamiento: {v.fecha_descongelamiento}")
    print(f"\n[FECHAS DE ESTADOS]")
    print(f"  fecha_renuncia: {v.fecha_renuncia}")
    print(f"  fecha_separacion: {v.fecha_separacion}")
    print(f"  fecha_expulsion: {v.fecha_expulsion}")
    print(f"\n[HISTORIAL]")
    print(f"  historial_estados: {v.historial_estados}")
    
    if v.fecha_ingreso:
        ant = v.antiguedad_detallada()
        print(f"\n[ANTIGÜEDAD CALCULADA]")
        print(f"  {ant['años']} años, {ant['meses']} meses, {ant['dias']} días")
else:
    print("[INFO] No hay voluntarios")
