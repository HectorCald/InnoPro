export function initializeMenu(roles, opcionesDiv, vistas) {
    const { menuPrincipal, menuSecundario, overlay } = initializeMenuStructure(opcionesDiv);
    initializeMenuEvents(menuPrincipal, menuSecundario, overlay);
    initializeMenuButtons(roles, menuSecundario, vistas, menuPrincipal, overlay);
}
function initializeMenuStructure(opcionesDiv) {
    const isDesktop = window.innerWidth >= 1024;

    opcionesDiv.innerHTML = `
        <div class="overlay"></div>
        <div class="menu-principal">
        </div>
        <div class="menu-secundario ${isDesktop ? 'active' : ''}"></div>
    `;
    return {
        menuPrincipal: opcionesDiv.querySelector('.menu-principal'),
        menuSecundario: opcionesDiv.querySelector('.menu-secundario'),
        overlay: document.querySelector('.overlay')
    };
}
function initializeMenuEvents(menuPrincipal, menuSecundario, overlay) {
    // Desktop menu handler
    const handleDesktopMenu = () => {
        if (window.innerWidth >= 1024) {
            menuSecundario.classList.add('active');
            overlay.classList.remove('active');
        }
    };

    handleDesktopMenu();
    window.addEventListener('resize', handleDesktopMenu);

    // Mobile menu events
    menuPrincipal.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
            e.stopPropagation();
            menuPrincipal.classList.toggle('active');
            menuSecundario.classList.toggle('active');
            overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
        }
    });

    document.addEventListener('click', () => {
        if (window.innerWidth < 1024 && menuPrincipal.classList.contains('active')) {
            menuPrincipal.classList.remove('active');
            menuSecundario.classList.remove('active');
            overlay.style.display = 'none';
        }
    });

    menuSecundario.addEventListener('click', (e) => e.stopPropagation());
}
function initializeMenuButtons(roles, menuSecundario, vistas, menuPrincipal, overlay) {
    const botonesRoles = {
        'Producción': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'cuentasProduccion-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosCuentas()"' }
        ],
        'Acopio': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'newPedido-view', icono: 'fa-clipboard-list', texto: 'Pedido', onclick: 'onclick="inicializarPedidos()"' },
            { clase: 'opcion-btn', vista: 'newTarea-view', icono: 'fa-tasks', texto: 'Tareas', onclick: 'onclick="inicializarTareas()"' },
            { clase: 'opcion-btn', vista: 'almAcopio-view', icono: 'fa-warehouse', texto: 'Almacen', onclick: 'onclick="inicializarAlmacen()"' },
            { clase: 'opcion-btn', vista: 'regAcopio-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosAcopio()"' }
        ],
        'Almacen': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'verificarRegistros-view', icono: 'fa-check-double', texto: 'Verificar', onclick: 'onclick="cargarRegistros()"' },
            { clase: 'opcion-btn', vista: 'almPrima-view', icono: 'fa-warehouse', texto: 'Alm Prima', onclick: 'onclick="inicializarAlmacenPrima()"' },
            { clase: 'opcion-btn', vista: 'almacen-view', icono: 'fa-dolly', texto: 'Gestion', onclick: 'onclick="inicializarAlmacenGral()"' },
            { clase: 'opcion-btn', vista: 'regAlmacen-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosAlmacenGral()"' },
            { clase: 'opcion-btn', vista: 'balAlmacen-view', icono: 'fa-history', texto: 'Balance', onclick: 'onclick="inicializarBalanceAlmacen()"' }
        ],
        'Administración': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            {
                clase: 'opcion-btn submenu-trigger',
                icono: 'fa-mortar-pestle',
                texto: 'Acopio',
                submenu: [
                    { clase: 'opcion-btn submenu-item', vista: 'almAcopio-view', icono: 'fa-warehouse', texto: 'Alm Bruto', onclick: 'onclick="inicializarAlmacen()"' },
                    { clase: 'opcion-btn submenu-item', vista: 'regAcopio-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosAcopio()"' },
                    { clase: 'opcion-btn submenu-item', vista: 'compras-view', icono: 'fa-shopping-cart', texto: 'Compras', onclick: 'onclick="inicializarCompras()"' }
                ]
            },
            {
                clase: 'opcion-btn submenu-trigger',
                icono: 'fa-industry',
                texto: 'Producción',
                submenu: [
                    { clase: 'opcion-btn submenu-item', vista: 'verificarRegistros-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistros()"' },
                    { clase: 'opcion-btn submenu-item', vista: 'almPrima-view', icono: 'fa-warehouse', texto: 'Alm Prima', onclick: 'onclick="inicializarAlmacenPrima()"' },
                    { clase: 'opcion-btn submenu-item', vista: 'preciosPro-view', icono: 'fa-dollar-sign', texto: 'Precios', onclick: 'onclick="initializePreciosPro()"' }
                   
                ]
            },
            {
                clase: 'opcion-btn submenu-trigger',
                icono: 'fa-warehouse',
                texto: 'Almacen',
                submenu: [
                    { clase: 'opcion-btn submenu-item', vista: 'almacen-view', icono: 'fa-dolly', texto: 'Gestion', onclick: 'onclick="inicializarAlmacenGral()"' },
                    { clase: 'opcion-btn submenu-item', vista: 'regAlmacen-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosAlmacenGral()"' }
                   
                ]
            },
            { clase: 'opcion-btn', vista: 'usuarios-view', icono: 'fa-users-cog', texto: 'Usuarios', onclick: 'onclick="cargarUsuarios()"' },
        ]
    };

    let esElPrimero = true;

    roles.forEach(rolActual => {
        const botonesRol = botonesRoles[rolActual];
        if (botonesRol && botonesRol.length > 0) {
            botonesRol.forEach(boton => {
                if (boton.submenu) {
                    const submenuHTML = `
                        <div class="submenu-container">
                            <button class="${boton.clase}" data-has-submenu="true">
                                <i class="fas ${boton.icono}"></i>
                                <span>${boton.texto}</span>
                            </button>
                            <div class="submenu collapsed">
                                ${boton.submenu.map(subItem => `
                                    <button class="${subItem.clase}" 
                                            data-vista="${subItem.vista}" 
                                            ${subItem.onclick}>
                                        <i class="fas ${subItem.icono}"></i>
                                        <span>${subItem.texto}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `;
                    menuSecundario.insertAdjacentHTML('beforeend', submenuHTML);

                    // Get the last added submenu container and its elements
                    const lastContainer = menuSecundario.querySelector('.submenu-container:last-child');
                    const submenuButton = lastContainer.querySelector('[data-has-submenu]');
                    const submenu = lastContainer.querySelector('.submenu');
                    const arrow = lastContainer.querySelector('.submenu-arrow');

                    // Add click event to submenu button
                    submenuButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Toggle submenu
                        submenu.classList.toggle('collapsed');
                        arrow.style.transform = submenu.classList.contains('collapsed') ? 'rotate(0)' : 'rotate(180deg)';
                        
                        // Close other submenus
                        document.querySelectorAll('.submenu:not(.collapsed)').forEach(other => {
                            if (other !== submenu) {
                                other.classList.add('collapsed');
                                const otherArrow = other.previousElementSibling.querySelector('.submenu-arrow');
                                if (otherArrow) {
                                    otherArrow.style.transform = 'rotate(0)';
                                }
                            }
                        });
                    });

                    // Add click events to submenu items
                    submenu.querySelectorAll('.submenu-item').forEach(item => {
                        item.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                    
                            // Remove active class from all buttons except the parent submenu trigger
                            menuSecundario.querySelectorAll('.opcion-btn').forEach(b => {
                                if (!b.dataset.hasSubmenu) {
                                    b.classList.remove('active');
                                }
                            });
                            
                            // Add active class to clicked item
                            item.classList.add('active');
                            
                            // Keep parent submenu open and active
                            const parentContainer = item.closest('.submenu-container');
                            const submenu = parentContainer.querySelector('.submenu');
                            submenu.classList.remove('collapsed');
                            const arrow = parentContainer.querySelector('.submenu-arrow');
                            arrow.style.transform = 'rotate(180deg)';
                    
                            const vistaId = item.dataset.vista;
                            const vistaActual = document.querySelector(`.${vistaId}`);
                            
                            if (vistaActual) {
                                // Hide all views
                                vistas.forEach(vista => {
                                    vista.style.opacity = '0';
                                    setTimeout(() => vista.style.display = 'none', 300);
                                });

                                // Execute onclick function
                                const onclickFn = item.getAttribute('onclick')?.replace('onclick="', '').replace('"', '');
                                if (window[onclickFn]) {
                                    await window[onclickFn]();
                                }

                                // Show selected view
                                setTimeout(() => {
                                    vistaActual.style.display = 'flex';
                                    requestAnimationFrame(() => {
                                        vistaActual.style.opacity = '1';
                                    });
                                }, 300);

                                // Handle mobile menu
                                if (window.innerWidth < 1024) {
                                    menuPrincipal.classList.remove('active');
                                    menuSecundario.classList.remove('active');
                                    overlay.style.display = 'none';
                                }
                            }
                        });
                    });
                    window.actualizarBotonActivo = (vistaId) => {
                        const targetButton = menuSecundario.querySelector(`[data-vista="${vistaId}"]`);
                        if (!targetButton) return;
                    
                        // Remove active class from all buttons
                        menuSecundario.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('active'));
                        
                        // Add active class to target button
                        targetButton.classList.add('active');
                        
                        // If target is submenu item, keep parent active and open
                        const parentContainer = targetButton.closest('.submenu-container');
                        if (parentContainer) {
                            const parentTrigger = parentContainer.querySelector('[data-has-submenu]');
                            const submenu = parentContainer.querySelector('.submenu');
                            const arrow = parentContainer.querySelector('.submenu-arrow');
                            
                            parentTrigger.classList.add('active');
                            submenu.classList.remove('collapsed');
                            arrow.style.transform = 'rotate(180deg)';
                        }
                    };
                } else {
                    // Regular button without submenu (existing code)
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
                }
            });
        }
    });

    // Handle regular button clicks
    menuSecundario.querySelectorAll('.opcion-btn:not([data-has-submenu])').forEach(boton => {
        boton.addEventListener('click', async (e) => {
            if (boton.classList.contains('active')) return;

            // Close all open submenus when clicking a regular button
            document.querySelectorAll('.submenu:not(.collapsed)').forEach(submenu => {
                submenu.classList.add('collapsed');
                const arrow = submenu.previousElementSibling.querySelector('.submenu-arrow');
                if (arrow) {
                    arrow.style.transform = 'rotate(0)';
                }
            });

            if (window.innerWidth < 1024) {
                menuPrincipal.classList.remove('active');
                menuSecundario.classList.remove('active');
                overlay.style.display = 'none';
            }
            if (boton.classList.contains('active')) return;

            if (window.innerWidth < 1024) {
                menuPrincipal.classList.remove('active');
                menuSecundario.classList.remove('active');
                overlay.style.display = 'none';
            }

            menuSecundario.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('active'));
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

    // Global view management functions
    window.actualizarBotonActivo = (vistaId) => {
        menuSecundario.querySelectorAll('.opcion-btn').forEach(b => {
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
