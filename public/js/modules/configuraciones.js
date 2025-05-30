let usuarioActual = null;
/* =============== FUNCIONES DE INCIO DE CONFIGURACIONES O AJUSTES =============== */
export async function inicializarConfiguraciones() {
    const configuracionesView = document.querySelector('.configuraciones-view');

    try {
        mostrarCarga();
        const response = await fetch('/obtener-mi-rol');
        const userData = await response.json();
        usuarioActual = userData;
        const UPDATE_KEY = 'innopro_update_status';
        const currentVersion = localStorage.getItem(UPDATE_KEY);

        configuracionesView.innerHTML = `
        <div class="title">
                <h2><i class="fas fa-cog"></i> Ajustes</h2>
            </div>
                <div class="config-section perfil-section">
                    <h2><i class="fas fa-user-circle"></i> Perfil de Usuario</h2>
                    <div class="perfil-info">
                        <p><strong>Nombre:</strong> ${userData.nombre}</p>
                        <p><strong>Rol:</strong> ${userData.rol}</p>
                        <button class="btn-cambiar-pin anuncio-btn blue">
                            <i class="fas fa-key"></i> Cambiar PIN
                        </button>
                    </div>
                </div>

                <div class="config-section app-info">
                    <h2><i class="fas fa-info-circle"></i> Información de la Aplicación</h2>
                    <div class="app-details">
                        <p><strong>Versión:</strong> ${currentVersion}</p>
                        <p><strong>Última actualización:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Desarrollado por:</strong> Damabrava</p>
                        <p>-----------------</strong></p>
                        <p><strong>Detalles de la ultima actualización:</strong></p>
                        <p>- Carga mas rapida en pestañas</p>
                        <p>- La sesión se guarda</p>
                        <p>- Rediseño de botones</p>
                        <p>- Suguridad al inciar sesión</p>
                    </div>
                </div>

                 <div class="config-section otros-ajustes">
                <h2><i class="fas fa-cog"></i> Otros Ajustes</h2>
                <div class="ajustes-lista">
                    <div class="ajuste-item">
                        <p>Notificaciones</p>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="ajuste-item">
                        <p>Modo Oscuro</p>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                </div>
  
                <button class="logout-btn anuncio-btn red" onclick="manejarCierreSesion()">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Cerrar Sesión</span>
                </button>

                
            </div>
        `;

        // Configurar evento para cambiar PIN
        const btnCambiarPin = configuracionesView.querySelector('.btn-cambiar-pin');
        btnCambiarPin.addEventListener('click', mostrarFormularioCambioPin);

        const switches = configuracionesView.querySelectorAll('.switch input[type="checkbox"]');
        switches.forEach(switchEl => {
            switchEl.addEventListener('click', (e) => {
                e.preventDefault();
                mostrarNotificacion('Esta opción no se puede desactivar en este momento', 'error');
                switchEl.checked = true;
            });
        });


    } catch (error) {
        console.error('Error al inicializar configuraciones:', error);
        mostrarNotificacion('Error al cargar configuraciones', 'error');
    } finally {
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
        } finally {
            ocultarCarga();
        }
    });

    btnCancelar.addEventListener('click', () => {
        anuncio.style.display = 'none';
    });


}