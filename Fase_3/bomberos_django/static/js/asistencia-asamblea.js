// ==================== SISTEMA DE ASISTENCIA A ASAMBLEA ====================
class SistemaAsamblea extends SistemaAsistencias {
    constructor() {
        super();
        this.tipoAsistencia = 'asamblea';
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
        this.configurarFechaActual();
        this.renderizarVoluntarios();
        this.cargarListasExternos();
        this.configurarEventos();
    }

    cargarListasExternos() {
        // Cargar datalist de participantes
        const datalistParticipantes = document.getElementById('listaParticipantes');
        datalistParticipantes.innerHTML = '';
        this.participantesGuardados.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            datalistParticipantes.appendChild(option);
        });

        // Cargar datalist de canjes
        const datalistCanjes = document.getElementById('listaCanjes');
        datalistCanjes.innerHTML = '';
        this.canjesGuardados.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            datalistCanjes.appendChild(option);
        });
    }

    agregarParticipante() {
        const input = document.getElementById('inputParticipante');
        const nombre = input.value.trim();

        if (!nombre) {
            Utils.mostrarNotificacion('Ingrese el nombre del voluntario participante', 'error');
            return;
        }

        // Agregar a la lista de seleccionados
        this.participantesSeleccionados.push(nombre);

        // Guardar en localStorage si no existe
        if (!this.participantesGuardados.includes(nombre)) {
            this.participantesGuardados.push(nombre);
            localStorage.setItem('voluntariosParticipantes', JSON.stringify(this.participantesGuardados));
            this.cargarListasExternos();
        }

        // Limpiar input
        input.value = '';

        // Renderizar
        this.renderizarExternos();
        this.actualizarEstadisticas();
    }

    agregarCanje() {
        const input = document.getElementById('inputCanje');
        const nombre = input.value.trim();

        if (!nombre) {
            Utils.mostrarNotificacion('Ingrese el nombre y compañía del voluntario canje', 'error');
            return;
        }

        // Agregar a la lista de seleccionados
        this.canjesSeleccionados.push(nombre);

        // Guardar en localStorage si no existe
        if (!this.canjesGuardados.includes(nombre)) {
            this.canjesGuardados.push(nombre);
            localStorage.setItem('voluntariosCanjes', JSON.stringify(this.canjesGuardados));
            this.cargarListasExternos();
        }

        // Limpiar input
        input.value = '';

        // Renderizar
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
        // Renderizar participantes
        const contenedorParticipantes = document.getElementById('participantesSeleccionados');
        contenedorParticipantes.innerHTML = '';
        this.participantesSeleccionados.forEach((nombre, index) => {
            const div = document.createElement('div');
            div.className = 'externo-item';
            div.innerHTML = `
                <div>
                    <span class="externo-nombre">${nombre}</span>
                    <span class="externo-tipo">Participante</span>
                </div>
                <button class="btn-eliminar-externo" onclick="asambleaSistema.eliminarParticipante(${index})">
                    ✕
                </button>
            `;
            contenedorParticipantes.appendChild(div);
        });

        // Renderizar canjes
        const contenedorCanjes = document.getElementById('canjesSeleccionados');
        contenedorCanjes.innerHTML = '';
        this.canjesSeleccionados.forEach((nombre, index) => {
            const div = document.createElement('div');
            div.className = 'externo-item';
            div.innerHTML = `
                <div>
                    <span class="externo-nombre">${nombre}</span>
                    <span class="externo-tipo">Canje</span>
                </div>
                <button class="btn-eliminar-externo" onclick="asambleaSistema.eliminarCanje(${index})">
                    ✕
                </button>
            `;
            contenedorCanjes.appendChild(div);
        });
    }

    configurarFechaActual() {
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaAsamblea').value = hoy;
    }

    configurarEventos() {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.actualizarEstadisticas());
        });
    }

    seleccionarTodos(tipo) {
        const checkboxes = document.querySelectorAll(`input[data-tipo="${tipo}"]`);
        checkboxes.forEach(cb => cb.checked = true);
        this.actualizarEstadisticas();
    }

    deseleccionarTodos(tipo) {
        const checkboxes = document.querySelectorAll(`input[data-tipo="${tipo}"]`);
        checkboxes.forEach(cb => cb.checked = false);
        this.actualizarEstadisticas();
    }

    actualizarEstadisticas() {
        const totalCheckboxes = document.querySelectorAll('input[type="checkbox"]').length;
        const checkboxesSeleccionados = document.querySelectorAll('input[type="checkbox"]:checked');
        const seleccionados = checkboxesSeleccionados.length;
        const porcentaje = totalCheckboxes > 0 ? Math.round((seleccionados / totalCheckboxes) * 100) : 0;

        document.getElementById('totalPersonas').textContent = totalCheckboxes;
        document.getElementById('asistentesSeleccionados').textContent = seleccionados;
        document.getElementById('porcentajeAsistencia').textContent = porcentaje + '%';

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

        // Agregar participantes y canjes al total
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
            // Validar datos
            const fechaAsamblea = document.getElementById('fechaAsamblea').value;
            const horaInicio = document.getElementById('horaInicio').value;
            const horaTermino = document.getElementById('horaTermino').value;
            const tipoAsamblea = document.getElementById('tipoAsamblea').value;
            const descripcionAsamblea = document.getElementById('descripcionAsamblea').value;

            if (!fechaAsamblea) {
                Utils.mostrarNotificacion('Debe ingresar la fecha de la asamblea', 'error');
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

            if (!tipoAsamblea) {
                Utils.mostrarNotificacion('Debe seleccionar el tipo de asamblea', 'error');
                return;
            }

            // Obtener asistentes
            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            
            if (checkboxes.length === 0 && this.participantesSeleccionados.length === 0 && this.canjesSeleccionados.length === 0) {
                Utils.mostrarNotificacion('Debe seleccionar al menos un asistente', 'error');
                return;
            }

            const asistentes = Array.from(checkboxes).map(checkbox => {
                const bomberoId = parseInt(checkbox.dataset.bomberoId);
                const bombero = this.bomberos.find(b => b.id == bomberoId);
                const cargoVigente = this.obtenerCargoVigente(bomberoId);

                // Determinar categoría
                let categoria = 'Voluntario';
                if (bombero.estadoBombero === 'martir') {
                    categoria = 'Voluntario Mártir';
                } else if (cargoVigente) {
                    if (this.esCargoComandancia(cargoVigente.tipoCargo)) {
                        categoria = 'Oficial de Comandancia';
                    } else if (this.esCargoOficialCompania(cargoVigente.tipoCargo)) {
                        categoria = 'Oficial de Compañía';
                    } else if (this.esCargoConfianza(cargoVigente.tipoCargo)) {
                        categoria = 'Cargo de Confianza';
                    }
                }

                return {
                    bomberoId: bomberoId,
                    nombre: Utils.obtenerNombreCompleto(bombero),
                    claveBombero: bombero.claveBombero,
                    categoria: categoria,
                    cargo: cargoVigente ? cargoVigente.tipoCargo : null,
                    añoCargo: cargoVigente ? cargoVigente.añoCargo : null
                };
            });

            // Agregar voluntarios participantes al array de asistentes
            this.participantesSeleccionados.forEach(externo => {
                asistentes.push({
                    bomberoId: null,
                    nombre: externo.nombre,
                    externoId: externo.id,
                    claveBombero: null,
                    categoria: 'Voluntario Participante',
                    cargo: null,
                    esExterno: true,
                    tipoExterno: 'participante'
                });
            });

            // Agregar voluntarios canjes al array de asistentes
            this.canjesSeleccionados.forEach(externo => {
                asistentes.push({
                    bomberoId: null,
                    nombre: externo.nombre,
                    externoId: externo.id,
                    claveBombero: null,
                    categoria: 'Voluntario Canje',
                    cargo: null,
                    esExterno: true,
                    tipoExterno: 'canje'
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

            // Crear registro
            const registro = {
                id: Date.now(),
                tipo: 'asamblea',
                tipoAsamblea: tipoAsamblea,
                fecha: fechaAsamblea,
                horaInicio: horaInicio,
                horaTermino: horaTermino,
                descripcion: descripcionAsamblea || 'Sin descripción',
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

            // Guardar
            const asistencias = storage.getAsistencias() || [];
            asistencias.push(registro);
            localStorage.setItem('asistencias', JSON.stringify(asistencias));

            // Actualizar ranking de asistencias
            this.actualizarRankingAsistencias(asistentes, 'asamblea');

            // Mensaje detallado con resumen
            const tipoTexto = tipoAsamblea === 'ordinaria' ? 'Asamblea Ordinaria' : 'Asamblea Extraordinaria';
            let mensaje = `✅ ${tipoTexto} registrada exitosamente\n\n` +
                `📊 RESUMEN DE ASISTENCIA:\n` +
                `• Total Asistentes: ${asistentes.length}\n` +
                `• Oficiales: ${totalOficiales} (Comandancia: ${oficialesComandancia}, Compañía: ${oficialesCompania})\n` +
                `• Cargos de Confianza: ${cargosConfianza}\n` +
                `• Voluntarios: ${voluntariosRegulares}`;
            
            if (this.participantesSeleccionados.length > 0 || this.canjesSeleccionados.length > 0) {
                mensaje += `\n\n👥 VOLUNTARIOS EXTERNOS:\n`;
                if (this.participantesSeleccionados.length > 0) {
                    mensaje += `• Participantes: ${this.participantesSeleccionados.length}\n`;
                }
                if (this.canjesSeleccionados.length > 0) {
                    mensaje += `• Canjes: ${this.canjesSeleccionados.length}`;
                }
            }
            
            alert(mensaje);
            Utils.mostrarNotificacion('✅ Asistencia de asamblea guardada exitosamente', 'success');
            
            setTimeout(() => {
                window.location.href = 'historial-asistencias.html';
            }, 2000);

        } catch (error) {
            console.error('Error al guardar asistencia:', error);
            Utils.mostrarNotificacion('Error al guardar asistencia: ' + error.message, 'error');
        }
    }
}

// Inicializar
const asambleaSistema = new SistemaAsamblea();
document.addEventListener('DOMContentLoaded', () => {
    asambleaSistema.init();
});
