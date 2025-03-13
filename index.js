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
            range: 'Usuarios!A2:C' // Agregamos una columna para el rol
        });
        const rows = response.data.values || [];
        const usuario = rows.find(row => row[0] === pin);
        
        if (usuario) {
            return { 
                valido: true, 
                nombre: usuario[1],
                rol: usuario[1] === 'Almacen_adm' ? 'admin' : 'user'
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

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});
app.get('/dashboard_alm', (req, res) => {
    res.render('dashboard_alm');
});

/* ==================== RUTAS DE API - AUTENTICACIÓN ==================== */
app.post('/verificar-pin', async (req, res) => {
    try {
        const { pin } = req.body;
        const resultado = await verificarPin(pin);
        if (resultado.valido) {
            const token = jwt.sign(
                { nombre: resultado.nombre },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            });
            res.json({ ...resultado, token });
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
            range: 'Produccion!A:L',
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

app.delete('/eliminar-registro', requireAuth, async (req, res) => {
    try {
        const { fecha, producto } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Verificar si es admin o el propietario del registro
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A:L'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === producto && 
            (req.user.nombre === 'Almacen_adm' || row[8] === req.user.nombre)
        ) + 1;

        // ... resto del código de eliminación existente ...
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
        if (req.user.nombre !== 'Almacen_adm') {
            return res.status(403).json({ success: false, error: 'No autorizado' });
        }

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
app.put('/actualizar-verificacion', requireAuth, async (req, res) => {
    try {
        if (req.user.nombre !== 'Almacen_adm') {
            return res.status(403).json({ success: false, error: 'No autorizado' });
        }

        const { fecha, producto, verificacion, fechaVerificacion, observaciones } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los registros
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A:L'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === producto
        ) + 1;

        if (rowIndex <= 0) {
            return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        }

        // Actualizar las últimas tres columnas
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

/* ==================== INICIALIZACIÓN DEL SERVIDOR ==================== */
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});