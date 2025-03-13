class LoginPin {
    constructor() {
        // Verificar que estamos en la página de login
        if (!document.querySelector('.pin-container')) {
            return; // No inicializar si no estamos en la página de login
        }

        this.inputs = document.querySelectorAll('.pin-input');
        this.errorMessage = document.querySelector('.error-message');
        this.numericKeyboard = document.querySelector('.numeric-keyboard');
        this.currentPin = '';
        this.currentIndex = 0;
        this.inicializar();
    }

    inicializar() {
        if (!this.numericKeyboard) return; // Salir si no existe el teclado numérico
        
        this.numericKeyboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('num-key')) {
                this.manejarTecladoNumerico(e.target);
            }
        });
    }

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
    // ... existing code ...

async validarPin(pin) {
    try {
        const response = await fetch('/verificar-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ pin })
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();

        if (data.valido) {
            this.mostrarExito(data.nombre);
        } else {
            this.mostrarError();
        }
    } catch (error) {
        console.error('Error:', error);
        this.mostrarError('Error de conexión. Por favor, intente nuevamente.');
    }
}

mostrarExito(nombre) {
    this.errorMessage.style.color = '#28a745';
    this.errorMessage.textContent = `¡Bienvenido, ${nombre}!`;
    
    // Redirigir inmediatamente
    window.location.href = '/dashboard';
}


// ... rest of the code ...


    mostrarError(mensaje = 'PIN incorrecto. Intente nuevamente.') {
        this.errorMessage.textContent = mensaje;
        this.reiniciarInputs();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.pin-container')) {
        new LoginPin();
    }
});