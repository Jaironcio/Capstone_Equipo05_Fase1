// ==================== VERIFICADOR DE INTEGRIDAD DE DATOS ====================
// Este script verifica y normaliza todos los datos del localStorage

class VerificadorDatos {
    constructor() {
        this.errores = [];
        this.advertencias = [];
        this.corregidos = 0;
    }

    /**
     * Ejecuta verificación completa del sistema
     */
    verificarTodo() {
        console.log('🔍 Iniciando verificación de integridad de datos...');
        
        this.verificarAsistencias();
        this.verificarRanking();
        this.verificarCatalogoExternos();
        this.verificarBomberos();
        
        this.mostrarReporte();
    }

    /**
     * Verifica y normaliza asistencias
     */
    verificarAsistencias() {
        try {
            let asistencias = JSON.parse(localStorage.getItem('asistencias')) || [];
            const asistenciasOriginales = asistencias.length;
            
            console.log(`📊 Verificando ${asistencias.length} asistencias...`);
            
            asistencias = asistencias.map((asist, index) => {
                const asistCorregida = { ...asist };
                
                // 1. Verificar que tenga ID único
                if (!asistCorregida.id) {
                    asistCorregida.id = Date.now() + index;
                    this.advertencias.push(`Asistencia sin ID - Se generó: ${asistCorregida.id}`);
                    this.corregidos++;
                }
                
                // 2. Verificar que tenga tipo
                if (!asistCorregida.tipo) {
                    // Intentar deducir el tipo por campos existentes
                    if (asistCorregida.claveEmergencia || asistCorregida.direccion) {
                        asistCorregida.tipo = 'emergencia';
                    } else if (asistCorregida.tipoAsamblea) {
                        asistCorregida.tipo = 'asamblea';
                    } else if (asistCorregida.tipoEjercicio) {
                        asistCorregida.tipo = 'ejercicios';
                    } else if (asistCorregida.nombreCitacion) {
                        asistCorregida.tipo = 'citaciones';
                    } else {
                        asistCorregida.tipo = 'otras';
                    }
                    this.advertencias.push(`Asistencia ID ${asistCorregida.id} sin tipo - Se asignó: ${asistCorregida.tipo}`);
                    this.corregidos++;
                }
                
                // 3. Verificar que tenga descripción
                if (!asistCorregida.descripcion) {
                    if (asistCorregida.direccion) {
                        asistCorregida.descripcion = asistCorregida.direccion;
                    } else if (asistCorregida.nombreCitacion) {
                        asistCorregida.descripcion = asistCorregida.nombreCitacion;
                    } else {
                        asistCorregida.descripcion = 'Sin descripción';
                    }
                    this.corregidos++;
                }
                
                // 4. Verificar estadísticas
                if (asistCorregida.totalAsistentes === undefined && asistCorregida.asistentes) {
                    asistCorregida.totalAsistentes = asistCorregida.asistentes.length;
                    this.corregidos++;
                }
                
                // 5. Verificar contadores de externos
                if (asistCorregida.participantes === undefined) {
                    asistCorregida.participantes = asistCorregida.asistentes 
                        ? asistCorregida.asistentes.filter(a => a.tipoExterno === 'participante').length 
                        : 0;
                    this.corregidos++;
                }
                
                if (asistCorregida.canjes === undefined) {
                    asistCorregida.canjes = asistCorregida.asistentes 
                        ? asistCorregida.asistentes.filter(a => a.tipoExterno === 'canje').length 
                        : 0;
                    this.corregidos++;
                }
                
                // 6. Verificar estadísticas por categoría
                if (asistCorregida.asistentes && asistCorregida.oficialesComandancia === undefined) {
                    asistCorregida.oficialesComandancia = asistCorregida.asistentes
                        .filter(a => a.categoria === 'Oficial de Comandancia').length;
                    asistCorregida.oficialesCompania = asistCorregida.asistentes
                        .filter(a => a.categoria === 'Oficial de Compañía').length;
                    asistCorregida.totalOficiales = asistCorregida.oficialesComandancia + asistCorregida.oficialesCompania;
                    asistCorregida.cargosConfianza = asistCorregida.asistentes
                        .filter(a => a.categoria === 'Cargo de Confianza').length;
                    asistCorregida.voluntarios = asistCorregida.asistentes.filter(a => 
                        a.categoria !== 'Oficial de Comandancia' && 
                        a.categoria !== 'Oficial de Compañía' && 
                        a.categoria !== 'Cargo de Confianza'
                    ).length;
                    this.corregidos++;
                }
                
                // 7. Verificar que tenga fecha de registro
                if (!asistCorregida.fechaRegistro) {
                    asistCorregida.fechaRegistro = new Date().toISOString();
                    this.corregidos++;
                }
                
                return asistCorregida;
            });
            
            // Guardar si hubo cambios
            if (this.corregidos > 0) {
                localStorage.setItem('asistencias', JSON.stringify(asistencias));
                console.log(`✅ ${this.corregidos} correcciones aplicadas a asistencias`);
            }
            
            console.log(`✅ Verificación de asistencias completada`);
            
        } catch (error) {
            this.errores.push(`Error al verificar asistencias: ${error.message}`);
            console.error('❌ Error al verificar asistencias:', error);
        }
    }

