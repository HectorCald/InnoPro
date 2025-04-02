export async function cargarNotificaciones() {
    try {
        // Primero obtener el usuario actual y su rol
        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const nombreUsuarioActual = userData.nombre;
        const rolUsuarioActual = userData.rol;

        // Luego obtener las notificaciones
        const response = await fetch('/obtener-notificaciones');
        const data = await response.json();

        if (data.success) {
            // Filtrar notificaciones para el usuario actual o su rol
            const notificacionesFiltradas = data.notificaciones.filter(notif =>
                notif.destino === nombreUsuarioActual ||
                notif.destino === rolUsuarioActual
            );

            // Actualizar el contador de notificaciones
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                if (notificacionesFiltradas && notificacionesFiltradas.length > 0) {
                    badge.textContent = notificacionesFiltradas.length;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }

            // Mostrar el div de advertencias antes de llamar a mostrarAdvertencias
            const advertenciaDiv = document.querySelector('.advertencia');
            if (advertenciaDiv) {
                advertenciaDiv.style.display = 'flex';
                document.querySelector('.container').classList.add('no-touch');
            }

            if (!notificacionesFiltradas || notificacionesFiltradas.length === 0) {
                mostrarNotificacion('No tienes notificaciones nuevas', 'info');
                if (advertenciaDiv) {
                    advertenciaDiv.style.display = 'none';
                    document.querySelector('.container').classList.remove('no-touch');
                }
                return;
            }

            mostrarAdvertencias(notificacionesFiltradas);
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarNotificacion('Error al cargar notificaciones', 'error');
    }
}
function mostrarAdvertencias(notificaciones) {
    const advertenciaDiv = document.querySelector('.advertencia');
    if (!notificaciones || notificaciones.length === 0) {
        advertenciaDiv.style.display = 'none';
        const badge = document.getElementById('notificationBadge');
        if (badge) badge.style.display = 'none';
        return;
    }

    // Filtrar y procesar notificaciones del desarrollador
    notificaciones.forEach(notif => {
        if (notif.origen === 'Desarrollador') {
            const fechaNotif = new Date(notif.fecha);
            const dosDiasDespues = new Date(fechaNotif);
            dosDiasDespues.setDate(dosDiasDespues.getDate() + 2);

            if (new Date() > dosDiasDespues) {
                fetch('/eliminar-notificacion-advertencia', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: notif.id })
                });
            }
        }
    });

    // Mostrar la interfaz de notificaciones
    mostrarInterfazNotificaciones(advertenciaDiv, notificaciones);
    
    // Configurar manejadores de eventos
    configurarManejadoresEventos(advertenciaDiv);
}

function mostrarInterfazNotificaciones(advertenciaDiv, notificaciones) {
    advertenciaDiv.innerHTML = `
        <div class="advertencia-contenido">
            <h2><i class="fas fa-exclamation-triangle"></i> Notificaciones</h2>
            <div class="notificaciones-lista">
                ${notificaciones.map(notif => `
                    <div class="notificacion-item" data-id="${notif.id}" data-destino="${notif.destino}">
                        <div class="notif-header">
                            <div class="notif-info">
                                <span class="fecha">${notif.fecha}</span>
                                <span class="origen">De: ${notif.origen}</span>
                            </div>
                        </div>
                        <p class="mensaje">${notif.notificacion}</p>
                    </div>
                `).join('')}
            </div>
            <div class="confirmacion-lectura" style="display: none;">
                <input type="checkbox" id="confirmarLectura">
                <span>He leido todo</span>
            </div>
            <div class="anuncio-botones">
                <button class="btn-aceptar">Aceptar</button>
                <button class="btn-aceptar-eliminar">Eliminar</button>
            </div>
        </div>
    `;
}

