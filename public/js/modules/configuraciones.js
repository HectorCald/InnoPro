let usuarioActual = null;
/* =============== FUNCIONES DE INCIO DE CONFIGURACIONES O AJUSTES =============== */
export async function inicializarConfiguraciones() {
    const configuracionesView = document.querySelector('.configuraciones-view');
    
    try {
        mostrarCarga();
        const response = await fetch('/obtener-mi-rol');
        const userData = await response.json();
        usuarioActual = userData;

        configuracionesView.innerHTML = `
        <div class="title">
                <h2><i class="fas fa-cog"></i> Ajustes</h2>
            </div>
                <div class="config-section perfil-section">
                    <h2><i class="fas fa-user-circle"></i> Perfil de Usuario</h2>
                    <div class="perfil-info">
                        <p><strong>Nombre:</strong> ${userData.nombre}</p>
                        <p><strong>Rol:</strong> ${userData.rol}</p>
                        <button class="btn-cambiar-pin">
                            <i class="fas fa-key"></i> Cambiar PIN
                        </button>
                    </div>
                </div>

                <div class="config-section app-info">
                    <h2><i class="fas fa-info-circle"></i> Información de la Aplicación</h2>
                    <div class="app-details">
                        <p><strong>Versión:</strong> Beta: 1.0.7</p>
                        <p><strong>Última actualización:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Desarrollado por:</strong> Damabrava</p>
                    </div>
                </div>

                <div class="config-section otros-ajustes">
                    <h2><i class="fas fa-cog"></i> Otros Ajustes</h2>
                    <div class="ajustes-lista">
                        <div class="ajuste-item">
                            <span>Notificaciones</span>
                            <label class="switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="ajuste-item">
                            <span>Modo Oscuro</span>
                            <label class="switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
        `;
        const switches = configuracionesView.querySelectorAll('.switch input');
        switches.forEach(switchInput => {
            switchInput.addEventListener('change', (e) => {
                if (!e.target.checked) {
                    e.target.checked = true;
                    mostrarNotificacion('Esta configuración no se puede desactivar por el momento', 'warning');
                }
            });
        });

        // Configurar evento para cambiar PIN
        const btnCambiarPin = configuracionesView.querySelector('.btn-cambiar-pin');
        btnCambiarPin.addEventListener('click', mostrarFormularioCambioPin);



    } catch (error) {
        console.error('Error al inicializar configuraciones:', error);
        mostrarNotificacion('Error al cargar configuraciones', 'error');
    }finally{
        ocultarCarga();
        scrollToTop('.configuraciones-view')
    }
}

/* =============== FUNCIONES DE CAMBIAR PIN DEL USARIO ACTUAL =============== */
async function mostrarFormularioCambioPin() {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        
         <div class="encabezado">
       <h2>Cambiar PIN</h2>
         <button class="anuncio-btn close" onclick="ocultarAnuncio()">
            <i class="fas fa-arrow-right"></i></button>
    </div>

        <div class="relleno">
            <p for="pin-actual">PIN Actual*</label>
            <input type="password" id="pin-actual" maxlength="4" placeholder="Ingresa tu PIN actual">
            <p for="nuevo-pin">Nuevo PIN*</label>
            <input type="password" id="nuevo-pin" maxlength="4"placeholder="Ingresa tu nuevo PIN">
            <p for="confirmar-pin">Confirmar PIN*</label>
            <input type="password" id="confirmar-pin" maxlength="4"placeholder="Vuelve a ingresar tu nuevo PIN">
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar">
                <i class="fas fa-save"></i> Guardar cambios
            </button>
        </div>
    `;
    mostrarAnuncio();
    const btnGuardar = anuncioContenido.querySelector('.guardar');
    const btnCancelar = anuncioContenido.querySelector('.cancelar');

    btnGuardar.addEventListener('click', async () => {
        const pinActual = document.getElementById('pin-actual').value;
        const nuevoPin = document.getElementById('nuevo-pin').value;
        const confirmarPin = document.getElementById('confirmar-pin').value;

        if (!pinActual || !nuevoPin || !confirmarPin) {
            mostrarNotificacion('Todos los campos son requeridos', 'error');
            return;
        }

        if (nuevoPin !== confirmarPin) {
            mostrarNotificacion('Los PINs nuevos no coinciden', 'error');
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: pinActual,
                    nuevoPIN: nuevoPin
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('PIN actualizado correctamente', 'success');
                anuncio.style.display = 'none';
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            mostrarNotificacion('Error al actualizar PIN: ' + error.message, 'error');
        }finally{
            ocultarCarga();
        }
    });

    btnCancelar.addEventListener('click', () => {
        anuncio.style.display = 'none';
    });

    
}