"""
Vista SIMPLE sin DRF para pagos de cuotas
IMPORTANTE: Este endpoint NO requiere autenticación ni CSRF
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.db import transaction
from decimal import Decimal
import json
from .models import PagoCuota, Voluntario, MovimientoFinanciero
from django.contrib.auth.models import User

# DESACTIVAR CSRF para desarrollo
@csrf_exempt
@require_http_methods(["GET", "POST"])
def pagos_cuotas_simple(request):
    """
    Endpoint SIMPLE para pagos de cuotas
    SIN autenticación requerida (desarrollo)
    """
    
    if request.method == 'GET':
        # Obtener parámetros de filtro
        voluntario_id = request.GET.get('voluntario_id')
        anio = request.GET.get('anio')
        
        # Filtrar pagos
        pagos = PagoCuota.objects.all()
        if voluntario_id:
            pagos = pagos.filter(voluntario_id=voluntario_id)
        if anio:
            pagos = pagos.filter(anio=anio)
        
        # Convertir a lista de diccionarios
        data = []
        for pago in pagos:
            data.append({
                'id': pago.id,
                'voluntario': pago.voluntario_id,
                'mes': pago.mes,
                'anio': pago.anio,
                'monto': float(pago.monto_pagado),
                'fecha_pago': str(pago.fecha_pago),
                'metodo_pago': pago.metodo_pago,
                'observaciones': pago.observaciones or ''
            })
        
        return JsonResponse({'results': data}, safe=False)
    
    elif request.method == 'POST':
        try:
            # Leer datos del request
            data = json.loads(request.body)
            
            # Obtener voluntario
            voluntario = Voluntario.objects.get(id=data['voluntario_id'])
            
            # Usar transacción atómica para crear pago + movimiento
            with transaction.atomic():
                # Crear el pago
                pago = PagoCuota.objects.create(
                    voluntario=voluntario,
                    mes=data['mes'],
                    anio=data['anio'],
                    monto_pagado=data['monto'],
                    fecha_pago=data['fecha_pago'],
                    metodo_pago=data.get('metodo_pago', 'Efectivo'),
                    numero_comprobante=data.get('numero_comprobante', ''),
                    observaciones=data.get('observaciones', ''),
                    created_by=None  # Sin usuario por ahora
                )
                
                # Crear MovimientoFinanciero (INGRESO)
                MovimientoFinanciero.objects.create(
                    tipo='ingreso',
                    categoria='cuota',
                    monto=Decimal(str(data['monto'])),
                    fecha=data['fecha_pago'],
                    descripcion=f"Cuota social {data['mes']}/{data['anio']} - {voluntario.nombre} {voluntario.apellido_paterno}",
                    pago_cuota=pago
                )
            
            # Retornar el pago creado
            return JsonResponse({
                'id': pago.id,
                'voluntario': pago.voluntario_id,
                'mes': pago.mes,
                'anio': pago.anio,
                'monto': float(pago.monto_pagado),
                'fecha_pago': str(pago.fecha_pago),
                'metodo_pago': pago.metodo_pago,
                'observaciones': pago.observaciones or '',
                'movimiento_creado': True
            }, status=201)
            
        except Voluntario.DoesNotExist:
            return JsonResponse({'error': 'Voluntario no encontrado'}, status=404)
        except KeyError as e:
            return JsonResponse({'error': f'Falta el campo: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
