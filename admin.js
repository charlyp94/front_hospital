// ==========================================
// 1. Control de Sesión y Carga de Usuario
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Intentamos recuperar la sesión desde sessionStorage o localStorage
    const sesionData = sessionStorage.getItem('usuarioLogueado') || localStorage.getItem('usuarioLogueado');
    
    if (sesionData) {
        try {
            const usuarioLogueado = JSON.parse(sesionData);
            const nombreMostrable = usuarioLogueado.nombre || usuarioLogueado.nombre_usuario || "Administrador";
            
            // Pintamos el nombre en el span de la barra superior si existe
            const spanNombre = document.getElementById('nombreUsuario');
            if (spanNombre) {
                spanNombre.textContent = nombreMostrable;
            }
        } catch (e) {
            console.error("Error al parsear los datos de sesión", e);
        }
    }

    // Configurar el botón de Cerrar Sesión para abrir el modal estilizado
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            const modalLogout = document.getElementById('modalCerrarSesion');
            if (modalLogout) {
                modalLogout.style.display = 'flex';
                setTimeout(() => modalLogout.classList.add('active'), 10);
            }
        });
    }

    // Acción del botón de confirmar salida dentro del modal
    const btnConfirmarLogout = document.getElementById('btnConfirmarLogout');
    if (btnConfirmarLogout) {
        btnConfirmarLogout.addEventListener('click', () => {
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Ejecutamos la carga inicial de donaciones
    cargarDonaciones();
});

// Función para cerrar el modal de logout sin salir
function cerrarModalCerrarSesion() {
    const modalLogout = document.getElementById('modalCerrarSesion');
    if (modalLogout) {
        modalLogout.classList.remove('active');
        setTimeout(() => {
            modalLogout.style.display = 'none';
        }, 300);
    }
}

// ==========================================
// 2. Función para cargar y mostrar las donaciones
// ==========================================
async function cargarDonaciones() {
    try {
        const res = await fetch(`https://back-hospital-euk1.onrender.com/api/donaciones`);
        const datos = await res.json();
        const cuerpo = document.getElementById('tabla-donaciones');

        if (!cuerpo) return;

        cuerpo.innerHTML = datos.map(d => {
            const fechaFormateada = d.fecha ? new Date(d.fecha).toLocaleDateString('es-AR') : 'N/A';
            
            // Identificamos el documento (DNI o CUIT según lo que contenga la base de datos)
            const documentoMostrar = d.dni || d.cuit || 'N/A';

            // Preparamos los datos de contacto con validación por si vienen vacíos
            const telefonoMostrar = d.telefono || 'No especificado';
            const correoMostrar = d.correo || 'No especificado';

            // Preparamos la descripción
            const descripcionMostrar = d.descripcion || 'Sin descripción';

            // Estados finales o cerrados donde ya no se puede cambiar
            const estadoActual = d.estado || 'Pendiente';
            const esFinal = estadoActual === 'Aprobado y Destinado' || estadoActual === 'Rechazado';

            const idDonacion = d.id || d._id;

            return `
                <tr>
                    <td><strong>${d.nombre || 'Anónimo'}</strong></td>
                    <td>${fechaFormateada}</td>
                    <td>${documentoMostrar}</td>
                    <td>
                        <div style="font-size: 0.85rem;">📞 ${telefonoMostrar}</div>
                        <div style="font-size: 0.85rem; color: #555;">✉️ ${correoMostrar}</div>
                    </td>
                    <td>${d.categoria || 'N/D'}</td>
                    <td style="font-weight: bold; color: #4a2c35;">${d.cantidad || 0}</td>
                    <td>
                        <div style="max-width: 180px; font-size: 0.85rem; color: #444; word-wrap: break-word;" title="${descripcionMostrar}">
                            ${descripcionMostrar}
                        </div>
                    </td>
                    <td><span style="font-weight: bold;">${estadoActual}</span></td>
                    <td>
                        ${
                            esFinal 
                            ? `<span style="font-size: 0.85rem; color: #666; font-style: italic;">🔒 Cerrado</span>`
                            : `<button class="dropdown-toggle" onclick="manejarClickCambiar('${idDonacion}', '${estadoActual}')">CAMBIAR ▾</button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

// ==========================================
// 3. Función para enviar el cambio de estado al servidor
// ==========================================
async function cambiarEstado(id, nuevoEstado, motivoRechazo = null) {
    try {
        const sesionData = sessionStorage.getItem('usuarioLogueado') || localStorage.getItem('usuarioLogueado');
        let usuarioResponsable = 'Administrador';

        if (sesionData) {
            try {
                const parsed = JSON.parse(sesionData);
                usuarioResponsable = parsed.nombre || parsed.nombre_usuario || 'Administrador';
            } catch (e) {
                usuarioResponsable = sesionData;
            }
        }

        const bodyData = { 
            nuevoEstado: nuevoEstado,
            actualizado_por: usuarioResponsable 
        };

        if (nuevoEstado === 'Rechazado' && motivoRechazo) {
            bodyData.motivoRechazo = motivoRechazo;
        }

        const res = await fetch(`https://back-hospital-euk1.onrender.com/api/donaciones/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const resultado = await res.json();

        if (res.ok) {
            cerrarModal();
            cargarDonaciones(); 
        } else {
            alert(resultado.error || 'Error al actualizar el estado.');
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        alert('Error al conectar con el servidor.');
    }
}

// --- Apertura de la Ventana Flotante Animada ---

function manejarClickCambiar(id, estadoActual) {
    abrirModal(id, estadoActual);
}

function abrirModal(id, estadoActual) {
    const modalOpciones = document.getElementById('modalOpciones');
    const estados = ['Pendiente', 'Recibido', 'Aprobado y Destinado', 'Rechazado'];
    const actualNorm = estadoActual.trim().toLowerCase();

    modalOpciones.innerHTML = estados.map(est => {
        const estNorm = est.toLowerCase();
        let isDisabled = false;
        let motivoBloqueo = '';

        if (actualNorm === 'pendiente') {
            if (estNorm !== 'recibido') {
                isDisabled = true;
                motivoBloqueo = estNorm === 'pendiente' ? 'Estado actual' : 'Debe marcarse como recibido primero';
            }
        } else if (actualNorm === 'recibido') {
            if (estNorm === 'pendiente' || estNorm === 'recibido') {
                isDisabled = true;
                motivoBloqueo = estNorm === 'pendiente' ? 'No se permite retroceder a pendiente' : 'Ya está recibido';
            }
        } else {
            isDisabled = true;
            motivoBloqueo = 'Estado final alcanzado';
        }

        const esSeleccionado = (actualNorm === estNorm);

        let clickAccion = `cambiarEstado('${id}', '${est}')`;
        if (est === 'Rechazado' && !isDisabled) {
            clickAccion = `mostrarCajonRechazo('${id}')`;
        }

        return `
            <button class="modal-btn ${esSeleccionado ? 'selected' : ''}" 
                ${isDisabled ? 'disabled style="background-color: #e9ecef; color: #6c757d; cursor: not-allowed; opacity: 0.7;"' : `onclick="${clickAccion}"`}
                title="${motivoBloqueo}">
                ${est} ${isDisabled ? ' 🔒' : ''}
            </button>
        `;
    }).join('');

    const modal = document.getElementById('modalEstado');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
}

// Muestra de manera elegante y centrada el cajoncito de texto dentro del mismo modal
function mostrarCajonRechazo(id) {
    const modalOpciones = document.getElementById('modalOpciones');
    
    modalOpciones.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; align-items: stretch; text-align: left;">
            <label for="motivoTextarea" style="font-weight: bold; font-size: 0.95rem; color: #333;">
                Motivo del rechazo <span style="color: #dc3545;">*</span>:
            </label>
            <textarea id="motivoTextarea" placeholder="Escriba aquí el motivo detallado..." 
                style="width: 100%; height: 90px; padding: 10px; border: 1px solid #ced4da; border-radius: 6px; font-family: inherit; font-size: 0.95rem; resize: none; box-sizing: border-box; outline: none;" 
                onfocus="this.style.borderColor='#dc3545'" onblur="this.style.borderColor='#ced4da'"></textarea>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 5px;">
                <button type="button" onclick="abrirModal('${id}', 'Recibido')" 
                    style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500;">
                    Cancelar
                </button>
                <button type="button" onclick="confirmarRechazoConMotivo('${id}')" 
                    style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: bold;">
                    Confirmar Rechazo
                </button>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const txt = document.getElementById('motivoTextarea');
        if (txt) txt.focus();
    }, 50);
}

// Procesa el texto escrito en el cajoncito
function confirmarRechazoConMotivo(id) {
    const textarea = document.getElementById('motivoTextarea');
    const motivo = textarea ? textarea.value.trim() : '';

    if (!motivo) {
        alert('Es obligatorio especificar un motivo para rechazar la donación.');
        if (textarea) textarea.focus();
        return;
    }

    cambiarEstado(id, 'Rechazado', motivo);
}

function cerrarModal() {
    const modal = document.getElementById('modalEstado');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}