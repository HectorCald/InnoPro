/* ==================== CLASE PRINCIPAL DE LOGIN ==================== */
class LoginPin {
    constructor() {
        this.pinDots = document.querySelectorAll('.pin-dot');
        this.errorMessage = document.querySelector('.error-message');
        this.numericKeyboard = document.querySelector('.numeric-keyboard');
        this.currentPin = '';
        this.maxLength = 4;
        this.secretSequence = ['5501', '5502', '5503'];
        this.currentSequenceIndex = 0;
        this.init();
    }

    init() {
        if (!this.numericKeyboard) return;

        this.numericKeyboard.addEventListener('click', (e) => {
            const key = e.target.closest('.num-key');
            if (key) {
                this.handleKeyPress(key);
            }
        });
    }

    handleKeyPress(key) {
        const value = key.textContent.trim();

        if (value === 'C') {
            this.resetPin();
            return;
        }

        if (key.classList.contains('delete')) {
            this.deleteLastDigit();
            return;
        }

        if (this.currentPin.length < this.maxLength) {
            this.currentPin += value;
            this.updatePinDots();

            if (this.currentPin.length === this.maxLength) {
                this.validatePin();
            }
        }
    }

    updatePinDots() {
        this.pinDots.forEach((dot, index) => {
            dot.classList.toggle('filled', index < this.currentPin.length);
        });
    }

    deleteLastDigit() {
        if (this.currentPin.length > 0) {
            this.currentPin = this.currentPin.slice(0, -1);
            this.updatePinDots();
        }
    }

    resetPin() {
        this.currentPin = '';
        this.updatePinDots();
        this.errorMessage.textContent = '';
    }

    async validatePin() {
        try {
            // Verificar si es el inicio de la secuencia (5501)
            if (this.currentPin === '5501') {
                this.currentSequenceIndex = 1; // Iniciar secuencia
                this.resetPin();

                // Iniciar temporizador de 2 segundos
                setTimeout(() => {
                    if (this.currentSequenceIndex === 1) {
                        // Si no se ingresó el siguiente PIN en 2 segundos, tratar como PIN normal
                        this.currentSequenceIndex = 0;
                        this.validateNormalPin('5501');
                    }
                }, 2000);

                return;
            } else if (this.currentSequenceIndex > 0) {
                // Ya estamos en secuencia, verificar siguiente PIN
                if (this.currentPin === this.secretSequence[this.currentSequenceIndex]) {
                    this.currentSequenceIndex++;
                    if (this.currentSequenceIndex === this.secretSequence.length) {
                        await this.handleConfirm();
                        this.currentSequenceIndex = 0;
                        return;
                    } else {
                        this.resetPin();
                        return;
                    }
                } else {
                    // PIN incorrecto en secuencia, cancelar secuencia
                    this.currentSequenceIndex = 0;
                }
            }

            await this.validateNormalPin(this.currentPin);
        } catch (error) {
            ocultarCarga();
            console.error('Error:', error);
            this.resetPin();
            this.showError('Error de conexión. Intente nuevamente.');
        }
    }


