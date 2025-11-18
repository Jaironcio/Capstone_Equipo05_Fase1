// ==================== FUNCIONALIDAD DE AUTOCOMPLETADO Y MAPA REUTILIZABLE ====================

class MapaDirecciones {
    constructor(inputId) {
        this.inputId = inputId;
        this.sugerenciasId = `sugerencias${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`;
        this.mapaPreviewId = `mapaPreview${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`;
        this.timeoutAutocompletado = null;
        this.sugerenciasActuales = [];
        this.indiceSugerenciaSeleccionada = -1;
        
        this.init();
    }
    
    init() {
        const inputDireccion = document.getElementById(this.inputId);
        if (!inputDireccion) {
            console.warn(`Campo ${this.inputId} no encontrado`);
            return;
        }
        
        // Evento: escribir en el input
        inputDireccion.addEventListener('input', () => {
            clearTimeout(this.timeoutAutocompletado);
            const texto = inputDireccion.value.trim();
            
            if (texto.length >= 3) {
                this.timeoutAutocompletado = setTimeout(() => {
                    this.buscarDirecciones(texto);
                    this.actualizarMapaAutomatico(texto);
                }, 500);
            } else {
                this.ocultarSugerencias();
                this.cerrarMapa();
            }
        });
        
        // Evento: navegar con flechas
        inputDireccion.addEventListener('keydown', (e) => {
            const dropdown = document.getElementById(this.sugerenciasId);
            if (!dropdown || !dropdown.classList.contains('activo')) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.indiceSugerenciaSeleccionada = Math.min(
                    this.indiceSugerenciaSeleccionada + 1,
                    this.sugerenciasActuales.length - 1
                );
                this.actualizarSeleccionVisual();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.indiceSugerenciaSeleccionada = Math.max(
                    this.indiceSugerenciaSeleccionada - 1,
                    0
                );
                this.actualizarSeleccionVisual();
            } else if (e.key === 'Enter' && this.indiceSugerenciaSeleccionada >= 0) {
                e.preventDefault();
                this.seleccionarSugerencia(this.indiceSugerenciaSeleccionada);
            } else if (e.key === 'Escape') {
                this.ocultarSugerencias();
            }
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById(this.sugerenciasId);
            if (dropdown && !inputDireccion.contains(e.target) && !dropdown.contains(e.target)) {
                this.ocultarSugerencias();
            }
        });
    }
    
    async buscarDirecciones(texto) {
        try {
            const textoBusqueda = texto.includes('Puerto Montt') ? texto : `${texto}, Puerto Montt, Chile`;
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(textoBusqueda)}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&language=es&region=cl`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'OK' && data.results.length > 0) {
                this.sugerenciasActuales = data.results.slice(0, 5).map(result => ({
                    direccion: result.formatted_address,
                    componentes: result.address_components,
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng
                }));
                
                this.mostrarSugerencias(this.sugerenciasActuales);
            } else {
                this.ocultarSugerencias();
            }
        } catch (error) {
            console.error('Error al buscar direcciones:', error);
        }
    }
    
    mostrarSugerencias(sugerencias) {
        const dropdown = document.getElementById(this.sugerenciasId);
        if (!dropdown || sugerencias.length === 0) {
            this.ocultarSugerencias();
            return;
        }
        
        let html = '';
        sugerencias.forEach((sug, index) => {
            const calle = this.extraerComponente(sug.componentes, ['route', 'street_address']) || '';
            const numero = this.extraerComponente(sug.componentes, ['street_number']) || '';
            const ciudad = this.extraerComponente(sug.componentes, ['locality', 'administrative_area_level_3']) || 'puerto montt';
            const region = this.extraerComponente(sug.componentes, ['administrative_area_level_1']) || 'los lagos';
            const pais = 'chile';
            const codigoPostal = this.extraerComponente(sug.componentes, ['postal_code']) || '';
            
            let direccionCompleta = '';
            if (calle && numero) {
                direccionCompleta = `${calle} ${numero}`;
            } else if (calle) {
                direccionCompleta = calle;
            } else {
                direccionCompleta = sug.direccion.split(',')[0];
            }
            
            direccionCompleta += `, ${ciudad}, ${region}, ${pais}`;
            if (codigoPostal) {
                direccionCompleta += `, ${codigoPostal}`;
            }
            
            html += `
                <div class="sugerencia-item" data-index="${index}">
                    <div class="sugerencia-texto">
                        <span class="sugerencia-icono">📍</span>
                        <span class="sugerencia-principal">${direccionCompleta}</span>
                    </div>
                </div>
            `;
        });
        
        dropdown.innerHTML = html;
        dropdown.classList.add('activo');
        this.indiceSugerenciaSeleccionada = -1;
        
        // Agregar eventos de click
        dropdown.querySelectorAll('.sugerencia-item').forEach((item, index) => {
            item.addEventListener('click', () => this.seleccionarSugerencia(index));
        });
    }
    
    extraerComponente(componentes, tipos) {
        for (let tipo of tipos) {
            const comp = componentes.find(c => c.types.includes(tipo));
            if (comp) return comp.long_name;
        }
        return null;
    }
    
    seleccionarSugerencia(index) {
        if (index >= 0 && index < this.sugerenciasActuales.length) {
            const sugerencia = this.sugerenciasActuales[index];
            document.getElementById(this.inputId).value = sugerencia.direccion;
            this.ocultarSugerencias();
            this.actualizarMapaAutomatico(sugerencia.direccion);
        }
    }
    
    actualizarSeleccionVisual() {
        const items = document.querySelectorAll(`#${this.sugerenciasId} .sugerencia-item`);
        items.forEach((item, index) => {
            if (index === this.indiceSugerenciaSeleccionada) {
                item.classList.add('seleccionado');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('seleccionado');
            }
        });
    }
    
    ocultarSugerencias() {
        const dropdown = document.getElementById(this.sugerenciasId);
        if (dropdown) {
            dropdown.classList.remove('activo');
        }
        this.sugerenciasActuales = [];
        this.indiceSugerenciaSeleccionada = -1;
    }
    
    actualizarMapaAutomatico(texto) {
        if (!texto || texto.length < 3) {
            this.cerrarMapa();
            return;
        }
        
        let direccionCompleta = texto;
        if (!texto.toLowerCase().includes('puerto montt')) {
            direccionCompleta = `${texto}, Puerto Montt, Chile`;
        } else if (!texto.toLowerCase().includes('chile')) {
            direccionCompleta = `${texto}, Chile`;
        }
        
        const mapaPreview = document.getElementById(this.mapaPreviewId);
        const mapaContenido = document.getElementById(`mapaContenido${this.inputId.charAt(0).toUpperCase() + this.inputId.slice(1)}`);
        
        if (!mapaPreview || !mapaContenido) return;
        
        mapaPreview.classList.add('activo');
        
        mapaContenido.innerHTML = `
            <div class="mapa-loading">
                <div class="spinner"></div>
                <p>Actualizando ubicación...</p>
            </div>
        `;
        
        const urlMapa = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(direccionCompleta)}&zoom=16`;
        
        setTimeout(() => {
            mapaContenido.innerHTML = `
                <iframe 
                    src="${urlMapa}"
                    allowfullscreen
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            `;
        }, 400);
    }
    
    cerrarMapa() {
        const mapaPreview = document.getElementById(this.mapaPreviewId);
        if (mapaPreview) {
            mapaPreview.classList.remove('activo');
        }
    }
}

// Función global para inicializar múltiples mapas
function inicializarMapas(...inputIds) {
    inputIds.forEach(id => {
        new MapaDirecciones(id);
    });
}
