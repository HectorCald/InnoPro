/* =============== FUNCIONES DE INCIO DE MENU=============== */
export function initializeMenu(roles, opcionesDiv, vistas, funcionesExtras = []) {
    try {
        const { menuPrincipal, menuSecundario, overlay } = initializeMenuStructure(opcionesDiv);
        initializeMenuEvents(menuPrincipal, menuSecundario, overlay);
        const extrasArray = Array.isArray(funcionesExtras) ? funcionesExtras : [];
        initializeMenuButtons(roles, menuSecundario, vistas, menuPrincipal, overlay, extrasArray);
        const container = document.querySelector('.container');
        vistas.forEach(vista => {
            vista.addEventListener('scroll', () => {
                document.querySelectorAll('.submenu:not(.collapsed)').forEach(submenu => {
                    submenu.classList.add('collapsed');
                    const arrow = submenu.parentElement.querySelector('.submenu-arrow');
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                });
            });
        });

        if (container) {
            // Ocultar en scroll
            container.addEventListener('scroll', () => {
                document.querySelectorAll('.submenu:not(.collapsed)').forEach(submenu => {
                    submenu.classList.add('collapsed');
                    const arrow = submenu.parentElement.querySelector('.submenu-arrow');
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                });
            });

            // Ocultar al hacer clic en cualquier vista
            container.addEventListener('click', (e) => {
                if (!e.target.closest('.submenu-container')) {
                    document.querySelectorAll('.submenu:not(.collapsed)').forEach(submenu => {
                        submenu.classList.add('collapsed');
                        const arrow = submenu.parentElement.querySelector('.submenu-arrow');
                        if (arrow) {
                            arrow.style.transform = 'rotate(0deg)';
                        }
                    });
                }
            });
        }

        menuSecundario.addEventListener('click', (e) => e.stopPropagation());

    } catch (error) {
        console.error('Error al inicializar el menú:', error);
        throw error;
    }
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
function initializeMenuButtons(roles, menuSecundario, vistas, menuPrincipal, overlay, funcionesExtras = []) {
    const botonesRoles = {
        'Producción': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'cuentasProduccion-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosCuentas()"' },
            { clase: 'opcion-btn', vista: 'gestionPro-view', icono: 'fa-chart-line', texto: 'Estadisticas', onclick: 'onclick="inicializarGestionPro()"' },
            { clase: 'opcion-btn', vista: 'configuraciones-view', icono: 'fa-cog', texto: 'Ajustes', onclick: 'onclick="inicializarConfiguraciones()"' }
        ],
        'Acopio': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'almAcopio-view', icono: 'fa-dolly', texto: 'Gestionar', onclick: 'onclick="inicializarAlmacen()"' },
            { clase: 'opcion-btn', vista: 'regAcopio-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosAcopio()"' },
            { clase: 'opcion-btn', vista: 'configuraciones-view', icono: 'fa-cog', texto: 'Ajustes', onclick: 'onclick="inicializarConfiguraciones()"' }
        ],
        'Almacen': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio', onclick: 'onclick="inicializarHome()"' },
            { clase: 'opcion-btn', vista: 'verificarRegistros-view', icono: 'fa-check-double', texto: 'Verificar', onclick: 'onclick="cargarRegistros()"' },
            { clase: 'opcion-btn', vista: 'almacen-view', icono: 'fa-dolly', texto: 'Gestionar', onclick: 'onclick="inicializarAlmacenGral()"' },
            { clase: 'opcion-btn', vista: 'regAlmacen-view', icono: 'fa-history', texto: 'Registros', onclick: 'onclick="cargarRegistrosAlmacenGral()"' },
            { clase: 'opcion-btn', vista: 'configuraciones-view', icono: 'fa-cog', texto: 'Ajustes', onclick: 'onclick="inicializarConfiguraciones()"' }
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
            {
                clase: 'opcion-btn submenu-trigger',
                icono: 'fa-ellipsis-h',
                texto: 'Otros',
                submenu: [
                    { clase: 'opcion-btn submenu-item', vista: 'usuarios-view', icono: 'fa-users-cog', texto: 'Usuarios', onclick: 'onclick="inicializarUsuarios()"' },
                    { clase: 'opcion-btn submenu-item', vista: 'configuraciones-view', icono: 'fa-cog', texto: 'Ajustes', onclick: 'onclick="inicializarConfiguraciones()"' }
                ]
            }

        ]
    };
    const funcionesExtrasConfig = {
        'CalcularMP': {
            clase: 'opcion-btn submenu-item',
            vista: 'calcularMP-view',
            icono: 'fa-puzzle-piece',
            texto: 'Calcular MP',
            onclick: 'onclick="inicializarCalcularMP()"'
        }
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
                        if (arrow) {
                            arrow.style.transform = submenu.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(180deg)';
                        }

                        // Close other submenus
                        document.querySelectorAll('.submenu:not(.collapsed)').forEach(other => {
                            if (other !== submenu) {
                                other.classList.add('collapsed');
                                const otherArrow = other.parentElement.querySelector('.submenu-arrow');
                                if (otherArrow) {
                                    otherArrow.style.transform = 'rotate(0deg)';
                                }
                            }
                        });
                    });

                    // Add click events to submenu items
                    submenu.querySelectorAll('.submenu-item').forEach(item => {
                        item.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

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

                                // Update active states
                                menuSecundario.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('active'));
                                item.classList.add('active');
                                submenuButton.classList.add('active');

                                // Close submenu after selection
                                submenu.classList.add('collapsed');
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
    if (funcionesExtras && funcionesExtras.length > 0) {
        console.log('Procesando funciones extras:', funcionesExtras);
        const botonesExtras = funcionesExtras
            .map(funcion => {
                console.log('Configuración para función:', funcion);
                return funcionesExtrasConfig[funcion];
            })
            .filter(Boolean);

        console.log('Botones extras generados:', botonesExtras);

        if (botonesExtras.length > 0) {
            const submenuHTML = `
                <div class="submenu-container">
                    <button class="opcion-btn submenu-trigger" data-has-submenu="true">
                        <i class="fas fa-puzzle-piece"></i>
                        <span>Plugins</span>
                    </button>
                    <div class="submenu collapsed">
                        ${botonesExtras.map(boton => `
                            <button class="${boton.clase}" 
                                    data-vista="${boton.vista}" 
                                    ${boton.onclick}>
                                <i class="fas ${boton.icono}"></i>
                                <span>${boton.texto}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            menuSecundario.insertAdjacentHTML('beforeend', submenuHTML);

            // Agregar eventos al nuevo submenu
            const lastContainer = menuSecundario.querySelector('.submenu-container:last-child');
            const submenuButton = lastContainer.querySelector('[data-has-submenu]');
            const submenu = lastContainer.querySelector('.submenu');

            // Evento para el botón del submenu
            submenuButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                submenu.classList.toggle('collapsed');

                // Cerrar otros submenus
                document.querySelectorAll('.submenu:not(.collapsed)').forEach(other => {
                    if (other !== submenu) {
                        other.classList.add('collapsed');
                    }
                });
            });

            // Agregar eventos a los items del submenu
            submenu.querySelectorAll('.submenu-item').forEach(item => {
                item.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const vistaId = item.dataset.vista;
                    const vistaActual = document.querySelector(`.${vistaId}`);

                    if (vistaActual) {
                        // Ocultar todas las vistas
                        vistas.forEach(vista => {
                            vista.style.opacity = '0';
                            setTimeout(() => vista.style.display = 'none', 300);
                        });

                        // Ejecutar función onclick
                        const onclickFn = item.getAttribute('onclick')?.replace('onclick="', '').replace('"', '');
                        if (window[onclickFn]) {
                            await window[onclickFn]();
                        }

                        // Mostrar vista seleccionada
                        setTimeout(() => {
                            vistaActual.style.display = 'flex';
                            requestAnimationFrame(() => {
                                vistaActual.style.opacity = '1';
                            });
                        }, 300);

                        // Actualizar estados activos
                        menuSecundario.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('active'));
                        item.classList.add('active');
                        submenuButton.classList.add('active');

                        // Cerrar submenu después de la selección
                        submenu.classList.add('collapsed');
                    }
                });
            });
        }
    }

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
