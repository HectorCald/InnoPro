/* =============== FUNCIONES DE INCIO DE MENU=============== */

// Añadir esta función al inicio del archivo
const funcionesPorRol = {
    'Producción': ['inicializarHome', 'cargarRegistrosCuentas', 'inicializarGestionPro', 'inicializarConfiguraciones'],
    'Acopio': ['inicializarHome', 'inicializarAlmacen', 'cargarRegistrosAcopio', 'inicializarConfiguraciones'],
    'Almacen': ['inicializarHome', 'cargarRegistros', 'inicializarAlmacenGral', 'cargarRegistrosAlmacenGral', 'inicializarConfiguraciones'],
    'Administración': [
        'inicializarHome', 'inicializarAlmacen', 'cargarRegistrosAcopio', 'inicializarCompras',
        'cargarRegistros', 'initializePreciosPro', 'inicializarAlmacenGral',
        'cargarRegistrosAlmacenGral', 'inicializarUsuarios', 'inicializarConfiguraciones'
    ]
};
const funcionToText = {
    'inicializarHome': 'Inicio',
    'cargarRegistrosCuentas': 'Registros de Producción',
    'inicializarGestionPro': 'Estadísticas',
    'inicializarConfiguraciones': 'Ajustes',
    'inicializarAlmacen': 'Gestionar Acopio',
    'cargarRegistrosAcopio': 'Registros de Acopio',
    'cargarRegistros': 'Verificar Registros',
    'inicializarAlmacenGral': 'Gestionar Almacén',
    'cargarRegistrosAlmacenGral': 'Registros de Almacén',
    'inicializarCompras': 'Compras',
    'initializePreciosPro': 'Precios',
    'inicializarUsuarios': 'Usuarios'
};
function initializeLoadingScreen(roles) {
    const screenCarga = document.querySelector('.screen-carga');
    if (!screenCarga) return;

    screenCarga.style.display = 'flex';
    screenCarga.style.opacity = '1';

    // Crear contenido dinámico
    screenCarga.innerHTML = `
        <img src="/icons/icon-512x512.png" alt="Logo" class="logo">
        <div class="progress-container">
            <div class="progress-bar"></div>
        </div>
        <div class="loading-text">Cargando...</div>
        <div class="loading-status"></div>
    `;

    const progressBar = screenCarga.querySelector('.progress-bar');
    const loadingText = screenCarga.querySelector('.loading-text');
    const loadingStatus = screenCarga.querySelector('.loading-status');

    // Calcular total de vistas a cargar
    let totalVistas = 0;
    let vistasCompletadas = 0;
    let tiempoInicio = Date.now();

    roles.forEach(rol => {
        const funcionesRol = funcionesPorRol[rol] || [];
        totalVistas += funcionesRol.length;
    });

    // Verificar conexión a internet
    const checkConnection = () => {
        if (!navigator.onLine) {
            loadingStatus.textContent = '❌ Sin conexión a internet';
            return false;
        }
        return true;
    };

    // Verificar velocidad de carga
    const checkLoadSpeed = () => {
        const tiempoTranscurrido = Date.now() - tiempoInicio;
        if (tiempoTranscurrido > 5000 && vistasCompletadas < totalVistas * 0.3) {
            loadingStatus.className = 'loading-status warning';
            loadingStatus.textContent = '⚠️ La conexión está lenta...';
            return false;
        }
        return true;
    };

    // Función para actualizar progreso
    function actualizarProgreso(vista) {
        if (!checkConnection()) return;
        checkLoadSpeed();

        // Eliminar el incremento automático
        const porcentaje = (vistasCompletadas / totalVistas) * 100;
        progressBar.style.width = `${porcentaje}%`;

        // Actualizar texto con reintentos
        const vistaText = funcionToText[vista] || vista;
        loadingText.textContent = `Cargando ${vistaText}... ${Math.round(porcentaje)}%${intentos > 1 ? ` [Intentos: ${intentos}]` : ''}`;

        // Rest of the function remains the same
        if (vistasCompletadas >= totalVistas) {
            loadingStatus.className = 'loading-status success';
            loadingStatus.textContent = 'Carga completada';
            setTimeout(() => {
                screenCarga.classList.add('hidden');
                setTimeout(() => {
                    screenCarga.style.display = 'none';
                }, 500);
            }, 500);
        }
    }
    let intentos = 0;
    
    async function ejecutarFuncionConReintentos(funcion) {
        let exitoso = false;
        while (!exitoso) {
            try {
                await window[funcion]();
                exitoso = true;
                vistasCompletadas++;
                actualizarProgreso(funcion);
            } catch (error) {
                intentos++;
                console.error(`Error en ${funcion} (intento ${intentos}):`, error);
                loadingStatus.className = 'loading-status warning';
                loadingStatus.textContent = `⚠️ Fallo en ${funcionToText[funcion]}. Reintentando...`;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
            }
        }
    }

    // Agregar event listeners para conexión
    window.addEventListener('online', () => {
        loadingStatus.className = 'loading-status success';
        loadingStatus.textContent = '🔄 Conexión restaurada';
    });

    window.addEventListener('offline', () => {
        loadingStatus.className = 'loading-status error';
        loadingStatus.textContent = '❌ Sin conexión a internet';
    });


    // No ocultar carga aquí
    return { 
        actualizarProgreso, 
        ejecutarFuncionConReintentos // Añadir esta línea
    };
}
export async function initializeMenu(roles, opcionesDiv, vistas, funcionesExtras = []) {
    try {
        const { actualizarProgreso, ejecutarFuncionConReintentos } = initializeLoadingScreen(roles); 
        await new Promise(resolve => setTimeout(resolve, 10));

        const { menuPrincipal, menuSecundario, overlay } = initializeMenuStructure(opcionesDiv);
        // Inicializamos los eventos del menú
        initializeMenuEvents(menuPrincipal, menuSecundario, overlay);

        // Inicializar todas las funciones del rol actual
        for (const rol of roles) {
            const funciones = funcionesPorRol[rol] || [];
            for (const funcion of funciones) {
                if (typeof window[funcion] === 'function') {
                    await ejecutarFuncionConReintentos(funcion); // Usar la nueva función de reintentos
                }
            }
        }

        // Inicializar funciones extras si existen
        if (funcionesExtras && funcionesExtras.length > 0) {
            for (const funcion of funcionesExtras) {
                const funcionName = `inicializar${funcion}`;
                if (typeof window[funcionName] === 'function') {
                    try {
                        await window[funcionName]();
                        console.log(`Inicializada función extra: ${funcionName}`);
                    } catch (error) {
                        console.error(`Error al inicializar función extra ${funcionName}:`, error);
                    }
                }
            }
        }

        // Inicializar los botones del menú
        const extrasArray = Array.isArray(funcionesExtras) ? funcionesExtras : [];
        initializeMenuButtons(roles, menuSecundario, vistas, menuPrincipal, overlay, extrasArray);

        // Manejar eventos de scroll y click
        const container = document.querySelector('.container');
        const handleSubmenuCollapse = () => {
            document.querySelectorAll('.submenu:not(.collapsed)').forEach(submenu => {
                submenu.classList.add('collapsed');
                const arrow = submenu.parentElement.querySelector('.submenu-arrow');
                if (arrow) {
                    arrow.style.transform = 'rotate(0deg)';
                }
            });
        };

        // Agregar eventos de scroll a las vistas
        vistas.forEach(vista => {
            vista.addEventListener('scroll', handleSubmenuCollapse);
        });

        // Agregar eventos al contenedor principal
        if (container) {
            container.addEventListener('scroll', handleSubmenuCollapse);
            container.addEventListener('click', (e) => {
                if (!e.target.closest('.submenu-container')) {
                    handleSubmenuCollapse();
                }
            });
        }

        // Prevenir propagación de clicks en el menú secundario
        if (menuSecundario) {
            menuSecundario.addEventListener('click', (e) => e.stopPropagation());
        }

        // Cargar vista inicial después de que todo esté inicializado
        const vistaInicial = document.querySelector('.home-view');
        if (vistaInicial) {
            vistaInicial.style.display = 'flex';
            setTimeout(() => {
                vistaInicial.style.opacity = '1';
            }, 100);
        }


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
            if (menuSecundario) menuSecundario.classList.add('active');
            if (overlay) overlay.classList.remove('active');
        }
    };

    handleDesktopMenu();
    window.addEventListener('resize', handleDesktopMenu);

    // Mobile menu events
    if (menuPrincipal && menuSecundario && overlay) {
        menuPrincipal.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) {
                e.stopPropagation();
                menuPrincipal.classList.toggle('active');
                menuSecundario.classList.toggle('active');
                overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
            }
        });
    }

    document.addEventListener('click', () => {
        if (window.innerWidth < 1024 &&
            menuPrincipal &&
            menuSecundario &&
            overlay &&
            menuPrincipal.classList.contains('active')) {
            menuPrincipal.classList.remove('active');
            menuSecundario.classList.remove('active');
            overlay.style.display = 'none';
        }
    });

    if (menuSecundario) {
        menuSecundario.addEventListener('click', (e) => e.stopPropagation());
    }
}
function initializeMenuButtons(roles, menuSecundario, vistas, menuPrincipal, overlay, funcionesExtras = []) {
    const botonesRoles = {
        'Producción': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio' },
            { clase: 'opcion-btn', vista: 'cuentasProduccion-view', icono: 'fa-history', texto: 'Registros' },
            { clase: 'opcion-btn', vista: 'gestionPro-view', icono: 'fa-chart-line', texto: 'Estadisticas' },
            { clase: 'opcion-btn', vista: 'configuraciones-view', icono: 'fa-cog', texto: 'Ajustes' }
        ],
        'Acopio': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio' },
            { clase: 'opcion-btn', vista: 'almAcopio-view', icono: 'fa-dolly', texto: 'Gestionar' },
            { clase: 'opcion-btn', vista: 'regAcopio-view', icono: 'fa-history', texto: 'Registros' },
            { clase: 'opcion-btn', vista: 'configuraciones-view', icono: 'fa-cog', texto: 'Ajustes' }
        ],
        'Almacen': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio' },
            { clase: 'opcion-btn', vista: 'verificarRegistros-view', icono: 'fa-check-double', texto: 'Verificar' },
            { clase: 'opcion-btn', vista: 'almacen-view', icono: 'fa-dolly', texto: 'Gestionar' },
            { clase: 'opcion-btn', vista: 'regAlmacen-view', icono: 'fa-history', texto: 'Registros' },
            { clase: 'opcion-btn', vista: 'configuraciones-view', icono: 'fa-cog', texto: 'Ajustes' }
        ],
        'Administración': [
            { clase: 'opcion-btn', vista: 'home-view', icono: 'fa-home', texto: 'Inicio' },
            {
                clase: 'opcion-btn submenu-trigger',
                icono: 'fa-mortar-pestle',
                texto: 'Acopio',
                submenu: [
                    { clase: 'opcion-btn submenu-item', vista: 'almAcopio-view', icono: 'fa-dolly', texto: 'Gestionar' },
                    { clase: 'opcion-btn submenu-item', vista: 'regAcopio-view', icono: 'fa-history', texto: 'Registros' },
                    { clase: 'opcion-btn submenu-item', vista: 'compras-view', icono: 'fa-shopping-cart', texto: 'Compras' }
                ]
            },
            {
                clase: 'opcion-btn submenu-trigger',
                icono: 'fa-industry',
                texto: 'Producción',
                submenu: [
                    { clase: 'opcion-btn submenu-item', vista: 'verificarRegistros-view', icono: 'fa-history', texto: 'Registros' },
                    { clase: 'opcion-btn submenu-item', vista: 'preciosPro-view', icono: 'fa-dollar-sign', texto: 'Precios' }

                ]
            },
            {
                clase: 'opcion-btn submenu-trigger',
                icono: 'fa-warehouse',
                texto: 'Almacen',
                submenu: [
                    { clase: 'opcion-btn submenu-item', vista: 'almacen-view', icono: 'fa-dolly', texto: 'Gestionar' },
                    { clase: 'opcion-btn submenu-item', vista: 'regAlmacen-view', icono: 'fa-history', texto: 'Registros' }

                ]
            },
            {
                clase: 'opcion-btn submenu-trigger',
                icono: 'fa-ellipsis-h',
                texto: 'Otros',
                submenu: [
                    { clase: 'opcion-btn submenu-item', vista: 'usuarios-view', icono: 'fa-users-cog', texto: 'Usuarios' },
                    { clase: 'opcion-btn submenu-item', vista: 'configuraciones-view', icono: 'fa-cog', texto: 'Ajustes' }
                ]
            }

        ]
    };
    const funcionesExtrasConfig = {
        'CalcularMP': {
            clase: 'opcion-btn submenu-item',
            vista: 'calcularMP-view',
            icono: 'fa-puzzle-piece',
            texto: 'Calcular MP'
        }
    };
    function cargarVistaInicial() {
        const vistaInicial = document.querySelector('.home-view');
        const botonInicio = menuSecundario.querySelector('[data-vista="home-view"]');

        if (vistaInicial && botonInicio) {
            // Ocultar todas las vistas
            vistas.forEach(vista => {
                vista.style.display = 'none';
                vista.style.opacity = '0';
            });

            // Mostrar vista inicial
            vistaInicial.style.display = 'flex';
            vistaInicial.style.opacity = '1';

            // Desactivar todos los botones y activar inicio
            menuSecundario.querySelectorAll('.opcion-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            botonInicio.classList.add('active');
        }
    }


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
                                            data-vista="${subItem.vista}">
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

                    submenu.querySelectorAll('.submenu-item').forEach(item => {
                        item.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            const vistaId = item.dataset.vista;
                            const vistaActual = document.querySelector(`.${vistaId}`);

                            if (vistaActual) {
                                // Ocultar vistas de forma más eficiente
                                vistas.forEach(vista => {
                                    vista.style.display = 'none';
                                    vista.style.opacity = '0';
                                });

                                // Mostrar nueva vista inmediatamente
                                vistaActual.style.display = 'flex';
                                requestAnimationFrame(() => {
                                    vistaActual.style.opacity = '1';
                                });

                                // Actualizar estados activos
                                menuSecundario.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('active'));
                                item.classList.add('active');
                                submenuButton.classList.add('active');

                                // Cerrar submenu
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
                    const btnHTML = `
                        <button class="${boton.clase}${esElPrimero ? ' active' : ''}" 
                                data-vista="${boton.vista}">
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
                            // Ya no necesitamos esta parte porque las funciones se inicializan al principio
                            esElPrimero = false;
                        }
                    }
                }


            });
        }
    });
    cargarVistaInicial();

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
                                    data-vista="${boton.vista}">
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

            submenu.querySelectorAll('.submenu-item').forEach(item => {
                handleLongPress(item, async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const vistaId = item.dataset.vista;

                    // Check if the view is currently active
                    const vistaActual = document.querySelector(`.${vistaId}`);
                    if (!vistaActual || vistaActual.style.display !== 'flex') {
                        console.log('⚠️ Esta vista no está activa');
                        return;
                    }

                    const funcionesEspeciales = {
                        'regAcopio-view': 'cargarRegistrosAcopio',
                        'verificarRegistros-view': 'cargarRegistros',
                        'regAlmacen-view': 'cargarRegistrosAlmacenGral',
                        'preciosPro-view': 'initializePreciosPro',
                        'usuarios-view': 'inicializarUsuarios',
                        'almAcopio-view': 'inicializarAlmacen',
                        'almacen-view': 'inicializarAlmacenGral',
                        'compras-view': 'inicializarCompras',
                        'cuentasProduccion-view': 'cargarRegistrosCuentas',
                        'gestionPro-view': 'inicializarGestionPro',
                        'configuraciones-view': 'inicializarConfiguraciones'
                        // Agregar todas las demás vistas necesarias
                    };

                    const functionName = funcionesEspeciales[vistaId];

                    console.log(`🔄 Intentando ejecutar función: ${functionName} para vista: ${vistaId}`);

                    if (typeof window[functionName] === 'function') {
                        try {
                            await window[functionName]();
                            console.log(`✅ Vista ${vistaId} recargada exitosamente con función ${functionName}`);
                        } catch (error) {
                            console.error(`❌ Error al recargar ${vistaId} con función ${functionName}:`, error);
                        }
                    } else {
                        console.warn(`⚠️ No se encontró la función ${functionName} para la vista ${vistaId}`);
                    }
                });

                // Modify the click event to properly set active states
                item.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const vistaId = item.dataset.vista;
                    const vistaActual = document.querySelector(`.${vistaId}`);

                    if (vistaActual) {
                        // Ocultar vistas
                        vistas.forEach(vista => {
                            vista.style.display = 'none';
                            vista.style.opacity = '0';
                        });

                        // Mostrar nueva vista
                        vistaActual.style.display = 'flex';
                        requestAnimationFrame(() => {
                            vistaActual.style.opacity = '1';
                        });

                        // Actualizar estados activos
                        menuSecundario.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('active'));
                        menuSecundario.querySelectorAll('.submenu-item').forEach(b => b.classList.remove('active'));
                        item.classList.add('active');
                        submenuButton.classList.add('active');

                        // Cerrar submenu
                        submenu.classList.add('collapsed');
                    }
                });
            });
        }
    }

    // Handle regular button clicks
    // Handle regular button clicks
    menuSecundario.querySelectorAll('.opcion-btn:not([data-has-submenu])').forEach(boton => {
        handleLongPress(boton, async (e) => {
            e.preventDefault();
            const vistaId = boton.dataset.vista;


            const funcionesEspeciales = {
                'regAcopio-view': 'cargarRegistrosAcopio',
                'verificarRegistros-view': 'cargarRegistros',
                'regAlmacen-view': 'cargarRegistrosAlmacenGral',
                'preciosPro-view': 'initializePreciosPro',
                'usuarios-view': 'inicializarUsuarios',
                'almAcopio-view': 'inicializarAlmacen',
                'almacen-view': 'inicializarAlmacenGral',
                'compras-view': 'inicializarCompras',
                'cuentasProduccion-view': 'cargarRegistrosCuentas',
                'gestionPro-view': 'inicializarGestionPro',
                'configuraciones-view': 'inicializarConfiguraciones',
                'home-view': 'inicializarHome'
            };

            const functionName = funcionesEspeciales[vistaId];

            console.log(`🔄 Intentando ejecutar función: ${functionName} para vista: ${vistaId}`);

            if (typeof window[functionName] === 'function') {
                try {
                    await window[functionName]();
                    console.log(`✅ Vista ${vistaId} recargada exitosamente con función ${functionName}`);
                } catch (error) {
                    console.error(`❌ Error al recargar ${vistaId} con función ${functionName}:`, error);
                }
            } else {
                console.warn(`⚠️ No se encontró la función ${functionName} para la vista ${vistaId}`);
            }
        });
        boton.addEventListener('click', async (e) => {
            if (boton.classList.contains('active')) return;

            const vistaId = boton.dataset.vista;
            const vistaActual = document.querySelector(`.${vistaId}`);

            if (vistaActual) {
                // Ocultar vistas de forma más eficiente
                vistas.forEach(vista => {
                    vista.style.display = 'none';
                    vista.style.opacity = '0';
                });

                // Ocultar anuncio si existe
                if (typeof ocultarAnuncio === 'function') {
                    ocultarAnuncio();
                }

                // Mostrar nueva vista inmediatamente
                vistaActual.style.display = 'flex';
                requestAnimationFrame(() => {
                    vistaActual.style.opacity = '1';
                });

                // Actualizar estados activos
                menuSecundario.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('active'));
                boton.classList.add('active');
            }
        });
    });
    menuSecundario.querySelectorAll('.opcion-btn').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const vistaId = boton.dataset.vista;
            if (vistaId) {
                cambiarVista(vistaId);
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
            if (typeof ocultarAnuncio === 'function') {
                ocultarAnuncio();
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
function handleLongPress(element, callback, duration = 500) {
    let timer;
    let isPressed = false;

    element.addEventListener('mousedown', startPress);
    element.addEventListener('touchstart', startPress, { passive: true });
    element.addEventListener('mouseup', endPress);
    element.addEventListener('mouseleave', endPress);
    element.addEventListener('touchend', endPress);
    element.addEventListener('touchcancel', endPress);

    function startPress(e) {
        // Solo proceder si el elemento está activo
        if (!element.classList.contains('active')) {
            console.log('⚠️ El botón debe estar activo para recargar');
            return;
        }

        isPressed = true;
        timer = setTimeout(async () => {
            if (isPressed) {
                console.log('🔄 Recargando vista por presión larga...');
                await callback(e);
            }
        }, duration);
    }

    function endPress() {
        isPressed = false;
        clearTimeout(timer);
    }
}


const historialNavegacion = [];

function agregarAlHistorial(vista) {
    // Evitar duplicados consecutivos
    if (historialNavegacion[historialNavegacion.length - 1] !== vista) {
        historialNavegacion.push(vista);
    }
}

// ... código existente ...

export function regresarAInicio() {
    const homeView = document.querySelector('.home-view');
    if (!homeView) return;

    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
        v.style.opacity = '0';
    });

    // Mostrar vista inicio
    homeView.style.display = 'flex';
    homeView.style.opacity = '1';
    homeView.classList.add('active');

    // Actualizar botón activo
    document.querySelectorAll('.opcion-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const botonInicio = document.querySelector('[data-vista="home-view"]');
    if (botonInicio) {
        botonInicio.classList.add('active');
    }

    // Actualizar el historial del navegador
    window.history.replaceState({ vista: 'home' }, '', window.location.href);
    
    // Limpiar el historial interno y agregar inicio
    historialNavegacion.length = 0;
    agregarAlHistorial('home-view');
    
    // Forzar actualización del estado de navegación
    window.dispatchEvent(new Event('popstate'));
}

// Modificar la función cambiarVista
function cambiarVista(vistaId) {
    // Solo agregar al historial si no es la misma vista
    if (historialNavegacion[historialNavegacion.length - 1] !== vistaId) {
        agregarAlHistorial(vistaId);
    }
    
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
        v.style.opacity = '0';
    });

    // Mostrar nueva vista
    const vistaActual = document.querySelector(`.${vistaId}`);
    if (vistaActual) {
        vistaActual.style.display = 'flex';
        setTimeout(() => {
            vistaActual.style.opacity = '1';
        }, 10);
    }

    // Actualizar historial del navegador
    window.history.pushState({ vista: vistaId }, '', window.location.href);
}

// Agregar manejo del evento popstate
window.addEventListener('popstate', (event) => {
    const vistaActual = event.state?.vista || 'home-view';
    
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
        v.style.opacity = '0';
    });

    // Mostrar la vista correspondiente
    const nuevaVista = document.querySelector(`.${vistaActual}`);
    if (nuevaVista) {
        nuevaVista.style.display = 'flex';
        setTimeout(() => {
            nuevaVista.style.opacity = '1';
        }, 10);
    }

    // Actualizar botón activo
    document.querySelectorAll('.opcion-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const botonActivo = document.querySelector(`[data-vista="${vistaActual}"]`);
    if (botonActivo) {
        botonActivo.classList.add('active');
    }
});

// ... resto del código ...
