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
        // Agregar estado al historial
        window.history.pushState({anuncioAbierto: true}, '');
        
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
// Manejador del botón físico de retroceso
window.addEventListener('popstate', (event) => {
    const anuncio = document.querySelector('.anuncio');
    const anunciodown = document.querySelector('.anuncio-down');

    if (anuncio && anuncio.style.display === 'flex' || anunciodown && anunciodown.style.display === 'flex') {
        ocultarAnuncio();
        ocultarAnuncioDown();
        window.history.pushState(null, '', window.location.href);
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
    
    if (anuncioVisible && anuncioVisible.style.display === 'flex') {
        anuncioVisible.classList.add('slide-out');

        setTimeout(() => {
            anuncioVisible.style.display = 'none';
            anuncioVisible.classList.remove('slide-out');
        }, 300);

        if (overlay) overlay.style.display = 'none';
        if (container) container.classList.remove('no-touch');
    }
}
window.ocultarAnuncioDown = ocultarAnuncioDown;

export function mostrarAnuncioDown() {
    const anuncioVisible = document.querySelector('.anuncio-down');

    if (anuncioVisible) {
        // Agregar estado al historial
        window.history.pushState({anuncioAbierto: true}, '');
        
        anuncioVisible.classList.add('slide-in');
        anuncioVisible.style.display = 'flex';


        setTimeout(() => {
            anuncioVisible.classList.remove('slide-in');
        }, 300);
    }
    anuncioVisible.addEventListener('click', () => {
        ocultarAnuncioDown();
    });
}
window.mostrarAnuncioDown = mostrarAnuncioDown;
