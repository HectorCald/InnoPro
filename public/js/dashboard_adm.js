
/* ==================== INICIALIZACIÓN DE LA APLICACIÓN ==================== */
document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    manejarCierreSesion();
    inicializarMenu();
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const accion = e.currentTarget.getAttribute('data-action');
            manejarAccionMenu(accion);
        });
    });
});

/* ==================== FUNCIONES DE AUTENTICACIÓN Y SESIÓN ==================== */
async function bienvenida() {
    try {
        const response = await fetch('/obtener-nombre');
        const data = await response.json();
        
        if (data.nombre) {
            const bienvenida = document.querySelector('.bienvenida');
            if (bienvenida) {
                bienvenida.innerHTML = '<i class="fas fa-microchip"></i> Adimin.';
            }
        }
    } catch (error) {
        console.error('Error al obtener el nombre:', error);
    }
}
function manejarCierreSesion() {
    const btnLogout = document.querySelector('.logout-btn');
    btnLogout.addEventListener('click', async () => {
        try {
            const response = await fetch('/cerrar-sesion', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    });
}
/* ==================== SISTEMA DE NOTIFICACIONES ==================== */
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 5000) {
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
/* ==================== MANEJO DEL MENÚ ==================== */
function inicializarMenu() {
    const menuBtn = document.querySelector('.menu-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (!menuBtn || !dropdownMenu) {
        console.error('No se encontraron elementos del menú');
        return;
    }

    // Removemos eventos previos si existen
    menuBtn.removeEventListener('click', toggleMenu);
    document.removeEventListener('click', closeMenuOutside);

    // Función para toggle del menú
    function toggleMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    }

    // Función para cerrar al hacer clic fuera
    function closeMenuOutside(e) {
        if (dropdownMenu.classList.contains('active') && 
            !dropdownMenu.contains(e.target) && 
            !menuBtn.contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    }

    // Agregamos los eventos
    menuBtn.addEventListener('click', toggleMenu);
    document.addEventListener('click', closeMenuOutside);
}

function manejarAccionMenu(accion) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const usuariosView = document.querySelector('.usuarios-view');

    // Primero ocultamos todas las vistas
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    switch(accion) {
        case 'inicio':
            window.location.href = '/dashboard_adm';
            break;
        case 'usuarios':
            console.log('Mostrando vista de usuarios'); // Debug
            dropdownMenu.classList.remove('active');
            usuariosView.classList.add('active');
            mostrarSeccionUsuarios();
            break;
        default:
            usuariosView.classList.remove('active');
            break;
    }
}

// Modificar también la función mostrarSeccionUsuarios
async function mostrarSeccionUsuarios() {
    console.log('Iniciando mostrarSeccionUsuarios');
    const usuariosView = document.querySelector('.usuarios-view');
    
    if (!usuariosView) {
        console.error('No se encontró el elemento usuarios-view');
        return;
    }

    usuariosView.innerHTML = `
        <div class="usuarios-container">
            <h2>Gestión de Usuarios</h2>
            <div class="usuarios-table">
                <div class="table-header">
                    <div class="header-cell">PIN</div>
                    <div class="header-cell">Nombre</div>
                    <div class="header-cell">Rol</div>
                    <div class="header-cell">Acciones</div>
                </div>
                <div class="table-body">
                    <!-- Los usuarios se cargarán aquí -->
                </div>
            </div>
        </div>
    `;
    
    try {
        await cargarUsuarios();
        mostrarNotificacion('Usuarios cargados correctamente', 'success');
    } catch (error) {
        mostrarNotificacion('Error al cargar usuarios', 'error');
    }
}

async function cargarUsuarios() {
    try {
        const response = await fetch('/obtener-usuarios', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            const tableBody = document.querySelector('.table-body');
            tableBody.innerHTML = '';

            data.usuarios.forEach(usuario => {
                const row = document.createElement('div');
                row.className = 'usuario-row';
                row.innerHTML = `
                    <div class="usuario-info" onclick="toggleAcciones('${usuario.pin}')">
                        <div class="cell">${usuario.pin || '-'}</div>
                        <div class="cell">${usuario.nombre || '-'}</div>
                        <div class="cell">${usuario.rol || '-'}</div>
                        <div class="cell"><i class="fas fa-chevron-down"></i></div>
                    </div>
                    <div class="acciones-dropdown" id="acciones-${usuario.pin}">
                        <button onclick="editarUsuario('${usuario.pin}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="mostrarPermisos('${usuario.pin}')">
                            <i class="fas fa-key"></i> Permisos
                        </button>
                        <button onclick="eliminarUsuario('${usuario.pin}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        throw error;
    }
}

function toggleAcciones(pin) {
    const allDropdowns = document.querySelectorAll('.acciones-dropdown');
    const targetDropdown = document.getElementById(`acciones-${pin}`);
    const allRows = document.querySelectorAll('.usuario-row');
    
    // Close all other dropdowns
    allDropdowns.forEach(dropdown => {
        if (dropdown !== targetDropdown) {
            dropdown.classList.remove('active');
        }
    });
    
    // Remove active class from all rows
    allRows.forEach(row => row.classList.remove('active'));
    
    // Toggle the clicked dropdown
    if (targetDropdown) {
        targetDropdown.classList.toggle('active');
        targetDropdown.parentElement.classList.toggle('active');
    }
}

// Agregar nuevas funciones para manejar usuarios
function editarUsuario(pin) {
    // Implementar lógica de edición
    console.log('Editando usuario:', pin);
    mostrarDialogoEdicion(pin);
}

function mostrarPermisos(pin) {
    // Implementar lógica de permisos
    console.log('Mostrando permisos:', pin);
    mostrarDialogoPermisos(pin);
}

function mostrarDialogoEdicion(pin) {
    const dialog = document.createElement('div');
    dialog.className = 'dialogo-modal';
    dialog.innerHTML = `
        <div class="dialogo-contenido">
            <h3>Editar Usuario</h3>
            <form id="form-editar-usuario">
                <input type="text" id="edit-pin" placeholder="PIN" value="${pin}" readonly>
                <input type="text" id="edit-nombre" placeholder="Nombre">
                <select id="edit-rol">
                    <option value="user">Usuario</option>
                    <option value="almacen">Almacén</option>
                    <option value="admin">Administrador</option>
                </select>
                <div class="dialogo-botones">
                    <button type="button" class="btn-cancelar">Cancelar</button>
                    <button type="submit" class="btn-guardar">Guardar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(dialog);

    // Manejar el cierre
    dialog.querySelector('.btn-cancelar').onclick = () => dialog.remove();
}

function mostrarDialogoPermisos(pin) {
    const dialog = document.createElement('div');
    dialog.className = 'dialogo-modal';
    dialog.innerHTML = `
        <div class="dialogo-contenido">
            <h3>Permisos de Usuario</h3>
            <div class="permisos-lista">
                <label>
                    <input type="checkbox" name="permiso-almacen"> Acceso a Almacén
                </label>
                <label>
                    <input type="checkbox" name="permiso-produccion"> Acceso a Producción
                </label>
                <label>
                    <input type="checkbox" name="permiso-reportes"> Acceso a Reportes
                </label>
            </div>
            <div class="dialogo-botones">
                <button type="button" class="btn-cancelar">Cerrar</button>
                <button type="button" class="btn-guardar">Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    // Manejar el cierre
    dialog.querySelector('.btn-cancelar').onclick = () => dialog.remove();
}