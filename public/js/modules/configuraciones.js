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
                        <button class="btn-cambiar-pin">
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
                    <div class="ajuste-item">
                        <button class="btn-desinstalar" style="background: #ff4444; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Borrar data
                        </button>
                    </div>
                </div>
            </div>
        `;

        const btnDesinstalar = configuracionesView.querySelector('.btn-desinstalar');
        btnDesinstalar.addEventListener('click', async () => {
            const anuncio = document.querySelector('.anuncio-down');
            const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

            anuncioContenido.innerHTML = `
                <div class="encabezado">
                    <h2><i class="fas fa-exclamation-triangle"></i>Elimnacion de data</h2>
                    <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="form-grup">
                    <p style="color: #ff4444; font-weight: bold;">¡Advertencia!</p>
                    <p class="subtitle">Esta acción eliminará todos los datos de la aplicación:</p>
                    <div class=detalles-grup>
                    <p>Configuraciones guardadas</p>
                        <p>Datos de sesión</p>
                        <p>Caché almacenado</p>
                        <p>Cookies</p>
                    </div>
                    <p class="subtitle">¿Estás seguro de que deseas continuar?</p>
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn red confirmar">
                        <i class="fas fa-trash"></i> Sí, Borrar
                    </button>
                </div>
            `;

            mostrarAnuncioDown();

            const btnConfirmar = anuncioContenido.querySelector('.confirmar');
            btnConfirmar.addEventListener('click', async () => {
                try {
                    mostrarCarga();
                    const cacheKeys = await caches.keys();
                    await Promise.all(cacheKeys.map(key => caches.delete(key)));

                    // Limpiar almacenamiento
                    localStorage.clear();
                    sessionStorage.clear();

                    // Limpiar IndexedDB
                    const databases = await window.indexedDB.databases();
                    databases.forEach(db => {
                        window.indexedDB.deleteDatabase(db.name);
                    });

                    // Limpiar cookies
                    document.cookie.split(";").forEach(cookie => {
                        document.cookie = cookie
                            .replace(/^ +/, "")
                            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
                    });

                    mostrarNotificacion('Aplicación desinstalada correctamente. Cerrando...', 'success');
                    setTimeout(() => {
                        mostrarCarga();
                        window.location.href = '/desinstalar';
                    }, 2000);
                    window.close();

                } catch (error) {
                    console.error('Error al desinstalar:', error);
                    mostrarNotificacion('Error al desinstalar la aplicación', 'error');
                } finally {
                    ocultarCarga();
                    ocultarAnuncioDown();
                }
            });
        });

        // Configurar evento para cambiar PIN
        const btnCambiarPin = configuracionesView.querySelector('.btn-cambiar-pin');
        btnCambiarPin.addEventListener('click', mostrarFormularioCambioPin);



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