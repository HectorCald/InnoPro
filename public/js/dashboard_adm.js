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
function inicializarMenu() {
    const menuBtn = document.querySelector('.menu-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (!menuBtn || !dropdownMenu) {
        console.error('No se encontraron elementos del menú');
        return;
    }

    async function toggleMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Always refresh permissions before showing the menu
        if (!dropdownMenu.classList.contains('active')) {
            await cargarMenuPermisos();
        }
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
    
    // Initial load of permissions
    cargarMenuPermisos();
}

async function cargarMenuPermisos() {
    try {
        const response = await fetch('/obtener-mis-permisos', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        console.log('Permisos recibidos:', data.permisos);

        if (data.success) {
            const dropdownMenu = document.querySelector('.dropdown-menu');
            const menuItems = [];

            // Create menu items based on actual permissions
            if (data.permisos && data.permisos.length > 0) {
                data.permisos.forEach(permiso => {
                    const permisoTrim = permiso.trim();
                    // Convert permission name to lowercase for the action
                    const actionName = permisoTrim.toLowerCase().replace(/\s+/g, '');
                    menuItems.push(`
                        <a href="#" class="menu-item" data-action="${actionName}">
                            <i class="fas fa-circle"></i> 
                            ${permisoTrim}
                        </a>
                    `);
                });
            }

            // Add logout button
            menuItems.push(`
                <div class="menu-divider"></div>
                <button class="logout-btn" type="button">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Cerrar Sesión</span>
                </button>
            `);

            // Update menu content
            dropdownMenu.innerHTML = menuItems.join('');
            
            // Add logout event listener
            const btnLogout = dropdownMenu.querySelector('.logout-btn');
            if (btnLogout) {
                btnLogout.addEventListener('click', manejarCierreSesion);
            }

            // Add click events to menu items
            document.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = item.dataset.action;
                    handleMenuAction(action);
                    dropdownMenu.classList.remove('active'); // Close menu after selection
                });
            });
        }
    } catch (error) {
        console.error('Error loading permissions:', error);
        mostrarNotificacion('Error al cargar el menú', 'error');
    }
}
// Simple function to get a default icon for any permission
function getIconForPermission(permiso) {
    return 'circle'; // Default icon for all permissions
}

function handleMenuAction(action) {
    // Hide all views first
    document.querySelectorAll('[class$="-view"]').forEach(view => {
        view.style.display = 'none';
    });

    // Show the selected view if it exists
    const viewElement = document.querySelector(`.${action}-view`);
    if (viewElement) {
        viewElement.style.display = 'block';
    }
}

// Modificar la inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    cargarMenuPermisos(); // Agregar esta línea
    inicializarMenu();
    cargarUsuarios();
});

// ... resto del código existente ...





