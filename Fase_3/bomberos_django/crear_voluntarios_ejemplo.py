"""
Script para crear voluntarios de ejemplo con diferentes categorías y estados
Basado en datos reales de la Sexta Compañía
"""
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario

# Datos de ejemplo de la imagen
voluntarios_ejemplo = [
    # ACTIVOS - VOLUNTARIOS (0-19 años)
    {
        'nombre': 'Luis Fernando',
        'apellido_paterno': 'Oñederra',
        'apellido_materno': 'Cárdenas',
        'rut': '6.882.268-5',
        'clave_bombero': '67',
        'fecha_nacimiento': date(1990, 1, 15),
        'fecha_ingreso': date(2020, 1, 15),
        'telefono': '+56912345001',
        'email': 'luis.onederra@gmail.com',
        'domicilio': 'Av. Presidente Ibáñez 123',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'activo'
    },
    {
        'nombre': 'Roger Gerardo',
        'apellido_paterno': 'Oñederra',
        'apellido_materno': 'Oñederra',
        'rut': '6.079.968-7',
        'clave_bombero': '75',
        'fecha_nacimiento': date(1985, 5, 20),
        'fecha_ingreso': date(2018, 3, 10),
        'telefono': '+56912345002',
        'email': 'roger.onederra@gmail.com',
        'domicilio': 'Pasaje Los Aromos 456',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'activo'
    },
    
    # ACTIVOS - HONORARIOS COMPAÑÍA (20-24 años)
    {
        'nombre': 'Guillermo',
        'apellido_paterno': 'Ruiz',
        'apellido_materno': 'Delgado',
        'rut': '18.036.532-8',
        'clave_bombero': '339',
        'fecha_nacimiento': date(1975, 8, 10),
        'fecha_ingreso': date(2004, 11, 7),  # 20 años
        'telefono': '+56912345003',
        'email': 'guillermo.ruiz@gmail.com',
        'domicilio': 'Calle Los Mañíos 789',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'activo'
    },
    {
        'nombre': 'Baldovino Alejandro',
        'apellido_paterno': 'Ruiz',
        'apellido_materno': 'Mansilla',
        'rut': '9.607.570-2',
        'clave_bombero': '210',
        'fecha_nacimiento': date(1972, 3, 25),
        'fecha_ingreso': date(2003, 5, 12),  # 21 años
        'telefono': '+56912345004',
        'email': 'baldovino.ruiz@gmail.com',
        'domicilio': 'Av. Décima Región 321',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'activo'
    },
    
    # ACTIVOS - HONORARIOS CUERPO (25-49 años)
    {
        'nombre': 'Héctor Guillermo',
        'apellido_paterno': 'Oñederra',
        'apellido_materno': 'Oñederra',
        'rut': '2.835.043-0',
        'clave_bombero': '12',
        'fecha_nacimiento': date(1960, 12, 5),
        'fecha_ingreso': date(1985, 5, 6),  # 39 años
        'telefono': '+56912345005',
        'email': 'hector.onederra@gmail.com',
        'domicilio': 'Camino Alerce 567',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'activo'
    },
    {
        'nombre': 'Martin Andres',
        'apellido_paterno': 'Ruiz',
        'apellido_materno': 'Arteaga',
        'rut': '14.225.847-K',
        'clave_bombero': '71',
        'fecha_nacimiento': date(1968, 7, 15),
        'fecha_ingreso': date(1998, 1, 16),  # 26 años
        'telefono': '+56912345006',
        'email': 'martin.ruiz@gmail.com',
        'domicilio': 'Pasaje Escondido 890',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'activo'
    },
    
    # ACTIVOS - INSIGNES (50+ años)
    {
        'nombre': 'Juan Aurelio',
        'apellido_paterno': 'Ruiz',
        'apellido_materno': 'Mansilla',
        'rut': '3.768.935-7',
        'clave_bombero': '236',
        'fecha_nacimiento': date(1955, 2, 20),
        'fecha_ingreso': date(1973, 8, 30),  # 51 años
        'telefono': '+56912345007',
        'email': 'juan.ruiz@gmail.com',
        'domicilio': 'Av. Presidente Kennedy 234',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'activo'
    },
    
    # MÁRTIR (con estado especial)
    {
        'nombre': 'Carlos Alberto',
        'apellido_paterno': 'González',
        'apellido_materno': 'Silva',
        'rut': '8.456.789-2',
        'clave_bombero': '145',
        'fecha_nacimiento': date(1970, 6, 10),
        'fecha_ingreso': date(1995, 3, 15),
        'telefono': '+56912345008',
        'email': 'carlos.gonzalez@gmail.com',
        'domicilio': 'Calle Heroica 100',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'martir'
    },
    
    # FALLECIDO
    {
        'nombre': 'Pedro Antonio',
        'apellido_paterno': 'Fernández',
        'apellido_materno': 'Lagos',
        'rut': '5.123.456-7',
        'clave_bombero': '89',
        'fecha_nacimiento': date(1950, 4, 5),
        'fecha_ingreso': date(1975, 7, 20),
        'telefono': '+56912345009',
        'email': 'pedro.fernandez@gmail.com',
        'domicilio': 'Población Los Héroes 567',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'fallecido'
    },
    
    # RENUNCIADO
    {
        'nombre': 'Miguel Ángel',
        'apellido_paterno': 'Torres',
        'apellido_materno': 'Muñoz',
        'rut': '12.345.678-9',
        'clave_bombero': '234',
        'fecha_nacimiento': date(1980, 9, 12),
        'fecha_ingreso': date(2005, 2, 1),
        'telefono': '+56912345010',
        'email': 'miguel.torres@gmail.com',
        'domicilio': 'Villa El Bosque 890',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'renunciado'
    },
    
    # SEPARADO
    {
        'nombre': 'Andrés Felipe',
        'apellido_paterno': 'Mora',
        'apellido_materno': 'Castro',
        'rut': '15.678.901-2',
        'clave_bombero': '456',
        'fecha_nacimiento': date(1988, 11, 8),
        'fecha_ingreso': date(2012, 6, 15),
        'telefono': '+56912345011',
        'email': 'andres.mora@gmail.com',
        'domicilio': 'Población Vista Hermosa 123',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'separado'
    },
    
    # EXPULSADO
    {
        'nombre': 'Roberto Carlos',
        'apellido_paterno': 'Vega',
        'apellido_materno': 'Ramírez',
        'rut': '16.789.012-3',
        'clave_bombero': '567',
        'fecha_nacimiento': date(1992, 1, 30),
        'fecha_ingreso': date(2015, 9, 10),
        'telefono': '+56912345012',
        'email': 'roberto.vega@gmail.com',
        'domicilio': 'Barrio Industrial 456',
        'compania': 'Sexta Compañía',
        'estado_bombero': 'expulsado'
    }
]

