export function inicializarAlmacenPrima() {
    const container = document.querySelector('.almAcopio-view');
    // Asegurarnos que el contenedor esté visible
    container.style.display = 'flex';

    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-warehouse"></i>  Gestión de Almacén Prima</h3>
        </div>
        <div class="almacen-container">
            <div class="almacen-header">
                <div class="search-bar">
                    <input type="text" id="searchProduct" placeholder="Buscar producto...">
                    <i class="fas fa-search"></i>
                </div>
                <div class="filter-options">
                    <button class="filter-btn active" data-filter="all">
                        Todos
                    </button>
                    <button class="filter-btn" data-filter="low">
                        Bajo
                    </button>
                </div>
            </div>
            <div class="products-grid" id="productsContainer">
                <!-- Los productos se cargarán aquí dinámicamente -->
            </div>
        </div>
    `;

    cargarProductosAlmacen();
    initializeEventListeners();
}
// ... código existente ...

async function cargarProductosAlmacen() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-productos-almacen-prima');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al cargar productos');
        }

        // Agrupar productos por nombre
        const productosAgrupados = data.productos.reduce((acc, producto) => {
            if (!acc[producto.nombre]) {
                acc[producto.nombre] = {
                    nombre: producto.nombre,
                    cantidad: 0,
                    lotes: []
                };
            }
            acc[producto.nombre].cantidad += producto.cantidad;
            acc[producto.nombre].lotes.push({
                lote: producto.lote,
                cantidad: producto.cantidad,
                ultimaActualizacion: producto.ultimaActualizacion
            });
            return acc;
        }, {});

        const container = document.getElementById('productsContainer');
        container.innerHTML = Object.values(productosAgrupados).map(producto => `
            <div class="product-card" onclick="mostrarDetalleProducto('${producto.nombre}')">
                <div class="product-info">
                    <div class="product-name">
                        <i class="fas fa-box"></i>
                        <span>${producto.nombre}</span>
                    </div>
                    <div class="product-quantity">
                        ${producto.cantidad} kg
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}

window.mostrarDetalleProducto = async function (nombreProducto) {
    try {
        mostrarCarga();
        const response = await fetch(`/obtener-detalle-producto-prima/${encodeURIComponent(nombreProducto)}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        window.currentProductData = data;

        if (!data.success) {
            throw new Error(data.error || 'Error al cargar detalles del producto');
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
            <i class="fas fa-box-open"></i>
            <h2>${nombreProducto}</h2>
            <div class="producto-detalles">
                <div class="detalle-seccion">
                    <h3>Información General</h3>
                    <p>Stock Total: ${data.producto.cantidad} kg</p>
                    <div class="lote-selector">
                        <label for="selectLote">Seleccionar Lote:</label>
                        <select id="selectLote" onchange="actualizarDetallesLote(this.value)">
                            ${data.producto.lotes.map(lote => `
                                <option value="${lote.lote}">
                                    Lote: ${lote.lote} - ${lote.cantidad} kg
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div id="detallesLote">
                        <!-- Los detalles del lote se actualizarán dinámicamente -->
                    </div>
                </div>
                <div class="detalle-seccion">
                    <h3>Movimientos Recientes</h3>
                    ${data.movimientos.length > 0 ?
                    '<canvas id="graficoMovimientos"></canvas>' :
                    '<p class="no-data">No hay movimientos registrados</p>'}
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar">Cerrar</button>
            </div>
        `;

        if (data.movimientos.length > 0) {
            const ctx = document.getElementById('graficoMovimientos')?.getContext('2d');
            if (ctx) {
                const ultimosMovimientos = [...data.movimientos].reverse();
                
                let stockAcumulado = 0;
                const valoresAcumulados = ultimosMovimientos.map(m => {
                    const cantidad = parseFloat(m.cantidad) || 0;
                    if (m.tipo.toLowerCase() === 'ingreso') {
                        stockAcumulado += cantidad;
                    } else {
                        stockAcumulado -= cantidad;
                    }
                    return stockAcumulado;
                });

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ultimosMovimientos.map(m => {
                            const [day, month] = m.fecha.split('/');
                            return `${day}/${month}`; // Solo día y mes
                        }),
                        datasets: [{
                            label: 'Stock Acumulado',
                            data: valoresAcumulados,
                            borderColor: '#2196F3',
                            tension: 0.4,
                            fill: true,
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            stepped: false,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointBackgroundColor: '#2196F3'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        aspectRatio: 2,
                        scales: {
                            y: {
                                grid: { color: '#2c2c2c' },
                                ticks: {
                                    color: '#fff',
                                    callback: function (value) {
                                        return value + ' kg';
                                    }
                                }
                            },
                            x: {
                                grid: { color: '#2c2c2c' },
                                ticks: { 
                                    color: '#fff',
                                    maxRotation: 45,  // Rotación diagonal
                                    minRotation: 45   // Mantener ángulo consistente
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                labels: { color: '#fff' }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const mov = ultimosMovimientos[context.dataIndex];
                                        const cantidad = parseFloat(mov.cantidad);
                                        return `${mov.tipo}: ${cantidad} kg (Total: ${context.raw} kg)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        anuncio.style.display = 'flex';
        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
        };
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
};

// Add this function to handle lot selection
window.actualizarDetallesLote = function (loteSeleccionado) {
    const detallesLote = document.getElementById('detallesLote');
    const data = window.currentProductData;
    const lote = data.producto.lotes.find(l => l.lote === loteSeleccionado);

    if (lote) {
        detallesLote.innerHTML = `
            <p>Cantidad en Lote: ${lote.cantidad} kg</p>
            <p>Última Actualización: ${new Date(lote.ultimaActualizacion).toLocaleDateString()}</p>
        `;

        // Show movements for this specific lot if they exist
        if (data.movimientosPorLote[loteSeleccionado]?.length > 0) {
            detallesLote.innerHTML += `
                <h4>Movimientos del Lote</h4>
                <ul class="movimientos-lote">
                    ${data.movimientosPorLote[loteSeleccionado].map(mov => `
                        <li>${new Date(mov.fecha).toLocaleDateString()} - ${mov.tipo}: ${mov.cantidad} kg</li>
                    `).join('')}
                </ul>
            `;
        }
    }
};
function filterProducts(searchTerm = '') {
    const products = document.querySelectorAll('.product-card');
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

    // Función para normalizar texto (eliminar acentos)
    const normalizeText = (text) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const normalizedSearchTerm = normalizeText(searchTerm);

    products.forEach(product => {
        const name = product.querySelector('.product-name span').textContent;
        const normalizedName = normalizeText(name);
        const quantity = parseFloat(product.querySelector('.product-quantity').textContent);
        const isLowStock = quantity < 100;

        const matchesSearch = normalizedName.includes(normalizedSearchTerm);
        const matchesFilter = activeFilter === 'all' || (activeFilter === 'low' && isLowStock);

        product.style.display = (matchesSearch && matchesFilter) ? 'flex' : 'none';
    });
}

function initializeEventListeners() {
    const searchInput = document.getElementById('searchProduct');
    const filterButtons = document.querySelectorAll('.filter-btn');

    searchInput.addEventListener('keyup', (e) => {
        e.preventDefault();
        filterProducts(e.target.value);
    });

    searchInput.addEventListener('input', (e) => {
        e.preventDefault();
        filterProducts(e.target.value);
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Si el botón es "Todos", limpiar el campo de búsqueda
            if (btn.dataset.filter === 'all') {
                searchInput.value = '';
            }
            
            filterProducts(searchInput.value);
        });
    });
}