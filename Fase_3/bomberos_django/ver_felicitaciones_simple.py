import os
import django

# Configurar Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'bomberos_django.settings'
django.setup()

from voluntarios.models import Felicitacion

print("\n" + "="*100)
print(" FELICITACIONES REGISTRADAS EN LA BASE DE DATOS ".center(100, "="))
print("="*100 + "\n")

felicitaciones = Felicitacion.objects.all().select_related('voluntario', 'created_by')
total = felicitaciones.count()

print(f"Total de felicitaciones: {total}\n")

if total == 0:
    print("No hay felicitaciones registradas")
else:
    for i, f in enumerate(felicitaciones, 1):
        print(f"[{i}] ID: {f.id}")
        print(f"    Voluntario: {f.voluntario.clave_bombero} - {f.voluntario.nombre} {f.voluntario.apellido_paterno}")
        print(f"    Tipo: {f.get_tipo_felicitacion_display()}")
        if f.nombre_felicitacion:
            print(f"    Nombre personalizado: {f.nombre_felicitacion}")
        print(f"    Fecha: {f.fecha_felicitacion}")
        print(f"    Oficio No: {f.oficio_numero}")
        if f.fecha_oficio:
            print(f"    Fecha oficio: {f.fecha_oficio}")
        if f.compania_otorgante:
            print(f"    Compania: {f.compania_otorgante}")
        if f.autoridad_otorgante:
            print(f"    Autoridad: {f.autoridad_otorgante}")
        print(f"    Motivo: {f.motivo[:80]}{'...' if len(f.motivo) > 80 else ''}")
        print(f"    Doc adjunto: {'SI' if f.documento_felicitacion else 'NO'}")
        print(f"    Registrado por: {f.created_by.username if f.created_by else 'N/A'}")
        print(f"    Fecha registro: {f.created_at.strftime('%d/%m/%Y %H:%M')}")
        print()

print("="*100)
print("\nTABLA: voluntarios_felicitacion")
print("Para ver en tu visualizador de BD, busca esta tabla y refresca (F5)")
print("="*100 + "\n")
