/* =============== IMPORTACIONES DE TODOS LOS MODULOS DE JS =============== */
import { inicializarUsuarios, cargarUsuarios, mostrarDetallesUsuario, mostrarFormularioAgregarUsuario, mostrarFormularioDesactivarUsuario } from './modules/users.js';
import { editarRegistro,calcularTotal, pagarRegistro, eliminarRegistro, cargarRegistros, verificarRegistro } from './modules/vRegistros.js';
import { inicializarFormulario, inicializarFormularioProduccion, resetearFormulario, cargarProductos, mostrarFormularioProduccion } from './modules/formProduccion.js';
import { cargarRegistrosCuentas, mostrarDetalles, crearTarjetaRegistro } from './modules/misCuentasProduccion.js';
import { finalizarPedidos, confirmarFinalizacionPedidos, mostrarSugerenciaPedido, mostrarFormularioPedido } from './modules/newPedido.js';
import { inicializarCompras } from './modules/compras.js';
import { inicializarAlmacen, mostrarFormularioIngresoAcopio, mostrarFormularioSalidaAcopio } from './modules/almAcopio.js';
import { inicializarHome } from './modules/home.js';
import { initializeMenu} from './modules/menu.js';
import { initializePreciosPro } from './modules/preciosPro.js';
import { cargarNotificaciones} from './modules/advertencia.js';
import { cargarRegistrosAcopio } from './modules/regAcopio.js';
import { inicializarAlmacenGral,cargarAlmacen,mostrarProductos } from './modules/almacen.js';
import { cargarRegistrosAlmacenGral } from './modules/regAlmacen.js';
import { inicializarConfiguraciones } from './modules/configuraciones.js';
import { inicializarGestionPro } from './modules/gestionPro.js';
import { inicializarCalcularMP } from './modules/calcularMP.js';
import { initializeImgUpload } from './modules/imgUpload.js';

