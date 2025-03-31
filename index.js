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
const JWT_SECRET = 'una_clave_secreta_muy_larga_y_segura_2024';

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
    res.redirect('dashboard_db')
});

app.get('/dashboard_db', requireAuth, (req, res) => {
    res.render('dashboard_db');
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
        const { fecha, producto, lote } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all records from Produccion sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A:L'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === producto && 
            row[2] === lote
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado' 
            });
        }

        // Get the sheet ID for Produccion sheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw'
        });
        
        const produccionSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Produccion'
        );

        if (!produccionSheet) {
            throw new Error('Hoja de Producción no encontrada');
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
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
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A:M'
        });

        const rows = response.data.values || [];
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
            range: 'Produccion!A:L'
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
        const nombreUsuario = req.user.nombre;
        const sheets = google.sheets({ version: 'v4', auth });
        const fecha = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const values = [[
            fecha,
            String(req.body.producto),
            Number(req.body.lote),
            Number(req.body.gramaje),
            String(req.body.seleccion),
            Number(req.body.microondas),
            Number(req.body.envasesTerminados),
            String(req.body.fechaVencimiento),
            nombreUsuario,
            '',
            '',
            ''
        ]];
        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A2',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });
        res.json({ success: true, message: 'Registro guardado correctamente' });
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error al guardar el registro'
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

app.post('/registrar-pago', async (req, res) => {
    try {
        const { fecha, producto, lote, operario, total } = req.body;
        
        // Obtener registros de la hoja
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:M'
        });

        const registros = response.data.values;
        if (!registros || registros.length < 2) {
            console.error('No se encontraron registros en la hoja');
            return res.status(404).json({ success: false, error: 'No se encontraron registros' });
        }

        // Buscar el registro específico
        const rowIndex = registros.findIndex(row => 
            row[1] === producto && 
            row[2] === lote && 
            row[8] === operario
        );

        if (rowIndex === -1) {
            console.error('Registro no encontrado. Datos buscados:', { producto, lote, operario });
            return res.status(404).json({ success: false, error: 'No se encontró el registro' });
        }

        // Actualizar el total en la columna M
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Produccion!M${rowIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[total]]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al registrar pago:', error);
        res.status(500).json({ success: false, error: 'Error al registrar el pago: ' + error.message });
    }
});

app.put('/actualizar-registro', requireAuth, async (req, res) => {
    try {
        const { 
            fechaOriginal, productoOriginal, loteOriginal, operarioOriginal,
            fecha, producto, lote, gramaje, seleccion, microondas, envases, 
            vencimiento, razonEdicion 
        } = req.body;

        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener registros actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A2:L'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fechaOriginal &&
            row[1] === productoOriginal &&
            row[2] === loteOriginal &&
            row[8] === operarioOriginal
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado' 
            });
        }

        // Actualizar registro
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Produccion!A${rowIndex + 2}:H${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    fecha,
                    producto,
                    lote,
                    gramaje,
                    seleccion,
                    microondas,
                    envases,
                    vencimiento
                ]]
            }
        });

        // Crear notificaciones para gerencia y operario
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A:D',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    [
                        new Date().toLocaleDateString(),
                        req.user.nombre,
                        'Gerencia',
                        `Edición de registro - ${producto} (Lote: ${lote}): ${razonEdicion}`
                    ],
                    [
                        new Date().toLocaleDateString(),
                        req.user.nombre,
                        operarioOriginal,
                        `Se ha modificado tu registro de ${productoOriginal} (Lote: ${loteOriginal}).Razón: ${razonEdicion}`
                    ]
                ]
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
        const { fecha, producto, lote, operario, verificacion, fechaVerificacion, observaciones, gramaje, seleccion, microondas, envases, vencimiento, cantidadDeclarada } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los registros
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A2:L'
        });

        const rows = response.data.values || [];
        
        // Encontrar el índice exacto verificando todos los campos
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha &&           // Fecha
            row[1] === producto &&        // Producto
            row[2] === lote &&           // Lote
            row[3] === gramaje &&        // Gramaje
            row[4] === seleccion &&      // Selección
            row[5] === microondas &&     // Microondas
            row[6] === envases &&       // Cantidad
            row[7] === vencimiento &&    // Vencimiento
            row[8] === operario &&       // Operario
            !row[9] &&                   // Verificación vacía
            !row[10]                     // Fecha verificación vacía
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado o ya verificado' 
            });
        }

        // Actualizar la verificación
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Produccion!J${rowIndex + 2}:L${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    verificacion,
                    fechaVerificacion,
                    observaciones || ''
                ]]
            }
        });

        // Agregar notificación si hay observaciones o si hay diferencia en las cantidades
        const diferenciaCantidad = parseInt(cantidadDeclarada) !== parseInt(verificacion);
        if (observaciones || diferenciaCantidad) {
            let mensajeNotificacion = `Verificación de ${producto} (Lote: ${lote}): `;
            mensajeNotificacion += `Cantidad declarada: ${cantidadDeclarada}, Cantidad real: ${verificacion}`;
            if (observaciones) {
                mensajeNotificacion += `. Observaciones: ${observaciones}`;
            }

            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Notificaciones!A:D',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [[
                        fechaVerificacion,
                        req.user.nombre,
                        operario,
                        mensajeNotificacion
                    ]]
                }
            });
        }

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

