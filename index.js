/* ==================== IMPORTACIONES==================== */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';


/* ==================== CONFIGURACIÓN INICIAL ==================== */
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = 'una_clave_secreta_muy_larga_y_segura_2024';

/* ==================== CONFIGURACIÓN DE GOOGLE SHEETS ==================== */
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'damabrava@producciondb.iam.gserviceaccount.com',
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/spreadsheets"
    ]
});

/* ==================== MIDDLEWARES Y CONFIGURACIÓN DE APP ==================== */
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        // Cabecera para evitar caché
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.json')) {
            if (path.includes('assetlinks.json')) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
            } else {
                res.setHeader('Content-Type', 'application/manifest+json');
            }
        }
    }
}));
app.use('/.well-known', express.static(join(__dirname, 'public/.well-known')));

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

/* ==================== FUNCIONES DE UTILIDAD ==================== */
function requireAuth(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}
async function verificarPin(pin) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:E'  // Cambiado para incluir columna E
        });
        const rows = response.data.values || [];
        const usuario = rows.find(row => row[0] === pin);
        
        if (usuario) {
            const nombre = usuario[1];
            const estado = usuario[3];
            const funcionesExtra = usuario[4] ? usuario[4].split(',').map(f => f.trim()) : []; // Obtener funciones extras

            if (estado !== 'Activo') {
                return { 
                    valido: false,
                    mensaje: 'Usuario inactivo'
                };
            }

            const rol = (nombre === 'Almacen_adm' || nombre === 'Administrador') ? 'admin' : 
                       nombre === 'Almacen' ? 'almacen' : 'user';
            
            return { 
                valido: true, 
                nombre: nombre,
                rol: rol,
                funcionesExtra: funcionesExtra // Agregar funciones extras al resultado
            };
        }
        return { valido: false };
    } catch (error) {
        console.error('Error accessing spreadsheet:', error);
        throw error;
    }
}
const APP_CONFIG = {
    UPDATE_KEY: 'innopro_update_status',
    CURRENT_VERSION: '2.0.6',
    MIN_VERSION: '2.0.4'
};

/* ==================== RUTAS DE VISTAS ==================== */
app.get('/', (req, res) => {
    res.render('login');
});
app.get('/dashboard', requireAuth, (req, res) => {
    res.redirect('/dashboard_db')
});
app.get('/dashboard_alm', requireAuth, (req, res) => {
    res.redirect('/dashboard_db')   
});
app.get('/dashboard_db', requireAuth, (req, res) => {
    const userVersion = req.cookies[APP_CONFIG.UPDATE_KEY];

    if (!userVersion) {
        res.render('Actualizacion', { 
            updateKey: APP_CONFIG.UPDATE_KEY,
            currentVersion: APP_CONFIG.CURRENT_VERSION,
            minVersion: APP_CONFIG.MIN_VERSION
        });
    } else if (userVersion === APP_CONFIG.MIN_VERSION) {
        res.render('Actualizacion', { 
            oldVersion: true,
            updateKey: APP_CONFIG.UPDATE_KEY,
            currentVersion: APP_CONFIG.CURRENT_VERSION,
            minVersion: APP_CONFIG.MIN_VERSION
        });
    } else if (userVersion === APP_CONFIG.CURRENT_VERSION) {
        res.render('dashboard_db');
    } else {
        res.render('Actualizacion', {
            updateKey: APP_CONFIG.UPDATE_KEY,
            currentVersion: APP_CONFIG.CURRENT_VERSION,
            minVersion: APP_CONFIG.MIN_VERSION
        });
    }
});
app.get('/mantenimiento', requireAuth, (req, res) => {
    res.render('mantenimiento');
});
app.post('/confirmar-actualizacion', requireAuth, (req, res) => {
    const { version } = req.body;
    res.cookie('innopro_update_status', version, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false
    });
    
    res.json({ 
        success: true,
        version: version
    });
});
app.get('/desinstalar', (req, res) => {
    res.render('desinstalar');
});

/* ==================== RUTAS PARA IMÁGENES ==================== */
app.post('/subir-imagen', requireAuth, async (req, res) => {
    try {
        const { nombre, imagen } = req.body; // imagen debe ser una cadena base64
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener el último ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Imagenes!A:C'
        });

        const rows = response.data.values || [];
        const nextId = rows.length > 1 ? parseInt(rows[rows.length - 1][0]) + 1 : 1;

        // Guardar la imagen
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Imagenes!A:C',
            valueInputOption: 'RAW',
            resource: {
                values: [[nextId, nombre, imagen]]
            }
        });

        res.json({
            success: true,
            mensaje: 'Imagen guardada correctamente',
            id: nextId
        });
    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar la imagen'
        });
    }
});
app.get('/obtener-imagen/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Imagenes!A:C'
        });

        const rows = response.data.values || [];
        const imagen = rows.find(row => row[0] === id);

        if (!imagen) {
            return res.status(404).json({
                success: false,
                error: 'Imagen no encontrada'
            });
        }

        res.json({
            success: true,
            imagen: {
                id: imagen[0],
                nombre: imagen[1],
                data: imagen[2]
            }
        });
    } catch (error) {
        console.error('Error al obtener imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la imagen'
        });
    }
});

/* ==================== RUTAS DE API - AUTENTICACIÓN ==================== */
app.post('/verificar-pin', async (req, res) => {
    try {
        const { pin } = req.body;
        const resultado = await verificarPin(pin);
        if (resultado.valido) {
            const token = jwt.sign(
                { 
                    nombre: resultado.nombre,
                    rol: resultado.rol
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            });
            res.json({ 
                ...resultado, 
                token,
                redirect: '/dashboard_db'
            });
        } else {
            res.json(resultado);
        }
    } catch (error) {
        console.error('Error al verificar PIN:', error);
        res.status(500).json({ error: 'Error al verificar el PIN' });
    }
});
app.post('/cerrar-sesion', (req, res) => {
    res.clearCookie('token');
    res.json({ mensaje: 'Sesión cerrada correctamente' });
});

/* ==================== RUTAS DE API - DATOS DE USUARIO ==================== */
app.get('/obtener-nombre', requireAuth, (req, res) => {
    res.json({ nombre: req.user.nombre });
});
app.get('/obtener-mi-rol', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A:E'
        });

        const rows = response.data.values || [];
        const usuario = rows.find(row => row[1] === req.user.nombre);

        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado en la hoja de cálculo' 
            });
        }

        res.json({ 
            nombre: usuario[1],
            rol: usuario[2],
            Estado: usuario[3],
            Extras: usuario[4]
        });
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ 
            error: 'Error al obtener información del usuario' 
        });
    }
});

