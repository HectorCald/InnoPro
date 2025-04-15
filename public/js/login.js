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

    showLoading() {
        document.querySelector('.loading-screen').style.display = 'flex';
    }

    hideLoading() {
        document.querySelector('.loading-screen').style.display = 'none';
    }

    showSuccess(nombre) {
        this.errorMessage.style.color = 'var(--success)';
        this.errorMessage.textContent = `¡Bienvenido, ${nombre}!`;
    }

    showError(message = 'PIN incorrecto. Intente nuevamente.') {
        this.hideLoading();
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
        // Add console.log to debug
        console.log('Modal initialized:', {
            modal: this.modal,
            sinPinBtn: this.sinPinBtn,
            closeBtn: this.closeBtn
        });

        if (this.sinPinBtn) {
            this.sinPinBtn.addEventListener('click', () => {
                console.log('Sin PIN clicked');
                this.openModal();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
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
    const loginPin = new LoginPin();
    const modal = new Modal();

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
