/* =============== FUNCIONES DE INCIO HOME =============== */
import { mostrarCarga, ocultarCarga } from '../dashboard_db.js';
import { scrollToTop } from '../dashboard_db.js';
const frasesDiarias = [
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
    const deleteButtons = document.querySelectorAll('.delete-notification');
    const anuncio = document.querySelector('.anuncio');
    const overlay = document.querySelector('.overlay');

    if (deleteButtons.length && anuncio && overlay) {
        deleteButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();

                const titulo = anuncio.querySelector('h2');
                if (titulo) {
                    titulo.textContent = '¿Eliminar notificación?';
                }

                anuncio.style.display = 'flex';
                overlay.style.display = 'block';

                overlay.onclick = () => {
                    anuncio.style.display = 'none';
                    overlay.style.display = 'none';
                };
            });
        });
    }
}

/* =============== FUNCIONES DE INCIO DE ATAJOS =============== */
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
                    detalle: 'Aqui puedes llenar el formulario un vez terminado el proceso de producción',
                    onclick: 'onclick="mostrarFormularioProduccion()"'
                },
                {
                    clase: 'opcion-btn',
                    vista: 'cuentasProduccion-view',
                    icono: 'fa-history',
                    texto: 'Registros',
                    detalle: 'Aqui puedes ver todos los registros de producción que hiciste'
                },
                {
                    clase: 'opcion-btn',
                    vista: 'gestionPro-view',
                    icono: 'fa-chart-line',
                    texto: 'Estadisticas de registros',
                    detalle: 'Aqui puedes ver las estadisticas de tu registros de producción.'
                }
            ],
            'Acopio': [
                {
                    clase: 'opcion-btn',
                    vista: 'almAcopio-view',
                    icono: 'fa-dolly',
                    texto: 'Gestionar Almacen',
                    detalle: 'Aqui puedes gestionar el almacen de Acopio: (Materia Prima, Materia Bruta, Movimientos).',
                    onclick: 'onclick="inicializarAlmacen()"'
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
                    vista: 'regAcopio-view',
                    icono: 'fa-search',
                    texto: 'Registros Acopio',
                    detalle: 'Aqui puedes gestionar todos los registros de Acopio. (Eliminar, Editar, Movimientos)',
                    onclick: 'onclick="cargarRegistrosAcopio()"'
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
        return atajosUsuario.slice(0, 5);

    } catch (error) {
        console.error('Error al obtener atajos:', error);
        return [];
    } finally {
        ocultarCarga();
    }
}

function generarAtajos(atajos) {
    if (!atajos || atajos.length === 0) return '';

    return `
        <div class="shortcuts-grid">
            ${atajos.map(a => `
                <div class="shortcut-card" data-funcion="${a.onclick ? a.onclick.replace('onclick="', '').replace('"', '') : ''}" onclick="manejarAtajo('${a.vista}')">
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

function manejarAtajo(vista) {
    try {
        mostrarCarga();
        
        const clickedCard = event.currentTarget;
        const funcionName = clickedCard.dataset.funcion;
        
        if (vista === 'formProduccion-view' && funcionName) {
            const fn = window[funcionName.replace(/[()]/g, '')];
            if (typeof fn === 'function') {
                fn();
            }
            ocultarCarga();
            return;
        }

        // Ocultar vistas primero
        document.querySelectorAll('.view').forEach(v => {
            v.style.display = 'none';
            v.style.opacity = '0';
        });

        // Mostrar nueva vista
        const vistaSeleccionada = document.querySelector(`.${vista}`);
        if (vistaSeleccionada) {
            vistaSeleccionada.style.display = 'flex';
            requestAnimationFrame(() => {
                vistaSeleccionada.style.opacity = '1';
                scrollToTop(`.${vista}`);
            });
            ocultarAnuncio();

            // Activar botones del menú
            const submenuItem = document.querySelector(`.submenu-item[data-vista="${vista}"]`);
            if (submenuItem) {
                // Desactivar todos los botones primero
                document.querySelectorAll('.opcion-btn').forEach(btn => {
                    btn.classList.remove('active');
                });

                // Activar el botón del submenú
                submenuItem.classList.add('active');

                // Activar el botón principal y mostrar el submenú
                const submenuContainer = submenuItem.closest('.submenu-container');
                if (submenuContainer) {
                    const mainButton = submenuContainer.querySelector('[data-has-submenu]');
                    const submenu = submenuContainer.querySelector('.submenu');
                    
                    if (mainButton) mainButton.classList.add('active');
                    if (submenu) submenu.classList.remove('collapsed');
                }
            } else {
                // Si no es un submenú, activar el botón normal
                document.querySelectorAll('.opcion-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-vista') === vista);
                });
            }
        }

        // Actualizar historial
        window.history.pushState({ 
            vista: vista,
            menuHistory: [...(window.history.state?.menuHistory || []), vista]
        }, '', window.location.href);

    } catch (error) {
        console.error('Error al manejar atajo:', error);
    } finally {
        ocultarCarga();
    }
}
window.manejarAtajo = manejarAtajo;