    /**
     * Verifica y corrige el ranking
     */
    verificarRanking() {
        try {
            const ranking = JSON.parse(localStorage.getItem('rankingAsistencias')) || {};
            console.log(`🏆 Verificando ranking de ${Object.keys(ranking).length} años...`);
            
            // Verificar estructura de cada año
            Object.keys(ranking).forEach(ano => {
                if (!ranking[ano]) {
                    this.advertencias.push(`Ranking del año ${ano} está vacío`);
                    return;
                }
                
                // Contar voluntarios
                const voluntarios = Object.keys(ranking[ano]).filter(k => !k.startsWith('externos_')).length;
                
                // Verificar externos
                if (!ranking[ano].externos_participantes) {
                    ranking[ano].externos_participantes = {};
                }
                if (!ranking[ano].externos_canjes) {
                    ranking[ano].externos_canjes = {};
                }
                
                console.log(`  Año ${ano}: ${voluntarios} voluntarios, ${Object.keys(ranking[ano].externos_participantes).length} participantes, ${Object.keys(ranking[ano].externos_canjes).length} canjes`);
            });
            
            localStorage.setItem('rankingAsistencias', JSON.stringify(ranking));
            console.log('✅ Verificación de ranking completada');
            
        } catch (error) {
            this.errores.push(`Error al verificar ranking: ${error.message}`);
            console.error('❌ Error al verificar ranking:', error);
        }
    }

    /**
     * Verifica catálogo de externos
     */
    verificarCatalogoExternos() {
        try {
            let catalogo = JSON.parse(localStorage.getItem('catalogoExternos')) || { participantes: {}, canjes: {} };
            console.log(`👥 Verificando catálogo de externos...`);
            
            if (!catalogo.participantes) catalogo.participantes = {};
            if (!catalogo.canjes) catalogo.canjes = {};
            
            console.log(`  Participantes: ${Object.keys(catalogo.participantes).length}`);
            console.log(`  Canjes: ${Object.keys(catalogo.canjes).length}`);
            
            localStorage.setItem('catalogoExternos', JSON.stringify(catalogo));
            console.log('✅ Verificación de catálogo completada');
            
        } catch (error) {
            this.errores.push(`Error al verificar catálogo: ${error.message}`);
            console.error('❌ Error al verificar catálogo:', error);
        }
    }

    /**
     * Verifica bomberos
     */
    verificarBomberos() {
        try {
            const bomberos = JSON.parse(localStorage.getItem('bomberos')) || [];
            console.log(`👨‍🚒 Verificando ${bomberos.length} bomberos...`);
            
            const activos = bomberos.filter(b => b.estadoBombero !== 'Dado de Baja' && b.estadoBombero !== 'inactivo').length;
            const martires = bomberos.filter(b => b.estadoBombero === 'martir').length;
            const bajados = bomberos.filter(b => b.estadoBombero === 'Dado de Baja' || b.estadoBombero === 'inactivo').length;
            
            console.log(`  Activos: ${activos} | Mártires: ${martires} | Dados de baja: ${bajados}`);
            console.log('✅ Verificación de bomberos completada');
            
        } catch (error) {
            this.errores.push(`Error al verificar bomberos: ${error.message}`);
            console.error('❌ Error al verificar bomberos:', error);
        }
    }

