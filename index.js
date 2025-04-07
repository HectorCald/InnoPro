/* ==================== IMPORTACIONES Y CONFIGURACIÓN INICIAL ==================== */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import admin from 'firebase-admin';

// Configuración inicial
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = 'una_clave_secreta_muy_larga_y_segura_2024';6

/* ==================== CONFIGURACIÓN DE FIREBASE ==================== */
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firebaseConfig = {
    apiKey: "AIzaSyCbfR1fpCDIsE8R_9RAN9lG0H9bsk2WQeQ",
    authDomain: "damabravaapp.firebaseapp.com",
    projectId: "damabravaapp",
    storageBucket: "damabravaapp.firebasestorage.app",
    messagingSenderId: "36776613676",
    appId: "1:36776613676:web:f031d9435399a75a9afe89",
    measurementId: "G-NX0Z9ZPC5R"
};

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
app.use(express.static(join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

/* ==================== FUNCIONES DE UTILIDAD ==================== */
// Función para enviar notificaciones push
async function enviarNotificacion(token, titulo, mensaje) {
    if (!titulo || !mensaje) {
        console.error('Título o mensaje indefinidos');
        return false;
    }

    try {
        const mensajeNotificacion = {
            token: token,
            notification: {
                title: titulo,
                body: mensaje
            },
            data: {
                title: titulo,
                body: mensaje
            }
        };

        const response = await admin.messaging().send(mensajeNotificacion);
        return true;
    } catch (error) {
        console.error('Error al enviar notificación:', error);
        return false;
    }
}

// Middleware de autenticación
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

// Función para verificar PIN de usuario
async function verificarPin(pin) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Usuarios!A2:C'
        });
        const rows = response.data.values || [];
        const usuario = rows.find(row => row[0] === pin);
        
        if (usuario) {
            const nombre = usuario[1];
            const rol = (nombre === 'Almacen_adm' || nombre === 'Administrador') ? 'admin' : 
                       nombre === 'Almacen' ? 'almacen' : 'user';
            
            return { 
                valido: true, 
                nombre: nombre,
                rol: rol
            };
        }
        return { valido: false };
    } catch (error) {
        console.error('Error accessing spreadsheet:', error);
        throw error;
    }
}

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
    res.render('dashboard_db');
});
app.get('/mantenimiento', requireAuth, (req, res) => {
    res.render('mantenimiento');
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
            range: 'Usuarios!A:C'
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
            rol: usuario[2]
        });
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ 
            error: 'Error al obtener información del usuario' 
        });
    }
});

/* ==================== RUTAS DE API - PRODUCTOS ==================== */
app.get('/obtener-productos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Productos!A2:A'
        });

        const productos = response.data.values ? response.data.values.map(row => row[0]) : [];
        res.json({ success: true, productos });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener lista de productos' 
        });
    }
});

/* ==================== RUTAS DE API - GESTIÓN DE USUARIOS ==================== */
app.post('/crear-usuario', requireAuth, async (req, res) => {
    try {
        const { nombre, pin, rol } = req.body;

        if (!nombre || !pin || !rol) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan datos requeridos' 
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Verificar si el PIN ya existe
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        if (rows.some(row => row[0] === pin)) {
            return res.status(400).json({ 
                success: false, 
                error: 'El PIN ya está en uso' 
            });
        }

        // Agregar nuevo usuario
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[pin, nombre, rol]]
            }
        });

        res.json({
            success: true,
            message: 'Usuario creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear usuario: ' + error.message
        });
    }
});

app.get('/obtener-usuarios', requireAuth, async (req, res) => {
    try {

        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const usuarios = rows.map(row => ({
            pin: row[0] || '',
            nombre: row[1] || '',
            rol: row[2] || ''  // Cambiamos de permisos a rol
        }));

        res.json({ success: true, usuarios });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener usuarios: ' + error.message 
        });
    }
});

app.delete('/eliminar-usuario', requireAuth, async (req, res) => {
    try {

        const { pin } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los usuarios
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Usuarios!A2:C'
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

app.put('/actualizar-usuario', requireAuth, async (req, res) => {
    try {

        const { pinActual, pinNuevo } = req.body;

        if (!pinActual || !pinNuevo) {
            return res.status(400).json({ 
                success: false, 
                error: 'PIN actual y nuevo son requeridos' 
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener usuarios actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === pinActual);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        // Verificar si el nuevo PIN ya existe
        if (rows.some(row => row[0] === pinNuevo)) {
            return res.status(400).json({ 
                success: false, 
                error: 'El nuevo PIN ya está en uso' 
            });
        }

        // Actualizar PIN
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Usuarios!A${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[pinNuevo]]
            }
        });

        res.json({ success: true, message: 'PIN actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar PIN:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar PIN: ' + (error.message || 'Error desconocido') 
        });
    }
});



/* ==================== RUTAS DE API - DATOS ==================== */
app.get('/obtener-nombre', requireAuth, (req, res) => {
    res.json({ nombre: req.user.nombre });
});

/* ==================== API DE PRODUCTOS ==================== */
app.get('/obtener-productos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Productos!A2:A' // Obtener solo la primera columna, excluyendo el título
        });

        const productos = response.data.values ? response.data.values.map(row => row[0]) : [];
        res.json({ success: true, productos });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener lista de productos' 
        });
    }
});

