CREATE DATABASE IF NOT EXISTS lacocadejacks;
USE lacocadejacks;

-- ==========================================
-- 1. Tabla de Configuraciones Globales
-- ==========================================
CREATE TABLE IF NOT EXISTS configuraciones (
    `clave` VARCHAR(255) NOT NULL,
    `valor` VARCHAR(255) NOT NULL,
    `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 2. Tabla de Clientes
-- ==========================================
CREATE TABLE IF NOT EXISTS clientes (
    `cedula` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `correo` VARCHAR(255) NOT NULL UNIQUE,
    `celular` VARCHAR(20) NOT NULL,
    `esta_activo` TINYINT(1) DEFAULT 0,
    `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`cedula`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 3. Tabla de Planes (Normalización de Planes)
-- ==========================================
CREATE TABLE IF NOT EXISTS planes (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL, -- Semanal, Quincenal, Mensual
    `precio_base` DECIMAL(10,2) NOT NULL,
    `dias_duracion` INT NOT NULL, -- 5, 10, 20
    `esta_activo` TINYINT(1) DEFAULT 1,
    `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 4. Tabla de Suscripciones (Pedidos)
-- ==========================================
CREATE TABLE IF NOT EXISTS suscripciones (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cliente_cedula` VARCHAR(20) NOT NULL,
    `plan_id` INT NOT NULL,
    `necesita_cocas` TINYINT(1) DEFAULT 0,
    `tipo_entrega` ENUM('Fija', 'Hibrida') NOT NULL DEFAULT 'Fija',
    `facturacion_electronica` TINYINT(1) DEFAULT 0,
    `precio_total` DECIMAL(10,2) NOT NULL,
    `estado` ENUM('Pendiente', 'Activo', 'Cancelado') DEFAULT 'Pendiente',
    `alergias` TEXT DEFAULT NULL,
    `restricciones` TEXT DEFAULT NULL,
    `fecha_inicio` DATE DEFAULT NULL,
    `repartidor_id` INT DEFAULT NULL,
    `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_suscripcion_cliente` FOREIGN KEY (`cliente_cedula`) REFERENCES clientes(`cedula`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_suscripcion_plan` FOREIGN KEY (`plan_id`) REFERENCES planes(`id`),
    CONSTRAINT `fk_suscripcion_repartidor` FOREIGN KEY (`repartidor_id`) REFERENCES usuarios(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 5. Tabla de Direcciones de Entrega (Normalización)
-- ==========================================
CREATE TABLE IF NOT EXISTS direcciones_entrega (
    `id` INT NOT NULL AUTO_INCREMENT,
    `suscripcion_id` INT NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `barrio` VARCHAR(100) NOT NULL,
    `dias_entrega` VARCHAR(255) NOT NULL, -- Lunes,Martes...
    `es_principal` TINYINT(1) DEFAULT 1,
    `zona` VARCHAR(100) DEFAULT NULL,
    `latitud` DECIMAL(10, 8) DEFAULT NULL,
    `longitud` DECIMAL(11, 8) DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_direccion_suscripcion` FOREIGN KEY (`suscripcion_id`) REFERENCES suscripciones(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 6. Tabla de Comprobantes de Pago
-- ==========================================
CREATE TABLE IF NOT EXISTS comprobantes (
    `id` INT NOT NULL AUTO_INCREMENT,
    `suscripcion_id` INT NOT NULL,
    `url_imagen` VARCHAR(255) NOT NULL,
    `estado` ENUM('Pendiente', 'Aprobado', 'Rechazado') DEFAULT 'Pendiente',
    `motivo_rechazo` VARCHAR(255) DEFAULT NULL,
    `observaciones` TEXT DEFAULT NULL,
    `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_comprobante_suscripcion` FOREIGN KEY (`suscripcion_id`) REFERENCES suscripciones(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 7. Tabla de Usuarios
-- ==========================================
CREATE TABLE IF NOT EXISTS usuarios (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `rol` ENUM('admin', 'staff', 'cliente', 'repartidor') DEFAULT 'admin',
    `cedula` VARCHAR(20) DEFAULT NULL,
    `zona_asignada` VARCHAR(100) DEFAULT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 8. Tabla de Feriados
-- ==========================================
CREATE TABLE IF NOT EXISTS feriados (
    `id` INT NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL UNIQUE,
    `descripcion` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- 9. Tabla de Menú Semanal
-- ==========================================
CREATE TABLE IF NOT EXISTS menu_semanal (
    `id` INT NOT NULL AUTO_INCREMENT,
    `fechas` VARCHAR(255) NOT NULL DEFAULT 'Del 11 al 15 de Mayo',
    `imagen_url` VARCHAR(255) DEFAULT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- Inserción de Datos Iniciales
-- ==========================================

-- Configuración de cupos
INSERT IGNORE INTO configuraciones (`clave`, `valor`) VALUES ('max_cupos', '1500');

-- Planes base
INSERT INTO planes (`nombre`, `precio_base`, `dias_duracion`) VALUES 
('Semanal', 75000.00, 5),
('Quincenal', 150000.00, 10),
('Mensual', 285000.00, 20);
