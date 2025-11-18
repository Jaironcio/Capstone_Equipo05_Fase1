// ==================== SISTEMA DE CUOTAS DJANGO ====================
// Versión que usa la API REST de Django en lugar de localStorage

const API_BASE = '/api/voluntarios';

// Función para obtener cookies (igual que crear-bombero-django.js)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

class SistemaCuotasDjango {
    constructor() {
        this.bomberoActual = null;
        this.pagosCuotas = [];
        this.anioActual = new Date().getFullYear(); // Default, se actualiza con ciclo activo
        this.cicloActivo = null;
        this.estadoCuotas = null; // Estado de activación de cuotas
        this.preciosCuotas = {
            precioRegular: 5000,
            precioEstudiante: 3000
        };
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        const sePudoCargar = await this.cargarBomberoActual();
        if (!sePudoCargar) {
            return;
        }
        
        // Cargar ciclo activo primero
        await this.cargarCicloActivo();
        
        // Cargar estado de cuotas
        await this.cargarEstadoCuotas();
        
        await this.cargarDatos();
        this.configurarInterfaz();
        this.aplicarPermisosUI();
        this.renderizarTodo();
    }

    async cargarBomberoActual() {
        // Leer ID desde URL
        const urlParams = new URLSearchParams(window.location.search);
        const bomberoId = urlParams.get('id');
        
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado ningún bombero', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return false;
        }

