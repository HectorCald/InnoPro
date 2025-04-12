const frasesDiarias = [
    "¡Un día productivo y a romperla en la calle, loco! 💪🔥",
    "¡Hoy es un gran día para dar lo mejor! ⭐️✨",
    "¡La actitud positiva es la clave del éxito! 🎯✨",
    "¡Cada día es una nueva oportunidad! 🌅💫",
    "¡Con determinación, todo es posible! 🚀💪",
    "¡La excelencia no es un acto, es un hábito! 🏆✨",
    "¡El éxito es la suma de pequeños esfuerzos! 📈💯",
    "¡La calidad es la mejor publicidad! ⭐️💎",
    "¡Juntos hacemos la diferencia! 🤝💪",
    "¡La perseverancia vence todos los obstáculos! 🎯💫"
];
function obtenerFraseAleatoria() {
    const indice = Math.floor(Math.random() * frasesDiarias.length);
    return frasesDiarias[indice];
}
export async function inicializarHome() {
    const homeView = document.querySelector('.home-view');
    if (!homeView) return;

    try {
        mostrarCarga();
        const atajos = await obtenerAtajos();
        const fraseDiaria = obtenerFraseAleatoria();

        // Add view class to all views
        document.querySelectorAll('.home-view, .formProduccion-view, .cuentasProduccion-view, .newPedido-view, .newTarea-view, .almAcopio-view, .verificarRegistros-view, .almPrima-view, .usuarios-view, .consultarRegistros-view, .compras-view')
            .forEach(v => v.classList.add('view'));

        homeView.innerHTML = `
            <div class="title"><h3><i class="fas fa-home"></i> Inicio</h3> </div>
            <div class="welcome-header">
                <h1>¡Frase del día!</h1>
                <p>${fraseDiaria}</p>
            </div>
            <div class="shortcuts-container">
                <div class="timeline">
                    <h2>¿Que puedes hacer?</h2>
                    ${generarAtajos(atajos)}
                </div>
            </div>
        `;

        inicializarEventos();
    } catch (error) {
        console.error('Error:', error);
        homeView.innerHTML = '<p>Error al cargar la página principal</p>';
    } finally {
        ocultarCarga();
        scrollToTop('.home-view');
    }
}
function inicializarEventos() {
    document.querySelectorAll('.delete-notification').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();

            // Show custom confirmation dialog
            const anuncio = document.querySelector('.anuncio');
            const overlay = document.querySelector('.overlay');
            
            // Change the announcement title
            const titulo = anuncio.querySelector('h2');
            titulo.textContent = '¿Eliminar notificación?';

            // Show dialog and overlay
            anuncio.style.display = 'flex';
            overlay.style.display = 'block';

            // Close on overlay click
            overlay.onclick = () => {
                anuncio.style.display = 'none';
                overlay.style.display = 'none';
            };
        });
    });
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
                    vista: 'home-view',
                    icono: 'fa-clipboard-list',
                    texto: 'Formulario',
                    detalle: 'Aqui puedes llenar el formulario un vez terminado el proceso de producción',
                    onclick: 'onclick="mostrarFormularioProduccion()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'cuentasProduccion-view',
                    icono: 'fa-history',
                    texto: 'Registros',
                    detalle: 'Aqui puedes ver todos los registros de producción que hiciste',
                    onclick: 'onclick="cargarRegistrosCuentas()"'
                },
            ],
            'Acopio': [
                { 
                    clase: 'opcion-btn',
                    vista: 'home-view',
                    icono: 'fa-clipboard-list',
                    texto: 'Nuevo Pedido',
                    detalle: 'Aqui puedes realizar un nuevo pedido de materia prima.',
                    onclick: 'onclick="mostrarFormularioPedido()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'almAcopio-view',
                    icono: 'fa-dolly',
                    texto: 'Gestionar Almacen',
                    detalle: 'Aqui puedes gestionar el almacen de Acopio: (Materia Prima, Materia Bruta, Movimientos).',
                    onclick: 'onclick="inicializarTareas()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'regAcopio-view',
                    icono: 'fa-history',
                    texto: 'Registros Acopio.',
                    detalle: 'Aqui puedes ver todos los registros de Acopio que hiciste: (Pedidos, Movimientos).',
                    onclick: 'onclick="cargarRegistrosAcopio()"'
                }
            ],
            'Almacen': [
                { 
                    clase: 'opcion-btn',
                    vista: 'verificarRegistros-view',
                    icono: 'fa-check-double',
                    texto: 'Verificar Registros',
                    detalle: 'Aqui puedes verificar la cantidad real de los registros de producción.',
                    onclick: 'onclick="cargarRegistros()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'almacen-view',
                    icono: 'fa-dolly',
                    texto: 'Gestionar Almacen',
                    detalle: 'Aqui puedes gestionar el almacen de la empresa: (stock, Productos, ingresos, salidas).',
                    onclick: 'onclick="inicializarAlmacenGral()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'regAlmacen-view',
                    icono: 'fa-history',
                    texto: 'Registros Almacen',
                    detalle: 'Aqui puedes ver todos los registros de almacen que hiciste tanto ingreso como salidas.',
                    onclick: 'onclick="cargarRegistrosAlmacenGral()"'
                }
            ],
            'Administración': [
                { 
                    clase: 'opcion-btn',
                    vista: 'compras-view',
                    icono: 'fa-shopping-cart',
                    texto: 'Compras Materia Prima',
                    detalle: 'Aqui puedes gestionar las compras de materia prima y entregarlas hacia acopio.',
                    onclick: 'onclick="inicializarCompras()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'regAlmacen-view',
                    icono: 'fa-search',
                    texto: 'Registros Almacen',
                    detalle: 'Aqui puedes gestionar todos los registros de Almacen. (Eliminar, Editar, Movimientos)',
                    onclick: 'onclick="cargarRegistrosAlmacenGral()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'verificarRegistros-view',
                    icono: 'fa-search',
                    texto: 'Registros Producción',
                    detalle: 'Aqui puedes gestionar todos los registros de producción. (Eliminar, Editar, Pagar, Calcular pagos)',
                    onclick: 'onclick="cargarRegistros()"'
                },
                { 
                    clase: 'opcion-btn',
                    vista: 'regAcopio-view',
                    icono: 'fa-search',
                    texto: 'Registros Acopio',
                    detalle: 'Aqui puedes gestionar todos los registros de Acopio. (Eliminar, Editar, Movimientos)',
                    onclick: 'onclick="cargarRegistrosAcopio()"'
                },
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
        return atajosUsuario.slice(0, 5);

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
                <div class="shortcut-card" onclick="manejarAtajo('${a.vista}', '${a.onclick.replace('onclick="', '').replace('"', '')}')">
                    <i class="fas ${a.icono}"></i>
                    <div class="info-atajo">
                        <span>${a.texto}</span>
                        <p>${a.detalle}</p>
                    </div>
                </div>
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