/* ==================== API DE INICIO ==================== */
app.get('/obtener-estadisticas-usuario', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A2:L'
        });

        const rows = response.data.values || [];
        const registrosUsuario = rows.filter(row => row[8] === req.user.nombre);
        
        // Calcular estadísticas básicas
        const produccionesTotal = registrosUsuario.length;
        const produccionesVerificadas = registrosUsuario.filter(row => 
            row[9] && row[9].toString().trim() !== ''
        ).length;

        // Calcular el total en Bs
        let totalBs = 0;
        registrosUsuario.forEach(registro => {
            const cantidad = registro[9] ? parseFloat(registro[9]) : parseFloat(registro[6]) || 0;
            const gramaje = parseFloat(registro[3]) || 0;
            const seleccion = registro[4] || '';
            const nombre = registro[1] || '';
            
            // Calcular total usando la misma lógica de calcularTotal
            const resultados = calcularTotal(nombre, cantidad, gramaje, seleccion);
            totalBs += resultados.total;
        });

        // Calcular eficiencia
        const eficiencia = produccionesTotal > 0 
            ? Math.round((produccionesVerificadas / produccionesTotal) * 100) 
            : 0;

        res.json({
            success: true,
            estadisticas: {
                produccionesTotal,
                produccionesVerificadas,
                totalBs,
                eficiencia
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});
app.get('/obtener-notificaciones-usuario', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A2:C'  // A:Fecha, B:Usuario, C:Notificación
        });

        const rows = response.data.values || [];
        const notificacionesUsuario = rows
            .filter(row => row[1] === req.user.nombre)  // Filter by current user
            .map(row => ({
                fecha: row[0],
                mensaje: row[2]
            }))
            .sort((a, b) => {  // Sort by date, most recent first
                const [diaA, mesA, anioA] = a.fecha.split('/');
                const [diaB, mesB, anioB] = b.fecha.split('/');
                const fechaA = new Date(20 + anioA, mesA - 1, diaA);
                const fechaB = new Date(20 + anioB, mesB - 1, diaB);
                return fechaB - fechaA;
            })
            .slice(0, 5);  // Get only the 5 most recent notifications

        res.json({ success: true, notificaciones: notificacionesUsuario });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener notificaciones' 
        });
    }
});
app.delete('/eliminar-notificacion', requireAuth, async (req, res) => {
    try {
        const { fecha, mensaje } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all notifications
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A2:C'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === req.user.nombre && 
            row[2] === mensaje
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Notificación no encontrada' 
            });
        }

        // Get the sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const notificacionesSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Notificaciones'
        );

        if (!notificacionesSheet) {
            throw new Error('Hoja de Notificaciones no encontrada');
        }

        // Delete the row (add 2 to account for header row and 0-based index)
        await sheets.spreadsheets.values.clear({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Notificaciones!A${rowIndex + 2}:C${rowIndex + 2}`
        });

        res.json({ success: true, message: 'Notificación eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la notificación: ' + error.message
        });
    }
});

/* ==================== API DE REGISTRO ==================== */
app.get('/obtener-productos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:E'
        });

        const productos = response.data.values.map(row => ({
            id: row[0] || '',
            nombre: row[1] || '',
            gramaje: row[2] || '',
            cantidadPorTira: row[4] || '' 
        }));

        res.json({ success: true, productos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener productos' });
    }
});
app.delete('/eliminar-registro', requireAuth, async (req, res) => {
    try {
        const { id, razon } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all records from Produccion sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:M'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado' 
            });
        }

        const registro = rows[rowIndex];
        const operario = registro[9]; // Índice del operario
        const producto = registro[2]; // Índice del producto
        const lote = registro[3];     // Índice del lote

        // Get the sheet ID for Produccion sheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const produccionSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Produccion'
        );

        if (!produccionSheet) {
            throw new Error('Hoja de Producción no encontrada');
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: produccionSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error('Error detallado al eliminar registro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el registro: ' + (error.message || 'Error desconocido')
        });
    }
});
app.get('/obtener-todos-registros', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:N'  // Get all columns including ID
        });

        const rows = response.data.values || [];
        // Return all rows including headers
        res.json({ success: true, registros: rows });
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ success: false, error: 'Error al obtener registros' });
    }
});
app.get('/obtener-registros', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!B:L'
        });
        const rows = response.data.values || [];
        const registrosUsuario = rows.filter(row => row[8] === req.user.nombre);
        res.json({ success: true, registros: registrosUsuario });
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ success: false, error: 'Error al obtener registros' });
    }
});
app.post('/registrar-produccion', requireAuth, async (req, res) => {
    try {
        const {
            producto,
            lote,
            gramaje,
            seleccion,
            microondas,
            envasesTerminados,
            fechaVencimiento
        } = req.body;

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get current records to determine the next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A2:A'
        });

        const existingIds = response.data.values || [];
        let nextId = 1;

        if (existingIds.length > 0) {
            // Extract numeric values from IDs (e.g., "R-75" -> 75)
            const numericIds = existingIds
            .map(row => {
                const match = (row[0] || '').match(/RP-(\d+)/);
                return match ? parseInt(match[1]) : 0;
            })
                .filter(id => !isNaN(id));

            // Get the next ID number
            nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
        }

        // Format ID as "R-XX"
        const formattedId = `RP-${nextId}`;

        // Get current date in dd/mm/yy format
        const fecha = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });

        // Register in Production sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:M',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    formattedId,
                    fecha,
                    producto,
                    lote,
                    gramaje,
                    seleccion,
                    microondas || 'No',
                    envasesTerminados,
                    fechaVencimiento,
                    req.user.nombre,
                    '', // Verified quantity (initially empty)
                    '', // Observations (initially empty)
                    'Pendiente' // Initial status
                ]]
            }
        });

        res.json({ 
            success: true, 
            message: 'Producción registrada correctamente',
            nombreOperario: req.user.nombre,
            id: formattedId
        });
    } catch (error) {
        console.error('Error al registrar producción:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al registrar la producción: ' + error.message 
        });
    }
});
app.get('/obtener-lista-permisos', requireAuth, async (req, res) => {
    try {

        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Permisos!A2:A' // Obtener solo la primera columna, excluyendo el título
        });

        const permisos = response.data.values ? response.data.values.map(row => row[0]) : [];
        res.json({ success: true, permisos });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener lista de permisos: ' + error.message 
        });
    }
});
app.post('/registrar-pago', requireAuth, async (req, res) => {
    try {
        const { id, total } = req.body;
        if (!id || !total) {
            return res.status(400).json({ success: false, error: 'ID y total son requeridos' });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        const range = 'Produccion!A2:N';  // Changed from 'Registros' to 'Produccion' to match your sheet name
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range,
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        }

        // Actualizar el pago en la columna N (índice 13)
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Produccion!N${rowIndex + 2}`,  // Changed from 'Registros' to 'Produccion'
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[total]]
            }
        });

        res.json({ success: true, mensaje: 'Pago registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar pago:', error);
        res.status(500).json({ success: false, error: 'Error al registrar el pago' });
    }
});
app.put('/actualizar-registro', requireAuth, async (req, res) => {
    try {
        const { 
            id, fecha, producto, lote, gramaje, seleccion, 
            microondas, envases, vencimiento, razonEdicion 
        } = req.body;

        const sheets = google.sheets({ version: 'v4', auth });

        // Get all records
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:M'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado' 
            });
        }

        const registro = rows[rowIndex];
        const operarioOriginal = registro[9];

        // Update the record
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Produccion!B${rowIndex + 1}:I${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    fecha,
                    producto,
                    lote,
                    gramaje,
                    seleccion,
                    microondas || 'No',
                    envases,
                    vencimiento
                ]]
            }
        });

        res.json({ 
            success: true,
            mensaje: 'Registro actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar registro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el registro' 
        });
    }
});

