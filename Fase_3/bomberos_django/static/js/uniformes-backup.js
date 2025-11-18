// ==================== SISTEMA DE UNIFORMES INDEPENDIENTES ====================
// Cada tipo de uniforme tiene su propio sistema de IDs y almacenamiento
class SistemaUniformes {
    constructor() {
        this.bomberoActual = null;
        // Almacenamiento separado por tipo
        this.uniformesEstructural = [];
        this.uniformesForestal = [];
        this.uniformesRescate = [];
        this.tipoSeleccionado = null;
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Verificar permisos
        const permisos = getUserPermissions();
        if (!permisos || !permisos.canViewUniformes) {
            Utils.mostrarNotificacion('No tienes permisos para acceder a este módulo', 'error');
            setTimeout(() => window.location.href = 'sistema.html', 2000);
            return;
        }

        // Cargar datos del bombero
        await this.cargarBomberoActual();
        
        // Cargar uniformes por tipo (almacenamiento separado)
        this.uniformesEstructural = JSON.parse(localStorage.getItem('uniformesEstructural') || '[]');
        this.uniformesForestal = JSON.parse(localStorage.getItem('uniformesForestal') || '[]');
        this.uniformesRescate = JSON.parse(localStorage.getItem('uniformesRescate') || '[]');
        
        // Inicializar contadores por tipo
        window.idEstructural = parseInt(localStorage.getItem('idEstructural') || '1');
        window.idForestal = parseInt(localStorage.getItem('idForestal') || '1');
        window.idRescate = parseInt(localStorage.getItem('idRescate') || '1');
        
        // Renderizar uniformes
        this.renderizarUniformes();
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoUniformeActual');
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado ningún bombero', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        const bomberos = storage.getBomberos();
        this.bomberoActual = bomberos.find(b => b.id == bomberoId);
        
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        this.mostrarInfoBombero();
    }

    mostrarInfoBombero() {
        const contenedor = document.getElementById('bomberoDatosUniformes');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        
        contenedor.innerHTML = `
            <div><strong>Nombre Completo:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
            <div><strong>Clave Bombero:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
            <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
        `;
    }

    seleccionarTipo(tipo) {
        this.tipoSeleccionado = tipo;
        const formularioContainer = document.getElementById('formularioUniforme');
        formularioContainer.style.display = 'block';
        
        let formularioHTML = '';
        
        if (tipo === 'estructural') {
            formularioHTML = this.generarFormularioEstructural();
        } else if (tipo === 'forestal') {
            formularioHTML = this.generarFormularioForestal();
        } else if (tipo === 'rescate') {
            formularioHTML = this.generarFormularioRescate();
        }
        
        formularioContainer.innerHTML = formularioHTML;
        
        // Configurar evento del formulario
        const form = document.getElementById('formUniformeEspecifico');
        if (form) {
            form.addEventListener('submit', (e) => this.manejarSubmit(e));
        }
        
        // Scroll al formulario
        formularioContainer.scrollIntoView({ behavior: 'smooth' });
    }

