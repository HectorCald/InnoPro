/* ==================== IMPORTACIONES Y CONFIGURACIÓN INICIAL ==================== */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();


/* ==================== CONFIGURACIÓN DE EXPRESS ==================== */
const app = express();
const port = process.env.PORT || 3000;


/* ==================== CONFIGURACIÓN DE GOOGLE SHEETS ==================== */
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'damabrava@producciondb.iam.gserviceaccount.com',
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDpmxOYH4Hun2HR\nb3mGRKyVlcsHURdC7kDpcvD+Wo5m91Z/VRJXImlw2Oe65R0uef1O3oQzIYZu9wvi\nAD7zlZxACPxrzRtIIwF4Laf4VHvCnaGKm27qeP0V7z5S61Rg+Lo1ZTc3GV717rEH\nkAfIXNDhxKi9G0D4ja97uqdfbP9atdIcCQdLlTtSmlSI0geBC2PE99Oyc2Zq4Qxv\nw4u6UwyaB75xkdUUyOBMrfxnk09vtKd0Q3xxS4sR1h+X3OiSSg1GNSxhmBnk/bcN\n/8+5k3hp+vruIVTSRgeq3FZo1LGEjqNWEcHPbjb0y8q2YT3tsJXu5UNrvbVFURIV\n6zd0p31FAgMBAAECggEAOhDD5BIg19FiHQ7aZBd51oyvNJhhcc+K7vwVDwQvVUSx\niWD5+BKjptsjbn84q67C2fHRZmw04CwkFf79pspPVlNlet42o82fteGTWNSXFp7b\n4noULc/5CJS5Jx87kAcDMfaArP9vbS3xbvHMHW+EtDmPv8GgeqetMNIKfFu5dTA3\nARn/XCtCI/njKPYlL0jA4oPDvDcT6OmHhGJLdgid0K4/A/8mcoPfFzBYGABuMaRW\nRU0JNW/oiJ5ZITRk7ZAjifAgozzL7XNUe+y6bXs9OFvUPmRmTYKwuwqb4eseU/NC\nEZIzWDIloJAK/NZtkLG8j216nRBTjRyEJz51ToMcmQKBgQD1U0/YzmyUBVd/Y4Wg\ngoNQXpJASY1KOHFqnw+XFQackZY6O9+kuLjmZKCjXoI+xMHxL7P+gv1ZG8uOdX1e\nxXmYgYybzQ6L6uOZTs44CTgcOCmzUoQTFvoMy252O3aV2yakYBylhimbbmJk4P98\nN+OyfA+jE5mgeETdsC/jOk5jfwKBgQDzxTgG8mpmoVY1DsYZJnr/hB6iNrkprkfF\njYoPu8Uh6IJeLNyMzSzV3uIkcnG94RARvFo1ojn8ZUJkIhD954NnMGgnrP++6Pvx\nsXiWjdoDaQYq4Ifnl0MU1qObZj2i++LLPq7ZbXvVWH9HxbUSd+zNTabbfNY3+vdg\nv9U4DRTxOwKBgQDC93cZotP/v08OWpW0PoUFtmMc3FeBiOH6DndhZsBeZgWyOis+\nyd+ImqhfrZhtMgnAGF1AA/I8gy5/BTihvOcqIKsSlyDcacx/5nVVa15AbxIVBZsZ\nYMVQrcwYAqH37rcDI68gjUM717oy2e2xVumKy7XRsJ4DPhHc7UzhlVD/GQKBgDBr\n6ncmzA/a2F7tslfoluIOgm9CY4FuBv+s39HEQKI9pzfBvYWSc+d/wHfw67sF68U6\nHskskkwaaReu1KU6yZVDvkyzRpHLgdA+qm9tefLXd8wokZZlK4QGJrWFl5S6aBBr\nQRwbbU+xpobBNPiYLceSNyS+JWc1SNJFCLt7jb9lAoGAcdgtuGjG640TRXHIgtry\nIvAGvdpuTezE6SrlVAi7H1i5O44vR6MB8OWlHCSzuXggInKpe9IB7itYVUDZKF0B\nXYijLlG0fk8k+LFi08A9EHrNXIHNzJW6+ESNEv9dWgM2ztCmqtaS1ZolfBdbl9Km\nGMidWNEDpUZUSaSyepJtGiM=\n-----END PRIVATE KEY-----\n"'?.replace(/\\n/g, '\n')
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


/* ==================== CONFIGURACIÓN DE AUTENTICACIÓN ==================== */
const JWT_SECRET = 'una_clave_secreta_muy_larga_y_segura_2024';
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


