const express = require('express');
const cors = require('cors');
const path = require('path');

// 🚀 CAMBIO 1: Solo cargamos dotenv si NO estamos en Vercel (entorno local)
if (!process.env.VERCEL) {
    require('dotenv').config();
}

const usuarioRoutes = require('./presentation/UsuarioController');
const libroRoutes = require('./presentation/LibroController');
const prestamoRoutes = require('./presentation/PrestamoController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos con ruta absoluta
app.use(express.static(path.join(__dirname, 'public')));

// --- REGISTRO DE RUTAS API ---
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/prestamos', prestamoRoutes);

// Servir el index.html de forma segura en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 CAMBIO 2: Middleware global para atrapar errores y evitar que Node.js se muera (status 1)
app.use((err, req, res, next) => {
    console.error("❌ Error en el servidor:", err.message);
    res.status(500).json({ error: 'Error interno en el servidor de la biblioteca' });
});

// Encender el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});