    generarFormularioEstructural() {
        return `
            <h3>🧯 Uniforme Estructural</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="estructural">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div class="form-section">
                    <h4>👕 Jardinera Estructural (Opcional)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="jardineraMarca">Marca</label>
                            <input type="text" id="jardineraMarca" name="jardineraMarca" placeholder="Ej: Rosenbauer">
                        </div>
                        <div class="form-group">
                            <label for="jardineraSerie">Número de Serie</label>
                            <input type="text" id="jardineraSerie" name="jardineraSerie" placeholder="Ej: 123456">
                        </div>
                        <div class="form-group">
                            <label for="jardineraTalla">Talla</label>
                            <input type="text" id="jardineraTalla" name="jardineraTalla" placeholder="Ej: M, L, XL">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>🧥 Chaqueta Estructural (Opcional)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="chaquetaMarca">Marca</label>
                            <input type="text" id="chaquetaMarca" name="chaquetaMarca">
                        </div>
                        <div class="form-group">
                            <label for="chaquetaSerie">Número de Serie</label>
                            <input type="text" id="chaquetaSerie" name="chaquetaSerie">
                        </div>
                        <div class="form-group">
                            <label for="chaquetaTalla">Talla</label>
                            <input type="text" id="chaquetaTalla" name="chaquetaTalla" placeholder="Ej: M, L, XL">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>⛑️ Casco Estructural (Opcional)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="cascoModelo">Modelo</label>
                            <input type="text" id="cascoModelo" name="cascoModelo">
                        </div>
                        <div class="form-group">
                            <label for="cascoSerie">Número de Serie</label>
                            <input type="text" id="cascoSerie" name="cascoSerie">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="fechaEntrega" class="required">Fecha de Entrega</label>
                    <input type="date" id="fechaEntrega" name="fechaEntrega" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label for="observaciones">Observaciones</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioForestal() {
        return `
            <h3>🌲 Uniforme Forestal</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="forestal">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div class="form-section">
                    <h4>👕 Jardinera Forestal</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="jardineraMarca" class="required">Marca</label>
                            <input type="text" id="jardineraMarca" name="jardineraMarca" required>
                        </div>
                        <div class="form-group">
                            <label for="jardineraSerie" class="required">Número de Serie</label>
                            <input type="text" id="jardineraSerie" name="jardineraSerie" required>
                        </div>
                        <div class="form-group">
                            <label for="jardineraTalla" class="required">Talla</label>
                            <input type="text" id="jardineraTalla" name="jardineraTalla" placeholder="Ej: M, L, XL" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>🧥 Chaqueta Forestal</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="chaquetaMarca" class="required">Marca</label>
                            <input type="text" id="chaquetaMarca" name="chaquetaMarca" required>
                        </div>
                        <div class="form-group">
                            <label for="chaquetaSerie" class="required">Número de Serie</label>
                            <input type="text" id="chaquetaSerie" name="chaquetaSerie" required>
                        </div>
                        <div class="form-group">
                            <label for="chaquetaTalla" class="required">Talla</label>
                            <input type="text" id="chaquetaTalla" name="chaquetaTalla" placeholder="Ej: M, L, XL" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>⛑️ Casco Forestal (Opcional)</h4>
                    <div class="form-check">
                        <input type="checkbox" id="incluyeCasco" onchange="sistemaUniformes.toggleCascoForestal()">
                        <label for="incluyeCasco">Incluye casco</label>
                    </div>
                    <div id="camposCasco" style="display: none;" class="form-grid">
                        <div class="form-group">
                            <label for="cascoModelo">Modelo</label>
                            <input type="text" id="cascoModelo" name="cascoModelo">
                        </div>
                        <div class="form-group">
                            <label for="cascoSerie">Número de Serie</label>
                            <input type="text" id="cascoSerie" name="cascoSerie">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="fechaEntrega" class="required">Fecha de Entrega</label>
                    <input type="date" id="fechaEntrega" name="fechaEntrega" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label for="observaciones">Observaciones</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioRescate() {
        // Usar replaceAll para reemplazar TODAS las ocurrencias
        return this.generarFormularioForestal()
            .replaceAll('🌲 Uniforme Forestal', '🚑 Uniforme de Rescate')
            .replaceAll('forestal', 'rescate')
            .replaceAll('Forestal', 'Rescate');
    }

    toggleCascoForestal() {
        const checkbox = document.getElementById('incluyeCasco');
        const camposCasco = document.getElementById('camposCasco');
        camposCasco.style.display = checkbox.checked ? 'grid' : 'none';
    }

    volverATipos() {
        const formularioContainer = document.getElementById('formularioUniforme');
        formularioContainer.style.display = 'none';
        this.tipoSeleccionado = null;
    }

    async manejarSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        try {
            const uniformeRegistrado = await this.guardarUniforme(datos);
            event.target.reset();
            this.renderizarUniformes();
            this.volverATipos();
            Utils.mostrarNotificacion('✅ Uniforme registrado exitosamente. Usa el botón "PDF" para generar el comprobante.', 'success');
        } catch (error) {
            console.error('Error al registrar uniforme:', error);
            Utils.mostrarNotificacion('Error al registrar uniforme: ' + error.message, 'error');
        }
    }

