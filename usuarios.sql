SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Eliminar tablas viejas si existen (en orden por las llaves foráneas)
DROP TABLE IF EXISTS `prestamos`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `libros`;

-- --------------------------------------------------------
-- 1. ESTRUCTURA Y VOLCADO DE LA TABLA: usuarios
-- --------------------------------------------------------

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `rol` enum('admin','lector') DEFAULT 'lector',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `correo`, `password_hash`, `fecha_registro`, `rol`) VALUES
(1, 'Diego', 'diego@correo.com', '$2b$10$q6VCivPyehFwtDGtmTpU3OcVF5VLQgpz6m.bvVlkZeY.JP0jWocpO', '2026-06-19 01:04:05', 'lector'),
(2, 'pedro', 'pedro@gmail.com', '$2b$10$JRTlk6sEFw0E7NmPkz2cf.kbowu.Obd22yjev8ZDcLNClDtyN9gam', '2026-06-19 02:17:06', 'admin'),
(3, 'cristian valencia', 'cristian@hotmail.com', '$2b$10$aQyglq4wuDjJCoRDv2D/kutCZuClesHNB.P4mB/ruWVmR3obJSvnu', '2026-06-20 16:49:40', 'lector'),
(4, 'jonas', 'jonas@live.com', 'abc123', '2026-06-20 19:50:37', 'admin'),
(5, 'jacinto', 'jacinto@hotmail.com', '$2b$10$9cqUFi21ook232CVzQvQeeepwQNXxOF1nGfdRrm44MeIYDTqa6m7W', '2026-06-20 20:36:20', 'admin'),
(6, 'jaime', 'jaime@gmail.com', '$2b$10$mWDgX1t535wN/U5Eyi4GcOZ2TTvibe5OliiD1KUzsTnlrOjOYoew.', '2026-06-25 01:52:45', 'lector');

-- --------------------------------------------------------
-- 2. ESTRUCTURA Y VOLCADO DE LA TABLA: libros
-- --------------------------------------------------------

CREATE TABLE `libros` (
  `id_libro` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `autor` varchar(100) NOT NULL,
  `anio` int(11) NOT NULL,
  `stock` int(11) DEFAULT 5,
  PRIMARY KEY (`id_libro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `libros` (`id_libro`, `titulo`, `autor`, `anio`, `stock`) VALUES
(1, 'Cien años de soledad', 'Gabriel García Márquez', 1967, 3),
(2, 'Cien años de soledad', 'Gabriel García Márquez', 1967, 5),
(3, 'Cien años de soledad', 'Gabriel García Márquez', 1967, 5),
(4, 'Cien años de soledad', 'Gabriel García Márquez', 1967, 5),
(5, 'cronicas de una muerte anunciada', 'Gabriel García Márquez', 1970, 4),
(6, 'los cuatro acuerdos', 'do pedro sape', 2000, 4),
(7, 'tiempos del colera', 'gabriel garcia marquez', 1990, 5),
(8, 'volando por el amazonas', 'pablo escobar', 1980, 5),
(9, 'una vida ligera', 'antony de melo', 1998, 15),
(10, 'la biblia', 'jesus', 1500, 20),
(11, 'libro ingles', 'donald trump', 1998, 14);

-- --------------------------------------------------------
-- 3. ESTRUCTURA Y VOLCADO DE LA TABLA: prestamos
-- --------------------------------------------------------

CREATE TABLE `prestamos` (
  `id_prestamo` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_libro` int(11) NOT NULL,
  `fecha_prestamo` date NOT NULL,
  `fecha_devolucion` date NOT NULL,
  `estado` enum('Pendiente','Prestado','Devuelto') NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (`id_prestamo`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_libro` (`id_libro`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE,
  CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`id_libro`) REFERENCES `libros` (`id_libro`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `prestamos` (`id_prestamo`, `id_usuario`, `id_libro`, `fecha_prestamo`, `fecha_devolucion`, `estado`) VALUES
(1, 1, 1, '2026-06-19', '2026-07-15', 'Prestado'),
(3, 2, 6, '2026-06-19', '2026-06-09', 'Prestado'),
(4, 2, 2, '2026-06-19', '2026-06-11', 'Prestado'),
(5, 2, 5, '2026-06-19', '2026-06-09', 'Prestado'),
(6, 2, 2, '2026-06-19', '2026-06-09', 'Prestado'),
(7, 2, 7, '2026-06-19', '2026-06-19', 'Prestado'),
(8, 2, 8, '2026-06-19', '2026-06-16', 'Prestado'),
(9, 3, 9, '2026-06-20', '2026-06-16', 'Prestado'),
(10, 3, 1, '2026-06-20', '2026-06-20', 'Prestado'),
(11, 3, 7, '2026-06-20', '2026-06-19', 'Prestado'),
(12, 2, 9, '2026-06-20', '2026-06-15', 'Prestado'),
(13, 2, 9, '2026-06-20', '2026-06-15', 'Devuelto'),
(14, 3, 1, '2026-06-20', '2026-06-27', 'Prestado'),
(15, 5, 10, '2026-06-25', '2026-06-19', 'Devuelto'),
(16, 6, 6, '2026-06-24', '2026-07-01', 'Prestado'),
(17, 6, 11, '2026-06-24', '2026-07-01', 'Prestado');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;