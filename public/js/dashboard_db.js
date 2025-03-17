import { cargarUsuarios, editarUsuario, eliminarUsuario, agregarUsuario,mostrarPermisos, agregarPermiso, eliminarPermiso } from './modules/users.js';
import { cargarRegistros, verificarRegistro} from './modules/vRegistros.js';
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
        const response = await fetch('/obtener-nombre');
        const data = await response.json();
        
        if (data.nombre) {
            const bienvenida = document.querySelector('.bienvenida');
            if (bienvenida) {
                bienvenida.innerHTML = '<i class="fas fa-microchip"></i> Admin.';
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
    switch(tipo) {
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
document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    cargarUsuarios();
    cargarRegistros();
    inicializarConsulta();
    inicializarFormularioProduccion();
    cargarRegistrosCuentas();
});




