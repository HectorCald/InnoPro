import { regresarAInicio } from './menu.js';
let menuHistorial = [];
export function ocultarAnuncio() {
    const anuncioVisible = document.querySelector('.anuncio');
    const overlay = document.querySelector('.overlay');
    const container = document.querySelector('.container');
    
    if (anuncioVisible && anuncioVisible.style.display === 'flex') {
        anuncioVisible.classList.add('slide-out');
        container.style.transition = 'margin-right 0.3s ease-out';
        container.style.marginRight = '0';

        setTimeout(() => {
            anuncioVisible.style.display = 'none';
            anuncioVisible.classList.remove('slide-out');
        }, 300);

        if (overlay) overlay.style.display = 'none';
        if (container) container.classList.remove('no-touch');
    }
}
window.ocultarAnuncio = ocultarAnuncio;

export function mostrarAnuncio() {
    const anuncioVisible = document.querySelector('.anuncio');
    const container = document.querySelector('.container');

    if (anuncioVisible) {
        // Guardar el historial actual antes de mostrar el anuncio
        menuHistorial = [...window.history.state?.menuHistory || []];
        
        // Agregar estado al historial con el historial del menú guardado
        window.history.pushState({
            anuncioAbierto: true,
            menuHistory: menuHistorial
        }, '');
        
        anuncioVisible.classList.add('slide-in');
        anuncioVisible.style.display = 'flex';

        if (window.innerWidth >= 768) {
            container.style.transition = 'margin-right 0.3s ease-out';
            container.style.marginRight = '400px';
        } else {
            container.style.marginRight = '0';
        }

        setTimeout(() => {
            anuncioVisible.classList.remove('slide-in');
        }, 300);
    }
}
window.mostrarAnuncio = mostrarAnuncio;

document.addEventListener('DOMContentLoaded', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    }
    
    // Ocultar barra de navegación en Android
    if (navigator.userAgent.match(/Android/i)) {
        window.scrollTo(0, 1);
    }
});
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
        window.scrollTo(0, 1);
    }, 300);
});


window.addEventListener('popstate', (event) => {
    const anuncio = document.querySelector('.anuncio');
    const anunciodown = document.querySelector('.anuncio-down');
    const homeView = document.querySelector('.home-view');

    // Si hay anuncio visible, cerrarlo y restaurar historial
    if (anuncio && anuncio.style.display === 'flex' || anunciodown && anunciodown.style.display === 'flex') {
        ocultarAnuncio();
        ocultarAnuncioDown();
        
        // Restaurar el historial del menú
        if (event.state?.menuHistory) {
            event.state.menuHistory.forEach(estado => {
                window.history.pushState(estado, '');
            });
        }
        return;
    }

    // Manejar la navegación normal del menú
    if (event.state?.vista) {
        const vistaId = event.state.vista;
        const vistaActual = document.querySelector(`.${vistaId}`);
        if (vistaActual) {
            document.querySelectorAll('.view').forEach(v => {
                v.style.display = 'none';
                v.style.opacity = '0';
            });
            vistaActual.style.display = 'flex';
            vistaActual.style.opacity = '1';
            
            // Actualizar botón activo
            if (typeof window.actualizarBotonActivo === 'function') {
                window.actualizarBotonActivo(vistaId);
            }
        }
    } else if (homeView && !homeView.classList.contains('active')) {
        regresarAInicio();
    }
});



// Soporte para Navigation API (experimental)
if ('navigation' in window) {
    window.navigation.addEventListener('navigate', (event) => {
        if (event.destination.url === 'app://innopro/') {
            ocultarAnuncio();
        }
    });
}

export function ocultarAnuncioDown() {
    const anuncioVisible = document.querySelector('.anuncio-down');
    const overlay = document.querySelector('.overlay');
    const container = document.querySelector('.container'); // Ensure this line is included

    if (anuncioVisible && anuncioVisible.style.display === 'flex') {
        anuncioVisible.classList.add('slide-out');

        setTimeout(() => {
            anuncioVisible.style.display = 'none';
            anuncioVisible.classList.remove('slide-out');
        }, 300);

        if (overlay) overlay.style.display = 'none';
        if (container) container.classList.remove('no-touch'); // Ensure this line is included
    }
}
window.ocultarAnuncioDown = ocultarAnuncioDown;



export function mostrarAnuncioDown() {
    const anuncioVisible = document.querySelector('.anuncio-down');

    if (anuncioVisible) {
        // Guardar el historial actual antes de mostrar el anuncio
        menuHistorial = [...window.history.state?.menuHistory || []];
        
        window.history.pushState({
            anuncioAbierto: true,
            menuHistory: menuHistorial
        }, '');
        
        anuncioVisible.classList.add('slide-in');
        anuncioVisible.style.display = 'flex';

        setTimeout(() => {
            anuncioVisible.classList.remove('slide-in');
        }, 300);
    }
    ocultarAnuncio();
}
window.mostrarAnuncioDown = mostrarAnuncioDown;
