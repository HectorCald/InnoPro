 export async function mostrarPermisos(pin) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');

    btnConfirmar.textContent = 'Cerrar';
    btnConfirmar.style.backgroundColor = '#2196F3';
    btnCancelar.style.display = 'none';

    // Personalizar el contenido del anuncio
    contenido.querySelector('h2').textContent = 'Gestión de Permisos';
    
    try {
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
                        <h3>Permisos Actuales</h3>
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
                        <h3>Permisos Disponibles</h3>
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
}

export async function eliminarPermiso(pin, permiso) {
    try {
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
}
