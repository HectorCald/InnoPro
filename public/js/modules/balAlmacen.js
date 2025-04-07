
export function inicializarBalanceAlmacen() {
    const container = document.querySelector('.balAlmacen-view');
    container.innerHTML = `
            <div class="filtros-header">
                    <h2 class="section-title">
                        <i class="fas fa-chart-line"></i> Balance de Almacén
                    </h2>
                    <button class="btn-filtro-acopio">
                        <i class="fas fa-filter"></i> Filtros
                    </button>
            </div>
            <div class="graficos-grid">
                <div class="grafico-card">
                    <h3 class="grafico-titulo">
                        <i class="fas fa-chart-pie"></i>
                        Distribución de Movimientos
                    </h3>
                    <div class="grafico-contenedor">
                        <canvas id="graficoPastel"></canvas>
                    </div>
                </div>
                <div class="grafico-card">
                    <h3 class="grafico-titulo">
                        <i class="fas fa-chart-line"></i>
                        Tendencia de Movimientos
                    </h3>
                    <div class="grafico-contenedor">
                        <canvas id="graficoLineas"></canvas>
                    </div>
                </div>
            </div>
            <div class="estadisticas-grid">
                <div class="estadistica-card">
                    <i class="fas fa-box"></i>
                    <div class="estadistica-valor" id="totalMovimientos">0</div>
                    <div class="estadistica-label">Total Movimientos</div>
                </div>
                <div class="estadistica-card">
                    <i class="fas fa-arrow-circle-up"></i>
                    <div class="estadistica-valor" id="totalIngresos">0</div>
                    <div class="estadistica-label">Ingresos</div>
                </div>
                <div class="estadistica-card">
                    <i class="fas fa-arrow-circle-down"></i>
                    <div class="estadistica-valor" id="totalSalidas">0</div>
                    <div class="estadistica-label">Salidas</div>
                </div>
            </div>
    `;

    // Cargar datos iniciales
    cargarDatosBalance();
}

async function cargarDatosBalance() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-balance-almacen');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al obtener datos');
        }

        const movimientos = data.movimientos;
        
        // Preparar y mostrar datos
        const datosTipo = prepararDatosTipo(movimientos);
        const datosMovimientos = prepararDatosMovimientos(movimientos);
        
        renderizarGraficoPastel(datosTipo);
        renderizarGraficoLineas(datosMovimientos);
        mostrarEstadisticas(movimientos);
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar el balance', 'error');
    }finally{
        ocultarCarga();
        scrollToTop('.balAlmacen-view');
    }
}

function prepararDatosTipo(movimientos) {
    const tipos = {};
    movimientos.forEach(mov => {
        tipos[mov.tipo] = (tipos[mov.tipo] || 0) + 1;
    });
    return tipos;
}

function prepararDatosMovimientos(movimientos) {
    const datos = {};
    movimientos.forEach(mov => {
        const fecha = mov.fecha.split(' ')[0];
        if (!datos[fecha]) {
            datos[fecha] = { ingresos: 0, salidas: 0 };
        }
        if (mov.tipo === 'Ingreso') {
            datos[fecha].ingresos += mov.cantidad;
        } else if (mov.tipo === 'Salida') {
            datos[fecha].salidas += mov.cantidad;
        }
    });
    return datos;
}

function renderizarGraficoPastel(datos) {
    const ctx = document.getElementById('graficoPastel').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(datos),
            datasets: [{
                data: Object.values(datos),
                backgroundColor: [
                    '#4CAF50',
                    '#F44336',
                    '#2196F3',
                    '#FF9800'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function renderizarGraficoLineas(datos) {
    const ctx = document.getElementById('graficoLineas').getContext('2d');
    const fechas = Object.keys(datos);
    const ingresos = fechas.map(f => datos[f].ingresos);
    const salidas = fechas.map(f => datos[f].salidas);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresos,
                    borderColor: '#4CAF50',
                    fill: false
                },
                {
                    label: 'Salidas',
                    data: salidas,
                    borderColor: '#F44336',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function mostrarEstadisticas(movimientos) {
    const totalMovimientos = movimientos.length;
    const ingresos = movimientos.filter(m => m.tipo === 'Ingreso').length;
    const salidas = movimientos.filter(m => m.tipo === 'Salida').length;

    document.getElementById('totalMovimientos').textContent = totalMovimientos;
    document.getElementById('totalIngresos').textContent = ingresos;
    document.getElementById('totalSalidas').textContent = salidas;
}
