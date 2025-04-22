/* =============== FUNCIONES DE INICIO USUARIOS=============== */
import { ocultarAnuncio, mostrarAnuncio, mostrarAnuncioDown, ocultarAnuncioDown } from './components.js';
export function inicializarUsuarios() {
    const container = document.querySelector('.usuarios-view');
    container.style.display = 'flex';

    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-users"></i> Gestión de Usuarios</h3>
        </div>
        <div class="almacenGral-container">
            <div class="almacen-botones">
                <div class="cuadro-btn">
                    <button class="btn-agregar-pedido">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <p>Agregar Usuario</p>
                </div>
                <div class="cuadro-btn">
                    <button class="btn-agregar-pedido">
                        <i class="fas fa-user-slash"></i>
                    </button>
                    <p>Desactivar/Activar</p>
                </div>
            </div>    
            <div class="lista-productos">
                <div class="almacen-container">
                    <div class="almacen-header">
                        <div class="search-bar">
                            <input type="text" id="searchUsuario" placeholder="Buscar usuario...">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                    </div>
                    <div class="products-grid" id="usersContainer">
                    </div>
                </div>
            </div>
        </div>
    `;

    const btnAgregar = container.querySelector('.btn-agregar-pedido i.fa-user-plus').parentElement;
    btnAgregar.onclick = () => mostrarFormularioAgregarUsuario();

    const btnDesactivar = container.querySelector('.btn-agregar-pedido i.fa-user-slash').parentElement;
    btnDesactivar.onclick = () => mostrarFormularioDesactivarUsuario();

    cargarUsuarios();
}
export async function cargarUsuarios() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-usuarios', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
            const container = document.getElementById('usersContainer');
            container.innerHTML = data.usuarios.map(usuario => `
                <div class="product-card" data-pin="${usuario.pin}" data-extras="${usuario.extras || ''}">
                    <div class="product-info">
                        <div class="product-name">
                            <i class="fas fa-user-circle"></i>
                            <span>${usuario.nombre}</span>
                        </div>
                        <div class="product-quantity">
                            <div class="registro-estado-acopio">${usuario.rol}</div>
                        </div>
                        ${usuario.extras && usuario.extras !== '' ? `<div class="extras-indicator"><i class="fas fa-puzzle-piece"></i></div>` : ''}
                    </div>
                </div>
            `).join('');

            // Add card click listeners
            container.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', () => {
                    const pin = card.dataset.pin;
                    mostrarDetallesUsuario(pin);
                });
            });

            // Configure search functionality
            const searchInput = document.getElementById('searchUsuario');
            const searchIcon = document.querySelector('.search-icon');

            function normalizarTexto(texto) {
                return texto.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            searchInput.addEventListener('input', (e) => {
                const searchTerm = normalizarTexto(e.target.value);
                const cards = container.querySelectorAll('.product-card');

                // Toggle search icon
                if (e.target.value.length > 0) {
                    searchIcon.classList.remove('fa-search');
                    searchIcon.classList.add('fa-times');
                } else {
                    searchIcon.classList.remove('fa-times');
                    searchIcon.classList.add('fa-search');
                }

                cards.forEach(card => {
                    const nombre = normalizarTexto(card.querySelector('.product-name span').textContent);
                    const rol = normalizarTexto(card.querySelector('.registro-estado-acopio').textContent);
                    const matches = nombre.includes(searchTerm) || rol.includes(searchTerm);
                    card.style.display = matches ? 'grid' : 'none';
                });
            });

            // Clear search functionality
            searchIcon.addEventListener('click', () => {
                if (searchInput.value.length > 0) {
                    searchInput.value = '';
                    searchIcon.classList.remove('fa-times');
                    searchIcon.classList.add('fa-search');
                    container.querySelectorAll('.product-card').forEach(card => {
                        card.style.display = 'grid';
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar usuarios', 'error');
    } finally {
        ocultarCarga();
    }
}

/* =============== FUNCIONES DE AGREGAR NUEVO USUARIO =============== */
export async function mostrarFormularioAgregarUsuario() {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = document.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <div class="encabezado">
            <h2>Nuevo usuario</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p for="nombre">Nombre:</p>
            <input type="text" id="nombre" class="form-input" placeholder="Nombre del usuario" style="text-transform: uppercase;">

            <p for="pin">PIN:</p>
            <input type="text" id="pin" class="form-input" placeholder="PIN de 4 dígitos" maxlength="4">

            <p for="rol">Rol:</p>
            <select id="rol" class="form-input">
                <option value="">Selecciona</option>
                <option value="Administración">Administrador</option>
                <option value="Acopio">Acopio</option>
                <option value="Producción">Producción</option>
                <option value="Almacen">Almacen</option>
                <option value="Ventas">Ventas</option>
                <option value="Compras">Compras</option>
            </select>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green confirmar"><i class="fas fa-check"></i> Confirmar</button>
        </div>
    `;

    mostrarAnuncio();

    const confirmed = await new Promise(resolve => {
        const btnConfirmar = anuncioContenido.querySelector('.confirmar');

        btnConfirmar.addEventListener('click', () => {
            const formData = {
                nombre: document.getElementById('nombre').value,
                pin: document.getElementById('pin').value,
                rol: document.getElementById('rol').value
            };
            ocultarAnuncio();
            resolve(formData);
        });
    });

    if (!confirmed) return;

    try {
        mostrarCarga();
        const response = await fetch('/agregar-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(confirmed)
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Usuario agregado correctamente', 'success');
            await cargarUsuarios();
        } else {
            throw new Error(data.error || 'Error al agregar usuario');
        }
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}

/* =============== FUNCIONES DE DESCATIVAR USUARIOS=============== */
export async function mostrarFormularioDesactivarUsuario() {

    const anuncioContenido = document.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <div class="encabezado">
            <h2>Desactivar/Activar usuario</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">

                <p for="pin">PIN del usuario:</p>
                <input type="text" id="pin" class="form-input" placeholder="Ingrese PIN" maxlength="4">

                <p for="estado">Nuevo Estado:</p>
                <select id="estado" class="form-input">
                    <option value="Activo">Activar</option>
                    <option value="Inactivo">Desactivar</option>
                </select>

        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn blue confirmar"><i class="fas fa-save"></i> Guardar Cambios</button>
        </div>
    `;

    mostrarAnuncio();

    const confirmed = await new Promise(resolve => {
        const btnConfirmar = anuncioContenido.querySelector('.confirmar');

        btnConfirmar.addEventListener('click', () => {
            const formData = {
                pin: document.getElementById('pin').value,
                estado: document.getElementById('estado').value
            };
            ocultarAnunci();
            resolve(formData);
        });
    });

    if (!confirmed) return;

    try {
        mostrarCarga();
        const response = await fetch('/cambiar-estado-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',  // Add this line
            body: JSON.stringify(confirmed)
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion(`Usuario ${confirmed.estado.toLowerCase()} correctamente`, 'success');
            await cargarUsuarios();
        } else {
            throw new Error(data.error || 'Error al cambiar estado del usuario');
        }
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}

/* =============== FUNCIONES DE DETALLES DE USUARIOS =============== */
export async function mostrarDetallesUsuario(pin) {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ pin })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener detalles del usuario');
        }

        const usuario = data.usuario;
        const anuncioContenido = document.querySelector('.anuncio-contenido');

        anuncioContenido.innerHTML = `
            <div class="encabezado">
                <h2>Información del usuario</h2>
                <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                    <i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <div class="detalles-grup">
                    <div class="detalle-item">
                        <p>Nombre:</p> 
                        <span>${usuario.nombre}</span>
                    </div>
                    <div class="detalle-item">
                        <p>Estado:</p> 
                        <span>${usuario.estado ? 'Activo' : 'Inactivo'}</span>
                    </div>
                </div>
  
                    <p for="editar-pin">PIN:</p>
                    <input type="text" id="editar-pin" class="form-input" value="${usuario.pin}" maxlength="4">

                    <p for="editar-rol">Rol:</p>
                    <select id="editar-rol" class="form-input">
                        <option value="Administración" ${usuario.rol === 'Administración' ? 'selected' : ''}>Administrador</option>
                        <option value="Acopio" ${usuario.rol === 'Acopio' ? 'selected' : ''}>Acopio</option>
                        <option value="Producción" ${usuario.rol === 'Producción' ? 'selected' : ''}>Producción</option>
                        <option value="Almacen" ${usuario.rol === 'Almacen' ? 'selected' : ''}>Almacen</option>
                        <option value="Ventas" ${usuario.rol === 'Ventas' ? 'selected' : ''}>Ventas</option>
                        <option value="Compras" ${usuario.rol === 'Compras' ? 'selected' : ''}>Compras</option>
                    </select>

                    <p for="editar-extras">Extras:</p>
                    <select id="editar-extras" class="form-input">
                        <option value="">Sin extras</option>
                        <option value="CalcularMP" ${usuario.extras === 'CalcularMP' ? 'selected' : ''}>Calcular MP</option>
                        <option value="imgUpload" ${usuario.extras === 'imgUpload' ? 'selected' : ''}>Subir img</option>
                    </select>

                    <p for="editar-estado">Estado:</p>
                    <select id="editar-estado" class="form-input">
                        <option value="true" ${usuario.estado ? 'selected' : ''}>Activo</option>
                        <option value="false" ${!usuario.estado ? 'selected' : ''}>Inactivo</option>
                    </select>
               
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn blue guardar-cambios"><i class="fas fa-save"></i> Guardar Cambios</button>
                <button class="anuncio-btn red eliminar-usuario"><i class="fas fa-trash"></i> Eliminar</button>
            </div>`;

        mostrarAnuncio();

        const btnGuardar = anuncioContenido.querySelector('.guardar-cambios');
        const btnEliminar = anuncioContenido.querySelector('.eliminar-usuario');

        btnGuardar.onclick = () => actualizarUsuario(usuario);
        btnEliminar.onclick = () => confirmarEliminarUsuario(usuario);

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}

/* =============== FUNCIONES DE ACTUALIZAR USUARIO =============== */
async function actualizarUsuario(usuario) {
    try {
        const datosActualizados = {
            pinActual: usuario.pin,
            nuevoPin: document.getElementById('editar-pin').value,
            nuevoRol: document.getElementById('editar-rol').value,
            nuevosExtras: document.getElementById('editar-extras').value,
            nuevoEstado: document.getElementById('editar-estado').value === 'true'
        };

        mostrarCarga();
        const response = await fetch('/actualizar-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(datosActualizados)
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Usuario actualizado correctamente', 'success');
            ocultarAnuncio();
            await cargarUsuarios();
        } else {
            throw new Error(data.error || 'Error al actualizar usuario');
        }
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}

/* =============== FUNCIONES DE ELIMINAR USUARIO =============== */
function confirmarEliminarUsuario(usuario) {
    const anuncio = document.querySelector('.anuncio-down');
    const anuncioContenido = document.createElement('div');
    anuncioContenido.className = 'anuncio-contenido';
    
    anuncioContenido.innerHTML = `
        <div class="encabezado">
            <h2>Eliminar Usuario</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                <i class="fas fa-arrow-down"></i></button>
        </div>
        <div class="detalles-grup center">
            <p>¿Está seguro que desea eliminar el usuario "${usuario.nombre}"?</p>
            <p>Esta acción no se puede deshacer.</p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar-eliminacion">Confirmar</button>
        </div>
    `;

    anuncio.innerHTML = '';
    anuncio.appendChild(anuncioContenido);
    mostrarAnuncioDown();
    ocultarAnuncio();

    const btnConfirmarEliminacion = anuncioContenido.querySelector('.confirmar-eliminacion');
    btnConfirmarEliminacion.onclick = () => eliminarUsuario(usuario);
}

async function eliminarUsuario(usuario) {
    try {
        mostrarCarga();
        const response = await fetch('/eliminar-usuario', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ pin: usuario.pin })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Usuario eliminado correctamente', 'success');
            ocultarAnuncioDown();
            await cargarUsuarios();
        } else {
            throw new Error(data.error || 'Error al eliminar usuario');
        }
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
