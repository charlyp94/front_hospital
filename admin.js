// ==========================================
// 2. Función para cargar y mostrar las donaciones
// ==========================================
async function cargarDonaciones() {
    try {
        const res = await fetch(`https://back-hospital-euk1.onrender.com/api/donaciones`);
        const datos = await res.json();
        const cuerpo = document.getElementById('tabla-donaciones');

        cuerpo.innerHTML = datos.map(d => {
            const fechaFormateada = d.fecha ? new Date(d.fecha).toLocaleDateString('es-AR') : 'N/A';

            return `
                <tr>
                    <td>${d.nombre}</td>
                    <td>${fechaFormateada}</td>
                    <td>${d.dni || 'N/A'}</td>
                    <td>${d.categoria}</td>
                    <td style="font-weight: bold; color: #4a2c35;">${d.cantidad || 0}</td>
                    <td>${d.estado}</td>
                    <td>
                        <button class="dropdown-toggle" onclick="manejarClickCambiar(${d.id}, '${d.estado}')">CAMBIAR ▾</button>
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
async function cambiarEstado(id, nuevoEstado) {
    try {
        const res = await fetch(`https://back-hospital-euk1.onrender.com/api/donaciones/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoEstado })
        });

        const resultado = await res.json();

        if (res.ok) {
            cerrarModal();
            cargarDonaciones(); // Recargamos la tabla al terminar
        } else {
            alert(resultado.error || 'Error al actualizar el estado.');
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
}

// --- Apertura de la Ventana Flotante Animada (Universal para PC y Celular) ---

function manejarClickCambiar(id, estadoActual) {
    abrirModal(id, estadoActual);
}

function abrirModal(id, estadoActual) {
    const modalOpciones = document.getElementById('modalOpciones');
    const estados = ['Pendiente', 'Recibido', 'Aprobado y Destinado'];

    // Normalizamos el texto por seguridad
    const actualNorm = estadoActual.trim().toLowerCase();

    modalOpciones.innerHTML = estados.map(est => {
        const estNorm = est.toLowerCase();
        let isDisabled = false;
        let motivoBloqueo = '';

        // REGLAS DE BLOQUEO ESTRICTAS (Paso a paso y sin retroceder):
        if (actualNorm === 'pendiente') {
            // Desde pendiente, SOLO se puede pasar a recibido. No se puede saltar a aprobado ni quedarse en pendiente por cambiar.
            if (estNorm === 'pendiente' || estNorm === 'aprobado y destinado') {
                isDisabled = true;
                motivoBloqueo = estNorm === 'aprobado y destinado' ? 'Debe marcarse como recibido primero' : 'Estado actual';
            }
        } else if (actualNorm === 'recibido') {
            // Desde recibido, SOLO se puede pasar a aprobado. No se puede volver a pendiente ni re-cliquear recibido.
            if (estNorm === 'pendiente' || estNorm === 'recibido') {
                isDisabled = true;
                motivoBloqueo = estNorm === 'pendiente' ? 'No se permite retroceder a pendiente' : 'Ya está recibido';
            }
        } else if (actualNorm === 'aprobado y destinado' || actualNorm === 'aprobado y destinado') {
            // Si ya está aprobado, todo está bloqueado
            isDisabled = true;
            motivoBloqueo = 'Estado final alcanzado';
        }

        const esSeleccionado = (actualNorm === estNorm);

        return `
            <button class="modal-btn ${esSeleccionado ? 'selected' : ''}" 
                ${isDisabled ? 'disabled style="background-color: #e9ecef; color: #6c757d; cursor: not-allowed; opacity: 0.7;"' : `onclick="cambiarEstado(${id}, '${est}')"`}
                title="${motivoBloqueo}">
                ${est} ${isDisabled ? ' 🔒' : ''}
            </button>
        `;
    }).join('');

    const modal = document.getElementById('modalEstado');
    modal.style.display = 'flex';
    
    // Activa la clase para disparar la animación suave de entrada
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function cerrarModal() {
    const modal = document.getElementById('modalEstado');
    modal.classList.remove('active'); // Inicia la animación de salida
    
    // Espera a que termine la animación antes de ocultarlo por completo
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Ejecutamos la carga inicial
cargarDonaciones();