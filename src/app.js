const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. IMPORTAR LAS RUTAS DE LOS MÓDULOS (Capa de Presentación)
const empleadoRoutes = require('./routes/empleadoRoutes');

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globales
app.use(cors());
app.use(express.json()); // Permite recibir formatos JSON en el cuerpo de las peticiones (req.body)

// 2. VINCULAR LAS RUTAS A LA API
// Ahora cualquier petición a http://localhost:3000/api/empleados irá a tu controlador de empleados
app.use('/api/empleados', empleadoRoutes);

// Ruta de prueba inicial para verificar que el servidor responda
app.get('/', (req, res) => {
    res.json({
        mensaje: "Bienvenido al Sistema de Novedades de Obra API v1.0",
        estado: "Online"
    });
});

// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo con éxito en http://localhost:${PORT}`);
});

module.exports = app;