app.get('/obtener-detalles-pedidos/:hoja', requireAuth, async (req, res) => {
    try {
        const { hoja } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!A:H`
        });

        const pedidos = response.data.values || [];
        
        res.json({
            success: true,
            pedidos: pedidos.slice(1) // Skip header row
        });
    } catch (error) {
        console.error('Error al obtener detalles del pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener detalles del pedido: ' + error.message
        });
    }
});

app.get('/obtener-pedidos-pendientes', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:H'
        });

        const rows = response.data.values || [];
        const pedidosPendientes = rows
            .slice(1) // Saltar la fila de encabezados
            .filter(row => row[7] === 'Pendiente')
            .map(row => ({
                fecha: row[0],
                nombre: row[1],
                cantidad: row[2],
                observaciones: row[3] || ''
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
            range: 'Pedidos!A:H'
        });

        const rows = response.data.values || [];
        const pedidosRecibidos = rows
            .slice(1) // Saltar la fila de encabezados
            .filter(row => row[7] === 'Recibido')
            .map(row => ({
                fecha: row[0],
                nombre: row[1],
                cantidad: row[2],
                observaciones: row[3] || '',
                cantidadRecibida: row[4] || '',
                proveedor: row[5] || '',
                precio: row[6] || ''
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

app.post('/procesar-ingreso', requireAuth, async (req, res) => {
    try {
        const { producto, peso, hoja, observaciones } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

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

        // Verificar si el producto existe en la hoja de pedidos
        const pedidosResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!A:I`
        });

        const pedidos = pedidosResponse.data.values || [];
        const productoRowIndex = pedidos.findIndex(row => row[1] === producto);

        if (productoRowIndex === -1) {
            return res.json({ 
                success: true, 
                message: 'El producto ya fue procesado',
                hojaEliminada: false
            });
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

        // Actualizar el estado del producto a "Entregado" y las observaciones
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!H${productoRowIndex + 1}:I${productoRowIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [['Ingresado', observaciones || '']]
            }
        });

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
        const { hoja, producto, razon } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!A:I`
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[1] === producto);

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado' 
            });
        }

        // Actualizar estado y razón en una sola operación
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!H${rowIndex + 1}:I${rowIndex + 1}`,
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