    async validateNormalPin(pin) {
        mostrarCarga();
        const nombreGuardado = localStorage.getItem('innopro_user_name');

        const response = await fetch('/verificar-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pin: pin,
                nombreGuardado: nombreGuardado
            })
        });

        const data = await response.json();

        if (data.valido) {
            // Si es primer ingreso o el nombre coincide (ya verificado en el backend)
            localStorage.setItem('innopro_user_name', data.nombre);
            localStorage.setItem('innopro_user_pin', pin);
            this.showSuccess(data.nombre);
            setTimeout(() => {
                window.location.replace(this.getRedirectUrl(data.rol));
            }, 1500);
        } else {
            ocultarCarga();
            this.resetPin();
            if (data.mensaje === 'PIN no corresponde al usuario actual') {
                localStorage.removeItem('innopro_user_pin'); // Clear saved PIN
                mostrarModalPinIncorrecto();
            } else {
                this.showError('PIN incorrecto. Intente nuevamente.');
            }
        }
    }

    autoLogin() {
        const savedPin = localStorage.getItem('innopro_user_pin');
        const savedName = localStorage.getItem('innopro_user_name');

        console.log('Estado actual de credenciales:', {
            nombreGuardado: savedName,
            pinGuardado: savedPin,
            cookies: document.cookie,
            todosLosDatos: {
                localStorage: { ...localStorage },
                sessionStorage: { ...sessionStorage }
            }
        });


        if (savedPin && savedName) {
            fetch('/verificar-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: savedPin })
            })
                .then(response => response.json())
                .then(data => {
                    console.log('AutoLogin - Verificación:', {
                        nombreGuardado: savedName,
                        nombreDelPin: data.nombre,
                        pinGuardado: savedPin,
                        coinciden: data.nombre === savedName
                    });

                    // Solo proceder si el PIN es válido y el nombre coincide exactamente
                    if (data.valido && data.nombre === savedName) {
                        this.currentPin = savedPin;
                        this.updatePinDots();
                        this.validatePin();
                    } else {
                        // Si no coincide, limpiar el PIN guardado y mostrar mensaje
                        localStorage.removeItem('innopro_user_pin');
                        console.log('AutoLogin fallido - Nombres no coinciden');
                        if (data.valido) {
                            mostrarModalPinIncorrecto();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error en autoLogin:', error);
                    localStorage.removeItem('innopro_user_pin'); // También limpiar en caso de error
                });
        }
    }

    async handleConfirm() {
        try {
            mostrarCarga();
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map(key => caches.delete(key)));

            localStorage.clear();
            sessionStorage.clear();

            const databases = await window.indexedDB.databases();
            await Promise.all(
                databases.map(db =>
                    new Promise((resolve, reject) => {
                        const request = indexedDB.deleteDatabase(db.name);
                        request.onsuccess = resolve;
                        request.onerror = reject;
                    })
                )
            );

            document.cookie.split(';').forEach(cookie => {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            });

            window.location.replace('/');
        } catch (error) {
            console.error('Error en limpieza:', error);
            this.resetPin();
        }
    }


    getRedirectUrl(rol) {
        const routes = {
            'admin': '/dashboard_db',
            'almacen': '/dashboard_alm',
            'default': '/dashboard'
        };
        return routes[rol] || routes.default;
    }

    showSuccess(nombre) {
        this.errorMessage.style.color = 'var(--success)';
        this.errorMessage.textContent = `¡Bienvenido, ${nombre}!`;
        guardarNombreUsuario(nombre);
    }

    showError(message = 'PIN incorrecto. Intente nuevamente.') {
        // Eliminar la llamada a hideLoading()
        this.errorMessage.style.color = 'var(--error)';
        this.errorMessage.textContent = message;
        this.resetPin();
    }
}
/* =============== CLASE MODAL NO TIENE PIN =============== */
class Modal {
    constructor() {
        this.modal = document.getElementById('pinModal');
        this.sinPinBtn = document.querySelector('.sin-pin');
        this.closeBtn = document.querySelector('.modal-close');
        this.init();
    }