        try {
            console.log('[CUOTAS DJANGO] Cargando bombero ID:', bomberoId);
            const response = await fetch(`${API_BASE}/${bomberoId}/`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Bombero no encontrado');
            }
            
            this.bomberoActual = await response.json();
            console.log('[CUOTAS DJANGO] ✅ Bombero cargado:', this.bomberoActual);
            
            // Mostrar info del bombero
            this.mostrarInfoBombero();
            return true;
            
        } catch (error) {
            console.error('[CUOTAS DJANGO] ❌ Error al cargar bombero:', error);
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return false;
        }
    }

    mostrarInfoBombero() {
        const contenedor = document.getElementById('bomberoDatosCuotas');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        
        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
            <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
            <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
        `;

        document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
    }

    async cargarCicloActivo() {
        try {
            const response = await fetch('/api/voluntarios/ciclos-cuotas-simple/?activo=true');
            if (!response.ok) {
                console.warn('No se pudo cargar ciclo activo, usando año actual');
                return;
            }
            
            const ciclos = await response.json();
            if (ciclos && ciclos.length > 0) {
                this.cicloActivo = ciclos[0];
                this.anioActual = this.cicloActivo.anio;
                console.log(`[CUOTAS DJANGO] ✅ Ciclo activo: ${this.anioActual}`);
            }
        } catch (error) {
            console.warn('Error al cargar ciclo activo:', error);
        }
    }

    async cargarDatos() {
        try {
            console.log('[CUOTAS DJANGO] Cargando datos...');
            
            // 1. Cargar configuración de precios
            const configResponse = await fetch(`${API_BASE}/configuracion-cuotas-simple/`, {
                credentials: 'include'
            });
            
            if (configResponse.ok) {
                const config = await configResponse.json();
                this.preciosCuotas.precioRegular = parseFloat(config.precio_regular);
                this.preciosCuotas.precioEstudiante = parseFloat(config.precio_estudiante);
                console.log('[CUOTAS DJANGO] ✅ Precios cargados:', this.preciosCuotas);
                
                // Actualizar el select con los precios reales
                this.actualizarPreciosEnSelect();
            }
            
            // 2. Cargar pagos de cuotas (filtrar por año del ciclo activo)
            const response = await fetch(`${API_BASE}/pagos-cuotas-simple/?voluntario_id=${this.bomberoActual.id}&anio=${this.anioActual}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn('[CUOTAS DJANGO] ⚠️ No se pudieron cargar pagos');
                this.pagosCuotas = [];
                return;
            }
            
            const data = await response.json();
            // Asegurar que sea un array
            this.pagosCuotas = Array.isArray(data) ? data : (data.results || []);
            console.log('[CUOTAS DJANGO] ✅ Pagos cargados:', this.pagosCuotas.length);
            
        } catch (error) {
            console.error('[CUOTAS DJANGO] ❌ Error al cargar pagos:', error);
        }
    }

    actualizarPreciosEnSelect() {
        const selectTipoCuota = document.getElementById('tipoCuota');
        if (selectTipoCuota) {
            // Formatear sin espacios
            const precioRegular = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(this.preciosCuotas.precioRegular).replace(/\s/g, '');
            
            const precioEstudiante = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(this.preciosCuotas.precioEstudiante).replace(/\s/g, '');
            
            // Si es estudiante, solo mostrar cuota estudiante
            if (this.estadoCuotas && this.estadoCuotas.es_estudiante) {
                selectTipoCuota.innerHTML = `
                    <option value="estudiante" selected>Cuota Estudiante - ${precioEstudiante}</option>
                `;
                selectTipoCuota.disabled = true; // Deshabilitar cambio
            } else {
                // Mostrar ambas opciones
                selectTipoCuota.innerHTML = `
                    <option value="">Seleccione tipo</option>
                    <option value="regular">Cuota Regular - ${precioRegular}</option>
                    <option value="estudiante">Cuota Estudiante - ${precioEstudiante}</option>
                `;
                selectTipoCuota.disabled = false;
            }
        }
    }

    configurarInterfaz() {
        // Formulario de cuota social
        document.getElementById('formCuotaSocial').addEventListener('submit', (e) => {
            this.manejarSubmitCuota(e);
        });

        // Fecha automática
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPagoCuota').value = hoy;
        
        // Año actual
        document.getElementById('anioCuota').value = this.anioActual;
        
        // Agregar event listeners a los checkboxes de meses
        document.querySelectorAll('input[name="meses"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.actualizarTotalAPagar());
        });
        
        // Event listener para cambio de tipo de cuota
        document.getElementById('tipoCuota').addEventListener('change', () => this.actualizarTotalAPagar());
    }

    aplicarPermisosUI() {
        // Aquí puedes agregar lógica de permisos si es necesario
    }

    // ==================== CUOTAS SOCIALES ====================
    cambioTipoCuota() {
        this.actualizarTotalAPagar();
    }
    
    actualizarTotalAPagar() {
        const tipo = document.getElementById('tipoCuota').value;
        const checkboxes = document.querySelectorAll('input[name="meses"]:checked');
        const cantidadMeses = checkboxes.length;
        
        let montoPorMes = 0;
        if (tipo === 'regular') {
            montoPorMes = this.preciosCuotas.precioRegular;
        } else if (tipo === 'estudiante') {
            montoPorMes = this.preciosCuotas.precioEstudiante;
        }
        
        const total = montoPorMes * cantidadMeses;
        const totalElement = document.getElementById('totalAPagar');
        if (totalElement) {
            totalElement.textContent = this.formatearMonto(total);
        }
    }
    
    actualizarEstadoCheckboxes() {
        const checkboxes = document.querySelectorAll('input[name="meses"]');
        
        checkboxes.forEach(checkbox => {
            const mes = parseInt(checkbox.value);
            const estaPagado = this.pagosCuotas.some(p => {
                // El backend puede devolver 'voluntario' (id numérico) o 'voluntario_id'
                const voluntarioId = p.voluntario || p.voluntario_id;
                return voluntarioId == this.bomberoActual.id && 
                       p.mes == mes && 
                       p.anio == this.anioActual;
            });
            
            if (estaPagado) {
                checkbox.checked = false;
                checkbox.disabled = true;
                checkbox.parentElement.style.opacity = '0.5';
                checkbox.parentElement.style.pointerEvents = 'none';
            } else {
                checkbox.disabled = false;
                checkbox.parentElement.style.opacity = '1';
                checkbox.parentElement.style.pointerEvents = 'auto';
            }
        });
        
        // Actualizar total después de deshabilitar
        this.actualizarTotalAPagar();
    }

    async manejarSubmitCuota(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        // Obtener meses seleccionados
        const mesesSeleccionados = Array.from(
            document.querySelectorAll('input[name="meses"]:checked')
        ).map(cb => parseInt(cb.value));
        
        if (mesesSeleccionados.length === 0) {
            Utils.mostrarNotificacion('Debe seleccionar al menos un mes', 'error');
            return;
        }
        
        const errores = this.validarDatosCuota(datos, mesesSeleccionados);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            // Guardar pago para cada mes seleccionado
            for (const mes of mesesSeleccionados) {
                await this.guardarPagoCuota({...datos, mes: mes});
            }
            
            Utils.mostrarNotificacion(`✅ Pago de ${mesesSeleccionados.length} cuota(s) registrado exitosamente`, 'success');
            
            // Recargar datos y actualizar interfaz
            await this.cargarDatos();
            this.renderizarGridMeses();
            this.actualizarEstadoCheckboxes();
            this.renderizarHistorialCuotas();
            this.limpiarFormularioCuota();
            
        } catch (error) {
            Utils.mostrarNotificacion('❌ ' + error.message, 'error');
        }
    }

    validarDatosCuota(datos, mesesSeleccionados) {
        const errores = [];
        
        if (!datos.tipoCuota) errores.push('Debe seleccionar tipo de cuota');
        if (mesesSeleccionados.length === 0) errores.push('Debe seleccionar al menos un mes');
        if (!datos.anioCuota) errores.push('Debe ingresar el año');
        if (!datos.fechaPagoCuota) errores.push('Debe ingresar la fecha de pago');
        if (!datos.formaPagoCuota) errores.push('Debe seleccionar la forma de pago');
        
        // Verificar que no se estén pagando meses ya pagados
        for (const mes of mesesSeleccionados) {
            const yaExiste = this.pagosCuotas.some(p => {
                const voluntarioId = p.voluntario || p.voluntario_id;
                return voluntarioId == this.bomberoActual.id && 
                       p.mes == mes && 
                       p.anio == datos.anioCuota;
            });
            
            if (yaExiste) {
                errores.push(`Ya existe un pago para ${this.obtenerNombreMes(mes)}`);
            }
        }
        
        return errores;
    }

    async guardarPagoCuota(datos) {
        const montoPorCuota = datos.tipoCuota === 'regular' 
            ? this.preciosCuotas.precioRegular 
            : this.preciosCuotas.precioEstudiante;

        const payload = {
            voluntario_id: this.bomberoActual.id,
            mes: parseInt(datos.mes),
            anio: parseInt(datos.anioCuota),
            monto: montoPorCuota,
            fecha_pago: datos.fechaPagoCuota,
            metodo_pago: datos.formaPagoCuota || 'Efectivo',
            observaciones: datos.observacionesCuota || ''
        };
        
        console.log('[CUOTAS DJANGO] 💾 Guardando pago:', payload);
        
        const response = await fetch(`${API_BASE}/pagos-cuotas-simple/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || error.error || 'Error al guardar el pago');
        }
        
        const nuevoPago = await response.json();
        console.log('[CUOTAS DJANGO] ✅ Pago guardado:', nuevoPago);
        
        return nuevoPago;
    }

    renderizarGridMeses() {
        const grid = document.getElementById('gridMesesCuotas');
        if (!grid) return;
        
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        // Actualizar año mostrado
        const anioElement = document.getElementById('anioActualCuotas');
        if (anioElement) {
            anioElement.textContent = this.anioActual;
        }

        const html = meses.map((mes, index) => {
            const numeroMes = index + 1;
            const pago = this.pagosCuotas.find(p => {
                const voluntarioId = p.voluntario || p.voluntario_id;
                return voluntarioId == this.bomberoActual.id && 
                       p.mes == numeroMes && 
                       p.anio == this.anioActual;
            });

            // Determinar estado del mes
            const ahora = new Date();
            const mesActual = ahora.getMonth() + 1; // 0-11 -> 1-12
            const anioActualReal = ahora.getFullYear();
            
            let estadoClass = 'pendiente';
            let estadoTexto = 'Pendiente';
            
            if (pago) {
                // Ya está pagado
                estadoClass = 'pagado';
                estadoTexto = `Pagado: ${this.formatearMonto(pago.monto)}`;
            } else {
                // No está pagado - PENDIENTE (sin estado futuro)
                estadoClass = 'pendiente';
                estadoTexto = 'Pendiente';
            }

            return `
                <div class="mes-card ${estadoClass}">
                    <div class="mes-nombre">${mes}</div>
                    <div class="mes-estado">${estadoTexto}</div>
                </div>
            `;
        }).join('');

        grid.innerHTML = html;
        
        // Actualizar estado de checkboxes después de renderizar
        this.actualizarEstadoCheckboxes();
    }

    renderizarHistorialCuotas() {
        const lista = document.getElementById('listaCuotas');
        const total = document.getElementById('totalPagosCuotas');
        const pagosBombero = this.pagosCuotas
            .filter(p => {
                const voluntarioId = p.voluntario || p.voluntario_id;
                return voluntarioId == this.bomberoActual.id;
            })
            .sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
        
        // Actualizar contador
        if (total) {
            total.textContent = pagosBombero.length;
        }

        if (pagosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay pagos de cuotas registrados</p>';
            return;
        }

        lista.innerHTML = pagosBombero.map(pago => `
            <div class="pago-card">
                <div class="pago-header">
                    <div>
                        <strong>${this.obtenerNombreMes(pago.mes)} ${pago.anio}</strong> - 
                        <span>${pago.es_estudiante ? 'Cuota Estudiante' : 'Cuota Regular'}</span>
                    </div>
                    <div class="pago-monto">${this.formatearMonto(pago.monto)}</div>
                </div>
                <div class="item-info">
                    <div><strong>Fecha de pago:</strong> <span>${Utils.formatearFecha(pago.fecha_pago)}</span></div>
                    ${pago.forma_pago ? `<div><strong>Forma de pago:</strong> <span>${pago.forma_pago}</span></div>` : ''}
                    ${pago.observaciones ? `<div><strong>Observaciones:</strong> <span>${pago.observaciones}</span></div>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderizarTodo() {
        this.renderizarGridMeses();
        this.actualizarEstadoCheckboxes();
        this.renderizarHistorialCuotas();
    }

    limpiarFormularioCuota() {
        document.getElementById('formCuotaSocial').reset();
        document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
        document.getElementById('anioCuota').value = this.anioActual;
        document.getElementById('fechaPagoCuota').value = new Date().toISOString().split('T')[0];
        document.getElementById('totalAPagar').textContent = '$0';
        
        // Desmarcar todos los checkboxes
        document.querySelectorAll('input[name="meses"]').forEach(cb => {
            if (!cb.disabled) {
                cb.checked = false;
            }
        });
    }

    async exportarExcel() {
        const pagosBombero = this.pagosCuotas.filter(p => {
            const voluntarioId = p.voluntario || p.voluntario_id;
            return voluntarioId == this.bomberoActual.id;
        });
        if (pagosBombero.length === 0) {
            Utils.mostrarNotificacion('No hay pagos para exportar', 'error');
            return;
        }
        try {
            const datosExcel = pagosBombero.map((pago, index) => ({
                'N°': index + 1,
                'Voluntario': Utils.obtenerNombreCompleto(this.bomberoActual),
                'Clave': this.bomberoActual.claveBombero,
                'Mes': this.obtenerNombreMes(pago.mes),
                'Año': pago.anio,
                'Tipo': pago.es_estudiante ? 'Estudiante' : 'Regular',
                'Monto': pago.monto,
                'Fecha Pago': Utils.formatearFecha(pago.fecha_pago),
                'Forma Pago': pago.forma_pago || '-',
                'Observaciones': pago.observaciones || '-'
            }));
            await Utils.exportarAExcel(datosExcel, `Cuotas_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`, 'Cuotas Sociales');
            Utils.mostrarNotificacion('✅ Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('❌ Error al generar Excel: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }

    obtenerNombreMes(numero) {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[parseInt(numero) - 1];
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }

    // ==================== ESTADO DE CUOTAS ====================
    async cargarEstadoCuotas() {
        try {
            const response = await fetch(`${API_BASE}/${this.bomberoActual.id}/estado-cuotas-simple/`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.estadoCuotas = await response.json();
                console.log('[CUOTAS DJANGO] ✅ Estado de cuotas:', this.estadoCuotas);
                this.mostrarEstadoCuotas();
            }
        } catch (error) {
            console.warn('[CUOTAS DJANGO] ⚠️ Error al cargar estado de cuotas:', error);
        }
    }

    mostrarEstadoCuotas() {
        const infoDiv = document.getElementById('estadoCuotasInfo');
        const btnToggle = document.getElementById('btnToggleCuotas');
        const btnEstudiante = document.getElementById('btnActivarEstudiante');
        
        if (!this.estadoCuotas) return;
        
        // TAG ESTUDIANTE
        if (this.estadoCuotas.es_estudiante) {
            const bomberoDatos = document.getElementById('bomberoDatosCuotas');
            if (bomberoDatos && !document.getElementById('tagEstudiante')) {
                const tag = document.createElement('div');
                tag.id = 'tagEstudiante';
                tag.style.cssText = 'display: inline-block; background: #28a745; color: white; padding: 5px 10px; border-radius: 5px; margin-left: 10px; font-weight: bold;';
                tag.innerHTML = '🎓 ESTUDIANTE';
                bomberoDatos.appendChild(tag);
            }
        } else {
            // Quitar TAG si ya no es estudiante
            const tag = document.getElementById('tagEstudiante');
            if (tag) tag.remove();
        }
        
        if (this.estadoCuotas.cuotas_desactivadas) {
            // Mostrar mensaje de desactivación
            infoDiv.style.display = 'block';
            infoDiv.style.background = '#fff3cd';
            infoDiv.style.border = '1px solid #ffc107';
            infoDiv.style.color = '#856404';
            infoDiv.innerHTML = `
                <strong>⚠️ CUOTAS DESACTIVADAS</strong><br>
                <small>Motivo: ${this.estadoCuotas.motivo_desactivacion || 'No especificado'}</small>
            `;
            
            // Botón para reactivar
            btnToggle.style.display = 'inline-block';
            btnToggle.className = 'btn btn-success';
            btnToggle.innerHTML = '✅ Reactivar Cuotas';
            
            // Ocultar botón estudiante
            btnEstudiante.style.display = 'none';
        } else {
            // Cuotas activas
            infoDiv.style.display = 'none';
            
            // Botón para desactivar
            btnToggle.style.display = 'inline-block';
            btnToggle.className = 'btn btn-warning';
            btnToggle.innerHTML = '🔒 Desactivar Cuotas';
            
            // Botón ESTUDIANTE
            if (!this.estadoCuotas.es_estudiante) {
                // Mostrar ACTIVAR
                btnEstudiante.style.display = 'inline-block';
                btnEstudiante.className = 'btn btn-success';
                btnEstudiante.innerHTML = '➕ ACTIVAR ESTUDIANTE';
                btnEstudiante.onclick = () => this.abrirModalEstudiante();
            } else {
                // Mostrar DESACTIVAR
                btnEstudiante.style.display = 'inline-block';
                btnEstudiante.className = 'btn btn-danger';
                btnEstudiante.innerHTML = '❌ DESACTIVAR ESTUDIANTE';
                btnEstudiante.onclick = () => this.desactivarEstudiante();
            }
        }
        
        // Actualizar precios en select
        this.actualizarPreciosEnSelect();
    }

    async toggleCuotas() {
        const accion = this.estadoCuotas.cuotas_desactivadas ? 'reactivar' : 'desactivar';
        
        let motivo = '';
        if (accion === 'desactivar') {
            motivo = prompt('Ingrese el motivo para desactivar las cuotas:');
            if (!motivo) {
                Utils.mostrarNotificacion('Debe ingresar un motivo', 'error');
                return;
            }
        }
        
        const confirmacion = confirm(
            accion === 'desactivar' 
                ? '¿Está seguro de DESACTIVAR las cuotas? El voluntario NO aparecerá como deudor.'
                : '¿Está seguro de REACTIVAR las cuotas? El voluntario volverá a aparecer como deudor si tiene pagos pendientes.'
        );
        
        if (!confirmacion) return;
        
        try {
            const payload = {
                accion: accion,
                motivo: motivo,
                usuario: 'Admin' // TODO: Obtener usuario actual
            };
            
            const response = await fetch(`${API_BASE}/${this.bomberoActual.id}/estado-cuotas-simple/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al cambiar estado de cuotas');
            }
            
            const result = await response.json();
            
            Utils.mostrarNotificacion(`✅ ${result.mensaje}`, 'success');
            
            // Recargar estado
            await this.cargarEstadoCuotas();
            
        } catch (error) {
            Utils.mostrarNotificacion(`❌ ${error.message}`, 'error');
        }
    }

    // ==================== ACTIVAR ESTUDIANTE ====================
    async abrirModalEstudiante() {
        // Cargar ciclos
        try {
            const response = await fetch(`${API_BASE}/ciclos-cuotas-simple/`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const ciclos = await response.json();
                const select = document.getElementById('cicloEstudiante');
                
                select.innerHTML = '<option value="">Seleccione un ciclo</option>';
                ciclos.forEach(ciclo => {
                    const option = document.createElement('option');
                    option.value = ciclo.id;
                    option.textContent = `Ciclo ${ciclo.anio} (${ciclo.activo ? 'ACTIVO' : 'Inactivo'})`;
                    if (ciclo.activo) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.warn('[CUOTAS DJANGO] Error al cargar ciclos:', error);
        }
        
        // Abrir modal
        document.getElementById('modalEstudiante').style.display = 'flex';
    }

    cerrarModalEstudiante() {
        document.getElementById('modalEstudiante').style.display = 'none';
        document.getElementById('formActivarEstudiante').reset();
    }

    async guardarEstudiante(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        formData.append('ciclo_id', formData.get('cicloEstudiante'));
        formData.append('mes_inicio', formData.get('mesInicioEstudiante'));
        formData.append('observaciones', formData.get('observacionesEstudiante') || '');
        formData.append('certificado', formData.get('certificadoEstudiante'));
        
        try {
            const response = await fetch(`${API_BASE}/${this.bomberoActual.id}/activar-estudiante-simple/`, {
                method: 'POST',
                credentials: 'include',
                body: formData
                // NO enviar Content-Type, el navegador lo hace automáticamente para FormData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al activar estudiante');
            }
            
            const result = await response.json();
            
            Utils.mostrarNotificacion(`✅ ${result.mensaje}`, 'success');
            
            // Cerrar modal
            this.cerrarModalEstudiante();
            
            // Recargar estado
            await this.cargarEstadoCuotas();
            
        } catch (error) {
            Utils.mostrarNotificacion(`❌ ${error.message}`, 'error');
        }
    }

    async desactivarEstudiante() {
        if (!confirm('¿Está seguro de desactivar el estado de ESTUDIANTE?\n\nEl voluntario volverá a pagar cuota regular.')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/${this.bomberoActual.id}/desactivar-estudiante-simple/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al desactivar estudiante');
            }
            
            const result = await response.json();
            
            Utils.mostrarNotificacion(`✅ ${result.mensaje}`, 'success');
            
            // Recargar estado
            await this.cargarEstadoCuotas();
            
        } catch (error) {
            Utils.mostrarNotificacion(`❌ ${error.message}`, 'error');
        }
    }
}

// ==================== FUNCIÓN PARA GENERAR PDF ====================
function generarPDFCuotas() {
    if (!cuotasSistemaDjango || !cuotasSistemaDjango.bomberoActual) {
        Utils.mostrarNotificacion('No hay voluntario cargado', 'error');
        return;
    }
    
    const voluntarioId = cuotasSistemaDjango.bomberoActual.id;
    const anio = cuotasSistemaDjango.anioActual;
    
    // Abrir PDF en nueva pestaña
    const pdfUrl = `/api/voluntarios/${voluntarioId}/pdf-cuotas/${anio}/`;
    window.open(pdfUrl, '_blank');
    
    Utils.mostrarNotificacion('📄 Generando PDF de cuotas...', 'success');
}

// Inicializar sistema cuando el DOM esté listo
let cuotasSistemaDjango;
document.addEventListener('DOMContentLoaded', () => {
    cuotasSistemaDjango = new SistemaCuotasDjango();
});
