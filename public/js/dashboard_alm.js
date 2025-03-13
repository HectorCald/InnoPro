/* ==================== INICIALIZACIÓN DE LA APLICACIÓN ==================== */
document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    manejarCierreSesion();
    inicializarBotones();
});

/* ==================== FUNCIONES DE AUTENTICACIÓN Y SESIÓN ==================== */
async function bienvenida() {
    try {
        const response = await fetch('/obtener-nombre');
        const data = await response.json();

        if (data.nombre) {
            const bienvenida = document.querySelector('.bienvenida');
            if (bienvenida) {
                bienvenida.innerHTML = '<i class="fas fa-warehouse"></i> Admin';
            }
        }
    } catch (error) {
        console.error('Error al obtener el nombre:', error);
    }
}

// ... resto del código específico de dashboard_alm ...

function manejarCierreSesion() {
    const btnLogout = document.querySelector('.logout-btn');
    btnLogout.addEventListener('click', async () => {
        try {
            const response = await fetch('/cerrar-sesion', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    });
}

/* ==================== INICIALIZACIÓN DE BOTONES ==================== */
function inicializarBotones() {
    const btnVerificar = document.querySelector('.verificarRegistros');
    const btnConsultar = document.querySelector('.consultarRegistros');

    if (btnVerificar) {
        btnVerificar.addEventListener('click', async () => {
            mostrar('.registros-view');
            await cargarRegistros();
        });
    }

    if (btnConsultar) {
        btnConsultar.addEventListener('click', () => {
            // Implementar funcionalidad de consulta
        });
    }
}

/* ==================== SISTEMA DE NOTIFICACIONES ==================== */
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 5000) {
    const notificador = document.querySelector('.notificador');
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;

    let icono;
    switch (tipo) {
        case 'success':
            icono = 'fa-check-circle';
            break;
        case 'warning':
            icono = 'fa-exclamation-triangle';
            break;
        case 'error':
            icono = 'fa-times-circle';
            break;
    }

    notificacion.innerHTML = `
        <i class="fas ${icono}"></i>
        <span class="mensaje">${mensaje}</span>
        <button class="cerrar"><i class="fas fa-times"></i></button>
    `;

    notificador.appendChild(notificacion);

    const cerrarBtn = notificacion.querySelector('.cerrar');
    cerrarBtn.addEventListener('click', () => {
        notificacion.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => notificacion.remove(), 300);
    });

    setTimeout(() => {
        if (notificacion.parentElement) {
            notificacion.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, duracion);
}
/* ==================== GESTIÓN DE REGISTROS ==================== */
async function cargarRegistros() {
    try {
        const response = await fetch('/obtener-todos-registros');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.registros-container');
            container.innerHTML = '';

            // Agrupar registros por fecha, saltando la primera fila (encabezados)
            const registrosPorFecha = {};
            data.registros.slice(1).forEach(registro => {
                if (!registro[0]) return; // Saltar filas vacías
                if (!registrosPorFecha[registro[0]]) {
                    registrosPorFecha[registro[0]] = [];
                }
                registrosPorFecha[registro[0]].push(registro);
            });

            // Ordenar fechas de más reciente a más antigua
            const fechasOrdenadas = Object.keys(registrosPorFecha).sort((a, b) => {
                // Convertir fechas del formato DD/MM/YYYY a objetos Date
                const [diaA, mesA, yearA] = a.split('/');
                const [diaB, mesB, yearB] = b.split('/');
                
                // Crear fechas en formato YYYY-MM-DD para comparación correcta
                const fechaA = new Date(`${yearA}-${mesA}-${diaA}`);
                const fechaB = new Date(`${yearB}-${mesB}-${diaB}`);
                
                // Ordenar de más reciente a más antigua
                return fechaB - fechaA;
            });
            // Crear tarjetas para cada fecha
            fechasOrdenadas.forEach(fecha => {
                const registros = registrosPorFecha[fecha];
                const fechaCard = document.createElement('div');
                fechaCard.className = 'fecha-card';

                const fechaHeader = document.createElement('div');
                fechaHeader.className = 'fecha-header';
                fechaHeader.innerHTML = `
                    <div class="fecha-info">
                        <h3>${formatearFecha(fecha)}</h3>
                        <span class="contador">${registros.length} registros</span>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                `;
                fechaCard.appendChild(fechaHeader);

                // Contenedor para los registros de esta fecha
                const registrosContainer = document.createElement('div');
                registrosContainer.className = 'registros-grupo';

                // Añadir evento click al header de fecha
                fechaHeader.addEventListener('click', () => {
                    registrosContainer.classList.toggle('active');
                    const icono = fechaHeader.querySelector('.fa-chevron-down');
                    icono.style.transform = registrosContainer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
                });

                registros.forEach(registro => {
                    const registroCard = document.createElement('div');
                    registroCard.className = 'registro-card';

                    registroCard.innerHTML = `
                        <div class="registro-header">
                            <div class="registro-info">
                                ${registro[10] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
                                <span class="registro-producto">${registro[1]}</span>
                            </div>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="registro-detalles">
                            <p><span>Lote:</span> ${registro[2] || '-'}</p>
                            <p><span>Gramaje:</span> ${registro[3] || '-'}</p>
                            <p><span>Selección:</span> ${registro[4] || '-'}</p>
                            <p><span>Microondas:</span> ${registro[5] || '-'}</p>
                            <p><span>Envases:</span> ${registro[6] || '-'}</p>
                            <p><span>Vencimiento:</span> ${registro[7] || '-'}</p>
                            <p><span>Operario:</span> ${registro[8] || '-'}</p>
                            <p><span>Estado:</span> <span class="estado ${(registro[9] || 'pendiente').toLowerCase()}">${registro[9] || 'Pendiente'}</span></p>
                            ${registro[10] ? `
                            <p><span>Fecha Verificación:</span> ${registro[10]}</p>
                            <p><span>Cantidad Real:</span> ${registro[9] || '-'}</p>
                            <p><span>Observaciones:</span> ${registro[11] || '-'}</p>
                            ` : ''}
                            <div class="acciones">
                                <button onclick="verificarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}')" class="btn-editar">
                                    <i class="fas fa-${registro[10] ? 'edit' : 'check-circle'}"></i> ${registro[10] ? 'Editar' : 'Verificar'}
                                </button>
                                <button onclick="eliminarRegistro('${registro[0]}', '${registro[1]}')" class="btn-eliminar">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    `;

                    registroCard.querySelector('.registro-header').addEventListener('click', () => {
                        const detalles = registroCard.querySelector('.registro-detalles');
                        const icono = registroCard.querySelector('.fa-chevron-down');

                        if (detalles.classList.contains('active')) {
                            detalles.classList.remove('active');
                            icono.style.transform = 'rotate(0)';
                        } else {
                            detalles.classList.add('active');
                            icono.style.transform = 'rotate(180deg)';
                        }
                    });

                    registrosContainer.appendChild(registroCard);
                });

                fechaCard.appendChild(registrosContainer);
                container.appendChild(fechaCard);
            });
        }
    } catch (error) {
        console.error('Error al cargar registros:', error);
        mostrarNotificacion('Error al cargar los registros', 'error');
    }
}
function verificarRegistro(fecha, producto, lote, operario) {
    const modal = document.querySelector('.modal-verificacion');
    const form = document.getElementById('form-verificacion');
    const btnCancelar = modal.querySelector('.btn-cancelar');

    // Establecer la fecha actual por defecto
    const fechaHoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha-verificacion').value = fechaHoy;

    // Mostrar el modal
    modal.style.display = 'flex';

    // Manejar el cierre del modal
    btnCancelar.onclick = () => {
        modal.style.display = 'none';
        form.reset();
    };

    // Manejar el envío del formulario
    form.onsubmit = async (e) => {
        e.preventDefault();

        const cantidadReal = document.getElementById('cantidad-real').value;
        const fechaVerificacion = document.getElementById('fecha-verificacion').value;
        const observaciones = document.getElementById('observaciones').value;

        try {
            const response = await fetch('/actualizar-verificacion', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fecha,
                    producto,
                    lote,
                    operario,
                    verificacion: cantidadReal,
                    fechaVerificacion,
                    observaciones
                })
            });

            const data = await response.json();

            if (data.success) {
                mostrarNotificacion('Verificación guardada correctamente');
                modal.style.display = 'none';
                form.reset();
                cargarRegistros(); // Recargar los registros
            } else {
                mostrarNotificacion(data.error || 'Error al guardar la verificación', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al guardar la verificación', 'error');
        }
    };
}
// Función auxiliar para formatear la fecha
// Añadir o modificar la función formatearFecha
function formatearFecha(fechaStr) {
    // Asegurarnos de que la fecha se procese en la zona horaria local
    const [dia, mes, año] = fechaStr.split('/');
    const fecha = new Date(año, mes - 1, dia);
    
    // Formatear la fecha
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).replace(/^\w/, (c) => c.toUpperCase());
}

