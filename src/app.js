const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db'); // Importa la conexión a la BD

// Importar la Capa de Presentación (Rutas)
const usuarioRoutes = require('./presentation/UsuarioController');
const libroRoutes = require('./presentation/LibroController');
const prestamoRoutes = require('./presentation/PrestamoController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Middlewares obligatorios
app.use(express.json());

// archivos estáticos desde una carpeta llamada 'public'
app.use(express.static('public'));

// --- REGISTRO DE RUTAS API ---
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/prestamos', prestamoRoutes);

// Ruta de prueba
//app.get('/', (req, res) => {
    //res.send('Servidor de la Biblioteca funcionando correctamente 🚀');
//});

// Encender el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});