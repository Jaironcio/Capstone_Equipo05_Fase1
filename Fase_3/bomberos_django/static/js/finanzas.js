// ==================== SISTEMA DE FINANZAS ====================
class SistemaFinanzas {
    constructor() {
        this.movimientos = [];
        this.filtroTipo = 'todos';
        this.filtroCategoria = 'todas';
        this.filtroFechaDesde = '';
        this.filtroFechaHasta = '';
        this.pagination = null;
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.cargarMovimientos();
        this.configurarEventos();
        this.aplicarPermisosUI();
        this.actualizarResumen();
        this.renderizarMovimientos();
    }

    cargarMovimientos() {
        this.movimientos = storage.getMovimientosFinancieros();
    }

    configurarEventos() {
        document.getElementById('formIngreso').addEventListener('submit', (e) => {
            this.manejarSubmitIngreso(e);
        });

        document.getElementById('formEgreso').addEventListener('submit', (e) => {
            this.manejarSubmitEgreso(e);
        });

        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaIngreso').value = hoy;
        document.getElementById('fechaEgreso').value = hoy;
    }

    aplicarPermisosUI() {
        const permisos = getUserPermissions();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!permisos || !permisos.canEditFinanzas) {
            document.querySelector('.botones-principales').style.display = 'none';
            
            const mensaje = document.createElement('div');
            mensaje.className = 'info-solo-lectura';
            mensaje.innerHTML = `
                <h3>👁️ Modo Solo Lectura</h3>
                <p>Como <strong>${currentUser.role}</strong>, puedes visualizar los movimientos financieros pero no registrar nuevos.</p>
            `;
            mensaje.style.cssText = `
                background: rgba(76, 175, 80, 0.1);
                border: 2px solid rgba(76, 175, 80, 0.3);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                text-align: center;
            `;
            document.querySelector('.page-content').insertBefore(
                mensaje, 
                document.querySelector('.resumen-financiero').nextSibling
            );
        }
    }

    mostrarFormulario(tipo) {
        this.cerrarFormulario();
        
        if (tipo === 'ingreso') {
            document.getElementById('formContainerIngreso').style.display = 'block';
        } else {
            document.getElementById('formContainerEgreso').style.display = 'block';
        }
        
        setTimeout(() => {
            const form = document.getElementById(`formContainer${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    cerrarFormulario() {
        document.getElementById('formContainerIngreso').style.display = 'none';
        document.getElementById('formContainerEgreso').style.display = 'none';
        this.limpiarFormularioIngreso();
        this.limpiarFormularioEgreso();
    }

    cambioTipoIngreso() {
        const tipo = document.getElementById('tipoIngreso').value;
        const campoDetalle = document.getElementById('campoDetalleIngreso');
        const inputDetalle = document.getElementById('detalleIngreso');

        if (tipo === 'Otro') {
            campoDetalle.style.display = 'block';
            inputDetalle.setAttribute('required', 'required');
        } else {
            campoDetalle.style.display = 'none';
            inputDetalle.removeAttribute('required');
        }
    }

    async previsualizarArchivo(input, previewId) {
        const preview = document.getElementById(previewId);
        
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
                Utils.mostrarNotificacion('El archivo no debe superar los 5MB', 'error');
                input.value = '';
                return;
            }

            preview.style.display = 'block';
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; border-radius: 8px;">`;
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = `<p>📄 ${file.name}</p>`;
            }
        }
    }

    async manejarSubmitIngreso(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = {
            monto: formData.get('montoIngreso'),
            tipoIngreso: formData.get('tipoIngreso'),
            detalleIngreso: formData.get('detalleIngreso'),
            fecha: formData.get('fechaIngreso'),
            descripcion: formData.get('descripcionIngreso'),
            comprobante: document.getElementById('comprobanteIngreso').files[0]
        };

        try {
            await this.guardarIngreso(datos);
            Utils.mostrarNotificacion('Ingreso registrado exitosamente', 'success');
            this.cerrarFormulario();
            this.actualizarResumen();
            this.renderizarMovimientos();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    async manejarSubmitEgreso(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = {
            monto: formData.get('montoEgreso'),
            motivo: formData.get('motivoEgreso'),
            fecha: formData.get('fechaEgreso'),
            numeroDocumento: formData.get('numeroDocumentoEgreso'),
            descripcion: formData.get('descripcionEgreso'),
            comprobante: document.getElementById('comprobanteEgreso').files[0]
        };

        try {
            await this.guardarEgreso(datos);
            Utils.mostrarNotificacion('Egreso registrado exitosamente', 'success');
            this.cerrarFormulario();
            this.actualizarResumen();
            this.renderizarMovimientos();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    async guardarIngreso(datos) {
        let comprobanteData = null;
        if (datos.comprobante) {
            comprobanteData = await Utils.leerArchivoComoBase64(datos.comprobante);
        }

        let detalleIngreso = datos.tipoIngreso;
        if (datos.tipoIngreso === 'Otro' && datos.detalleIngreso) {
            detalleIngreso = datos.detalleIngreso;
        }

        const movimiento = {
            id: this.generarId(),
            tipo: 'ingreso',
            monto: parseFloat(datos.monto),
            categoria: datos.tipoIngreso,
            detalle: detalleIngreso,
            fecha: datos.fecha,
            descripcion: datos.descripcion,
            comprobante: comprobanteData,
            nombreComprobanteOriginal: datos.comprobante ? datos.comprobante.name : null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.movimientos.push(movimiento);
        this.guardarDatos();
    }

    async guardarEgreso(datos) {
        const saldoActual = this.calcularSaldo();
        if (parseFloat(datos.monto) > saldoActual) {
            throw new Error('No hay suficiente saldo para realizar este egreso');
        }

        let comprobanteData = null;
        if (datos.comprobante) {
            comprobanteData = await Utils.leerArchivoComoBase64(datos.comprobante);
        }

        const movimiento = {
            id: this.generarId(),
            tipo: 'egreso',
            monto: parseFloat(datos.monto),
            categoria: datos.motivo,
            numeroDocumento: datos.numeroDocumento || null,
            fecha: datos.fecha,
            descripcion: datos.descripcion,
            comprobante: comprobanteData,
            nombreComprobanteOriginal: datos.comprobante ? datos.comprobante.name : null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.movimientos.push(movimiento);
        this.guardarDatos();
    }

    generarId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    guardarDatos() {
        storage.saveMovimientosFinancieros(this.movimientos);
    }

    calcularSaldo() {
        const ingresos = this.movimientos
            .filter(m => m.tipo === 'ingreso')
            .reduce((sum, m) => sum + m.monto, 0);
        
        const egresos = this.movimientos
            .filter(m => m.tipo === 'egreso')
            .reduce((sum, m) => sum + m.monto, 0);
        
        return ingresos - egresos;
    }

    actualizarResumen() {
        const ingresos = this.movimientos
            .filter(m => m.tipo === 'ingreso')
            .reduce((sum, m) => sum + m.monto, 0);
        
        const egresos = this.movimientos
            .filter(m => m.tipo === 'egreso')
            .reduce((sum, m) => sum + m.monto, 0);
        
        const saldo = ingresos - egresos;

        document.getElementById('saldoActual').textContent = this.formatearMonto(saldo);
        document.getElementById('totalIngresos').textContent = this.formatearMonto(ingresos);
        document.getElementById('totalEgresos').textContent = this.formatearMonto(egresos);
        
        const saldoElement = document.getElementById('saldoActual');
        const cardBalance = saldoElement.closest('.resumen-card');
        
        if (saldo < 0) {
            cardBalance.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        } else if (saldo === 0) {
            cardBalance.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        } else {
            cardBalance.style.background = 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)';
        }
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }

    aplicarFiltrosAvanzados() {
        this.filtroTipo = document.getElementById('filtroTipo').value;
        this.filtroCategoria = document.getElementById('filtroCategoria').value;
        this.filtroFechaDesde = document.getElementById('filtroFechaDesde').value;
        this.filtroFechaHasta = document.getElementById('filtroFechaHasta').value;
        
        const busqueda = document.getElementById('buscadorMovimientos').value.toLowerCase();
        
        this.renderizarMovimientos(busqueda);
    }

    limpiarFiltros() {
        document.getElementById('buscadorMovimientos').value = '';
        document.getElementById('filtroTipo').value = 'todos';
        document.getElementById('filtroCategoria').value = 'todas';
        document.getElementById('filtroFechaDesde').value = '';
        document.getElementById('filtroFechaHasta').value = '';
        
        this.filtroTipo = 'todos';
        this.filtroCategoria = 'todas';
        this.filtroFechaDesde = '';
        this.filtroFechaHasta = '';
        
        this.renderizarMovimientos();
    }

    renderizarMovimientos(busqueda = '') {
        const lista = document.getElementById('listaMovimientos');
        const total = document.getElementById('totalMovimientos');
        const totalOriginal = document.getElementById('totalOriginal');
        const resultadosFiltrados = document.getElementById('resultadosFiltrados');
        
        let movimientosFiltrados = [...this.movimientos];
        
        // Filtro por tipo
        if (this.filtroTipo !== 'todos') {
            movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === this.filtroTipo);
        }
        
        // Filtro por categoría
        if (this.filtroCategoria !== 'todas') {
            movimientosFiltrados = movimientosFiltrados.filter(m => m.categoria === this.filtroCategoria);
        }
        
        // Filtro por fechas
        if (this.filtroFechaDesde) {
            movimientosFiltrados = movimientosFiltrados.filter(m => m.fecha >= this.filtroFechaDesde);
        }
        if (this.filtroFechaHasta) {
            movimientosFiltrados = movimientosFiltrados.filter(m => m.fecha <= this.filtroFechaHasta);
        }
        
        // Búsqueda por texto
        if (busqueda) {
            movimientosFiltrados = movimientosFiltrados.filter(m => 
                m.descripcion.toLowerCase().includes(busqueda) ||
                m.categoria.toLowerCase().includes(busqueda) ||
                this.formatearMonto(m.monto).toLowerCase().includes(busqueda)
            );
        }
        
        movimientosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        total.textContent = movimientosFiltrados.length;
        
        if (movimientosFiltrados.length !== this.movimientos.length) {
            totalOriginal.textContent = this.movimientos.length;
            resultadosFiltrados.style.display = 'inline';
        } else {
            resultadosFiltrados.style.display = 'none';
        }

        if (movimientosFiltrados.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay movimientos que coincidan con los filtros</p>';
            return;
        }

        // Paginación
        if (!this.pagination) {
            this.pagination = new Pagination(movimientosFiltrados, 10);
        } else {
            this.pagination.updateItems(movimientosFiltrados);
        }

        const itemsPagina = this.pagination.getCurrentPageItems();
        lista.innerHTML = itemsPagina.map(mov => this.generarHTMLMovimiento(mov)).join('');
        
        this.pagination.renderControls('paginationControlsMovimientos', 'finanzasSistema.cambiarPagina');
    }

    cambiarPagina(pageNumber) {
        if (this.pagination.goToPage(pageNumber)) {
            this.renderizarMovimientos();
            document.getElementById('listaMovimientos').scrollIntoView({ behavior: 'smooth' });
        }
    }

    generarHTMLMovimiento(mov) {
        const tipoTexto = mov.tipo === 'ingreso' ? '📥 Ingreso' : '📤 Egreso';
        const tipoClass = mov.tipo;
        
        return `
            <div class="movimiento-card ${tipoClass}">
                <div class="movimiento-header">
                    <div class="movimiento-tipo">
                        <span class="movimiento-icono">${mov.tipo === 'ingreso' ? '📥' : '📤'}</span>
                        <div>
                            <div class="movimiento-categoria">${mov.categoria}</div>
                            ${mov.detalle ? `<div class="movimiento-detalle-extra">${mov.detalle}</div>` : ''}
                            <div class="movimiento-fecha">${Utils.formatearFecha(mov.fecha)}</div>
                        </div>
                    </div>
                    <div class="movimiento-monto ${tipoClass}">${this.formatearMonto(mov.monto)}</div>
                </div>
                
                ${mov.descripcion ? `
                    <div class="movimiento-descripcion">${mov.descripcion}</div>
                ` : ''}
                
                <div class="movimiento-footer">
                    <div>
                        <span style="font-weight: 600;">Registrado por:</span> ${mov.registradoPor}
                        ${mov.numeroDocumento ? ` | <span style="font-weight: 600;">N° Doc:</span> ${mov.numeroDocumento}` : ''}
                    </div>
                    ${mov.comprobante ? `
                        <a href="${mov.comprobante}" target="_blank" download="${mov.nombreComprobanteOriginal}" 
                           style="color: #2196f3; text-decoration: none; font-weight: 600;">
                            📎 Ver Comprobante
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    limpiarFormularioIngreso() {
        document.getElementById('formIngreso').reset();
        document.getElementById('fechaIngreso').value = new Date().toISOString().split('T')[0];
        document.getElementById('campoDetalleIngreso').style.display = 'none';
        const preview = document.getElementById('previsualizacionIngreso');
        if (preview) preview.innerHTML = '';
    }

    limpiarFormularioEgreso() {
        document.getElementById('formEgreso').reset();
        document.getElementById('fechaEgreso').value = new Date().toISOString().split('T')[0];
        const preview = document.getElementById('previewEgreso');
        if (preview) preview.style.display = 'none';
    }

    async exportarExcel() {
        if (this.movimientos.length === 0) {
            Utils.mostrarNotificacion('No hay movimientos para exportar', 'error');
            return;
        }

        try {
            const datosExcel = this.movimientos.map((mov, index) => ({
                'N°': index + 1,
                'Tipo': mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
                'Fecha': Utils.formatearFecha(mov.fecha),
                'Monto (CLP)': mov.monto,
                'Categoría': mov.categoria,
                'Detalle': mov.detalle || '-',
                'N° Documento': mov.numeroDocumento || '-',
                'Descripción': mov.descripcion,
                'Registrado por': mov.registradoPor,
                'Fecha Registro': Utils.formatearFecha(mov.fechaRegistro)
            }));

            const ingresos = this.movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
            const egresos = this.movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
            
            datosExcel.push({});
            datosExcel.push({ 'N°': '', 'Tipo': 'RESUMEN' });
            datosExcel.push({ 'N°': '', 'Tipo': 'Total Ingresos', 'Monto (CLP)': ingresos });
            datosExcel.push({ 'N°': '', 'Tipo': 'Total Egresos', 'Monto (CLP)': egresos });
            datosExcel.push({ 'N°': '', 'Tipo': 'SALDO ACTUAL', 'Monto (CLP)': ingresos - egresos });

            await Utils.exportarAExcel(
                datosExcel,
                `Finanzas_Compañia_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Movimientos Financieros'
            );

            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.finanzasSistema = new SistemaFinanzas();
});