/* ==================== FUNCIONES DE UTILIDAD ==================== */
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
// ... existing code ...

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
        const { fecha, producto } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get all records first from Produccion sheet only
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A:L'  // Específicamente de la hoja Produccion
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === producto && 
            (req.user.nombre === 'Almacen_adm' || row[8] === req.user.nombre)
        );

        if (rowIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado o no autorizado para eliminarlo' 
            });
        }

        // Get the sheet ID specifically for Produccion sheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw'
        });
        
        // Find the Produccion sheet ID
        const produccionSheet = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === 'Produccion'
        );

        if (!produccionSheet) {
            throw new Error('Hoja de Producción no encontrada');
        }

        // Delete only from Produccion sheet
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

        // Wait for the operation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

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
            range: 'Produccion!A:L'
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


/* ==================== API DE VERIFICACION ==================== */
app.put('/actualizar-verificacion', requireAuth, async (req, res) => {
    try {

        const { fecha, producto, lote, operario, verificacion, fechaVerificacion, observaciones } = req.body;
        
        if (!fecha || !producto || !lote || !operario) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan datos necesarios para la verificación' 
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los registros
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A:L'
        });

        const rows = response.data.values || [];
        // Buscar el registro específico usando todos los campos identificativos
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === producto &&
            String(row[2]) === String(lote) &&
            row[8] === operario
        ) + 1;

        if (rowIndex <= 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Registro no encontrado' 
            });
        }

        // Actualizar las columnas J, K y L (verificación, fecha y observaciones)
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: `Produccion!J${rowIndex}:L${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[verificacion, fechaVerificacion, observaciones]]
            }
        });

        res.json({ success: true, message: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar verificación:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el registro: ' + (error.message || 'Error desconocido')
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
// Añadir esta nueva ruta
app.get('/obtener-mi-rol', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Usuarios!A2:C'
        });

        const rows = response.data.values || [];
        const usuario = rows.find(row => row[1] === req.user.nombre);

        if (!usuario) {
            return res.json({ success: true, rol: null });
        }

        const rol = usuario[2]; // Obtener el rol de la columna C
        
        res.json({ success: true, rol: rol });
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener rol' 
        });
    }
});


app.post('/guardar-pedido', requireAuth, async (req, res) => {
    try {
        const { nombre, cantidad, observaciones } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        const fecha = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const values = [[
            fecha,
            nombre,
            cantidad,
            observaciones || ''
        ]];

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A2',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });

        res.json({ success: true, message: 'Pedido guardado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al guardar el pedido: ' + error.message 
        });
    }
});

app.get('/obtener-pedidos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:D'
        });

        const pedidos = response.data.values || [];
        res.json({ success: true, pedidos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener pedidos: ' + error.message 
        });
    }
});
app.delete('/eliminar-pedido', requireAuth, async (req, res) => {
    try {
        const { fecha, nombre } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get all pedidos
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A:D'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === nombre
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
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el pedido: ' + error.message 
        });
    }
});
// Agregar después de las importaciones existentes
app.get('/obtener-usuario-actual', requireAuth, (req, res) => {
    res.json({ 
        nombre: req.user.nombre,
        rol: req.user.rol 
    });
});
// Agregar esta ruta junto con las demás rutas de API
app.post('/finalizar-pedidos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get current pedidos
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Pedidos!A2:D'
        });
        
        const pedidos = response.data.values || [];
        
        if (pedidos.length === 0) {
            return res.json({ success: false, error: 'No hay pedidos para finalizar' });
        }

        // Create new sheet name with date and time to make it unique
        const now = new Date();
        const fecha = now.toLocaleDateString('es-ES').replace(/\//g, '-');
        const hora = now.toLocaleTimeString('es-ES').replace(/:/g, '-');
        const nombreHoja = `Pedidos_${fecha}_${hora}`;

        try {
            // Create new sheet
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: process.env.SPREADSHEET_ID,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: nombreHoja
                            }
                        }
                    }]
                }
            });

            // Copy pedidos to new sheet
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `${nombreHoja}!A1:D1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [['Fecha', 'Producto', 'Cantidad', 'Observaciones']]
                }
            });

            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `${nombreHoja}!A2`,
                valueInputOption: 'RAW',
                resource: {
                    values: pedidos
                }
            });

            // Clear current pedidos sheet
            await sheets.spreadsheets.values.clear({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Pedidos!A2:D'
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Error específico:', error);
            if (error.message.includes('already exists')) {
                res.status(400).json({ 
                    success: false, 
                    error: 'Ya existe una hoja con esta fecha y hora. Por favor, intente nuevamente.' 
                });
            } else {
                throw error; // Re-throw other errors
            }
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al finalizar pedidos: ' + error.message 
        });
    }
});
// Agregar esta nueva ruta
app.get('/obtener-hojas-pedidos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        // Filtrar hojas que empiezan con "Pedidos_" y NO contienen "recibido"
        const hojasPedidos = spreadsheet.data.sheets
            .map(sheet => sheet.properties.title)
            .filter(title => 
                title.startsWith('Pedidos_') && 
                !title.toLowerCase().includes('recibido')
            );
        
        res.json({ success: true, hojas: hojasPedidos });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener hojas de pedidos' 
        });
    }
});
// Ruta para obtener pedidos recibidos
// Modificar la ruta de pedidos recibidos
app.get('/obtener-pedidos-recibidos', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        // Obtener todas las hojas que empiezan con "Pedidos_"
        const hojasPedidos = spreadsheet.data.sheets
            .map(sheet => sheet.properties.title)
            .filter(title => title.startsWith('Pedidos_'));

        // Verificar cada hoja por pedidos recibidos
        const hojasRecibidos = [];
        for (const hoja of hojasPedidos) {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `${hoja}!A:F`
            });
            
            const pedidos = response.data.values || [];
            // Si hay al menos un pedido con cantidad entregada o proveedor
            const tieneRecibidos = pedidos.slice(1).some(pedido => 
                (pedido[4] && pedido[4].trim() !== '') || 
                (pedido[5] && pedido[5].trim() !== '')
            );
            
            if (tieneRecibidos) {
                hojasRecibidos.push(hoja);
            }
        }
        
        res.json({ success: true, hojas: hojasRecibidos });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener hojas de recibidos: ' + error.message 
        });
    }
});