    async guardarUniforme(datos) {
        const uniformeData = {
            id: window.uniformeIdCounter++,
            bomberoId: parseInt(datos.bomberoId),
            tipoUniforme: datos.tipoUniforme,
            fechaEntrega: datos.fechaEntrega,
            observaciones: datos.observaciones || '',
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString(),
            estado: 'activo' // activo o devuelto
        };

        // Agregar detalles según tipo (todos opcionales)
        if (datos.tipoUniforme === 'estructural' || datos.tipoUniforme === 'forestal' || datos.tipoUniforme === 'rescate') {
            // Jardinera (opcional)
            if (datos.jardineraMarca && datos.jardineraSerie && datos.jardineraTalla) {
                uniformeData.jardinera = {
                    marca: datos.jardineraMarca,
                    serie: datos.jardineraSerie,
                    talla: datos.jardineraTalla
                };
            }
            
            // Chaqueta (opcional)
            if (datos.chaquetaMarca && datos.chaquetaSerie && datos.chaquetaTalla) {
                uniformeData.chaqueta = {
                    marca: datos.chaquetaMarca,
                    serie: datos.chaquetaSerie,
                    talla: datos.chaquetaTalla
                };
            }
            
            // Casco (opcional)
            if (datos.cascoModelo && datos.cascoSerie) {
                uniformeData.casco = {
                    modelo: datos.cascoModelo,
                    serie: datos.cascoSerie
                };
            }
        }
        
        // Validar que al menos un componente haya sido agregado
        if (!uniformeData.jardinera && !uniformeData.chaqueta && !uniformeData.casco) {
            throw new Error('Debe registrar al menos un componente del uniforme');
        }

        this.uniformes.push(uniformeData);
        this.guardarDatos();
        
        return uniformeData; // Retornar el uniforme guardado
    }

    guardarDatos() {
        storage.saveUniformes(this.uniformes);
        storage.saveCounters({
            bomberoId: window.idCounter,
            uniformeId: window.uniformeIdCounter
        });
    }

