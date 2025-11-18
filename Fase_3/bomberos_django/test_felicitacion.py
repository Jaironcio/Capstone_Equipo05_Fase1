"""
Script de prueba para crear una felicitación directamente
"""
import os
import sys
import django

# Configurar Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bomberos_django.settings')
django.setup()

from voluntarios.models import Felicitacion, Voluntario
from django.contrib.auth.models import User
from datetime import date

print("\n===== TEST CREAR FELICITACIÓN =====\n")

# Obtener primer voluntario
voluntario = Voluntario.objects.first()
if not voluntario:
    print("❌ No hay voluntarios en la BD")
    sys.exit(1)

print(f"✅ Voluntario encontrado: {voluntario.nombre} {voluntario.apellido_paterno} (ID: {voluntario.id})")

# Obtener usuario
usuario = User.objects.first()
if not usuario:
    print("❌ No hay usuarios en la BD")
    sys.exit(1)

print(f"✅ Usuario encontrado: {usuario.username}")

# Crear felicitación
try:
    felicitacion = Felicitacion.objects.create(
        voluntario=voluntario,
        tipo_felicitacion='destacado',
        fecha_felicitacion=date(1998, 3, 5),
        oficio_numero='TEST-001',
        motivo='Test de prueba desde script',
        created_by=usuario
    )
    print(f"\n✅ FELICITACIÓN CREADA EXITOSAMENTE!")
    print(f"   ID: {felicitacion.id}")
    print(f"   Tipo: {felicitacion.tipo_felicitacion}")
    print(f"   Voluntario: {felicitacion.voluntario}")
    
    # Contar total
    total = Felicitacion.objects.count()
    print(f"\n📊 Total de felicitaciones en BD: {total}")
    
except Exception as e:
    print(f"\n❌ ERROR al crear felicitación:")
    print(f"   {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
