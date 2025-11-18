// ==================== SISTEMA DE CUOTAS SOCIALES ====================
class SistemaCuotas {
    constructor() {
        this.bomberoActual = null;
        this.pagosCuotas = [];
        this.anioActual = new Date().getFullYear();
        this.preciosCuotas = this.obtenerPreciosConfigurados();
        this.init();
    }

    obtenerPreciosConfigurados() {
        const configGuardada = localStorage.getItem('configuracionCuotas');
        if (configGuardada) {
            return JSON.parse(configGuardada);
        }
        // Valores por defecto si no hay configuración
        return {
            precioRegular: 5000,
            precioEstudiante: 3000
        };
    }
async init() {
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return;
    }

    const sePudoCargar = await this.cargarBomberoActual();
    if (!sePudoCargar) {
        // El bombero está exento o no existe, no continuar
        return;
    }
    
    await this.cargarDatos();
    this.configurarInterfaz();
    //this.inicializarSelectorAños(); // Deshabilitado temporalmente
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
            console.log('[CUOTAS] Cargando bombero ID:', bomberoId);
            const response = await fetch(`/api/voluntarios/${bomberoId}/`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Bombero no encontrado');
            }
            
            this.bomberoActual = await response.json();
            console.log('[CUOTAS] ✅ Bombero cargado:', this.bomberoActual);
            
        } catch (error) {
            console.error('[CUOTAS] ❌ Error al cargar bombero:', error);
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return false;
        }

        // VERIFICAR SI ESTÁ EXENTO DE PAGAR CUOTAS
        const categoria = Utils.calcularCategoriaBombero(this.bomberoActual.fechaIngreso);
        const categoriaTexto = categoria.categoria || categoria;
        const estadoBombero = this.bomberoActual.estadoBombero || 'activo';
        const esHonorarioCompania = categoriaTexto === 'Voluntario Honorario de Compañía';
        const esHonorarioCuerpo = categoriaTexto === 'Voluntario Honorario del Cuerpo';
        const esInsigne = categoriaTexto === 'Voluntario Insigne de Chile';
        const esMartir = estadoBombero === 'martir';
        const tieneCuotasActivas = this.bomberoActual.cuotasActivas !== false;
        
        // Solo bloquear si es exento (Honorario Compañía, Honorario Cuerpo, Insigne o Mártir) Y no tiene cuotas activadas
        if ((esHonorarioCompania || esHonorarioCuerpo || esInsigne || esMartir) && !tieneCuotasActivas) {
            // BLOQUEAR ACCESO: Reemplazar TODO el contenido
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Arial; background: #f5f5f5;">
                    <h1 style="color: #f44336; font-size: 72px; margin: 0;">❌</h1>
                    <h2 style="color: #333; margin-top: 20px;">Acceso Denegado</h2>
                    <p style="font-size: 20px; color: #666; margin: 10px 0;">${this.bomberoActual.nombre || 'Este voluntario'} es <strong style="color: #f44336;">${categoria || 'MÁRTIR'}</strong></p>
                    <p style="font-size: 18px; color: #666;">Los ${categoria || 'MÁRTIRES'} <strong>NO deben pagar cuotas sociales</strong>.</p>
                    <p style="color: #999; margin-top: 40px; font-size: 14px;">Redirigiendo al sistema en 3 segundos...</p>
                </div>
            `;
            setTimeout(() => window.location.href = 'sistema.html', 3000);
            return false;
        }

        this.mostrarInfoBombero();
        return true;
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

    async cargarDatos() {
        try {
            console.log('[CUOTAS] Cargando pagos de cuotas...');
            const response = await fetch(`/api/voluntarios/pagos-cuotas/?voluntario_id=${this.bomberoActual.id}`, {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Error al cargar cuotas');
            
            const data = await response.json();
            this.pagosCuotas = data.results || data;
            console.log('[CUOTAS] ✅ Pagos cargados:', this.pagosCuotas.length);
            
        } catch (error) {
            console.error('[CUOTAS] ❌ Error al cargar pagos:', error);
            this.pagosCuotas = [];
        }
    }

    configurarInterfaz() {
        // Actualizar selector con precios configurados
        this.actualizarSelectorPrecios();
        
        document.getElementById('formCuotaSocial').addEventListener('submit', (e) => {
            this.manejarSubmitCuota(e);
        });

        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPagoCuota').value = hoy;
        document.getElementById('anioCuota').value = this.anioActual;
        
        document.querySelectorAll('input[name="meses"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.actualizarTotalAPagar());
        });
    }

    actualizarSelectorPrecios() {
        const selector = document.getElementById('tipoCuota');
        const formatearPrecio = (precio) => {
            return new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(precio);
        };
        
        // Actualizar opciones con precios configurados
        selector.innerHTML = `
            <option value="">Seleccione tipo</option>
            <option value="regular">Cuota Regular - ${formatearPrecio(this.preciosCuotas.precioRegular)}</option>
            <option value="estudiante">Cuota Estudiante - ${formatearPrecio(this.preciosCuotas.precioEstudiante)}</option>
        `;
    }

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
        document.getElementById('totalAPagar').textContent = this.formatearMonto(total);
    }

    async manejarSubmitCuota(event) {
        
        event.preventDefault();
        // Verificación de año bloqueado deshabilitada temporalmente
        //if (!this.verificarAñoBloqueado()) {
        //    return;
        //}

        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const mesesSeleccionados = Array.from(
            document.querySelectorAll('input[name="meses"]:checked')
        ).map(cb => parseInt(cb.value));
        
        const errores = this.validarDatosCuota(datos, mesesSeleccionados);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            for (const mes of mesesSeleccionados) {
                await this.guardarPagoCuota({
                    ...datos,
                    mesCuota: mes
                });
            }
            
            Utils.mostrarNotificacion(`Pago de ${mesesSeleccionados.length} cuota(s) registrado exitosamente`, 'success');
            this.limpiarFormulario();
            this.renderizarTodo();
            
            const montoPorMes = datos.tipoCuota === 'regular' ? this.preciosCuotas.precioRegular : this.preciosCuotas.precioEstudiante;
            const montoTotal = montoPorMes * mesesSeleccionados.length;
            const mesesTexto = mesesSeleccionados.map(m => this.obtenerNombreMes(m)).join(', ');
            
            await this.registrarIngresoFinanzas({
                monto: montoTotal,
                tipo: 'Cuotas sociales',
                descripcion: `Pago cuotas sociales (${mesesTexto}) ${datos.anioCuota} - ${Utils.obtenerNombreCompleto(this.bomberoActual)}`,
                fecha: datos.fechaPagoCuota
            });
            
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosCuota(datos, mesesSeleccionados) {
    const errores = [];
    
    if (!datos.tipoCuota) errores.push('Debe seleccionar tipo de cuota');
    if (mesesSeleccionados.length === 0) errores.push('Debe seleccionar al menos un mes');
    if (!datos.anioCuota) errores.push('Debe ingresar el año');
    if (!datos.fechaPagoCuota) errores.push('Debe ingresar la fecha de pago');
    if (!datos.formaPagoCuota) errores.push('Debe seleccionar la forma de pago');
        
    for (const mes of mesesSeleccionados) {
        const yaExiste = this.pagosCuotas.some(p => 
            p.bomberoId == this.bomberoActual.id && 
            p.mes == mes && 
            p.anio == datos.anioCuota
        );
        
        if (yaExiste) {
            errores.push(`Ya existe un pago para ${this.obtenerNombreMes(mes)}`);
            mes: parseInt(datos.mesCuota),
            anio: parseInt(datos.anioCuota),
            monto: montoPorCuota,
            fecha_pago: datos.fechaPagoCuota,
            forma_pago: datos.formaPagoCuota || 'Efectivo',
            observaciones: datos.observacionesCuota || '',
            es_estudiante: datos.tipoCuota === 'estudiante'
        };
        
        console.log('[CUOTAS] 💾 Guardando pago:', payload);
        
        const response = await fetch('/api/voluntarios/pagos-cuotas/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || error.error || 'Error al guardar el pago');
        }
        
        const nuevoPago = await response.json();
        console.log('[CUOTAS] ✅ Pago guardado:', nuevoPago);
        
        // Agregar a la lista local
        this.pagosCuotas.push(nuevoPago);
    }

    async registrarIngresoFinanzas(datos) {
        
        const movimientos = storage.getMovimientosFinancieros();
        
        const movimiento = {
            id: this.generarId(),
            tipo: 'ingreso',
            monto: datos.monto,
            categoria: datos.tipo,
            detalle: datos.descripcion,
            fecha: datos.fecha,
            descripcion: datos.descripcion,
            comprobante: null,
            nombreComprobanteOriginal: null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        movimientos.push(movimiento);
        storage.saveMovimientosFinancieros(movimientos);
    }

    renderizarTodo() {
        this.renderizarGridMeses();
        this.renderizarHistorialCuotas();
    }

    renderizarGridMeses() {
        const grid = document.getElementById('gridMesesCuotas');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        document.getElementById('anioActualCuotas').textContent = this.anioActual;

        const html = meses.map((mes, index) => {
            const numeroMes = index + 1;
            const pago = this.pagosCuotas.find(p => p.bomberoId == this.bomberoActual.id && p.mes == numeroMes && p.anio == this.anioActual);
            let estadoClass = 'pendiente';
            let estadoTexto = 'Pendiente';
            if (pago) {
                estadoClass = 'pagado';
                estadoTexto = `Pagado: ${this.formatearMonto(pago.monto)}`;
            }
            return `<div class="mes-card ${estadoClass}"><div class="mes-nombre">${mes}</div><div class="mes-estado">${estadoTexto}</div></div>`;
        }).join('');

        grid.innerHTML = html;
    }

    renderizarHistorialCuotas() {
        const lista = document.getElementById('listaCuotas');
        const total = document.getElementById('totalPagosCuotas');
        const pagosBombero = this.pagosCuotas.filter(p => p.bomberoId == this.bomberoActual.id).sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
        total.textContent = pagosBombero.length;
        if (pagosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay pagos de cuotas registrados</p>';
            return;
        }
        lista.innerHTML = pagosBombero.map(pago => `
    <div class="pago-card">
        <div class="pago-header">
            <div>
                <strong>${this.obtenerNombreMes(pago.mes)} ${pago.anio}</strong> - 
                <span>${pago.tipoCuota === 'regular' ? 'Cuota Regular' : 'Cuota Estudiante'}</span>
            </div>
            <div class="pago-monto">${this.formatearMonto(pago.monto)}</div>
        </div>
        <div class="item-info">
            <div><strong>Fecha de pago:</strong> <span>${Utils.formatearFecha(pago.fechaPago)}</span></div>
            ${pago.formaPago ? `<div><strong>Forma de pago:</strong> <span>${pago.formaPago}</span></div>` : ''}
            ${pago.comprobante ? `
                <div style="grid-column: 1 / -1;">
                    <strong>Comprobante:</strong>
                    <button onclick="cuotasSistema.verComprobante('${pago.id}')" 
                            class="btn-ver-comprobante"
                            style="margin-left: 10px; padding: 5px 15px; background: #9c27b0; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        👁️ Ver Comprobante
                    </button>
                </div>
            ` : ''}
            ${pago.observaciones ? `<div><strong>Observaciones:</strong> <span>${pago.observaciones}</span></div>` : ''}
            <div><strong>Registrado por:</strong> <span>${pago.registradoPor}</span></div>
        </div>
    </div>
`).join('');
    }

    async exportarExcel() {
        const pagosBombero = this.pagosCuotas.filter(p => p.bomberoId == this.bomberoActual.id);
        if (pagosBombero.length === 0) {
            Utils.mostrarNotificacion('No hay pagos para exportar', 'error');
            return;
        }
        try {
            const datosExcel = pagosBombero.map((pago, index) => ({'N°': index + 1, 'Voluntario': Utils.obtenerNombreCompleto(this.bomberoActual), 'Clave': this.bomberoActual.claveBombero, 'Mes': this.obtenerNombreMes(pago.mes), 'Año': pago.anio, 'Tipo': pago.tipoCuota === 'regular' ? 'Regular' : 'Estudiante', 'Monto': pago.monto, 'Fecha Pago': Utils.formatearFecha(pago.fechaPago), 'Observaciones': pago.observaciones || '-', 'Registrado por': pago.registradoPor}));
            await Utils.exportarAExcel(datosExcel, `Cuotas_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`, 'Cuotas Sociales');
            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    generarId() { return Date.now() + Math.random().toString(36).substr(2, 9); }
    guardarDatos() { storage.savePagosCuotas(this.pagosCuotas); }
    formatearMonto(monto) { return new Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP', minimumFractionDigits: 0}).format(monto); }
    obtenerNombreMes(numero) { const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']; return meses[parseInt(numero) - 1]; }

   limpiarFormulario() {
    document.getElementById('formCuotaSocial').reset();
    document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
    document.getElementById('anioCuota').value = this.anioActual;
    document.getElementById('fechaPagoCuota').value = new Date().toISOString().split('T')[0];
    document.getElementById('totalAPagar').textContent = '$0';
    document.querySelectorAll('input[name="meses"]').forEach(cb => cb.checked = false);
    document.getElementById('previewComprobanteCuota').innerHTML = '';
}

    volverAlSistema() {
        localStorage.removeItem('bomberoCuotasActual');
        window.location.href = 'sistema.html';
    }
    previsualizarComprobante(input) {
    const preview = document.getElementById('previewComprobanteCuota');
    preview.innerHTML = '';
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        if (fileSize > 5) {
            Utils.mostrarNotificacion('El archivo no debe superar los 5MB', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.startsWith('image/')) {
                preview.innerHTML = `
                    <div style="margin-top: 10px;">
                        <img src="${e.target.result}" 
                             style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #e0e0e0;">
                        <p style="margin-top: 5px; font-size: 0.85rem; color: #666;">
                            📎 ${file.name} (${fileSize} MB)
                        </p>
                    </div>
                `;
            } else if (file.type === 'application/pdf') {
                preview.innerHTML = `
                    <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 8px;">
                        <p style="font-size: 0.9rem; color: #666;">
                            📄 ${file.name} (${fileSize} MB)
                        </p>
                    </div>
                `;
            }

        };
        reader.readAsDataURL(file);
    }


}verComprobante(pagoId) {
    const pago = this.pagosCuotas.find(p => p.id === pagoId);
    if (!pago || !pago.comprobante) {
        Utils.mostrarNotificacion('No hay comprobante disponible', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const isPDF = pago.nombreComprobanteOriginal && pago.nombreComprobanteOriginal.toLowerCase().endsWith('.pdf');
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 15px; max-width: 90%; max-height: 90%; overflow: auto; position: relative;">
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="position: absolute; top: 10px; right: 10px; background: #f44336; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer;">
                ✕
            </button>
            <h3 style="margin-bottom: 15px; color: #333;">📎 Comprobante de Pago</h3>
            <p style="margin-bottom: 15px; color: #666;">
                <strong>Archivo:</strong> ${pago.nombreComprobanteOriginal || 'Comprobante'}<br>
                <strong>Mes:</strong> ${this.obtenerNombreMes(pago.mes)} ${pago.anio}<br>
                <strong>Monto:</strong> ${this.formatearMonto(pago.monto)}
            </p>
            ${isPDF ? 
                `<p style="text-align: center; padding: 20px; color: #666;">
                    📄 Archivo PDF - 
                    <a href="${pago.comprobante}" download="${pago.nombreComprobanteOriginal}" 
                       style="color: #9c27b0; text-decoration: underline;">
                        Descargar comprobante
                    </a>
                </p>` :
                `<img src="${pago.comprobante}" 
                      style="max-width: 100%; max-height: 70vh; border-radius: 8px; display: block; margin: 0 auto;">`
            }
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}  inicializarSelectorAños() {
        // Obtener años únicos de los pagos cargados
        const añosUnicos = [...new Set(this.pagosCuotas.map(p => p.anio || p.año))];
        const años = añosUnicos.sort((a, b) => b - a);
        
        // Crear selector si no existe
        let selectorContainer = document.getElementById('selectorAñosContainer');
        if (!selectorContainer) {
            const gridMeses = document.querySelector('.cuotas-grid');
            selectorContainer = document.createElement('div');
            selectorContainer.id = 'selectorAñosContainer';
            selectorContainer.className = 'selector-años-container';
            gridMeses.insertBefore(selectorContainer, gridMeses.firstChild);
        }
        
        const añoData = cuotasPorAño[this.anioActual];
        const estadoAño = añoData ? añoData.estado : 'activo';
        const bloqueado = añoData ? añoData.bloqueado : false;
        
        selectorContainer.innerHTML = `
            <div class="selector-años-header">
                <div class="años-navegacion">
                    <button onclick="cuotasSistema.cambiarAño(${this.anioActual - 1})" 
                            class="btn-año-nav" title="Año anterior">
                        ◀ ${this.anioActual - 1}
                    </button>
                    
                    <div class="año-actual-display">
                        <div class="año-numero">${this.anioActual}</div>
                        <div class="año-estado estado-${estadoAño}">
                            ${bloqueado ? '🔒' : ''} ${estadoAño.toUpperCase()}
                        </div>
                    </div>
                    
                    <button onclick="cuotasSistema.cambiarAño(${this.anioActual + 1})" 
                            class="btn-año-nav" title="Año siguiente">
                        ${this.anioActual + 1} ▶
                    </button>
                </div>
                
                <div class="años-acciones">
                    ${estadoAño === 'activo' ? `
                        <button onclick="cuotasSistema.mostrarPopupCerrarAño()" 
                                class="btn btn-cerrar-año">
                            🔒 Cerrar Año ${this.anioActual}
                        </button>
                    ` : `
                        <div class="info-año-cerrado">
                            <strong>Año Cerrado</strong><br>
                            <small>Cerrado el: ${Utils.formatearFecha(añoData.fechaCierre)}</small><br>
                            <small>Por: ${añoData.cerradoPor}</small>
                            ${bloqueado && getCurrentUser().role === 'Super Administrador' ? `
                                <button onclick="cuotasSistema.mostrarPopupDesbloquearAño()" 
                                        class="btn btn-secondary btn-sm" style="margin-top: 10px;">
                                    🔓 Desbloquear
                                </button>
                            ` : bloqueado ? `
                                <div style="color: #f44336; margin-top: 5px;">
                                    ⚠️ Solo Super Admin puede desbloquear
                                </div>
                            ` : ''}
                        </div>
                    `}
                    
                    <button onclick="cuotasSistema.verHistorialAños()" 
                            class="btn btn-secondary">
                        📂 Ver Historial
                    </button>
                </div>
            </div>
        `;
    }
    
    cambiarAño(nuevoAño) {
        const cuotasPorAño = storage.getCuotasPorAño();
        
        // Verificar si el año existe, si no, crearlo
        if (!cuotasPorAño[nuevoAño]) {
            const confirmar = confirm(`El año ${nuevoAño} no existe. ¿Desea crearlo?`);
            if (confirmar) {
                storage.crearNuevoAñoCuotas(nuevoAño);
                Utils.mostrarNotificacion(`Año ${nuevoAño} creado exitosamente`, 'success');
            } else {
                return;
            }
        }
        
        this.anioActual = nuevoAño;
        document.getElementById('anioActualCuotas').textContent = nuevoAño;
        document.getElementById('anioCuota').value = nuevoAño;
        
        this.inicializarSelectorAños();
        this.renderizarGridMeses();
        this.renderizarHistorial();
    }
    
    mostrarPopupCerrarAño() {
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content popup-cerrar-año">
                <div class="popup-header">
                    <h3>🔒 Cerrar Año ${this.anioActual}</h3>
                    <button onclick="this.closest('.popup-overlay').remove()" class="btn-cerrar-popup">✕</button>
                </div>
                
                <div class="popup-body">
                    <div class="warning-box">
                        <strong>⚠️ ADVERTENCIA</strong>
                        <p>Está a punto de cerrar el año ${this.anioActual}.</p>
                    </div>
                    
                    <div class="info-box">
                        <strong>¿Qué sucederá?</strong>
                        <ul>
                            <li>✅ Se creará el año ${this.anioActual + 1} automáticamente</li>
                            <li>✅ Los datos de ${this.anioActual} se conservarán</li>
                            <li>✅ Se podrán consultar en modo lectura</li>
                        </ul>
                    </div>
                    
                    <div class="form-group">
                        <label><strong>¿Bloquear año para auditoría?</strong></label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="bloquearAño" value="si" checked>
                                <span>Sí, bloquear (no se puede modificar)</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="bloquearAño" value="no">
                                <span>No, mantener editable</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><strong>Motivo del cierre (opcional):</strong></label>
                        <textarea id="motivoCierre" rows="3" 
                                  placeholder="Ej: Cierre anual para auditoría"
                                  class="form-control"></textarea>
                    </div>
                </div>
                
                <div class="popup-footer">
                    <button onclick="this.closest('.popup-overlay').remove()" 
                            class="btn btn-secondary">
                        Cancelar
                    </button>
                    <button onclick="cuotasSistema.confirmarCierreAño()" 
                            class="btn btn-cerrar-año">
                        ✅ Confirmar Cierre
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
    }
    
    confirmarCierreAño() {
        const bloquear = document.querySelector('input[name="bloquearAño"]:checked').value === 'si';
        const motivo = document.getElementById('motivoCierre').value.trim();
        const usuario = getCurrentUser();
        
        // Verificar permisos
        if (usuario.role !== 'Tesorero' && usuario.role !== 'Super Administrador' && usuario.role !== 'Director') {
            Utils.mostrarNotificacion('No tienes permisos para cerrar el año', 'error');
            return;
        }
        
        const datosAño = {
            bloqueado: bloquear,
            fechaCierre: new Date().toISOString(),
            cerradoPor: usuario.username,
            motivoCierre: motivo || 'Cierre anual'
        };
        
        // Cerrar año
        const exito = storage.cerrarAñoCuotas(this.anioActual, datosAño);
        
        if (exito) {
            // Crear año siguiente
            storage.crearNuevoAñoCuotas(this.anioActual + 1);
            
            // Registrar en auditoría
            storage.saveLogAuditoria({
                tipo: 'cuotas',
                fecha: new Date().toISOString(),
                usuario: usuario.username,
                accion: 'cierre_año',
                detalles: `Año ${this.anioActual} cerrado y bloqueado: ${bloquear}`,
                motivo: motivo,
                año: this.anioActual,
                bloqueado: bloquear
            });
            
            Utils.mostrarNotificacion(`✅ Año ${this.anioActual} cerrado exitosamente`, 'success');
            
            // Cerrar popup
            document.querySelector('.popup-overlay').remove();
            
            // Cambiar al año siguiente
            this.cambiarAño(this.anioActual + 1);
        } else {
            Utils.mostrarNotificacion('Error al cerrar el año', 'error');
        }
    }
    
    mostrarPopupDesbloquearAño() {
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content popup-desbloquear">
                <div class="popup-header">
                    <h3>🔓 Desbloquear Año ${this.anioActual}</h3>
                    <button onclick="this.closest('.popup-overlay').remove()" class="btn-cerrar-popup">✕</button>
                </div>
                
                <div class="popup-body">
                    <div class="warning-box">
                        <strong>⚠️ ACCIÓN DE SUPER ADMINISTRADOR</strong>
                        <p>Estás a punto de desbloquear un año cerrado.</p>
                        <p>Esta acción quedará registrada en el log de auditoría.</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="required"><strong>Motivo del desbloqueo:</strong></label>
                        <textarea id="motivoDesbloqueo" rows="3" required
                                  placeholder="Debe justificar el motivo del desbloqueo"
                                  class="form-control"></textarea>
                        <small style="color: #f44336;">* Campo obligatorio para auditoría</small>
                    </div>
                </div>
                
                <div class="popup-footer">
                    <button onclick="this.closest('.popup-overlay').remove()" 
                            class="btn btn-secondary">
                        Cancelar
                    </button>
                    <button onclick="cuotasSistema.confirmarDesbloqueoAño()" 
                            class="btn btn-success">
                        🔓 Confirmar Desbloqueo
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
    }
    
    confirmarDesbloqueoAño() {
        const motivo = document.getElementById('motivoDesbloqueo').value.trim();
        const usuario = getCurrentUser();
        
        // Verificar que sea Super Admin
        if (usuario.role !== 'Super Administrador') {
            Utils.mostrarNotificacion('Solo Super Administrador puede desbloquear', 'error');
            return;
        }
        
        // Validar motivo
        if (!motivo || motivo.length < 10) {
            Utils.mostrarNotificacion('Debe ingresar un motivo válido (mínimo 10 caracteres)', 'error');
            return;
        }
        
        // Desbloquear
        const exito = storage.desbloquearAñoCuotas(this.anioActual, usuario.username, motivo);
        
        if (exito) {
            Utils.mostrarNotificacion(`✅ Año ${this.anioActual} desbloqueado`, 'success');
            
            // Cerrar popup
            document.querySelector('.popup-overlay').remove();
            
            // Recargar vista
            this.inicializarSelectorAños();
        } else {
            Utils.mostrarNotificacion('Error al desbloquear el año', 'error');
        }
    }
    
    verHistorialAños() {
        const cuotasPorAño = storage.getCuotasPorAño();
        const años = Object.keys(cuotasPorAño).map(Number).sort((a, b) => b - a);
        
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content popup-historial-años">
                <div class="popup-header">
                    <h3>📂 Historial de Años</h3>
                    <button onclick="this.closest('.popup-overlay').remove()" class="btn-cerrar-popup">✕</button>
                </div>
                
                <div class="popup-body">
                    <table class="tabla-años">
                        <thead>
                            <tr>
                                <th>Año</th>
                                <th>Estado</th>
                                <th>Bloqueado</th>
                                <th>Fecha Cierre</th>
                                <th>Cerrado Por</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${años.map(año => {
                                const data = cuotasPorAño[año];
                                return `
                                    <tr class="${año === this.anioActual ? 'año-activo-row' : ''}">
                                        <td><strong>${año}</strong></td>
                                        <td>
                                            <span class="badge badge-${data.estado}">
                                                ${data.estado === 'activo' ? '✅' : '🔒'} ${data.estado}
                                            </span>
                                        </td>
                                        <td>
                                            ${data.bloqueado ? '🔒 Sí' : '🔓 No'}
                                        </td>
                                        <td>
                                            ${data.fechaCierre ? Utils.formatearFecha(data.fechaCierre) : '-'}
                                        </td>
                                        <td>
                                            ${data.cerradoPor || '-'}
                                        </td>
                                        <td>
                                            <button onclick="cuotasSistema.cambiarAño(${año}); 
                                                           document.querySelector('.popup-overlay').remove();"
                                                    class="btn btn-sm btn-info">
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="popup-footer">
                    <button onclick="this.closest('.popup-overlay').remove()" 
                            class="btn btn-secondary">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
    }
    
    verificarAñoBloqueado() {
        const cuotasPorAño = storage.getCuotasPorAño();
        const añoData = cuotasPorAño[this.anioActual];
        
        if (añoData && añoData.bloqueado) {
            const usuario = getCurrentUser();
            if (usuario.role !== 'Super Administrador') {
                Utils.mostrarNotificacion('⚠️ Este año está bloqueado. Solo Super Administrador puede modificarlo.', 'warning');
                return false;
            }
        }
        return true;
    }


}

document.addEventListener('DOMContentLoaded', () => { window.cuotasSistema = new SistemaCuotas(); });