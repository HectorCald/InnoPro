/* ==================== CLASE PRINCIPAL DE LOGIN ==================== */
class LoginPin {
    constructor() {
        if (!document.querySelector('.pin-container')) {
            return;
        }

        this.inputs = document.querySelectorAll('.pin-input');
        this.errorMessage = document.querySelector('.error-message');
        this.numericKeyboard = document.querySelector('.numeric-keyboard');
        this.currentPin = '';
        this.currentIndex = 0;
        this.inicializar();
    }

    /* ==================== INICIALIZACIÓN Y EVENTOS ==================== */
    inicializar() {
        if (!this.numericKeyboard) return;

        this.numericKeyboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('num-key')) {
                this.manejarTecladoNumerico(e.target);
            }
        });
    }

    /* ==================== GESTIÓN DEL TECLADO NUMÉRICO ==================== */
    manejarTecladoNumerico(tecla) {
        const valor = tecla.textContent;

        if (valor === 'C') {
            this.reiniciarInputs();
            return;
        }

        if (valor === '⌫') {
            this.borrarUltimoDigito();
            return;
        }

        if (this.currentIndex < 4) {
            this.inputs[this.currentIndex].value = valor;
            this.inputs[this.currentIndex].classList.add('filled');

            const pinArray = this.currentPin.split('');
            pinArray[this.currentIndex] = valor;
            this.currentPin = pinArray.join('');

            this.currentIndex++;

            if (this.currentPin.length === 4) {
                this.validarPin(this.currentPin);
            }
        }
    }

    /* ==================== MANIPULACIÓN DE INPUTS ==================== */
    borrarUltimoDigito() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.inputs[this.currentIndex].value = '';
            this.inputs[this.currentIndex].classList.remove('filled');

            const pinArray = this.currentPin.split('');
            pinArray[this.currentIndex] = '';
            this.currentPin = pinArray.join('');
        }
    }

    reiniciarInputs() {
        this.inputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled');
        });
        this.currentPin = '';
        this.currentIndex = 0;
    }

    /* ==================== VALIDACIÓN Y AUTENTICACIÓN ==================== */
    async validarPin(pin) {
    try {
        const response = await fetch('/verificar-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pin })
        });

        const data = await response.json();

        if (data.valido) {
            this.mostrarExito(data.nombre);
            // Redirigir según el rol
            setTimeout(() => {
                if (data.rol === 'admin') {
                    window.location.replace('/dashboard_adm');
                } else if (data.rol === 'almacen') {
                    window.location.replace('/dashboard_alm');
                } else {
                    window.location.replace('/dashboard');
                }
            }, 1500);
        } else {
            this.mostrarError();
        }
    } catch (error) {
        console.error('Error:', error);
        this.mostrarError('Error de conexión');
    }
}

    /* ==================== GESTIÓN DE MENSAJES Y RESPUESTAS ==================== */
        /* ==================== GESTIÓN DE MENSAJES Y RESPUESTAS ==================== */
    mostrarExito(nombre) {
        this.errorMessage.style.color = '#28a745';
        this.errorMessage.textContent = `¡Bienvenido, ${nombre}!`;
        // Eliminamos la redirección aquí ya que se maneja en validarPin
    }

    mostrarError(mensaje = 'PIN incorrecto. Intente nuevamente.') {
        this.errorMessage.textContent = mensaje;
        this.reiniciarInputs();
    }
}

/* ==================== INICIALIZACIÓN DE LA APLICACIÓN ==================== */
document.addEventListener('DOMContentLoaded',async () => {
    const loginPin = new LoginPin();
    bienvenida();

    const btnConsulta = document.querySelector('.consultarProducto');
    if (btnConsulta) {
        btnConsulta.addEventListener('click', () => mostrar('.cuentas'));
    }
});
