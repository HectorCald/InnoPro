import { cargarUsuarios, editarUsuario, eliminarUsuario, agregarUsuario, mostrarPermisos, agregarPermiso, eliminarPermiso } from './modules/users.js';
import { pagarRegistro, eliminarRegistro, cargarRegistros, verificarRegistro } from './modules/vRegistros.js';
import { buscarRegistros, mostrarResultadosBusqueda, inicializarConsulta, limpiarFiltros } from './modules/cRegistros.js';
import { inicializarFormulario, inicializarFormularioProduccion, resetearFormulario, cargarProductos } from './modules/formProduccion.js';
import { cargarRegistrosCuentas, mostrarDetalles, crearTarjetaRegistro } from './modules/misCuentasProduccion.js';
import { confirmarRechazo, mostrarFormularioRechazo, togglePedidosRecibidos, mostrarFormularioIngreso, procesarIngreso, togglePedidosArchivados, finalizarPedidos, confirmarFinalizacionPedidos, inicializarPedidos, mostrarFormularioPedido, cargarPedidos, guardarPedido, cerrarFormularioPedido, eliminarPedido, mostrarConfirmacionEliminar } from './modules/newPedido.js';
import { mostrarProgramaAcopio, verProgramaciones, mostrarHistorialTareas, toggleProcesos, mostrarProcesos, finalizarProceso, inicializarTareas, mostrarFormularioTarea, cargarTareasEnProceso, iniciarCronometro, agregarProceso, pausarTarea, finalizarTarea } from './modules/newTarea.js';
import { inicializarCompras } from './modules/compras.js';
import { inicializarAlmacen } from './modules/almAcopio.js';
import { inicializarAlmacenPrima } from './modules/almPrima.js';
import { inicializarHome } from './modules/home.js';
import { initializeMenu } from './modules/menu.js';
import { initializePreciosPro } from './modules/preciosPro.js';
window.initializeMenu = initializeMenu;
window.mostrarNotificacion = mostrarNotificacion;
window.mostrarPermisos = mostrarPermisos;
window.agregarPermiso = agregarPermiso;
window.eliminarPermiso = eliminarPermiso;
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.agregarUsuario = agregarUsuario;
window.manejarCierreSesion = manejarCierreSesion;
window.toggleAcciones = (pin) => {
    const acciones = document.getElementById(`acciones-${pin}`);
    if (acciones) {
        // Cerrar todas las demás acciones primero
        document.querySelectorAll('.acciones').forEach(acc => {
            if (acc.id !== `acciones-${pin}`) {
                acc.classList.remove('active');
            }
        });
        // Toggle las acciones del usuario seleccionado
        acciones.classList.toggle('active');
    }
};
window.cargarRegistros = cargarRegistros;
window.verificarRegistro = verificarRegistro;
window.buscarRegistros = buscarRegistros;
window.mostrarResultadosBusqueda = mostrarResultadosBusqueda;
window.inicializarFormulario = inicializarFormulario;
window.resetearFormulario = resetearFormulario;
window.inicializarFormularioProduccion = inicializarFormularioProduccion;
window.cargarProductos = cargarProductos;
window.cargarRegistrosCuentas = cargarRegistrosCuentas;
window.mostrarDetalles = mostrarDetalles;
window.crearTarjetaRegistro = crearTarjetaRegistro;
window.limpiarFiltros = limpiarFiltros;
window.inicializarPedidos = inicializarPedidos;
window.mostrarFormularioPedido = mostrarFormularioPedido;
window.cargarPedidos = cargarPedidos;
window.guardarPedido = guardarPedido;
window.cerrarFormularioPedido = cerrarFormularioPedido;
window.eliminarPedido = eliminarPedido;
window.mostrarConfirmacionEliminar = mostrarConfirmacionEliminar;
window.confirmarFinalizacionPedidos = confirmarFinalizacionPedidos;
window.finalizarPedidos = finalizarPedidos;
window.togglePedidosArchivados = togglePedidosArchivados;
window.togglePedidosRecibidos = togglePedidosRecibidos;
window.procesarIngreso = procesarIngreso;
window.inicializarTareas = inicializarTareas;
window.mostrarFormularioTarea = mostrarFormularioTarea;
window.cargarTareasEnProceso = cargarTareasEnProceso;
window.iniciarCronometro = iniciarCronometro;
window.agregarProceso = agregarProceso;
window.pausarTarea = pausarTarea;
window.finalizarTarea = finalizarTarea;
window.agregarProceso = agregarProceso;
window.finalizarProceso = finalizarProceso;
window.mostrarProcesos = mostrarProcesos;
window.toggleProcesos = toggleProcesos;
window.mostrarHistorialTareas = mostrarHistorialTareas;
window.eliminarRegistro = eliminarRegistro;
window.mostrarFormularioRechazo = mostrarFormularioRechazo;
window.mostrarFormularioIngreso = mostrarFormularioIngreso;
window.confirmarRechazo = confirmarRechazo;
window.inicializarCompras = inicializarCompras;
window.verProgramaciones = verProgramaciones;
window.mostrarProgramaAcopio = mostrarProgramaAcopio;
window.inicializarAlmacen = inicializarAlmacen;
window.inicializarAlmacenPrima = inicializarAlmacenPrima;
window.inicializarHome = inicializarHome;
window.cargarUsuarios = cargarUsuarios;
window.inicializarConsulta = inicializarConsulta;
window.pagarRegistro = pagarRegistro;
window.initializePreciosPro = initializePreciosPro;
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
                            <img src="/img/Logotipo-damabrava.png" alt="Perfil" class="profile-image">
                            <div class="profile-info">
                                <span class="profile-name">${data.nombre || 'Usuario'} <i class="fas fa-check-circle" style="color: #4CAF50; font-size: 0.8em;"></i></span>
                                <span class="profile-role">@${data.rol || 'Usuario'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="opciones"></div>
                    <button class="logout-btn" onclick="manejarCierreSesion()">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Cerrar Sesión</span>
                    </button>
                    <div class="profile-modal">
                        <div class="modal-content">
                            <button class="close-modal"><i class="fas fa-times"></i></button>
                            <img src="/img/Logotipo-damabrava.png" alt="Perfil" class="modal-profile-image">
                            <div class="modal-profile-name">
                                ${data.nombre || 'Usuario'}
                                <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
                            </div>
                            <div class="modal-profile-role">@${data.rol || 'Usuario'}</div>
                            <div class="theme-switch">
                                <i class="fas fa-moon theme-icon"></i>
                                <label class="switch">
                                    <input type="checkbox" id="themeToggle">
                                    <span class="slider"></span>
                                </label>
                                <i class="fas fa-sun theme-icon"></i>
                            </div>
                        </div>
                    </div>
                `;

                const profileSection = dashboard.querySelector('.profile-section');
                const modal = dashboard.querySelector('.profile-modal');
                const modalContent = modal.querySelector('.modal-content');
                const closeBtn = modal.querySelector('.close-modal');
                const themeToggle = modal.querySelector('#themeToggle');
                const menuSecundario = dashboard.querySelector('.menu-secundario');

                // Verificar y aplicar el tema guardado
                const currentTheme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', currentTheme);
                themeToggle.checked = currentTheme === 'light';

                // Manejar cambios en el tema
                themeToggle.addEventListener('change', function() {
                    const newTheme = this.checked ? 'light' : 'dark';
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem('theme', newTheme);
                });

                profileSection.addEventListener('click', () => {
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
export function mostrarNotificacion(mensaje, tipo = 'success', duracion = 5000) {
    const notificador = document.querySelector('.notificador');
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
async function obtenerRolUsuario() {
    try {
        const response = await fetch('/obtener-mi-rol');
        const data = await response.json();
        if (!data.rol) {
            console.error('No se encontró rol en la respuesta');
            return null;
        }
        return data.rol;
    } catch (error) {
        console.error('Error al obtener rol del usuario:', error);
        return null;
    }
}
async function iniciarApp() {
    const rol = await obtenerRolUsuario();
    const opcionesDiv = document.querySelector('.opciones');
    const vistas = document.querySelectorAll('.home-view, .almPrima-view, .almAcopio-view, .compras-view, .newTarea-view, .usuarios-view, .verificarRegistros-view, .consultarRegistros-view, .formProduccion-view, .cuentasProduccion-view, .newPedido-view, .almAcopio-view, .almPrima-view');

    // Ocultar todas las vistas inicialmente
    vistas.forEach(vista => {
        vista.style.display = 'none';
        vista.style.opacity = '0';
        vista.style.backgroundColor = '#1a1a1a';
        vista.style.color = '#ffffff';
    });

    // Dividir los roles si hay múltiples
    const roles = rol ? rol.split(',').map(r => r.trim()) : [];

    // Inicializar el menú
    initializeMenu(roles, opcionesDiv, vistas);
}
function mostrarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'flex';
}
function ocultarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'none';
}
document.addEventListener('DOMContentLoaded', () => {
    iniciarApp();
    bienvenida();
    inicializarHome();
    
});




