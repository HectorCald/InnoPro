/* ==================== FUNCIONES DE NOTIFIACIONES DE INICIO ==================== */
export async function cargarNotificaciones() {
    try {
        mostrarCarga();
        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const nombreUsuarioActual = userData.nombre;
        const rolUsuarioActual = userData.rol;

        const response = await fetch('/obtener-notificaciones');
        const data = await response.json();

        if (data.success) {
            const notificacionesFiltradas = data.notificaciones.filter(notif =>
                notif.destino === nombreUsuarioActual ||
                notif.destino === rolUsuarioActual
            );

            const badge = document.getElementById('notificationBadge');
            if (badge) {
                if (notificacionesFiltradas && notificacionesFiltradas.length > 0) {
                    badge.textContent = notificacionesFiltradas.length;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }

            // Modificación aquí: Solo mostrar el div de advertencias si hay notificaciones
            const advertenciaDiv = document.querySelector('.advertencia');
            if (!notificacionesFiltradas || notificacionesFiltradas.length === 0) {
                mostrarNotificacion('No tienes notificaciones nuevas', 'info');
                if (advertenciaDiv) {
                    advertenciaDiv.style.display = 'none';
                    document.querySelector('.container').classList.remove('no-touch');
                }
                return;
            }

            // Solo si hay notificaciones, mostrar el div y el overlay
            if (advertenciaDiv) {
                advertenciaDiv.style.display = 'flex';
                document.querySelector('.container').classList.add('no-touch');
                mostrarAdvertencias(notificacionesFiltradas);
            }
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarNotificacion('Error al cargar notificaciones', 'error');
        // Asegurarse de que el overlay se quite en caso de error
        document.querySelector('.container').classList.remove('no-touch');
    } finally {
        ocultarCarga();
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
    notificaciones.sort((a, b) => {
        const fechaA = parsearFecha(a.fecha);
        const fechaB = parsearFecha(b.fecha);
        return fechaB - fechaA;
    });

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
function parsearFecha(fechaStr) {
    if (!fechaStr) return new Date();
    const [dia, mes, año] = fechaStr.split('/');
    return new Date(2000 + parseInt(año), parseInt(mes) - 1, parseInt(dia));
}
export function calcularClaseNotificacion(fecha) {
    const fechaNotif = parsearFecha(fecha);
    const diasTranscurridos = Math.floor((new Date() - fechaNotif) / (1000 * 60 * 60 * 24));
    
    if (diasTranscurridos <= 3) return 'reciente';
    if (diasTranscurridos <= 5) return 'dias-3';
    if (diasTranscurridos <= 7) return 'dias-5';
    if (diasTranscurridos <= 14) return 'dias-7';
    return 'dias-14';
}
function mostrarInterfazNotificaciones(advertenciaDiv, notificaciones) {
    advertenciaDiv.innerHTML = `
        <div class="advertencia-contenido">
            <div class="advertencia-header">
                <h2>
                    <i class="fas fa-bell"></i>
                    Notificaciones (${notificaciones.length})
                </h2>
                <button class="btn-cerrar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notificaciones-lista">
                ${notificaciones.map(notif => `
                    <div class="notificacion-item" 
                         data-id="${notif.id}" 
                         data-destino="${notif.destino}">
                        <div class="notif-header">
                            <div class="notif-info">
                                <span class="fecha">${notif.fecha}</span>
                                <span class="origen">De: ${notif.origen}</span>
                            </div>
                            <span class="tiempo-tag ${calcularClaseNotificacion(notif.fecha)}">
                                ${Math.abs(Math.floor((new Date() - parsearFecha(notif.fecha)) / (1000 * 60 * 60 * 24)))} días
                            </span>
                        </div>
                        <p class="mensaje">${notif.notificacion}</p>
                    </div>
                `).join('')}
            </div>
            <div class="confirmacion-lectura">
                <input type="checkbox" id="confirmarLectura">
                <span>He leído todas las notificaciones</span>
            </div>
            <div class="anuncio-botones">
                <button class="btn-eliminar-todas">
                    <i class="fas fa-trash"></i> Eliminar todo
                </button>
            </div>
        </div>
    `;
}
function configurarManejadoresEventos(advertenciaDiv) {
    // Configurar el botón eliminar todas
    const btnEliminarTodas = advertenciaDiv.querySelector('.btn-eliminar-todas');
    if (btnEliminarTodas) {
        btnEliminarTodas.addEventListener('click', eliminarNotificacionesUsuarioActual);
    }

    // Configurar el botón cerrar
    const btnCerrar = advertenciaDiv.querySelector('.btn-cerrar');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            advertenciaDiv.style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
        });
    }
    advertenciaDiv.addEventListener('click', (e) => {
        if (e.target === advertenciaDiv) {
            advertenciaDiv.style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
        }
    });


    // Configurar botones de eliminar individuales
    const deleteButtons = advertenciaDiv.querySelectorAll('.btn-eliminar-notif');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', eliminarNotificacionIndividual);
    });
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
        mostrarCarga();
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
    }finally{
        ocultarCarga();
    }
}