/* ==================== RUTAS DE API - GESTIÓN DE USUARIOS ==================== */
app.delete('/eliminar-usuario', requireAuth, async (req, res) => {
    try {

        const { pin } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los usuarios
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Usuarios!A2:D'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === pin);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        // Get the sheet ID for Usuarios sheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw'
        });
        
        const usuariosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Usuarios'
        );

        if (!usuariosSheet) {
            throw new Error('Hoja de Usuarios no encontrada');
        }

        // Delete the user row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: usuariosSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 because we skip header
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar usuario: ' + (error.message || 'Error desconocido') 
        });
    }
});
app.get('/obtener-usuarios', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:E' // A:PIN, B:Nombre, C:Rol, D:Estado, E:funciones extras
        });

        const rows = response.data.values || [];
        const usuarios = rows.map(row => ({
            pin: row[0] || '',
            nombre: row[1] || '',
            rol: row[2] || '',
            estado: row[3] === 'Activo',
            extras: row[4] ||''
        }));
        res.json({ success: true, usuarios });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
    }
});
app.post('/obtener-usuario', requireAuth, async (req, res) => {
    try {
        const { pin } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:E'
        });

        const rows = response.data.values || [];
        const usuarioRow = rows.find(row => row[0] === pin);

        if (!usuarioRow) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        const usuario = {
            pin: usuarioRow[0],
            nombre: usuarioRow[1],
            rol: usuarioRow[2],
            estado: usuarioRow[3] === 'Activo',
            extras: usuarioRow[4],
        };

        res.json({ success: true, usuario });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener usuario' });
    }
});
app.post('/agregar-usuario', requireAuth, async (req, res) => {
    try {
        const { nombre, pin, rol } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Verificar si el PIN ya existe
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:A'
        });

        const pines = response.data.values || [];
        if (pines.flat().includes(pin)) {
            return res.status(400).json({ success: false, error: 'El PIN ya está en uso' });
        }

        // Agregar nuevo usuario
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:D',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[pin, nombre, rol, 'Activo']]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al agregar usuario' });
    }
});
app.post('/cambiar-estado-usuario', requireAuth, async (req, res) => {
    try {
        const { pin, estado } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Encontrar la fila del usuario
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:D'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === pin);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Actualizar estado
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Usuarios!D${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[estado]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al cambiar estado del usuario' });
    }
});

app.post('/actualizar-usuario', requireAuth, async (req, res) => {
    try {
        const { pinActual, nuevoPin, nuevoRol, nuevosExtras } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A:E'
        });

        const rows = response.data.values || [];
        const userIndex = rows.findIndex(row => row[0] === pinActual);

        if (userIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        // Actualizar datos
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Usuarios!A${userIndex + 1}:E${userIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    nuevoPin,
                    rows[userIndex][1], // Mantener nombre
                    nuevoRol,
                    rows[userIndex][3], // Mantener estado
                    nuevosExtras
                ]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar usuario' 
        });
    }
});

/* ==================== API DE VERIFICACION ==================== */
app.put('/actualizar-verificacion', requireAuth, async (req, res) => {
    try {
        const { 
            id, verificacion, fechaVerificacion, 
            observaciones, cantidadDeclarada 
        } = req.body;

        const sheets = google.sheets({ version: 'v4', auth });

        // Get all records
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:M'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado' 
            });
        }

        const registro = rows[rowIndex];
        const operario = registro[9];
        const producto = registro[2];
        const lote = registro[3];

        // Update verification data
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Produccion!K${rowIndex + 1}:M${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    verificacion,
                    fechaVerificacion,
                    observaciones || ''
                ]]
            }
        });

        res.json({ 
            success: true,
            mensaje: 'Verificación actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar verificación:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar la verificación' 
        });
    }
});
app.post('/registrar-desglose', async (req, res) => {
    try {
        const { registros, extras } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        const extrasPorRegistro = extras / registros.length;

        // Obtener los valores actuales de la hoja
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:Z'
        });

        const updates = [];
        for (const registro of registros) {
            const rowIndex = response.data.values.findIndex(row => row[0] === registro.id);
            if (rowIndex !== -1) {
                updates.push({
                    range: `Produccion!O${rowIndex + 1}:S${rowIndex + 1}`,
                    values: [[
                        registro.etiquetado,
                        registro.sellado,
                        registro.envasado,
                        registro.cernido,
                        extrasPorRegistro
                    ]]
                });
            }
        }

        // Aplicar todas las actualizaciones
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                valueInputOption: 'USER_ENTERED',
                data: updates
            }
        });

        res.json({ success: true, mensaje: 'Registros actualizados correctamente' });
    } catch (error) {
        console.error('Error al registrar desglose:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/obtener-extras-registros', async (req, res) => {
    try {
        const { registrosIds } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:S'
        });

        let totalExtras = 0;
        const valores = response.data.values;

        registrosIds.forEach(id => {
            const rowIndex = valores.findIndex(row => row[0] === id);
            if (rowIndex !== -1 && valores[rowIndex][18]) {
                // Convertir el valor a número y sumar con precisión
                const extraValue = parseFloat(valores[rowIndex][18].toString().replace(',', '.')) || 0;
                totalExtras = (totalExtras * 1000 + extraValue * 1000) / 1000;
            }
        });

        res.json({ success: true, totalExtras });
    } catch (error) {
        console.error('Error al obtener extras:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/* ==================== API DE OBTNER NOMBRE Y ROL ==================== */
app.get('/obtener-mi-rol', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A:C'
        });

        const rows = response.data.values || [];
        const usuario = rows.find(row => row[1] === req.user.nombre); // Buscar por nombre en columna B

        if (!usuario) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado en la hoja de cálculo' 
            });
        }

        res.json({ 
            nombre: usuario[1], // Columna B (nombre)
            rol: usuario[2]     // Columna C (rol)
        });
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ 
            error: 'Error al obtener información del usuario' 
        });
    }
});

