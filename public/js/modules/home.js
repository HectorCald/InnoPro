export async function inicializarHome() {
    const homeView = document.querySelector('.home-view');
    if (!homeView) return;

    try {
        mostrarCarga();
        const highlights = await obtenerHighlights();
        const notificaciones = await obtenerNotificaciones();
        const atajos = await obtenerAtajos();
        const novedades = await obtenerNovedades();

        // Add view class to all views
        document.querySelectorAll('.home-view, .formProduccion-view, .cuentasProduccion-view, .newPedido-view, .newTarea-view, .almAcopio-view, .verificarRegistros-view, .almPrima-view, .usuarios-view, .consultarRegistros-view, .compras-view')
            .forEach(v => v.classList.add('view'));

        homeView.innerHTML = `
            <div class="title">
                <h3><i class="fas fa-home"></i> Página principal</h3>
            </div>
            <div class="shortcuts-container">
                <div class="timeline">
                    <h2>tus atajos</h2>
                    ${generarAtajos(atajos)}
                </div>
            </div>

            <div class="highlights-container">
                ${generarHighlights(highlights)}
            </div>

            <div class="updates-section">
                <h2>Novedades del Sistema</h2>
                ${generarNovedades(novedades)}
            </div>
        `;

        inicializarEventos();
    } catch (error) {
        console.error('Error:', error);
        homeView.innerHTML = '<p>Error al cargar la página principal</p>';
    } finally {
        ocultarCarga();
    }
}
async function obtenerHighlights() {
    try {
        mostrarCarga();
        
        // Obtener el rol del usuario
        const rolResponse = await fetch('/obtener-mi-rol');
        const rolData = await rolResponse.json();
        const rol = rolData.rol;

        let registros;
        if (rol === 'Almacen') {
            // Para Almacen, obtener todos los registros
            const response = await fetch('/obtener-todos-registros');
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            registros = data.registros;
        } else {
            // Para otros roles, obtener solo sus registros
            const response = await fetch('/obtener-registros');
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            registros = data.registros;
        }

        const produccionesTotal = registros.length;
        const produccionesVerificadas = registros.filter(registro => registro[10]).length;
        const noVerificados = produccionesTotal - produccionesVerificadas;
        const eficienciaVerificados = produccionesTotal > 0 
            ? Math.round((produccionesVerificadas / produccionesTotal) * 100) 
            : 0;
        const eficienciaNoVerificados = produccionesTotal > 0
            ? Math.round((noVerificados / produccionesTotal) * 100)
            : 0;

        return [
            { 
                valor: produccionesTotal, 
                etiqueta: 'Total Registros' 
            },
            { 
                valor: produccionesVerificadas, 
                etiqueta: `Verificadas (${eficienciaVerificados}%)` 
            },
            { 
                valor: noVerificados, 
                etiqueta: `No Verif. (${eficienciaNoVerificados}%)` 
            }
        ];
    } catch (error) {
        console.error('Error al obtener highlights:', error);
        return [
            { valor: '0', etiqueta: 'Total Registros' },
            { valor: '0', etiqueta: 'Verificadas (0%)' },
            { valor: '0', etiqueta: 'No Verificados (0%)' }
        ];
    } finally {
        ocultarCarga();
    }
}
function generarHighlights(highlights) {
    return highlights.map(h => `
        <div class="highlight-card">
            <div class="highlight-value">${h.valor}</div>
            <div class="highlight-label">${h.etiqueta}</div>
        </div>
    `).join('');
}
async function obtenerNotificaciones() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-notificaciones-usuario');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        return data.notificaciones.map(n => ({
            fecha: n.fecha,  // Keep the original date format
            tiempo: calcularTiempo(n.fecha),
            mensaje: n.mensaje
        }));
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        return [
            { tiempo: 'Error', mensaje: 'No se pudieron cargar las notificaciones' }
        ];
    }finally{
        ocultarCarga();
    }
}
function calcularTiempo(fecha) {
    const [dia, mes, anio] = fecha.split('/');
    const fechaNotificacion = new Date(20 + anio, mes - 1, dia);
    const ahora = new Date();
    const diferencia = ahora - fechaNotificacion;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));

    if (dias > 0) {
        return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else {
        return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    }
}
function inicializarEventos() {
    document.querySelectorAll('.delete-notification').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const fecha = button.dataset.fecha;
            const mensaje = button.dataset.mensaje;

            // Show custom confirmation dialog
            const anuncio = document.querySelector('.anuncio');
            const overlay = document.querySelector('.overlay');
            const confirmarBtn = anuncio.querySelector('.confirmar');
            const cancelarBtn = anuncio.querySelector('.cancelar');
            
            // Change the announcement title
            const titulo = anuncio.querySelector('h2');
            titulo.textContent = '¿Eliminar notificación?';

            // Show dialog and overlay
            anuncio.style.display = 'flex';
            overlay.style.display = 'block';

            // Handle confirm
            confirmarBtn.onclick = async () => {
                try {
                    mostrarCarga();
                    console.log('Eliminando notificación:', { fecha, mensaje }); // Debug log
                    const response = await fetch('/eliminar-notificacion', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ fecha, mensaje })
                    });

                    const data = await response.json();

                    if (!data.success) {
                        throw new Error(data.error || 'Error al eliminar notificación');
                    }

                    // Hide dialog and overlay
                    anuncio.style.display = 'none';
                    overlay.style.display = 'none';

                    // Remove the notification from UI
                    const timelineItem = button.closest('.timeline-item');
                    timelineItem.style.opacity = '0';
                    setTimeout(() => {
                        timelineItem.remove();
                        // If no notifications left, show message
                        const timeline = document.querySelector('.timeline');
                        if (!timeline.querySelector('.timeline-item')) {
                            timeline.innerHTML = `
                                <h2>Notificaciones Recientes</h2>
                                <p class="no-notifications">No hay notificaciones</p>
                            `;
                        }
                    }, 300);

                } catch (error) {
                    console.error('Error:', error);
                    alert(error.message || 'Error al eliminar la notificación');
                    anuncio.style.display = 'none';
                    overlay.style.display = 'none';
                }finally{
                    ocultarCarga();
                }
            };

            // Close on overlay click
            overlay.onclick = () => {
                anuncio.style.display = 'none';
                overlay.style.display = 'none';
            };
        });
    });
}
function generarNovedades(novedades) {
    return novedades.map(n => `
        <div class="update-card">
            <h3>${n.titulo}</h3>
            <p>${n.descripcion}</p>
            <small>${n.fecha}</small>
        </div>
    `).join('');
}
async function obtenerNovedades() {
    return [
        {
            titulo: 'Nueva Actualización',
            descripcion: 'Se agregó el sistema de notificaciones. Ahora recibirás una notificación al iniciar sesión sobre temas como producción, edición de registros, eliminación de registros, entre otros.',
            fecha: '2025-03-28'
        }
    ];
}
async function obtenerAtajos() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-mi-rol');
        const data = await response.json();
        const roles = data.rol ? data.rol.split(',').map(r => r.trim()) : [];

        // Define available shortcuts by role using the same structure as dashboard_db.js
        const atajosPorRol = {
            'Producción': [

                { 
                    clase: 'opcion-btn',
                    vista: 'formProduccion-view',
                    icono: 'fa-clipboard-list',
                    texto: 'Formulario',
                    onclick: 'onclick="inicializarFormularioProduccion()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'cuentasProduccion-view',
                    icono: 'fa-history',
                    texto: 'Registros',
                    onclick: 'onclick="cargarRegistrosCuentas()"'
                }
            ],
            'Acopio': [
                { 
                    clase: 'opcion-btn',
                    vista: 'newPedido-view',
                    icono: 'fa-clipboard-list',
                    texto: 'Pedido',
                    onclick: 'onclick="inicializarPedidos()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'newTarea-view',
                    icono: 'fa-tasks',
                    texto: 'Tarea',
                    onclick: 'onclick="inicializarTareas()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'almAcopio-view',
                    icono: 'fa-warehouse',
                    texto: 'Alm Bruto',
                    onclick: 'onclick="inicializarAlmacen()"'
                }
            ],
            'Almacen': [
                { 
                    clase: 'opcion-btn',
                    vista: 'verificarRegistros-view',
                    icono: 'fa-check-double',
                    texto: 'Verificar',
                    onclick: 'onclick="cargarRegistros()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'almPrima-view',
                    icono: 'fa-warehouse',
                    texto: 'Alm Prima',
                    onclick: 'onclick="inicializarAlmacenPrima()"'
                }
            ],
            'Administración': [
                { 
                    clase: 'opcion-btn',
                    vista: 'usuarios-view',
                    icono: 'fa-users-cog',
                    texto: 'Usuarios',
                    onclick: 'onclick="cargarUsuarios()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'consultarRegistros-view',
                    icono: 'fa-search',
                    texto: 'Consultar',
                    onclick: 'onclick="inicializarConsulta()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'compras-view',
                    icono: 'fa-shopping-cart',
                    texto: 'Compras',
                    onclick: 'onclick="inicializarCompras()"'
                }
            ]
        };

        // Collect all shortcuts for user's roles
        let atajosUsuario = [];
        roles.forEach(rol => {
            const atajosRol = atajosPorRol[rol];
            if (atajosRol) {
                atajosUsuario = [...atajosUsuario, ...atajosRol];
            }
        });

        // Limit to 3 shortcuts
        return atajosUsuario.slice(0, 3);

    } catch (error) {
        console.error('Error al obtener atajos:', error);
        return [];
    }finally{
        ocultarCarga();
    }
}
function generarAtajos(atajos) {
    if (!atajos || atajos.length === 0) return '';

    return `
        <div class="shortcuts-grid">
            ${atajos.map(a => `
                <button class="shortcut-card" onclick="manejarAtajo('${a.vista}', '${a.onclick.replace('onclick="', '').replace('"', '')}')">
                    <i class="fas ${a.icono}"></i>
                    <span>${a.texto}</span>
                </button>
            `).join('')}
        </div>
    `;
}
function manejarAtajo(vista, accion) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
        v.style.opacity = '0';
    });

    // Show selected view
    const vistaSeleccionada = document.querySelector(`.${vista}`);
    if (vistaSeleccionada) {
        vistaSeleccionada.style.display = 'flex';
        setTimeout(() => {
            vistaSeleccionada.style.opacity = '1';
        }, 0);
    }

    // Actualizar botón activo en el menú
    document.querySelectorAll('.opcion-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.vista === vista) {
            btn.classList.add('active');
        }
    });

    // Execute the action
    const cleanAction = accion.replace('window.', '').replace('()', '');
    if (window[cleanAction]) {
        window[cleanAction]();
    }
}
window.manejarAtajo = manejarAtajo;