export function scrollToTop(ventana) {
    const container = document.querySelector(ventana);
    if (container) {
        container.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}
window.initializeImgUpload = initializeImgUpload;
window.scrollToTop = scrollToTop;

// Funciones del menú y navegación,
window.initializeMenu = initializeMenu;
window.initializePreciosPro = initializePreciosPro;
window.inicializarHome = inicializarHome;

// Funciones de gestión de usuarios y permisos
window.inicializarUsuarios = inicializarUsuarios;
window.cargarUsuarios = cargarUsuarios;
window.mostrarDetallesUsuario = mostrarDetallesUsuario;
window.mostrarFormularioAgregarUsuario = mostrarFormularioAgregarUsuario;
window.mostrarFormularioDesactivarUsuario = mostrarFormularioDesactivarUsuario;

// Funciones de gestión de registros y pagos
window.cargarRegistros = cargarRegistros;
window.verificarRegistro = verificarRegistro;
window.editarRegistro = editarRegistro;
window.eliminarRegistro = eliminarRegistro;
window.pagarRegistro = pagarRegistro;
window.calcularTotal = calcularTotal;

// Funciones de gestión de producción
window.inicializarFormulario = inicializarFormulario;
window.resetearFormulario = resetearFormulario;
window.inicializarFormularioProduccion = inicializarFormularioProduccion;
window.cargarProductos = cargarProductos;
window.mostrarFormularioProduccion = mostrarFormularioProduccion;

// Funciones de gestión de cuentas
window.cargarRegistrosCuentas = cargarRegistrosCuentas;
window.mostrarDetalles = mostrarDetalles;
window.crearTarjetaRegistro = crearTarjetaRegistro;

// Funciones de gestión de pedidos
window.mostrarFormularioPedido = mostrarFormularioPedido;
window.confirmarFinalizacionPedidos = confirmarFinalizacionPedidos;
window.finalizarPedidos = finalizarPedidos;
window.mosstrarSugerenciaPedido = mostrarSugerenciaPedido;

// Funciones de gestión de almacén Acopio
window.inicializarAlmacen = inicializarAlmacen;
window.mostrarFormularioIngresoAcopio = mostrarFormularioIngresoAcopio;
window.mostrarFormularioSalidaAcopio = mostrarFormularioSalidaAcopio;

// Funciones de gestión de compras
window.inicializarCompras = inicializarCompras;

// Funciones de notificaciones y sesión
window.mostrarNotificacion = mostrarNotificacion;
window.manejarCierreSesion = manejarCierreSesion;
window.cargarNotificaciones = cargarNotificaciones;

// Funciones de registros acopio
window.cargarRegistrosAcopio = cargarRegistrosAcopio;

// Funciones de registros almacen
window.cargarRegistrosAlmacenGral = cargarRegistrosAlmacenGral;

// Funciones de Almcen General
window.inicializarAlmacenGral = inicializarAlmacenGral;
window.cargarAlmacen = cargarAlmacen;
window.mostrarProductos = mostrarProductos;

// Funciones de configuraciones
window.inicializarConfiguraciones = inicializarConfiguraciones;

// Funciones de gestion produccion
window.inicializarGestionPro = inicializarGestionPro;

// Funciones de calcular materia prima
window.inicializarCalcularMP = inicializarCalcularMP;

window.ocultarCarga = ocultarCarga;
window.mostrarCarga = mostrarCarga;

/* =============== FUNCIONES DE INICIO APLICACION=============== */
async function bienvenida() {
    try {
        const response = await fetch('/obtener-mi-rol');
        const data = await response.json();

        if (data) {
            const dashboard = document.querySelector('.dashboard');
            if (dashboard) {
                dashboard.innerHTML = `
                    <div class="bienvenida">
                        <div class="profile-section">
                            <div class="profile-picture">
                                IP
                            </div>
                            <div class="profile-info">
                                <span class="profile-name">${data.nombre || 'Usuario'} <i class="fas fa-check-circle" style="color: orange; font-size: 0.8em;"></i></span>
                                <span class="profile-role">@${data.rol || 'Usuario'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="opciones"></div>
                    <div class="dashboard-buttons">
                        <button class="notifications-btn" onclick="mostrarNotificacionesPanel()">
                            <i class="fas fa-bell"></i>
                            <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                        </button>
                    </div>
                    <div class="profile-modal">
                        <div class="modal-content">
                            <button class="close-modal"><i class="fas fa-times"></i></button>
                            <div class="modal-profile-picture">
                                InnoPro
                            </div>
                            <div class="modal-profile-name">
                                ${data.nombre || 'Usuario'}
                                <i class="fas fa-check-circle" style="color:orange;"></i>
                            </div>
                            <div class="modal-profile-role">@${data.rol || 'Usuario'}</div>
                            <button class="logout-btn" onclick="manejarCierreSesion()">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                `;

                const profileSection = dashboard.querySelector('.profile-section');
                const modal = dashboard.querySelector('.profile-modal');
                const modalContent = modal.querySelector('.modal-content');
                const closeBtn = modal.querySelector('.close-modal');
                const menuSecundario = dashboard.querySelector('.menu-secundario');


                profileSection.addEventListener('click', () => {
                    document.querySelector('.anuncio').style.display = 'none';
                    modal.style.display = 'block';
                    setTimeout(() => {
                        modal.classList.add('show');
                        modalContent.classList.add('show');
                    }, 10);
                });

                function cerrarModal() {
                    modal.classList.remove('show');
                    modalContent.classList.remove('show');
                    modal.classList.add('hide');
                    modalContent.classList.add('hide');
                    setTimeout(() => {
                        modal.style.display = 'none';
                        modal.classList.remove('hide');
                        modalContent.classList.remove('hide');
                    }, 300);
                }

                closeBtn.addEventListener('click', cerrarModal);
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) cerrarModal();
                });
               
            }
        }
    } catch (error) {
        console.error('Error al obtener los datos:', error);
    }
}
async function obtenerRolUsuario() {
    try {
        const response = await fetch('/obtener-mi-rol');
        const data = await response.json();
        
        return {
            rol: data.rol,
            funcionesExtra: data.Extras ? [data.Extras] : [] // Convertir Extras a array
        };
    } catch (error) {
        console.error('Error al obtener rol:', error);
        return null;
    }
}
async function iniciarApp() {
    try {
        const opcionesDiv = document.querySelector('.opciones');
        const userData = await obtenerRolUsuario();
        
        // Verificar que existan los elementos necesarios
        if (!opcionesDiv) {
            console.warn('No se encontró el contenedor de opciones');
            return; // Salir si no existe
        }

        if (!userData || !userData.rol) {
            console.warn('No se pudo obtener la información del usuario');
            return;
        }

        const vistas = document.querySelectorAll('imgUpload-view, .calcularMP-view, .gestionPro-view, .configuraciones-view, .regAlmacen-view, .almacen-view, .regAcopio-view, .comprobante-view, .preciosPro-view, .home-view, .almPrima-view, .almAcopio-view, .compras-view, .newTarea-view, .usuarios-view, .verificarRegistros-view, .consultarRegistros-view, .formProduccion-view, .cuentasProduccion-view, .newPedido-view');

        // Ocultar todas las vistas inicialmente
        vistas.forEach(vista => {
            if (vista) {
                vista.style.display = 'none';
                vista.style.opacity = '0';
                vista.style.backgroundColor = '#1a1a1a';
                vista.style.color = '#ffffff';
            }
        });

        const roles = userData.rol.split(',').map(r => r.trim());

        // Asegurarse de que funcionesExtra sea un array
        const funcionesExtra = Array.isArray(userData.funcionesExtra) ? userData.funcionesExtra : [];
        
        // Inicializar el menú
        await initializeMenu(roles, opcionesDiv, vistas, funcionesExtra);
        await cargarNotificaciones();
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        mostrarNotificacion('Error al cargar el menú: ' + error.message, 'error');
    }
}