    renderizarUniformes() {
        const lista = document.getElementById('listaUniformes');
        const totalElement = document.getElementById('totalUniformes');
        if (!lista) return;

        const uniformesBombero = this.uniformes.filter(u => u.bomberoId == this.bomberoActual.id && u.estado === 'activo');
        
        // Actualizar contador
        if (totalElement) {
            totalElement.textContent = uniformesBombero.length;
        }
        
        if (uniformesBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No hay uniformes registrados</p>';
            return;
        }

        lista.innerHTML = uniformesBombero.map(uniforme => {
            const tipoNombre = uniforme.tipoUniforme === 'estructural' ? '🧯 Estructural' : 
                               uniforme.tipoUniforme === 'forestal' ? '🌲 Forestal' : '🚑 Rescate';
            
            let detalles = '';
            if (uniforme.jardinera) {
                detalles += `<p><strong>Jardinera:</strong> ${uniforme.jardinera.marca} - ${uniforme.jardinera.serie} (Talla: ${uniforme.jardinera.talla})</p>`;
            }
            if (uniforme.chaqueta) {
                detalles += `<p><strong>Chaqueta:</strong> ${uniforme.chaqueta.marca} - ${uniforme.chaqueta.serie} (Talla: ${uniforme.chaqueta.talla})</p>`;
            }
            if (uniforme.casco) {
                detalles += `<p><strong>Casco:</strong> ${uniforme.casco.modelo} - ${uniforme.casco.serie}</p>`;
            }

            return `
                <div class="uniforme-card">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h4>${tipoNombre}</h4>
                            <p><strong>Fecha Entrega:</strong> ${Utils.formatearFecha(uniforme.fechaEntrega)}</p>
                            ${detalles}
                            ${uniforme.observaciones ? `<p><strong>Obs:</strong> ${uniforme.observaciones}</p>` : ''}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-pdf btn-sm" onclick="sistemaUniformes.generarPDFPorId(${uniforme.id})">
                                📄 PDF
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="sistemaUniformes.devolverUniforme(${uniforme.id})">
                                📤 Devolver
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    devolverUniforme(uniformeId) {
        console.log('🔄 Intentando devolver uniforme con ID:', uniformeId);
        console.log('📦 Uniformes actuales:', this.uniformes);
        
        if (!confirm('¿Está seguro de registrar la devolución de este uniforme?')) {
            console.log('❌ Usuario canceló la devolución');
            return;
        }

        const uniforme = this.uniformes.find(u => u.id === uniformeId);
        console.log('🔍 Uniforme encontrado:', uniforme);
        
        if (uniforme) {
            console.log('✅ Marcando como devuelto...');
            uniforme.estado = 'devuelto';
            uniforme.fechaDevolucion = new Date().toISOString();
            uniforme.devueltoPor = JSON.parse(localStorage.getItem('currentUser')).username;
            this.guardarDatos();
            this.renderizarUniformes();
            Utils.mostrarNotificacion('✅ Devolución registrada exitosamente', 'success');
            console.log('✅ Devolución completada');
        } else {
            console.error('❌ No se encontró el uniforme con ID:', uniformeId);
            Utils.mostrarNotificacion('❌ Error: Uniforme no encontrado', 'error');
        }
    }

    // Wrapper para generar PDF desde botón individual
    generarPDFPorId(uniformeId) {
        console.log('🔍 Buscando uniforme con ID:', uniformeId);
        console.log('📦 Uniformes disponibles:', this.uniformes);
        
        const uniforme = this.uniformes.find(u => u.id === uniformeId);
        
        if (uniforme) {
            console.log('✅ Uniforme encontrado:', uniforme);
            console.log('📋 Tipo de uniforme:', uniforme.tipoUniforme);
            this.generarPDFUniforme(uniforme);
        } else {
            console.error('❌ Uniforme no encontrado con ID:', uniformeId);
            Utils.mostrarNotificacion('Uniforme no encontrado', 'error');
        }
    }

    // Generar PDF para UN SOLO uniforme
    async generarPDFUniforme(uniforme) {
        console.log('Generando PDF para uniforme:', uniforme);
        Utils.mostrarNotificacion('Generando comprobante de entrega...', 'info');

        try {
            if (!window.jspdf) {
                throw new Error('jsPDF no está cargado');
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            console.log('jsPDF inicializado correctamente');
            
            // Logo (si existe) - Ajustado para no superponerse
            const logoCompania = localStorage.getItem('logoCompania');
            if (logoCompania) {
                doc.addImage(logoCompania, 'PNG', 15, 8, 28, 28);
            }

            // Determinar color según tipo de uniforme (antes de usarlo)
            let colorPrincipalR, colorPrincipalG, colorPrincipalB;
            
            if (uniforme.tipoUniforme === 'estructural') {
                colorPrincipalR = 255; colorPrincipalG = 152; colorPrincipalB = 0; // Naranja
            } else if (uniforme.tipoUniforme === 'forestal') {
                colorPrincipalR = 76; colorPrincipalG = 175; colorPrincipalB = 80; // Verde
            } else {
                colorPrincipalR = 244; colorPrincipalG = 67; colorPrincipalB = 54; // Rojo
            }
            
            // Título - Ajustado para no superponerse con logo
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.text('REGISTRO DE UNIFORMES ASIGNADOS', 105, 22, { align: 'center' });
            
            // Línea decorativa gruesa
            doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.setLineWidth(1);
            doc.line(15, 40, 195, 40);
            
            doc.setLineWidth(0.3);
            doc.line(15, 42, 195, 42);

            // Información del Voluntario - CON RECUADRO
            let y = 50;
            
            const nombreCompleto = Utils.obtenerNombreCompleto(this.bomberoActual);
            const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
            
            // Recuadro para datos del voluntario con color del uniforme
            doc.setFillColor(colorPrincipalR + (255-colorPrincipalR)*0.9, 
                            colorPrincipalG + (255-colorPrincipalG)*0.9, 
                            colorPrincipalB + (255-colorPrincipalB)*0.9);
            doc.roundedRect(15, y - 5, 180, 40, 3, 3, 'F');
            doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.setLineWidth(0.5);
            doc.roundedRect(15, y - 5, 180, 40, 3, 3, 'S');
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.text('DATOS DEL VOLUNTARIO', 20, y + 2);
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            y += 10;
            
            doc.setFont(undefined, 'bold');
            doc.text('Nombre:', 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(nombreCompleto, 42, y);
            y += 7;
            
            doc.setFont(undefined, 'bold');
            doc.text('Clave:', 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(this.bomberoActual.claveBombero, 42, y);
            
            doc.setFont(undefined, 'bold');
            doc.text('RUN:', 120, y);
            doc.setFont(undefined, 'normal');
            doc.text(this.bomberoActual.rut, 135, y);
            y += 7;
            
            doc.setFont(undefined, 'bold');
            doc.text('Compañía:', 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(this.bomberoActual.compania, 42, y);
            y += 7;
            
            doc.setFont(undefined, 'bold');
            doc.text('Antigüedad:', 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(`${antiguedad.años} años, ${antiguedad.meses} meses`, 42, y);
            y += 15;

            // Título del uniforme entregado con color específico
            doc.setFontSize(13);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.text('UNIFORME ENTREGADO', 15, y);
            y += 10;

            // Generar el uniforme (usar colores ya definidos)
            let tipoNombre, colorNombre;
            
            if (uniforme.tipoUniforme === 'estructural') {
                tipoNombre = 'UNIFORME ESTRUCTURAL';
                colorNombre = 'naranja';
            } else if (uniforme.tipoUniforme === 'forestal') {
                tipoNombre = 'UNIFORME FORESTAL';
                colorNombre = 'verde';
            } else {
                tipoNombre = 'UNIFORME DE RESCATE';
                colorNombre = 'rojo';
            }
            
            console.log(`Generando PDF de ${tipoNombre} con color ${colorNombre}`);
            
            // Altura del recuadro (calculada dinámicamente)
            let alturaRecuadro = 35;
            if (uniforme.casco) alturaRecuadro += 6;
            if (uniforme.observaciones) alturaRecuadro += 6;
            
            // Recuadro para el uniforme
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(15, y, 180, alturaRecuadro, 2, 2, 'F');
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.roundedRect(15, y, 180, alturaRecuadro, 2, 2, 'S');
            
            // Barra superior con tipo y COLOR ESPECÍFICO
            doc.setFillColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.roundedRect(15, y, 180, 8, 2, 2, 'F');
            
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text(tipoNombre, 20, y + 5.5);
            
            y += 12;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);

            // Jardinera
            if (uniforme.jardinera) {
                doc.setFont(undefined, 'bold');
                doc.text('• Jardinera:', 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(`Marca: ${uniforme.jardinera.marca}`, 45, y);
                doc.text(`| Serie: ${uniforme.jardinera.serie}`, 90, y);
                doc.text(`| Talla: ${uniforme.jardinera.talla}`, 135, y);
                y += 6;
            }

            // Chaqueta
            if (uniforme.chaqueta) {
                doc.setFont(undefined, 'bold');
                doc.text('• Chaqueta:', 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(`Marca: ${uniforme.chaqueta.marca}`, 45, y);
                doc.text(`| Serie: ${uniforme.chaqueta.serie}`, 90, y);
                doc.text(`| Talla: ${uniforme.chaqueta.talla}`, 135, y);
                y += 6;
            }

            // Casco
            if (uniforme.casco) {
                doc.setFont(undefined, 'bold');
                doc.text('• Casco:', 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(`Modelo: ${uniforme.casco.modelo}`, 45, y);
                doc.text(`| Serie: ${uniforme.casco.serie}`, 90, y);
                y += 6;
            }

            // Línea separadora interna
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
            doc.line(20, y, 190, y);
            y += 4;

            // Fecha de entrega (sin emojis)
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Fecha de entrega: ${Utils.formatearFecha(uniforme.fechaEntrega)}`, 20, y);
                
            if (uniforme.observaciones) {
                y += 4;
                doc.text(`Observaciones: ${uniforme.observaciones}`, 20, y);
            }

            y += alturaRecuadro - (uniforme.casco ? 23 : 17) - (uniforme.observaciones ? 4 : 0) + 12;

            // Línea de separación final con color del uniforme
            y += 8;
            if (y > 215) {
                doc.addPage();
                y = 20;
            }
            
            doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.setLineWidth(0.8);
            doc.line(15, y, 195, y);
            y += 12;

            // Recuadro de declaración con color del uniforme
            doc.setFillColor(colorPrincipalR + (255-colorPrincipalR)*0.9, 
                            colorPrincipalG + (255-colorPrincipalG)*0.9, 
                            colorPrincipalB + (255-colorPrincipalB)*0.9);
            doc.roundedRect(15, y, 180, 18, 2, 2, 'F');
            doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.setLineWidth(0.5);
            doc.roundedRect(15, y, 180, 18, 2, 2, 'S');
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('DECLARACION:', 20, y + 6);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8.5);
            doc.text('Declaro haber recibido los uniformes detallados anteriormente en buen estado,', 20, y + 11);
            doc.text('comprometiendome a su correcto uso y conservacion.', 20, y + 16);
            y += 28;

            // Sección de firmas
            const xIzq = 25;
            const xDer = 125;
            
            // Firma izquierda - Voluntario
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.5);
            doc.line(xIzq, y + 25, xIzq + 60, y + 25);
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Firma del Voluntario', xIzq + 10, y + 30);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.text(`Nombre: ${nombreCompleto}`, xIzq, y + 35);
            doc.text(`RUN: ${this.bomberoActual.rut}`, xIzq, y + 40);
            