app.get('/obtener-detalles-recibidos/:hoja', requireAuth, async (req, res) => {
    try {
        const { hoja } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!A:F`
        });

        const todos = response.data.values || [];
        // Filtrar solo los pedidos que tienen datos en columnas 5 o 6
        const pedidosRecibidos = todos.filter((pedido, index) => {
            if (index === 0) return true; // Mantener la fila de encabezados
            return (pedido[4] && pedido[4].trim() !== '') || 
                   (pedido[5] && pedido[5].trim() !== '');
        });

        res.json({ success: true, pedidos: pedidosRecibidos });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener pedidos recibidos: ' + error.message 
        });
    }
});
// ... resto del código ...
app.post('/procesar-ingreso', requireAuth, async (req, res) => {
    try {
        const { producto, peso, hoja } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Verificar si la hoja existe
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const hojaActual = spreadsheet.data.sheets.find(sheet => 
            sheet.properties.title === hoja
        );

        if (!hojaActual) {
            return res.json({ 
                success: true, 
                message: 'La hoja ya no existe',
                hojaEliminada: true
            });
        }

        // Verificar si el producto existe en la hoja
        const pedidosResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!A:F`
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

        // Actualizar Almacen Bruto
        const almacenResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Almacen Bruto!A:B'
        });

        const rows = almacenResponse.data.values || [];
        const productoIndex = rows.findIndex(row => row[0] === producto);
        const pesoActual = productoIndex >= 0 ? parseFloat(rows[productoIndex][1]) || 0 : 0;
        const nuevoPeso = pesoActual + parseFloat(peso);

        if (productoIndex >= 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `Almacen Bruto!B${productoIndex + 1}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[nuevoPeso]]
                }
            });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Almacen Bruto!A:B',
                valueInputOption: 'RAW',
                resource: {
                    values: [[producto, peso]]
                }
            });
        }

        // Eliminar el producto de la hoja
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: hojaActual.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: productoRowIndex,
                            endIndex: productoRowIndex + 1
                        }
                    }
                }]
            }
        });

        // Verificar si quedan productos en la hoja
        const nuevaResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!A:F`
        });

        const pedidosRestantes = nuevaResponse.data.values || [];
        let hojaEliminada = false;

        // Si solo queda el encabezado o está vacía, eliminar la hoja
        if (pedidosRestantes.length <= 1) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: process.env.SPREADSHEET_ID,
                resource: {
                    requests: [{
                        deleteSheet: {
                            sheetId: hojaActual.properties.sheetId
                        }
                    }]
                }
            });
            hojaEliminada = true;
        }

        res.json({ 
            success: true, 
            message: 'Ingreso procesado correctamente',
            hojaEliminada: hojaEliminada
        });

    } catch (error) {
        console.error('Error en procesar-ingreso:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al procesar el ingreso: ' + error.message 
        });
    }
});
app.get('/obtener-detalles-pedido/:hoja', requireAuth, async (req, res) => {
    try {
        const { hoja } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Verificar si la hoja existe
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID
        });
        
        const hojaExiste = spreadsheet.data.sheets.some(sheet => 
            sheet.properties.title === hoja
        );

        if (!hojaExiste) {
            return res.status(404).json({ 
                success: false, 
                error: 'Hoja no encontrada' 
            });
        }

        // Obtener datos de la hoja
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `${hoja}!A:D`
        });

        const pedidos = response.data.values || [];
        
        res.json({ 
            success: true, 
            pedidos: pedidos
        });
    } catch (error) {
        console.error('Error al obtener detalles del pedido:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener detalles del pedido: ' + error.message 
        });
    }
});
/* ==================== INICIALIZACIÓN DEL SERVIDOR ==================== */
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});