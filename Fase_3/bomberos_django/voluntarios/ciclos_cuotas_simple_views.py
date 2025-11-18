"""
Vista SIMPLE sin DRF para ciclos de cuotas
IMPORTANTE: Este endpoint NO requiere autenticación ni CSRF
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json
from .models import CicloCuotas, PagoCuota, Voluntario
from django.db.models import Sum
from decimal import Decimal

@csrf_exempt
@require_http_methods(["GET", "POST"])
def ciclos_cuotas_simple(request):
    """
    Endpoint SIMPLE para gestión de ciclos de cuotas
    GET: Listar ciclos
    POST: Crear nuevo ciclo
    """
    
    if request.method == 'GET':
        # Filtros opcionales
        activo = request.GET.get('activo')
        cerrado = request.GET.get('cerrado')
        anio = request.GET.get('anio')
        
        # Obtener ciclos
        ciclos = CicloCuotas.objects.all()
        
        if activo is not None:
            ciclos = ciclos.filter(activo=activo.lower() == 'true')
        if cerrado is not None:
            ciclos = ciclos.filter(cerrado=cerrado.lower() == 'true')
        if anio:
            ciclos = ciclos.filter(anio=anio)
        
        # Convertir a lista
        data = []
        for ciclo in ciclos.order_by('-anio'):
            # Calcular estadísticas
            pagos = PagoCuota.objects.filter(anio=ciclo.anio)
            total_pagos = pagos.count()
            total_recaudado = pagos.aggregate(total=Sum('monto_pagado'))['total'] or Decimal('0')
            
            data.append({
                'id': ciclo.id,
                'anio': ciclo.anio,
                'fecha_inicio': str(ciclo.fecha_inicio),
                'fecha_fin': str(ciclo.fecha_fin),
                'activo': ciclo.activo,
                'cerrado': ciclo.cerrado,
                'precio_cuota_regular': float(ciclo.precio_cuota_regular),
                'precio_cuota_estudiante': float(ciclo.precio_cuota_estudiante),
                'observaciones': ciclo.observaciones or '',
                'fecha_creacion': ciclo.fecha_creacion.isoformat(),
                'fecha_cierre': ciclo.fecha_cierre.isoformat() if ciclo.fecha_cierre else None,
                'total_pagos': total_pagos,
                'total_recaudado': float(total_recaudado)
            })
        
        return JsonResponse(data, safe=False)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validar campos requeridos
            if 'anio' not in data:
                return JsonResponse({'error': 'El año es requerido'}, status=400)
            
            # Verificar si ya existe un ciclo para ese año
            if CicloCuotas.objects.filter(anio=data['anio']).exists():
                return JsonResponse({'error': f'Ya existe un ciclo para el año {data["anio"]}'}, status=400)
            
            # Si se marca como activo, desactivar los demás
            if data.get('activo', False):
                CicloCuotas.objects.filter(activo=True).update(activo=False)
            
            # Obtener precios de la configuración si no se especifican
            from .models import ConfiguracionCuotas
            config = ConfiguracionCuotas.objects.first()
            
            precio_regular = data.get('precio_cuota_regular')
            precio_estudiante = data.get('precio_cuota_estudiante')
            
            # Si no se especifican, tomar de la configuración
            if precio_regular is None and config:
                precio_regular = config.precio_regular
            elif precio_regular is None:
                precio_regular = 5000
                
            if precio_estudiante is None and config:
                precio_estudiante = config.precio_estudiante
            elif precio_estudiante is None:
                precio_estudiante = 3000
            
            # Crear ciclo
            ciclo = CicloCuotas.objects.create(
                anio=data['anio'],
                fecha_inicio=data['fecha_inicio'],
                fecha_fin=data['fecha_fin'],
                activo=data.get('activo', True),
                precio_cuota_regular=precio_regular,
                precio_cuota_estudiante=precio_estudiante,
                observaciones=data.get('observaciones', '')
            )
            
            # Retornar ciclo creado
            return JsonResponse({
                'id': ciclo.id,
                'anio': ciclo.anio,
                'fecha_inicio': str(ciclo.fecha_inicio),
                'fecha_fin': str(ciclo.fecha_fin),
                'activo': ciclo.activo,
                'cerrado': ciclo.cerrado,
                'precio_cuota_regular': float(ciclo.precio_cuota_regular),
                'precio_cuota_estudiante': float(ciclo.precio_cuota_estudiante),
                'observaciones': ciclo.observaciones or '',
                'fecha_creacion': ciclo.fecha_creacion.isoformat(),
                'total_pagos': 0,
                'total_recaudado': 0
            }, status=201)
            
        except KeyError as e:
            return JsonResponse({'error': f'Falta el campo: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def activar_ciclo_cuota(request, ciclo_id):
    """Activa un ciclo y desactiva los demás"""
    try:
        ciclo = CicloCuotas.objects.get(id=ciclo_id)
        
        # Desactivar todos los demás
        CicloCuotas.objects.exclude(id=ciclo_id).update(activo=False)
        
        # Activar este
        ciclo.activo = True
        ciclo.save()
        
        return JsonResponse({
            'id': ciclo.id,
            'anio': ciclo.anio,
            'activo': ciclo.activo,
            'mensaje': f'Ciclo {ciclo.anio} activado exitosamente'
        })
    except CicloCuotas.DoesNotExist:
        return JsonResponse({'error': 'Ciclo no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def cerrar_ciclo_cuota(request, ciclo_id):
    """Cierra un ciclo (no se pueden registrar más pagos)"""
    try:
        ciclo = CicloCuotas.objects.get(id=ciclo_id)
        
        if ciclo.cerrado:
            return JsonResponse({'error': 'El ciclo ya está cerrado'}, status=400)
        
        # Cerrar ciclo
        ciclo.cerrado = True
        ciclo.fecha_cierre = timezone.now()
        ciclo.activo = False
        ciclo.save()
        
        return JsonResponse({
            'id': ciclo.id,
            'anio': ciclo.anio,
            'cerrado': ciclo.cerrado,
            'fecha_cierre': ciclo.fecha_cierre.isoformat(),
            'mensaje': f'Ciclo {ciclo.anio} cerrado exitosamente'
        })
    except CicloCuotas.DoesNotExist:
        return JsonResponse({'error': 'Ciclo no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def reabrir_ciclo_cuota(request, ciclo_id):
    """Reabre un ciclo cerrado"""
    try:
        ciclo = CicloCuotas.objects.get(id=ciclo_id)
        
        ciclo.cerrado = False
        ciclo.fecha_cierre = None
        ciclo.save()
        
        return JsonResponse({
            'id': ciclo.id,
            'anio': ciclo.anio,
            'cerrado': ciclo.cerrado,
            'mensaje': f'Ciclo {ciclo.anio} reabierto exitosamente'
        })
    except CicloCuotas.DoesNotExist:
        return JsonResponse({'error': 'Ciclo no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def estadisticas_ciclo_cuota(request, ciclo_id):
    """Obtiene estadísticas detalladas del ciclo"""
    try:
        ciclo = CicloCuotas.objects.get(id=ciclo_id)
        
        # Pagos del año
        pagos = PagoCuota.objects.filter(anio=ciclo.anio)
        
        total_pagos = pagos.count()
        total_recaudado = pagos.aggregate(total=Sum('monto_pagado'))['total'] or Decimal('0')
        
        # Voluntarios únicos que pagaron
        voluntarios_pagaron = pagos.values('voluntario').distinct().count()
        
        # Total de voluntarios activos (que deberían pagar)
        voluntarios_activos = Voluntario.objects.filter(estado_bombero='activo').count()
        
        porcentaje = round((voluntarios_pagaron / voluntarios_activos * 100), 2) if voluntarios_activos > 0 else 0
        
        return JsonResponse({
            'ciclo': {
                'id': ciclo.id,
                'anio': ciclo.anio,
                'activo': ciclo.activo,
                'cerrado': ciclo.cerrado
            },
            'total_pagos': total_pagos,
            'total_recaudado': float(total_recaudado),
            'voluntarios_que_pagaron': voluntarios_pagaron,
            'voluntarios_activos': voluntarios_activos,
            'porcentaje_cumplimiento': porcentaje
        })
    except CicloCuotas.DoesNotExist:
        return JsonResponse({'error': 'Ciclo no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
