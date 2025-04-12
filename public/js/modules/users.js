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
                <div class="product-card" data-pin="${usuario.pin}">
                    <div class="product-info">
                        <div class="product-name">
                            <i class="fas fa-user-circle"></i>
                            <span>${usuario.nombre}</span>
                        </div>
                        <div class="product-quantity">
                            <div class="registro-estado-acopio">${usuario.rol}</div>
                        </div>
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

async function mostrarFormularioAgregarUsuario() {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = document.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <h2><i class="fas fa-user-plus"></i> Agregar Usuario</h2>
        <div class="relleno">
            <div class="campo-form">
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" class="form-input" placeholder="Nombre del usuario">
            </div>
            <div class="campo-form">
                <label for="pin">PIN:</label>
                <input type="text" id="pin" class="form-input" placeholder="PIN de 4 dígitos" maxlength="4">
            </div>
            <div class="campo-form">
                <label for="rol">Rol:</label>
                <select id="rol" class="form-input">
                    <option value="Administración">Administrador</option>
                    <option value="Acopio">Acopio</option>
                    <option value="Producción">Producción</option>
                    <option value="Almacen">Almacen</option>
                    <option value="Ventas">Ventas</option>
                    <option value="Compras">Compras</option>
                </select>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green confirmar"><i class="fas fa-check"></i> Confirmar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';

    const confirmed = await new Promise(resolve => {
        const btnConfirmar = anuncioContenido.querySelector('.confirmar');
        const btnCancelar = anuncioContenido.querySelector('.cancelar');

        btnConfirmar.addEventListener('click', () => {
            const formData = {
                nombre: document.getElementById('nombre').value,
                pin: document.getElementById('pin').value,
                rol: document.getElementById('rol').value
            };
            anuncio.style.display = 'none';
            resolve(formData);
        });

        btnCancelar.addEventListener('click', () => {
            anuncio.style.display = 'none';
            resolve(false);
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


async function mostrarFormularioDesactivarUsuario() {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = document.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <h2><i class="fas fa-user-cog"></i> Cambiar Estado de Usuario</h2>
        <div class="relleno">
            <div class="campo-form">
                <label for="pin">PIN del usuario:</label>
                <input type="text" id="pin" class="form-input" placeholder="Ingrese PIN" maxlength="4">
            </div>
            <div class="campo-form">
                <label for="estado">Nuevo Estado:</label>
                <select id="estado" class="form-input">
                    <option value="Activo">Activar</option>
                    <option value="Inactivo">Desactivar</option>
                </select>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn blue confirmar"><i class="fas fa-save"></i> Guardar Cambios</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';

    const confirmed = await new Promise(resolve => {
        const btnConfirmar = anuncioContenido.querySelector('.confirmar');
        const btnCancelar = anuncioContenido.querySelector('.cancelar');

        btnConfirmar.addEventListener('click', () => {
            const formData = {
                pin: document.getElementById('pin').value,
                estado: document.getElementById('estado').value
            };
            anuncio.style.display = 'none';
            resolve(formData);
        });

        btnCancelar.addEventListener('click', () => {
            anuncio.style.display = 'none';
            resolve(false);
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

async function mostrarDetallesUsuario(pin) {
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
        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = document.querySelector('.anuncio-contenido');

        anuncioContenido.innerHTML = `
    <h2><i class="fas fa-user-circle"></i> Detalles del Usuario</h2>
    <div class="relleno">
        <div class="detalles-grup">
            <div class="detalle-item">
                <i class="fas fa-user"></i>
                <p>Nombre:</p> 
                <span>${usuario.nombre}</span>
            </div>
            <div class="detalle-item">
                <i class="fas fa-user-tag"></i>
                <p>Rol:</p>
                <span> ${usuario.rol}</span>
            </div>
            <div class="detalle-item">
                <i class="fas fa-key"></i>
                <p>PIN:</p>
                <span> ${usuario.pin}</span>
            </div>
            <div class="detalle-item">
                <i class="fas fa-circle${usuario.estado ? ' text-success' : ' text-danger'}"></i>
                <p>Estado:</p> 
                <span>${usuario.estado ? 'Activo' : 'Inactivo'}</span>
            </div>
        </div>
        <div class="campo-form">
            <label for="nuevo-pin">Nuevo PIN:</label>
            <input type="text" id="nuevo-pin" class="form-input" placeholder="Nuevo PIN de 4 dígitos" maxlength="4">
        </div>
        <div class="campo-form">
            <label for="nuevo-rol">Nuevo Rol:</label>
            <select id="nuevo-rol" class="form-input">
                <option value="Administración">Administrador</option>
                <option value="Acopio">Acopio</option>
                <option value="Producción">Producción</option>
                <option value="Almacen">Almacen</option>
                <option value="Ventas">Ventas</option>
                <option value="Compras">Compras</option>
            </select>
        </div>
    </div>
    <div class="anuncio-botones">
        <button class="anuncio-btn blue actualizar-pin"><i class="fas fa-key"></i> Actualizar PIN</button>
        <button class="anuncio-btn green actualizar-rol"><i class="fas fa-user-tag"></i> Actualizar Rol</button>
        <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
    </div>
`;

        anuncio.style.display = 'flex';

        const btnActualizarPin = anuncioContenido.querySelector('.actualizar-pin');
        const btnActualizarRol = anuncioContenido.querySelector('.actualizar-rol');
        const btnCancelar = anuncioContenido.querySelector('.cancelar');

        btnActualizarPin.onclick = async () => {
            const nuevoPIN = document.getElementById('nuevo-pin').value;
            if (nuevoPIN && nuevoPIN.length === 4) {
                try {
                    const response = await fetch('/actualizar-pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            pin: usuario.pin,
                            nuevoPIN: nuevoPIN
                        })
                    });
        
                    const data = await response.json();
                    if (data.success) {
                        mostrarNotificacion('PIN actualizado correctamente', 'success');
                        anuncio.style.display = 'none';
                        await cargarUsuarios();
                    } else {
                        throw new Error(data.error || 'Error al actualizar PIN');
                    }
                } catch (error) {
                    mostrarNotificacion(error.message, 'error');
                }
            } else {
                mostrarNotificacion('El PIN debe tener 4 dígitos', 'error');
            }
        };
        btnActualizarRol.onclick = async () => {
            const nuevoRol = document.getElementById('nuevo-rol').value;
            try {
                const response = await fetch('/actualizar-rol', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        pin: usuario.pin,
                        nuevoRol: nuevoRol
                    })
                });
        
                const data = await response.json();
                if (data.success) {
                    mostrarNotificacion('Rol actualizado correctamente', 'success');
                    anuncio.style.display = 'none';
                    await cargarUsuarios();
                } else {
                    throw new Error(data.error || 'Error al actualizar rol');
                }
            } catch (error) {
                mostrarNotificacion(error.message, 'error');
            }
        };
        
        

        btnCancelar.onclick = () => anuncio.style.display = 'none';

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}

export {
    mostrarFormularioAgregarUsuario,
    mostrarFormularioDesactivarUsuario,
    mostrarDetallesUsuario
};