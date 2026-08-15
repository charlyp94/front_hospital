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
                            <button class="dropdown-toggle" onclick="toggleMenu(this)">CAMBIAR ▾</button>
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
            cargarDonaciones(); // Recargamos la tabla al terminar
        } else {
            alert('Error al actualizar el estado.');
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
}

// --- Lógica del Menú Desplegable ---

function toggleMenu(button) {
    // Cerramos todos los menús abiertos antes de abrir este
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

// Cierra los menús si haces clic fuera
window.onclick = function (event) {
    if (!event.target.matches('.dropdown-toggle')) {
        cerrarTodosLosMenus();
    }
}

// Ejecutamos la carga inicial
cargarDonaciones();