            // Firma derecha - Autoridad
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.5);
            doc.line(xDer, y + 25, xDer + 60, y + 25);
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Firma y Timbre', xDer + 15, y + 30);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.text('Capitanía / Autoridad', xDer + 10, y + 35);
            doc.text('Fecha: ______________', xDer + 10, y + 40);

            // Footer en todas las páginas
            const totalPaginas = doc.internal.pages.length - 1;
            const fechaGeneracion = new Date().toLocaleDateString('es-CL', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
            
            for (let i = 1; i <= totalPaginas; i++) {
                doc.setPage(i);
                
                // Línea superior del footer con color del uniforme
                doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
                doc.setLineWidth(0.3);
                doc.line(15, 285, 195, 285);
                
                // Texto del footer
                doc.setFontSize(7);
                doc.setTextColor(120, 120, 120);
                doc.setFont(undefined, 'normal');
                doc.text(`Documento generado el ${fechaGeneracion}`, 15, 289);
                
                doc.setFont(undefined, 'bold');
                doc.text(`Página ${i} de ${totalPaginas}`, 195, 289, { align: 'right' });
                
                doc.setFont(undefined, 'italic');
                doc.setFontSize(6);
                doc.text('Sistema de Registro de Uniformes - Proyecto SEIS', 105, 293, { align: 'center' });
            }

            // Descargar PDF
            const fecha = new Date().toISOString().split('T')[0];
            const nombreArchivo = `Comprobante_Uniforme_${this.bomberoActual.claveBombero}_${fecha}.pdf`;
            
            console.log('Guardando PDF con nombre:', nombreArchivo);
            doc.save(nombreArchivo);
            console.log('PDF guardado exitosamente');
            
            Utils.mostrarNotificacion('✅ Comprobante de entrega generado', 'success');
        } catch (error) {
            console.error('❌ Error al generar PDF:', error);
            console.error('Stack trace:', error.stack);
            Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }
}

// Inicializar sistema
let sistemaUniformes;
document.addEventListener('DOMContentLoaded', () => {
    sistemaUniformes = new SistemaUniformes();
});
