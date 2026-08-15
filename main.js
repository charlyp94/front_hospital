// ==========================================================================
// CONTROL DE INTERACCIÓN Y REGISTRO DE DONACIONES - HOSPITAL LUIS A. GÜEMES
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CAPTURA DE ELEMENTOS DEL DOM ---
    const modal = document.getElementById('modalDonacion');
    const btnAbrirModal = document.getElementById('btnAbrirModal');
    const btnCerrarModal = document.getElementById('btnCerrarModal');

    const radioPersona = document.getElementById('radioPersona');
    const radioEmpresa = document.getElementById('radioEmpresa');

    const camposPersona = document.getElementById('camposPersona');
    const camposEmpresa = document.getElementById('camposEmpresa');
    const formDonacion = document.getElementById('formDonacion');

    const checkAnonimo = document.getElementById('checkAnonimo');

    // --- 2. LÓGICA DE APERTURA Y CIERRE DEL MODAL ---
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            modal.classList.add('mostrar');
            document.body.style.overflow = 'hidden';
        });
    }

    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
    }

    function cerrarModal() {
        modal.classList.remove('mostrar');
        document.body.style.overflow = 'auto';
    }

    // --- 3. COMPORTAMIENTO DINÁMICO DEL FORMULARIO ---
    if (radioPersona && radioEmpresa) {
        radioPersona.addEventListener('change', alternarCamposFormulario);
        radioEmpresa.addEventListener('change', alternarCamposFormulario);
    }

    function alternarCamposFormulario() {
        if (radioPersona.checked) {
            camposPersona.style.display = 'block';
            camposEmpresa.style.display = 'none';
            if (document.getElementById('nombreEmpresa')) {
                document.getElementById('nombreEmpresa').value = '';
                document.getElementById('nombreEmpresa').removeAttribute('required');
            }
            if (document.getElementById('nombreCompleto')) document.getElementById('nombreCompleto').setAttribute('required', 'true');
            if (document.getElementById('dni')) document.getElementById('dni').setAttribute('required', 'true');
            if (document.getElementById('genero')) document.getElementById('genero').setAttribute('required', 'true');
        } else if (radioEmpresa.checked) {
            camposEmpresa.style.display = 'block';
            camposPersona.style.display = 'none';
            if (document.getElementById('nombreCompleto')) {
                document.getElementById('nombreCompleto').value = '';
                document.getElementById('nombreCompleto').removeAttribute('required');
            }
            if (document.getElementById('dni')) {
                document.getElementById('dni').value = '';
                document.getElementById('dni').removeAttribute('required');
            }
            if (document.getElementById('fechaNacimiento')) document.getElementById('fechaNacimiento').value = '';
            if (document.getElementById('genero')) {
                document.getElementById('genero').selectedIndex = 0;
                document.getElementById('genero').removeAttribute('required');
            }
            if (document.getElementById('nombreEmpresa')) document.getElementById('nombreEmpresa').setAttribute('required', 'true');
        }
    }

    if (radioPersona && radioPersona.checked) {
        if (document.getElementById('genero')) document.getElementById('genero').setAttribute('required', 'true');
    }

    // --- 4. ENVÍO DE DATOS Y GENERACIÓN DEL COMPROBANTE PDF ---
    if (formDonacion) {
        formDonacion.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correoInput = document.getElementById('correo').value;
            try {
                const checkRes = await fetch(`${CONFIG.API_BASE_URL}/donaciones/verificar?correo=${correoInput}`);
                const status = await checkRes.json();

                if (status.tienePendiente) {
                    modal.classList.remove('mostrar');
                    document.body.style.overflow = 'auto';

                    setTimeout(() => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Donación no permitida',
                            text: 'Ya posee una donación registrada que aún no ha sido aprobada.',
                            confirmButtonColor: '#4a2c35',
                            allowOutsideClick: false,
                            target: 'body',
                            didOpen: () => {
                                const container = document.querySelector('.swal2-container');
                                if (container) container.style.zIndex = '9999999';
                            }
                        });
                    }, 100);

                    return;
                }
            } catch (err) {
                console.error("Error al validar:", err);
            }

            const tipoDonante = radioPersona.checked ? 'persona' : 'empresa';
            const correo = document.getElementById('correo').value;
            const telefono = document.getElementById('telefono').value;
            const cantidad = document.getElementById('cantidad')?.value || 0;
            const generoSelect = document.getElementById('genero')?.value || null;
            const ocultarNombreWeb = checkAnonimo ? checkAnonimo.checked : false;

            const checkboxes = document.querySelectorAll('input[name="categorias"]:checked');
            const categoriasSeleccionadas = Array.from(checkboxes).map(cb => {
                return cb.parentNode.querySelector('span')?.innerText || cb.value;
            });

            const categoriaFinal = categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas.join(', ') : 'General';

            const datosDonacion = {
                tipoDonante: tipoDonante,
                nombreCompleto: document.getElementById('nombreCompleto')?.value || '',
                nombreEmpresa: document.getElementById('nombreEmpresa')?.value || '',
                dni: document.getElementById('dni')?.value || null,
                fechaNacimiento: document.getElementById('fechaNacimiento')?.value || null,
                correo: correo,
                telefono: telefono,
                genero: generoSelect,
                categoria: categoriaFinal,
                ocultarNombre: ocultarNombreWeb,
                cantidad: cantidad
            };

            try {
                const respuesta = await fetch(`https://back-hospital-euk1.onrender.com/api/donaciones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosDonacion)
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Donación Registrada!',
                        text: 'Se ha registrado con éxito su intención de donación, muchas gracias por colaborar con el hospital Luis A. Güemes.',
                        showConfirmButton: false,
                        timer: 2500,
                        iconColor: '#28a745'
                    });

                    // 🚀 BLOQUE DE GENERACIÓN DEL PDF
                    try {
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF();

                        const cargarImagenComoBase64 = (url) => {
                            return new Promise((resolve, reject) => {
                                const img = new Image();
                                img.crossOrigin = 'Anonymous';
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    resolve(canvas.toDataURL('image/jpeg'));
                                };
                                img.onerror = (error) => reject(error);
                                img.src = url;
                            });
                        };

                        cargarImagenComoBase64('./img/logo.jpg')
                            .then((logoBase64) => {
                                window.logoBase64 = logoBase64;
                                doc.saveGraphicsState();
                                doc.setGState(new doc.GState({ opacity: 0.25 }));
                                doc.addImage(logoBase64, 'JPEG', 45, 80, 120, 105);
                                doc.restoreGraphicsState();
                                armarContenidoPDF(doc, datosDonacion, tipoDonante);
                            })
                            .catch((err) => {
                                console.error("No se pudo estampar el logo, imprimiendo sin fondo:", err);
                                armarContenidoPDF(doc, datosDonacion, tipoDonante);
                            });

                        function armarContenidoPDF(documento, datos, tipo) {
                            documento.setFont("helvetica", "bold");
                            documento.setFontSize(22);
                            documento.setTextColor(74, 44, 53);
                            documento.text("HOSPITAL LUIS A. GÜEMES", 105, 25, { align: "center" });

                            documento.setFontSize(14);
                            documento.setTextColor(100, 100, 100);
                            documento.text("Comprobante de Intención de Donación", 105, 35, { align: "center" });

                            documento.setDrawColor(74, 44, 53);
                            documento.setLineWidth(0.5);
                            documento.line(20, 42, 190, 42);

                            documento.setFont("helvetica", "normal");
                            documento.setFontSize(12);
                            documento.setTextColor(50, 50, 50);

                            let nombreMostrar = tipo === 'persona' ? datos.nombreCompleto : datos.nombreEmpresa;
                            let documentoTexto = tipo === 'persona' ? `DNI: ${datos.dni || 'No especificado'}` : 'Tipo: Empresa / Institución';

                            documento.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, 20, 55);
                            documento.text(`Donante: ${nombreMostrar}`, 20, 65);
                            documento.text(documentoTexto, 20, 75);
                            documento.text(`Correo Electrónico: ${datos.correo}`, 20, 85);
                            documento.text(`Teléfono de Contacto: ${datos.telefono}`, 20, 95);

                            documento.saveGraphicsState();
                            documento.setGState(new documento.GState({ opacity: 0.3 }));
                            documento.setFillColor(244, 244, 244);
                            documento.rect(20, 105, 170, 40, "F");
                            documento.restoreGraphicsState();

                            documento.setFont("helvetica", "bold");
                            documento.text("Detalle de los Insumos / Categorías Comprometidas:", 25, 115);
                            documento.setFont("helvetica", "normal");
                            documento.text(`- Categoría: ${datos.categoria}`, 25, 125);
                            documento.text(`- Cantidad: ${datos.cantidad} unidades`, 25, 135);

                            documento.setFont("helvetica", "bold");
                            documento.setFontSize(14);
                            documento.setTextColor(74, 44, 53);
                            documento.text("Pasos a seguir para concretar la donación:", 20, 160);

                            documento.setFontSize(11);
                            documento.setTextColor(60, 60, 60);
                            const pasos = [
                                "1. Acercarse al Hospital con DNI físico y los elementos seleccionados.",
                                "2. Avisar en recepción que viene por una donación asentada en la web.",
                                "3. El personal encargado cotejará los insumos y los guardará en el depósito."
                            ];
                            let yPos = 170;
                            pasos.forEach(paso => {
                                let lineas = documento.splitTextToSize(paso, 170);
                                documento.text(lineas, 20, yPos);
                                yPos += (lineas.length * 7);
                            });

                            yPos += 20;
                            documento.setDrawColor(200, 200, 200);
                            documento.line(20, yPos, 190, yPos);
                            yPos += 10;
                            documento.setFontSize(9);
                            documento.setTextColor(100, 100, 100);
                            documento.text("Este documento es un comprobante automático de registro.", 105, yPos, { align: "center" });
                            yPos += 6;
                            documento.setFont("helvetica", "bold");
                            documento.text("¡Muchas gracias por su compromiso con el Hospital Luis A. Güemes!", 105, yPos, { align: "center" });

                            if (window.logoBase64) {
                                documento.saveGraphicsState();
                                documento.setGState(new documento.GState({ opacity: 0.12 }));
                                documento.addImage(window.logoBase64, 'JPEG', 45, 80, 120, 105);
                                documento.restoreGraphicsState();
                            }

                            documento.save(`Comprobante_Donacion_${nombreMostrar.replace(/ /g, "_")}.pdf`);
                        }
                    } catch (pdfError) {
                        console.error("Error al procesar el PDF:", pdfError);
                    }

                    formDonacion.reset();
                    alternarCamposFormulario();
                    cerrarModal();

                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'No se puede procesar',
                        text: resultado.error,
                        confirmButtonColor: '#4a2c35'
                    });
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                Swal.fire({
                    icon: 'warning',
                    title: 'Sin Conexión',
                    text: 'No se pudo conectar con el servidor.',
                    confirmButtonColor: '#4a2c35'
                });
            }
        });
    }
});

// ==========================================================================
// 🔐 ACCESO AL PANEL DE GESTIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const btnPersonal = document.getElementById('btnAccesoPersonal');
    if (btnPersonal) {
        btnPersonal.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Swal.fire({
                title: 'Acceso Administrativo',
                text: 'Ingrese la contraseña de acceso del personal:',
                input: 'password',
                showCancelButton: true,
                confirmButtonText: 'Ingresar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#4a2c35',
                cancelButtonColor: '#6c757d',
                inputPlaceholder: 'Contraseña corporativa',
                inputValidator: (value) => { if (!value) return '¡Por favor, ingrese la clave de seguridad!'; }
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`https://back-hospital-euk1.onrender.com/api/verificar-acceso`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clave: result.value })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.accesoConcedido) {
                                Swal.fire({
                                    icon: 'success',
                                    title: '¡Acceso Concedido!',
                                    text: 'Redirigiendo al Panel de Gestión...',
                                    showConfirmButton: false,
                                    timer: 2000
                                }).then(() => { window.location.href = "admin.html"; });
                            } else {
                                Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Contraseña incorrecta.' });
                            }
                        })
                        .catch(err => {
                            console.error("Error al conectar con el servidor:", err);
                            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo contactar al servidor.' });
                        });
                }
            });
        });
    }
});