app.delete('/eliminar-pedido', requireAuth, async (req, res) => {
    try {
        const { fecha, nombre } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos de la hoja Pedidos
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === nombre &&
            row[7] === 'Pendiente' // Asegurarse de que solo se eliminen pedidos pendientes
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Pedido no encontrado o no está pendiente' 
            });
        }

        // Obtener el ID de la hoja Pedidos
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const pedidosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Pedidos'
        );

        if (!pedidosSheet) {
            throw new Error('Hoja de Pedidos no encontrada');
        }

        // Eliminar la fila
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

        res.json({ 
            success: true, 
            message: 'Pedido eliminado correctamente de la hoja Pedidos' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el pedido: ' + error.message 
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

        // Convert pedidos to the correct format for the Pedidos sheet
        const values = pedidos.map(pedido => [
            pedido.fecha,
            pedido.nombre,
            pedido.cantidad,
            pedido.observaciones || '',
            '', // Empty column E
            '', // Empty column F
            '', // Empty column G
            'Pendiente' // Estado in column H
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

app.delete('/eliminar-pedido', requireAuth, async (req, res) => {
    try {
        const { fecha, nombre } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos de la hoja Pedidos
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === nombre &&
            row[7] === 'Pendiente'
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Pedido no encontrado' 
            });
        }

        // Obtener el ID de la hoja Pedidos
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const pedidosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Pedidos'
        );

        if (!pedidosSheet) {
            throw new Error('Hoja de Pedidos no encontrada');
        }

        // Eliminar la fila
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
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el pedido: ' + error.message 
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

        // Get current task data
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
        const ultimoProceso = procesos[procesos.length - 1];
        const pesoFinal = ultimoProceso ? parseFloat(ultimoProceso.peso || 0) : 0;

        // Get next lot number for Almacen Prima
        const almacenPrimaResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Prima!A:C'
        });

        const almacenPrimaRows = almacenPrimaResponse.data.values || [];
        const productoRows = almacenPrimaRows.filter(row => row[0] === tareaId);
        
        // Calculate next lot number
        let siguienteLote = 1;
        if (productoRows.length > 0) {
            const lotes = productoRows.map(row => parseInt(row[2] || 0));
            siguienteLote = Math.max(...lotes, 0) + 1;
        }

        // Add new entry to Almacen Prima with new lot number
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Prima!A:C',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[tareaId, pesoFinal, siguienteLote]]
            }
        });

        // Registrar el movimiento en Movimientos alm-prima
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
                    pesoFinal,
                    'Ingreso',
                    siguienteLote
                ]]
            }
        });

        // Add to Historial_tareas
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Historial_tareas!A2',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    tarea[0],
                    tarea[1],
                    tarea[2],
                    new Date().toISOString(),
                    tiempoCronometro,
                    pesoInicial,
                    pesoFinal,
                    pesoInicial - pesoFinal,
                    tarea[7]
                ]]
            }
        });

        // Delete task from Tareas sheet
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
            pesoRestante: pesoInicial - pesoFinal,
            pesoProcesado: pesoFinal,
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
            range: 'Almacen Bruto!A:C'  // Adjust range according to your sheet
        });

        const rows = response.data.values || [];
        const lotes = rows
            .filter(row => row[0]?.toLowerCase() === producto.toLowerCase())
            .map(row => ({
                lote: row[2],
                peso: parseFloat(row[1]) || 0
            }))
            .filter(lote => lote.peso > 0);

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
        const { nombre, peso, descripcion, fechaInicio, estado, lote } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Primero, actualizar Almacen Bruto
        const almacenResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Bruto!A:C'
        });

        const rows = almacenResponse.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0]?.toLowerCase() === nombre.toLowerCase() && 
            row[2] === lote
        );

        if (rowIndex === -1) {
            return res.status(400).json({
                success: false,
                error: 'Producto y lote no encontrados'
            });
        }

        const pesoActual = parseFloat(rows[rowIndex][1]) || 0;
        if (pesoActual < peso) {
            return res.status(400).json({
                success: false,
                error: 'No hay suficiente peso disponible'
            });
        }

        // Actualizar peso en Almacen Bruto
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Almacen Bruto!B${rowIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[pesoActual - peso]]
            }
        });

        // Registrar el movimiento en Movimientos alm-bruto
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-bruto!A:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    fechaActual,
                    nombre,
                    peso,
                    'Salida',
                    lote
                ]]
            }
        });

        // Crear la tarea con procesos vacíos inicialmente
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
                    peso,
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
            range: 'Pedidos!A:H'
        });

        const rows = response.data.values || [];
        const pedidos = rows
            .slice(1) // Skip headers
            .filter(row => row[7] === estado)
            .map(row => ({
                fecha: row[0],
                nombre: row[1],
                cantidad: row[2],
                observaciones: row[3] || '',
                cantidadRecibida: row[4] || '',
                proveedor: row[5] || '',
                precio: row[6] || ''
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
        const { fecha, producto } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all records from Pedidos sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:I'  // Cambiado a la hoja de Pedidos
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === producto
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
        const { fecha, producto, cantidad, proveedor, precio, observaciones } = req.body;
        
        if (!fecha || !producto) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan datos necesarios' 
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener el siguiente número de lote para Almacén Bruto
        const almacenResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen bruto!A:C'
        });

        const almacenRows = almacenResponse.data.values || [];
        const productoRows = almacenRows.filter(row => row[0] === producto);
        
        // Calcular siguiente número de lote
        let siguienteLote = 1;
        if (productoRows.length > 0) {
            const lotes = productoRows.map(row => parseInt(row[2] || 0));
            siguienteLote = Math.max(...lotes, 0) + 1;
        }
        

        // Registrar el movimiento en Movimientos alm-bruto
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Movimientos alm-bruto!A:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[
                    fechaActual,
                    producto,
                    cantidad,
                    'Ingreso',
                    siguienteLote
                ]]
            }
        });

        // Actualizar el pedido en la hoja Pedidos
        const pedidosResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:J'
        });

        const rows = pedidosResponse.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === producto
        ) + 1;

        if (rowIndex <= 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Pedido no encontrado' 
            });
        }

        // Actualizar las columnas E(cantidad), F(proveedor), G(costo), H(estado), J(observaciones)
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Pedidos!E${rowIndex}:J${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    cantidad,
                    proveedor,
                    precio,
                    'Recibido',
                    '',  // Columna I (vacía)
                    observaciones
                ]]
            }
        });

        res.json({ 
            success: true, 
            message: 'Pedido actualizado y registrado en almacén correctamente',
            lote: siguienteLote
        });
    } catch (error) {
        console.error('Error al entregar pedido:', error);
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
// Agregar esta nueva ruta con las demás rutas API
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
        const { producto } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current rules
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Precios produccion!A4:G'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[4] === producto);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Regla no encontrada'
            });
        }

        // Get the sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const preciosSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Precios produccion'
        );

        if (!preciosSheet) {
            throw new Error('Hoja de Precios produccion no encontrada');
        }

        // Delete the rule row (rowIndex + 4 because our range starts at A4)
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: preciosSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 3, // +3 because we start at A4
                            endIndex: rowIndex + 4
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Regla eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar regla:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar regla: ' + error.message
        });
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
            range: 'Notificaciones!A2:D'
        });

        const rows = response.data.values || [];
        const notificaciones = rows.map(row => ({
            fecha: row[0] || '',
            origen: row[1] || '',
            destino: row[2] || '',
            notificacion: row[3] || ''
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
        const { fecha, origen, mensaje } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener todas las notificaciones
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Notificaciones!A2:D'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === origen &&
            row[3] === mensaje  // Agregar comparación del mensaje
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Notificación no encontrada' 
            });
        }

        // Obtener el ID de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const notificacionesSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Notificaciones'
        );

        if (!notificacionesSheet) {
            throw new Error('Hoja de Notificaciones no encontrada');
        }

        // Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: notificacionesSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 porque empezamos desde A2
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



/* ==================== INICIALIZACIÓN DEL SERVIDOR ==================== */
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}

// Exportar para Vercel
export default app;