/* ==================== API DE PEDIDOS ==================== */
app.get('/buscar-producto-pendiente/:nombre', requireAuth, async (req, res) => {
    try {
        const { nombre } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:I'
        });

        const rows = response.data.values || [];
        const productos = rows
            .slice(1)
            .filter(row => 
                row[2]?.toLowerCase() === nombre.toLowerCase() && 
                row[8] === 'Pendiente'
            )
            .map(row => ({
                id: row[0],         // Añadimos el ID
                fecha: row[1],
                nombre: row[2],
                cantidad: row[3],
                observaciones: row[4] || ''
            }));

        res.json({ 
            success: true, 
            productos 
        });
    } catch (error) {
        console.error('Error al buscar producto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al buscar producto' 
        });
    }
});
app.post('/finalizar-pedidos', requireAuth, async (req, res) => {
    try {
        const { pedidos } = req.body;
        if (!pedidos || pedidos.length === 0) {
            return res.json({ success: false, error: 'No hay pedidos para finalizar' });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Get current records to determine the next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A2:A'
        });

        const existingIds = response.data.values || [];
        let nextId = 1;

        // Find the highest existing ID
        if (existingIds.length > 0) {
            const numericIds = existingIds
                .map(row => {
                    const match = (row[0] || '').match(/PAA-(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                })
                .filter(id => !isNaN(id));

            nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
        }

        // Create all values array with sequential IDs
        const values = pedidos.map(pedido => [
            `PAA-${nextId++}`,  // Use nextId and then increment
            pedido.fecha,
            pedido.nombre,
            pedido.cantidad,
            pedido.observaciones || '',
            '', // Empty column E
            '', // Empty column F
            '',// Estado in column H
            'Pendiente' // Estado in column J
        ]);

        // Append to existing Pedidos sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:H',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });

        res.json({ 
            success: true,
            message: 'Pedidos finalizados correctamente'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al finalizar pedidos: ' + error.message 
        });
    }
});
app.get('/obtener-lista-pedidos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen acopio!A2:D'
        });

        const pedidos = [...new Set((response.data.values || []).map(row => row[1]).filter(Boolean))];
        res.json({ success: true, pedidos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener la lista de pedidos' });
    }
});
app.delete('/eliminar-pedido-compras', requireAuth, async (req, res) => {
    try {
        const { nombre, fecha } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all records from Pedidos sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:L'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[2] === nombre && // nombre en columna C
            row[1] === fecha && // fecha en columna B
            row[8] === 'Pendiente' // estado en columna I
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Pedido no encontrado' 
            });
        }

        // Get the sheet ID for Pedidos sheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const pedidosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Pedidos'
        );

        if (!pedidosSheet) {
            return res.status(404).json({
                success: false,
                error: 'Hoja de Pedidos no encontrada'
            });
        }

        // Delete the row (corrected index calculation)
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: pedidosSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,  // Remove the +1 here
                            endIndex: rowIndex + 1 // This stays the same
                        }
                    }
                }]
            }
        });

        return res.json({ 
            success: true, 
            message: 'Pedido eliminado correctamente',
            deletedRow: rows[rowIndex]
        });
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el pedido'
        });
    }
});
app.put('/rechazar-pedido', requireAuth, async (req, res) => {
    try {
        const { id, razon } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A2:M'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Pedido no encontrado' 
            });
        }

        // Actualizar estado y razón
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Pedidos!I${rowIndex + 2}:J${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [['Rechazado', razon]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al rechazar pedido:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al rechazar el pedido' 
        });
    }
});

