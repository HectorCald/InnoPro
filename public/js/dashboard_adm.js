import { bienvenida, manejarCierreSesion } from './modules/auth.js';
import { mostrarNotificacion } from './modules/notifications.js';
import { mostrarPermisos, agregarPermiso, eliminarPermiso } from './modules/permissions.js';
import { cargarUsuarios, editarUsuario, eliminarUsuario, agregarUsuario } from './modules/users.js';

// Hacer funciones disponibles globalmente
window.mostrarNotificacion = mostrarNotificacion;
window.mostrarPermisos = mostrarPermisos;
window.agregarPermiso = agregarPermiso;
window.eliminarPermiso = eliminarPermiso;
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.agregarUsuario = agregarUsuario;

// Función para manejar el menú
function inicializarMenu() {
    const menuBtn = document.querySelector('.menu-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (!menuBtn || !dropdownMenu) {
        console.error('No se encontraron elementos del menú');
        return;
    }

    function toggleMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    }

    function closeMenuOutside(e) {
        if (dropdownMenu.classList.contains('active') && 
            !dropdownMenu.contains(e.target) && 
            !menuBtn.contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    }

    menuBtn.addEventListener('click', toggleMenu);
    document.addEventListener('click', closeMenuOutside);
}
// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    manejarCierreSesion();
    inicializarMenu();
    cargarUsuarios();
});





