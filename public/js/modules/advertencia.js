export async function cargarNotificaciones() {
    try {
        // Primero obtener el usuario actual
        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const nombreUsuarioActual = userData.nombre;

        // Luego obtener las notificaciones
        const response = await fetch('/obtener-notificaciones');
        const data = await response.json();
        
        if (data.success) {
            // Filtrar notificaciones solo para el usuario actual
            const notificacionesFiltradas = data.notificaciones.filter(
                notif => notif.destino === nombreUsuarioActual
            );
            mostrarAdvertencias(notificacionesFiltradas);
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
    }
}

function mostrarAdvertencias(notificaciones) {
    const advertenciaDiv = document.querySelector('.advertencia');
    if (!notificaciones || notificaciones.length === 0) {
        advertenciaDiv.style.display = 'none';
        return;
    }

    advertenciaDiv.innerHTML = `
        <div class="advertencia-contenido">
            <h2><i class="fas fa-exclamation-triangle"></i> Notificaciones</h2>
            <div class="notificaciones-lista">
                ${notificaciones.map(notif => `
                    <div class="notificacion-item" data-fecha="${notif.fecha}" data-origen="${notif.origen}" data-mensaje="${notif.notificacion}">
                        <div class="notif-header">
                            <div class="notif-info">
                                <span class="fecha">${notif.fecha}</span>
                                <span class="origen">De: ${notif.origen}</span>
                            </div>
                            <button class="btn-eliminar-notif" title="Eliminar notificación">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <p class="mensaje">${notif.notificacion}</p>
                    </div>
                `).join('')}
            </div>
            <button class="btn-aceptar">Aceptar</button>
        </div>
    `;

    advertenciaDiv.style.display = 'flex';
    document.querySelector('.container').classList.add('no-touch');

    // Configurar botones de eliminar
    advertenciaDiv.querySelectorAll('.btn-eliminar-notif').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const notifItem = btn.closest('.notificacion-item');
            const fecha = notifItem.dataset.fecha;
            const origen = notifItem.dataset.origen;
            const mensaje = notifItem.dataset.mensaje;
            
            try {
                mostrarCarga();
                const response = await fetch('/eliminar-notificacion-advertencia', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fecha, origen, mensaje })
                });

                const data = await response.json();
                if (data.success) {
                    notifItem.remove();
                    if (advertenciaDiv.querySelectorAll('.notificacion-item').length === 0) {
                        advertenciaDiv.style.display = 'none';
                        document.querySelector('.container').classList.remove('no-touch');
                    }
                } else {
                    console.error('Error:', data.error);
                }
            } catch (error) {
                console.error('Error al eliminar notificación:', error);
            }finally{
                ocultarCarga();
            }
        });
    });

    // Configurar el botón de aceptar
    const btnAceptar = advertenciaDiv.querySelector('.btn-aceptar');
    btnAceptar.addEventListener('click', () => {
        advertenciaDiv.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    });
}