def crear_voluntarios():
    print("=" * 80)
    print("CREANDO VOLUNTARIOS DE EJEMPLO PARA LA SEXTA COMPANIA")
    print("=" * 80)
    
    creados = 0
    existentes = 0
    
    for data in voluntarios_ejemplo:
        # Verificar si ya existe por RUT
        if Voluntario.objects.filter(rut=data['rut']).exists():
            nombre_completo = f"{data.get('nombre', '')} {data.get('apellido_paterno', '')}".strip()
            print(f"[X] Ya existe: {nombre_completo} (RUT: {data['rut']})")
            existentes += 1
            continue
        
        # Crear voluntario
        voluntario = Voluntario.objects.create(**data)
        
        # Calcular antigüedad manualmente
        from datetime import date
        antiguedad = (date.today() - data['fecha_ingreso']).days // 365
        
        # Determinar categoría
        if antiguedad < 20:
            categoria = "Voluntario"
        elif antiguedad < 25:
            categoria = "Honorario Compania"
        elif antiguedad < 50:
            categoria = "Honorario Cuerpo"
        else:
            categoria = "Insigne"
        
        # Mostrar información
        nombre_completo = f"{data.get('nombre', '')} {data.get('apellido_paterno', '')} {data.get('apellido_materno', '')}".strip()
        print(f"[OK] Creado: {nombre_completo}")
        print(f"     RUT: {data['rut']} | Clave: {data['clave_bombero']}")
        print(f"     Categoria: {categoria} ({antiguedad} años)")
        print(f"     Estado: {data['estado_bombero'].upper()}")
        print()
        
        creados += 1
    
    print("=" * 80)
    print(f"RESUMEN:")
    print(f"[OK] Creados: {creados}")
    print(f"[X] Ya existian: {existentes}")
    print(f"[#] Total en BD: {Voluntario.objects.count()}")
    print("=" * 80)
    
    # Resumen por categoría
    print("\nRESUMEN POR ESTADO:")
    for estado in ['activo', 'renunciado', 'separado', 'expulsado', 'martir', 'fallecido']:
        count = Voluntario.objects.filter(estado_bombero=estado).count()
        if count > 0:
            print(f"   {estado.upper()}: {count}")
    
    print("\nRESUMEN POR CATEGORIA BOMBERIL:")
    activos = Voluntario.objects.filter(estado_bombero='activo')
    categorias = {'Voluntario': 0, 'Honorario Compania': 0, 'Honorario Cuerpo': 0, 'Insigne': 0}
    
    for vol in activos:
        if vol.fecha_ingreso:
            antiguedad = (date.today() - vol.fecha_ingreso).days // 365
            if antiguedad < 20:
                categorias['Voluntario'] += 1
            elif antiguedad < 25:
                categorias['Honorario Compania'] += 1
            elif antiguedad < 50:
                categorias['Honorario Cuerpo'] += 1
            else:
                categorias['Insigne'] += 1
    
    for cat, count in categorias.items():
        if count > 0:
            print(f"   {cat}: {count}")

if __name__ == '__main__':
    crear_voluntarios()