/* =============== FUNCIONES DE CIERRE DE SESION =============== */
async function manejarCierreSesion() {
    try {
        mostrarCarga();
        const response = await fetch('/cerrar-sesion', { method: 'POST' });
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

/* =============== FUNCIONES DE NOTIFICAIONES FLOTANTES =============== */
export function mostrarNotificacion(mensaje, tipo = 'success', duracion = 5000) {
    const notificador = document.querySelector('.notificador');
    if (!notificador) {
        console.warn('No se encontró el contenedor de notificaciones');
        return;
    }
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;

    let icono;
    switch (tipo) {
        case 'success':
            icono = 'fa-check-circle';
            break;
        case 'warning':
            icono = 'fa-exclamation-triangle';
            break;
        case 'error':
            icono = 'fa-times-circle';
            break;
    }

    notificacion.innerHTML = `
        <i class="fas ${icono}"></i>
        <span class="mensaje">${mensaje}</span>
        <button class="cerrar"><i class="fas fa-times"></i></button>
    `;

    notificador.appendChild(notificacion);

    // Manejar el cierre de la notificación
    const cerrarBtn = notificacion.querySelector('.cerrar');
    cerrarBtn.addEventListener('click', () => {
        notificacion.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => notificacion.remove(), 300);
    });

    // Auto-cerrar después de la duración especificada
    setTimeout(() => {
        if (notificacion.parentElement) {
            notificacion.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, duracion);
}

/* =============== FUNCIONES DE VISTAS DE ALMACENES =============== */
function limpiarVista(vista) {
    const container = document.querySelector(vista);
    if (container) {
        container.innerHTML = '';
        // Remover cualquier event listener específico si es necesario
    }
}
limpiarVista('.almacen-view');
limpiarVista('.almAcopio-view');

/* =============== FUNCIONES DE CARGA LOANDERS =============== */
export function mostrarCarga() {
    const cargaDiv = document.querySelector('.carga');
    if (cargaDiv) { // Verificar que existe
        cargaDiv.style.display = 'flex';
    }
}

export function ocultarCarga() {
    const cargaDiv = document.querySelector('.carga');
    if (cargaDiv) { // Verificar que existe
        cargaDiv.style.display = 'none';
    }
}

/* =============== FUNCIONES DE REGSITRO DE NOTIFIACION INICIAL =============== */
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

/* =============== FUNCIONES DE CENTRAR LAS INPUT EN TODOS LOS ANUNCIOS =============== */
function centrarInputEnFoco() {
    document.addEventListener('focusin', (e) => {
        if (e.target.tagName.toLowerCase() === 'input' || 
            e.target.tagName.toLowerCase() === 'select' || 
            e.target.tagName.toLowerCase() === 'textarea') {
            
            const contenedorRelleno = e.target.closest('.relleno');
            if (contenedorRelleno) {
                // Esperar un momento para asegurar que el teclado móvil se ha mostrado
                setTimeout(() => {
                    const inputRect = e.target.getBoundingClientRect();
                    const contenedorRect = contenedorRelleno.getBoundingClientRect();
                    
                    // Calcular la posición del scroll para centrar el input
                    const scrollOffset = (
                        inputRect.top + 
                        contenedorRelleno.scrollTop - 
                        contenedorRect.top - 
                        (contenedorRect.height / 2) + 
                        (inputRect.height / 2)
                    );
                    
                    contenedorRelleno.scrollTo({
                        top: scrollOffset,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    });
}


/* =============== FUNCIONES LLAMDO =============== */
document.addEventListener('DOMContentLoaded', async () => {
    let anuncio = document.querySelector('.anuncio');
    let dashboard = document.querySelector('.dashboard');
    let lastPopState = 0;
    
    // Función para ocultar el anuncio
    function ocultarAnuncio() {
        const anuncioVisible = document.querySelector('.anuncio');
        const overlay = document.querySelector('.overlay');
        const container = document.querySelector('.container');
        
        if (anuncioVisible && anuncioVisible.style.display === 'flex') {
            anuncioVisible.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
            if (container) container.classList.remove('no-touch');
            return true; // Indica que se ocultó un anuncio
        }
        return false; // Indica que no había anuncio que ocultar
    }

    // Manejar el botón físico atrás en dispositivos móviles
    if ('BeforeInstallPromptEvent' in window) {
        document.addEventListener('backbutton', (e) => {
            e.preventDefault();
            const anuncioVisible = document.querySelector('.anuncio');
            const advertenciaVisible = document.querySelector('.advertencia');
            
            if (anuncioVisible && anuncioVisible.style.display === 'flex') {
                ocultarAnuncio();
            } else if (advertenciaVisible && advertenciaVisible.style.display === 'flex') {
                advertenciaVisible.style.display = 'none';
                document.querySelector('.container').classList.remove('no-touch');
            } else {
                window.history.back();
            }
        }, false);
    }

    // Manejar el botón atrás del navegador
    window.addEventListener('popstate', (e) => {
        // Prevenir múltiples activaciones en dispositivos móviles
        const now = Date.now();
        if (now - lastPopState < 300) return;
        lastPopState = now;

        const anuncioVisible = document.querySelector('.anuncio');
        const advertenciaVisible = document.querySelector('.advertencia');
        
        if (anuncioVisible && anuncioVisible.style.display === 'flex') {
            ocultarAnuncio();
        } else if (advertenciaVisible && advertenciaVisible.style.display === 'flex') {
            advertenciaVisible.style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
        } else {
            window.location.reload();
        }
    });
    
    // Cuando se muestre el anuncio, agregar una entrada al historial
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.style.display === 'flex') {
                history.pushState(null, '', window.location.pathname);
            }
        });
    });
    
    if (anuncio) {
        observer.observe(anuncio, { attributes: true, attributeFilter: ['style'] });
    }

    // Event listeners para cerrar al hacer clic
    anuncio.addEventListener('click', (e) => {
        if (e.target === anuncio) {
            ocultarAnuncio();
        }
    });

    dashboard.addEventListener('click', () => {
        if (anuncio.style.display === 'flex') {
            ocultarAnuncio();
        }
    });

    try {
        bienvenida();
        await iniciarApp();
        await inicializarHome();
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
    centrarInputEnFoco();
});

/* =============== FUNCIONES DE MOSTRAR NOTIFIACION INICIAL=============== */
window.mostrarNotificacionesPanel = async function() {
    try {
        mostrarCarga();
        const advertenciaDiv = document.querySelector('.advertencia');
        if (!advertenciaDiv) {
            console.error('No se encontró el elemento .advertencia');
            return;
        }
        
        if (advertenciaDiv.style.display === 'flex') {
            advertenciaDiv.style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
        } else {
            // La clase no-touch se manejará dentro de cargarNotificaciones
            await cargarNotificaciones();
        }
    } catch (error) {
        console.error('Error al mostrar notificaciones:', error);
        mostrarNotificacion('Error al mostrar notificaciones', 'error');
        document.querySelector('.container').classList.remove('no-touch');
    } finally {
        ocultarCarga();
    }
};
/* =============== FUNCIONES DE CONTADOR DE NOTIFIACIONES =============== */
window.actualizarContadorNotificaciones = function(cantidad) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (cantidad > 0) {
            badge.textContent = cantidad;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
};




