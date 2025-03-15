export async function cargarUsuarios() {
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
            const usuariosView = document.querySelector('.usuarios-view');
            if (!usuariosView) return;

            usuariosView.innerHTML = `
                <div class="usuarios-container">
                    <div class="usuarios-header">
                        <h2>Usuarios</h2>
                        <button class="btn-crear-usuario" onclick="agregarUsuario()">
                            <i class="fas fa-user-plus"></i> Crear Usuario
                        </button>
                    </div>
                    <div class="usuarios-table">
                        <div class="table-header">
                            <div class="header-cell">PIN</div>
                            <div class="header-cell">Nombre</div>
                            <div class="header-cell">Rol</div>
                        </div>
                        <div class="table-body">
                            ${data.usuarios.map(usuario => `
                                <div class="usuario-row">
                                    <div class="usuario-info" onclick="toggleAcciones('${usuario.pin}')">
                                        <div class="cell">${usuario.pin}</div>
                                        <div class="cell">${usuario.nombre}</div>
                                        <div class="cell">${usuario.rol}</div>
                                    </div>
                                    <div class="acciones-dropdown" id="acciones-${usuario.pin}">
                                        <button onclick="mostrarPermisos('${usuario.pin}')">
                                            <i class="fas fa-key"></i> Permisos
                                        </button>
                                        <button onclick="editarUsuario('${usuario.pin}')">
                                            <i class="fas fa-edit"></i> Editar
                                        </button>
                                        <button onclick="eliminarUsuario('${usuario.pin}')">
                                            <i class="fas fa-trash"></i> Eliminar
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else {
            mostrarNotificacion(data.error || 'Error al cargar usuarios', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar usuarios', 'error');
    }
}
export async function eliminarUsuario(pin) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');

    btnConfirmar.textContent = 'Eliminar';
    btnConfirmar.style.backgroundColor = '#f44336';

    // Personalizar el contenido del anuncio
    contenido.querySelector('h2').textContent = '¿Eliminar usuario?';
    contenido.querySelector('p').textContent = 'Esta acción no se puede deshacer';

    // Mostrar el anuncio y aplicar el efecto blur
    anuncio.style.display = 'flex';
    document.querySelector('.container').classList.add('no-touch');

    // Manejar la confirmación
    btnConfirmar.onclick = async () => {
        try {
            const response = await fetch('/eliminar-usuario', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ pin })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Usuario eliminado correctamente', 'success');
                cargarUsuarios(); // Recargar la lista de usuarios
            } else {
                mostrarNotificacion(data.error || 'Error al eliminar usuario', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar usuario', 'error');
        }

        // Cerrar el anuncio y quitar el efecto blur
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };

    // Manejar la cancelación
    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };
}
export function agregarUsuario() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');

    btnConfirmar.textContent = 'Crear';
    btnConfirmar.style.backgroundColor = '#4CAF50';

    // Personalizar el contenido del anuncio
    contenido.querySelector('h2').textContent = 'Nuevo Usuario';
    contenido.querySelector('p').innerHTML = `
        <div class="form-group">
            <p>Nombre</p>
            <input type="text" id="nombre-usuario" required>
        </div>
        <div class="form-group">
            <p>PIN</p>
            <input type="number" id="pin-usuario" required>
        </div>
    `;

    // Mostrar el anuncio
    anuncio.style.display = 'flex';
    document.querySelector('.container').classList.add('no-touch');

    // Manejar la confirmación
    btnConfirmar.onclick = async () => {
        const pin = document.getElementById('pin-usuario').value;
        const nombre = document.getElementById('nombre-usuario').value;

        if (!pin || !nombre) {
            mostrarNotificacion('Por favor complete todos los campos', 'error');
            return;
        }

        try {
            const response = await fetch('/crear-usuario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ pin, nombre })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Usuario creado correctamente', 'success');
                cargarUsuarios(); // Recargar la lista de usuarios
            } else {
                mostrarNotificacion(data.error || 'Error al crear usuario', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al crear usuario', 'error');
        }

        // Cerrar el anuncio
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };

    // Manejar la cancelación
    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };
}
export function editarUsuario(pin) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');

    btnConfirmar.textContent = 'Guardar';
    btnConfirmar.style.backgroundColor = '#2196F3';

    // Personalizar el contenido del anuncio
    contenido.querySelector('h2').textContent = 'Editar Usuario';
    contenido.querySelector('p').innerHTML = `
        <div class="form-group">
            <p>PIN Actual</p>
            <input type="text" id="pin-actual" value="${pin}" readonly>
        </div>
        <div class="form-group">
            <p>Nuevo PIN</p>
            <input type="number" id="nuevo-pin" required>
        </div>
    `;

    // Mostrar el anuncio
    anuncio.style.display = 'flex';
    document.querySelector('.container').classList.add('no-touch');

    // Manejar la confirmación
    btnConfirmar.onclick = async () => {
        const nuevoPIN = document.getElementById('nuevo-pin').value;

        if (!nuevoPIN) {
            mostrarNotificacion('Por favor ingrese el nuevo PIN', 'error');
            return;
        }

        try {
            const response = await fetch('/actualizar-usuario', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    pinActual: pin,
                    pinNuevo: nuevoPIN
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('PIN actualizado correctamente', 'success');
                cargarUsuarios(); // Recargar la lista
            } else {
                mostrarNotificacion(data.error || 'Error al actualizar PIN', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al actualizar PIN', 'error');
        }

        // Cerrar el anuncio
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };

    // Manejar la cancelación
    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };
}