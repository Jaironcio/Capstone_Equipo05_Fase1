// ==================== FINANZAS SIMPLE - SOLO DJANGO API ====================
// NO USA localStorage - TODO desde API

class FinanzasSimple {
    constructor() {
        this.movimientos = [];
        this.init();
    }

    async init() {
        console.log('[FINANZAS] 🚀 Iniciando (SOLO API Django)...');
        await this.cargarMovimientos();
        this.configurarEventos();
        this.actualizarResumen();
        this.renderizarMovimientos();
    }

    // ==================== CARGAR DESDE API ====================
    
    async cargarMovimientos() {
        try {
            console.log('[FINANZAS] 📥 Cargando desde API...');
            const response = await fetch('/api/movimientos-financieros/', {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.movimientos = data.results || [];
            
            console.log(`[FINANZAS] ✅ Cargados ${this.movimientos.length} movimientos`);
        } catch (error) {
            console.error('[FINANZAS] ❌ Error al cargar:', error);
            this.movimientos = [];
        }
    }

    // ==================== EVENTOS ====================
    
    configurarEventos() {
        // Formulario de Ingreso
        const formIngreso = document.getElementById('formIngreso');
        if (formIngreso) {
            formIngreso.addEventListener('submit', (e) => this.guardarIngreso(e));
        }
        
        // Formulario de Egreso
        const formEgreso = document.getElementById('formEgreso');
        if (formEgreso) {
            formEgreso.addEventListener('submit', (e) => this.guardarEgreso(e));
        }

        // Fecha por defecto = hoy
        const hoy = new Date().toISOString().split('T')[0];
        const fechaIngreso = document.getElementById('fechaIngreso');
        const fechaEgreso = document.getElementById('fechaEgreso');
        if (fechaIngreso) fechaIngreso.value = hoy;
        if (fechaEgreso) fechaEgreso.value = hoy;
    }

    // ==================== GUARDAR INGRESO ====================
    
    async guardarIngreso(e) {
        e.preventDefault();
        
        const form = e.target;
        const monto = parseFloat(form.montoIngreso.value);
        const categoria = form.tipoIngreso.value;
        const fecha = form.fechaIngreso.value;
        const descripcion = form.descripcionIngreso.value || '';
        
        if (!monto || monto <= 0) {
            alert('❌ Ingrese un monto válido');
            return;
        }
        
        if (!categoria) {
            alert('❌ Seleccione un tipo de ingreso');
            return;
        }
        
        try {
            console.log('[FINANZAS] 💾 Guardando ingreso...');
            
            const response = await fetch('/api/movimientos-financieros/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    tipo: 'ingreso',
                    categoria,
                    monto,
                    descripcion,
                    fecha
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al guardar');
            }
            
            const resultado = await response.json();
            console.log('[FINANZAS] ✅ Ingreso guardado:', resultado);
            
            // Recargar y actualizar
            await this.cargarMovimientos();
            this.actualizarResumen();
            this.renderizarMovimientos();
            this.cerrarFormulario();
            form.reset();
            
            alert('✅ Ingreso registrado exitosamente');
            
        } catch (error) {
            console.error('[FINANZAS] ❌ Error:', error);
            alert('❌ Error: ' + error.message);
        }
    }

    // ==================== GUARDAR EGRESO ====================
    
    async guardarEgreso(e) {
        e.preventDefault();
        
        const form = e.target;
        const monto = parseFloat(form.montoEgreso.value);
        const categoria = form.motivoEgreso.value;
        const fecha = form.fechaEgreso.value;
        const descripcion = form.descripcionEgreso.value || '';
        const numeroDoc = form.numeroDocumentoEgreso.value || '';
        
        if (!monto || monto <= 0) {
            alert('❌ Ingrese un monto válido');
            return;
        }
        
        if (!categoria) {
            alert('❌ Seleccione un motivo');
            return;
        }
        
        try {
            console.log('[FINANZAS] 💾 Guardando egreso...');
            
            const response = await fetch('/api/movimientos-financieros/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    tipo: 'egreso',
                    categoria,
                    monto,
                    descripcion,
                    fecha,
                    numero_comprobante: numeroDoc
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al guardar');
            }
            
            const resultado = await response.json();
            console.log('[FINANZAS] ✅ Egreso guardado:', resultado);
            
            // Recargar y actualizar
            await this.cargarMovimientos();
            this.actualizarResumen();
            this.renderizarMovimientos();
            this.cerrarFormulario();
            form.reset();
            
            alert('✅ Egreso registrado exitosamente');
            
        } catch (error) {
            console.error('[FINANZAS] ❌ Error:', error);
            alert('❌ Error: ' + error.message);
        }
    }

    // ==================== UI ====================
    
    mostrarFormulario(tipo) {
        document.getElementById('formContainerIngreso').style.display = tipo === 'ingreso' ? 'block' : 'none';
        document.getElementById('formContainerEgreso').style.display = tipo === 'egreso' ? 'block' : 'none';
    }
    
    cerrarFormulario() {
        document.getElementById('formContainerIngreso').style.display = 'none';
        document.getElementById('formContainerEgreso').style.display = 'none';
    }

    actualizarResumen() {
        let totalIngresos = 0;
        let totalEgresos = 0;
        
        this.movimientos.forEach(m => {
            const monto = parseFloat(m.monto) || 0;
            if (m.tipo === 'ingreso') totalIngresos += monto;
            else if (m.tipo === 'egreso') totalEgresos += monto;
        });
        
        const saldo = totalIngresos - totalEgresos;
        
        const elemIngresos = document.getElementById('totalIngresos');
        const elemEgresos = document.getElementById('totalEgresos');
        const elemSaldo = document.getElementById('saldoActual');
        
        if (elemIngresos) elemIngresos.textContent = `$${totalIngresos.toLocaleString('es-CL')}`;
        if (elemEgresos) elemEgresos.textContent = `$${totalEgresos.toLocaleString('es-CL')}`;
        if (elemSaldo) {
            elemSaldo.textContent = `$${saldo.toLocaleString('es-CL')}`;
            // Color según saldo
            if (saldo < 0) elemSaldo.style.color = '#ef4444';
            else if (saldo === 0) elemSaldo.style.color = '#6b7280';
            else elemSaldo.style.color = '#10b981';
        }
    }

    renderizarMovimientos() {
        const container = document.getElementById('listaMovimientos');
        if (!container) return;
        
        if (this.movimientos.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">No hay movimientos registrados</div>';
            document.getElementById('totalMovimientos').textContent = '0';
            return;
        }
        
        let html = '';
        this.movimientos.forEach(m => {
            const icono = m.tipo === 'ingreso' ? '📥' : '📤';
            const colorBorde = m.tipo === 'ingreso' ? 'border-left:4px solid #10b981' : 'border-left:4px solid #ef4444';
            const colorMonto = m.tipo === 'ingreso' ? '#10b981' : '#ef4444';
            const monto = parseFloat(m.monto) || 0;
            
            html += `
                <div style="background:white;padding:20px;margin-bottom:15px;border-radius:8px;${colorBorde}">
                    <div style="display:flex;justify-content:space-between;align-items:start;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">
                                <span style="font-size:1.3rem;">${icono}</span>
                                <strong style="font-size:1.1rem;">${m.categoria}</strong>
                            </div>
                            <div style="color:#666;font-size:0.9rem;">
                                ${m.descripcion || 'Sin descripción'}
                            </div>
                            <div style="color:#999;font-size:0.85rem;margin-top:5px;">
                                ${m.fecha} • ${m.created_by_nombre || 'Sistema'}
                                ${m.numero_comprobante ? ` • Doc: ${m.numero_comprobante}` : ''}
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:1.5rem;font-weight:700;color:${colorMonto}">
                                $${monto.toLocaleString('es-CL')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        document.getElementById('totalMovimientos').textContent = this.movimientos.length;
    }

    aplicarFiltrosAvanzados() {
        const buscador = document.getElementById('buscadorMovimientos').value.toLowerCase();
        const filtroTipo = document.getElementById('filtroTipo').value;
        const filtroCategoria = document.getElementById('filtroCategoria').value;
        const filtroFechaDesde = document.getElementById('filtroFechaDesde').value;
        const filtroFechaHasta = document.getElementById('filtroFechaHasta').value;
        
        let movimientosFiltrados = this.movimientos.filter(m => {
            // Filtro por búsqueda de texto
            const textoMovimiento = `${m.categoria} ${m.descripcion} ${m.monto}`.toLowerCase();
            if (buscador && !textoMovimiento.includes(buscador)) return false;
            
            // Filtro por tipo
            if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
            
            // Filtro por categoría
            if (filtroCategoria !== 'todas' && m.categoria !== filtroCategoria) return false;
            
            // Filtro por fecha desde
            if (filtroFechaDesde && m.fecha < filtroFechaDesde) return false;
            
            // Filtro por fecha hasta
            if (filtroFechaHasta && m.fecha > filtroFechaHasta) return false;
            
            return true;
        });
        
        // Renderizar movimientos filtrados
        const container = document.getElementById('listaMovimientos');
        if (movimientosFiltrados.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">No hay movimientos que coincidan con los filtros</div>';
        } else {
            let html = '';
            movimientosFiltrados.forEach(m => {
                const icono = m.tipo === 'ingreso' ? '📥' : '📤';
                const colorBorde = m.tipo === 'ingreso' ? 'border-left:4px solid #10b981' : 'border-left:4px solid #ef4444';
                const colorMonto = m.tipo === 'ingreso' ? '#10b981' : '#ef4444';
                const monto = parseFloat(m.monto) || 0;
                
                html += `
                    <div style="background:white;padding:20px;margin-bottom:15px;border-radius:8px;${colorBorde}">
                        <div style="display:flex;justify-content:space-between;align-items:start;">
                            <div>
                                <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">
                                    <span style="font-size:1.3rem;">${icono}</span>
                                    <strong style="font-size:1.1rem;">${m.categoria}</strong>
                                </div>
                                <div style="color:#666;font-size:0.9rem;">
                                    ${m.descripcion || 'Sin descripción'}
                                </div>
                                <div style="color:#999;font-size:0.85rem;margin-top:5px;">
                                    ${m.fecha} • ${m.created_by_nombre || 'Sistema'}
                                    ${m.numero_comprobante ? ` • Doc: ${m.numero_comprobante}` : ''}
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:1.5rem;font-weight:700;color:${colorMonto}">
                                    $${monto.toLocaleString('es-CL')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
        
        // Actualizar contador
        document.getElementById('totalMovimientos').textContent = movimientosFiltrados.length;
        const filtradosSpan = document.getElementById('resultadosFiltrados');
        if (movimientosFiltrados.length < this.movimientos.length) {
            filtradosSpan.style.display = 'inline';
            document.getElementById('totalOriginal').textContent = this.movimientos.length;
        } else {
            filtradosSpan.style.display = 'none';
        }
    }
    
    limpiarFiltros() {
        document.getElementById('buscadorMovimientos').value = '';
        document.getElementById('filtroTipo').value = 'todos';
        document.getElementById('filtroCategoria').value = 'todas';
        document.getElementById('filtroFechaDesde').value = '';
        document.getElementById('filtroFechaHasta').value = '';
        this.renderizarMovimientos();
    }

    volverAlSistema() {
        window.location.href = '/sistema.html';
    }
}

// ==================== INICIALIZAR ====================
let finanzasSistema;
document.addEventListener('DOMContentLoaded', () => {
    finanzasSistema = new FinanzasSimple();
});