// En la función cargarRegistros, asegurarnos de que las fechas se ordenen correctamente
fechasOrdenadas = Object.keys(registrosPorFecha).sort((a, b) => {
    const [diaA, mesA, añoA] = a.split('/');
    const [diaB, mesB, añoB] = b.split('/');
    const fechaA = new Date(añoA, mesA - 1, diaA);
    const fechaB = new Date(añoB, mesB - 1, diaB);
    return fechaB - fechaA;
});
async function eliminarRegistro(fecha, producto) {
    const anuncio = document.querySelector('.anuncio');
    const confirmarBtn = anuncio.querySelector('.confirmar');
    const cancelarBtn = anuncio.querySelector('.cancelar');

    return new Promise((resolve) => {
        const cerrarAnuncio = () => {
            anuncio.style.display = 'none';
            confirmarBtn.removeEventListener('click', handleConfirmar);
            cancelarBtn.removeEventListener('click', handleCancelar);
        };

        const handleConfirmar = async () => {
            cerrarAnuncio();
            try {
                const response = await fetch('/eliminar-registro', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fecha, producto })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error en la respuesta del servidor');
                }

                const result = await response.json();
                
                if (result.success) {
                    mostrarNotificacion('Registro eliminado correctamente', 'success');
                    await cargarRegistros(); // Recargar los registros
                } else {
                    throw new Error(result.error || 'No se pudo eliminar el registro');
                }
            } catch (error) {
                console.error('Error detallado:', error);
                mostrarNotificacion(`Error al eliminar el registro: ${error.message}`, 'error');
            }
        };

        const handleCancelar = () => {
            cerrarAnuncio();
            mostrarNotificacion('Operación cancelada', 'warning');
        };

        confirmarBtn.addEventListener('click', handleConfirmar);
        cancelarBtn.addEventListener('click', handleCancelar);
        
        anuncio.style.display = 'flex';
    });
}

/* ==================== FUNCIONES DE UTILIDAD ==================== */
function mostrar(selector) {
    const elemento = document.querySelector(selector);
    if (elemento) {
        elemento.style.display = elemento.style.display === 'flex' ? 'none' : 'flex';
        const container = document.querySelector('.container');
        container.classList.toggle('no-touch');
    }
}

// Actualizar inicializarBotones para incluir la carga de registros
function inicializarBotones() {
    const btnVerificar = document.querySelector('.verificarRegistros');
    const btnConsultar = document.querySelector('.consultarRegistros');

    if (btnVerificar) {
        btnVerificar.addEventListener('click', () => {
            mostrar('.registros-view');
            cargarRegistros();
        });
    }

    // Cerrar modal de edición
    const cerrarModal = document.querySelector('.cerrar-modal');
    if (cerrarModal) {
        cerrarModal.addEventListener('click', () => {
            document.querySelector('.modal-edicion').style.display = 'none';
        });
    }
}