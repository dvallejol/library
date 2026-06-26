const mysql = require('mysql2');
require('dotenv').config(); // Carga las variables del archivo .env

// Crear el pool de conexiones a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 19324, // ⬅️ Agregado: Lee el puerto de Aiven
    waitForConnections: true,
    connectionLimit: 10, // Máximo 10 conexiones simultáneas
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // ⬅️ Agregado: Requerido para conectar con Aiven sin errores
    }
});

// Convertir el pool para que soporte Promesas (async/await)
const db = pool.promise();

// Verificar la conexión inicial
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos MySQL:', err.message);
    } else {
        console.log('✅ Conexión exitosa a la base de datos MySQL.');
        connection.release(); // Libera la conexión de prueba
    }
});

module.exports = db;