import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Google Sheets Configuration
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

async function verificarPin(pin) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Usuarios!A2:B'  // Especificamos la hoja 'Usuarios'
        });

        const rows = response.data.values || [];
        const usuario = rows.find(row => row[0] === pin);
        
        return usuario ? { valido: true, nombre: usuario[1] } : { valido: false };
    } catch (error) {
        console.error('Error accessing spreadsheet:', error);
        throw error;
    }
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// ... existing code ...


// Actualizar la configuración de sesión
app.use(session({
    secret: 'tu_clave_secreta',
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'strict'
    },
    rolling: true
}));

// Modificar el middleware requireAuth
function requireAuth(req, res, next) {
    if (!req.session || !req.session.authenticated) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '-1'
    });
    next();
}

// Modificar la ruta principal
app.get('/', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect('/dashboard');
    }
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '-1'
    });
    res.render('login');
});

// Actualizar la ruta del dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session || !req.session.authenticated) {
        return res.redirect('/');
    }
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '-1'
    });
    res.render('dashboard');
});
app.get('/obtener-nombre', (req, res) => {
    res.json({ nombre: req.session.nombre });
});
// Agregar después de los otros endpoints
app.get('/obtener-registros', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A:L'
        });

        const rows = response.data.values || [];
        // Filtrar registros por el nombre del usuario en sesión
        const registrosUsuario = rows.filter(row => row[8] === req.session.nombre);

        res.json({ success: true, registros: registrosUsuario });
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ success: false, error: 'Error al obtener registros' });
    }
});




app.post('/verificar-pin', async (req, res) => {
    try {
        const { pin } = req.body;
        const resultado = await verificarPin(pin);
        
        if (resultado.valido) {
            req.session.authenticated = true;
            req.session.nombre = resultado.nombre;
            await new Promise((resolve) => req.session.save(resolve));
        }
        
        res.json(resultado);
    } catch (error) {
        console.error('Error al verificar PIN:', error);
        res.status(500).json({ error: 'Error al verificar el PIN' });
    }
});
app.post('/cerrar-sesion', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ mensaje: 'Sesión cerrada correctamente' });
    });
});
app.post('/registrar-produccion', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const fecha = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const nombreUsuario = req.session.nombre;

        console.log('Datos recibidos:', req.body); // Debug log

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

        console.log('Valores a insertar:', values); // Debug log

        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            range: 'Produccion!A:L',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });

        console.log('Respuesta de Google Sheets:', result); // Debug log

        res.json({ success: true, message: 'Registro guardado correctamente' });
    } catch (error) {
        console.error('Error detallado:', error); // Debug log
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error al guardar el registro'
        });
    }
});




// Agregar después de los otros endpoints
app.delete('/eliminar-registro', requireAuth, async (req, res) => {
    try {
        const { fecha, producto } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Obtener información del spreadsheet
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
        });
        
        // Encontrar específicamente la hoja "Produccion"
        const produccionSheet = spreadsheet.data.sheets.find(
            sheet => sheet.properties.title === 'Produccion'
        );

        if (!produccionSheet) {
            throw new Error('No se encontró la hoja de Produccion');
        }

        // Obtener registros solo de la hoja de Produccion
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Produccion!A:L'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => 
            row[0] === fecha && 
            row[1] === producto && 
            row[8] === req.session.nombre
        ) + 1;

        if (rowIndex <= 0) {
            return res.status(404).json({ success: false, error: 'Registro no encontrado' });
        }

        // Eliminar usando el ID específico de la hoja de Produccion
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.SPREADSHEET_ID || '1UuMQ0zk5-GX3-Mcbp595pevXDi5VeDPMyqz4eqKfILw',
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: produccionSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        }
                    }
                }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error detallado al eliminar registro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al eliminar el registro: ' + (error.message || 'Error desconocido')
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});