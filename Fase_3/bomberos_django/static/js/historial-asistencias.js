// ==================== SISTEMA DE HISTORIAL Y RANKING ====================
// Versión limpia, simple y funcional

class HistorialAsistencias {
    constructor() {
        this.asistencias = [];
        this.ranking = {};
        
        // Filtros
        this.filtroAno = new Date().getFullYear();
        this.filtroTipo = 'todas';
        this.filtroClave = '';
        this.filtroTop = 10;
        
        this.init();
    }

    /**
     * Inicialización del sistema
     */
    init() {
        console.log('🚀 Iniciando Historial y Ranking...');
        
        // Verificar autenticación
        if (typeof checkAuth !== 'undefined' && !checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Cargar datos
        this.cargarDatos();
        
        // Configurar eventos
        this.configurarEventos();
        
        // Cargar opciones de años
        this.cargarOpcionesAnos();
        
        // Inicializar selector de claves radiales
        this.inicializarSelectorClaves();
        
        // Renderizar
        this.renderizar();
        
        console.log('✅ Sistema cargado correctamente');
        console.log(`   📊 ${this.asistencias.length} asistencias cargadas`);
    }

    /**
     * Cargar datos desde localStorage
     */
    cargarDatos() {
        try {
            // Cargar asistencias unificadas
            const asistenciasStorage = JSON.parse(localStorage.getItem('asistencias')) || [];
            
            // Cargar asistencias legacy de emergencias
            const emergenciasLegacy = JSON.parse(localStorage.getItem('asistenciasEmergencias')) || [];
            
            // Combinar y asegurar tipo
            this.asistencias = [
                ...asistenciasStorage,
                ...emergenciasLegacy.map(e => ({ ...e, tipo: e.tipo || 'emergencia' }))
            ];
            
            // Eliminar duplicados por ID
            const idsVistos = new Set();
            this.asistencias = this.asistencias.filter(a => {
                if (idsVistos.has(a.id)) return false;
                idsVistos.add(a.id);
                return true;
            });
            
            // Cargar ranking
            this.ranking = JSON.parse(localStorage.getItem('rankingAsistencias')) || {};
            
            console.log('📦 Datos cargados:');
            console.log(`   Asistencias: ${this.asistencias.length}`);
            console.log(`   Años en ranking: ${Object.keys(this.ranking).length}`);
            
            // Mostrar distribución por tipo
            if (this.asistencias.length > 0) {
                const porTipo = this.asistencias.reduce((acc, a) => {
                    const tipo = a.tipo || 'sin_tipo';
                    acc[tipo] = (acc[tipo] || 0) + 1;
                    return acc;
                }, {});
                console.log('   Por tipo:', porTipo);
            }
            
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            this.asistencias = [];
            this.ranking = {};
        }
    }

    /**
     * Configurar eventos de filtros
     */
    configurarEventos() {
        // Filtro de año
        const filtroAno = document.getElementById('filtroAno');
        if (filtroAno) {
            filtroAno.addEventListener('change', (e) => {
                this.filtroAno = parseInt(e.target.value);
                this.renderizar();
            });
        }

        // Filtro de tipo
        const filtroTipo = document.getElementById('filtroTipo');
        if (filtroTipo) {
            filtroTipo.addEventListener('change', (e) => {
                this.filtroTipo = e.target.value;
                this.renderizar();
            });
        }

        // Filtro de clave radial
        const filtroClave = document.getElementById('filtroClave');
        if (filtroClave) {
            filtroClave.addEventListener('change', (e) => {
                this.filtroClave = e.target.value;
                this.renderizar();
            });
        }

        // Filtro de top
        const filtroTop = document.getElementById('filtroTop');
        if (filtroTop) {
            filtroTop.addEventListener('change', (e) => {
                this.filtroTop = parseInt(e.target.value);
                this.renderizar();
            });
        }
    }

    /**
     * Cargar opciones de años disponibles
     */
    cargarOpcionesAnos() {
        const select = document.getElementById('filtroAno');
        if (!select) return;

        // Obtener años únicos de las asistencias
        const anos = new Set();
        this.asistencias.forEach(a => {
            if (a.fecha) {
                const ano = new Date(a.fecha).getFullYear();
                if (!isNaN(ano)) anos.add(ano);
            }
        });

        // Si no hay años, agregar año actual
        if (anos.size === 0) {
            anos.add(new Date().getFullYear());
        }

        // Ordenar años descendente
        const anosOrdenados = Array.from(anos).sort((a, b) => b - a);

        // Llenar select
        select.innerHTML = anosOrdenados.map(ano => 
            `<option value="${ano}">${ano}</option>`
        ).join('');

        // Seleccionar año actual o el más reciente
        const anoActual = new Date().getFullYear();
        if (anos.has(anoActual)) {
            select.value = anoActual;
            this.filtroAno = anoActual;
        } else {
            select.value = anosOrdenados[0];
            this.filtroAno = anosOrdenados[0];
        }
    }

    /**
     * Inicializar selector de claves radiales
     */
    inicializarSelectorClaves() {
        const selector = document.getElementById('filtroClave');
        if (!selector) return;

        // Verificar si la función existe
        if (typeof obtenerClavesPadre !== 'function') {
            console.warn('⚠️ Función obtenerClavesPadre no disponible');
            selector.innerHTML = '<option value="">N/A</option>';
            return;
        }

        const clavesPadre = obtenerClavesPadre();
        selector.innerHTML = '<option value="">Todas las claves</option>';

        for (const clave of clavesPadre) {
            const option = document.createElement('option');
            option.value = clave.value;
            option.textContent = clave.text;
            selector.appendChild(option);
        }

        console.log('📻 Filtro de claves radiales inicializado');
    }

    /**
     * Renderizar todo
     */
    renderizar() {
        this.renderizarRanking();
        this.renderizarAsistencias();
    }

    /**
     * Renderizar ranking
     */
    renderizarRanking() {
        const container = document.getElementById('rankingLista');
        const titulo = document.getElementById('rankingTitulo');
        
        if (!container) return;

        // Obtener ranking del año seleccionado
        const rankingAno = this.ranking[this.filtroAno] || {};

        // Recopilar TODOS: voluntarios regulares + externos
        let todasLasPersonas = [];

        // 1. Voluntarios regulares
        Object.entries(rankingAno)
            .filter(([key]) => !key.startsWith('externos_'))
            .forEach(([id, datos]) => {
                todasLasPersonas.push({
                    id,
                    nombre: datos.nombre,
                    claveBombero: datos.claveBombero,
                    total: datos.total || 0,
                    emergencias: datos.emergencias || 0,
                    asambleas: datos.asambleas || 0,
                    ejercicios: datos.ejercicios || 0,
                    citaciones: datos.citaciones || 0,
                    otras: datos.otras || 0,
                    tipo: 'voluntario',
                    icono: '👨‍🚒'
                });
            });

        // 2. Participantes (externos)
        if (rankingAno.externos_participantes) {
            Object.values(rankingAno.externos_participantes).forEach(datos => {
                todasLasPersonas.push({
                    id: 'ext_part_' + (datos.id || datos.nombre),
                    nombre: datos.nombre,
                    claveBombero: null,
                    total: parseInt(datos.total) || 0,
                    emergencias: parseInt(datos.emergencias) || 0,
                    asambleas: parseInt(datos.asambleas) || 0,
                    ejercicios: parseInt(datos.ejercicios) || 0,
                    citaciones: parseInt(datos.citaciones) || 0,
                    otras: parseInt(datos.otras) || 0,
                    tipo: 'participante',
                    icono: '🤝'
                });
            });
        }

        // 3. Canjes (externos)
        if (rankingAno.externos_canjes) {
            Object.values(rankingAno.externos_canjes).forEach(datos => {
                todasLasPersonas.push({
                    id: 'ext_canje_' + (datos.id || datos.nombre),
                    nombre: datos.nombre,
                    claveBombero: null,
                    total: parseInt(datos.total) || 0,
                    emergencias: parseInt(datos.emergencias) || 0,
                    asambleas: parseInt(datos.asambleas) || 0,
                    ejercicios: parseInt(datos.ejercicios) || 0,
                    citaciones: parseInt(datos.citaciones) || 0,
                    otras: parseInt(datos.otras) || 0,
                    tipo: 'canje',
                    icono: '🔄'
                });
            });
        }

        // Filtrar por tipo si no es "todas"
        if (this.filtroTipo !== 'todas') {
            // Convertir nombre del filtro a propiedad (singular → plural)
            const propiedadTipo = this.convertirTipoAPropiedad(this.filtroTipo);
            
            todasLasPersonas.forEach(p => {
                p.totalFiltrado = p[propiedadTipo] || 0;
            });
            todasLasPersonas = todasLasPersonas.filter(p => p.totalFiltrado > 0);
            todasLasPersonas.sort((a, b) => b.totalFiltrado - a.totalFiltrado);
        } else {
            todasLasPersonas.sort((a, b) => b.total - a.total);
        }

        // Limitar según filtro top
        const top = todasLasPersonas.slice(0, this.filtroTop);

        // Actualizar título
        if (titulo) {
            const tipoTexto = this.filtroTipo === 'todas' ? 'GENERAL' : this.obtenerNombreTipo(this.filtroTipo).toUpperCase();
            titulo.textContent = `🏆 TOP ${Math.min(this.filtroTop, todasLasPersonas.length)} - ${tipoTexto}`;
        }

        // Renderizar
        if (top.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No hay datos de ranking</div>';
            return;
        }

        container.innerHTML = top.map((p, index) => {
            // Convertir nombre del filtro a propiedad
            const propiedadTipo = this.convertirTipoAPropiedad(this.filtroTipo);
            const asistencias = this.filtroTipo === 'todas' ? p.total : (p[propiedadTipo] || 0);
            
            return `
                <div class="ranking-item">
                    <div class="ranking-position">${index + 1}</div>
                    <div class="ranking-info">
                        <div class="ranking-nombre">${p.icono} ${p.nombre}</div>
                        ${p.claveBombero ? `<div class="ranking-clave">${p.claveBombero}</div>` : `<div class="ranking-clave" style="opacity: 0.7;">${p.tipo === 'participante' ? 'Participante' : 'Canje'}</div>`}
                    </div>
                    <div class="ranking-asistencias">${asistencias}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderizar asistencias
     */
    renderizarAsistencias() {
        const container = document.getElementById('asistenciasLista');
        const emptyState = document.getElementById('emptyState');
        const contador = document.getElementById('asistenciasContador');
        const titulo = document.getElementById('asistenciasTitulo');
        
        if (!container) return;

        // Filtrar asistencias
        let asistenciasFiltradas = this.asistencias.filter(a => {
            // Filtrar por año
            if (a.fecha) {
                const ano = new Date(a.fecha).getFullYear();
                if (ano !== this.filtroAno) return false;
            }
            
            // Filtrar por tipo
            if (this.filtroTipo !== 'todas') {
                if (a.tipo !== this.filtroTipo) return false;
            }
            
            // Filtrar por clave radial (solo para emergencias)
            if (this.filtroClave && a.tipo === 'emergencia') {
                if (!a.claveEmergencia) return false;
                // Verificar si la función perteneceAGrupo existe
                if (typeof perteneceAGrupo === 'function') {
                    if (!perteneceAGrupo(a.claveEmergencia, this.filtroClave)) return false;
                } else {
                    // Fallback: comparación simple
                    if (a.claveEmergencia !== this.filtroClave) return false;
                }
            }
            
            return true;
        });

        // Ordenar por fecha descendente
        asistenciasFiltradas.sort((a, b) => {
            return new Date(b.fecha) - new Date(a.fecha);
        });

        // Actualizar contador
        if (contador) {
            contador.textContent = `${asistenciasFiltradas.length} registro${asistenciasFiltradas.length !== 1 ? 's' : ''}`;
        }

        // Actualizar título
        if (titulo) {
            const tipoTexto = this.filtroTipo === 'todas' ? 'Todas las Asistencias' : this.obtenerNombreTipo(this.filtroTipo);
            titulo.textContent = `📋 ${tipoTexto}`;
        }

        // Mostrar empty state si no hay asistencias
        if (asistenciasFiltradas.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'flex';
        if (emptyState) emptyState.style.display = 'none';

        // Renderizar cards (mostrar últimas 20)
        const ultimas20 = asistenciasFiltradas.slice(0, 20);
        container.innerHTML = ultimas20.map(a => this.renderizarCard(a)).join('');
    }

    /**
     * Renderizar card individual de asistencia
     */
    renderizarCard(asistencia) {
        const icono = this.obtenerIconoTipo(asistencia.tipo);
        const nombreTipo = this.obtenerNombreTipo(asistencia.tipo);
        const fecha = this.formatearFecha(asistencia.fecha);
        
        return `
            <div class="asistencia-card">
                <div class="asistencia-card-header">
                    <div class="asistencia-fecha">
                        ${icono} ${fecha}
                    </div>
                    <div class="asistencia-tipo-badge">
                        ${nombreTipo}
                    </div>
                </div>
                <div class="asistencia-body">
                    ${this.renderizarStats(asistencia)}
                    ${asistencia.descripcion || asistencia.direccion ? `
                        <div class="info-item-full">
                            <div class="info-item-label">📝 Descripción:</div>
                            <div class="info-item-value">${asistencia.descripcion || asistencia.direccion}</div>
                        </div>
                    ` : ''}
                </div>
                <button class="btn-ver-detalle" onclick='verDetalleAsistencia(${JSON.stringify(asistencia).replace(/'/g, "&#39;")})'>  
                    🔍 Ver Detalle Completo
                </button>
            </div>
        `;
    }

    /**
     * Renderizar estadísticas de la asistencia
     */
    renderizarStats(asistencia) {
        const stats = [];

        // Total de asistentes
        if (asistencia.totalAsistentes !== undefined) {
            stats.push({
                label: 'Total Asistentes',
                value: asistencia.totalAsistentes
            });
        }

        // Oficiales
        if (asistencia.totalOficiales !== undefined) {
            stats.push({
                label: 'Oficiales',
                value: `${asistencia.totalOficiales} (Cmd: ${asistencia.oficialesComandancia || 0}, Cía: ${asistencia.oficialesCompania || 0})`
            });
        }

        // Voluntarios
        if (asistencia.voluntarios !== undefined) {
            stats.push({
                label: 'Voluntarios',
                value: asistencia.voluntarios
            });
        }

        // Externos
        if (asistencia.participantes > 0 || asistencia.canjes > 0) {
            stats.push({
                label: 'Externos',
                value: `🤝 ${asistencia.participantes || 0} | 🔄 ${asistencia.canjes || 0}`
            });
        }

        // Descripción
        if (asistencia.descripcion) {
            stats.push({
                label: 'Descripción',
                value: asistencia.descripcion
            });
        }

        return stats.map(stat => `
            <div class="info-item">
                <div class="info-item-label">${stat.label}:</div>
                <div class="info-item-value">${stat.value}</div>
            </div>
        `).join('');
    }

    /**
     * Convertir tipo del filtro a nombre de propiedad
     * (singular → plural)
     */
    convertirTipoAPropiedad(tipo) {
        const mapeo = {
            'emergencia': 'emergencias',
            'asamblea': 'asambleas',
            'ejercicios': 'ejercicios', // Ya está en plural
            'citaciones': 'citaciones', // Ya está en plural
            'otras': 'otras' // Ya está en plural
        };
        return mapeo[tipo] || tipo;
    }

    /**
     * Obtener icono del tipo
     */
    obtenerIconoTipo(tipo) {
        const iconos = {
            'emergencia': '🚨',
            'asamblea': '🏛️',
            'ejercicios': '💪',
            'citaciones': '📞',
            'otras': '📋'
        };
        return iconos[tipo] || '📋';
    }

    /**
     * Obtener nombre del tipo
     */
    obtenerNombreTipo(tipo) {
        const nombres = {
            'emergencia': 'Emergencia',
            'asamblea': 'Asamblea',
            'ejercicios': 'Ejercicio',
            'citaciones': 'Citación',
            'otras': 'Otra Actividad'
        };
        return nombres[tipo] || tipo;
    }

    /**
     * Formatear fecha
     */
    formatearFecha(fecha) {
        if (!fecha) return 'Fecha no disponible';
        
        try {
            const date = new Date(fecha);
            const opciones = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            return date.toLocaleDateString('es-ES', opciones);
        } catch (error) {
            return fecha;
        }
    }

    /**
     * Diagnóstico del ranking
     */
    diagnosticarRanking() {
        console.log('🔍 DIAGNÓSTICO DEL RANKING');
        console.log('='.repeat(50));
        
        const ranking = this.ranking[this.filtroAno] || {};
        
        console.log(`📅 Año actual: ${this.filtroAno}`);
        console.log(`📊 Filtro tipo: ${this.filtroTipo}`);
        
        // Voluntarios regulares
        const voluntarios = Object.entries(ranking)
            .filter(([key]) => !key.startsWith('externos_'));
        console.log(`\n👨‍🚒 VOLUNTARIOS REGULARES: ${voluntarios.length}`);
        voluntarios.slice(0, 3).forEach(([id, datos]) => {
            console.log(`  ${datos.nombre}:`, {
                total: datos.total,
                emergencias: datos.emergencias,
                asambleas: datos.asambleas,
                ejercicios: datos.ejercicios
            });
        });
        
        // Participantes
        if (ranking.externos_participantes) {
            const participantes = Object.values(ranking.externos_participantes);
            console.log(`\n🤝 PARTICIPANTES: ${participantes.length}`);
            participantes.slice(0, 3).forEach(datos => {
                console.log(`  ${datos.nombre}:`, {
                    total: datos.total,
                    emergencias: datos.emergencias,
                    asambleas: datos.asambleas,
                    ejercicios: datos.ejercicios
                });
            });
        } else {
            console.log(`\n🤝 PARTICIPANTES: 0 (no hay datos)`);
        }
        
        // Canjes
        if (ranking.externos_canjes) {
            const canjes = Object.values(ranking.externos_canjes);
            console.log(`\n🔄 CANJES: ${canjes.length}`);
            canjes.slice(0, 3).forEach(datos => {
                console.log(`  ${datos.nombre}:`, {
                    total: datos.total,
                    emergencias: datos.emergencias,
                    asambleas: datos.asambleas,
                    ejercicios: datos.ejercicios
                });
            });
        } else {
            console.log(`\n🔄 CANJES: 0 (no hay datos)`);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Diagnóstico completado');
    }

    /**
     * Exportar a Excel
     */
    exportarExcel() {
        if (typeof XLSX === 'undefined') {
            alert('❌ Biblioteca XLSX no disponible');
            return;
        }

        try {
            // Filtrar asistencias según filtros actuales
            let asistenciasFiltradas = this.asistencias.filter(a => {
                if (a.fecha) {
                    const ano = new Date(a.fecha).getFullYear();
                    if (ano !== this.filtroAno) return false;
                }
                if (this.filtroTipo !== 'todas' && a.tipo !== this.filtroTipo) {
                    return false;
                }
                return true;
            });

            // Preparar datos para Excel
            const datos = asistenciasFiltradas.map(a => ({
                'Fecha': a.fecha,
                'Tipo': this.obtenerNombreTipo(a.tipo),
                'Descripción': a.descripcion || '',
                'Total Asistentes': a.totalAsistentes || 0,
                'Oficiales Comandancia': a.oficialesComandancia || 0,
                'Oficiales Compañía': a.oficialesCompania || 0,
                'Total Oficiales': a.totalOficiales || 0,
                'Voluntarios': a.voluntarios || 0,
                'Participantes': a.participantes || 0,
                'Canjes': a.canjes || 0
            }));

            // Crear libro
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(datos);

            // Agregar hoja
            XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

            // Descargar
            const filename = `Asistencias_${this.filtroAno}_${this.filtroTipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);

            console.log(`✅ Excel exportado: ${filename}`);
        } catch (error) {
            console.error('❌ Error al exportar:', error);
            alert('Error al exportar a Excel');
        }
    }
}

