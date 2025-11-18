// ==================== SISTEMA DE PAGO DE BENEFICIOS ====================
class SistemaPagarBeneficio {
    constructor() {
        this.bomberoActual = null;
        this.asignaciones = [];
        this.beneficios = [];
        this.pagosBeneficios = [];
        this.asignacionActual = null;
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        await this.cargarBomberoActual();
        this.cargarDatos();
        this.configurarInterfaz();
        this.configurarEventListeners();
        this.renderizarTodo();
        this.actualizarResumenDeudas();
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoPagarBeneficioActual');
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado ningún bombero', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        const bomberos = storage.getBomberos();
        // Convertir a número para comparación exacta
        this.bomberoActual = bomberos.find(b => b.id === parseInt(bomberoId));
        
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        // VERIFICAR SI PUEDE PAGAR BENEFICIOS
        const validacion = Utils.puedePagarCuotas(this.bomberoActual); // Usa la misma validación que cuotas
        
        if (!validacion.puede) {
            const nombreCompleto = Utils.obtenerNombreCompleto(this.bomberoActual);
            const estadoBadge = Utils.obtenerBadgeEstado(this.bomberoActual.estadoBombero);
            
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Arial; background: #f5f5f5; padding: 20px; text-align: center;">
                    <h1 style="color: #f44336; font-size: 72px; margin: 0;">❌</h1>
                    <h2 style="color: #333; margin-top: 20px;">Acceso Denegado</h2>
                    <p style="font-size: 20px; color: #666; margin: 10px 0;">${nombreCompleto}</p>
                    <p style="font-size: 18px; color: #666; margin: 5px 0;">Estado: <strong>${estadoBadge}</strong></p>
                    <p style="font-size: 16px; color: #f44336; margin: 20px 0; max-width: 600px;">${validacion.mensaje}</p>
                    <p style="font-size: 14px; color: #666;">No se pueden registrar pagos de beneficios para este voluntario.</p>
                    <p style="color: #999; margin-top: 40px; font-size: 14px;">Redirigiendo al sistema en 3 segundos...</p>
                </div>
            `;
            setTimeout(() => window.location.href = 'sistema.html', 3000);
            return;
        }

        this.mostrarInfoBombero();
    }

    mostrarInfoBombero() {
        const contenedor = document.getElementById('bomberoDatosPago');
        
        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
            <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
        `;
    }

    cargarDatos() {
        this.asignaciones = storage.getAsignacionesBeneficios();
        this.beneficios = storage.getBeneficios();
        this.pagosBeneficios = storage.getPagosBeneficios();
    }

    // ==================== REGISTRO FINANCIERO ====================
    registrarIngresoFinanciero(datos) {
        try {
            const movimientos = storage.getMovimientosFinancieros();
            
            const nuevoMovimiento = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                tipo: 'ingreso',
                categoria: datos.categoria || 'Pago de Beneficio',
                monto: parseFloat(datos.monto),
                descripcion: datos.descripcion || 'Pago de beneficio',
                fecha: datos.fecha || new Date().toISOString().split('T')[0],
                fechaRegistro: new Date().toISOString(),
                bomberoId: datos.bomberoId || null,
                beneficioId: datos.beneficioId || null,
                origen: 'beneficios' // Marca que viene del módulo de beneficios
            };
            
            movimientos.push(nuevoMovimiento);
            storage.saveMovimientosFinancieros(movimientos);
            
            console.log('✅ Ingreso financiero registrado:', nuevoMovimiento);
            return true;
        } catch (error) {
            console.error('Error al registrar ingreso financiero:', error);
            return false;
        }
    }

    // ==================== VENTA EXTRA DE TARJETAS ====================
    abrirModalVentaExtra(asignacionId) {
        const asignaciones = storage.getAsignacionesBeneficios();
        const asignacion = asignaciones.find(a => a.id == asignacionId);
        
        if (!asignacion) {
            Utils.mostrarNotificacion('Asignación no encontrada', 'error');
            return;
        }
        
        const beneficios = storage.getBeneficios();
        const beneficio = beneficios.find(b => b.id == asignacion.beneficioId);
        
        if (!beneficio) {
            Utils.mostrarNotificacion('Beneficio no encontrado', 'error');
            return;
        }
        
        // Mostrar info del beneficio
        document.getElementById('infoModalVentaExtra').innerHTML = `
            <div class="info-beneficio-modal">
                <p><strong>Beneficio:</strong> ${beneficio.nombre}</p>
                <p><strong>Precio por tarjeta:</strong> ${Utils.formatearMonto(beneficio.precioTarjeta)}</p>
                <p><strong>Tarjetas originalmente asignadas:</strong> ${asignacion.cantidadTarjetas || asignacion.tarjetasAsignadas}</p>
                <p><strong>Ya vendidas:</strong> ${asignacion.tarjetasVendidas || 0}</p>
            </div>
        `;
        
        // Setear valores ocultos
        document.getElementById('ventaExtraAsignacionId').value = asignacionId;
        document.getElementById('ventaExtraBeneficioId').value = beneficio.id;
        document.getElementById('ventaExtraPrecioUnitario').value = beneficio.precioTarjeta;
        
        // Limpiar formulario
        document.getElementById('formVentaExtra').reset();
        document.getElementById('cantidadTarjetasExtra').value = '';
        document.getElementById('montoVentaExtra').value = '';
        document.getElementById('fechaVentaExtra').value = new Date().toISOString().split('T')[0];
        
        // Mostrar modal
        document.getElementById('modalVentaExtra').style.display = 'flex';
    }

