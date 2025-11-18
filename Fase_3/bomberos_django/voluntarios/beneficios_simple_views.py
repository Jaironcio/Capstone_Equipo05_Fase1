"""
Vistas SIMPLES para beneficios (sin DRF, sin autenticación)
Para desarrollo y pruebas rápidas
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import json
from datetime import datetime

from .models import Voluntario, Beneficio, AsignacionBeneficio, PagoBeneficio, MovimientoFinanciero, LogoCompania
from dateutil.relativedelta import relativedelta
from .serializers import PagoBeneficioSerializer


@csrf_exempt
@require_http_methods(["GET"])
def obtener_logo_simple(request):
    """
    Obtener logo de la compañía en base64 para PDFs
    GET /api/voluntarios/logo-simple/
    """
    try:
        logo = LogoCompania.objects.filter(usar_en_pdfs=True).first()
        if logo and logo.imagen:
            return JsonResponse({
                'logo': logo.imagen,
                'tiene_logo': True
            }, status=200)
        else:
            return JsonResponse({
                'logo': None,
                'tiene_logo': False
            }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e), 'tiene_logo': False}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def listar_beneficios_simple(request):
    """
    Listar todos los beneficios
    GET /api/voluntarios/beneficios-simple/
    """
    try:
        beneficios = Beneficio.objects.all().order_by('-fecha_evento')
        
        data = []
        for beneficio in beneficios:
            data.append({
                'id': beneficio.id,
                'nombre': beneficio.nombre,
                'descripcion': beneficio.descripcion,
                'fecha_evento': beneficio.fecha_evento.isoformat(),
                'precio_por_tarjeta': float(beneficio.precio_por_tarjeta),
                'precio_tarjeta_extra': float(beneficio.precio_tarjeta_extra),
                'tarjetas_voluntarios': beneficio.tarjetas_voluntarios,
                'tarjetas_honorarios_cia': beneficio.tarjetas_honorarios_cia,
                'tarjetas_honorarios_cuerpo': beneficio.tarjetas_honorarios_cuerpo,
                'tarjetas_insignes': beneficio.tarjetas_insignes,
                'estado': beneficio.estado,
                'created_at': beneficio.created_at.isoformat() if beneficio.created_at else None
            })
        
        return JsonResponse(data, safe=False, status=200)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def listar_asignaciones_simple(request):
    """
    Listar todas las asignaciones de beneficios
    GET /api/voluntarios/asignaciones-beneficios-simple/
    """
    try:
        asignaciones = AsignacionBeneficio.objects.select_related('beneficio', 'voluntario').all()
        
        data = []
        for asig in asignaciones:
            data.append({
                'id': asig.id,
                'beneficio': asig.beneficio.id,
                'beneficio_nombre': asig.beneficio.nombre,
                'voluntario': asig.voluntario.id,
                'voluntario_nombre': f"{asig.voluntario.nombre} {asig.voluntario.apellido_paterno}",
                'tarjetas_asignadas': asig.tarjetas_asignadas,
                'tarjetas_vendidas': asig.tarjetas_vendidas,
                'tarjetas_extras_vendidas': asig.tarjetas_extras_vendidas,
                'tarjetas_liberadas': asig.tarjetas_liberadas,
                'tarjetas_disponibles': asig.tarjetas_disponibles,
                'monto_total': float(asig.monto_total),
                'monto_pagado': float(asig.monto_pagado),
                'monto_pendiente': float(asig.monto_pendiente),
                'estado_pago': asig.estado_pago
            })
        
        return JsonResponse(data, safe=False, status=200)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def crear_beneficio_simple(request):
    """
    Crear beneficio CON asignaciones automáticas a todos los voluntarios
    POST /api/voluntarios/crear-beneficio-simple/
    
    Body JSON:
    {
        "nombre": "Curanto Junio 2025",
        "descripcion": "...",
        "fecha_evento": "2025-06-15",
        "precio_tarjeta": 5000,
        "tarjetas_voluntarios": 8,
        "tarjetas_honorarios_cia": 5,
        "tarjetas_honorarios_cuerpo": 3,
        "tarjetas_insignes": 2
    }
    """
    try:
        data = json.loads(request.body)
        
        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        fecha_evento_str = data.get('fecha_evento')
        precio_tarjeta = Decimal(data.get('precio_tarjeta', 0))
        
        tarjetas_voluntarios = int(data.get('tarjetas_voluntarios', 8))
        tarjetas_honorarios_cia = int(data.get('tarjetas_honorarios_cia', 5))
        tarjetas_honorarios_cuerpo = int(data.get('tarjetas_honorarios_cuerpo', 3))
        tarjetas_insignes = int(data.get('tarjetas_insignes', 2))
        
        if not nombre or not fecha_evento_str or precio_tarjeta <= 0:
            return JsonResponse({'error': 'Datos incompletos'}, status=400)
        
        # Convertir fecha
        fecha_evento = datetime.strptime(fecha_evento_str, '%Y-%m-%d').date()
        
        with transaction.atomic():
            # 1. Crear beneficio
            beneficio = Beneficio.objects.create(
                nombre=nombre,
                descripcion=descripcion,
                fecha_evento=fecha_evento,
                tarjetas_voluntarios=tarjetas_voluntarios,
                tarjetas_honorarios_cia=tarjetas_honorarios_cia,
                tarjetas_honorarios_cuerpo=tarjetas_honorarios_cuerpo,
                tarjetas_insignes=tarjetas_insignes,
                precio_por_tarjeta=precio_tarjeta,
                precio_tarjeta_extra=precio_tarjeta,
                estado='activo'
            )
            
            # 2. Obtener TODOS los voluntarios activos
            voluntarios = Voluntario.objects.filter(
                estado_bombero='activo'
            )
            
            asignaciones_creadas = 0
            
            # 3. Crear asignación para cada voluntario según su categoría
            for voluntario in voluntarios:
                # Calcular antigüedad en años
                hoy = timezone.now().date()
                antiguedad = relativedelta(hoy, voluntario.fecha_ingreso).years
                
                # Determinar tarjetas según antiguedad
                if antiguedad >= 50:
                    tarjetas = tarjetas_insignes  # Insigne 50+ años
                elif antiguedad >= 25:
                    tarjetas = tarjetas_honorarios_cuerpo  # Honorario Cuerpo 25-49
                elif antiguedad >= 20:
                    tarjetas = tarjetas_honorarios_cia  # Honorario Compañía 20-24
                else:
                    tarjetas = tarjetas_voluntarios  # Voluntario 0-19
                
                # Calcular monto total
                monto_total = Decimal(tarjetas) * precio_tarjeta
                
                # Crear asignación
                AsignacionBeneficio.objects.create(
                    beneficio=beneficio,
                    voluntario=voluntario,
                    tarjetas_asignadas=tarjetas,
                    monto_total=monto_total,
                    monto_pendiente=monto_total,
                    estado_pago='pendiente'
                )
                
                asignaciones_creadas += 1
        
        return JsonResponse({
            'mensaje': 'Beneficio creado exitosamente con asignaciones automáticas',
            'beneficio_id': beneficio.id,
            'nombre': beneficio.nombre,
            'asignaciones_creadas': asignaciones_creadas,
            'voluntarios_asignados': asignaciones_creadas
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def beneficios_asignados_simple(request, voluntario_id):
    """
    Obtener beneficios asignados a un voluntario
    GET /api/voluntarios/<id>/beneficios-asignados-simple/
    """
    try:
        voluntario = Voluntario.objects.get(id=voluntario_id)
    except Voluntario.DoesNotExist:
        return JsonResponse({'error': 'Voluntario no encontrado'}, status=404)
    
    # Obtener asignaciones con beneficio activo
    asignaciones = AsignacionBeneficio.objects.filter(
        voluntario=voluntario,
        beneficio__estado='activo'
    ).select_related('beneficio').order_by('-beneficio__fecha_evento')
    
    data = []
    for asig in asignaciones:
        data.append({
            'id': asig.id,
            'beneficio_id': asig.beneficio.id,
            'beneficio_nombre': asig.beneficio.nombre,
            'beneficio_descripcion': asig.beneficio.descripcion,
            'fecha_evento': asig.beneficio.fecha_evento.isoformat(),
            'precio_tarjeta': float(asig.beneficio.precio_por_tarjeta),
            'precio_tarjeta_extra': float(asig.beneficio.precio_tarjeta_extra),
            'tarjetas_asignadas': asig.tarjetas_asignadas,
            'tarjetas_vendidas': asig.tarjetas_vendidas,
            'tarjetas_extras_vendidas': asig.tarjetas_extras_vendidas,
            'tarjetas_liberadas': asig.tarjetas_liberadas,
            'tarjetas_disponibles': asig.tarjetas_disponibles,
            'monto_total': float(asig.monto_total),
            'monto_pagado': float(asig.monto_pagado),
            'monto_pendiente': float(asig.monto_pendiente),
            'estado_pago': asig.estado_pago,
        })
    
    return JsonResponse(data, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def pagar_beneficio_simple(request):
    """
    Registrar pago de beneficio (tarjetas normales)
    POST /api/voluntarios/pagar-beneficio-simple/
    
    Body JSON:
    {
        "asignacion_id": 1,
        "cantidad_tarjetas": 3,
        "fecha_pago": "2025-11-17",
        "metodo_pago": "Efectivo",
        "observaciones": "..."
    }
    """
    try:
        data = json.loads(request.body)
        asignacion_id = data.get('asignacion_id')
        cantidad_tarjetas = int(data.get('cantidad_tarjetas', 0))
        fecha_pago = data.get('fecha_pago')
        metodo_pago = data.get('metodo_pago', '')
        observaciones = data.get('observaciones', '')
        
        if not asignacion_id or cantidad_tarjetas <= 0:
            return JsonResponse({'error': 'Datos incompletos'}, status=400)
        
        try:
            asignacion = AsignacionBeneficio.objects.select_related('beneficio', 'voluntario').get(id=asignacion_id)
        except AsignacionBeneficio.DoesNotExist:
            return JsonResponse({'error': 'Asignación no encontrada'}, status=404)
        
        # Validar tarjetas disponibles
        if cantidad_tarjetas > asignacion.tarjetas_disponibles:
            return JsonResponse({
                'error': f'No hay suficientes tarjetas disponibles. Disponibles: {asignacion.tarjetas_disponibles}'
            }, status=400)
        
        with transaction.atomic():
            # Calcular monto
            monto = Decimal(cantidad_tarjetas) * asignacion.beneficio.precio_por_tarjeta
            
            # Crear pago
            pago = PagoBeneficio.objects.create(
                asignacion=asignacion,
                tipo_pago='normal',
                cantidad_tarjetas=cantidad_tarjetas,
                fecha_pago=fecha_pago or timezone.now().date(),
                monto=monto,
                metodo_pago=metodo_pago,
                observaciones=observaciones
            )
            
            # Actualizar asignación
            asignacion.tarjetas_vendidas += cantidad_tarjetas
            asignacion.monto_pagado += monto
            asignacion.monto_pendiente = asignacion.monto_total - asignacion.monto_pagado
            
            # Actualizar estado
            if asignacion.monto_pagado >= asignacion.monto_total:
                asignacion.estado_pago = 'completo'
            elif asignacion.monto_pagado > 0:
                asignacion.estado_pago = 'parcial'
            
            asignacion.save()
            
            # Crear movimiento financiero
            MovimientoFinanciero.objects.create(
                tipo='ingreso',
                categoria='Pago de Beneficio',
                monto=monto,
                descripcion=f"Pago beneficio: {asignacion.beneficio.nombre} - {asignacion.voluntario.nombre} {asignacion.voluntario.apellido_paterno}",
                fecha=fecha_pago or timezone.now().date()
            )
        
        return JsonResponse({
            'mensaje': 'Pago registrado exitosamente',
            'pago_id': pago.id,
            'monto': float(monto),
            'tarjetas_vendidas': asignacion.tarjetas_vendidas,
            'tarjetas_disponibles': asignacion.tarjetas_disponibles,
            'monto_pagado_total': float(asignacion.monto_pagado),
            'monto_pendiente': float(asignacion.monto_pendiente),
            'estado_pago': asignacion.estado_pago
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def venta_extra_simple(request):
    """
    Registrar venta extra (más allá de tarjetas asignadas)
    POST /api/voluntarios/venta-extra-simple/
    
    Body JSON:
    {
        "asignacion_id": 1,
        "cantidad_tarjetas": 2,
        "fecha_pago": "2025-11-17",
        "metodo_pago": "Efectivo",
        "observaciones": "..."
    }
    """
    try:
        data = json.loads(request.body)
        asignacion_id = data.get('asignacion_id')
        cantidad_tarjetas = int(data.get('cantidad_tarjetas', 0))
        fecha_pago = data.get('fecha_pago')
        metodo_pago = data.get('metodo_pago', '')
        observaciones = data.get('observaciones', '')
        
        if not asignacion_id or cantidad_tarjetas <= 0:
            return JsonResponse({'error': 'Datos incompletos'}, status=400)
        
        try:
            asignacion = AsignacionBeneficio.objects.select_related('beneficio', 'voluntario').get(id=asignacion_id)
        except AsignacionBeneficio.DoesNotExist:
            return JsonResponse({'error': 'Asignación no encontrada'}, status=404)
        
        with transaction.atomic():
            # Usar precio de tarjeta extra
            monto = Decimal(cantidad_tarjetas) * asignacion.beneficio.precio_tarjeta_extra
            
            # Crear pago extra
            pago = PagoBeneficio.objects.create(
                asignacion=asignacion,
                tipo_pago='extra',
                cantidad_tarjetas=cantidad_tarjetas,
                fecha_pago=fecha_pago or timezone.now().date(),
                monto=monto,
                metodo_pago=metodo_pago,
                observaciones=observaciones
            )
            
            # Actualizar asignación
            asignacion.tarjetas_extras_vendidas += cantidad_tarjetas
            asignacion.monto_pagado += monto
            asignacion.save()
            
            # Crear movimiento financiero
            MovimientoFinanciero.objects.create(
                tipo='ingreso',
                categoria='Venta Extra Beneficio',
                monto=monto,
                descripcion=f"Venta extra: {asignacion.beneficio.nombre} - {asignacion.voluntario.nombre} {asignacion.voluntario.apellido_paterno}",
                fecha=fecha_pago or timezone.now().date()
            )
        
        return JsonResponse({
            'mensaje': 'Venta extra registrada exitosamente',
            'pago_id': pago.id,
            'monto': float(monto),
            'tarjetas_extras_vendidas': asignacion.tarjetas_extras_vendidas,
            'total_tarjetas_vendidas': asignacion.total_tarjetas_vendidas,
            'monto_pagado_total': float(asignacion.monto_pagado)
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def liberar_tarjetas_simple(request):
    """
    Liberar tarjetas (parcial o total)
    POST /api/voluntarios/liberar-tarjetas-simple/
    
    Body JSON:
    {
        "asignacion_id": 1,
        "tipo": "total" o "parcial",
        "cantidad": 3 (si parcial),
        "motivo": "..."
    }
    """
    try:
        data = json.loads(request.body)
        asignacion_id = data.get('asignacion_id')
        tipo = data.get('tipo', 'total')
        cantidad = int(data.get('cantidad', 0)) if tipo == 'parcial' else 0
        motivo = data.get('motivo', '')
        
        if not asignacion_id or not motivo:
            return JsonResponse({'error': 'Datos incompletos'}, status=400)
        
        try:
            asignacion = AsignacionBeneficio.objects.select_related('beneficio', 'voluntario').get(id=asignacion_id)
        except AsignacionBeneficio.DoesNotExist:
            return JsonResponse({'error': 'Asignación no encontrada'}, status=404)
        
        with transaction.atomic():
            if tipo == 'total':
                cantidad = asignacion.tarjetas_disponibles
            elif cantidad > asignacion.tarjetas_disponibles:
                return JsonResponse({
                    'error': f'No hay suficientes tarjetas disponibles. Disponibles: {asignacion.tarjetas_disponibles}'
                }, status=400)
            
            # Actualizar asignación
            asignacion.tarjetas_liberadas += cantidad
            monto_liberado = Decimal(cantidad) * asignacion.beneficio.precio_por_tarjeta
            asignacion.monto_total -= monto_liberado
            asignacion.monto_pendiente = asignacion.monto_total - asignacion.monto_pagado
            
            # Actualizar estado
            if asignacion.tarjetas_disponibles == 0:
                if asignacion.tarjetas_asignadas == asignacion.tarjetas_liberadas:
                    asignacion.estado_pago = 'liberado'
                elif asignacion.monto_pagado >= asignacion.monto_total:
                    asignacion.estado_pago = 'completo'
            
            # Guardar historial
            import json as json_lib
            historial = json_lib.loads(asignacion.historial_liberaciones or '[]')
            historial.append({
                'fecha': timezone.now().isoformat(),
                'tipo': tipo,
                'cantidad': cantidad,
                'motivo': motivo
            })
            asignacion.historial_liberaciones = json_lib.dumps(historial)
            
            asignacion.save()
        
        return JsonResponse({
            'mensaje': 'Tarjetas liberadas exitosamente',
            'cantidad_liberada': cantidad,
            'tarjetas_liberadas_total': asignacion.tarjetas_liberadas,
            'tarjetas_disponibles': asignacion.tarjetas_disponibles,
            'monto_total': float(asignacion.monto_total),
            'monto_pendiente': float(asignacion.monto_pendiente),
            'estado_pago': asignacion.estado_pago
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def obtener_historial_pagos_simple(request):
    """
    Obtener historial de pagos de beneficios de un voluntario
    GET /api/voluntarios/pagos-beneficios/?voluntario_id=X
    """
    try:
        voluntario_id = request.GET.get('voluntario_id')
        
        if not voluntario_id:
            return JsonResponse({'error': 'Se requiere voluntario_id'}, status=400)
        
        # Obtener pagos del voluntario
        pagos = PagoBeneficio.objects.filter(
            asignacion__voluntario_id=voluntario_id
        ).select_related(
            'asignacion',
            'asignacion__beneficio',
            'asignacion__voluntario'
        ).order_by('-fecha_pago')
        
        # Serializar
        pagos_data = []
        for pago in pagos:
            pagos_data.append({
                'id': pago.id,
                'beneficio_nombre': pago.asignacion.beneficio.nombre,
                'cantidad_tarjetas': pago.cantidad_tarjetas,
                'monto': float(pago.monto),
                'fecha_pago': pago.fecha_pago.isoformat() if pago.fecha_pago else None,
                'metodo_pago': pago.metodo_pago or 'Efectivo',
                'tipo_pago': pago.tipo_pago or 'normal',
                'observaciones': pago.observaciones or ''
            })
        
        return JsonResponse(pagos_data, safe=False, status=200)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