function configurarManejadoresEventos(advertenciaDiv) {
    // Configurar botones de eliminar individuales
    const deleteButtons = advertenciaDiv.querySelectorAll('.btn-eliminar-notif');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', eliminarNotificacionIndividual);
    });

    // Configurar el botón de aceptar
    const btnAceptar = advertenciaDiv.querySelector('.btn-aceptar');
    btnAceptar.addEventListener('click', () => {
        advertenciaDiv.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    });

    // Configurar el botón aceptar y eliminar
    const btnAceptarEliminar = advertenciaDiv.querySelector('.btn-aceptar-eliminar');
    btnAceptarEliminar.addEventListener('click', eliminarNotificacionesUsuarioActual);
}

async function eliminarNotificacionIndividual(e) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    console.log('Attempting to delete notification with ID:', id);

    try {
        mostrarCarga();
        const response = await fetch('/eliminar-notificacion-advertencia', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const data = await response.json();
        if (data.success) {
            const notifItem = e.currentTarget.closest('.notificacion-item');
            notifItem.remove();

            // Update notification count
            const advertenciaDiv = document.querySelector('.advertencia');
            const remainingNotifs = advertenciaDiv.querySelectorAll('.notificacion-item').length;
            const badge = document.getElementById('notificationBadge');
            
            if (badge) {
                if (remainingNotifs > 0) {
                    badge.textContent = remainingNotifs;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                    advertenciaDiv.style.display = 'none';
                    document.querySelector('.container').classList.remove('no-touch');
                }
            }
            mostrarNotificacion('Notificación eliminada correctamente', 'success');
        } else {
            throw new Error(data.error || 'Error al eliminar la notificación');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        mostrarNotificacion('Error al eliminar la notificación', 'error');
    } finally {
        ocultarCarga();
    }
}

async function eliminarNotificacionesUsuarioActual() {
    const advertenciaDiv = document.querySelector('.advertencia');
    const confirmacionDiv = advertenciaDiv.querySelector('.confirmacion-lectura');
    const checkbox = advertenciaDiv.querySelector('#confirmarLectura');
    
    if (confirmacionDiv.style.display === 'none') {
        confirmacionDiv.style.display = 'flex';
        return;
    }

    if (!checkbox.checked) {
        mostrarNotificacion('Debes confirmar que has leído todas las notificaciones', 'warning');
        return;
    }

    try {
        mostrarCarga();
        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const nombreUsuarioActual = userData.nombre;
        const rolUsuarioActual = userData.rol;

        // Obtener solo las notificaciones que coinciden con el usuario o rol actual
        const notificacionesAEliminar = Array.from(advertenciaDiv.querySelectorAll('.notificacion-item'))
            .filter(item => {
                const destino = item.getAttribute('data-destino');
                return destino === nombreUsuarioActual || destino === rolUsuarioActual;
            })
            .map(item => ({
                id: item.dataset.id,
                fecha: item.querySelector('.fecha').textContent,
                mensaje: item.querySelector('.mensaje').textContent
            }));

        // Verificar si hay notificaciones para eliminar
        if (notificacionesAEliminar.length === 0) {
            mostrarNotificacion('No tienes notificaciones para eliminar', 'info');
            return;
        }

        // Eliminar todas las notificaciones en una sola petición
        const response = await fetch('/eliminar-todas-notificaciones', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: nombreUsuarioActual,
                rol: rolUsuarioActual,
                notificaciones: notificacionesAEliminar
            })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Todas las notificaciones han sido eliminadas', 'success');
            advertenciaDiv.style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
            const badge = document.getElementById('notificationBadge');
            if (badge) badge.style.display = 'none';
            
            // Eliminar visualmente las notificaciones
            notificacionesAEliminar.forEach(notif => {
                const item = advertenciaDiv.querySelector(`[data-id="${notif.id}"]`);
                if (item) item.remove();
            });
        } else {
            throw new Error(data.error || 'Error al eliminar las notificaciones');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar las notificaciones', 'error');
    } finally {
        ocultarCarga();
    }
}
export async function registrarNotificacion(origen, destino, mensaje) {
    try {
        const response = await fetch('/registrar-notificacion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origen,
                destino,
                notificacion: mensaje
            })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al registrar la notificación');
        }

        return data.id; // Returns the generated notification ID
    } catch (error) {
        console.error('Error al registrar notificación:', error);
        throw error;
    }
}