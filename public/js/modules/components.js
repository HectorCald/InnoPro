export function ocultarAnuncio() {
    const anuncioVisible = document.querySelector('.anuncio');
    const overlay = document.querySelector('.overlay');
    const container = document.querySelector('.container');
    
    if (anuncioVisible && anuncioVisible.style.display === 'flex') {
        anuncioVisible.classList.add('slide-out'); // Add class for exit animation
        container.style.transition = 'margin-right 0.3s ease-out'; // Add transition
        container.style.marginRight = '0'; // Animate margin-right to 0

        setTimeout(() => {
            anuncioVisible.style.display = 'none';
            anuncioVisible.classList.remove('slide-out'); // Remove class after animation
        }, 300); // Duration of the animation

        if (overlay) overlay.style.display = 'none';
        if (container) container.classList.remove('no-touch');
    }
}
window.ocultarAnuncio = ocultarAnuncio;

export function mostrarAnuncio() {
    const anuncioVisible = document.querySelector('.anuncio');
    const container = document.querySelector('.container');

    if (anuncioVisible) {
        anuncioVisible.classList.add('slide-in'); // Add class for entrance animation
        anuncioVisible.style.display = 'flex'; // Show the announcement

        // Check screen width and apply margin if greater than or equal to 768px
        if (window.innerWidth >= 768) {
            container.style.transition = 'margin-right 0.3s ease-out'; // Add transition
            container.style.marginRight = '400px'; // Adjust margin-right for entrance
        } else {
            container.style.marginRight = '0'; // No margin adjustment for smaller screens
        }

        setTimeout(() => {
            anuncioVisible.classList.remove('slide-in'); // Remove class after animation
        }, 300); // Duration of the animation
    }
}
window.mostrarAnuncio = mostrarAnuncio;