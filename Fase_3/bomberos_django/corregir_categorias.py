"""
Script para corregir categorías de voluntarios
Ajusta fechas de ingreso para que coincidan con las categorías deseadas
"""
import os
import django
from datetime import date
from dateutil.relativedelta import relativedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, Cargo

# Correcciones a realizar
correcciones = [
    {
        'rut': '3.768.935-7',  # Juan Aurelio Ruiz Mansilla
        'categoria_deseada': 'Honorario Cuerpo',  # 25-49 años
        'anios_antiguedad': 30,  # 30 años de servicio
        'eliminar_cargo': 'Decano'
    },
    {
        'rut': '18.036.532-8',  # Guillermo Ruiz Delgado
        'categoria_deseada': 'Honorario Compañía',  # 20-24 años
        'anios_antiguedad': 22,  # Ya está bien (21 años)
        'eliminar_cargo': None
    },
    {
        'rut': '6.882.268-5',  # Luis Fernando Oñederra
        'categoria_deseada': 'Insigne',  # 50+ años
        'anios_antiguedad': 52,  # 52 años de servicio
        'eliminar_cargo': None
    }
]

def corregir_categorias():
    print("=" * 80)
    print("CORRIGIENDO CATEGORIAS DE VOLUNTARIOS")
    print("=" * 80)
    
    for correccion in correcciones:
        try:
            # Buscar voluntario
            voluntario = Voluntario.objects.get(rut=correccion['rut'])
            nombre = f"{voluntario.nombre} {voluntario.apellido_paterno}".strip()
            
            print(f"\n[PROCESANDO] {nombre}")
            print(f"   RUT: {correccion['rut']}")
            print(f"   Categoria deseada: {correccion['categoria_deseada']}")
            
            # Calcular nueva fecha de ingreso
            hoy = date.today()
            nueva_fecha_ingreso = hoy - relativedelta(years=correccion['anios_antiguedad'])
            
            # Actualizar fecha de ingreso
            antigua_fecha = voluntario.fecha_ingreso
            voluntario.fecha_ingreso = nueva_fecha_ingreso
            voluntario.save()
            
            print(f"   Fecha ingreso anterior: {antigua_fecha}")
            print(f"   Fecha ingreso nueva: {nueva_fecha_ingreso}")
            print(f"   Antiguedad: {correccion['anios_antiguedad']} años")
            
            # Eliminar cargo si es necesario
            if correccion['eliminar_cargo']:
                cargos_eliminados = Cargo.objects.filter(
                    voluntario=voluntario,
                    nombre_cargo=correccion['eliminar_cargo'],
                    fecha_fin__isnull=True
                ).delete()
                
                if cargos_eliminados[0] > 0:
                    print(f"   [OK] Cargo '{correccion['eliminar_cargo']}' eliminado")
                else:
                    print(f"   [INFO] No tenia cargo '{correccion['eliminar_cargo']}'")
            
            print(f"   [OK] Actualizado correctamente")
            
        except Voluntario.DoesNotExist:
            print(f"[ERROR] No se encontro voluntario con RUT: {correccion['rut']}")
        except Exception as e:
            print(f"[ERROR] Error al procesar {correccion['rut']}: {str(e)}")
    
    print("\n" + "=" * 80)
    print("RESUMEN FINAL DE VOLUNTARIOS ACTIVOS")
    print("=" * 80)
    
    # Mostrar voluntarios activos con sus categorías
    activos = Voluntario.objects.filter(estado_bombero='activo').order_by('fecha_ingreso')
    
    categorias = {
        'Voluntario': [],
        'Honorario Compañía': [],
        'Honorario Cuerpo': [],
        'Insigne': []
    }
    
    for vol in activos:
        if vol.fecha_ingreso:
            antiguedad = (date.today() - vol.fecha_ingreso).days // 365
            
            if antiguedad < 20:
                cat = 'Voluntario'
            elif antiguedad < 25:
                cat = 'Honorario Compañía'
            elif antiguedad < 50:
                cat = 'Honorario Cuerpo'
            else:
                cat = 'Insigne'
            
            nombre = f"{vol.nombre} {vol.apellido_paterno}".strip()
            
            # Verificar si tiene cargo
            cargo = Cargo.objects.filter(
                voluntario=vol,
                fecha_fin__isnull=True
            ).first()
            
            cargo_texto = f" - {cargo.nombre_cargo}" if cargo else ""
            
            categorias[cat].append(f"{nombre} (Clave: {vol.clave_bombero}, {antiguedad} años){cargo_texto}")
    
    for cat, voluntarios in categorias.items():
        if voluntarios:
            print(f"\n{cat.upper()}:")
            for v in voluntarios:
                print(f"   {v}")
    
    print("\n" + "=" * 80)
    print("CARGOS ACTIVOS:")
    print("=" * 80)
    
    cargos_activos = Cargo.objects.filter(fecha_fin__isnull=True).select_related('voluntario')
    
    if cargos_activos.exists():
        for cargo in cargos_activos:
            vol = cargo.voluntario
            nombre = f"{vol.nombre} {vol.apellido_paterno}".strip()
            print(f"   {cargo.nombre_cargo}: {nombre} (Clave: {vol.clave_bombero})")
    else:
        print("   No hay cargos activos")

if __name__ == '__main__':
    corregir_categorias()