/* ==================== API DE USUARIO ==================== */
app.post('/crear-usuario', requireAuth, async (req, res) => {
    try {

        const { nombre, pin, rol } = req.body;

        if (!nombre || !pin || !rol) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan datos requeridos' 
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Verificar si el PIN ya existe
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        if (rows.some(row => row[0] === pin)) {
            return res.status(400).json({ 
                success: false, 
                error: 'El PIN ya está en uso' 
            });
        }

        // Agregar nuevo usuario
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[pin, nombre, rol]]
            }
        });

        res.json({ 
            success: true, 
            message: 'Usuario creado exitosamente' 
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al crear usuario: ' + error.message 
        });
    }
});

app.get('/obtener-usuarios', requireAuth, async (req, res) => {
    try {

        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const usuarios = rows.map(row => ({
            pin: row[0] || '',
            nombre: row[1] || '',
            rol: row[2] || ''  // Cambiamos de permisos a rol
        }));

        res.json({ success: true, usuarios });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener usuarios: ' + error.message 
        });
    }
});

app.delete('/eliminar-usuario', requireAuth, async (req, res) => {
    try {

        const { pin } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los usuarios
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Usuarios!A2:C'
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

app.put('/actualizar-usuario', requireAuth, async (req, res) => {
    try {

        const { pinActual, pinNuevo } = req.body;

        if (!pinActual || !pinNuevo) {
            return res.status(400).json({ 
                success: false, 
                error: 'PIN actual y nuevo son requeridos' 
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener usuarios actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === pinActual);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        // Verificar si el nuevo PIN ya existe
        if (rows.some(row => row[0] === pinNuevo)) {
            return res.status(400).json({ 
                success: false, 
                error: 'El nuevo PIN ya está en uso' 
            });
        }

        // Actualizar PIN
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Usuarios!A${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[pinNuevo]]
            }
        });

        res.json({ success: true, message: 'PIN actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar PIN:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar PIN: ' + (error.message || 'Error desconocido') 
        });
    }
});

/* ==================== API DE REGISTRO ==================== */
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

/* ==================== API DE PERMISOS ==================== */
app.put('/actualizar-permisos', requireAuth, async (req, res) => {
    try {

        const { pin, permisos } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current users
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === pin);
        
        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Update permissions
        const nuevosPermisos = permisos.join(', ');

        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Usuarios!C${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[nuevosPermisos]]
            }
        });

        res.json({ success: true, message: 'Permisos actualizados correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar permisos: ' + error.message 
        });
    }
});

app.get('/obtener-permisos/:pin', requireAuth, async (req, res) => {
    try {

        const { pin } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const usuario = rows.find(row => row[0] === pin);

        if (!usuario) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        const permisos = usuario[2] ? usuario[2].split(',').map(p => p.trim()) : [];
        res.json({ success: true, permisos });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener permisos: ' + error.message 
        });
    }
});

app.post('/agregar-permiso', requireAuth, async (req, res) => {
    try {

        const { pin, permiso } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener permisos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === pin);
        
        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Actualizar permisos
        const permisosActuales = rows[rowIndex][2] ? rows[rowIndex][2].split(',').map(p => p.trim()) : [];
        if (permisosActuales.includes(permiso)) {
            return res.status(400).json({ success: false, error: 'El permiso ya existe' });
        }

        const nuevosPermisos = [...permisosActuales, permiso].join(', ');

        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Usuarios!C${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[nuevosPermisos]]
            }
        });

        res.json({ success: true, message: 'Permiso agregado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al agregar permiso' });
    }
});

app.delete('/eliminar-permiso', requireAuth, async (req, res) => {
    try {

        const { pin, permiso } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener permisos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === pin);
        
        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Actualizar permisos
        const permisosActuales = rows[rowIndex][2] ? rows[rowIndex][2].split(',').map(p => p.trim()) : [];
        const nuevosPermisos = permisosActuales.filter(p => p !== permiso).join(', ');

        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Usuarios!C${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[nuevosPermisos]]
            }
        });

        res.json({ success: true, message: 'Permiso eliminado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar permiso' });
    }
});

app.get('/obtener-mis-permisos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const usuario = rows.find(row => row[1] === req.user.nombre);

        if (!usuario || !usuario[2]) {
            return res.json({ success: true, permisos: [] });
        }

        // Split permissions and clean them
        const permisos = usuario[2]
            .split(',')
            .map(p => p.trim())
            .filter(p => p !== '');

        console.log('Usuario:', usuario[1]);
        console.log('Permisos encontrados:', permisos);
        
        res.json({ success: true, permisos });
    } catch (error) {
        console.error('Error al obtener permisos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener permisos' 
        });
    }
});

app.get('/obtener-lista-roles', requireAuth, async (req, res) => {
    try {

        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Permisos!A2:A' // Ahora esta hoja contiene roles
        });

        const roles = response.data.values ? response.data.values.map(row => row[0]) : [];
        res.json({ success: true, roles });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener lista de roles: ' + error.message 
        });
    }
});

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

