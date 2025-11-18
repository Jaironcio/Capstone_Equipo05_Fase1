// ==================== SISTEMA DE ALMACENAMIENTO ====================
class StorageManager {
    constructor() {
        this.bomberosKey = 'bomberosData';
        this.sancionesKey = 'sancionesData';
        this.cargosKey = 'cargosData';
        this.felicitacionesKey = 'felicitacionesData';
        this.uniformesKey = 'uniformesData';
        this.countersKey = 'countersData';
    }

    // ==================== BOMBEROS ====================
    getBomberos() {
        try {
            const data = localStorage.getItem(this.bomberosKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar bomberos:', error);
            return [];
        }
    }

    saveBomberos(bomberos) {
        try {
            localStorage.setItem(this.bomberosKey, JSON.stringify(bomberos));
            return true;
        } catch (error) {
            console.error('Error al guardar bomberos:', error);
            return false;
        }
    }

    // ==================== SANCIONES ====================
    getSanciones() {
        try {
            const data = localStorage.getItem(this.sancionesKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar sanciones:', error);
            return [];
        }
    }

    saveSanciones(sanciones) {
        try {
            localStorage.setItem(this.sancionesKey, JSON.stringify(sanciones));
            return true;
        } catch (error) {
            console.error('Error al guardar sanciones:', error);
            return false;
        }
    }

    // ==================== CARGOS ====================
    getCargos() {
        try {
            const data = localStorage.getItem(this.cargosKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar cargos:', error);
            return [];
        }
    }

    saveCargos(cargos) {
        try {
            localStorage.setItem(this.cargosKey, JSON.stringify(cargos));
            return true;
        } catch (error) {
            console.error('Error al guardar cargos:', error);
            return false;
        }
    }

    // ==================== FELICITACIONES ====================
    getFelicitaciones() {
        try {
            const data = localStorage.getItem(this.felicitacionesKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar felicitaciones:', error);
            return [];
        }
    }

    saveFelicitaciones(felicitaciones) {
        try {
            localStorage.setItem(this.felicitacionesKey, JSON.stringify(felicitaciones));
            return true;
        } catch (error) {
            console.error('Error al guardar felicitaciones:', error);
            return false;
        }
    }

    // ==================== UNIFORMES ====================
    getUniformes() {
        try {
            const data = localStorage.getItem(this.uniformesKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar uniformes:', error);
            return [];
        }
    }

    saveUniformes(uniformes) {
        try {
            localStorage.setItem(this.uniformesKey, JSON.stringify(uniformes));
            return true;
        } catch (error) {
            console.error('Error al guardar uniformes:', error);
            return false;
        }
    }

    // ==================== CONTADORES ====================
    getCounters() {
        try {
            const data = localStorage.getItem(this.countersKey);
            return data ? JSON.parse(data) : { 
                bomberoId: 1, 
                sancionId: 1, 
                cargoId: 1,
                felicitacionId: 1,
                uniformeId: 1
            };
        } catch (error) {
            console.error('Error al cargar contadores:', error);
            return { bomberoId: 1, sancionId: 1, cargoId: 1, felicitacionId: 1, uniformeId: 1 };
        }
    }

    saveCounters(counters) {
        try {
            localStorage.setItem(this.countersKey, JSON.stringify(counters));
            return true;
        } catch (error) {
            console.error('Error al guardar contadores:', error);
            return false;
        }
    }

    // ==================== INICIALIZACIÓN ====================
    inicializarContadores() {
        const counters = this.getCounters();
        if (!window.idCounter) window.idCounter = counters.bomberoId || 1;
        if (!window.sancionIdCounter) window.sancionIdCounter = counters.sancionId || 1;
        if (!window.cargoIdCounter) window.cargoIdCounter = counters.cargoId || 1;
        if (!window.felicitacionIdCounter) window.felicitacionIdCounter = counters.felicitacionId || 1;
        if (!window.uniformeIdCounter) window.uniformeIdCounter = counters.uniformeId || 1;
        
        console.log('Contadores inicializados:', {
            bomberoId: window.idCounter,
            sancionId: window.sancionIdCounter,
            cargoId: window.cargoIdCounter,
            felicitacionId: window.felicitacionIdCounter,
            uniformeId: window.uniformeIdCounter
        });
    }

    // ==================== BACKUP Y RESTAURACIÓN ====================
    exportBackup() {
        try {
            const backup = {
                bomberos: this.getBomberos(),
                sanciones: this.getSanciones(),
                cargos: this.getCargos(),
                felicitaciones: this.getFelicitaciones(),
                counters: this.getCounters(),
                fecha: new Date().toISOString(),
                version: '1.1'
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_proyecto_seis_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error al exportar backup:', error);
            return false;
        }
    }

    importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    if (!backup.bomberos || !backup.sanciones || !backup.cargos || !backup.counters) {
                        throw new Error('Formato de backup inválido');
                    }

                    this.saveBomberos(backup.bomberos);
                    this.saveSanciones(backup.sanciones);
                    this.saveCargos(backup.cargos);
                    this.saveCounters(backup.counters);
                    
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    }

    // ==================== LIMPIAR DATOS ====================
    clearAll() {
        try {
            localStorage.removeItem(this.bomberosKey);
            localStorage.removeItem(this.sancionesKey);
            localStorage.removeItem(this.cargosKey);
            localStorage.removeItem(this.felicitacionesKey);
            localStorage.removeItem(this.countersKey);
            return true;
        } catch (error) {
            console.error('Error al limpiar datos:', error);
            return false;
        }
    }

    // ==================== ESTADÍSTICAS ====================
    getStats() {
        const bomberos = this.getBomberos();
        const sanciones = this.getSanciones();
        const cargos = this.getCargos();
        
        return {
            totalBomberos: bomberos.length,
            totalSanciones: sanciones.length,
            totalCargos: cargos.length,
            ultimaActualizacion: new Date().toISOString()
        };
    }

    // ==================== MOVIMIENTOS FINANCIEROS ====================
    getMovimientosFinancieros() {
        try {
            const data = localStorage.getItem('movimientosFinancieros');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar movimientos financieros:', error);
            return [];
        }
    }

    saveMovimientosFinancieros(movimientos) {
        try {
            localStorage.setItem('movimientosFinancieros', JSON.stringify(movimientos));
            return true;
        } catch (error) {
            console.error('Error al guardar movimientos financieros:', error);
            return false;
        }
    }

    // ==================== BENEFICIOS ====================
    getBeneficios() {
        try {
            const data = localStorage.getItem('beneficios');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar beneficios:', error);
            return [];
        }
    }

    saveBeneficios(beneficios) {
        try {
            localStorage.setItem('beneficios', JSON.stringify(beneficios));
            return true;
        } catch (error) {
            console.error('Error al guardar beneficios:', error);
            return false;
        }
    }

    // ==================== PAGOS DE CUOTAS ====================
    getPagosCuotas() {
        try {
            const data = localStorage.getItem('pagosCuotas');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar pagos de cuotas:', error);
            return [];
        }
    }

    savePagosCuotas(pagos) {
        try {
            localStorage.setItem('pagosCuotas', JSON.stringify(pagos));
            return true;
        } catch (error) {
            console.error('Error al guardar pagos de cuotas:', error);
            return false;
        }
    }

    // ==================== PAGOS DE BENEFICIOS ====================
    getPagosBeneficios() {
        try {
            const data = localStorage.getItem('pagosBeneficios');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar pagos de beneficios:', error);
            return [];
        }
    }

    savePagosBeneficios(pagos) {
        try {
            localStorage.setItem('pagosBeneficios', JSON.stringify(pagos));
            return true;
        } catch (error) {
            console.error('Error al guardar pagos de beneficios:', error);
            return false;
        }
    }

    // ==================== ASIGNACIONES DE BENEFICIOS ====================
    getAsignacionesBeneficios() {
        try {
            const data = localStorage.getItem('asignacionesBeneficios');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar asignaciones de beneficios:', error);
            return [];
        }
    }

    saveAsignacionesBeneficios(asignaciones) {
        try {
            localStorage.setItem('asignacionesBeneficios', JSON.stringify(asignaciones));
            return true;
        } catch (error) {
            console.error('Error al guardar asignaciones de beneficios:', error);
            return false;
        }
    }
     getCuotasPorAño() {
        try {
            const data = localStorage.getItem('cuotasPorAño');
            if (!data) {
                // Inicializar con año actual si no existe
                const añoActual = new Date().getFullYear();
                const inicial = {
                    [añoActual]: {
                        estado: 'activo',
                        bloqueado: false,
                        datos: {}
                    }
                };
                this.saveCuotasPorAño(inicial);
                return inicial;
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error al cargar cuotas por año:', error);
            return {};
        }
    }

    saveCuotasPorAño(cuotasPorAño) {
        try {
            localStorage.setItem('cuotasPorAño', JSON.stringify(cuotasPorAño));
            return true;
        } catch (error) {
            console.error('Error al guardar cuotas por año:', error);
            return false;
        }
    }

    cerrarAñoCuotas(año, datosAño) {
        try {
            const cuotasPorAño = this.getCuotasPorAño();
            if (cuotasPorAño[año]) {
                cuotasPorAño[año].estado = 'cerrado';
                cuotasPorAño[año].bloqueado = datosAño.bloqueado || false;
                cuotasPorAño[año].fechaCierre = datosAño.fechaCierre;
                cuotasPorAño[año].cerradoPor = datosAño.cerradoPor;
                cuotasPorAño[año].motivoCierre = datosAño.motivoCierre || '';
                this.saveCuotasPorAño(cuotasPorAño);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al cerrar año:', error);
            return false;
        }
    }

    desbloquearAñoCuotas(año, usuario, motivo) {
        try {
            const cuotasPorAño = this.getCuotasPorAño();
            if (cuotasPorAño[año]) {
                cuotasPorAño[año].bloqueado = false;
                cuotasPorAño[año].desbloqueadoPor = usuario;
                cuotasPorAño[año].fechaDesbloqueo = new Date().toISOString();
                cuotasPorAño[año].motivoDesbloqueo = motivo;
                this.saveCuotasPorAño(cuotasPorAño);
                
                // Registrar en auditoría
                this.saveLogAuditoria({
                    tipo: 'cuotas',
                    fecha: new Date().toISOString(),
                    usuario: usuario,
                    accion: 'desbloqueo_año',
                    detalles: `Año ${año} desbloqueado`,
                    motivo: motivo,
                    año: año
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al desbloquear año:', error);
            return false;
        }
    }

    crearNuevoAñoCuotas(año) {
        try {
            const cuotasPorAño = this.getCuotasPorAño();
            if (!cuotasPorAño[año]) {
                cuotasPorAño[año] = {
                    estado: 'activo',
                    bloqueado: false,
                    fechaCreacion: new Date().toISOString(),
                    datos: {}
                };
                this.saveCuotasPorAño(cuotasPorAño);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al crear nuevo año:', error);
            return false;
        }
    }

    // ==================== VENTAS EXTRA DE BENEFICIOS ====================
    getVentasExtras() {
        try {
            const data = localStorage.getItem('ventasExtrasBeneficios');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar ventas extra:', error);
            return [];
        }
    }

    saveVentaExtra(ventaExtra) {
        try {
            const ventasExtras = this.getVentasExtras();
            
            // Generar ID si no existe
            if (!ventaExtra.id) {
                const maxId = ventasExtras.reduce((max, v) => Math.max(max, v.id || 0), 0);
                ventaExtra.id = maxId + 1;
            }
            
            ventasExtras.push(ventaExtra);
            localStorage.setItem('ventasExtrasBeneficios', JSON.stringify(ventasExtras));
            
            // Registrar en auditoría
            this.saveLogAuditoria({
                tipo: 'beneficios',
                fecha: new Date().toISOString(),
                usuario: ventaExtra.registradoPor,
                accion: 'venta_extra_registrada',
                detalles: `Registrada venta extra de ${ventaExtra.cantidad} tarjetas ($${ventaExtra.total.toLocaleString()})`,
                beneficioId: ventaExtra.beneficioId,
                bomberoId: ventaExtra.bomberoId,
                nota: ventaExtra.nota
            });
            
            return ventaExtra.id;
        } catch (error) {
            console.error('Error al guardar venta extra:', error);
            return false;
        }
    }

    getVentasExtrasPorBeneficio(beneficioId, bomberoId) {
        try {
            const ventasExtras = this.getVentasExtras();
            return ventasExtras.filter(v => 
                v.beneficioId === beneficioId && v.bomberoId === bomberoId
            );
        } catch (error) {
            console.error('Error al obtener ventas extra:', error);
            return [];
        }
    }

    actualizarEstadoVentaExtra(ventaExtraId, nuevoEstado, datosAdicionales = {}) {
        try {
            const ventasExtras = this.getVentasExtras();
            const index = ventasExtras.findIndex(v => v.id === ventaExtraId);
            
            if (index !== -1) {
                ventasExtras[index].estado = nuevoEstado;
                
                if (nuevoEstado === 'pagado') {
                    ventasExtras[index].fechaPago = datosAdicionales.fechaPago || new Date().toISOString();
                    ventasExtras[index].pagadoPor = datosAdicionales.pagadoPor;
                }
                
                localStorage.setItem('ventasExtrasBeneficios', JSON.stringify(ventasExtras));
                
                // Registrar en auditoría
                this.saveLogAuditoria({
                    tipo: 'beneficios',
                    fecha: new Date().toISOString(),
                    usuario: datosAdicionales.pagadoPor || 'Sistema',
                    accion: 'pago_venta_extra',
                    detalles: `Pagada venta extra #${ventaExtraId} de $${ventasExtras[index].total.toLocaleString()}`,
                    beneficioId: ventasExtras[index].beneficioId,
                    bomberoId: ventasExtras[index].bomberoId
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar estado venta extra:', error);
            return false;
        }
    }

    // ==================== LOG DE AUDITORÍA ====================
    getLogAuditoria(tipo = null, filtros = {}) {
        try {
            const data = localStorage.getItem('logAuditoria');
            let logs = data ? JSON.parse(data) : [];
            
            // Filtrar por tipo
            if (tipo) {
                logs = logs.filter(log => log.tipo === tipo);
            }
            
            // Filtrar por año
            if (filtros.año) {
                logs = logs.filter(log => log.año === filtros.año);
            }
            
            // Filtrar por beneficioId
            if (filtros.beneficioId) {
                logs = logs.filter(log => log.beneficioId === filtros.beneficioId);
            }
            
            // Filtrar por bomberoId
            if (filtros.bomberoId) {
                logs = logs.filter(log => log.bomberoId === filtros.bomberoId);
            }
            
            // Ordenar por fecha descendente (más reciente primero)
            logs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            
            return logs;
        } catch (error) {
            console.error('Error al cargar log de auditoría:', error);
            return [];
        }
    }

    saveLogAuditoria(entrada) {
        try {
            const logs = this.getLogAuditoria();
            
            // Agregar timestamp si no existe
            if (!entrada.fecha) {
                entrada.fecha = new Date().toISOString();
            }
            
            logs.push(entrada);
            localStorage.setItem('logAuditoria', JSON.stringify(logs));
            
            console.log('📋 Log de auditoría guardado:', entrada);
            return true;
        } catch (error) {
            console.error('Error al guardar log de auditoría:', error);
            return false;
        }
    }

    exportarLogAuditoria(tipo = null, filtros = {}) {
        try {
            const logs = this.getLogAuditoria(tipo, filtros);
            const blob = new Blob([JSON.stringify(logs, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `log_auditoria_${tipo || 'completo'}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error al exportar log de auditoría:', error);
            return false;
        }
    }

    // ==================== ESTADÍSTICAS DE AUDITORÍA ====================
    getEstadisticasAuditoria(tipo = null) {
        try {
            const logs = this.getLogAuditoria(tipo);
            
            const stats = {
                total: logs.length,
                porTipo: {},
                porUsuario: {},
                porAccion: {},
                ultimaActividad: logs.length > 0 ? logs[0].fecha : null
            };
            
            logs.forEach(log => {
                // Por tipo
                stats.porTipo[log.tipo] = (stats.porTipo[log.tipo] || 0) + 1;
                
                // Por usuario
                stats.porUsuario[log.usuario] = (stats.porUsuario[log.usuario] || 0) + 1;
                
                // Por acción
                stats.porAccion[log.accion] = (stats.porAccion[log.accion] || 0) + 1;
            });
            
            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas de auditoría:', error);
            return null;
        }
    }

    // ==================== ASISTENCIAS ====================
    getAsistencias() {
        try {
            const data = localStorage.getItem('asistencias');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar asistencias:', error);
            return [];
        }
    }

    saveAsistencias(asistencias) {
        try {
            localStorage.setItem('asistencias', JSON.stringify(asistencias));
            return true;
        } catch (error) {
            console.error('Error al guardar asistencias:', error);
            return false;
        }
    }
}

// Instancia global del storage manager
const storage = new StorageManager();