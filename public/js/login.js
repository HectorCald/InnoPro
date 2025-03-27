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

/* ==================== INICIALIZACIÓN DE LA APLICACIÓN ==================== */
document.addEventListener('DOMContentLoaded', async () => {
    const loginPin = new LoginPin();

    // Manejo del tema
    const themeToggle = document.querySelector('#themeToggle');
    
    // Verificar y aplicar el tema guardado
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.checked = currentTheme === 'light';

    // Manejar cambios en el tema
    themeToggle.addEventListener('change', function() {
        const newTheme = this.checked ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    const btnConsulta = document.querySelector('.consultarProducto');
    if (btnConsulta) {
        btnConsulta.addEventListener('click', () => mostrar('.cuentas'));
    }
});
// ... código existente ...

async function initializeFirebaseMessaging() {
    try {
        // Importar módulos de Firebase
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js');

        // Configuración de Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyCbfR1fpCDIsE8R_9RAN9lG0H9bsk2WQeQ",
            authDomain: "damabravaapp.firebaseapp.com",
            projectId: "damabravaapp",
            storageBucket: "damabravaapp.firebasestorage.app",
            messagingSenderId: "36776613676",
            appId: "1:36776613676:web:f031d9435399a75a9afe89",
            measurementId: "G-NX0Z9ZPC5R"
        };

        // Inicializar Firebase
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // Resto del código...
    } catch (error) {
        console.error('Error al inicializar Firebase:', error);
    }
}

// ... resto del código ...
function mostrarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'flex';
}

function ocultarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'none';
}

// Función para aplicar el tema al cargar la página
function aplicarTemaGuardado() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeToggle = document.querySelector('#themeToggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'light';
    }
}

// Aplicar tema al cargar
aplicarTemaGuardado();