// Función global para exportar
function exportarExcel() {
    if (window.historialApp) {
        window.historialApp.exportarExcel();
    }
}

// Función global para reconstruir ranking
function reconstruirRanking() {
    if (!confirm('¿Deseas reconstruir el ranking desde las asistencias registradas?\n\nEsto solucionará problemas de asistencias que no aparecen en el ranking.')) {
        return;
    }
    
    if (window.verificadorDatos) {
        console.log('🔄 Reconstruyendo ranking...');
        const nuevoRanking = window.verificadorDatos.reconstruirRanking();
        
        if (nuevoRanking) {
            alert('✅ Ranking reconstruido exitosamente.\n\nLa página se recargará para mostrar los cambios.');
            location.reload();
        } else {
            alert('❌ Error al reconstruir el ranking. Revisa la consola para más detalles.');
        }
    } else {
        alert('❌ Verificador de datos no disponible');
    }
}

// Funciones globales para el modal
function verDetalleAsistencia(asistencia) {
    const modal = document.getElementById('modalDetalles');
    const modalBody = document.getElementById('modalBody');
    const modalTitulo = document.getElementById('modalTitulo');
    
    // Cambiar título según tipo
    const iconos = {
        'emergencia': '🚨',
        'asamblea': '🏛️',
        'ejercicios': '💪',
        'citaciones': '📞',
        'otras': '📋'
    };
    const icono = iconos[asistencia.tipo] || '📋';
    const nombreTipo = {
        'emergencia': 'Emergencia',
        'asamblea': 'Asamblea',
        'ejercicios': 'Ejercicio',
        'citaciones': 'Citación',
        'otras': 'Otra Actividad'
    }[asistencia.tipo] || asistencia.tipo;
    
    modalTitulo.textContent = `${icono} Detalles de ${nombreTipo}`;
    
    // Construir HTML del modal
    let html = '<div class="detalle-section">';
    html += '<h4>📅 Información General</h4>';
    
    // Fecha
    html += `
        <div class="detalle-row">
            <div class="detalle-label">Fecha:</div>
            <div class="detalle-valor">${formatearFechaLarga(asistencia.fecha)}</div>
        </div>
    `;
    
    // Hora (si existe)
    if (asistencia.hora) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">Hora:</div>
                <div class="detalle-valor">${asistencia.hora}</div>
            </div>
        `;
    }
    
    // Campos específicos según tipo
    if (asistencia.tipo === 'emergencia') {
        if (asistencia.claveEmergencia) {
            html += `
                <div class="detalle-row">
                    <div class="detalle-label">Clave Emergencia:</div>
                    <div class="detalle-valor"><strong>${asistencia.claveEmergencia}</strong></div>
                </div>
            `;
        }
        if (asistencia.direccion) {
            html += `
                <div class="detalle-row">
                    <div class="detalle-label">Dirección:</div>
                    <div class="detalle-valor">${asistencia.direccion}</div>
                </div>
            `;
        }
    } else if (asistencia.tipo === 'asamblea') {
        if (asistencia.tipoAsamblea) {
            html += `
                <div class="detalle-row">
                    <div class="detalle-label">Tipo de Asamblea:</div>
                    <div class="detalle-valor">${asistencia.tipoAsamblea}</div>
                </div>
            `;
        }
    }
    
    // Descripción completa
    if (asistencia.descripcion) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">Descripción:</div>
                <div class="detalle-valor">${asistencia.descripcion}</div>
            </div>
        `;
    }
    
    // Observaciones
    if (asistencia.observaciones) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">Observaciones:</div>
                <div class="detalle-valor">${asistencia.observaciones}</div>
            </div>
        `;
    }
    
    html += '</div>'; // Cierra sección
    
    // Sección de estadísticas
    html += '<div class="detalle-section">';
    html += '<h4>📊 Estadísticas de Asistencia</h4>';
    
    html += `
        <div class="detalle-row">
            <div class="detalle-label">Total Asistentes:</div>
            <div class="detalle-valor"><strong style="color: #c41e3a; font-size: 1.2rem;">${asistencia.totalAsistentes || 0}</strong></div>
        </div>
    `;
    
    if (asistencia.oficialesComandancia !== undefined) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">⭐ Oficiales Comandancia:</div>
                <div class="detalle-valor">${asistencia.oficialesComandancia || 0}</div>
            </div>
        `;
    }
    
    if (asistencia.oficialesCompania !== undefined) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">👔 Oficiales Compañía:</div>
                <div class="detalle-valor">${asistencia.oficialesCompania || 0}</div>
            </div>
        `;
    }
    
    if (asistencia.totalOficiales !== undefined) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">Total Oficiales:</div>
                <div class="detalle-valor"><strong>${asistencia.totalOficiales || 0}</strong></div>
            </div>
        `;
    }
    
    if (asistencia.cargosConfianza !== undefined) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">🔧 Cargos de Confianza:</div>
                <div class="detalle-valor">${asistencia.cargosConfianza || 0}</div>
            </div>
        `;
    }
    
    if (asistencia.voluntarios !== undefined) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">🔰 Voluntarios:</div>
                <div class="detalle-valor">${asistencia.voluntarios || 0}</div>
            </div>
        `;
    }
    
    // Voluntarios externos
    if (asistencia.participantes > 0 || asistencia.canjes > 0) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">👥 Voluntarios Externos:</div>
                <div class="detalle-valor">
                    🤝 Participantes: ${asistencia.participantes || 0}<br>
                    🔄 Canjes: ${asistencia.canjes || 0}
                </div>
            </div>
        `;
    }
    
    html += '</div>'; // Cierra sección
    
    // Lista de asistentes
    if (asistencia.asistentes && asistencia.asistentes.length > 0) {
        html += '<div class="detalle-section">';
        html += `<h4>👥 Lista de Asistentes (${asistencia.asistentes.length})</h4>`;
        html += '<div class="asistentes-lista">';
        
        asistencia.asistentes.forEach((a, index) => {
            html += `
                <div class="asistente-item">
                    <div class="asistente-nombre">${index + 1}. ${a.nombre}</div>
                    <div class="asistente-info">
                        ${a.claveBombero ? `🆔 ${a.claveBombero}` : ''}
                        ${a.categoria ? `<br>📌 ${a.categoria}` : ''}
                        ${a.cargo ? `<br>⭐ ${a.cargo}` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        html += '</div>'; // Cierra sección
    }
    
    // Metadatos
    html += '<div class="detalle-section">';
    html += '<h4>ℹ️ Información de Registro</h4>';
    
    if (asistencia.registradoPor) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">Registrado por:</div>
                <div class="detalle-valor">${asistencia.registradoPor}</div>
            </div>
        `;
    }
    
    if (asistencia.fechaRegistro) {
        html += `
            <div class="detalle-row">
                <div class="detalle-label">Fecha de registro:</div>
                <div class="detalle-valor">${new Date(asistencia.fechaRegistro).toLocaleString('es-ES')}</div>
            </div>
        `;
    }
    
    html += '</div>'; // Cierra sección
    
    // Sección de mapa (si hay dirección)
    if (asistencia.direccion) {
        html += '<div class="detalle-section">';
        html += '<h4>🗺️ Ubicación en el Mapa</h4>';
        
        // Preparar dirección para el mapa
        let direccionMapa = asistencia.direccion;
        if (!direccionMapa.toLowerCase().includes('puerto montt')) {
            direccionMapa += ', Puerto Montt, Chile';
        } else if (!direccionMapa.toLowerCase().includes('chile')) {
            direccionMapa += ', Chile';
        }
        
        const urlMapa = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(direccionMapa)}&zoom=16`;
        
        html += `
            <div style="width: 100%; height: 350px; border-radius: 10px; overflow: hidden; margin-top: 10px;">
                <iframe 
                    src="${urlMapa}"
                    width="100%"
                    height="100%"
                    style="border:0;"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            </div>
            <div style="margin-top: 10px; text-align: center;">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionMapa)}" 
                   target="_blank" 
                   style="color: #4285f4; text-decoration: none; font-weight: 600;">
                    📍 Abrir en Google Maps
                </a>
            </div>
        `;
        
        html += '</div>'; // Cierra sección
    }
    
    modalBody.innerHTML = html;
    modal.style.display = 'block';
}

function cerrarModal() {
    const modal = document.getElementById('modalDetalles');
    modal.style.display = 'none';
}

function formatearFechaLarga(fecha) {
    if (!fecha) return 'Fecha no disponible';
    try {
        const date = new Date(fecha);
        const opciones = { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('es-ES', opciones);
    } catch (error) {
        return fecha;
    }
}

// Inicializar cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.historialAsistencias = new HistorialAsistencias();
    // Alias para compatibilidad
    window.historialApp = window.historialAsistencias;
    
    // Cerrar modal al hacer clic fuera de él
    window.onclick = function(event) {
        const modal = document.getElementById('modalDetalles');
        if (event.target == modal) {
            cerrarModal();
        }
    };
});