app.get('/obtener-usuario-actual', requireAuth, (req, res) => {
    res.json({ 
        nombre: req.user.nombre,
        rol: req.user.rol 
    });
});
app.get('/obtener-pedidos-pendientes', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:L'
        });

        const rows = response.data.values || [];
        const pedidosPendientes = rows
            .slice(1) // Saltar la fila de encabezados
            .filter(row => row[8] === 'Pendiente')
            .map(row => ({
                fecha: row[1],
                nombre: row[2],
                cantidad: row[3],
                observaciones: row[4] || ''
            }));
        res.json({ success: true, pedidos: pedidosPendientes });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener pedidos pendientes'
        });
    }
});
app.get('/obtener-pedidos-recibidos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:L'
        });

        const rows = response.data.values || [];
        const pedidosRecibidos = rows
            .slice(1) // Saltar la fila de encabezados
            .filter(row => row[8] === 'Recibido')
            .map(row => ({
                id: row[0],
                fecha: row[1],
                nombre: row[2],
                proveedor: row[6] || '',
                obsCompras: row[10] || '',
                medida: row[11] || '',
            }));

        res.json({ success: true, pedidos: pedidosRecibidos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener pedidos recibidos'
        });
    }
});
app.post('/actualizar-pedido-recibido/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:L'
        });

        const rows = response.data.values;
        const rowIndex = rows.findIndex(row => {
            return row[0] === id && 
                   row[8] === 'Recibido' &&
                   row[10] && parseInt(row[10]) > 0;
        });

        if (rowIndex === -1) {
            return res.json({ success: false, error: 'Producto no encontrado' });
        }

        // Actualizar cantidad
        const cantidadActual = parseInt(rows[rowIndex][10] || 0);
        const nuevaCantidad = Math.max(0, cantidadActual - 1);
        
        // Si la nueva cantidad es 0, actualizar estado a "Ingresado"
        if (nuevaCantidad === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `Pedidos!I${rowIndex + 1}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [['Ingresado']]
                }
            });
        }

        // Actualizar la cantidad
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Pedidos!K${rowIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[nuevaCantidad]]
            }
        });

        res.json({ 
            success: true, 
            nuevaCantidad: nuevaCantidad
        });

    } catch (error) {
        console.error('Error en actualizar-pedido-recibido:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el pedido' 
        });
    }
});
app.get('/obtener-pedidos-recibidos/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:L'
        });

        const rows = response.data.values || [];
        const pedidosRecibidos = rows
            .slice(1) // Skip headers
            .filter(row => 
                row[0] == id && // Product name matches
                row[8] === 'Recibido' // Status is Received
            )
            .map(row => ({
                fecha: row[1],
                nombre: row[2],
                cantidad: row[3],
                observaciones: row[4] || '',
                cantidadRecibida: row[5] || '',
                proveedor: row[6] || '',
                precio: row[7] || '',
                obsCompras: row[10] || '',
                medida: row[11] || ''
            }));
            console.log(pedidosRecibidos)

        res.json({ 
            success: true, 
            pedidos: pedidosRecibidos 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener pedidos recibidos del producto'
        });
    }
});
app.post('/procesar-ingreso', requireAuth, async (req, res) => {
    try {
        const {id, producto, peso, observaciones, esMultiple } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales de la hoja de pedidos
        const pedidosResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Pedidos!A:L`
        });

        const pedidos = pedidosResponse.data.values || [];
        const rowIndex = pedidos.findIndex(row => row[0] === id && row[8] === 'Recibido');

        if (rowIndex === -1) {
            return res.status(400).json({ 
                success: false, 
                error: 'Producto no encontrado o no está en estado Recibido'
            });
        }

        // Obtener lotes existentes de Almacen Bruto
        const almacenResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Bruto!A:C'
        });

        const almacenRows = almacenResponse.data.values || [];
        const productosExistentes = almacenRows.filter(row => row[0] === producto);
        
        // Calcular siguiente número de lote
        let siguienteLote = 1;
        if (productosExistentes.length > 0) {
            const lotes = productosExistentes.map(row => parseInt(row[2] || 0));
            siguienteLote = Math.max(...lotes, 0) + 1;
        }

        // Agregar nueva entrada a Almacen Bruto
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Bruto!A:C',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[producto, peso, siguienteLote]]
            }
        });

        // Solo actualizar estado si no es ingreso múltiple
        if (!esMultiple) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `Pedidos!I${rowIndex + 1}:J${rowIndex + 1}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [['Ingresado', observaciones || '']]
                }
            });
        }

        res.json({ 
            success: true, 
            message: 'Ingreso procesado correctamente',
            hojaEliminada: false
        });

    } catch (error) {
        console.error('Error en procesar-ingreso:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al procesar el ingreso: ' + error.message 
        });
    }
});
app.post('/rechazar-pedido', requireAuth, async (req, res) => {
    try {
        const { id, hoja, producto, razon } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!A:L`
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }

        // Actualizar estado y razón en una sola operación
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!I${rowIndex + 1}:J${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['Rechazado', razon]]
            }
        });

        res.json({ 
            success: true, 
            message: 'Pedido rechazado correctamente' 
        });
    } catch (error) {
        console.error('Error en rechazar-pedido:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al procesar el rechazo del pedido' 
        });
    }
});
app.get('/buscar-producto-pendiente/:nombre', requireAuth, async (req, res) => {
    try {
        const { nombre } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Buscar solo en la hoja Pedidos
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:H'
        });

        const rows = response.data.values || [];
        const productos = rows
            .slice(1) // Saltar encabezados
            .filter(row => 
                row[1]?.toLowerCase() === nombre.toLowerCase() && // Nombre coincide
                row[7] === 'Pendiente' // Estado es Pendiente
            )
            .map(row => ({
                fecha: row[0],
                nombre: row[1],
                cantidad: row[2],
                observaciones: row[3] || ''
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




/* ==================== API DE TAREAS Y PROCESOS ==================== */
app.get('/obtener-tareas-proceso', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Tareas!A2:H'
        });

        const rows = response.data.values || [];
        const tareas = rows
            .filter(row => row[3] === 'En proceso')
            .map(row => ({
                nombre: row[0] || '',
                descripcion: row[1] || '',
                fechaInicio: row[2] || '',
                estado: row[3] || '',
                usuario: row[4] || '',
                tiempoInicial: row[5] || Date.now().toString(),
                pesoInicial: parseFloat(row[6]) || 0,
                procesos: row[7] ? JSON.parse(row[7]) : []
            }));

        res.json({ success: true, tareas });
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener las tareas en proceso' 
        });
    }
});
app.get('/obtener-siguiente-lote/:producto', requireAuth, async (req, res) => {
    try {
        const { producto } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get current lots from Almacen Bruto
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Bruto!A:C'
        });

        const rows = response.data.values || [];
        const productoRows = rows.filter(row => row[0] === producto);
        
        let siguienteLote = 1;
        if (productoRows.length > 0) {
            // Get all lot numbers for this product
            const lotes = productoRows.map(row => parseInt(row[2] || 0));
            siguienteLote = Math.max(...lotes, 0) + 1;
        }

        res.json({ success: true, siguienteLote });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener el siguiente lote' 
        });
    }
});
app.post('/actualizar-estado-tarea', requireAuth, async (req, res) => {
    try {
        const { tareaId, estado, tiempoTranscurrido } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener la tarea actual
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Tareas!A2:F'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === tareaId) + 2;

        if (rowIndex < 2) {
            return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
        }

        // Actualizar estado y tiempo
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Tareas!D${rowIndex}:E${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[estado, tiempoTranscurrido]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/agregar-proceso-tarea', requireAuth, async (req, res) => {
    try {
        const { tareaId, descripcion } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get current task data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Tareas!A2:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === tareaId) + 2;

        if (rowIndex < 2) {
            return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
        }

        // Get existing processes or create new array
        const procesos = rows[rowIndex - 2][7] ? JSON.parse(rows[rowIndex - 2][7]) : [];
        
        // Add new process without initial peso
        const nuevoProceso = {
            id: Date.now().toString(),
            descripcion,
            inicio: new Date().toISOString(),
            estado: 'En proceso'
        };
        procesos.push(nuevoProceso);

        // Update sheet with new process data
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Tareas!H${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[JSON.stringify(procesos)]]
            }
        });

        res.json({ success: true, proceso: nuevoProceso });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/actualizar-proceso', requireAuth, async (req, res) => {
    try {
        const { tareaId, procesoId, estado, fin, peso } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get current task data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Tareas!A2:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === tareaId) + 2;

        if (rowIndex < 2) {
            return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
        }

        // Update process
        const procesos = JSON.parse(rows[rowIndex - 2][7] || '[]');
        const procesoIndex = procesos.findIndex(p => p.id === procesoId);

        if (procesoIndex === -1) {
            return res.status(404).json({ success: false, error: 'Proceso no encontrado' });
        }

        // Update process with final weight
        procesos[procesoIndex] = {
            ...procesos[procesoIndex],
            estado,
            fin: fin ? new Date().toISOString() : procesos[procesoIndex].fin,
            peso: peso
        };

        // Update processes in task
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Tareas!H${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[JSON.stringify(procesos)]]
            }
        });

        res.json({ success: true, proceso: procesos[procesoIndex] });
    } catch (error) {
        console.error('Error al actualizar proceso:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/obtener-lista-tareas', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen bruto!A2:A' // First column after header
        });

        const tareas = response.data.values ? response.data.values.map(row => row[0]) : [];
        res.json({ success: true, tareas });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener lista de tareas: ' + error.message 
        });
    }
});

