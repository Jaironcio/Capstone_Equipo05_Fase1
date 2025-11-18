// ==================== SISTEMA PAGAR BENEFICIO DJANGO ====================
// Versión Django con fetch() API
const API_BASE = '/api/voluntarios';

class SistemaPagarBeneficioDjango {
    constructor() {
        this.voluntarioActual = null;
        this.asignaciones = [];
        this.asignacionActual = null;
        this.pagosRealizados = [];
        this.logoBase64 = null;
        this.init();
    }

    async init() {
        await this.cargarLogo();
        await this.cargarVoluntarioActual();
        await this.cargarAsignaciones();
        await this.cargarHistorialPagos();
        this.configurarInterfaz();
        this.renderizarTodo();
        this.actualizarResumenDeudas();
    }

    async cargarLogo() {
        try {
            const response = await fetch(`${API_BASE}/logo-simple/`);
            if (response.ok) {
                const data = await response.json();
                if (data.tiene_logo) {
                    this.logoBase64 = data.logo;
                }
            }
        } catch (error) {
            console.log('[LOGO] No disponible');
        }
    }

    async cargarVoluntarioActual() {
        const params = new URLSearchParams(window.location.search);
        const voluntarioId = params.get('id');
        
        if (!voluntarioId) {
            Utils.mostrarNotificacion('No se especificó el voluntario', 'error');
            setTimeout(() => window.location.href = 'sistema.html', 2000);
            return;
        }

        try {
            // Cargar datos del voluntario
            const response = await fetch(`${API_BASE}/${voluntarioId}/`);
            if (!response.ok) {
                throw new Error('Voluntario no encontrado');
            }
            
            this.voluntarioActual = await response.json();
            this.mostrarInfoVoluntario();
            
        } catch (error) {
            console.error('[PAGAR BENEFICIO] Error:', error);
            Utils.mostrarNotificacion(`Error: ${error.message}`, 'error');
            setTimeout(() => window.location.href = 'sistema.html', 2000);
        }
    }