    /**
     * Reconstruye el ranking desde cero basándose en asistencias
     */
    reconstruirRanking() {
        try {
            console.log('🔨 Reconstruyendo ranking desde asistencias...');
            
            const asistencias = JSON.parse(localStorage.getItem('asistencias')) || [];
            const nuevoRanking = {};
            
            asistencias.forEach(asist => {
                const ano = new Date(asist.fecha).getFullYear();
                
                if (!nuevoRanking[ano]) {
                    nuevoRanking[ano] = {
                        externos_participantes: {},
                        externos_canjes: {}
                    };
                }
                
                // Procesar cada asistente
                if (asist.asistentes) {
                    asist.asistentes.forEach(asistente => {
                        if (asistente.esExterno) {
                            // Externo
                            const tipoKey = asistente.tipoExterno === 'participante' ? 'externos_participantes' : 'externos_canjes';
                            const id = asistente.externoId || asistente.nombre;
                            
                            if (!nuevoRanking[ano][tipoKey][id]) {
                                nuevoRanking[ano][tipoKey][id] = {
                                    nombre: asistente.nombre,
                                    total: 0
                                };
                            }
                            nuevoRanking[ano][tipoKey][id].total++;
                        } else if (asistente.bomberoId) {
                            // Voluntario regular
                            const id = asistente.bomberoId;
                            
                            if (!nuevoRanking[ano][id]) {
                                nuevoRanking[ano][id] = {
                                    nombre: asistente.nombre,
                                    claveBombero: asistente.claveBombero,
                                    total: 0,
                                    emergencias: 0,
                                    asambleas: 0,
                                    ejercicios: 0,
                                    citaciones: 0,
                                    otras: 0
                                };
                            }
                            
                            nuevoRanking[ano][id].total++;
                            
                            // Incrementar por tipo
                            if (asist.tipo === 'emergencia') nuevoRanking[ano][id].emergencias++;
                            else if (asist.tipo === 'asamblea') nuevoRanking[ano][id].asambleas++;
                            else if (asist.tipo === 'ejercicios') nuevoRanking[ano][id].ejercicios++;
                            else if (asist.tipo === 'citaciones') nuevoRanking[ano][id].citaciones++;
                            else if (asist.tipo === 'otras') nuevoRanking[ano][id].otras++;
                        }
                    });
                }
            });
            
            localStorage.setItem('rankingAsistencias', JSON.stringify(nuevoRanking));
            console.log('✅ Ranking reconstruido exitosamente');
            
            return nuevoRanking;
            
        } catch (error) {
            this.errores.push(`Error al reconstruir ranking: ${error.message}`);
            console.error('❌ Error al reconstruir ranking:', error);
            return null;
        }
    }

    /**
     * Muestra reporte final
     */
    mostrarReporte() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 REPORTE DE VERIFICACIÓN DE DATOS');
        console.log('='.repeat(60));
        
        console.log(`\n✅ Correcciones aplicadas: ${this.corregidos}`);
        
        if (this.advertencias.length > 0) {
            console.log(`\n⚠️ Advertencias (${this.advertencias.length}):`);
            this.advertencias.forEach(adv => console.log(`  - ${adv}`));
        }
        
        if (this.errores.length > 0) {
            console.log(`\n❌ Errores (${this.errores.length}):`);
            this.errores.forEach(err => console.log(`  - ${err}`));
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (this.errores.length === 0) {
            console.log('✅ TODOS LOS DATOS ESTÁN CORRECTOS Y LISTOS PARA MIGRACIÓN');
        } else {
            console.log('⚠️ SE ENCONTRARON ERRORES QUE NECESITAN ATENCIÓN');
        }
        
        console.log('='.repeat(60) + '\n');
    }

    /**
     * Exporta todos los datos para backup o migración
     */
    exportarTodosLosDatos() {
        const datos = {
            version: '1.0',
            fecha: new Date().toISOString(),
            asistencias: JSON.parse(localStorage.getItem('asistencias')) || [],
            ranking: JSON.parse(localStorage.getItem('rankingAsistencias')) || {},
            catalogoExternos: JSON.parse(localStorage.getItem('catalogoExternos')) || {},
            bomberos: JSON.parse(localStorage.getItem('bomberos')) || [],
            cargos: JSON.parse(localStorage.getItem('cargos')) || [],
            beneficios: JSON.parse(localStorage.getItem('beneficios')) || [],
            usuarios: JSON.parse(localStorage.getItem('usuarios')) || []
        };
        
        // Crear blob y descargar
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_datos_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('✅ Backup exportado exitosamente');
        return datos;
    }
}

// Crear instancia global
window.verificadorDatos = new VerificadorDatos();

// Auto-ejecutar verificación al cargar
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Verificador de datos disponible. Usa: verificadorDatos.verificarTodo()');
    });
}
