importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCbfR1fpCDIsE8R_9RAN9lG0H9bsk2WQeQ",
    authDomain: "damabravaapp.firebaseapp.com",
    projectId: "damabravaapp",
    storageBucket: "damabravaapp.firebasestorage.app",
    messagingSenderId: "36776613676",
    appId: "1:36776613676:web:f031d9435399a75a9afe89",
    measurementId: "G-NX0Z9ZPC5R"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

async function enviarNotificacion(token, titulo, mensaje) {
    // Verifica que los parámetros no sean undefined
    console.log('Parámetros recibidos:', { token, titulo, mensaje });
    
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

        console.log('Enviando notificación:', mensajeNotificacion);
        const response = await admin.messaging().send(mensajeNotificacion);
        console.log('Respuesta de Firebase:', response);
        return true;
    } catch (error) {
        console.error('Error al enviar notificación:', error);
        return false;
    }
}