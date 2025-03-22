import { cargarUsuarios, editarUsuario, eliminarUsuario, agregarUsuario, mostrarPermisos, agregarPermiso, eliminarPermiso } from './modules/users.js';
import { eliminarRegistro, cargarRegistros, verificarRegistro } from './modules/vRegistros.js';
import { buscarRegistros, mostrarResultadosBusqueda, inicializarConsulta, limpiarFiltros } from './modules/cRegistros.js';
import { inicializarFormulario, inicializarFormularioProduccion, resetearFormulario, cargarProductos } from './modules/formProduccion.js';
import { cargarRegistrosCuentas, mostrarDetalles, crearTarjetaRegistro } from './modules/misCuentasProduccion.js';
import {confirmarRechazo, mostrarFormularioRechazo, togglePedidosRecibidos, mostrarFormularioIngreso, procesarIngreso,togglePedidosArchivados, finalizarPedidos,confirmarFinalizacionPedidos, inicializarPedidos, mostrarFormularioPedido, cargarPedidos, guardarPedido, cerrarFormularioPedido, eliminarPedido, mostrarConfirmacionEliminar} from './modules/newPedido.js';
import {mostrarHistorialTareas,toggleProcesos,mostrarProcesos,pausarProceso, finalizarProceso,inicializarTareas, mostrarFormularioTarea, cargarTareasEnProceso, guardarTarea, iniciarCronometro, agregarProceso, pausarTarea, finalizarTarea} from './modules/newTarea.js';
import {inicializarCompras} from './modules/compras.js';
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
window.guardarTarea = guardarTarea;
window.iniciarCronometro = iniciarCronometro;
window.agregarProceso = agregarProceso;
window.pausarTarea = pausarTarea;
window.finalizarTarea = finalizarTarea;
window.agregarProceso = agregarProceso;
window.pausarProceso = pausarProceso;
window.finalizarProceso = finalizarProceso;
window.mostrarProcesos = mostrarProcesos;
window.toggleProcesos = toggleProcesos;
window.mostrarHistorialTareas = mostrarHistorialTareas;
window.eliminarRegistro = eliminarRegistro;
window.mostrarFormularioRechazo = mostrarFormularioRechazo;
window.mostrarFormularioIngreso = mostrarFormularioIngreso;
window.confirmarRechazo = confirmarRechazo;
window.inicializarCompras = inicializarCompras;
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
                        </div>
                    </div>
                `;

                const profileSection = dashboard.querySelector('.profile-section');
                const modal = dashboard.querySelector('.profile-modal');
                const modalContent = modal.querySelector('.modal-content');
                const closeBtn = modal.querySelector('.close-modal');

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
    const vistas = document.querySelectorAll('.compras-view, .newTarea-view, .usuarios-view, .verificarRegistros-view, .consultarRegistros-view, .formProduccion-view, .cuentasProduccion-view, .newPedido-view');
    
    // Ocultar todas las vistas inicialmente
    vistas.forEach(vista => {
        vista.style.display = 'none';
        vista.style.opacity = '0';
    });

    // Limpiar botones existentes
    opcionesDiv.innerHTML = '';

    // Dividir los roles si hay múltiples
    const roles = rol ? rol.split(',').map(r => r.trim()) : [];

    // Objeto con la configuración de botones por rol
    const botonesRoles = {
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
                icono: 'fa-clipboard-list',
                texto: 'Tarea',
                onclick: 'onclick="inicializarTareas()"'
            }
        ],
        'Almacen': [
            {
                clase: 'opcion-btn',
                vista: 'verificarRegistros-view',
                icono: 'fa-check-double',
                texto: 'Verificar',
                onclick: 'onclick="cargarRegistros()"'
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
            }
            ,
            {
                clase: 'opcion-btn',
                vista: 'compras-view',
                icono: 'fa-shopping-cart fa-2x',
                texto: 'Compras',
                onclick: 'onclick="inicializarCompras()"'
            }
        ]
    };

    // Agregar botones para cada rol
    let esElPrimero = true;
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
                opcionesDiv.insertAdjacentHTML('beforeend', btnHTML);
                
                // Si es el primer botón, mostrar su vista y ejecutar su función
                if (esElPrimero) {
                    const vistaInicial = document.querySelector(`.${boton.vista}`);
                    if (vistaInicial) {
                        vistaInicial.style.display = 'flex';
                        vistaInicial.style.opacity = '1';
                        
                        // Ejecutar la función del primer botón
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

    // Agregar event listeners a los botones
    const botones = opcionesDiv.querySelectorAll('.opcion-btn');
    botones.forEach(boton => {
        boton.addEventListener('click', async (e) => {
            if (boton.classList.contains('active')) return;
            
            botones.forEach(b => b.classList.remove('active'));
            boton.classList.add('active');
            
            vistas.forEach(vista => {
                vista.style.opacity = '0';
                setTimeout(() => {
                    vista.style.display = 'none';
                }, 300);
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

            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = boton.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            boton.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
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
    bienvenida();
    cargarUsuarios();
    cargarRegistros();
    inicializarConsulta();
    inicializarFormularioProduccion();
    cargarRegistrosCuentas();
    iniciarApp();
    inicializarPedidos();
});




