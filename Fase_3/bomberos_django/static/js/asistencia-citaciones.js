// ==================== SISTEMA DE ASISTENCIA A CITACIONES ====================
class SistemaCitaciones extends SistemaAsistencias {
    constructor() {
        super();
        this.tipoAsistencia = 'citaciones';
        this.nombreClase = 'citacionesSistema';
        this.participantesSeleccionados = [];
        this.canjesSeleccionados = [];
        this.participantesGuardados = JSON.parse(localStorage.getItem('voluntariosParticipantes')) || [];
        this.canjesGuardados = JSON.parse(localStorage.getItem('voluntariosCanjes')) || [];
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        await this.cargarDatos();
        document.getElementById('fechaCitacion').value = new Date().toISOString().split('T')[0];
        this.renderizarVoluntarios();
        this.cargarListasExternos();
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => this.actualizarEstadisticas());
        });
    }

    cargarListasExternos() {
        const datalistParticipantes = document.getElementById('listaParticipantes');
        datalistParticipantes.innerHTML = '';
        this.participantesGuardados.forEach(nombre => {
            datalistParticipantes.appendChild(Object.assign(document.createElement('option'), { value: nombre }));
        });

        const datalistCanjes = document.getElementById('listaCanjes');
        datalistCanjes.innerHTML = '';
        this.canjesGuardados.forEach(nombre => {
            datalistCanjes.appendChild(Object.assign(document.createElement('option'), { value: nombre }));
        });
    }

    agregarParticipante() {
        const input = document.getElementById('inputParticipante');
        const nombre = input.value.trim();
        if (!nombre) return Utils.mostrarNotificacion('Ingrese el nombre del voluntario participante', 'error');

        this.participantesSeleccionados.push(nombre);
        if (!this.participantesGuardados.includes(nombre)) {
            this.participantesGuardados.push(nombre);
            localStorage.setItem('voluntariosParticipantes', JSON.stringify(this.participantesGuardados));
            this.cargarListasExternos();
        }
        input.value = '';
        this.renderizarExternos();
        this.actualizarEstadisticas();
    }

    agregarCanje() {
        const input = document.getElementById('inputCanje');
        const nombre = input.value.trim();
        if (!nombre) return Utils.mostrarNotificacion('Ingrese el nombre y compañía del voluntario canje', 'error');

        this.canjesSeleccionados.push(nombre);
        if (!this.canjesGuardados.includes(nombre)) {
            this.canjesGuardados.push(nombre);
            localStorage.setItem('voluntariosCanjes', JSON.stringify(this.canjesGuardados));
            this.cargarListasExternos();
        }
        input.value = '';
        this.renderizarExternos();
        this.actualizarEstadisticas();
    }

    eliminarParticipante(index) {
        this.participantesSeleccionados.splice(index, 1);
        this.renderizarExternos();
        this.actualizarEstadisticas();
    }

    eliminarCanje(index) {
        this.canjesSeleccionados.splice(index, 1);
        this.renderizarExternos();
        this.actualizarEstadisticas();
    }

    renderizarExternos() {
        const contenedorParticipantes = document.getElementById('participantesSeleccionados');
        contenedorParticipantes.innerHTML = this.participantesSeleccionados.map((nombre, index) => 
            `<div class="externo-item">
                <div><span class="externo-nombre">${nombre}</span><span class="externo-tipo">Participante</span></div>
                <button class="btn-eliminar-externo" onclick="${this.nombreClase}.eliminarParticipante(${index})">✕</button>
            </div>`
        ).join('');

        const contenedorCanjes = document.getElementById('canjesSeleccionados');
        contenedorCanjes.innerHTML = this.canjesSeleccionados.map((nombre, index) =>
            `<div class="externo-item">
                <div><span class="externo-nombre">${nombre}</span><span class="externo-tipo">Canje</span></div>
                <button class="btn-eliminar-externo" onclick="${this.nombreClase}.eliminarCanje(${index})">✕</button>
            </div>`
        ).join('');
    }

    seleccionarTodos(tipo) {
        document.querySelectorAll(`input[data-tipo="${tipo}"]`).forEach(cb => cb.checked = true);
        this.actualizarEstadisticas();
    }

    deseleccionarTodos(tipo) {
        document.querySelectorAll(`input[data-tipo="${tipo}"]`).forEach(cb => cb.checked = false);
        this.actualizarEstadisticas();
    }

    actualizarEstadisticas() {
        const total = document.querySelectorAll('input[type="checkbox"]').length;
        const checkboxesSeleccionados = document.querySelectorAll('input[type="checkbox"]:checked');
        const seleccionados = checkboxesSeleccionados.length;
        
        document.getElementById('totalPersonas').textContent = total;
        document.getElementById('asistentesSeleccionados').textContent = seleccionados;
        document.getElementById('porcentajeAsistencia').textContent = total > 0 ? Math.round((seleccionados / total) * 100) + '%' : '0%';

        // Calcular resumen detallado por categoría
        let oficialesComandancia = 0;
        let oficialesCompania = 0;
        let cargosConfianza = 0;
        let voluntarios = 0;

        checkboxesSeleccionados.forEach(checkbox => {
            const bomberoId = parseInt(checkbox.dataset.bomberoId);
            const bombero = this.bomberos.find(b => b.id == bomberoId);
            const cargoVigente = this.obtenerCargoVigente(bomberoId);

            if (bombero.estadoBombero === 'martir') {
                voluntarios++;
            } else if (cargoVigente) {
                if (this.esCargoComandancia(cargoVigente.tipoCargo)) {
                    oficialesComandancia++;
                } else if (this.esCargoOficialCompania(cargoVigente.tipoCargo)) {
                    oficialesCompania++;
                } else if (this.esCargoConfianza(cargoVigente.tipoCargo)) {
                    cargosConfianza++;
                } else {
                    voluntarios++;
                }
            } else {
                voluntarios++;
            }
        });

        const totalOficiales = oficialesComandancia + oficialesCompania;
        const totalConExternos = seleccionados + this.participantesSeleccionados.length + this.canjesSeleccionados.length;

        // Actualizar resumen detallado
        document.getElementById('resumenTotal').textContent = totalConExternos;
        document.getElementById('resumenOficiales').textContent = totalOficiales;
        document.getElementById('resumenComandancia').textContent = oficialesComandancia;
        document.getElementById('resumenCompania').textContent = oficialesCompania;
        document.getElementById('resumenConfianza').textContent = cargosConfianza;
        document.getElementById('resumenVoluntarios').textContent = voluntarios + this.participantesSeleccionados.length + this.canjesSeleccionados.length;
    }

    async guardarAsistencia() {
        try {
            const fecha = document.getElementById('fechaCitacion').value;
            const horaInicio = document.getElementById('horaInicio').value;
            const horaTermino = document.getElementById('horaTermino').value;
            const nombreCitacion = document.getElementById('nombreCitacion').value;
            const descripcion = document.getElementById('descripcionCitacion').value;

            if (!fecha) {
                Utils.mostrarNotificacion('Debe ingresar la fecha de la citación', 'error');
                return;
            }

            if (!horaInicio || !horaTermino) {
                Utils.mostrarNotificacion('Debe ingresar hora de inicio y término', 'error');
                return;
            }

            if (horaTermino <= horaInicio) {
                Utils.mostrarNotificacion('La hora de término debe ser posterior a la hora de inicio', 'error');
                return;
            }

            if (!nombreCitacion) {
                Utils.mostrarNotificacion('Debe ingresar el nombre de la citación', 'error');
                return;
            }

            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            
            if (checkboxes.length === 0 && this.participantesSeleccionados.length === 0 && this.canjesSeleccionados.length === 0) {
                Utils.mostrarNotificacion('Debe seleccionar al menos un asistente', 'error');
                return;
            }

            const asistentes = Array.from(checkboxes).map(checkbox => {
                const bomberoId = parseInt(checkbox.dataset.bomberoId);
                const bombero = this.bomberos.find(b => b.id == bomberoId);
                const cargoVigente = this.obtenerCargoVigente(bomberoId);

                let categoria = 'Voluntario';
                if (bombero.estadoBombero === 'martir') categoria = 'Voluntario Mártir';
                else if (cargoVigente) {
                    if (this.esCargoComandancia(cargoVigente.tipoCargo)) categoria = 'Oficial de Comandancia';
                    else if (this.esCargoOficialCompania(cargoVigente.tipoCargo)) categoria = 'Oficial de Compañía';
                    else if (this.esCargoConfianza(cargoVigente.tipoCargo)) categoria = 'Cargo de Confianza';
                }

                return {
                    bomberoId: bomberoId,
                    nombre: Utils.obtenerNombreCompleto(bombero),
                    claveBombero: bombero.claveBombero,
                    categoria: categoria,
                    cargo: cargoVigente ? cargoVigente.tipoCargo : null
                };
            });

            // Agregar voluntarios externos
            this.participantesSeleccionados.forEach(externo => {
                asistentes.push({
                    bomberoId: null, nombre: externo.nombre, externoId: externo.id, claveBombero: null,
                    categoria: 'Voluntario Participante', cargo: null,
                    esExterno: true, tipoExterno: 'participante'
                });
            });

            this.canjesSeleccionados.forEach(externo => {
                asistentes.push({
                    bomberoId: null, nombre: externo.nombre, externoId: externo.id, claveBombero: null,
                    categoria: 'Voluntario Canje', cargo: null,
                    esExterno: true, tipoExterno: 'canje'
                });
            });

            // Calcular estadísticas por categoría
            const oficialesComandancia = asistentes.filter(a => a.categoria === 'Oficial de Comandancia').length;
            const oficialesCompania = asistentes.filter(a => a.categoria === 'Oficial de Compañía').length;
            const cargosConfianza = asistentes.filter(a => a.categoria === 'Cargo de Confianza').length;
            const totalOficiales = oficialesComandancia + oficialesCompania;
            const voluntariosRegulares = asistentes.filter(a => 
                a.categoria !== 'Oficial de Comandancia' && 
                a.categoria !== 'Oficial de Compañía' && 
                a.categoria !== 'Cargo de Confianza'
            ).length;

            const registro = {
                id: Date.now(),
                tipo: 'citaciones',
                nombreCitacion: nombreCitacion,
                fecha: fecha,
                horaInicio: horaInicio,
                horaTermino: horaTermino,
                descripcion: descripcion || 'Sin descripción',
                asistentes: asistentes,
                totalAsistentes: asistentes.length,
                oficialesComandancia: oficialesComandancia,
                oficialesCompania: oficialesCompania,
                totalOficiales: totalOficiales,
                cargosConfianza: cargosConfianza,
                voluntarios: voluntariosRegulares,
                participantes: this.participantesSeleccionados.length,
                canjes: this.canjesSeleccionados.length,
                porcentajeAsistencia: Math.round((asistentes.length / this.bomberos.length) * 100),
                fechaRegistro: new Date().toISOString()
            };

            const asistencias = storage.getAsistencias() || [];
            asistencias.push(registro);
            localStorage.setItem('asistencias', JSON.stringify(asistencias));

            // Actualizar ranking
            this.actualizarRankingAsistencias(asistentes, 'citaciones');

            // Mensaje detallado con resumen
            let mensaje = `✅ Citación "${nombreCitacion}" registrada exitosamente\n\n` +
                `📊 RESUMEN DE ASISTENCIA:\n` +
                `• Total Asistentes: ${asistentes.length}\n` +
                `• Oficiales: ${totalOficiales} (Comandancia: ${oficialesComandancia}, Compañía: ${oficialesCompania})\n` +
                `• Cargos de Confianza: ${cargosConfianza}\n` +
                `• Voluntarios: ${voluntariosRegulares}`;
            
            if (this.participantesSeleccionados.length > 0 || this.canjesSeleccionados.length > 0) {
                mensaje += `\n\n👥 VOLUNTARIOS EXTERNOS:\n`;
                if (this.participantesSeleccionados.length > 0) mensaje += `• Participantes: ${this.participantesSeleccionados.length}\n`;
                if (this.canjesSeleccionados.length > 0) mensaje += `• Canjes: ${this.canjesSeleccionados.length}`;
            }
            
            alert(mensaje);
            Utils.mostrarNotificacion('✅ Asistencia de citación guardada exitosamente', 'success');
            
            setTimeout(() => {
                window.location.href = 'historial-asistencias.html';
            }, 2000);

        } catch (error) {
            console.error('Error al guardar asistencia:', error);
            Utils.mostrarNotificacion('Error al guardar asistencia: ' + error.message, 'error');
        }
    }
}

const citacionesSistema = new SistemaCitaciones();
document.addEventListener('DOMContentLoaded', () => {
    citacionesSistema.init();
});
