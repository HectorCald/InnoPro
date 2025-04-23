/* ==================== CLASE PRINCIPAL DE LOGIN ==================== */
class LoginPin {
    constructor() {
        this.pinDots = document.querySelectorAll('.pin-dot');
        this.errorMessage = document.querySelector('.error-message');
        this.numericKeyboard = document.querySelector('.numeric-keyboard');
        this.currentPin = '';
        this.maxLength = 4;
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
            mostrarCarga();
            const response = await fetch('/verificar-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: this.currentPin })
            });

            const data = await response.json();

            if (data.valido) {
                this.showSuccess(data.nombre);
                setTimeout(() => {
                    window.location.replace(this.getRedirectUrl(data.rol));
                }, 1500);
            } else {
                ocultarCarga();
                this.resetPin();
                this.showError('PIN incorrecto. Intente nuevamente.');
            }
        } catch (error) {
            ocultarCarga();
            console.error('Error:', error);
            this.resetPin();
            this.showError('Error de conexión. Intente nuevamente.');
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
    const UPDATE_KEY = 'innopro_update_status';
    const currentVersion = localStorage.getItem(UPDATE_KEY);
    const versionElement = document.querySelector('.version');
    if (versionElement) {
        versionElement.textContent = `Versión: ${currentVersion || 'Sin version'}`;
    }

    const loginPin = new LoginPin();
    const pinModal = new Modal();

    // Configuración del modal de limpieza
    const cleanupModal = {
        modal: document.getElementById('cleanupModal'),
        confirmBtn: document.querySelector('#cleanupModal .confirmar'),
        closeBtn: document.querySelector('#cleanupModal .modal-close'),

        init() {
            this.confirmBtn.addEventListener('click', () => this.handleConfirm());
            this.closeBtn.addEventListener('click', () => this.close());
            window.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        },

        open() {
            this.modal.style.display = 'flex';
        },

        close() {
            this.modal.style.display = 'none';
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

                // Eliminar cookies (método más robusto)
                document.cookie.split(';').forEach(cookie => {
                    const eqPos = cookie.indexOf('=');
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                });

                mostrarNotificacion('Datos borrados correctamente', 'success');

                // Redireccionar después de 1 segundo
                setTimeout(() => {
                    window.location.replace('/desinstalar');
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
