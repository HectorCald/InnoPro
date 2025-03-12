document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    manejarCierreSesion();
    inicializarFormulario();
});

async function bienvenida() {
    try {
        const response = await fetch('/obtener-nombre');
        const data = await response.json();
        
        if (data.nombre) {
            const bienvenida = document.querySelector('.bienvenida');
            if (bienvenida) {
                bienvenida.innerHTML = '<i class="fas fa-microchip"></i> DB Tec.';
            }
        }
    } catch (error) {
        console.error('Error al obtener el nombre:', error);
    }
}
function manejarCierreSesion() {
    const btnLogout = document.querySelector('.logout-btn');
    btnLogout.addEventListener('click', async () => {
        try {
            const response = await fetch('/cerrar-sesion', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    });
}
function mostrar(item) {
    var div = document.querySelector(item);
    if (div.style.display === 'none' || div.style.display === '') {
        div.style.display = 'flex';
    } else {
        div.style.display = 'none';
    }
    resetearFormulario();
}
function inicializarFormulario() {
    const form = document.querySelector('.form1 form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {};
        
        // Process each form field
        formData.forEach((value, key) => {
            // Convert numeric fields
            if (['lote', 'gramaje', 'microondas', 'envasesTerminados'].includes(key)) {
                data[key] = Number(value) || 0;
            } else {
                data[key] = value;
            }
        });

        console.log('Datos a enviar:', data); // Debug log
        
        try {
            const response = await fetch('/registrar-produccion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result); // Debug log
            
            if (result.success) {
                alert('Registro guardado correctamente');
                resetearFormulario();
                mostrar('.form1');
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error completo:', error);
            alert('Error al guardar el registro: ' + error.message);
        }
    });
}
function resetearFormulario() {
    const inputs = document.querySelectorAll('.form1 form input');
    inputs.forEach(input => {
        input.value = '';
    });
    const selector = document.querySelector('.form1 form select');
    if (selector) {
        selector.selectedIndex = 0;
    }
}