app.get('/obtener-lista-tareas2', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Lista tareas!A2:A' // First column after header
        });

        const tareas = response.data.values ? response.data.values.map(row => row[0]) : [];
        res.json({ success: true, tareas });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener lista de tareas: ' + error.message 
        });
    }
});

app.post('/finalizar-tarea', requireAuth, async (req, res) => {
    try {
        const { tareaId, tiempoCronometro } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener información de la tarea
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Tareas!A2:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === tareaId);
        
        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
        }

        const tarea = rows[rowIndex];
        const procesos = tarea[7] ? JSON.parse(tarea[7]) : [];
        const pesoInicial = parseFloat(tarea[6] || 0);
        let pesoFinal;

        // Determinar peso final basado en si hay procesos o no
        if (procesos.length === 0) {
            // Si no hay procesos, usar el peso inicial como peso final
            pesoFinal = pesoInicial;
        } else {
            // Si hay procesos, usar el peso del último proceso
            const ultimoProceso = procesos[procesos.length - 1];
            pesoFinal = parseFloat(ultimoProceso.peso || 0);
        }

        // Obtener siguiente número de lote para Almacen Prima
        const almacenPrimaResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Prima!A:C'
        });

        const almacenPrimaRows = almacenPrimaResponse.data.values || [];
        const productoRows = almacenPrimaRows.filter(row => row[0] === tareaId);
        
        // Calcular siguiente número de lote
        let siguienteLote = 1;
        if (productoRows.length > 0) {
            const lotes = productoRows.map(row => parseInt(row[2] || 0));
            siguienteLote = Math.max(...lotes, 0) + 1;
        }

        // Registrar en Almacen Prima
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Prima!A:C',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    tareaId,
                    pesoFinal.toFixed(2),
                    siguienteLote
                ]]
            }
        });

        // Registrar movimiento en Movimientos alm-prima
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-prima!A:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    fechaActual,
                    tareaId,
                    pesoFinal.toFixed(2),
                    'Ingreso',
                    siguienteLote
                ]]
            }
        });

        // Registrar en Historial_tareas
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Historial_tareas!A2',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    tarea[0], // nombre
                    tarea[1], // descripción
                    tarea[2], // fecha inicio
                    new Date().toISOString(), // fecha fin
                    tiempoCronometro,
                    pesoInicial.toFixed(2), // peso inicial
                    pesoFinal.toFixed(2), // peso final
                    (pesoInicial - pesoFinal).toFixed(2), // merma
                    tarea[7] // procesos
                ]]
            }
        });

        // Eliminar tarea de la hoja Tareas
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const tareasSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Tareas'
        );

        if (!tareasSheet) {
            throw new Error('Hoja de Tareas no encontrada');
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: tareasSheet.properties.sheetId,
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
            message: 'Tarea finalizada correctamente',
            pesoRestante: (pesoInicial - pesoFinal).toFixed(2),
            pesoProcesado: pesoFinal.toFixed(2),
            loteAlmacenPrima: siguienteLote
        });
    } catch (error) {
        console.error('Error al finalizar tarea:', error);
        res.status(500).json({
            success: false,
            error: 'Error al finalizar la tarea: ' + error.message
        });
    }
});

