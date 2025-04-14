export async function inicializarGestionPro() {
    try {
        mostrarCarga();
        const container = document.querySelector('.gestionPro-view');
        
        // Obtener nombre del usuario
        const nombreResponse = await fetch('/obtener-nombre');
        const nombreData = await nombreResponse.json();
        const nombreUsuario = nombreData.nombre;

        // Obtener registros
        const response = await fetch('/obtener-registros');
        const data = await response.json();

        // Filtrar registros del usuario
        const registrosUsuario = data.registros.filter(registro => registro[8] === nombreUsuario);
        const registrosVerificados = registrosUsuario.filter(registro => registro[10]);
        const registrosNoVerificados = registrosUsuario.filter(registro => !registro[10]);

        // Preparar datos para el gráfico
        const datosGrafico = prepararDatosGrafico(registrosUsuario);

        container.innerHTML = `
            <div class="title">
                <h3><i class="fas fa-chart-line"></i> Mis Estadisticas</h3>
            </div>
            <div class="stats-container">
                <div class="stat-card total">
                    
                    <div class="stat-info">
                        <p><i class="fas fa-clipboard-list"></i> Total registros</p>
                        
                    </div>
                    <span class="stat-number">${registrosUsuario.length}</span>
                </div>
                <div class="stat-card verified">
                    
                    <div class="stat-info">
                        <p><i class="fas fa-check-circle"></i> Verificados</p>
                        
                    </div>
                    <span class="stat-number">${registrosVerificados.length}</span>
                </div>
                <div class="stat-card unverified" id="btnNoVerificados">
                   
                    <div class="stat-info">
                        <p> <i class="fas fa-clock"></i> No verifiacdos </p>
                        
                    </div>
                    <span class="stat-number">${registrosNoVerificados.length}</span>
                </div>
            </div>
            <div class="chart-container">
                <p class="titulo-grafico"><i class="fas fa-info-circle"></i> Este grafico muestra el flujo de los ultimos 15 registros</p>
                <canvas id="productionChart"></canvas>
            </div>
        `;
        const btnNoVerificados = document.getElementById('btnNoVerificados');
        btnNoVerificados.addEventListener('click', () => {
            mostrarDetallesNoVerificados(registrosNoVerificados);
        });

        // Inicializar el gráfico
        const ctx = document.getElementById('productionChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: datosGrafico.labels,
                datasets: [{
                    label: 'Registros',
                    data: datosGrafico.datos,
                    borderColor: '#4CAF50',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar el dashboard', 'error');
    } finally {
        ocultarCarga();
    }
}

function prepararDatosGrafico(registros) {
    const ultimos30Dias = {};
    const hoy = new Date();
    
    // Inicializar los últimos 30 días con 0
    for (let i = 14; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - i);
        const fechaStr = fecha.toLocaleDateString();
        ultimos30Dias[fechaStr] = 0;
    }

    // Contar registros por día
    registros.forEach(registro => {
        const fecha = parsearFecha(registro[0]);
        const fechaStr = fecha.toLocaleDateString();
        if (ultimos30Dias.hasOwnProperty(fechaStr)) {
            ultimos30Dias[fechaStr]++;
        }
    });

    return {
        labels: Object.keys(ultimos30Dias),
        datos: Object.values(ultimos30Dias)
    };
}

function parsearFecha(fechaStr) {
    const [dia, mes, año] = fechaStr.split('/');
    const añoNum = parseInt(año);
    const añoFinal = añoNum >= 2000 ? añoNum : 2000 + añoNum;
    return new Date(añoFinal, parseInt(mes) - 1, parseInt(dia));
}

function mostrarDetallesNoVerificados(registros) {
    const anuncio = document.querySelector('.anuncio');
    const container = document.querySelector('.anuncio-contenido');
    
    container.innerHTML = `
        <div class="relleno">
            <h3><i class="fas fa-clock"></i> Registros Pendientes de Verificación</h3>
                ${registros.map(registro => `
                <div class="detalles-grup">
                    <div class="detalle-item">
                            <p>Fecha: </p>
                            <span> ${registro[0]}</span>
                    </div>
                    <div class="detalle-item">
                            <p>Producto: </p>
                            <span> ${registro[1]}</span>
                    </div>
                    <div class="detalle-item">
                            <p> Lote: </p>
                            <span> ${registro[2]}</span>
                    </div>
                    <div class="detalle-item">
                            <p>Cantidad</p>
                            <span> ${registro[6]}</span>
                    </div>
                </div>
                `).join('')}
        </div>
        <div class="anuncio-botones">
            <button class="cerrar-modal anuncio-btn close"><i class="fas fa-times"></i></button>
        </div>
    `;

    // Mostrar el modal
    anuncio.style.display = 'flex';
    container.classList.add('no-touch');

    // Evento para cerrar el modal
    const cerrarModal = anuncio.querySelector('.cerrar-modal');
    cerrarModal.addEventListener('click', () => {
        anuncio.style.display = 'none';
        container.classList.remove('no-touch');
    });

    // Cerrar al hacer clic fuera del modal
    anuncio.addEventListener('click', (e) => {
        if (e.target === anuncio) {
            anuncio.style.display = 'none';
            container.classList.remove('no-touch');
        }
    });
}