    mostrarInfoVoluntario() {
        const contenedor = document.getElementById('bomberoDatosPago');
        if (!contenedor) return;
        
        // Usar nombreCompleto que ya viene calculado del serializer
        const nombreCompleto = this.voluntarioActual.nombreCompleto || 
                               `${this.voluntarioActual.primerNombre || ''} ${this.voluntarioActual.primerApellido || ''}`.trim() || 
                               'Sin nombre';
        
        // Obtener clave (camelCase)
        const clave = this.voluntarioActual.claveBombero || this.voluntarioActual.clave_bombero || this.voluntarioActual.clave || 'N/A';
        const run = this.voluntarioActual.rut || 'N/A';
        const compania = this.voluntarioActual.compania || 'Sexta Compañía De Bomberos de Puerto Montt';
        
        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> <span>${nombreCompleto}</span></div>
            <div><strong>Clave:</strong> <span>${clave}</span></div>
            <div><strong>RUN:</strong> <span>${run}</span></div>
            <div><strong>Compañía:</strong> <span>${compania}</span></div>
        `;
    }

    async cargarAsignaciones() {
        if (!this.voluntarioActual) return;
        
        try {
            const response = await fetch(`${API_BASE}/${this.voluntarioActual.id}/beneficios-asignados-simple/`);
            if (!response.ok) {
                throw new Error('Error al cargar beneficios');
            }
            
            this.asignaciones = await response.json();
            console.log('[BENEFICIOS] Cargados:', this.asignaciones);
            
        } catch (error) {
            console.error('[PAGAR BENEFICIO] Error:', error);
            Utils.mostrarNotificacion('Error al cargar beneficios', 'error');
        }
    }

    async cargarHistorialPagos() {
        if (!this.voluntarioActual) return;
        
        try {
            const response = await fetch(`${API_BASE}/pagos-beneficios/?voluntario_id=${this.voluntarioActual.id}`);
            if (!response.ok) {
                throw new Error('Error al cargar historial');
            }
            
            this.pagosRealizados = await response.json();
            console.log('[HISTORIAL] Pagos:', this.pagosRealizados);
            this.renderizarHistorialPagos();
            
        } catch (error) {
            console.error('[HISTORIAL] Error:', error);
        }
    }

    configurarInterfaz() {
        // Formulario pago normal
        const formPago = document.getElementById('formPagoBeneficio');
        if (formPago) {
            formPago.addEventListener('submit', (e) => this.manejarPagoNormal(e));
        }

        // Formulario venta extra
        const formExtra = document.getElementById('formVentaExtra');
        if (formExtra) {
            formExtra.addEventListener('submit', (e) => this.manejarVentaExtra(e));
        }

        // Formulario liberar
        const formLiberar = document.getElementById('formLiberarTarjetas');
        if (formLiberar) {
            formLiberar.addEventListener('submit', (e) => this.manejarLiberar(e));
        }

        // Calcular montos automáticamente
        const cantidadPago = document.getElementById('cantidadTarjetasPago');
        if (cantidadPago) {
            cantidadPago.addEventListener('input', () => this.calcularMontoPago());
        }

        const cantidadExtra = document.getElementById('cantidadTarjetasExtra');
        if (cantidadExtra) {
            cantidadExtra.addEventListener('input', () => this.calcularMontoExtra());
        }

        // Radio buttons de liberación
        const radiosLiberar = document.querySelectorAll('input[name="tipoLiberacion"]');
        radiosLiberar.forEach(radio => {
            radio.addEventListener('change', () => this.cambioTipoLiberacion());
        });
    }

    renderizarTodo() {
        this.renderizarListaBeneficios();
    }

    renderizarListaBeneficios() {
        const contenedor = document.getElementById('listaBeneficiosAsignados');
        if (!contenedor) return;

        if (this.asignaciones.length === 0) {
            contenedor.innerHTML = `
                <div class="mensaje-vacio">
                    <p>🎫 No hay beneficios asignados a este voluntario</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.asignaciones.forEach(asig => {
            const estadoClass = this.getEstadoClass(asig.estado_pago);
            const estadoTexto = this.getEstadoTexto(asig.estado_pago);
                        html += `
                <div class="beneficio-card ${estadoClass}" style="background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div class="beneficio-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
                        <h4 style="margin: 0; color: #333;">${asig.beneficio_nombre}</h4>
                        <span class="estado-badge estado-${asig.estado_pago}" style="padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 12px; background: ${asig.estado_pago === 'completo' ? '#28a745' : asig.estado_pago === 'parcial' ? '#ffc107' : '#dc3545'}; color: white;">${estadoTexto}</span>
                    </div>
                    
                    <div class="beneficio-body">
                        <div class="beneficio-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <span class="label" style="font-weight: 600; color: #666;">Fecha Evento:</span>
                                <span style="color: #333;">${this.formatearFecha(asig.fecha_evento)}</span>
                            </div>
                            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <span class="label" style="font-weight: 600; color: #666;">Precio Tarjeta:</span>
                                <span style="color: #333; font-weight: bold;">$${this.formatearMonto(asig.precio_tarjeta)}</span>
                            </div>
                        </div>
                        
                        <div class="tarjetas-info" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; text-align: center;">
                            <div class="tarjeta-stat" style="padding: 15px; background: #e3f2fd; border-radius: 8px;">
                                <span class="numero" style="display: block; font-size: 24px; font-weight: bold; color: #1976d2;">${asig.tarjetas_asignadas}</span>
                                <span class="label" style="display: block; font-size: 12px; color: #666; margin-top: 5px;">Asignadas</span>
                            </div>
                            <div class="tarjeta-stat vendidas" style="padding: 15px; background: #e8f5e9; border-radius: 8px;">
                                <span class="numero" style="display: block; font-size: 24px; font-weight: bold; color: #388e3c;">${asig.tarjetas_vendidas}</span>
                                <span class="label" style="display: block; font-size: 12px; color: #666; margin-top: 5px;">Vendidas</span>
                            </div>
                            <div class="tarjeta-stat extras" style="padding: 15px; background: #fff3e0; border-radius: 8px;">
                                <span class="numero" style="display: block; font-size: 24px; font-weight: bold; color: #f57c00;">${asig.tarjetas_extras_vendidas}</span>
                                <span class="label" style="display: block; font-size: 12px; color: #666; margin-top: 5px;">Pagado Extra</span>
                            </div>
                            <div class="tarjeta-stat disponibles" style="padding: 15px; background: #fce4ec; border-radius: 8px;">
                                <span class="numero" style="display: block; font-size: 24px; font-weight: bold; color: #c2185b;">${asig.tarjetas_disponibles}</span>
                                <span class="label" style="display: block; font-size: 12px; color: #666; margin-top: 5px;">Disponibles</span>
                            </div>
                        </div>
                        
                        <div class="montos-info" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <div class="monto-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                                <span class="label" style="font-weight: 600; color: #666;">Total:</span>
                                <span class="monto" style="font-weight: bold; color: #333; font-size: 16px;">$${this.formatearMonto(asig.monto_total)}</span>
                            </div>
                            <div class="monto-row pagado" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                                <span class="label" style="font-weight: 600; color: #28a745;">Pagado:</span>
                                <span class="monto" style="font-weight: bold; color: #28a745; font-size: 16px;">$${this.formatearMonto(asig.monto_pagado)}</span>
                            </div>
                            ${asig.tarjetas_extras_vendidas > 0 ? `
                                <div class="monto-row pagado-extra" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                                    <span class="label" style="font-weight: 600; color: #f57c00;">Pagado Extra:</span>
                                    <span class="monto" style="font-weight: bold; color: #f57c00; font-size: 16px;">$${this.formatearMonto(asig.tarjetas_extras_vendidas * (asig.precio_tarjeta_extra || asig.precio_tarjeta))}</span>
                                </div>
                            ` : ''}
                            <div class="monto-row pendiente" style="display: flex; justify-content: space-between; padding: 8px 0;">
                                <span class="label" style="font-weight: 600; color: #dc3545;">Pendiente:</span>
                                <span class="monto" style="font-weight: bold; color: #dc3545; font-size: 18px;">$${this.formatearMonto(asig.monto_pendiente)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="beneficio-actions" style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
                        ${asig.tarjetas_disponibles > 0 && asig.estado_pago !== 'completo' && asig.estado_pago !== 'liberado' ? `
                            <button class="btn btn-primary" onclick="pagarBeneficioSistema.abrirFormularioPago(${asig.id})" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                                💰 PAGAR
                            </button>
                        ` : ''}
                        
                        ${asig.estado_pago !== 'liberado' ? `
                            <button class="btn btn-success" onclick="pagarBeneficioSistema.abrirModalVentaExtra(${asig.id})" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                                ➕ VENTA EXTRA
                            </button>
                        ` : ''}
                        
                        ${asig.tarjetas_disponibles > 0 && asig.estado_pago !== 'liberado' && asig.estado_pago !== 'completo' ? `
                            <button class="btn btn-warning" onclick="pagarBeneficioSistema.abrirModalLiberar(${asig.id})" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #ffa751 0%, #ffe259 100%); color: #333; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                                🔓 LIBERAR
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = html;
    }

    renderizarHistorialPagos() {
        const contenedor = document.getElementById('listaPagos');
        const contador = document.getElementById('totalPagos');
        
        if (!contenedor) return;
        
        if (contador) contador.textContent = this.pagosRealizados.length;
        
        if (this.pagosRealizados.length === 0) {
            contenedor.innerHTML = `
                <div class="mensaje-vacio" style="text-align: center; padding: 40px; color: #666;">
                    <p>📝 No hay pagos registrados aún</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.pagosRealizados.forEach(pago => {
            html += `
                <div class="pago-item" style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${pago.tipo_pago === 'extra' ? '#f57c00' : '#28a745'}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h4 style="margin: 0 0 8px 0; color: #333;">${pago.beneficio_nombre || 'Beneficio'}</h4>
                            <div style="display: flex; gap: 15px; font-size: 14px; color: #666;">
                                <span>📅 ${this.formatearFecha(pago.fecha_pago)}</span>
                                <span>🎫 ${pago.cantidad_tarjetas} tarjetas</span>
                                <span>${pago.tipo_pago === 'extra' ? '➕ Extra' : '💰 Normal'}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 20px; font-weight: bold; color: #28a745;">$${this.formatearMonto(pago.monto)}</div>
                            <div style="font-size: 12px; color: #666;">${pago.metodo_pago || 'Efectivo'}</div>
                        </div>
                    </div>
                    ${pago.observaciones ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 13px; color: #666;">💬 ${pago.observaciones}</div>` : ''}
                </div>
            `;
        });
        
        contenedor.innerHTML = html;
    }

    actualizarResumenDeudas() {
        const totalBeneficios = this.asignaciones.length;
        const beneficiosPendientes = this.asignaciones.filter(a => a.estado_pago !== 'completo' && a.estado_pago !== 'liberado').length;
        const deudaTotal = this.asignaciones.reduce((sum, a) => sum + parseFloat(a.monto_pendiente), 0);

        const elemTotal = document.getElementById('totalBeneficiosPendientes');
        const elemDeuda = document.getElementById('deudaTotalBeneficios');
        
        if (elemTotal) elemTotal.textContent = beneficiosPendientes;
        if (elemDeuda) elemDeuda.textContent = `$${this.formatearMonto(deudaTotal)}`;
    }

    // ==================== PAGO NORMAL ====================
    abrirFormularioPago(asignacionId) {
        const asignacion = this.asignaciones.find(a => a.id === asignacionId);
        if (!asignacion) return;

        this.asignacionActual = asignacion;
        
        // Llenar formulario (usando IDs que existen en el HTML)
        const elemAsignacionId = document.getElementById('asignacionId');
        if (elemAsignacionId) elemAsignacionId.value = asignacion.id;
        
        // Establecer máximo de tarjetas disponibles
        const inputTarjetas = document.getElementById('tarjetasVendidas');
        if (inputTarjetas) {
            inputTarjetas.max = asignacion.tarjetas_disponibles;
            inputTarjetas.value = '';  // Limpiar el campo
        }
        
        // Limpiar otros campos
        const inputMonto = document.getElementById('montoPago');
        if (inputMonto) inputMonto.value = '';
        
        const inputFecha = document.getElementById('fechaPago');
        if (inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];
        
        const inputObs = document.getElementById('observaciones');
        if (inputObs) inputObs.value = '';
        
        // Mostrar info del beneficio en el header o donde corresponda
        console.log('[ABRIR PAGO]', {
            asignacion: asignacion.id,
            beneficio: asignacion.beneficio_nombre,
            disponibles: asignacion.tarjetas_disponibles,
            precio: asignacion.precio_tarjeta
        });
        
        // Mostrar formulario
        const formContainer = document.getElementById('formPagoContainer');
        if (formContainer) {
            formContainer.style.display = 'block';
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    calcularMontoPago() {
        const cantidad = parseInt(document.getElementById('cantidadTarjetasPago').value) || 0;
        const precio = parseFloat(this.asignacionActual?.precio_tarjeta || 0);
        const monto = cantidad * precio;
        document.getElementById('montoPagoBeneficio').value = `$${this.formatearMonto(monto)}`;
    }

    // Alias para compatibilidad con HTML
    calcularMonto() {
        if (!this.asignacionActual) {
            console.warn('[CALCULAR] No hay asignación actual');
            return;
        }
        
        // Buscar el campo de cantidad (puede tener varios nombres)
        let cantidad = 0;
        const inputCantidad = document.getElementById('tarjetasVendidas') || 
                             document.getElementById('cantidadTarjetas') || 
                             document.getElementById('cantidadTarjetasPago');
        if (inputCantidad) {
            cantidad = parseInt(inputCantidad.value) || 0;
        }
        
        const precio = parseFloat(this.asignacionActual.precio_tarjeta || 0);
        const monto = cantidad * precio;
        
        // Buscar el campo de monto (puede tener varios nombres)
        const inputMonto = document.getElementById('montoPago') || 
                          document.getElementById('montoPagoBeneficio');
        if (inputMonto) {
            inputMonto.value = monto;
        }
        
        console.log('[CALCULAR]', { 
            cantidad, 
            precio, 
            monto,
            inputEncontrado: inputCantidad?.id,
            montoEncontrado: inputMonto?.id
        });
    }

    async manejarPagoNormal(e) {
        e.preventDefault();
        
        if (!this.asignacionActual) {
            Utils.mostrarNotificacion('Error: No hay asignación seleccionada', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        const data = {
            asignacion_id: this.asignacionActual.id,
            cantidad_tarjetas: parseInt(formData.get('tarjetasVendidas') || formData.get('cantidadTarjetas') || formData.get('cantidadTarjetasPago')),
            fecha_pago: formData.get('fechaPago') || new Date().toISOString().split('T')[0],
            metodo_pago: formData.get('metodoPago') || 'Efectivo',
            observaciones: formData.get('observaciones') || ''
        };

        try {
            const response = await fetch(`${API_BASE}/pagar-beneficio-simple/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al registrar pago');
            }

            const result = await response.json();
            Utils.mostrarNotificacion(`✅ ${result.mensaje}`, 'success');
            
            // Recargar y actualizar
            await this.cargarAsignaciones();
            await this.cargarHistorialPagos();
            this.renderizarTodo();
            this.actualizarResumenDeudas();
            this.cerrarFormulario();
            
        } catch (error) {
            Utils.mostrarNotificacion(`❌ ${error.message}`, 'error');
        }
    }

    cerrarFormulario() {
        document.getElementById('formPagoContainer').style.display = 'none';
        document.getElementById('formPagoBeneficio').reset();
        this.asignacionActual = null;
    }

    // ==================== VENTA EXTRA ====================
    abrirModalVentaExtra(asignacionId) {
        const asignacion = this.asignaciones.find(a => a.id === asignacionId);
        if (!asignacion) return;

        this.asignacionActual = asignacion;
        
        // Llenar campos del modal
        const elemId = document.getElementById('ventaExtraAsignacionId');
        if (elemId) elemId.value = asignacion.id;
        
        const elemPrecio = document.getElementById('ventaExtraPrecioUnitario');
        if (elemPrecio) elemPrecio.value = asignacion.precio_tarjeta_extra || asignacion.precio_tarjeta;
        
        const elemFecha = document.getElementById('fechaVentaExtra');
        if (elemFecha) elemFecha.value = new Date().toISOString().split('T')[0];
        
        // Limpiar cantidad
        const elemCantidad = document.getElementById('cantidadTarjetasExtra');
        if (elemCantidad) elemCantidad.value = '';
        
        const elemMonto = document.getElementById('montoVentaExtra');
        if (elemMonto) elemMonto.value = '';
        
        // Mostrar info
        const infoDiv = document.getElementById('infoModalVentaExtra');
        if (infoDiv) {
            infoDiv.innerHTML = `
                <strong>Beneficio:</strong> ${asignacion.beneficio_nombre}<br>
                <strong>Precio por Tarjeta Extra:</strong> $${this.formatearMonto(asignacion.precio_tarjeta_extra || asignacion.precio_tarjeta)}<br>
                <strong>Vendidas normales:</strong> ${asignacion.tarjetas_vendidas}<br>
                <strong>Vendidas extras actuales:</strong> ${asignacion.tarjetas_extras_vendidas}
            `;
        }
        
        // Mostrar modal
        const modal = document.getElementById('modalVentaExtra');
        if (modal) modal.style.display = 'flex';
        
        console.log('[VENTA EXTRA]', {
            asignacion: asignacion.id,
            precio_extra: asignacion.precio_tarjeta_extra,
            precio_normal: asignacion.precio_tarjeta
        });
    }

    calcularMontoExtra() {
        const cantidad = parseInt(document.getElementById('cantidadTarjetasExtra').value) || 0;
        const precio = parseFloat(document.getElementById('ventaExtraPrecioUnitario').value) || 0;
        document.getElementById('montoVentaExtra').value = cantidad * precio;
    }

    async manejarVentaExtra(e) {
        e.preventDefault();
        
        if (!this.asignacionActual) {
            Utils.mostrarNotificacion('Error: No hay asignación seleccionada', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        const cantidad = parseInt(formData.get('cantidadTarjetasExtra'));
        
        if (!cantidad || cantidad <= 0) {
            Utils.mostrarNotificacion('❌ Ingresa una cantidad válida', 'error');
            return;
        }
        
        const data = {
            asignacion_id: this.asignacionActual.id,
            cantidad_tarjetas: cantidad,
            fecha_pago: formData.get('fechaVentaExtra') || new Date().toISOString().split('T')[0],
            metodo_pago: formData.get('metodoPagoExtra') || 'Efectivo',
            observaciones: formData.get('observacionesVentaExtra') || ''
        };
        
        console.log('[ENVIAR VENTA EXTRA]', data);

        try {
            const response = await fetch(`${API_BASE}/venta-extra-simple/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al registrar venta extra');
            }

            const result = await response.json();
            Utils.mostrarNotificacion(`✅ ${result.mensaje}`, 'success');
            
            await this.cargarAsignaciones();
            await this.cargarHistorialPagos();
            this.renderizarTodo();
            this.actualizarResumenDeudas();
            this.cerrarModalVentaExtra();
            
        } catch (error) {
            Utils.mostrarNotificacion(`❌ ${error.message}`, 'error');
        }
    }

    cerrarModalVentaExtra() {
        document.getElementById('modalVentaExtra').style.display = 'none';
        document.getElementById('formVentaExtra').reset();
    }

    // ==================== LIBERAR TARJETAS ====================
    abrirModalLiberar(asignacionId) {
        const asignacion = this.asignaciones.find(a => a.id === asignacionId);
        if (!asignacion) return;

        this.asignacionActual = asignacion;
        
        // Llenar campos
        const elemId = document.getElementById('liberarAsignacionId');
        if (elemId) elemId.value = asignacion.id;
        
        const elemActuales = document.getElementById('liberarTarjetasActuales');
        if (elemActuales) elemActuales.value = asignacion.tarjetas_disponibles;
        
        const elemCantidad = document.getElementById('cantidadLiberar');
        if (elemCantidad) {
            elemCantidad.max = asignacion.tarjetas_disponibles;
            elemCantidad.value = '';
        }
        
        // Reset radios a "total"
        const radioTotal = document.querySelector('input[name="tipoLiberacion"][value="total"]');
        if (radioTotal) radioTotal.checked = true;
        
        // Ocultar campo cantidad
        const grupoCantidad = document.getElementById('grupoCantidadLiberar');
        if (grupoCantidad) grupoCantidad.style.display = 'none';
        
        // Limpiar motivo
        const elemMotivo = document.getElementById('motivoLiberacion');
        if (elemMotivo) elemMotivo.value = '';
        
        // Mostrar info
        const infoDiv = document.getElementById('infoModalLiberar');
        if (infoDiv) {
            infoDiv.innerHTML = `
                <strong>Beneficio:</strong> ${asignacion.beneficio_nombre}<br>
                <strong>Tarjetas Disponibles:</strong> ${asignacion.tarjetas_disponibles}
            `;
        }
        
        // Mostrar modal
        const modal = document.getElementById('modalLiberarTarjetas');
        if (modal) modal.style.display = 'flex';
        
        console.log('[LIBERAR]', {
            asignacion: asignacion.id,
            disponibles: asignacion.tarjetas_disponibles
        });
    }

    cambioTipoLiberacion() {
        const tipo = document.querySelector('input[name="tipoLiberacion"]:checked').value;
        const grupoCantidad = document.getElementById('grupoCantidadLiberar');
        
        if (tipo === 'parcial') {
            grupoCantidad.style.display = 'block';
            document.getElementById('cantidadLiberar').required = true;
        } else {
            grupoCantidad.style.display = 'none';
            document.getElementById('cantidadLiberar').required = false;
        }
    }

    async manejarLiberar(e) {
        e.preventDefault();
        
        if (!this.asignacionActual) {
            Utils.mostrarNotificacion('Error: No hay asignación seleccionada', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        const tipo = formData.get('tipoLiberacion');
        const motivo = formData.get('motivoLiberacion');
        
        if (!motivo || motivo.trim() === '') {
            Utils.mostrarNotificacion('❌ Debes ingresar un motivo', 'error');
            return;
        }
        
        let cantidad = 0;
        if (tipo === 'parcial') {
            cantidad = parseInt(formData.get('cantidadLiberar'));
            if (!cantidad || cantidad <= 0 || cantidad > this.asignacionActual.tarjetas_disponibles) {
                Utils.mostrarNotificacion('❌ Cantidad inválida', 'error');
                return;
            }
        }
        
        const data = {
            asignacion_id: this.asignacionActual.id,
            tipo: tipo,
            cantidad: cantidad,
            motivo: motivo.trim()
        };
        
        console.log('[LIBERAR] Data:', data);

        if (!confirm(`¿Está seguro de liberar ${tipo === 'total' ? 'TODAS las' : cantidad} tarjetas?\n\nMotivo: ${motivo}`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/liberar-tarjetas-simple/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al liberar tarjetas');
            }

            const result = await response.json();
            Utils.mostrarNotificacion(`✅ ${result.mensaje}`, 'success');
            
            await this.cargarAsignaciones();
            await this.cargarHistorialPagos();
            this.renderizarTodo();
            this.actualizarResumenDeudas();
            this.cerrarModalLiberar();
            
        } catch (error) {
            Utils.mostrarNotificacion(`❌ ${error.message}`, 'error');
        }
    }

    cerrarModalLiberar() {
        document.getElementById('modalLiberarTarjetas').style.display = 'none';
        document.getElementById('formLiberarTarjetas').reset();
    }

    // ==================== UTILIDADES ====================
    getEstadoClass(estado) {
        const clases = {
            'pendiente': 'card-pendiente',
            'parcial': 'card-parcial',
            'completo': 'card-completo',
            'liberado': 'card-liberado'
        };
        return clases[estado] || '';
    }

    getEstadoTexto(estado) {
        const textos = {
            'pendiente': '⏳ Pendiente',
            'parcial': '📊 Parcial',
            'completo': '✅ Completo',
            'liberado': '🔄 Liberado'
        };
        return textos[estado] || estado;
    }

    formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-CL');
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL').format(Math.round(monto));
    }

    // ==================== PDF Y EXPORTAR ====================
    async generarPDFBeneficios() {
        if (typeof window.jspdf === 'undefined') {
            Utils.mostrarNotificacion('❌ Error: jsPDF no está disponible', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header rojo
        doc.setFillColor(196, 30, 58);
        doc.rect(0, 0, 210, 35, 'F');
        
        // Logo (si existe)
        if (this.logoBase64) {
            try {
                doc.addImage(this.logoBase64, 'PNG', 15, 8, 20, 20);
            } catch (e) {
                console.log('Error al agregar logo:', e);
            }
        }
        
        // Título
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('REPORTE DE BENEFICIOS', 105, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text('Estado de Cuenta del Voluntario', 105, 23, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 105, 30, { align: 'center' });
        
        // Recuadro info voluntario
        let y = 45;
        doc.setDrawColor(196, 30, 58);
        doc.setLineWidth(1);
        doc.rect(15, y, 180, 20);
        
        doc.setTextColor(196, 30, 58);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(this.voluntarioActual.nombreCompleto || 'N/A', 20, y + 8);
        
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Clave: ${this.voluntarioActual.claveBombero || 'N/A'}`, 20, y + 14);
        doc.text(`RUT: ${this.voluntarioActual.rut || 'N/A'}`, 80, y + 14);
        
        // Compañía con salto de línea si es muy larga
        const compania = this.voluntarioActual.compania || 'Sexta Compañía De Bomberos\nde Puerto Montt';
        const companiaLineas = doc.splitTextToSize(compania, 50);
        doc.text(companiaLineas, 140, y + 14);
        
        // Resumen general
        y = 73;
        doc.setFillColor(240, 240, 240);
        doc.rect(15, y, 180, 20, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('RESUMEN GENERAL', 20, y + 7);
        
        const beneficiosPendientes = this.asignaciones.filter(a => a.estado_pago !== 'completo' && a.estado_pago !== 'liberado').length;
        const deudaTotal = this.asignaciones.reduce((sum, a) => sum + parseFloat(a.monto_pendiente || 0), 0);
        
        // Barra beneficios pendientes (amarilla)
        doc.setFillColor(255, 193, 7);
        doc.rect(20, y + 10, 3, 6, 'F');
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Beneficios Pendientes:`, 26, y + 15);
        doc.setFont(undefined, 'bold');
        doc.text(`${beneficiosPendientes}`, 75, y + 15);
        
        // Barra deuda total (verde)
        doc.setFillColor(76, 175, 80);
        doc.rect(105, y + 10, 3, 6, 'F');
        doc.setFont(undefined, 'normal');
        doc.text(`Deuda Total:`, 111, y + 15);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(deudaTotal > 0 ? 220 : 0, deudaTotal > 0 ? 38 : 0, deudaTotal > 0 ? 38 : 0);
        doc.text(`$${this.formatearMonto(deudaTotal)}`, 140, y + 15);
        
        // Sección beneficios asignados
        y = 100;
        doc.setFillColor(196, 30, 58);
        doc.rect(15, y, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('BENEFICIOS ASIGNADOS', 105, y + 6, { align: 'center' });
        
        y = 113;
        
        // Lista de beneficios
        this.asignaciones.forEach((asig, index) => {
            if (y > 245) {
                doc.addPage();
                y = 20;
            }
            
            // Número y nombre del beneficio
            doc.setFillColor(250, 250, 250);
            doc.rect(20, y, 170, 8, 'F');
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${asig.beneficio_nombre}`, 25, y + 6);
            
            // Estado
            const estadoColor = asig.estado_pago === 'completo' ? [76, 175, 80] : 
                               asig.estado_pago === 'parcial' ? [255, 193, 7] : [220, 38, 38];
            doc.setTextColor(...estadoColor);
            doc.setFont(undefined, 'bold');
            doc.text(this.getEstadoTexto(asig.estado_pago).replace('⏳ ', '').replace('📊 ', '').replace('✅ ', '').replace('🔄 ', ''), 165, y + 6);
            
            y += 12;
            
            // Detalles del beneficio
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            
            const detalles = [
                ['Tipo:', asig.tipo_beneficio || 'Curanto'],
                ['Fecha Evento:', asig.fecha_evento ? new Date(asig.fecha_evento).toLocaleDateString('es-CL') : ''],
                ['Fecha Límite:', asig.fecha_limite_venta ? new Date(asig.fecha_limite_venta).toLocaleDateString('es-CL') : ''],
                ['Precio Tarjeta:', `$${this.formatearMonto(asig.precio_tarjeta)}`],
                ['Tarjetas Asignadas:', asig.tarjetas_asignadas.toString()],
                ['Tarjetas Vendidas:', asig.tarjetas_vendidas.toString()],
                ['Monto Pagado:', `$${this.formatearMonto(asig.monto_pagado)}`],
                ['Deuda:', `$${this.formatearMonto(asig.monto_pendiente)}`]
            ];
            
            detalles.forEach((detalle, i) => {
                if (i % 2 === 0) {
                    doc.text(`${detalle[0]}`, 30, y);
                    doc.setFont(undefined, 'bold');
                    doc.text(detalle[1], 75, y);
                    doc.setFont(undefined, 'normal');
                } else {
                    doc.text(`${detalle[0]}`, 110, y);
                    doc.setFont(undefined, 'bold');
                    if (detalle[0] === 'Deuda:') {
                        doc.setTextColor(220, 38, 38);
                    }
                    doc.text(detalle[1], 155, y);
                    doc.setTextColor(100, 100, 100);
                    doc.setFont(undefined, 'normal');
                    y += 5;
                }
            });
            
            y += 3;
        });
        
        // Sin resumen final adicional (ya está arriba)
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        }
        
        doc.save(`beneficios_${this.voluntarioActual.nombreCompleto || 'voluntario'}_${new Date().toISOString().split('T')[0]}.pdf`);
        Utils.mostrarNotificacion('✅ PDF generado exitosamente', 'success');
    }

    exportarExcel() {
        Utils.mostrarNotificacion('📊 Función de Excel en desarrollo', 'info');
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }
}

// Inicializar (nombre debe coincidir con HTML)
let pagarBeneficioSistema;
document.addEventListener('DOMContentLoaded', () => {
    pagarBeneficioSistema = new SistemaPagarBeneficioDjango();
});
