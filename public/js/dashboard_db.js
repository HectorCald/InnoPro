import { cargarUsuarios, editarUsuario, eliminarUsuario, agregarUsuario, mostrarPermisos, agregarPermiso, eliminarPermiso } from './modules/users.js';
import { cargarRegistros, verificarRegistro } from './modules/vRegistros.js';
import { buscarRegistros, mostrarResultadosBusqueda, inicializarConsulta } from './modules/cRegistros.js';
import { inicializarFormulario, inicializarFormularioProduccion, resetearFormulario, cargarProductos } from './modules/formProduccion.js';
import { cargarRegistrosCuentas, mostrarDetalles, crearTarjetaRegistro } from './modules/misCuentasProduccion.js';
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
    const vistas = document.querySelectorAll('.usuarios-view, .verificarRegistros-view, .consultarRegistros-view, .formProduccion-view, .cuentasProduccion-view');
    
    // Ocultar todas las vistas inicialmente
    vistas.forEach(vista => vista.style.display = 'none');

    // Limpiar botones existentes
    opcionesDiv.innerHTML = '';

    if (rol === 'Producción') {
        // Crear botones para Producción
        opcionesDiv.innerHTML = `
            <button class="opcion-btn active" data-vista="formProduccion-view">
                <i class="fas fa-clipboard-list"></i> Formulario
            </button>
            <button class="opcion-btn" data-vista="cuentasProduccion-view">
                <i class="fas fa-history"></i> Registros
            </button>
        `;
        // Mostrar vista inicial
        document.querySelector('.formProduccion-view').style.display = 'flex';
    } else if (rol === 'Almacen') {
        // Crear botones para Almacén
        opcionesDiv.innerHTML = `
            <button class="opcion-btn active" data-vista="verificarRegistros-view">
                <i class="fas fa-check-double"></i> Verificar
            </button>
            <button class="opcion-btn" data-vista="consultarRegistros-view">
                <i class="fas fa-search"></i> Consultar
            </button>
        `;
        // Mostrar vista inicial
        document.querySelector('.verificarRegistros-view').style.display = 'flex';
    } else if (rol === 'Administración') {
        // Crear botón para Administración
        opcionesDiv.innerHTML = `
            <button class="opcion-btn active" data-vista="usuarios-view">
                <i class="fas fa-users-cog"></i> Gestión de Usuarios
            </button>
        `;
        // Mostrar vista inicial
        document.querySelector('.usuarios-view').style.display = 'flex';
    }

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
document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    cargarUsuarios();
    cargarRegistros();
    inicializarConsulta();
    inicializarFormularioProduccion();
    cargarRegistrosCuentas();
    iniciarApp();
});




