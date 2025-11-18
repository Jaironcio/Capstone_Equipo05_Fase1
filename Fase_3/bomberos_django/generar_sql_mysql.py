"""
Script para generar el SQL completo de MySQL para el sistema de bomberos
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command
from io import StringIO

# Generar SQL para todas las migrations
output = StringIO()

print("=" * 80)
print("SQL COMPLETO PARA MYSQL - SISTEMA DE BOMBEROS")
print("=" * 80)
print("\n-- NOTA: Este SQL está generado desde las migrations de Django")
print("-- Ejecutar en orden para crear la base de datos completa\n")

# Lista de migrations en orden
migrations = [
    '0001_initial',
    '0002_voluntarioexterno_cicloasistencia_eventoasistencia_and_more',
    '0003_alter_voluntario_apellido_paterno_and_more',
    '0004_cicloasistencia_anio_cicloasistencia_ciclo_activo_and_more',
    '0005_alter_eventoasistencia_unique_together',
    '0006_alter_cicloasistencia_options_and_more',
    '0007_cicloasistencia_duracion_estimada_dias',
    '0008_remove_cicloasistencia_ciclo_activo',
    '0009_estadocuotasbombero_alter_cargo_options_and_more',
    '0010_alter_estadocuotasbombero_options_and_more',
    '0011_alter_pagocuota_unique_together_and_more',
    '0012_nuevo_sistema_uniformes',
    '0013_sistema_tesoreria_completo',
    '0014_ciclocuotas'
]

try:
    # Generar SQL para cada migration
    for migration in migrations:
        print(f"\n-- ============================================================")
        print(f"-- MIGRATION: {migration}")
        print(f"-- ============================================================\n")
        
        try:
            output = StringIO()
            call_command('sqlmigrate', 'voluntarios', migration, stdout=output, database='default')
            sql = output.getvalue()
            
            # Convertir de SQLite a MySQL
            sql = sql.replace('integer NOT NULL PRIMARY KEY AUTOINCREMENT', 'INT AUTO_INCREMENT PRIMARY KEY')
            sql = sql.replace('integer NOT NULL', 'INT NOT NULL')
            sql = sql.replace('integer NULL', 'INT NULL')
            sql = sql.replace('integer', 'INT')
            sql = sql.replace('bigint', 'BIGINT')
            sql = sql.replace('varchar', 'VARCHAR')
            sql = sql.replace('text', 'TEXT')
            sql = sql.replace('datetime', 'DATETIME')
            sql = sql.replace('date', 'DATE')
            sql = sql.replace('bool', 'BOOLEAN')
            sql = sql.replace('decimal', 'DECIMAL(10,2)')
            sql = sql.replace('DEFERRABLE INITIALLY DEFERRED', '')
            sql = sql.replace('BEGIN;', 'START TRANSACTION;')
            sql = sql.replace('COMMIT;', 'COMMIT;')
            sql = sql.replace('"', '`')
            
            print(sql)
        except Exception as e:
            print(f"-- ERROR en {migration}: {str(e)}")
            
except Exception as e:
    print(f"\n-- ERROR GENERAL: {str(e)}")

print("\n" + "=" * 80)
print("FIN DEL SCRIPT SQL")
print("=" * 80)