/* ==================== API DE COMPRAS ==================== */
app.get('/obtener-pedidos-estado/:estado', requireAuth, async (req, res) => {
    try {
        const { estado } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:L'
        });

        const rows = response.data.values || [];
        const pedidos = rows
            .slice(1) // Skip headers
            .filter(row => row[8] === estado)
            .map(row => ({
                id:row[0],
                fecha: row[1],
                nombre: row[2],
                cantidad: row[3],
                observaciones: row[4] || '',
                cantidadRecibida: row[5] || '',
                proveedor: row[6] || '',
                precio: row[7] || ''
            }));
        res.json({ success: true, pedidos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: `Error al obtener pedidos ${estado}`
        });
    }
});
app.post('/entregar-pedido', requireAuth, async (req, res) => {
    try {
        const { id, cantidad, proveedor, precio, transporte, observaciones, estado} = req.body;
        const transporteValidado = transporte === '' || transporte === undefined || transporte === null ? '0' : transporte;

        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A2:N'
        });

        const rows = response.data.values || [];

        
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        // Corregir el cálculo del rango sumando 2 para compensar el encabezado
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Pedidos!F${rowIndex + 2}:N${rowIndex + 2}`, // Sumamos 2 porque el índice empieza en 0 y hay un encabezado
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    cantidad,
                    proveedor,
                    precio,
                    estado === 'llego' ? 'Recibido' : 'En proceso',
                    '',
                    observaciones,
                    req.body.unidad,
                    `${observaciones} ${req.body.unidad}`,
                    transporteValidado
                ]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al entregar el pedido: ' + error.message 
        });
    }
});
app.delete('/eliminar-pedido', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener todos los pedidos
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:L'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Pedido no encontrado' 
            });
        }

        // Get the sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const pedidosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Pedidos'
        );

        if (!pedidosSheet) {
            throw new Error('Hoja de Pedidos no encontrada');
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: pedidosSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Pedido eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el pedido: ' + error.message 
        });
    }
});

/* ==================== API DE PRECIOS DE PRODUCCIÓN ==================== */
app.get('/obtener-precios-base', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Precios produccion!A2:D2'
        });

        if (!response.data.values || response.data.values.length === 0) {
            throw new Error('No se encontraron precios base');
        }

        const valores = response.data.values[0];
        const preciosBase = {
            etiquetado: valores[0].replace(',', '.'),
            sellado: valores[1].replace(',', '.'),
            envasado: valores[2].replace(',', '.'),
            cernidoBolsa: valores[3].replace(',', '.'),
        };

        res.json({ success: true, preciosBase });
    } catch (error) {
        console.error('Error al obtener precios base:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener precios base: ' + error.message 
        });
        
    }
});
app.post('/actualizar-precios-base', requireAuth, async (req, res) => {
    try {
        const { etiquetado, sellado, envasado, cernidoBolsa, cernidoBotes } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Precios produccion!A2:E2',
            valueInputOption: 'RAW',
            resource: {
                values: [[etiquetado, sellado, envasado, cernidoBolsa, cernidoBotes]]
            }
        });

        res.json({ success: true, message: 'Precios actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar precios:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar los precios base: ' + error.message 
        });
    }
});
app.post('/guardar-producto-especial', requireAuth, async (req, res) => {
    try {
        const { producto, base, multiplicador, gramajeMin, gramajeMax } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Formatear el multiplicador correctamente
        let multiplicadorFormateado = multiplicador;
        if (base === 'cernido' && multiplicador) {
            // Convertir la coma a punto y asegurar formato decimal correcto
            const numero = parseFloat(multiplicador.toString().replace(',', '.'));
            multiplicadorFormateado = numero.toString(); // Mantener el formato con punto decimal
        }

        const nuevaFila = [
            base === 'etiquetado' ? multiplicadorFormateado : '1',
            base === 'sellado' ? multiplicadorFormateado : '1',
            base === 'envasado' ? multiplicadorFormateado : '1',
            base === 'cernido' ? multiplicadorFormateado : '1',
            producto,
            gramajeMin || '',
            gramajeMax || ''
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Precios produccion!A3',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [nuevaFila]
            }
        });

        res.json({ success: true, message: 'Producto especial guardado correctamente' });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al guardar producto especial: ' + error.message
        });
    }
});
app.get('/obtener-reglas-especiales', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Precios produccion!A4:G'
        });

        const rows = response.data.values || [];
        const reglas = rows.map(row => ({
            etiquetado: row[0] || '1',
            sellado: row[1] || '1',
            envasado: row[2] || '1',
            cernido: row[3] || '1',
            producto: row[4] || '',
            gramajeMin: row[5] || '',
            gramajeMax: row[6] || ''
        }));
        res.json({ success: true, reglas });
    } catch (error) {
        console.error('Error al obtener reglas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener reglas especiales: ' + error.message
        });
    }
});
app.delete('/eliminar-regla-especial', requireAuth, async (req, res) => {
    try {
        const reglaAEliminar = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener el ID de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const produccionSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Precios produccion'
        );

        if (!produccionSheet) {
            return res.status(404).json({ success: false, error: 'Hoja no encontrada' });
        }

        // Eliminar la fila directamente usando el índice
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: produccionSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: reglaAEliminar.index,
                            endIndex: reglaAEliminar.index + 1
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Regla eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar regla:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar la regla: ' + error.message });
    }
});

/* ==================== RUTAS DE API DE ADVERTENCIA ==================== */
app.get('/obtener-notificaciones', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A2:E'
        });

        const rows = response.data.values || [];
        const notificaciones = rows.map(row => ({
            id: row[0] || '',        // Add ID from first column
            fecha: row[1] || '',
            origen: row[2] || '',
            destino: row[3] || '',
            notificacion: row[4] || ''
        }));

        res.json({ success: true, notificaciones });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener notificaciones' 
        });
    }
});
app.delete('/eliminar-notificacion-advertencia', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all notifications
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A2:E'  // Include all columns
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);  // ID is in first column

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Notificación no encontrada' 
            });
        }

        // Get the sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const notificacionesSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Notificaciones'
        );

        if (!notificacionesSheet) {
            throw new Error('Hoja de Notificaciones no encontrada');
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: notificacionesSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 because we start from A2
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Notificación eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la notificación: ' + error.message
        });
    }
});
app.delete('/eliminar-todas-notificaciones', requireAuth, async (req, res) => {
    try {
        const { nombre, rol, notificaciones } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener todas las notificaciones incluyendo el header
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A1:E'
        });

        const rows = response.data.values || [];
        const header = rows[0];  // Guardar el header
        
        // Filtrar las filas que NO son del usuario actual
        const filasAMantener = rows.slice(1).filter(row => {
            const destino = row[3]; // Columna D (índice 3)
            return destino !== nombre && destino !== rol;
        });

        // Obtener el ID de la hoja de Notificaciones
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const notificacionesSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Notificaciones'
        );

        if (!notificacionesSheet) {
            throw new Error('Hoja de Notificaciones no encontrada');
        }

        // Limpiar solo las filas de datos, no el header
        await sheets.spreadsheets.values.clear({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A2:E'
        });

        // Escribir las filas filtradas manteniendo el header
        if (filasAMantener.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Notificaciones!A1:E',   
                valueInputOption: 'RAW',
                resource: {
                    values: [header, ...filasAMantener]  // Incluir el header
                }
            });
        }

        res.json({ 
            success: true, 
            message: 'Notificaciones eliminadas correctamente',
            notificacionesEliminadas: notificaciones
        });
    } catch (error) {
        console.error('Error al eliminar notificaciones:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar notificaciones: ' + error.message 
        });
    }
});
app.post('/registrar-notificacion', requireAuth, async (req, res) => {
    try {
        const { origen, destino, notificacion } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current notifications to determine the next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A2:A'
        });

        const existingIds = response.data.values || [];
        let nextId = 1;

        if (existingIds.length > 0) {
            const numericIds = existingIds
                .map(row => {
                    const match = (row[0] || '').match(/NA-(\d+)/);  // Changed from N- to NA-
                    return match ? parseInt(match[1]) : 0;
                })
                .filter(id => !isNaN(id));

            nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
        }

        const formattedId = `NA-${nextId}`;  // Changed from N- to NA-
        const fecha = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A2:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    formattedId,
                    fecha,
                    origen,
                    destino,
                    notificacion
                ]]
            }
        });

        res.json({ 
            success: true, 
            message: 'Notificación registrada correctamente',
            id: formattedId
        });
    } catch (error) {
        console.error('Error al registrar notificación:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al registrar la notificación: ' + error.message 
        });
    }
});

/* ==================== RUTAS DE API REGISTROS ACOPIO -  ==================== */
app.get('/obtener-registros-pedidos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:M'  // Ajusta el rango según tus columnas
        });

        const rows = response.data.values || [];
        const pedidos = rows.slice(1); // Omitir encabezados

        res.json({ success: true, pedidos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los pedidos'
        });
    }
});
app.put('/actualizar-registro-pedido', requireAuth, async (req, res) => {
    try {
        const { id, datos } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get all records to find the row to update
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A2:M'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        }

        // Update the record
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Pedidos!A${rowIndex + 2}:M${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    id,
                    rows[rowIndex][1], // Keep original date
                    datos.nombre,
                    datos.cantidad,
                    datos.observaciones,
                    datos.cantidadEntregada,
                    datos.proveedor,
                    datos.costo,
                    datos.estado,
                    datos.detalles,
                    datos.cantidadCompras,
                    datos.medida,
                    datos.entregado
                ]]
            }
        });

        res.json({ success: true, message: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar registro:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar registro' });
    }
});
app.delete('/eliminar-registro-pedido', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get all records to find the row to delete
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A2:M'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado' 
            });
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // Assuming 'Pedidos' is the first sheet
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 because we started from A2
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el registro' 
        });
    }
});

/* ==================== RUTAS DE API ALMACEN GENERAL ==================== */
app.get('/obtener-almacen-general', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A:K'  // Ajusta el rango según tus columnas
        });

        const rows = response.data.values || [];
        const pedidos = rows.slice(1); // Omitir encabezados

        res.json({ success: true, pedidos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los prodcutos'
        });
    }
});
app.delete('/eliminar-producto-almacen', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener el spreadsheet para encontrar el ID de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const almacenSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Almacen general'
        );

        if (!almacenSheet) {
            return res.status(404).json({ 
                success: false, 
                error: 'Hoja de Almacen general no encontrada' 
            });
        }

        // Obtener todos los registros para encontrar la fila a eliminar
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:K'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }

        // Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: almacenSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 porque empezamos desde A2
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el producto' 
        });
    }
});
app.put('/actualizar-producto-almacen', requireAuth, async (req, res) => {
    try {
        const { id, nombre, gramaje, stock, cantidadTira, lista, codigob, precios, tags, indexId, indexNombre } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get all records to find the row to update
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:K'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }

        // Update the row
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Almacen general!A${rowIndex + 2}:K${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[id, nombre, gramaje, stock, cantidadTira, lista, codigob, precios,tags, indexId, indexNombre]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el producto' 
        });
    }
}); 
app.post('/agregar-producto-almacen', requireAuth, async (req, res) => {
    try {
        const { nombre, gramaje, stock, cantidadTira, lista, codigob, precios, tags,indexId, indexNombre } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current products to determine the next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:K'
        });

        const existingIds = response.data.values || [];
        let nextId = 1;

        if (existingIds.length > 0) {
            const numericIds = existingIds
                .map(row => {
                    const match = (row[0] || '').match(/PG-(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                })
                .filter(id => !isNaN(id));

            nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
        }

        const formattedId = `PG-${nextId}`;

        // Add the new product
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:K',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[formattedId, nombre, gramaje, stock, cantidadTira, lista,codigob, precios, tags, indexId, indexNombre]]
            }
        });

        res.json({ 
            success: true, 
            message: 'Producto agregado correctamente',
            id: formattedId
        });
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al agregar el producto: ' + error.message 
        });
    }
});

/* ==================== RUTAS DE API ALMACEN ACOPIO ==================== */
app.get('/obtener-almacen-acopio', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen acopio!A:D'  // Assuming columns A and B contain id and name
        });

        const rows = response.data.values || [];
        const pedidos = rows.slice(1); // Skip headers

        res.json({ success: true, pedidos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los productos de acopio'
        });
    }
});
app.put('/actualizar-producto-acopio', requireAuth, async (req, res) => {
    try {
        const { id, nombre, pesoBrutoLote, pesoPrimaLote } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get all records to find the row to update
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen acopio!A:D'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }

        // Update the row with new values
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Almacen acopio!A${rowIndex + 1}:D${rowIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[id, nombre, pesoBrutoLote, pesoPrimaLote]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el producto' 
        });
    }
});
app.post('/agregar-producto-acopio', requireAuth, async (req, res) => {

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener el último ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen acopio!A2:A'
        });
        
        const rows = response.data.values || [];
        let lastId = 0;
        
        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1][0];
            const match = lastRow.match(/PB-(\d+)/);
            if (match) {
                lastId = parseInt(match[1]);
            }
        }
        
        const newId = `PB-${lastId + 1}`;
        const { nombre, pesoBrutoLote, pesoPrimaLote } = req.body;

        // Agregar nueva fila
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen acopio!A2:D',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[newId, nombre, pesoBrutoLote || '', pesoPrimaLote || '']]
            }
        });

        res.json({ success: true, message: 'Producto agregado correctamente' });
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ success: false, error: 'Error al agregar el producto' });
    }
});
app.delete('/eliminar-producto-acopio', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener el spreadsheet para encontrar el ID de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const acopioSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Almacen acopio'
        );

        if (!acopioSheet) {
            return res.status(404).json({ 
                success: false, 
                error: 'Hoja de Almacen acopio no encontrada' 
            });
        }

        // Obtener todos los registros para encontrar la fila a eliminar
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen acopio!A2:D'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }

        // Eliminar la fila usando batchUpdate
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: acopioSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 porque empezamos desde A2
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el producto' 
        });
    }
});

/* ==================== API DE ALMACEN ACOPIO(INGRESOS, SALIDAS, MOVIMIENTOS) ==================== */
app.post('/procesar-ingreso-acopio', requireAuth, async (req, res) => {
    try {
        const { producto, tipo, peso } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen acopio!A:D'
        });

        const rows = response.data.values || [];
        const productoExistente = rows.find(row => row[1] === producto);

        if (!productoExistente) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        // Determinar qué columna actualizar (BRUTO o PRIMA)
        const columnaIndex = tipo === 'bruto' ? 2 : 3;
        const pesosLotes = (productoExistente[columnaIndex] || '').split(';');
        
        // Calcular siguiente número de lote
        let siguienteLote = 1;
        if (pesosLotes.length > 0) {
            const lotes = pesosLotes
                .map(item => parseInt(item.split('-')[1]) || 0);
            siguienteLote = Math.max(...lotes, 0) + 1;
        }

        // Agregar nuevo peso-lote
        const nuevoPesoLote = `${peso}-${siguienteLote}`;
        const nuevosValores = pesosLotes.length > 0 ? 
            `${productoExistente[columnaIndex]};${nuevoPesoLote}` : 
            nuevoPesoLote;

        // Actualizar la hoja
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Almacen acopio!${tipo === 'bruto' ? 'C' : 'D'}${rows.indexOf(productoExistente) + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[nuevosValores]]
            }
        });

        res.json({
            success: true,
            message: 'Ingreso procesado correctamente'
        });
    } catch (error) {
        console.error('Error en procesar-ingreso-acopio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar el ingreso'
        });
    }
});
app.post('/procesar-salida-acopio', requireAuth, async (req, res) => {
    try {
        const { producto, tipo, peso, lote } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen acopio!A:D'
        });

        const rows = response.data.values || [];
        const productoExistente = rows.find(row => row[1] === producto);

        if (!productoExistente) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        // Determinar columna a actualizar
        const columnaIndex = tipo === 'bruto' ? 2 : 3;
        const pesosLotes = productoExistente[columnaIndex].split(';');
        
        // Encontrar y actualizar el lote específico
        const loteIndex = pesosLotes.findIndex(item => {
            const [, numLote] = item.split('-');
            return parseInt(numLote) === parseInt(lote);
        });

        if (loteIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Lote no encontrado'
            });
        }

        // Actualizar o eliminar el lote según el peso restante
        const [pesoActual] = pesosLotes[loteIndex].split('-');
        const pesoRestante = parseFloat(pesoActual) - parseFloat(peso);

        // Always keep the lot, even if weight is 0
        pesosLotes[loteIndex] = `${Math.max(0, pesoRestante).toFixed(1)}-${lote}`;

        // Actualizar la hoja
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Almacen acopio!${tipo === 'bruto' ? 'C' : 'D'}${rows.indexOf(productoExistente) + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[pesosLotes.join(';')]]
            }
        });

        res.json({
            success: true,
            message: 'Salida procesada correctamente'
        });
    } catch (error) {
        console.error('Error en procesar-salida-acopio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la salida'
        });
    }
});
app.post('/registrar-movimiento-acopio', requireAuth, async (req, res) => {
    try {
        const { tipo, producto, cantidad, operario, razon } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener el último ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-acopio!A:A'
        });
        
        const rows = response.data.values || [];
        let lastId = 0;
        
        rows.forEach(row => {
            if (row[0] && row[0].startsWith('MAA-')) {
                const num = parseInt(row[0].split('-')[1]);
                if (!isNaN(num) && num > lastId) {
                    lastId = num;
                }
            }
        });

        const newId = `MAA-${lastId + 1}`;
        const fecha = new Date().toLocaleString('es-ES');

        // Insertar nuevo registro
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-acopio!A:H',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    newId,
                    fecha,
                    tipo,
                    producto,
                    cantidad,
                    operario,
                    'Almacén Acopio',
                    razon
                ]]
            }
        });

        res.json({ success: true, id: newId });
    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        res.json({ success: false, error: 'Error al registrar movimiento' });
    }
});
app.get('/obtener-movimientos-acopio', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-acopio!A:H'
        });

        const rows = response.data.values || [];
        const movimientos = rows.slice(1); // Omitir encabezados

        res.json({ 
            success: true, 
            movimientos: movimientos 
        });
    } catch (error) {
        console.error('Error:', error);
        res.json({ 
            success: false, 
            error: 'Error al obtener movimientos de acopio' 
        });
    }
});
app.delete('/eliminar-movimiento-acopio', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get the spreadsheet to find the sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const movimientosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Movimientos alm-acopio'
        );

        if (!movimientosSheet) {
            return res.status(404).json({ 
                success: false, 
                error: 'Hoja de movimientos no encontrada' 
            });
        }

        // Get all records to find the row to delete
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-acopio!A2:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Movimiento no encontrado' 
            });
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: movimientosSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1,
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el movimiento' 
        });
    }
});
app.put('/actualizar-movimiento-acopio', requireAuth, async (req, res) => {
    try {
        const { id, tipo, producto, cantidad, operario, almacen, razon } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Validate required fields
        if (!id || !tipo || !producto || !cantidad || !operario || !almacen) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }

        // Find the movement
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-acopio!A:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Movimiento no encontrado'
            });
        }

        // Keep original date
        const fechaOriginal = rows[rowIndex][1];

        // Update the movement
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Movimientos alm-acopio!A${rowIndex + 1}:H${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    id,
                    fechaOriginal,
                    tipo,
                    producto,
                    cantidad,
                    operario,
                    almacen,
                    razon || ''
                ]]
            }
        });

        res.json({
            success: true,
            message: 'Movimiento actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar movimiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el movimiento'
        });
    }
});

/* ==================== RUTAS DE API ALMACEN INGRESOS, SALIDAS, FORMATO, PRECIOS, REGISTRAR MOVIMIENTOS ==================== */
app.put('/ingresar-stock-almacen', requireAuth, async (req, res) => {
    try {
        const { id, cantidad } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current product data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }

        // Calculate new stock
        const currentStock = parseInt(rows[rowIndex][3]) || 0;
        const newStock = currentStock + cantidad;

        // Update the stock (column D)
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Almacen general!D${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[newStock]]
            }
        });

        res.json({ 
            success: true, 
            message: 'Stock actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar stock:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el stock: ' + error.message 
        });
    }
});
app.delete('/eliminar-formato-precio', requireAuth, async (req, res) => {
    try {
        const { tipo } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los productos
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:H'  // Changed from 'Almacen' to 'Almacen general'
        });

        const rows = response.data.values || [];
        const actualizaciones = rows.map((row, index) => {
            const precios = row[7].split(';');
            const nuevosPrecios = precios.filter(precio => !precio.startsWith(tipo + ','));
            return {
                range: `Almacen general!H${index + 2}`,  // Changed from 'Almacen' to 'Almacen general'
                values: [[nuevosPrecios.join(';')]]
            };
        });

        // Actualizar todos los productos
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                valueInputOption: 'RAW',
                data: actualizaciones
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el formato de precio' 
        });
    }
});
app.post('/agregar-formato-precio', requireAuth, async (req, res) => {
    try {
        const { nombreFormato } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los productos
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:H'
        });

        const rows = response.data.values || [];
        const actualizaciones = rows.map((row, index) => {
            const preciosActuales = row[7] || '';
            const nuevosPrecios = preciosActuales + (preciosActuales ? ';' : '') + `${nombreFormato},0`;
            return {
                range: `Almacen general!H${index + 2}`,
                values: [[nuevosPrecios]]
            };
        });

        // Actualizar todos los productos con el nuevo formato
        if (actualizaciones.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: process.env.SPREADSHEET_ID,
                resource: {
                    valueInputOption: 'RAW',
                    data: actualizaciones
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al agregar el formato de precio' 
        });
    }
});
app.put('/retirar-stock-almacen', requireAuth, async (req, res) => {
    try {
        const { id, cantidad } = req.body;
        
        // Obtener la hoja de cálculo
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET_ID;
        
        // Obtener el stock actual
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen general!A2:D',
        });
        
        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);
        
        if (rowIndex === -1) {
            return res.json({ success: false, error: 'Producto no encontrado' });
        }
        
        const stockActual = parseInt(rows[rowIndex][3]);
        const nuevoStock = stockActual - cantidad;
        
        if (nuevoStock < 0) {
            return res.json({ success: false, error: 'Stock insuficiente' });
        }
        
        // Actualizar el stock
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Almacen general!D${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[nuevoStock]]
            }
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, error: 'Error al actualizar el stock' });
    }
});
app.post('/registrar-movimiento-almacen',requireAuth, async (req, res) => {
    try {
        const { tipo, producto, cantidad, operario,razon } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener el último ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-gral!A:A'
        });
        
        const rows = response.data.values || [];
        let lastId = 0;
        
        rows.forEach(row => {
            if (row[0] && row[0].startsWith('MAG-')) {
                const num = parseInt(row[0].split('-')[1]);
                if (!isNaN(num) && num > lastId) {
                    lastId = num;
                }
            }
        });

        const newId = `MAG-${lastId + 1}`;
        const fecha = new Date().toLocaleString('es-ES');

        // Insertar nuevo registro incluyendo el operario
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-gral!A:H',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    newId,
                    fecha,
                    tipo,
                    producto,
                    cantidad,
                    operario,
                    'Almacén General',
                    razon
                ]]
            }
        });

        res.json({ success: true, id: newId });
    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        res.json({ success: false, error: 'Error al registrar movimiento' });
    }
});
app.post('/agregar-tag',requireAuth, async (req, res) => {
    try {
        const { nombreTag } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get first row only
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:I2'
        });
        
        const rows = response.data.values || [];
        if (rows.length > 0) {
            const currentTags = rows[0][8] || '';
            const newTags = currentTags ? `${currentTags};${nombreTag}` : nombreTag;

            // Update only first row with new tag
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Almacen general!I2',
                valueInputOption: 'USER_ENTERED',
                resource: { values: [[newTags]] }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
app.delete('/eliminar-tag',requireAuth, async (req, res) => {
    try {
        const { tag } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all products
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:I'
        });
        
        const rows = response.data.values || [];
        const updatedRows = rows.map(row => {
            const currentTags = (row[8] || '').split(';').filter(t => t !== tag).join(';');
            return [...row.slice(0, 8), currentTags];
        });

        // Update all rows with removed tag
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:I' + (rows.length + 1),
            valueInputOption: 'USER_ENTERED',
            resource: { values: updatedRows }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/* ==================== RUTAS DE API TAREAS (ACOPIO) ==================== */
app.post('/verificar-tarea', requireAuth, async (req, res) => {
    try {
        const { nombre, nombreNormalizado } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Lista tareas!A:B'
        });

        const rows = response.data.values || [];
        const existe = rows.some(row => {
            if (!row[1]) return false;
            const tareaExistente = row[1].toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();
            return tareaExistente === nombreNormalizado;
        });

        res.json({ disponible: !existe });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al verificar la tarea' });
    }
});
app.get('/obtener-tareas', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Lista tareas!A:B'
        });

        const rows = response.data.values || [];
        const tareas = rows.slice(1).map(row => ({
            id: row[0],
            nombre: row[1]
        }));

        res.json({ success: true, tareas });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener las tareas' });
    }
});
app.post('/agregar-tarea', requireAuth, async (req, res) => {
    try {
        const { nombre } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Lista tareas!A:A'
        });
        
        const rows = response.data.values || [];
        let lastId = 0;
        
        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1][0];
            const match = lastRow.match(/TA-(\d+)/);
            if (match) {
                lastId = parseInt(match[1]);
            }
        }
        
        const newId = `TA-${lastId + 1}`;

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Lista tareas!A:B',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[newId, nombre]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al agregar la tarea' });
    }
});
app.delete('/eliminar-tarea', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const tareasSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Lista tareas'
        );

        if (!tareasSheet) {
            return res.status(404).json({ success: false, error: 'Hoja no encontrada' });
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Lista tareas!A:B'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: tareasSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1
                        }
                    }
                }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar la tarea' });
    }
});

/* ==================== RUTAS DE API MOVIMIENTOS Y/O REGISTROS ALMACEN GENERAL ==================== */
app.get('/obtener-movimientos-almacen', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-gral!A:H'
        });

        const rows = response.data.values || [];
        const movimientos = rows.slice(1); // Excluir encabezados

        res.json({ 
            success: true, 
            movimientos: movimientos 
        });
    } catch (error) {
        console.error('Error:', error);
        res.json({ 
            success: false, 
            error: 'Error al obtener movimientos' 
        });
    }
});
app.put('/actualizar-movimiento-almacen', requireAuth, async (req, res) => {
    try {
        const { id, tipo, producto, cantidad, operario, almacen } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Validar datos
        if (!id || !tipo || !producto || !cantidad || !operario || !almacen) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }

        // Buscar el movimiento
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-gral!A:G'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Movimiento no encontrado'
            });
        }

        // Mantener la fecha original
        const fechaOriginal = rows[rowIndex][1];

        // Actualizar el movimiento
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Movimientos alm-gral!A${rowIndex + 1}:G${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    id,
                    fechaOriginal,
                    tipo,
                    producto,
                    cantidad,
                    operario,
                    almacen
                ]]
            }
        });

        res.json({
            success: true,
            message: 'Movimiento actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar movimiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el movimiento'
        });
    }
});
app.delete('/eliminar-movimiento-almacen', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // First, get the spreadsheet to find the correct sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const movimientosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Movimientos alm-gral'
        );

        if (!movimientosSheet) {
            return res.status(404).json({ 
                success: false, 
                error: 'Hoja de movimientos no encontrada' 
            });
        }

        // Get all records to find the row to delete
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-gral!A2:G'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Movimiento no encontrado' 
            });
        }

        // Delete the row using batchUpdate
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: movimientosSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 because we started from A2
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ 
            success: true,
            message: 'Movimiento eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el movimiento' 
        });
    }
});

/* ==================== RUTAS DE CALCULAR MATERIA PRIMA ==================== */
app.get('/obtener-registros-mp', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Materia prima!A2:K'  // Ajusta el rango según tu hoja
        });

        const rows = response.data.values || [];
        const registros = rows.map((row, index) => ({
            id: `RMP-${index + 1}`,
            fecha: row[1] || '',
            nombre: row[2] || '',
            responsable: row[3] || '',
            materiaPrima: row[4] || '',
            gramaje: row[5] || '',
            pesoInicial: row[6] || '',
            pesoFinal: row[7] || '',
            cantidadProducida: row[8] || '',
            pesoMerma: row[9] || '',
            observaciones: row[10] || ''
        }));

        res.json({
            success: true,
            registros: registros
        });

    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los registros'
        });
    }
});
app.post('/registrar-calculo-mp', requireAuth, async (req, res) => {
    try {
        const {
            fecha,
            nombre,
            responsable,
            materiaPrima,
            gramaje,
            pesoInicial,
            pesoFinal,
            cantidadProducida,
            pesoMerma,
            observaciones
        } = req.body;

        const sheets = google.sheets({ version: 'v4', auth });

        // Get current records to determine next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Materia prima!A:A'
        });

        const rows = response.data.values || [];
        let lastId = 0;
        
        rows.forEach(row => {
            if (row[0] && row[0].startsWith('RMP-')) {
                const num = parseInt(row[0].split('-')[1]);
                if (!isNaN(num) && num > lastId) {
                    lastId = num;
                }
            }
        });

        const newId = `RMP-${lastId + 1}`;

        // Insert new record
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Materia prima!A:K',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    newId,
                    fecha,
                    nombre,
                    responsable,
                    materiaPrima,
                    gramaje,
                    pesoInicial,
                    pesoFinal,
                    cantidadProducida,
                    pesoMerma,
                    observaciones || ''
                ]]
            }
        });

        res.json({ 
            success: true, 
            message: 'Registro guardado correctamente',
            id: newId 
        });

    } catch (error) {
        console.error('Error al registrar cálculo MP:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar el registro'
        });
    }
});
app.delete('/eliminar-registro-mp/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener el spreadsheet primero
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const mpSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Materia prima'
        );

        if (!mpSheet) {
            return res.status(404).json({ 
                success: false, 
                error: 'Hoja de Materia Prima no encontrada' 
            });
        }

        // Obtener registros para encontrar la fila a eliminar
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Materia prima!A2:K'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === id || 
            `RMP-${rows.indexOf(row) + 1}` === id
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado' 
            });
        }

        // Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: mpSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1,
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ 
            success: true,
            message: 'Registro eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el registro' 
        });
    }
});
app.put('/actualizar-registro-mp', requireAuth, async (req, res) => {
    try {
        const {
            id,
            fecha,
            nombre,
            responsable,
            materiaPrima,
            gramaje,
            pesoInicial,
            pesoFinal,
            cantidadProducida,
            pesoMerma,
            observaciones
        } = req.body;

        const sheets = google.sheets({ version: 'v4', auth });

        // Get current records to find the row to update
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Materia prima!A2:K'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        // Keep existing values if not provided in the request
        const currentRow = rows[rowIndex];
        const updatedValues = [
            id,
            fecha || currentRow[1],
            nombre || currentRow[2],
            responsable || currentRow[3],
            materiaPrima || currentRow[4],
            gramaje || currentRow[5],
            pesoInicial || currentRow[6],
            pesoFinal || currentRow[7],
            cantidadProducida || currentRow[8],
            pesoMerma || currentRow[9],
            observaciones || currentRow[10] || ''
        ];

        // Update the record
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Materia prima!A${rowIndex + 2}:K${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [updatedValues]
            }
        });

        res.json({
            success: true,
            message: 'Registro actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el registro'
        });
    }
});


/* ==================== RUTAS DE BIOMTRICO ==================== */
// ... código existente ...

app.post('/registrar-biometrico', requireAuth, async (req, res) => {
    try {
        const { tipo } = req.body;
        const fechaHora = new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/,/, ';');

        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Biometrico!A2:D'
        });
        
        const nextId = response.data.values ? `BM-${response.data.values.length + 1}` : 'BM-1';
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Biometrico!A2:D',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    nextId,
                    fechaHora,
                    req.user.nombre,
                    req.body.coordenadas.latitude + ', ' + req.body.coordenadas.longitude
                ]]
            }
        });
        
        res.json({ 
            success: true,
            registro: {
                id: nextId,
                fechaHora,
                nombre: req.user.nombre,
                ubicacion: req.body.coordenadas.latitude + ', ' + req.body.coordenadas.longitude
            }
        });
    } catch (error) {
        console.error('Error registrando biométrico:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ... resto del código ...
app.get('/obtener-biometrico', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Biometrico!A2:F'
        });
        
        const registros = (response.data.values || []).map(row => ({
            id: row[0],
            fecha: row[1].split(';')[0],
            hora: row[1].split(';')[1],
            nombre: row[2],
            ubicacion: row[4],
            tipo: row[5]
        }));
        
        res.json(registros);
    } catch (error) {
        console.error('Error obteniendo registros:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


/* ==================== INICIALIZACIÓN DEL SERVIDOR ==================== */
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}

export default app;