    init() {

        if (this.sinPinBtn) {
            this.sinPinBtn.addEventListener('click', () => {
                this.openModal();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}

/* =============== FUNCIONES DE LLAMADO =============== */
document.addEventListener('DOMContentLoaded', async () => {
    mostrarCarga();
    const UPDATE_KEY = 'innopro_update_status';
    const currentVersion = localStorage.getItem(UPDATE_KEY);
    const versionElement = document.querySelector('.version');
    if (versionElement) {
        versionElement.textContent = `Versión: ${currentVersion || 'Sin version'}`;
    }
    cargarNombreBienvenida();
    const loginPin = new LoginPin();
    const pinModal = new Modal();

    // Configuración del modal de limpieza
    const cleanupModal = {
        modal: document.getElementById('cleanupModal'),
        confirmBtn: document.querySelector('#cleanupModal .confirmar'),
        closeBtn: document.querySelector('#cleanupModal .modal-close'),

        init() {
            this.confirmBtn.addEventListener('click', () => this.solicitarClave());
            this.closeBtn.addEventListener('click', () => this.close());
            window.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        },

        open() {
            this.modal.style.display = 'flex';
            // Actualizar el contenido del modal para incluir el campo de clave
            this.modal.querySelector('.modal-content').innerHTML = `
                <h2>¿Borrar datos locales?</h2>
                <p>Esta acción eliminará todos los datos almacenados:</p>
                <ul class="cleanup-list">
                    <li><i class="fas fa-database"></i> Caché y cookies</li>
                    <li><i class="fas fa-key"></i> Configuraciones y inicio de sesión</li>
                    <li><i class="fas fa-history"></i> Historial local</li>
                </ul>
                <input type="password" id="claveAdmin" class="admin-input" placeholder="Clave administrativa" style="border: 1px solid gray; border-radius:10px">
                <div class="modal-buttons">
                    <button class="confirmar">Confirmar</button>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
            `;
            // Actualizar los selectores de botones
            this.confirmBtn = this.modal.querySelector('.confirmar');
            this.closeBtn = this.modal.querySelector('.modal-close');
            // Reconectar eventos
            this.confirmBtn.addEventListener('click', () => this.solicitarClave());
            this.closeBtn.addEventListener('click', () => this.close());
        },

        close() {
            this.modal.style.display = 'none';
        },

        async solicitarClave() {
            const claveInput = this.modal.querySelector('#claveAdmin');
            const clave = claveInput.value.trim();

            if (!clave) {
                mostrarNotificacion('Ingrese la clave administrativa', 'warning');
                return;
            }

            mostrarCarga();
            const esValido = await verificarClaveAdmin(clave);

            if (esValido) {
                this.handleConfirm();
            } else {
                ocultarCarga();
                mostrarNotificacion('Clave administrativa incorrecta', 'error');
                claveInput.value = '';
            }
        },


        async handleConfirm() {
            try {
                mostrarCarga();
                // Limpiar caché
                const cacheKeys = await caches.keys();
                await Promise.all(cacheKeys.map(key => caches.delete(key)));

                // Limpiar almacenamientos
                localStorage.clear();
                sessionStorage.clear();

                // Eliminar bases de datos IndexedDB
                const databases = await window.indexedDB.databases();
                await Promise.all(
                    databases.map(db =>
                        new Promise((resolve, reject) => {
                            const request = indexedDB.deleteDatabase(db.name);
                            request.onsuccess = resolve;
                            request.onerror = reject;
                        })
                    )
                );

                // Eliminar cookies
                document.cookie.split(';').forEach(cookie => {
                    const eqPos = cookie.indexOf('=');
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                });

                mostrarNotificacion('Datos borrados correctamente', 'success');

                // Redireccionar después de 1 segundo
                setTimeout(() => {
                    window.location.replace('/');
                }, 1000);

            } catch (error) {
                console.error('Error en limpieza:', error);
                mostrarNotificacion('Error al limpiar el almacenamiento', 'error');
            } finally {
                ocultarCarga();
                this.close();
            }
        }



    };
    cleanupModal.init();

    // Manejador del botón de desinstalación
    const btnDesinstalar = document.querySelector('.btn-desinstalar');
    if (btnDesinstalar) {
        btnDesinstalar.addEventListener('click', () => {
            cleanupModal.open();
        });
    }

    // Configuración de botón de consulta (si existe)
    const btnConsulta = document.querySelector('.consultarProducto');
    if (btnConsulta) {
        btnConsulta.addEventListener('click', () => mostrar('.cuentas'));
    }
    ocultarCarga();

});
/* =============== FUNCIONES DE CARGA LOANDERS =============== */
function mostrarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'flex';
}
function ocultarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'none';
}

function formatearNombre(nombre) {
    return nombre
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}

function guardarNombreUsuario(nombre) {
    const nombreFormateado = formatearNombre(nombre);
    localStorage.setItem('innopro_user_name', nombreFormateado);
}

function cargarNombreBienvenida() {
    const nombreGuardado = localStorage.getItem('innopro_user_name');
    const bienvenidoElement = document.querySelector('.bienvenido-user');
    if (bienvenidoElement && nombreGuardado) {
        // Obtener solo el primer nombre
        const primerNombre = nombreGuardado.split(' ')[0];
        bienvenidoElement.textContent = `¡Hola, ${primerNombre}!`;
    }
    window.nombreGuardado = nombreGuardado;
}

function mostrarModalPinIncorrecto() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'pinIncorrectoModal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content">
            <h2><strong>ADVERTENCIA!</strong></h2>
            <p>Por seguridad, no está permitido usar un <strong>PIN</strong>  que no corresponde al usuario <strong> ${nombreGuardado}</strong>.</p>
            <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}
function verificarUsuarioPin(nombrePin) {
    const nombreGuardado = localStorage.getItem('innopro_user_name');
    if (!nombreGuardado) return true; // Primera vez, permitir acceso
    return formatearNombre(nombrePin) === nombreGuardado;
}
async function verificarClaveAdmin(clave) {
    // Clave administrativa predefinida (puedes cambiarla por la que desees)
    const CLAVE_ADMIN = '4132';

    try {
        // Simular un pequeño retraso para dar sensación de verificación
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar si la clave coincide
        return clave === CLAVE_ADMIN;
    } catch (error) {
        console.error('Error en verificación:', error);
        return false;
    }
}