    calcularMontoExtra() {
        const cantidad = parseInt(document.getElementById('cantidadTarjetasExtra').value) || 0;
        const precio = parseFloat(document.getElementById('ventaExtraPrecioUnitario').value) || 0;
        const monto = cantidad * precio;
        document.getElementById('montoVentaExtra').value = monto;
    }

    cerrarModalVentaExtra() {
        document.getElementById('modalVentaExtra').style.display = 'none';
        document.getElementById('formVentaExtra').reset();
    }

    async registrarVentaExtra(event) {
        event.preventDefault();
        
        const asignacionId = document.getElementById('ventaExtraAsignacionId').value;
        const beneficioId = document.getElementById('ventaExtraBeneficioId').value;
        const cantidadExtra = parseInt(document.getElementById('cantidadTarjetasExtra').value);
        const montoExtra = parseFloat(document.getElementById('montoVentaExtra').value);
        const fechaPago = document.getElementById('fechaVentaExtra').value;
        const observaciones = document.getElementById('observacionesVentaExtra').value;
        
        if (!cantidadExtra || !montoExtra) {
            Utils.mostrarNotificacion('Complete los campos requeridos', 'error');
            return;
        }
        
        try {
            // Obtener asignación actual
            const asignaciones = storage.getAsignacionesBeneficios();
            const asignacion = asignaciones.find(a => a.id == asignacionId);
            
            if (!asignacion) {
                throw new Error('Asignación no encontrada');
            }
            
            // Crear registro de pago extra
            const pagosBeneficios = storage.getPagosBeneficios();
            const nuevoPago = {
                id: Date.now(),
                bomberoId: this.bomberoActual.id,
                beneficioId: beneficioId,
                asignacionId: asignacionId,
                tipo: 'extra', // IMPORTANTE: marca que es un pago extra
                cantidadTarjetas: cantidadExtra,
                montoPagado: montoExtra,
                fechaPago: fechaPago,
                observaciones: observaciones || 'Venta extra de tarjetas',
                fechaRegistro: new Date().toISOString()
            };
            
            pagosBeneficios.push(nuevoPago);
            storage.savePagosBeneficios(pagosBeneficios);
            
            // Actualizar el monto pagado en la asignación
            asignacion.montoPagado = (asignacion.montoPagado || 0) + montoExtra;
            
            // NO se actualiza tarjetasVendidas porque son EXTRAS, no de las asignadas
            // Pero podemos agregar un campo nuevo para llevar el control
            asignacion.tarjetasExtrasVendidas = (asignacion.tarjetasExtrasVendidas || 0) + cantidadExtra;
            asignacion.montoExtrasVendidas = (asignacion.montoExtrasVendidas || 0) + montoExtra;
            
            storage.saveAsignacionesBeneficios(asignaciones);
            
            // ===== REGISTRAR MOVIMIENTO FINANCIERO (INGRESO) =====
            const beneficios = storage.getBeneficios();
            const beneficio = beneficios.find(b => b.id == beneficioId);
            this.registrarIngresoFinanciero({
                monto: montoExtra,
                descripcion: `Venta Extra - ${beneficio ? beneficio.nombre : 'Beneficio'} - ${Utils.obtenerNombreCompleto(this.bomberoActual)} (${cantidadExtra} tarjetas)`,
                categoria: 'Pago de Beneficio Extra',
                fecha: fechaPago,
                bomberoId: this.bomberoActual.id,
                beneficioId: beneficioId
            });
            
            Utils.mostrarNotificacion('✅ Venta extra registrada exitosamente', 'success');
            this.cerrarModalVentaExtra();
            this.cargarDatos();
            this.renderizarTodo();
            this.actualizarResumenDeudas();
            
        } catch (error) {
            console.error('Error al registrar venta extra:', error);
            Utils.mostrarNotificacion('Error: ' + error.message, 'error');
        }
    }

