export function initializeMenu(roles, opcionesDiv, vistas) {
    // Verificar si es pantalla grande
    const isDesktop = window.innerWidth >= 1024;

    opcionesDiv.innerHTML = `
        <div class="overlay"></div>
        <div class="menu-principal">
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
        <div class="menu-secundario ${isDesktop ? 'active' : ''}"></div>
    `;

    const menuPrincipal = opcionesDiv.querySelector('.menu-principal');
    const menuSecundario = opcionesDiv.querySelector('.menu-secundario');
    const overlay = document.querySelector('.overlay');

    // Función para manejar el menú en pantalla grande
    const handleDesktopMenu = () => {
        if (window.innerWidth >= 1024) {
            menuSecundario.classList.add('active');
            overlay.classList.remove('active');
        }
    };

    // Aplicar al inicio y en resize
    handleDesktopMenu();
    window.addEventListener('resize', handleDesktopMenu);

    // Event Listeners para móvil
    menuPrincipal.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
            e.stopPropagation();
            menuPrincipal.classList.toggle('active');
            menuSecundario.classList.toggle('active');
            if(overlay.style.display === 'block'){
                overlay.style.display = 'none';
            }
            else{
                overlay.style.display = 'block';
            }
            
        }
    });

    // Cerrar menú al hacer click fuera (solo en móvil)
    document.addEventListener('click', () => {
        if (window.innerWidth < 1024 && menuPrincipal.classList.contains('active')) {
            menuPrincipal.classList.remove('active');
            menuSecundario.classList.remove('active');
            overlay.style.display = 'none'; // Cambiar a display none
        }
    });

    // Prevenir cierre al hacer click dentro del menú
    menuSecundario.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Configuración de botones según rol
    const botonesRoles = {
        'Producción': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'formProduccion-view', icono: 'fa-clipboard-list', texto: 'Formulario', onclick: 'onclick="inicializarFormularioProduccion()"' },
            { clase: 'opcion-btn', vista: 'cuentasProduccion-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosCuentas()"' }
        ],
        'Acopio': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'newPedido-view', icono: 'fa-clipboard-list', texto: 'Pedido', onclick: 'onclick="inicializarPedidos()"' },
            { clase: 'opcion-btn', vista: 'newTarea-view', icono: 'fa-tasks', texto: 'Tarea', onclick: 'onclick="inicializarTareas()"' },
            { clase: 'opcion-btn', vista: 'almAcopio-view', icono: 'fa-warehouse', texto: 'Alm Bruto', onclick: 'onclick="inicializarAlmacen()"' },
            { clase: 'opcion-btn', vista: 'almPrima-view', icono: 'fa-warehouse', texto: 'Alm Prima', onclick: 'onclick="inicializarAlmacenPrima()"' }
        ],
        'Almacen': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'verificarRegistros-view', icono: 'fa-check-double', texto: 'Verificar', onclick: 'onclick="cargarRegistros()"' },
            { clase: 'opcion-btn', vista: 'almPrima-view', icono: 'fa-warehouse', texto: 'Alm Prima', onclick: 'onclick="inicializarAlmacenPrima()"' }
        ],
        'Administración': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'usuarios-view', icono: 'fa-users-cog', texto: 'Usuarios', onclick: 'onclick="cargarUsuarios()"' },
            { clase: 'opcion-btn', vista: 'compras-view', icono: 'fa-shopping-cart', texto: 'Compras', onclick: 'onclick="inicializarCompras()"' },
            { clase: 'opcion-btn', vista: 'verificarRegistros-view', icono: 'fa-check-double', texto: 'Registros', onclick: 'onclick="cargarRegistros()"' },
            { clase: 'opcion-btn', vista: 'almAcopio-view', icono: 'fa-warehouse', texto: 'Alm Bruto', onclick: 'onclick="inicializarAlmacen()"' },
            { clase: 'opcion-btn', vista: 'almPrima-view', icono: 'fa-warehouse', texto: 'Alm Prima', onclick: 'onclick="inicializarAlmacenPrima()"' },
            { clase: 'opcion-btn', vista: 'preciosPro-view', icono: 'fa-warehouse', texto: 'P. Producción', onclick: 'onclick="initializePreciosPro()"' }
        ]
    };
    let esElPrimero = true;

    // Generar botones según rol
    roles.forEach(rolActual => {
        const botonesRol = botonesRoles[rolActual];
        if (botonesRol && botonesRol.length > 0) {
            botonesRol.forEach(boton => {
                const btnHTML = `
                    <button class="${boton.clase}${esElPrimero ? ' active' : ''}" 
                            data-vista="${boton.vista}" 
                            ${boton.onclick}>
                        <i class="fas ${boton.icono}"></i>
                        <span>${boton.texto}</span>
                    </button>
                `;
                menuSecundario.insertAdjacentHTML('beforeend', btnHTML);

                if (esElPrimero) {
                    const vistaInicial = document.querySelector(`.${boton.vista}`);
                    if (vistaInicial) {
                        vistaInicial.style.display = 'flex';
                        vistaInicial.style.opacity = '1';
                        const onclickFn = boton.onclick.replace('onclick="', '').replace('"', '');
                        if (window[onclickFn]) {
                            window[onclickFn]();
                        }
                    }
                    esElPrimero = false;
                }
            });
        }
    });

    // Manejar clicks en botones
    const botones = menuSecundario.querySelectorAll('.opcion-btn');
    botones.forEach(boton => {
        boton.addEventListener('click', async (e) => {
            if (boton.classList.contains('active')) return;

            if (window.innerWidth < 1024) {
                menuPrincipal.classList.remove('active');
                menuSecundario.classList.remove('active');
                overlay.style.display = 'none';
            }

            botones.forEach(b => b.classList.remove('active'));
            boton.classList.add('active');

            vistas.forEach(vista => {
                vista.style.opacity = '0';
                setTimeout(() => vista.style.display = 'none', 300);
            });

            const vistaId = boton.dataset.vista;
            const vistaActual = document.querySelector(`.${vistaId}`);
            if (vistaActual) {
                const onclickFn = boton.getAttribute('onclick')?.replace('onclick="', '').replace('"', '');
                if (window[onclickFn]) {
                    await window[onclickFn]();
                }

                setTimeout(() => {
                    vistaActual.style.display = 'flex';
                    requestAnimationFrame(() => {
                        vistaActual.style.opacity = '1';
                    });
                }, 300);
            }
        });
    });

    // Funciones globales para manejar vistas
    window.actualizarBotonActivo = (vistaId) => {
        botones.forEach(b => {
            b.classList.remove('active');
            if (b.dataset.vista === vistaId) {
                b.classList.add('active');
            }
        });
    };

    window.cambiarVista = async (vistaId, accion) => {
        const vistaActual = document.querySelector(`.${vistaId}`);
        if (!vistaActual) return;

        vistas.forEach(vista => {
            vista.style.opacity = '0';
            setTimeout(() => vista.style.display = 'none', 300);
        });

        actualizarBotonActivo(vistaId);

        if (window[accion]) {
            await window[accion]();
        }

        setTimeout(() => {
            vistaActual.style.display = 'flex';
            requestAnimationFrame(() => {
                vistaActual.style.opacity = '1';
            });
        }, 300);
    };
}