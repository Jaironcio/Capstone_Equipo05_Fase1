// ==================== GESTOR DE LOGOS ====================
console.log('🚀 [GESTOR LOGOS] Cargando...');

class GestorLogos {
    constructor() {
        this.logos = [];
        this.init();
    }

    async init() {
        console.log('[LOGOS] Inicializando gestor...');
        await this.cargarLogos();
        this.renderizarLogos();
        this.configurarEventos();
    }

    async cargarLogos() {
        try {
            const response = await fetch('/api/logos/', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.logos = Array.isArray(data) ? data : (data.results || []);
                console.log('[LOGOS] Logos cargados:', this.logos.length);
            }
        } catch (error) {
            console.error('[LOGOS] Error al cargar:', error);
        }
    }

    renderizarLogos() {
        const container = document.getElementById('listaLogos');
        if (!container) return;

        if (this.logos.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="padding: 20px; text-align: center; color: #999;">
                    <p>📸 No hay logos cargados</p>
                    <p style="font-size: 0.9em;">Sube tu primer logo usando el botón de arriba</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.logos.forEach(logo => {
            const usos = [];
            if (logo.usar_en_pdfs) usos.push('📄 PDFs');
            if (logo.usar_en_asistencias) usos.push('📋 Asistencias');
            if (logo.usar_en_sidebar) usos.push('📁 Sidebar');
            
            const usosText = usos.length > 0 ? usos.join(' · ') : 'Sin uso';
            const borderColor = usos.length > 0 ? '#28a745' : '#ddd';
            
            html += `
                <div class="logo-item" style="border: 2px solid ${borderColor}; border-radius: 16px; padding: 20px; margin-bottom: 18px; background: linear-gradient(to right, #ffffff 0%, #fafafa 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.12)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'">
                    <div style="display: flex; align-items: start; gap: 18px;">
                        <div class="logo-preview" style="flex-shrink: 0; background: white; padding: 12px; border-radius: 12px; border: 2px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <img src="${logo.imagen}" alt="${logo.nombre}" style="width: 70px; height: 70px; object-fit: contain;">
                        </div>
                        <div class="logo-info" style="flex-grow: 1;">
                            <h5 style="margin: 0 0 8px 0; font-size: 1.15em; font-weight: 700; color: #1f2937;">${logo.nombre}</h5>
                            <p style="margin: 0 0 10px 0; font-size: 0.9em; color: #6b7280; line-height: 1.4;">${logo.descripcion || 'Sin descripción'}</p>
                            
                            <!-- Estado de uso -->
                            <div style="margin: 0 0 12px 0; padding: 8px 12px; background: ${usos.length > 0 ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : '#f3f4f6'}; border-radius: 8px; display: inline-block;">
                                <span style="font-size: 0.85em; color: ${usos.length > 0 ? '#065f46' : '#6b7280'}; font-weight: 600;">
                                    ${usosText}
                                </span>
                            </div>
                            
                            <p style="margin: 0 0 12px 0; font-size: 0.78em; color: #9ca3af;">
                                📅 ${new Date(logo.fecha_carga).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} • 👤 ${logo.cargado_por_nombre || 'N/A'}
                            </p>
                            
                            <!-- Checkboxes para contextos -->
                            <div style="margin-top: 14px; display: flex; gap: 18px; flex-wrap: wrap;">
                                <label style="display: flex; align-items: center; gap: 7px; cursor: pointer; font-size: 0.9em; padding: 6px 12px; background: white; border-radius: 8px; border: 2px solid ${logo.usar_en_pdfs ? '#3b82f6' : '#e5e7eb'}; transition: all 0.2s;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='${logo.usar_en_pdfs ? '#3b82f6' : '#e5e7eb'}'">
                                    <input type="checkbox" ${logo.usar_en_pdfs ? 'checked' : ''} 
                                           onchange="gestorLogos.toggleContexto(${logo.id}, 'pdfs', this.checked)"
                                           style="cursor: pointer; width: 18px; height: 18px;">
                                    <span style="font-weight: 500;">📄 PDFs</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 7px; cursor: pointer; font-size: 0.9em; padding: 6px 12px; background: white; border-radius: 8px; border: 2px solid ${logo.usar_en_asistencias ? '#10b981' : '#e5e7eb'}; transition: all 0.2s;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='${logo.usar_en_asistencias ? '#10b981' : '#e5e7eb'}'">
                                    <input type="checkbox" ${logo.usar_en_asistencias ? 'checked' : ''} 
                                           onchange="gestorLogos.toggleContexto(${logo.id}, 'asistencias', this.checked)"
                                           style="cursor: pointer; width: 18px; height: 18px;">
                                    <span style="font-weight: 500;">📋 Asistencias</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 7px; cursor: pointer; font-size: 0.9em; padding: 6px 12px; background: white; border-radius: 8px; border: 2px solid ${logo.usar_en_sidebar ? '#f59e0b' : '#e5e7eb'}; transition: all 0.2s;" onmouseover="this.style.borderColor='#f59e0b'" onmouseout="this.style.borderColor='${logo.usar_en_sidebar ? '#f59e0b' : '#e5e7eb'}'">
                                    <input type="checkbox" ${logo.usar_en_sidebar ? 'checked' : ''} 
                                           onchange="gestorLogos.toggleContexto(${logo.id}, 'sidebar', this.checked)"
                                           style="cursor: pointer; width: 18px; height: 18px;">
                                    <span style="font-weight: 500;">📁 Sidebar</span>
                                </label>
                            </div>
                        </div>
                        <div class="logo-actions" style="display: flex; flex-direction: column; gap: 8px;">
                            <button onclick="gestorLogos.eliminarLogo(${logo.id})" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 0.85em; font-weight: 600; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(239, 68, 68, 0.3)'">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    configurarEventos() {
        const btnSubir = document.getElementById('btnSubirLogoNuevo');
        const inputFile = document.getElementById('inputLogoNuevo');

        if (btnSubir && inputFile) {
            btnSubir.onclick = () => inputFile.click();
            inputFile.onchange = (e) => this.subirLogo(e);
        }
    }

    async subirLogo(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            Utils.mostrarNotificacion('❌ Solo se permiten imágenes', 'error');
            return;
        }

        // Validar tamaño (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            Utils.mostrarNotificacion('❌ La imagen no debe superar 2MB', 'error');
            return;
        }

        try {
            // Pedir nombre
            const nombre = prompt('Nombre del logo (ej: Logo Oficial, Logo Aniversario):', 'Logo ' + (this.logos.length + 1));
            if (!nombre) return;

            const descripcion = prompt('Descripción (opcional):', '');

            // Convertir a base64
            const base64 = await this.leerArchivoComoBase64(file);

            // Guardar en BD
            const response = await fetch('/api/logos/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include',
                body: JSON.stringify({
                    nombre: nombre,
                    descripcion: descripcion,
                    imagen: base64,
                    usar_en_pdfs: false,
                    usar_en_asistencias: false,
                    usar_en_sidebar: false
                })
            });

            if (response.ok) {
                Utils.mostrarNotificacion('✅ Logo cargado exitosamente', 'success');
                await this.cargarLogos();
                this.renderizarLogos();
            } else {
                throw new Error('Error al guardar logo');
            }

        } catch (error) {
            console.error('[LOGOS] Error:', error);
            Utils.mostrarNotificacion('❌ Error al cargar logo', 'error');
        }

        // Limpiar input
        event.target.value = '';
    }

    async toggleContexto(id, contexto, activar) {
        try {
            const response = await fetch(`/api/logos/${id}/asignar_contexto/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include',
                body: JSON.stringify({
                    contexto: contexto,
                    activar: activar
                })
            });

            if (response.ok) {
                const data = await response.json();
                Utils.mostrarNotificacion(`✅ ${data.message}`, 'success');
                await this.cargarLogos();
                this.renderizarLogos();
                
                // Actualizar localStorage según contexto
                if (contexto === 'pdfs' || contexto === 'asistencias') {
                    await actualizarLogoPDFs();
                }
            } else {
                throw new Error('Error al asignar contexto');
            }
        } catch (error) {
            console.error('[LOGOS] Error:', error);
            Utils.mostrarNotificacion('❌ Error al asignar contexto', 'error');
        }
    }

    async eliminarLogo(id) {
        if (!confirm('¿Estás seguro de eliminar este logo?')) return;

        try {
            const response = await fetch(`/api/logos/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include'
            });

            if (response.ok) {
                Utils.mostrarNotificacion('✅ Logo eliminado exitosamente', 'success');
                await this.cargarLogos();
                this.renderizarLogos();
            } else {
                throw new Error('Error al eliminar logo');
            }
        } catch (error) {
            console.error('[LOGOS] Error:', error);
            Utils.mostrarNotificacion('❌ Error al eliminar logo', 'error');
        }
    }

    leerArchivoComoBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// Helper para CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Inicializar cuando el modal esté listo
window.gestorLogos = null;

// Esta función se llama cuando se abre el modal
window.inicializarGestorLogos = function() {
    if (!window.gestorLogos) {
        window.gestorLogos = new GestorLogos();
    } else {
        window.gestorLogos.init();
    }
};