// ==========================================================================
// HISTORIAL PÚBLICO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const btnVerHistorial = document.getElementById('btnVerHistorial');
    const modalHistorial = document.getElementById('modalHistorial');
    const btnCerrarHistorial = document.getElementById('btnCerrarHistorial');
    const tablaHistorialCuerpo = document.getElementById('tablaHistorialCuerpo');

    if (btnVerHistorial) {
        btnVerHistorial.style.transition = 'filter 0.3s ease, background-color 0.3s ease';
        btnVerHistorial.style.cursor = 'pointer';
        btnVerHistorial.addEventListener('mouseover', () => { btnVerHistorial.style.filter = 'brightness(85%)'; });
        btnVerHistorial.addEventListener('mouseout', () => { btnVerHistorial.style.filter = 'brightness(100%)'; });
        btnVerHistorial.addEventListener('click', () => {
            modalHistorial.style.display = 'flex';
            cargarHistorialPublico();
        });
    }

    if (btnCerrarHistorial && modalHistorial) {
        btnCerrarHistorial.addEventListener('click', () => { modalHistorial.style.display = 'none'; });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalHistorial) modalHistorial.style.display = 'none';
    });

    async function cargarHistorialPublico() {
        try {
            if (!tablaHistorialCuerpo) return;
            tablaHistorialCuerpo.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Cargando historial...</td></tr>';
            const respuesta = await fetch(`https://back-hospital-euk1.onrender.com/api/donaciones/aprobadas`);
            const donaciones = await respuesta.json();
            tablaHistorialCuerpo.innerHTML = '';
            if (donaciones.length === 0) {
                tablaHistorialCuerpo.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Aún no hay donaciones aprobadas.</td></tr>';
                return;
            }
            donaciones.forEach(donacion => {
                const fila = document.createElement('tr');
                fila.style.borderBottom = '1px solid #eee';
                let fechaFormateada = donacion.fecha ? new Date(donacion.fecha).toLocaleDateString('es-AR') : "Sin fecha";
                fila.innerHTML = `
                    <td style="padding: 12px 15px; font-weight: bold; color: #333;">${donacion.nombre}</td>
                    <td style="padding: 12px 15px; color: #555;">${donacion.categoria}</td>
                    <td style="padding: 12px 15px; color: #555;">${donacion.cantidad || 0}</td>
                    <td style="padding: 12px 15px; color: #777;">${fechaFormateada}</td>
                `;
                tablaHistorialCuerpo.appendChild(fila);
            });
        } catch (error) {
            console.error('Error al cargar el historial:', error);
            if (tablaHistorialCuerpo) {
                tablaHistorialCuerpo.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:red;">No se pudo conectar al servidor.</td></tr>';
            }
        }
    }
});