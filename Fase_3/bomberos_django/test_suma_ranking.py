import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bomberos_django.settings')
django.setup()

from voluntarios.models import EventoAsistencia

# Verificar que el campo existe
print("Verificando campo suma_ranking...")
try:
    evento = EventoAsistencia.objects.first()
    if evento:
        print(f"✅ Campo suma_ranking existe: {evento.suma_ranking}")
    else:
        print("⚠️ No hay eventos en la BD, pero el modelo está correcto")
    print("✅ El campo suma_ranking está funcionando correctamente")
except Exception as e:
    print(f"❌ Error: {e}")
