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

