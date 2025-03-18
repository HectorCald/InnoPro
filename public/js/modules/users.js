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
                                            <i class="fas fa-key"></i> Roles
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
            mostrarCarga();
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
        finally{
            ocultarCarga();
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
export async function agregarUsuario() {
    try {
        mostrarCarga();
        const responseRoles = await fetch('/obtener-lista-roles', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        const dataRoles = await responseRoles.json();
        const roles = dataRoles.success ? dataRoles.roles : [];

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        const btnConfirmar = anuncio.querySelector('.confirmar');
        const btnCancelar = anuncio.querySelector('.cancelar');

        btnCancelar.style.display = 'block';
        btnConfirmar.textContent = 'Crear';
        btnConfirmar.style.backgroundColor = '#4CAF50';

        contenido.querySelector('h2').textContent = 'Nuevo Usuario';
        contenido.querySelector('p').innerHTML = `
            <div class="form-group">
                <label>Nombre del Usuario</label>
                <input type="text" id="nombre-usuario" required>
            </div>
            <div class="form-group">
                <label>PIN (4 dígitos)</label>
                <input type="text" id="pin-usuario" maxlength="4" pattern="[0-9]{4}" required>
            </div>
            <div class="form-group">
                <label>Selecciona un Rol</label>
                <div class="roles-container">
                    ${roles.map(rol => `
                        <div class="rol-option" data-rol="${rol}" onclick="seleccionarRol(this)">
                            <span>${rol}</span>
                        </div>
                    `).join('')}
                </div>
                <input type="hidden" id="rol-seleccionado">
            </div>
        `;

        // Show the dialog
        anuncio.style.display = 'flex';

        // Handle form submission
        btnConfirmar.onclick = async () => {
            const nombre = document.getElementById('nombre-usuario').value;
            const pin = document.getElementById('pin-usuario').value;
            const rol = document.getElementById('rol-seleccionado').value;

            if (!nombre || !pin || !rol) {
                mostrarNotificacion('Por favor complete todos los campos', 'error');
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch('/crear-usuario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, pin, rol })
                });

                const data = await response.json();
                if (data.success) {
                    mostrarNotificacion('Usuario creado exitosamente', 'success');
                    cargarUsuarios();
                    anuncio.style.display = 'none';
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                mostrarNotificacion(error.message || 'Error al crear usuario', 'error');
            }
            finally{
                ocultarCarga();
            }
        };
        btnCancelar.onclick = () => {
            anuncio.style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
        };
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar roles', 'error');
    }
    finally{
        ocultarCarga();
    }
}
function seleccionarRol(elemento) {
    // Remove selection from all roles
    document.querySelectorAll('.rol-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked role
    elemento.classList.add('selected');
    
    // Update hidden input
    document.getElementById('rol-seleccionado').value = elemento.dataset.rol;
}
window.seleccionarRol = seleccionarRol;
export function editarUsuario(pin) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');

    btnConfirmar.textContent = 'Guardar';
    btnConfirmar.style.backgroundColor = '#2196F3';
    btnCancelar.style.display = 'block';

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
            mostrarCarga();
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
        finally{
            ocultarCarga();
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
export async function mostrarPermisos(pin) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');

    btnConfirmar.textContent = 'Cerrar';
    btnConfirmar.style.backgroundColor = '#2196F3';
    btnCancelar.style.display = 'none';

    // Personalizar el contenido del anuncio
    contenido.querySelector('h2').textContent = 'Gestión de Roles';
    
    try {
        mostrarCarga();
        // Obtener roles actuales del usuario
        // Obtener permisos actuales del usuario
        const responsePermisos = await fetch(`/obtener-permisos/${pin}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        // Obtener lista completa de permisos disponibles
        const responseListaPermisos = await fetch('/obtener-lista-permisos', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const dataPermisos = await responsePermisos.json();
        const dataListaPermisos = await responseListaPermisos.json();
        
        if (dataPermisos.success && dataListaPermisos.success) {
            const permisosActuales = dataPermisos.permisos;
            const todosLosPermisos = dataListaPermisos.permisos;

            contenido.querySelector('p').innerHTML = `
                <div class="permisos-lista">
                    <p>PIN: ${pin}</p>
                    <div class="permisos-container">
                        <h3>Roles Actuales</h3>
                        <div class="permisos-actuales">
                            ${permisosActuales.length > 0 
                                ? permisosActuales.map(permiso => `
                                    <div class="permiso-item" id="permiso-${permiso.replace(/\s/g, '-')}">
                                        <span><i class="fas fa-check-circle"></i> ${permiso}</span>
                                        <button class="btn-eliminar-permiso" onclick="eliminarPermiso('${pin}', '${permiso}')">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('')
                                : '<p class="no-permisos">Este usuario no tiene permisos asignados</p>'
                            }
                        </div>
                        <h3>Roles Disponibles</h3>
                        <div class="permisos-disponibles">
                            ${todosLosPermisos
                                .filter(permiso => !permisosActuales.includes(permiso))
                                .map(permiso => `
                                    <div class="permiso-disponible" onclick="agregarPermiso('${pin}', '${permiso}')">
                                        <i class="fas fa-plus-circle"></i>
                                        ${permiso}
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            `;
        } else {
            contenido.querySelector('p').innerHTML = `
                <div class="error-mensaje">
                    <i class="fas fa-exclamation-circle"></i>
                    Error al cargar los permisos
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        contenido.querySelector('p').innerHTML = `
            <div class="error-mensaje">
                <i class="fas fa-exclamation-circle"></i>
                Error al cargar los permisos
            </div>
        `;
    }
    finally{
        ocultarCarga();
    }

    // Mostrar el anuncio
    anuncio.style.display = 'flex';
    document.querySelector('.container').classList.add('no-touch');

    // Manejar el cierre
    const cerrarAnuncio = () => {
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };

    btnConfirmar.onclick = cerrarAnuncio;
    btnCancelar.onclick = cerrarAnuncio;
}
export async function agregarPermiso(pin, permiso, event) {  // Add event parameter
    try {
        mostrarCarga();
        const response = await fetch('/agregar-permiso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ pin, permiso })
        });

        const data = await response.json();
        if (data.success) {
            // Get the clicked element directly from the DOM
            const permisoDisponible = document.querySelector(`.permiso-disponible[onclick*="${permiso}"]`);
            if (permisoDisponible) {
                permisoDisponible.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    permisoDisponible.remove();
                    
                    // Add to current permissions
                    const permisosActuales = document.querySelector('.permisos-actuales');
                    if (permisosActuales) {
                        const noPermisos = permisosActuales.querySelector('.no-permisos');
                        if (noPermisos) noPermisos.remove();

                        const nuevoPermiso = document.createElement('div');
                        nuevoPermiso.className = 'permiso-item permiso-agregado';
                        nuevoPermiso.id = `permiso-${permiso.replace(/\s/g, '-')}`;
                        nuevoPermiso.innerHTML = `
                            <span><i class="fas fa-check-circle"></i> ${permiso}</span>
                            <button class="btn-eliminar-permiso" onclick="eliminarPermiso('${pin}', '${permiso}')">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                        permisosActuales.appendChild(nuevoPermiso);
                    }
                }, 300);
            }
            
            mostrarNotificacion('Permiso agregado correctamente', 'success');
        } else {
            mostrarNotificacion(data.error || 'Error al agregar permiso', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar permiso', 'error');
    }
    finally{
        ocultarCarga();
    }
}
export async function eliminarPermiso(pin, permiso) {
    try {
        mostrarCarga();
        const response = await fetch('/eliminar-permiso', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ pin, permiso })
        });

        const data = await response.json();
        if (data.success) {
            // Eliminar visualmente el permiso actual
            const permisoElement = document.getElementById(`permiso-${permiso.replace(/\s/g, '-')}`);
            if (permisoElement) {
                permisoElement.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    permisoElement.remove();
                    
                    // Agregar el permiso a la sección de disponibles
                    const permisosDisponibles = document.querySelector('.permisos-disponibles');
                    if (permisosDisponibles) {
                        const nuevoPermisoDisponible = document.createElement('div');
                        nuevoPermisoDisponible.className = 'permiso-disponible';
                        nuevoPermisoDisponible.onclick = () => agregarPermiso(pin, permiso);
                        nuevoPermisoDisponible.innerHTML = `
                            <i class="fas fa-plus-circle"></i>
                            ${permiso}
                        `;
                        nuevoPermisoDisponible.style.animation = 'fadeIn 0.3s ease-in forwards';
                        permisosDisponibles.appendChild(nuevoPermisoDisponible);
                    }
                }, 300);
            }
            mostrarNotificacion('Permiso eliminado correctamente', 'success');
        } else {
            mostrarNotificacion(data.error || 'Error al eliminar permiso', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar permiso', 'error');
    }
    finally{
        ocultarCarga();
    }
}
