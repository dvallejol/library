const express = require('express');
const cors = require('cors');
const path = require('path'); // 1. 🚀 IMPORTANTE: Agrega esta línea arriba con tus otros require
require('dotenv').config();
const db = require('./config/db');

const usuarioRoutes = require('./presentation/UsuarioController');
const libroRoutes = require('./presentation/LibroController');
const prestamoRoutes = require('./presentation/PrestamoController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 2. 🚀 CORREGIDO: Ruta absoluta para la carpeta public en Vercel
app.use(express.static(path.join(__dirname, 'public')));

// --- REGISTRO DE RUTAS API ---
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/prestamos', prestamoRoutes);

// 3. 🚀 AGREGADO: Regla comodín para servir el index.html en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Encender el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});