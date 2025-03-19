import { cargarUsuarios, editarUsuario, eliminarUsuario, agregarUsuario, mostrarPermisos, agregarPermiso, eliminarPermiso } from './modules/users.js';
import { cargarRegistros, verificarRegistro } from './modules/vRegistros.js';
import { buscarRegistros, mostrarResultadosBusqueda, inicializarConsulta, limpiarFiltros } from './modules/cRegistros.js';
import { inicializarFormulario, inicializarFormularioProduccion, resetearFormulario, cargarProductos } from './modules/formProduccion.js';
import { cargarRegistrosCuentas, mostrarDetalles, crearTarjetaRegistro } from './modules/misCuentasProduccion.js';
import {togglePedidosRecibidos,mostrarPedidosRecibidos, mostrarFormularioIngreso, procesarIngreso,togglePedidosArchivados, mostrarPedidosArchivados, finalizarPedidos,confirmarFinalizacionPedidos,compartirEnWhatsApp, compartirPedido, inicializarPedidos, mostrarFormularioPedido, cargarPedidos, guardarPedido, cerrarFormularioPedido, eliminarPedido, mostrarConfirmacionEliminar} from './modules/newPedido.js';
import {mostrarHistorialTareas,toggleProcesos,mostrarProcesos,pausarProceso, finalizarProceso,inicializarTareas, mostrarFormularioTarea, cargarTareasEnProceso, guardarTarea, iniciarCronometro, agregarProceso, pausarTarea, finalizarTarea} from './modules/newTarea.js';
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
window.compartirPedido = compartirPedido;
window.compartirEnWhatsApp = compartirEnWhatsApp;
window.confirmarFinalizacionPedidos = confirmarFinalizacionPedidos;
window.finalizarPedidos = finalizarPedidos;
window.togglePedidosArchivados = togglePedidosArchivados;
window.mostrarPedidosArchivados = mostrarPedidosArchivados;
window.mostrarPedidosRecibidos = mostrarPedidosRecibidos;
window.togglePedidosRecibidos = togglePedidosRecibidos;
window.procesarIngreso = procesarIngreso;
window.mostrarFormularioIngreso = mostrarFormularioIngreso;
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

async function bienvenida() {
    try {
        const response = await fetch('/obtener-mi-rol');
        const data = await response.json();

        if (data.rol) {
            const bienvenida = document.querySelector('.bienvenida');
            if (bienvenida) {
                bienvenida.innerHTML = data.rol;
            }
        }
    } catch (error) {
        console.error('Error al obtener el nombre:', error);
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
    bienvenida();
    const rol = await obtenerRolUsuario();
    const opcionesDiv = document.querySelector('.opciones');
    const vistas = document.querySelectorAll('.newTarea-view, .usuarios-view, .verificarRegistros-view, .consultarRegistros-view, .formProduccion-view, .cuentasProduccion-view, .newPedido-view');
    
    // Ocultar todas las vistas inicialmente
    vistas.forEach(vista => vista.style.display = 'none');

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
                onclick: ''
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
            },
            {
                clase: 'opcion-btn',
                vista: 'consultarRegistros-view',
                icono: 'fa-search',
                texto: 'Consultar',
                onclick: 'onclick="inicializarConsulta()"'
            }
        ],
        'Administración': [
            {
                clase: 'opcion-btn',
                vista: 'usuarios-view',
                icono: 'fa-users-cog',
                texto: 'Usuarios',
                onclick: 'onclick="cargarUsuarios()"'
            }
        ]
    };

    // Agregar botones para cada rol
    let esElPrimero = true;
    roles.forEach(rolActual => {
        const botonesRol = botonesRoles[rolActual];
        if (botonesRol) {
            botonesRol.forEach(boton => {
                const btnHTML = `
                    <button class="${boton.clase}${esElPrimero ? ' active' : ''}" 
                            data-vista="${boton.vista}" 
                            ${boton.onclick}>
                        <i class="fas ${boton.icono}"></i> ${boton.texto}
                    </button>
                `;
                opcionesDiv.innerHTML += btnHTML;
                
                // Si es el primer botón, mostrar su vista
                if (esElPrimero) {
                    document.querySelector(`.${boton.vista}`).style.display = 'flex';
                    esElPrimero = false;
                }
            });
        }
    });

    // Agregar event listeners a los botones
    const botones = opcionesDiv.querySelectorAll('.opcion-btn');
    botones.forEach(boton => {
        // Añadir efecto ripple
        boton.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            const rect = boton.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            boton.appendChild(ripple);
            
            // Remover el ripple después de la animación
            setTimeout(() => ripple.remove(), 600);

            // Remover clase active de todos los botones
            botones.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            boton.classList.add('active');
            
            // Ocultar todas las vistas
            vistas.forEach(vista => vista.style.display = 'none');
            
            // Mostrar la vista correspondiente con animación
            const vistaId = boton.dataset.vista;
            const vistaActual = document.querySelector(`.${vistaId}`);
            vistaActual.style.display = 'flex';
            vistaActual.classList.add('vista-transition');
            
            // Remover la clase de animación después de que termine
            setTimeout(() => {
                vistaActual.classList.remove('vista-transition');
            }, 300);
        });
    });
}
// Agregar esta función después de las importaciones
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