    // ==================== LIBERAR TARJETAS ====================
    abrirModalLiberar(asignacionId) {
        const asignaciones = storage.getAsignacionesBeneficios();
        const asignacion = asignaciones.find(a => a.id == asignacionId);
        
        if (!asignacion) {
            Utils.mostrarNotificacion('Asignación no encontrada', 'error');
            return;
        }
        
        const beneficios = storage.getBeneficios();
        const beneficio = beneficios.find(b => b.id == asignacion.beneficioId);
        
        if (!beneficio) {
            Utils.mostrarNotificacion('Beneficio no encontrado', 'error');
            return;
        }
        
        const cantidadActual = asignacion.cantidadTarjetas || asignacion.tarjetasAsignadas;
        
        // Mostrar info
        document.getElementById('infoModalLiberar').innerHTML = `
            <div class="info-beneficio-modal">
                <p><strong>Beneficio:</strong> ${beneficio.nombre}</p>
                <p><strong>Tarjetas actualmente asignadas:</strong> ${cantidadActual}</p>
                <p><strong>Ya vendidas/pagadas:</strong> ${asignacion.tarjetasVendidas || 0}</p>
                <p><strong>Monto ya pagado:</strong> ${Utils.formatearMonto(asignacion.montoPagado || 0)}</p>
            </div>
        `;
        
        // Setear valores
        document.getElementById('liberarAsignacionId').value = asignacionId;
        document.getElementById('liberarBeneficioId').value = beneficio.id;
        document.getElementById('liberarTarjetasActuales').value = cantidadActual;
        
        // Limpiar y resetear
        document.getElementById('formLiberarTarjetas').reset();
        document.querySelector('input[name="tipoLiberacion"][value="total"]').checked = true;
        document.getElementById('grupoCantidadLiberar').style.display = 'none';
        document.getElementById('cantidadLiberar').value = '';
        document.getElementById('cantidadLiberar').max = cantidadActual;
        
        // Mostrar modal
        document.getElementById('modalLiberarTarjetas').style.display = 'flex';
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
            document.getElementById('cantidadLiberar').value = '';
        }
    }

    cerrarModalLiberar() {
        document.getElementById('modalLiberarTarjetas').style.display = 'none';
        document.getElementById('formLiberarTarjetas').reset();
    }

    async liberarTarjetas(event) {
        event.preventDefault();
        
        const asignacionId = document.getElementById('liberarAsignacionId').value;
        const tarjetasActuales = parseInt(document.getElementById('liberarTarjetasActuales').value);
        const tipoLiberacion = document.querySelector('input[name="tipoLiberacion"]:checked').value;
        const motivo = document.getElementById('motivoLiberacion').value;
        
        let cantidadALiberar;
        
        if (tipoLiberacion === 'total') {
            cantidadALiberar = tarjetasActuales;
        } else {
            cantidadALiberar = parseInt(document.getElementById('cantidadLiberar').value);
            if (!cantidadALiberar || cantidadALiberar < 1 || cantidadALiberar > tarjetasActuales) {
                Utils.mostrarNotificacion('Cantidad inválida', 'error');
                return;
            }
        }
        
        const confirmacion = await Utils.confirmarAccion(
            `¿Estás seguro de liberar ${cantidadALiberar} tarjeta(s)?<br><br>` +
            `<strong>Tipo:</strong> ${tipoLiberacion === 'total' ? 'Todas' : 'Parcial'}<br>` +
            `<strong>Motivo:</strong> ${motivo}`
        );
        
        if (!confirmacion) return;
        
        try {
            const asignaciones = storage.getAsignacionesBeneficios();
            const asignacion = asignaciones.find(a => a.id == asignacionId);
            
            if (!asignacion) {
                throw new Error('Asignación no encontrada');
            }
            
            const beneficios = storage.getBeneficios();
            const beneficio = beneficios.find(b => b.id == asignacion.beneficioId);
            
            // Calcular nuevos valores
            const tarjetasNuevas = tarjetasActuales - cantidadALiberar;
            const precioUnitario = beneficio.precioTarjeta;
            const nuevoMontoEsperado = tarjetasNuevas * precioUnitario;
            
            // Actualizar asignación
            if (asignacion.cantidadTarjetas !== undefined) {
                asignacion.cantidadTarjetas = tarjetasNuevas;
            }
            if (asignacion.tarjetasAsignadas !== undefined) {
                asignacion.tarjetasAsignadas = tarjetasNuevas;
            }
            asignacion.montoEsperado = nuevoMontoEsperado;
            
            // Agregar log de liberación
            if (!asignacion.historialLiberaciones) {
                asignacion.historialLiberaciones = [];
            }
            
            asignacion.historialLiberaciones.push({
                fecha: new Date().toISOString(),
                cantidadLiberada: cantidadALiberar,
                motivo: motivo,
                tipo: tipoLiberacion,
                tarjetasAnteriores: tarjetasActuales,
                tarjetasNuevas: tarjetasNuevas
            });
            
            // Si liberó todas, marcar estado especial
            if (tarjetasNuevas === 0) {
                asignacion.estadoPago = 'liberado';
                asignacion.fechaLiberacion = new Date().toISOString();
            }
            
            // Recalcular estado de pago
            if (tarjetasNuevas > 0) {
                if (asignacion.montoPagado >= nuevoMontoEsperado) {
                    asignacion.estadoPago = 'pagado';
                } else if (asignacion.montoPagado > 0) {
                    asignacion.estadoPago = 'parcial';
                } else {
                    asignacion.estadoPago = 'pendiente';
                }
            }
            
            storage.saveAsignacionesBeneficios(asignaciones);
            
            Utils.mostrarNotificacion(
                `✅ Se liberaron ${cantidadALiberar} tarjeta(s) exitosamente`, 
                'success'
            );
            
            this.cerrarModalLiberar();
            this.cargarDatos();
            this.renderizarTodo();
            this.actualizarResumenDeudas();
            
        } catch (error) {
            console.error('Error al liberar tarjetas:', error);
            Utils.mostrarNotificacion('Error: ' + error.message, 'error');
        }
    }

    // ==================== CONFIGURACIÓN DE INTERFAZ ====================
    configurarInterfaz() {
        // Event listener para formulario de pago normal
        document.getElementById('formPagoBeneficio').addEventListener('submit', (e) => {
            this.manejarSubmitPago(e);
        });

        // Event listener para formulario de VENTA EXTRA
        const formVentaExtra = document.getElementById('formVentaExtra');
        if (formVentaExtra) {
            formVentaExtra.addEventListener('submit', (e) => this.registrarVentaExtra(e));
        }

        // Event listener para formulario de LIBERAR TARJETAS
        const formLiberar = document.getElementById('formLiberarTarjetas');
        if (formLiberar) {
            formLiberar.addEventListener('submit', (e) => this.liberarTarjetas(e));
        }

        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPago').value = hoy;
    }

    configurarEventListeners() {
        // Delegar eventos para botones dinámicos
        document.addEventListener('click', (e) => {
            // Botón Venta Extra
            if (e.target.closest('.btn-extra')) {
                const btn = e.target.closest('.btn-extra');
                const asignacionId = btn.getAttribute('data-asignacion-id');
                if (asignacionId) {
                    this.abrirModalVentaExtra(asignacionId);
                }
                return;
            }
            
            // Botón Liberar Tarjetas
            if (e.target.closest('.btn-liberar')) {
                const btn = e.target.closest('.btn-liberar');
                const asignacionId = btn.getAttribute('data-asignacion-id');
                if (asignacionId) {
                    this.abrirModalLiberar(asignacionId);
                }
                return;
            }
            
            // Botón Pagar Normal
            if (e.target.closest('.btn-pagar-beneficio')) {
                const btn = e.target.closest('.btn-pagar-beneficio');
                const asignacionId = btn.getAttribute('data-asignacion-id');
                if (asignacionId) {
                    this.abrirFormularioPago(asignacionId);
                }
                return;
            }
        });
    }

    renderizarTodo() {
        this.renderizarBeneficiosAsignados();
        this.renderizarHistorialPagos();
    }

    actualizarResumenDeudas() {
        const asignacionesBombero = this.asignaciones.filter(a => a.bomberoId == this.bomberoActual.id);
        const beneficiosPendientes = asignacionesBombero.filter(a => 
            a.estadoPago === 'pendiente' || a.estadoPago === 'parcial'
        );
        
        const deudaTotal = beneficiosPendientes.reduce((sum, a) => 
            sum + (a.montoEsperado - a.montoPagado), 0
        );

        document.getElementById('totalBeneficiosPendientes').textContent = beneficiosPendientes.length;
        document.getElementById('deudaTotalBeneficios').textContent = this.formatearMonto(deudaTotal);
    }

    renderizarBeneficiosAsignados() {
        const contenedor = document.getElementById('listaBeneficiosAsignados');
        const asignacionesBombero = this.asignaciones.filter(a => a.bomberoId == this.bomberoActual.id);

        if (asignacionesBombero.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No tienes beneficios asignados</p>';
            return;
        }

        contenedor.innerHTML = asignacionesBombero.map(a => {
            const beneficio = this.beneficios.find(b => b.id == a.beneficioId);
            if (!beneficio) return '';

            const hoy = new Date();
            const fechaLimite = new Date(beneficio.fechaLimiteRendicion);
            const vencido = fechaLimite < hoy && a.estadoPago !== 'pagado';
            
            let estadoClass = a.estadoPago || 'pendiente';
            let estadoTexto = this.obtenerTextoEstado(a.estadoPago);
            
            if (vencido && a.estadoPago !== 'pagado') {
                estadoClass = 'vencido';
                estadoTexto = '⚠️ VENCIDO';
            }

            const tarjetasAsignadas = a.cantidadTarjetas || a.tarjetasAsignadas || 0;
            const tarjetasVendidas = a.tarjetasVendidas || 0;
            const tarjetasExtras = a.tarjetasExtrasVendidas || 0;
            const montoExtras = a.montoExtrasVendidas || 0;

            return `
                <div class="asignacion-card ${vencido ? 'vencido' : ''}">
                    <div class="asignacion-header">
                        <div class="asignacion-nombre">${beneficio.nombre}</div>
                        <div class="asignacion-estado ${estadoClass}">${estadoTexto}</div>
                    </div>
                    <div class="asignacion-info">
                        <div><strong>Tipo:</strong> <span>${beneficio.tipo}</span></div>
                        <div><strong>Fecha evento:</strong> <span>${Utils.formatearFecha(beneficio.fechaEvento)}</span></div>
                        <div><strong>Fecha límite:</strong> <span>${Utils.formatearFecha(beneficio.fechaLimiteRendicion)}</span></div>
                        <div><strong>Precio tarjeta:</strong> <span>${this.formatearMonto(beneficio.precioTarjeta)}</span></div>
                        <div><strong>Tarjetas asignadas:</strong> <span>${tarjetasAsignadas}</span></div>
                        <div><strong>Tarjetas vendidas:</strong> <span>${tarjetasVendidas}</span></div>
                        ${tarjetasExtras > 0 ? `
                            <div><strong>Tarjetas extras vendidas:</strong> <span style="color: #4caf50; font-weight: 700;">${tarjetasExtras}</span></div>
                        ` : ''}
                        <div><strong>Monto esperado:</strong> <span>${this.formatearMonto(a.montoEsperado)}</span></div>
                        <div><strong>Monto pagado:</strong> <span style="color: #4caf50;">${this.formatearMonto(a.montoPagado)}</span></div>
                        ${montoExtras > 0 ? `
                            <div><strong>Monto extras:</strong> <span style="color: #4caf50; font-weight: 700;">${this.formatearMonto(montoExtras)}</span></div>
                        ` : ''}
                        <div><strong>Deuda:</strong> <span style="color: ${a.montoEsperado - a.montoPagado > 0 ? '#f44336' : '#4caf50'};">${this.formatearMonto(Math.max(0, a.montoEsperado - a.montoPagado))}</span></div>
                    </div>
                    
                    ${a.historialLiberaciones && a.historialLiberaciones.length > 0 ? `
                        <div style="background: #fff3cd; padding: 10px; border-radius: 6px; margin-top: 10px; border-left: 3px solid #ff9800;">
                            <strong style="color: #ff9800;">📋 Historial de Liberaciones:</strong>
                            ${a.historialLiberaciones.map(lib => `
                                <div style="font-size: 0.85rem; margin-top: 5px; color: #666;">
                                    • ${Utils.formatearFecha(lib.fecha.split('T')[0])}: ${lib.cantidadLiberada} tarjetas liberadas - ${lib.motivo}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="asignacion-botones">
                        ${beneficio.estado === 'activo' && a.estadoPago !== 'pagado' && a.estadoPago !== 'liberado' ? `
                            <button class="btn-pagar-beneficio" data-asignacion-id="${a.id}">
                                💰 Pagar Normal
                            </button>
                        ` : ''}
                        
                        ${a.estadoPago !== 'liberado' ? `
                            <button class="btn btn-extra" data-asignacion-id="${a.id}">
                                ➕ Venta Extra
                            </button>
                        ` : ''}
                        
                        ${tarjetasAsignadas > 0 && a.estadoPago !== 'liberado' ? `
                            <button class="btn btn-liberar" data-asignacion-id="${a.id}">
                                🔄 Liberar Tarjetas
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    abrirFormularioPago(asignacionId) {
        this.asignacionActual = this.asignaciones.find(a => a.id == asignacionId);
        if (!this.asignacionActual) return;

        const beneficio = this.beneficios.find(b => b.id == this.asignacionActual.beneficioId);
        if (!beneficio) return;

        document.getElementById('asignacionId').value = asignacionId;
        document.getElementById('beneficioId').value = beneficio.id;

        const tarjetasAsignadas = this.asignacionActual.cantidadTarjetas || this.asignacionActual.tarjetasAsignadas || 0;
        const tarjetasVendidas = this.asignacionActual.tarjetasVendidas || 0;

        const infoDiv = document.getElementById('infoBeneficio');
        infoDiv.innerHTML = `
            <div class="info-beneficio">
                <h4>${beneficio.nombre}</h4>
                <div class="info-grid">
                    <div><strong>Tarjetas asignadas:</strong> ${tarjetasAsignadas}</div>
                    <div><strong>Precio por tarjeta:</strong> ${this.formatearMonto(beneficio.precioTarjeta)}</div>
                    <div><strong>Total esperado:</strong> ${this.formatearMonto(this.asignacionActual.montoEsperado)}</div>
                    <div><strong>Ya pagado:</strong> ${this.formatearMonto(this.asignacionActual.montoPagado)}</div>
                    <div><strong>Tarjetas ya registradas:</strong> ${tarjetasVendidas}</div>
                    <div><strong>Fecha límite:</strong> ${Utils.formatearFecha(beneficio.fechaLimiteRendicion)}</div>
                </div>
            </div>
        `;

        document.getElementById('formPagoContainer').style.display = 'block';
        document.getElementById('formPagoContainer').scrollIntoView({ behavior: 'smooth' });
    }

    cerrarFormulario() {
        document.getElementById('formPagoContainer').style.display = 'none';
        document.getElementById('formPagoBeneficio').reset();
        this.asignacionActual = null;
    }

    calcularMonto() {
        if (!this.asignacionActual) return;

        const beneficio = this.beneficios.find(b => b.id == this.asignacionActual.beneficioId);
        if (!beneficio) return;

        const tarjetasVendidas = parseInt(document.getElementById('tarjetasVendidas').value) || 0;
        const monto = tarjetasVendidas * beneficio.precioTarjeta;
        
        document.getElementById('montoPago').value = monto;
    }

    async manejarSubmitPago(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const errores = this.validarDatosPago(datos);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.guardarPago(datos);
            Utils.mostrarNotificacion('Pago registrado exitosamente', 'success');
            this.cerrarFormulario();
            this.cargarDatos();
            this.renderizarTodo();
            this.actualizarResumenDeudas();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosPago(datos) {
        const errores = [];
        
        if (!datos.tarjetasVendidas || parseInt(datos.tarjetasVendidas) < 0) {
            errores.push('Cantidad de tarjetas inválida');
        }
        
        if (!datos.montoPago || parseFloat(datos.montoPago) < 0) {
            errores.push('Monto inválido');
        }
        
        if (!datos.fechaPago) {
            errores.push('Fecha de pago requerida');
        }
        
        return errores;
    }

    async guardarPago(datos) {
        const asignacion = this.asignaciones.find(a => a.id == datos.asignacionId);
        if (!asignacion) throw new Error('Asignación no encontrada');

        const nuevoPago = {
            id: Date.now(),
            asignacionId: datos.asignacionId,
            beneficioId: parseInt(datos.beneficioId),
            bomberoId: this.bomberoActual.id,
            tipo: 'normal', // Marca que es pago normal
            tarjetasVendidas: parseInt(datos.tarjetasVendidas),
            montoPagado: parseFloat(datos.montoPago),
            fechaPago: datos.fechaPago,
            observaciones: datos.observaciones || '',
            fechaRegistro: new Date().toISOString()
        };

        this.pagosBeneficios.push(nuevoPago);
        storage.savePagosBeneficios(this.pagosBeneficios);

        asignacion.tarjetasVendidas = (asignacion.tarjetasVendidas || 0) + nuevoPago.tarjetasVendidas;
        asignacion.montoPagado = (asignacion.montoPagado || 0) + nuevoPago.montoPagado;
        
        if (asignacion.montoPagado >= asignacion.montoEsperado) {
            asignacion.estadoPago = 'pagado';
        } else if (asignacion.montoPagado > 0) {
            asignacion.estadoPago = 'parcial';
        }

        storage.saveAsignacionesBeneficios(this.asignaciones);
        
        // ===== REGISTRAR MOVIMIENTO FINANCIERO (INGRESO) =====
        const beneficio = this.beneficios.find(b => b.id == nuevoPago.beneficioId);
        this.registrarIngresoFinanciero({
            monto: nuevoPago.montoPagado,
            descripcion: `Pago de Beneficio - ${beneficio ? beneficio.nombre : 'Beneficio'} - ${Utils.obtenerNombreCompleto(this.bomberoActual)} (${nuevoPago.tarjetasVendidas} tarjetas)`,
            categoria: 'Pago de Beneficio',
            fecha: nuevoPago.fechaPago,
            bomberoId: this.bomberoActual.id,
            beneficioId: nuevoPago.beneficioId
        });
    }

    renderizarHistorialPagos() {
        const contenedor = document.getElementById('listaPagos');
        const pagosBombero = this.pagosBeneficios.filter(p => p.bomberoId == this.bomberoActual.id);

        document.getElementById('totalPagos').textContent = pagosBombero.length;

        if (pagosBombero.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay pagos registrados</p>';
            return;
        }

        pagosBombero.sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

        contenedor.innerHTML = pagosBombero.map(p => {
            const beneficio = this.beneficios.find(b => b.id == p.beneficioId);
            if (!beneficio) return '';

            const tipoTexto = p.tipo === 'extra' ? '➕ VENTA EXTRA' : '💰 Pago Normal';
            const tipoClass = p.tipo === 'extra' ? 'tipo-extra' : 'tipo-normal';

            return `
                <div class="pago-card ${tipoClass}">
                    <div class="pago-header">
                        <div>
                            <strong>${beneficio.nombre}</strong>
                            <span class="tipo-pago">${tipoTexto}</span>
                        </div>
                        <div class="pago-monto">${this.formatearMonto(p.montoPagado)}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px; font-size: 0.9rem;">
                        <div><strong>Tarjetas:</strong> ${p.tarjetasVendidas || p.cantidadTarjetas}</div>
                        <div><strong>Fecha pago:</strong> ${Utils.formatearFecha(p.fechaPago)}</div>
                        ${p.observaciones ? `<div style="grid-column: 1 / -1;"><strong>Obs:</strong> ${p.observaciones}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async exportarExcel() {
        try {
            const pagosBombero = this.pagosBeneficios.filter(p => p.bomberoId == this.bomberoActual.id);
            
            if (pagosBombero.length === 0) {
                Utils.mostrarNotificacion('No hay pagos para exportar', 'warning');
                return;
            }

            const datos = pagosBombero.map((p, index) => {
                const beneficio = this.beneficios.find(b => b.id == p.beneficioId);
                return {
                    'N°': index + 1,
                    'Beneficio': beneficio ? beneficio.nombre : 'N/A',
                    'Tipo': p.tipo === 'extra' ? 'Venta Extra' : 'Pago Normal',
                    'Tarjetas': p.tarjetasVendidas || p.cantidadTarjetas,
                    'Monto': p.montoPagado,
                    'Fecha Pago': Utils.formatearFecha(p.fechaPago),
                    'Observaciones': p.observaciones || '-'
                };
            });

            await Utils.exportarAExcel(
                datos,
                `Pagos_Beneficios_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Pagos'
            );

            Utils.mostrarNotificacion('Excel exportado exitosamente', 'success');
        } catch (error) {
            console.error('Error al exportar:', error);
            Utils.mostrarNotificacion('Error al exportar: ' + error.message, 'error');
        }
    }

    generarPDFBeneficios() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Colores
            const rojoB = [196, 30, 58];
            const gris = [100, 100, 100];
            const negro = [0, 0, 0];
            const verde = [46, 204, 113];
            const amarillo = [241, 196, 15];
            
            let y = 0;
            
            // ==================== HEADER ====================
            doc.setFillColor(...rojoB);
            doc.rect(0, 0, 210, 40, 'F');
            
            // Logo
            const logoCompania = localStorage.getItem('logoCompania');
            if (logoCompania) {
                try {
                    doc.addImage(logoCompania, 'PNG', 15, 8, 25, 25);
                } catch (e) {
                    console.log('No se pudo cargar el logo');
                }
            }
            
            // Título
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('REPORTE DE BENEFICIOS', 105, 18, { align: 'center' });
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('Estado de Cuenta del Voluntario', 105, 26, { align: 'center' });
            doc.setFontSize(8);
            doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 105, 32, { align: 'center' });
            
            y = 50;
            
            // ==================== INFO VOLUNTARIO ====================
            doc.setTextColor(...negro);
            doc.setDrawColor(...rojoB);
            doc.setLineWidth(0.5);
            doc.rect(15, y, 180, 28);
            
            y += 7;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...rojoB);
            doc.text(Utils.obtenerNombreCompleto(this.bomberoActual).toUpperCase(), 20, y);
            
            y += 7;
            doc.setFontSize(10);
            doc.setTextColor(...gris);
            doc.setFont(undefined, 'normal');
            doc.text(`Clave: ${this.bomberoActual.claveBombero || 'N/A'}`, 20, y);
            doc.text(`RUT: ${this.bomberoActual.rut || 'N/A'}`, 80, y);
            doc.text(`Compania: ${this.bomberoActual.compania || 'N/A'}`, 140, y);
            
            y += 12;
            
            // ==================== RESUMEN ====================
            const asignacionesBombero = this.asignaciones.filter(a => a.bomberoId == this.bomberoActual.id);
            const beneficiosPendientes = asignacionesBombero.filter(a => a.estado === 'pendiente' || a.estado === 'parcial').length;
            const deudaTotal = asignacionesBombero.reduce((total, a) => {
                if (a.estado === 'pendiente' || a.estado === 'parcial') {
                    return total + (a.deuda || 0);
                }
                return total;
            }, 0);
            
            doc.setFillColor(240, 240, 240);
            doc.rect(15, y, 180, 8, 'F');
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...rojoB);
            doc.text('RESUMEN GENERAL', 20, y + 6);
            y += 15;
            
            // Tabla resumen
            const resumenData = [
                { label: 'Beneficios Pendientes', valor: beneficiosPendientes, color: amarillo },
                { label: 'Deuda Total', valor: this.formatearMonto(deudaTotal), color: deudaTotal > 0 ? [231, 76, 60] : verde }
            ];
            
            resumenData.forEach(({ label, valor, color }) => {
                doc.setDrawColor(...color);
                doc.setLineWidth(2);
                doc.line(20, y - 3, 20, y + 2);
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...gris);
                doc.text(label + ':', 25, y);
                
                doc.setFont(undefined, 'bold');
                doc.setTextColor(...color);
                doc.setFontSize(11);
                doc.text(String(valor), 185, y, { align: 'right' });
                
                y += 8;
            });
            
            y += 5;
            
            // ==================== BENEFICIOS ASIGNADOS ====================
            if (asignacionesBombero.length > 0) {
                doc.setFillColor(...rojoB);
                doc.rect(15, y, 180, 10, 'F');
                doc.setFontSize(13);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('BENEFICIOS ASIGNADOS', 105, y + 7, { align: 'center' });
                y += 15;
                
                asignacionesBombero.forEach((asignacion, index) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    const beneficio = this.beneficios.find(b => b.id == asignacion.beneficioId);
                    if (!beneficio) return;
                    
                    // Nombre del beneficio
                    doc.setFillColor(250, 250, 250);
                    doc.rect(15, y - 2, 180, 7, 'F');
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...negro);
                    doc.text(`${index + 1}. ${beneficio.nombre}`, 20, y + 3);
                    
                    // Estado con color
                    const estadoColor = asignacion.estado === 'pagado' ? verde : 
                                        asignacion.estado === 'parcial' ? amarillo : [231, 76, 60];
                    doc.setTextColor(...estadoColor);
                    doc.text(this.obtenerTextoEstado(asignacion.estado), 185, y + 3, { align: 'right' });
                    y += 10;
                    
                    // Detalles
                    const detalles = [
                        ['Tipo', beneficio.tipo || 'N/A'],
                        ['Fecha Evento', Utils.formatearFecha(beneficio.fechaEvento)],
                        ['Fecha Limite', Utils.formatearFecha(beneficio.fechaLimite)],
                        ['Precio Tarjeta', this.formatearMonto(beneficio.precioTarjeta)],
                        ['Tarjetas Asignadas', asignacion.tarjetasAsignadas],
                        ['Tarjetas Vendidas', asignacion.tarjetasVendidas],
                        ['Monto Pagado', this.formatearMonto(asignacion.montoPagado)],
                        ['Deuda', this.formatearMonto(asignacion.deuda)]
                    ];
                    
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'normal');
                    
                    detalles.forEach(([label, valor]) => {
                        doc.setTextColor(...gris);
                        doc.text(label + ':', 25, y);
                        doc.setTextColor(...negro);
                        doc.setFont(undefined, 'bold');
                        doc.text(String(valor), 185, y, { align: 'right' });
                        doc.setFont(undefined, 'normal');
                        y += 5;
                    });
                    
                    y += 8;
                });
            }
            
            // ==================== HISTORIAL DE PAGOS ====================
            const pagosBombero = this.pagosBeneficios.filter(p => p.bomberoId == this.bomberoActual.id);
            
            if (pagosBombero.length > 0) {
                if (y > 220) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.setFillColor(...rojoB);
                doc.rect(15, y, 180, 10, 'F');
                doc.setFontSize(13);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('HISTORIAL DE PAGOS', 105, y + 7, { align: 'center' });
                y += 15;
                
                doc.setFontSize(10);
                doc.setTextColor(...negro);
                doc.text(`Total de pagos realizados: ${pagosBombero.length}`, 20, y);
                y += 10;
                
                pagosBombero.forEach((pago, index) => {
                    if (y > 260) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    const beneficio = this.beneficios.find(b => b.id == pago.beneficioId);
                    
                    doc.setFillColor(248, 249, 250);
                    doc.rect(15, y - 2, 180, 12, 'F');
                    
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...negro);
                    doc.text(`${index + 1}. ${beneficio ? beneficio.nombre : 'N/A'}`, 20, y + 2);
                    
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(...gris);
                    doc.text(`${pago.tarjetasVendidas || pago.cantidadTarjetas} tarjetas`, 20, y + 7);
                    doc.text(`Fecha: ${Utils.formatearFecha(pago.fechaPago)}`, 90, y + 7);
                    
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...verde);
                    doc.text(this.formatearMonto(pago.montoPagado), 185, y + 5, { align: 'right' });
                    
                    y += 15;
                });
            }
            
            // ==================== FOOTER ====================
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text(`Generado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}`, 105, 285, { align: 'center' });
            
            // Guardar PDF
            const nombre = this.bomberoActual.claveBombero || 'Voluntario';
            doc.save(`Beneficios_${nombre}_${new Date().toISOString().split('T')[0]}.pdf`);
            
            Utils.mostrarNotificacion('PDF generado exitosamente', 'success');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
        }
    }

    obtenerTextoEstado(estado) {
        const estados = {
            'pendiente': 'Pendiente',
            'parcial': 'Parcial',
            'pagado': '✅ Pagado',
            'liberado': '🔄 Liberado',
            'vencido': '⚠️ Vencido'
        };
        return estados[estado] || 'Pendiente';
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto || 0);
    }

    volverAlSistema() {
        localStorage.removeItem('bomberoPagarBeneficioActual');
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pagarBeneficioSistema = new SistemaPagarBeneficio();
});