app.get('/obtener-lista-pedidos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen bruto!A2:A'
        });

        const pedidos = [...new Set((response.data.values || []).map(row => row[0]).filter(Boolean))];
        res.json({ success: true, pedidos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener la lista de pedidos' });
    }
});

app.get('/obtener-lotes/:producto', requireAuth, async (req, res) => {
    try {
        const { producto } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Bruto!A:C'
        });

        const rows = response.data.values || [];
        const lotes = rows
            .filter(row => row[0]?.toLowerCase() === producto.toLowerCase())
            .map(row => ({
                lote: row[2] || '',
                peso: row[1] ? row[1].toString().replace('.', ',') : '0'
            }))
            .filter(lote => {
                const pesoNumerico = parseFloat(lote.peso.replace(',', '.'));
                return !isNaN(pesoNumerico) && pesoNumerico > 0;
            });

        res.json({ success: true, lotes });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener lotes' 
        });
    }
});

app.post('/crear-tarea', requireAuth, async (req, res) => {
    try {
        const { nombre, peso, descripcion, fechaInicio, estado, lotes } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Validar array de lotes
        if (!Array.isArray(lotes) || lotes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron lotes válidos'
            });
        }

        const almacenResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Bruto!A:C'
        });

        const rows = almacenResponse.data.values || [];
        let pesoTotalDisponible = 0;
        const lotesInfo = [];

        // Recolectar información de los lotes
        for (const loteId of lotes) {
            const rowIndex = rows.findIndex(row => 
                row[0]?.toLowerCase() === nombre.toLowerCase() && 
                row[2] === loteId
            );

            if (rowIndex === -1) {
                return res.status(400).json({
                    success: false,
                    error: `Lote ${loteId} no encontrado para el producto ${nombre}`
                });
            }

            const pesoLote = Number(parseFloat(rows[rowIndex][1].toString().replace(',', '.')).toFixed(2));
            pesoTotalDisponible += pesoLote;
            lotesInfo.push({ 
                rowIndex, 
                pesoLote,
                loteId: rows[rowIndex][2]
            });
        }

        // Ordenar lotes de menor a mayor peso
        lotesInfo.sort((a, b) => a.pesoLote - b.pesoLote);

        const pesoRequerido = Number(parseFloat(peso.toString().replace(',', '.')).toFixed(2));

        console.log('Peso total disponible:', pesoTotalDisponible);
        console.log('Peso requerido:', pesoRequerido);

        if (pesoTotalDisponible < pesoRequerido) {
            return res.status(400).json({
                success: false,
                error: `No hay suficiente peso disponible. Disponible total: ${pesoTotalDisponible}kg`
            });
        }

        // Distribuir el peso comenzando por los lotes más pequeños
        let pesoRestante = pesoRequerido;
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });

        // Procesar cada lote
        for (let i = 0; i < lotesInfo.length && pesoRestante > 0; i++) {
            const loteInfo = lotesInfo[i];
            let pesoARestar;

            if (i === lotesInfo.length - 1) {
                // Para el último lote (el más grande), solo tomar lo que falta
                pesoARestar = Number(pesoRestante.toFixed(2));
            } else {
                // Para los demás lotes, tomar todo si es necesario
                pesoARestar = Math.min(loteInfo.pesoLote, pesoRestante);
            }

            const nuevoPeso = (loteInfo.pesoLote - pesoARestar).toFixed(2);

            // Actualizar peso en Almacen Bruto
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `Almacen Bruto!B${loteInfo.rowIndex + 1}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[nuevoPeso]]
                }
            });

            // Registrar movimiento para cada lote
            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Movimientos alm-bruto!A:E',
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [[
                        fechaActual,
                        nombre,
                        pesoARestar.toFixed(2),
                        'Salida',
                        loteInfo.loteId
                    ]]
                }
            });

            pesoRestante = Number((pesoRestante - pesoARestar).toFixed(2));
        }

        // Crear la tarea
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Tareas!A:H',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    nombre,
                    descripcion || '',
                    new Date().toISOString(),
                    'En proceso',
                    req.user.nombre,
                    Date.now().toString(),
                    Number(pesoRequerido).toFixed(2),
                    '[]' // Array de procesos vacío
                ]]
            }
        });

        res.json({ 
            success: true,
            message: 'Tarea creada correctamente',
            tiempoInicial: Date.now()
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear la tarea: ' + error.message
        });
    }
});

app.post('/pausar-tarea', requireAuth, async (req, res) => {
    try {
        const { tareaId, estado, tiempoTranscurrido } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Tareas!A:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === tareaId) + 1;

        if (rowIndex < 1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Tarea no encontrada' 
            });
        }

        // Actualizar estado y tiempo transcurrido
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Tareas!D${rowIndex}:F${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    estado,
                    estado === 'Pausada' ? tiempoTranscurrido : rows[rowIndex - 1][5],
                    Date.now().toString()
                ]]
            }
        });

        res.json({ 
            success: true,
            tiempoGuardado: tiempoTranscurrido
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el estado de la tarea' 
        });
    }
});

app.post('/guardar-programa', requireAuth, async (req, res) => {
    try {
        const { programaciones } = req.body;
        
        if (!programaciones || !Array.isArray(programaciones)) {
            return res.status(400).json({
                success: false,
                error: 'Datos de programación inválidos'
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Format the data for Google Sheets
        const values = programaciones.map(prog => [
            prog.fecha,
            prog.dia,
            prog.producto,
            prog.estado || 'Pendiente',
            prog.usuario || req.user.nombre,
            new Date().toISOString()  // Timestamp
        ]);

        // Append the new programaciones
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Programa acopio!A2:F',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values
            }
        });

        res.json({ 
            success: true, 
            message: 'Programación guardada correctamente',
            count: values.length
        });
    } catch (error) {
        console.error('Error en guardar-programa:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar la programación: ' + error.message
        });
    }
});

app.get('/obtener-programaciones', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Programa acopio!A2:D'
        });

        const rows = response.data.values || [];
        const programaciones = rows.map(row => ({
            fecha: row[0],
            dia: row[1],
            producto: row[2],
            estado: row[3]
        }));

        res.json({ success: true, programaciones });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener programaciones: ' + error.message
        });
    }
});

app.get('/verificar-programa-semana', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get current week's dates
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Programa acopio!A2:D'
        });

        const rows = response.data.values || [];
        const programasSemana = rows.filter(row => {
            if (!row[0]) return false;
            const fecha = new Date(row[0]);
            return fecha >= startOfWeek && fecha <= endOfWeek;
        });

        res.json({
            success: true,
            existePrograma: programasSemana.length > 0,
            programaciones: programasSemana.map(row => ({
                fecha: row[0],
                dia: row[1],
                producto: row[2],
                estado: row[3] || 'Pendiente'
            }))
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar programa'
        });
    }
});

app.delete('/eliminar-programa-completo', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get the sheet ID for Programa acopio sheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const programaSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Programa acopio'
        );

        if (!programaSheet) {
            throw new Error('Hoja de Programa no encontrada');
        }

        // Clear all content except header
        await sheets.spreadsheets.values.clear({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Programa acopio!A2:F'
        });

        res.json({ 
            success: true, 
            message: 'Programa eliminado completamente' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el programa: ' + error.message
        });
    }
});

app.post('/actualizar-estado-programa', requireAuth, async (req, res) => {
    try {
        const { fecha, producto } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all records from Programa acopio sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Programa acopio!A:D'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[2] === producto
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Programa no encontrado' 
            });
        }

        // Get the sheet ID for Programa acopio sheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const programaSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Programa acopio'
        );

        if (!programaSheet) {
            throw new Error('Hoja de Programa no encontrada');
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: programaSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Programa actualizado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el programa: ' + error.message
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

app.delete('/eliminar-pedido-compras', requireAuth, async (req, res) => {
    try {
        const { id} = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all records from Pedidos sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:L'  // Cambiado a la hoja de Pedidos
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === id
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
            error: 'Error al eliminar el pedido: ' + (error.message || 'Error desconocido')
        });
    }
});

app.post('/entregar-pedido', requireAuth, async (req, res) => {
    try {
        const { id, cantidad, proveedor, precio, observaciones, estado } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:N'  // Extendemos el rango hasta K para incluir la unidad
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === id && 
            row[8] === 'Pendiente'
        );

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }

        // Actualizar el pedido con cantidad y unidad separadas
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Pedidos!F${rowIndex + 1}:M${rowIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    cantidad,           // E - Cantidad recibida
                    proveedor,         // F - Proveedor
                    precio,            // G - Precio
                    estado === 'llego' ? 'Recibido' : 'En proceso',  // H - Estado según selección
                    '',                // I - Observaciones
                    observaciones,     // J - Cantidad en unidades
                    req.body.unidad,    // K - Unidad (Bls. o Cja.)
                    `${observaciones} ${req.body.unidad}`, // L - Observaciones completas
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

/* ==================== API DE ALMACENES ==================== */

app.get('/obtener-productos-almacen', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen bruto!A2:D'
        });

        const rows = response.data.values || [];
        const productos = rows.map(row => ({
            nombre: row[0] || '',
            cantidad: parseFloat(row[1]) || 0,
            lote: row[2] || '',
            ultimaActualizacion: row[3] || new Date().toISOString()
        }));

        res.json({ success: true, productos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener productos del almacén'
        });
    }
});

app.get('/obtener-detalle-producto/:nombre', requireAuth, async (req, res) => {
    try {
        const nombreProducto = decodeURIComponent(req.params.nombre);
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener datos actuales del producto
        const productoResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Bruto!A2:C'
        });

        const rows = productoResponse.data.values || [];
        const productosConMismoNombre = rows.filter(row => row[0] === nombreProducto);

        if (productosConMismoNombre.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        // Calcular cantidad total y agrupar por lotes
        const cantidadTotal = productosConMismoNombre.reduce((sum, row) => sum + (parseFloat(row[1]) || 0), 0);
        const lotes = productosConMismoNombre.map(row => ({
            lote: row[2],
            cantidad: parseFloat(row[1]) || 0,
            ultimaActualizacion: row[3] || new Date().toISOString()
        }));

        // Verificar si existe la hoja de movimientos
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });

        const movimientosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Movimientos alm-bruto'
        );

        let movimientos = [];
        let movimientosPorLote = {};
        
        if (movimientosSheet) {
            const historialResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Movimientos alm-bruto!A2:E'
            });

            // Obtener y ordenar todos los movimientos por fecha
            movimientos = (historialResponse.data.values || [])
                .filter(row => row[1] === nombreProducto && row[0])
                .sort((a, b) => {
                    const [diaA, mesA, anioA] = a[0].split('/');
                    const [diaB, mesB, anioB] = b[0].split('/');
                    const fechaA = new Date(20 + anioA, mesA - 1, diaA);
                    const fechaB = new Date(20 + anioB, mesB - 1, diaB);
                    return fechaB - fechaA;
                })
                .slice(0, 5)
                .map(row => ({
                    fecha: row[0],
                    cantidad: parseFloat(row[2]) || 0,
                    tipo: row[3],
                    lote: row[4]
                }));

            // Agrupar movimientos por lote
            movimientosPorLote = lotes.reduce((acc, lote) => {
                acc[lote.lote] = movimientos.filter(m => m.lote === lote.lote);
                return acc;
            }, {});
        }

        res.json({
            success: true,
            producto: {
                nombre: nombreProducto,
                cantidad: cantidadTotal,
                lotes: lotes
            },
            movimientos,
            movimientosPorLote
        });
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalles del producto: ' + error.message
        });
    }
});

app.get('/obtener-productos-almacen-prima', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen prima!A2:D'
        });

        const rows = response.data.values || [];
        const productos = rows.map(row => ({
            nombre: row[0] || '',
            cantidad: parseFloat(row[1]) || 0,
            lote: row[2] || '',
            ultimaActualizacion: row[3] || new Date().toISOString()
        }));

        res.json({ success: true, productos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener productos del almacén'
        });
    }
});

app.get('/obtener-detalle-producto-prima/:nombre', requireAuth, async (req, res) => {
    try {
        const nombreProducto = decodeURIComponent(req.params.nombre);
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener datos actuales del producto
        const productoResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen prima!A2:C'
        });

        const rows = productoResponse.data.values || [];
        const productosConMismoNombre = rows.filter(row => row[0] === nombreProducto);

        if (productosConMismoNombre.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        // Calcular cantidad total y agrupar por lotes
        const cantidadTotal = productosConMismoNombre.reduce((sum, row) => sum + (parseFloat(row[1]) || 0), 0);
        const lotes = productosConMismoNombre.map(row => ({
            lote: row[2],
            cantidad: parseFloat(row[1]) || 0,
            ultimaActualizacion: row[3] || new Date().toISOString()
        }));

        // Verificar si existe la hoja de movimientos
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });

        const movimientosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Movimientos alm-prima'
        );

        let movimientos = [];
        let movimientosPorLote = {};
        
        if (movimientosSheet) {
            const historialResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Movimientos alm-prima!A2:E'
            });

            // Obtener y ordenar todos los movimientos por fecha
            movimientos = (historialResponse.data.values || [])
                .filter(row => row[1] === nombreProducto && row[0])
                .sort((a, b) => {
                    const [diaA, mesA, anioA] = a[0].split('/');
                    const [diaB, mesB, anioB] = b[0].split('/');
                    const fechaA = new Date(20 + anioA, mesA - 1, diaA);
                    const fechaB = new Date(20 + anioB, mesB - 1, diaB);
                    return fechaB - fechaA;
                })
                .slice(0, 5)
                .map(row => ({
                    fecha: row[0],
                    cantidad: parseFloat(row[2]) || 0,
                    tipo: row[3],
                    lote: row[4]
                }));

            // Agrupar movimientos por lote
            movimientosPorLote = lotes.reduce((acc, lote) => {
                acc[lote.lote] = movimientos.filter(m => m.lote === lote.lote);
                return acc;
            }, {});
        }

        res.json({
            success: true,
            producto: {
                nombre: nombreProducto,
                cantidad: cantidadTotal,
                lotes: lotes
            },
            movimientos,
            movimientosPorLote
        });
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalles del producto: ' + error.message
        });
    }
});



/* ==================== API DE HOME ==================== */
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

/* ==================== RUTAS DE API - NOTIFICACIONES ==================== */
app.post('/register-fcm-token', async (req, res) => {
    try {
        const { token } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Guardar el token en Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'FCMTokens!A:B',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[new Date().toISOString(), token]]
            }
        });

        // Enviar notificación de prueba con valores específicos
        const resultado = await enviarNotificacion(
            token,
            'Bienvenido a Damabrava',
            'Las notificaciones se han activado correctamente'
        );

        if (!resultado) {
            throw new Error('Error al enviar la notificación de prueba');
        }

        res.json({ success: true, message: 'Token FCM registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar token FCM:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al registrar token FCM: ' + error.message 
        });
    }
});


/* ==================== RUTAS DE API DE ADVERTENCIA ==================== */
// Agregar esta ruta junto con las demás rutas de API
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

/* ==================== RUTAS DE API - COMPROBANTES ==================== */
app.post('/registrar-comprobante', requireAuth, async (req, res) => {
    try {
        const comprobante = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Comprobantes!A2:J',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    comprobante.id,
                    comprobante.numero,
                    comprobante.fecha,
                    comprobante.nombre,
                    comprobante.telefono,
                    comprobante.carnet,
                    comprobante.detalle,
                    comprobante.subtotal,
                    comprobante.total,
                    comprobante.metodoPago
                ]]
            }
        });

        res.json({ success: true, message: 'Comprobante registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar comprobante:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al registrar el comprobante: ' + error.message 
        });
    }
});
app.get('/obtener-comprobantes', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Comprobantes!A2:J'
        });

        const rows = response.data.values || [];
        const comprobantes = rows.map(row => ({
            id: row[0],
            numero: row[1],
            total: row[8]
        }));

        res.json({ success: true, comprobantes });
    } catch (error) {
        console.error('Error al obtener comprobantes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener comprobantes: ' + error.message
        });
    }
});
app.get('/obtener-detalle-comprobante/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            console.error('Error: ID no proporcionado');
            return res.status(400).json({ 
                success: false, 
                error: 'ID de comprobante no proporcionado' 
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Comprobantes!A2:K'  // Updated range to include column K
        });

        const rows = response.data.values || [];
        const comprobanteData = rows.find(row => row[0] === id);
        
        if (!comprobanteData) {
            console.error(`Comprobante con ID ${id} no encontrado en la hoja de cálculo`);
            return res.status(404).json({ 
                success: false, 
                error: `Comprobante con ID ${id} no encontrado` 
            });
        }

        const comprobante = {
            id: comprobanteData[0],
            numero: comprobanteData[1],
            fecha: comprobanteData[2],
            nombre: comprobanteData[3],
            telefono: comprobanteData[4],
            carnet: comprobanteData[5],
            detalle: comprobanteData[6],
            subtotal: comprobanteData[7],
            total: comprobanteData[8],
            metodoPago: comprobanteData[9],
            firma: comprobanteData[10] || null  // Added firma field
        };

        res.json({ success: true, comprobante });
    } catch (error) {
        console.error('Error al obtener detalle del comprobante:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});
app.post('/guardar-firma/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { firma } = req.body;
        
        if (!id || !firma) {
            return res.status(400).json({
                success: false,
                error: 'ID y firma son requeridos'
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get current comprobantes
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Comprobantes!A2:K'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Comprobante no encontrado'
            });
        }

        // Update the firma column (K)
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Comprobantes!K${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[firma]]
            }
        });

        res.json({
            success: true,
            message: 'Firma guardada correctamente'
        });
    } catch (error) {
        console.error('Error al guardar firma:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar la firma: ' + error.message
        });
    }
});
app.post('/guardar-pdf/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { pdfBase64 } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener el índice de la fila del comprobante
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Comprobantes!A2:A'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            throw new Error('Comprobante no encontrado');
        }

        // Guardar el PDF base64 en la columna L
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Comprobantes!L${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[pdfBase64]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al guardar PDF:', error);
        res.status(500).json({ success: false, error: 'Error al guardar el PDF' });
    }
});
app.get('/descargar-pdf/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener el índice de la fila del comprobante
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Comprobantes!A2:L'
        });

        const rows = response.data.values || [];
        const comprobanteRow = rows.find(row => row[0] === id);

        if (!comprobanteRow || !comprobanteRow[11]) { // 11 es el índice de la columna L
            throw new Error('PDF no encontrado');
        }

        const pdfBase64 = comprobanteRow[11];
        const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=comprobante-${id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error al descargar PDF:', error);
        res.status(500).json({ success: false, error: 'Error al descargar el PDF' });
    }
});
app.delete('/eliminar-registro-pedido', requireAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // First, get the spreadsheet to find the correct sheet ID
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

        // Delete the row using the correct sheet ID
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: pedidosSheet.properties.sheetId,
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

/* ==================== RUTAS DE API ALMACENES ==================== */
app.get('/obtener-almacen-general', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A:H'  // Ajusta el rango según tus columnas
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
        const { id, nombre, gramaje, stock, cantidadTira, lista,codigob, precios } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get all records to find the row to update
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

        // Update the row
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Almacen general!A${rowIndex + 2}:H${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[id, nombre, gramaje, stock, cantidadTira, lista, codigob, precios]]
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
        const { nombre, gramaje, stock, cantidadTira, lista, codigob, precios } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current products to determine the next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen general!A2:H'
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
            range: 'Almacen general!A2:H',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[formattedId, nombre, gramaje, stock, cantidadTira, lista,codigob, precios]]
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


app.post('/registrar-movimiento-almacen', async (req, res) => {
    try {
        const { tipo, producto, cantidad, operario } = req.body;
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
            range: 'Movimientos alm-gral!A:G',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    newId,
                    fecha,
                    tipo,
                    producto,
                    cantidad,
                    operario,
                    'Almacén General'
                ]]
            }
        });

        res.json({ success: true, id: newId });
    } catch (error) {
        console.error('Error al registrar movimiento:', error);
        res.json({ success: false, error: 'Error al registrar movimiento' });
    }
});
/* ==================== INICIALIZACIÓN DEL SERVIDOR ==================== */
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}

// Exportar para Vercel
export default app;