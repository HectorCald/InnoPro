const WORK_COORDINATES = {
    latitude: -19.0289818,    // Coordenada corregida para Santa Cruz
    longitude: -65.2501004,  // Coordenada real de Santa Cruz de la Sierra
    radius: 20              // Radio ampliado a 500 metros

     
};
export function inicializarBiometrico() {
    const container = document.querySelector('.biometrico-view');
    container.style.display = 'flex';
    
    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-fingerprint"></i> Registro Biométrico</h3>
        </div>
        <div class="biometrico-container">
            <div class="biometrico-botones">
                <button class="btn-registrar-ingreso">
                    <i class="fas fa-sign-in-alt"></i> Registrar Ingreso
                </button>
                <button class="btn-registrar-salida">
                    <i class="fas fa-sign-out-alt"></i> Registrar Salida
                </button>
            </div>
            <div class="registros-biometricos">
                <div class="search-bar">
                    <input type="text" id="searchBiometrico" placeholder="Buscar registros...">
                    <i class="fas fa-search search-icon"></i>
                </div>
                <div class="registros-grid" id="registrosBiometrico"></div>
            </div>
        </div>
    `;

    // Event Listeners
    container.querySelector('.btn-registrar-ingreso').addEventListener('click', () => registrarBiometrico('INGRESO'));
    container.querySelector('.btn-registrar-salida').addEventListener('click', () => registrarBiometrico('SALIDA'));
    
    cargarRegistrosBiometricos();
    configurarBusquedaBiometrico();
}

async function registrarBiometrico(tipo) {
    try {
        mostrarCarga();
        const position = await obtenerUbicacion();
        console.log('Tu ubicación actual:', position.coords.latitude, position.coords.longitude);
        
        
        if (!estaEnAreaLaboral(position)) {
            mostrarNotificacion('Registro fuera del área laboral', 'error');
            return;
        }

        const respuesta = await fetch('/registrar-biometrico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                coordenadas: position.coords
            })
        });

        const data = await respuesta.json();
        
        if (respuesta.ok) {
            mostrarNotificacion(`Registro ${data.registro.id} guardado`, 'success');
            cargarRegistrosBiometricos();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error en el registro', 'error');
    }finally{
        ocultarCarga();
    }
}

async function cargarRegistrosBiometricos() {
    try {
        const respuesta = await fetch('/obtener-biometrico');
        const registros = await respuesta.json();
        const container = document.getElementById('registrosBiometrico');
        
        container.innerHTML = registros.map(reg => `
            <div class="registro-card">
                <div class="registro-header">
                    <span class="registro-id">${reg.id}</span>
                    <span class="registro-fecha">${reg.fecha || ''}</span>
                </div>
                <div class="registro-info">
                    <div class="registro-hora">
                        ${reg.hora || ''}
                    </div>
                    <div class="registro-nombre">
                        <i class="fas fa-user"></i> 
                        ${reg.nombre || 'Sin nombre'}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando registros:', error);
    }
}

function obtenerUbicacion() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
}
function estaEnAreaLaboral(pos) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = WORK_COORDINATES.latitude * Math.PI/180;
    const φ2 = pos.coords.latitude * Math.PI/180;
    const Δφ = (pos.coords.latitude - WORK_COORDINATES.latitude) * Math.PI/180;
    const Δλ = (pos.coords.longitude - WORK_COORDINATES.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distancia = R * c;
    return distancia <= WORK_COORDINATES.radius;
}