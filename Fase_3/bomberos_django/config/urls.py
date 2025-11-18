"""
URL configuration for Bomberos project - SISTEMA P6P COMPLETO
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from voluntarios import cuotas_simple_views, ciclos_cuotas_simple_views, pdf_cuotas_views, configuracion_cuotas_simple_views, estado_cuotas_simple_views, beneficios_simple_views, voluntarios_simple_views

# Helper para servir templates
def template(name):
    return TemplateView.as_view(template_name=name)

urlpatterns = [
    # ADMIN DE DJANGO
    path('admin/', admin.site.urls),
    
    # ENDPOINTS SIMPLES SIN DRF (sin autenticación) - DEBEN IR ANTES DEL INCLUDE
    path('api/voluntarios/configuracion-cuotas-simple/', configuracion_cuotas_simple_views.configuracion_cuotas_simple, name='configuracion_cuotas_simple'),
    path('api/voluntarios/pagos-cuotas-simple/', cuotas_simple_views.pagos_cuotas_simple, name='pagos_cuotas_simple_direct'),
    path('api/voluntarios/ciclos-cuotas-simple/', ciclos_cuotas_simple_views.ciclos_cuotas_simple, name='ciclos_cuotas_simple'),
    path('api/voluntarios/ciclos-cuotas-simple/<int:ciclo_id>/activar/', ciclos_cuotas_simple_views.activar_ciclo_cuota, name='activar_ciclo'),
    path('api/voluntarios/ciclos-cuotas-simple/<int:ciclo_id>/cerrar/', ciclos_cuotas_simple_views.cerrar_ciclo_cuota, name='cerrar_ciclo'),
    path('api/voluntarios/ciclos-cuotas-simple/<int:ciclo_id>/reabrir/', ciclos_cuotas_simple_views.reabrir_ciclo_cuota, name='reabrir_ciclo'),
    path('api/voluntarios/ciclos-cuotas-simple/<int:ciclo_id>/estadisticas/', ciclos_cuotas_simple_views.estadisticas_ciclo_cuota, name='estadisticas_ciclo'),
    
    # PDFs de cuotas
    path('api/voluntarios/<int:voluntario_id>/pdf-cuotas/', pdf_cuotas_views.pdf_cuotas_voluntario, name='pdf_cuotas_voluntario'),
    path('api/voluntarios/<int:voluntario_id>/pdf-cuotas/<int:anio>/', pdf_cuotas_views.pdf_cuotas_voluntario, name='pdf_cuotas_voluntario_anio'),
    path('api/voluntarios/pdf-deudores-cuotas/', pdf_cuotas_views.pdf_deudores_cuotas, name='pdf_deudores_cuotas'),
    path('api/voluntarios/pdf-deudores-cuotas/<int:anio>/', pdf_cuotas_views.pdf_deudores_cuotas, name='pdf_deudores_cuotas_anio'),
    
    # Estado de Cuotas SIMPLE - SIN DRF
    path('api/voluntarios/<int:voluntario_id>/estado-cuotas-simple/', estado_cuotas_simple_views.estado_cuotas_simple, name='estado_cuotas_simple_direct'),
    path('api/voluntarios/<int:voluntario_id>/activar-estudiante-simple/', estado_cuotas_simple_views.activar_estudiante_simple, name='activar_estudiante_simple_direct'),
    path('api/voluntarios/<int:voluntario_id>/desactivar-estudiante-simple/', estado_cuotas_simple_views.desactivar_estudiante_simple, name='desactivar_estudiante_simple_direct'),
    
    # Voluntarios SIMPLE - SIN DRF (para asistencias)
    path('api/voluntarios/lista-activos-simple/', voluntarios_simple_views.listar_voluntarios_simple, name='listar_voluntarios_simple'),
    path('api/voluntarios/<int:voluntario_id>/detalle-simple/', voluntarios_simple_views.obtener_voluntario_simple, name='obtener_voluntario_simple'),
    
    # Beneficios SIMPLE - SIN DRF
    path('api/voluntarios/logo-simple/', beneficios_simple_views.obtener_logo_simple, name='obtener_logo_simple'),
    path('api/voluntarios/beneficios/', beneficios_simple_views.listar_beneficios_simple, name='listar_beneficios_simple_direct'),
    path('api/voluntarios/asignaciones-beneficios/', beneficios_simple_views.listar_asignaciones_simple, name='listar_asignaciones_simple_direct'),
    path('api/voluntarios/crear-beneficio-simple/', beneficios_simple_views.crear_beneficio_simple, name='crear_beneficio_simple_direct'),
    path('api/voluntarios/<int:voluntario_id>/beneficios-asignados-simple/', beneficios_simple_views.beneficios_asignados_simple, name='beneficios_asignados_simple_direct'),
    path('api/voluntarios/pagar-beneficio-simple/', beneficios_simple_views.pagar_beneficio_simple, name='pagar_beneficio_simple_direct'),
    path('api/voluntarios/venta-extra-simple/', beneficios_simple_views.venta_extra_simple, name='venta_extra_simple_direct'),
    path('api/voluntarios/liberar-tarjetas-simple/', beneficios_simple_views.liberar_tarjetas_simple, name='liberar_tarjetas_simple_direct'),
    path('api/voluntarios/pagos-beneficios/', beneficios_simple_views.obtener_historial_pagos_simple, name='obtener_historial_pagos_simple'),
    
    # API REST (include de DRF)
    path('api/', include('voluntarios.urls')),
    
    # ==================== LOGIN PRIMERO ====================
    path('', template('index.html'), name='home'),
    
    # ==================== TEST DE AUTENTICACIÓN ====================
    path('test-auth.html', template('test_auth.html'), name='test_auth'),
    path('sistema-debug.html', template('sistema_debug.html'), name='sistema_debug'),
    
    # ==================== SISTEMA PRINCIPAL ====================
    path('sistema.html', template('sistema.html'), name='sistema'),
    path('dashboard.html', template('dashboard.html'), name='dashboard'),
    
    # ==================== VOLUNTARIOS ====================
    path('crear-bombero.html', template('crear-bombero.html'), name='crear_bombero'),
    path('editar-bombero.html', template('editar-bombero.html'), name='editar_bombero'),
    path('reintegracion-voluntario.html', template('reintegracion-voluntario.html'), name='reintegracion'),
    
    # ==================== ASISTENCIAS ====================
    path('asistencias.html', template('asistencias.html'), name='asistencias'),  # NUEVO MÓDULO DJANGO
    path('registro-asistencia.html', template('registro-asistencia.html'), name='registro_asistencia'),
    path('registro-asamblea.html', template('registro-asamblea.html'), name='registro_asamblea'),
    path('registro-ejercicios.html', template('registro-ejercicios.html'), name='registro_ejercicios'),
    path('registro-citaciones.html', template('registro-citaciones.html'), name='registro_citaciones'),
    path('registro-otras.html', template('registro-otras.html'), name='registro_otras'),
    path('historial-asistencias.html', template('historial-asistencias.html'), name='historial_asistencias'),
    path('historial-emergencias.html', template('historial-emergencias.html'), name='historial_emergencias'),
    path('detalle-asistencia.html', template('detalle-asistencia.html'), name='detalle_asistencia'),
    path('reporte-asistencias-individual.html', template('reporte-asistencias-individual.html'), name='reporte_asistencias'),
    
    # ==================== SANCIONES Y CARGOS ====================
    path('sanciones.html', template('sanciones.html'), name='sanciones'),
    path('listado-sanciones.html', template('listado-sanciones.html'), name='listado_sanciones'),
    path('cargos.html', template('cargos.html'), name='cargos'),
    path('registro-directorio.html', template('registro-directorio.html'), name='registro_directorio'),
    path('felicitaciones.html', template('felicitaciones.html'), name='felicitaciones'),
    
    # ==================== UNIFORMES ====================
    path('uniformes.html', template('uniformes.html'), name='uniformes'),
    path('tabla-uniformes-voluntario.html', template('tabla-uniformes-voluntario.html'), name='tabla_uniformes'),
    
    # ==================== FINANZAS ====================
    path('cuotas-beneficios.html', template('cuotas-beneficios.html'), name='cuotas_beneficios'),
    path('beneficios.html', template('beneficios.html'), name='beneficios'),
    path('pagar-beneficio.html', template('pagar-beneficio.html'), name='pagar_beneficio'),
    path('finanzas.html', template('finanzas.html'), name='finanzas'),
    path('configurar-cuotas.html', template('configurar-cuotas.html'), name='configurar_cuotas'),
    
    # ==================== ADMIN Y UTILIDADES ====================
    path('admin-ciclos.html', template('admin-ciclos.html'), name='admin_ciclos'),
    path('admin-ciclos-cuotas.html', template('admin-ciclos-cuotas.html'), name='admin_ciclos_cuotas'),
    path('tipos-asistencia.html', template('tipos-asistencia.html'), name='tipos_asistencia'),
    path('generar-datos-prueba.html', template('generar-datos-prueba.html'), name='generar_datos'),
    path('limpiar-datos.html', template('limpiar-datos.html'), name='limpiar_datos'),
    path('debug-bomberos.html', template('debug-bomberos.html'), name='debug_bomberos'),
    path('limpiar-ejemplos.html', template('limpiar-ejemplos.html'), name='limpiar_ejemplos'),
    path('arreglar-ids-duplicados.html', template('arreglar-ids-duplicados.html'), name='arreglar_ids'),
    path('arreglar-nombres.html', template('arreglar-nombres.html'), name='arreglar_nombres'),
    path('limpiar-cargos-duplicados.html', template('limpiar-cargos-duplicados.html'), name='limpiar_cargos'),
    path('verificar-asignaciones.html', template('verificar-asignaciones.html'), name='verificar_asignaciones'),
    path('reasignar-beneficios-manual.html', template('reasignar-beneficios-manual.html'), name='reasignar_beneficios'),
    path('test-ranking-externos.html', template('test-ranking-externos.html'), name='test_ranking'),
]

# Servir archivos estáticos en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0] if settings.STATICFILES_DIRS else settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
