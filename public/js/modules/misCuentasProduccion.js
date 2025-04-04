// Variables globales para mantener el estado
let registrosFiltrados = [];
let registrosOriginales = [];
let registrosMostrados = 0;
const registrosPorPagina = 10;
let filtroActual = {
    periodo: '365',
    verificacion: 'all'
};
export async function cargarRegistrosCuentas() {
    try {
        mostrarCarga();
        
        const nombreResponse = await fetch('/obtener-nombre');
        const nombreData = await nombreResponse.json();
        const nombreUsuario = nombreData.nombre;

        const response = await fetch('/obtener-registros');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.cuentasProduccion-view');
            
            container.innerHTML = `
                <div class="filtros-header">
                    <h2 class="section-title"><i class="fas fa-clipboard-list"></i> Mis Registros</h2>
                    <button class="btn-filtro">
                        <i class="fas fa-filter"></i> Filtros
                    </button>
                </div>
                <p class="subtitulo">Últimos 10 registros (12 meses)</p>
                <div class="registros-container"></div>
                <button class="load-more" style="display: none;">Cargar más</button>
            `;

            // Add event listener for load more button
            const loadMoreBtn = container.querySelector('.load-more');
            loadMoreBtn.addEventListener('click', () => mostrarRegistros(false));

            if (data.registros && data.registros.length > 0) {
                registrosOriginales = data.registros
                    .filter(registro => registro[8] === nombreUsuario)
                    .sort((a, b) => {
                        const fechaA = parsearFecha(a[0]);
                        const fechaB = parsearFecha(b[0]);
                        return fechaB - fechaA;
                    });

                registrosFiltrados = [...registrosOriginales];
                setupFilters();
                
                // Aplicar filtros iniciales
                aplicarFiltros();
            } else {
                document.querySelector('.registros-container').innerHTML = 
                    '<p class="no-registros">No hay registros disponibles</p>';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los registros', 'error');
    } finally {
        ocultarCarga();
    }
}
function setupFilters() {
    const container = document.querySelector('.cuentasProduccion-view');
    const btnFiltro = container.querySelector('.btn-filtro');

    btnFiltro.addEventListener('click', () => {
        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
        
        anuncioContenido.innerHTML = `
            <h2><i class="fas fa-filter"></i> Filtros</h2>
            <div class="filtros-contenido">
                <div class="campo-form">
                    <p>Tiempo: </p>
                    <select class="filter-select" id="periodoSelect">
                        <option value="7" ${filtroActual.periodo === '7' ? 'selected' : ''}>7 días</option>
                        <option value="15" ${filtroActual.periodo === '15' ? 'selected' : ''}>15 días</option>
                        <option value="30" ${filtroActual.periodo === '30' ? 'selected' : ''}>1 mes</option>
                        <option value="90" ${filtroActual.periodo === '90' ? 'selected' : ''}>3 meses</option>
                        <option value="210" ${filtroActual.periodo === '210' ? 'selected' : ''}>7 meses</option>
                        <option value="365" ${filtroActual.periodo === '365' ? 'selected' : ''}>12 meses</option>
                    </select>
                </div>
                <div class="campo-form">
                    <p>Estado:</p>
                    <select class="filter-select" id="verificacionSelect">
                        <option value="all" ${filtroActual.verificacion === 'all' ? 'selected' : ''}>Todos</option>
                        <option value="verified" ${filtroActual.verificacion === 'verified' ? 'selected' : ''}>Verificados</option>
                        <option value="unverified" ${filtroActual.verificacion === 'unverified' ? 'selected' : ''}>No Verificados</option>
                    </select>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn green aplicar"><i class="fas fa-check-circle"></i> Aplicar Filtros</button>
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
            </div>
        `;

        // Mostrar el anuncio y overlay
        anuncio.style.display = 'flex';
        document.querySelector('.container').classList.add('no-touch');

        // Configurar botones del modal
        const btnAplicar = anuncio.querySelector('.aplicar');
        const btnCancelar = anuncio.querySelector('.cancelar');

        // Manejar clic en Aplicar
        btnAplicar.addEventListener('click', () => {
            filtroActual = {
                periodo: document.querySelector('#periodoSelect').value,
                verificacion: document.querySelector('#verificacionSelect').value
            };
            aplicarFiltros();
            cerrarModal();
        });

        // Manejar clic en Cancelar
        btnCancelar.addEventListener('click', cerrarModal);
    });
}
function parsearFecha(fechaStr) {
    try {
        const [dia, mes, año] = fechaStr.split('/');
        if (!dia || !mes || !año) {
            return new Date(0);
        }
        // Corregir el año: si es 2025, no sumar 2000
        const añoNum = parseInt(año);
        const añoFinal = añoNum >= 2000 ? añoNum : 2000 + añoNum;
        const fecha = new Date(añoFinal, parseInt(mes) - 1, parseInt(dia));
        return fecha;
    } catch (error) {
        console.error('Error al parsear fecha:', fechaStr, error);
        return new Date(0);
    }
}
function cerrarModal() {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
    document.querySelector('.container').classList.remove('no-touch');
}
function mostrarRegistros(reset = false) {
    if (reset) {
        registrosMostrados = 0;
        document.querySelector('.registros-container').innerHTML = '';
    }
    
    const container = document.querySelector('.registros-container');
    const loadMoreBtn = document.querySelector('.load-more');
    
    if (registrosFiltrados.length === 0) {
        container.innerHTML = '<p class="no-registros">No hay registros para mostrar</p>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    const registrosAMostrar = registrosFiltrados.slice(
        registrosMostrados,
        registrosMostrados + registrosPorPagina
    );

    registrosAMostrar.forEach(registro => {
        const card = crearTarjetaRegistro(registro);
        container.appendChild(card);
    });

    registrosMostrados += registrosAMostrar.length;
    
    // Actualizar visibilidad del botón
    loadMoreBtn.style.display = 
        registrosMostrados < registrosFiltrados.length ? 'block' : 'none';
}
export function mostrarDetalles(card) {
    // Cerrar otros registros abiertos primero
    document.querySelectorAll('.registro-detalles').forEach(detalles => {
        if (detalles !== card.querySelector('.registro-detalles') && detalles.classList.contains('active')) {
            detalles.classList.remove('active');
        }
    });

    const detalles = card.querySelector('.registro-detalles');
    detalles.classList.toggle('active');

    // Si el registro está abierto, desplazar la pantalla para mostrarlo completo
    if (detalles.classList.contains('active')) {
        setTimeout(() => {
            card.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
            });
        }, 100);
    }
}
export function crearTarjetaRegistro(registro) {
    const div = document.createElement('div');
    div.className = 'registro-card';

    if (!Array.isArray(registro)) {
        console.error('Registro inválido:', registro);
        return div;
    }

    const [dia, mes] = registro[0].split('/');
    const fechaFormateada = `${dia}/${mes}`;

    div.innerHTML = `
        <div class="registro-header">
                ${registro[10] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
                <div class="registro-fecha">${fechaFormateada}</div>
                <div class="registro-producto">${registro[1] || 'Sin producto'}</div>
        </div>
        </div>
        <div class="registro-detalles">
            <p><span>Lote:</span> ${registro[2] || '—'}</p>
            <p><span>Gramaje:</span> ${registro[3] ? registro[3] + 'gr' : '—'}</p>
            <p><span>Selección/Cernido:</span> ${registro[4] || '—'}</p>
            <p><span>Microondas:</span> ${registro[5] ? registro[5] + 's' : '—'}</p>
            <p><span>Envases Terminados:</span> ${registro[6] || '—'}</p>
            <p><span>Fecha Vencimiento:</span> ${registro[7] || '—'}</p>
            <p><span>Cantidad verificada:</span> ${registro[9] || '—'}</p>
            <p><span>Fecha Verificación:</span> ${registro[10] || '—'}</p>
            <p><span>Observaciones:</span> ${registro[11] || '—'}</p>
        </div>
    `;

    const header = div.querySelector('.registro-header');
    header.addEventListener('click', () => mostrarDetalles(div));
    return div;

}
function actualizarSubtitulo() {
    const subtitulo = document.querySelector('.subtitulo');
    const periodoTexto = {
        '7': '7 días',
        '15': '15 días',
        '30': '1 mes',
        '90': '3 meses',
        '210': '7 meses',
        '365': '12 meses'
    }[filtroActual.periodo] || filtroActual.periodo + ' días';
    
    subtitulo.textContent = `Últimos 10 registros (${periodoTexto})`;
}
function aplicarFiltros() {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() - parseInt(filtroActual.periodo));

    registrosFiltrados = registrosOriginales.filter(registro => {
        const fechaRegistro = parsearFecha(registro[0]);
        const cumpleFecha = fechaRegistro >= fechaLimite && fechaRegistro <= hoy;

        if (filtroActual.verificacion === 'all') return cumpleFecha;
        if (filtroActual.verificacion === 'verified') return cumpleFecha && registro[10];
        if (filtroActual.verificacion === 'unverified') return cumpleFecha && !registro[10];
        return false;
    });
    
    actualizarSubtitulo(); // Actualizar el subtítulo al aplicar filtros
    mostrarRegistros(true);
}
