// 2. Función para cargar y mostrar las donaciones
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
                        <div class="dropdown-container">
                            <button class="dropdown-toggle" onclick="manejarClickCambiar(${d.id}, '${d.estado}')">CAMBIAR ▾</button>
                            <div class="dropdown-menu">
                                <span class="dropdown-item ${d.estado === 'Pendiente' ? 'selected' : ''}" onclick="cambiarEstadoMenu(${d.id}, 'Pendiente')">Pendiente</span>
                                <span class="dropdown-item ${d.estado === 'Recibido' ? 'selected' : ''}" onclick="cambiarEstadoMenu(${d.id}, 'Recibido')">Recibido</span>
                                <span class="dropdown-item ${d.estado === 'Aprobado y Destinado' ? 'selected' : ''}" onclick="cambiarEstadoMenu(${d.id}, 'Aprobado y Destinado')">Aprobado y Destinado</span>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

// 3. Función para enviar el cambio de estado al servidor
async function cambiarEstado(id, nuevoEstado) {
    try {
        const res = await fetch(`https://back-hospital-euk1.onrender.com/api/donaciones/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoEstado })
        });

        if (res.ok) {
            cerrarModal();
            cargarDonaciones(); // Recargamos la tabla al terminar
        } else {
            alert('Error al actualizar el estado.');
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
}

// --- Detección inteligente: Menú normal en PC o Ventana Flotante con Animación en Celular ---

function manejarClickCambiar(id, estadoActual) {
    if (window.innerWidth <= 768) {
        abrirModal(id, estadoActual);
    } else {
        event.stopPropagation();
        const boton = event.target;
        cerrarTodosLosMenus();
        const menu = boton.nextElementSibling;
        menu.style.display = 'block';
    }
}

function abrirModal(id, estadoActual) {
    const modalOpciones = document.getElementById('modalOpciones');
    const estados = ['Pendiente', 'Recibido', 'Aprobado y Destinado'];

    modalOpciones.innerHTML = estados.map(est => `
        <button class="modal-btn ${estadoActual === est ? 'selected' : ''}" onclick="cambiarEstado(${id}, '${est}')">
            ${est}
        </button>
    `).join('');

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

function toggleMenu(button) {
    cerrarTodosLosMenus();
    const menu = button.nextElementSibling;
    menu.style.display = 'block';
}

function cambiarEstadoMenu(id, nuevoEstado) {
    cambiarEstado(id, nuevoEstado);
    cerrarTodosLosMenus();
}

function cerrarTodosLosMenus() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });
}

// Cierra los menús si haces clic fuera (en PC)
window.onclick = function (event) {
    if (!event.target.matches('.dropdown-toggle') && !event.target.closest('.modal-content')) {
        cerrarTodosLosMenus();
    }
}

// Ejecutamos la carga inicial
cargarDonaciones();