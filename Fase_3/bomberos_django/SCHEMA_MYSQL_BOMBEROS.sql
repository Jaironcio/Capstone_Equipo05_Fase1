-- ================================================================================
-- SISTEMA DE GESTIÓN BOMBERIL - BASE DE DATOS MYSQL
-- Sexta Compañía de Bomberos de Puerto Montt
-- Versión: 1.0 - Compatible con Django
-- ================================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS bomberos_sistema DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bomberos_sistema;

-- ================================================================================
-- TABLA PRINCIPAL: VOLUNTARIOS
-- ================================================================================

CREATE TABLE `voluntarios_voluntario` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `primer_nombre` VARCHAR(50) NOT NULL,
  `segundo_nombre` VARCHAR(50) NULL,
  `tercer_nombre` VARCHAR(50) NULL,
  `primer_apellido` VARCHAR(50) NOT NULL,
  `segundo_apellido` VARCHAR(50) NULL,
  `rut` VARCHAR(12) NOT NULL UNIQUE,
  `clave_bombero` VARCHAR(20) NOT NULL UNIQUE,
  `fecha_nacimiento` DATE NOT NULL,
  `direccion` VARCHAR(200) NULL,
  `telefono` VARCHAR(20) NULL,
  `email` VARCHAR(100) NULL,
  `fecha_ingreso` DATE NOT NULL,
  `compania` VARCHAR(100) DEFAULT 'Sexta Compañía',
  `estado_bombero` VARCHAR(20) DEFAULT 'activo',
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  INDEX `idx_rut` (`rut`),
  INDEX `idx_clave` (`clave_bombero`),
  INDEX `idx_estado` (`estado_bombero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE CARGOS
-- ================================================================================

CREATE TABLE `voluntarios_cargo` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `voluntario_id` BIGINT NOT NULL,
  `tipo_cargo` VARCHAR(20) NOT NULL,
  `nombre_cargo` VARCHAR(100) NOT NULL,
  `anio` INT NOT NULL,
  `fecha_inicio` DATE NULL,
  `fecha_fin` DATE NULL,
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE CASCADE,
  INDEX `idx_voluntario` (`voluntario_id`),
  INDEX `idx_tipo` (`tipo_cargo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE SANCIONES
-- ================================================================================

CREATE TABLE `voluntarios_sancion` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `voluntario_id` BIGINT NOT NULL,
  `tipo_sancion` VARCHAR(20) NOT NULL,
  `compania_autoridad` VARCHAR(100) NULL,
  `autoridad_sancionatoria` VARCHAR(100) NULL,
  `fecha_desde` DATE NOT NULL,
  `dias_sancion` INT NULL,
  `fecha_hasta` DATE NULL,
  `oficio_numero` VARCHAR(100) NOT NULL,
  `fecha_oficio` DATE NOT NULL,
  `motivo` TEXT NOT NULL,
  `documento_oficio` VARCHAR(100) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE CASCADE,
  INDEX `idx_voluntario` (`voluntario_id`),
  INDEX `idx_tipo` (`tipo_sancion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE FELICITACIONES
-- ================================================================================

CREATE TABLE `voluntarios_felicitacion` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `voluntario_id` BIGINT NOT NULL,
  `motivo` TEXT NOT NULL,
  `fecha` DATE NOT NULL,
  `otorgado_por` VARCHAR(200) NOT NULL,
  `documento` VARCHAR(100) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE CASCADE,
  INDEX `idx_voluntario` (`voluntario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE CUOTAS SOCIALES
-- ================================================================================

CREATE TABLE `voluntarios_ciclocuotas` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `anio` INT NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `activo` BOOLEAN DEFAULT FALSE,
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  INDEX `idx_anio` (`anio`),
  INDEX `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `voluntarios_configuracioncuotas` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `precio_regular` DECIMAL(10,2) DEFAULT 5000.00,
  `precio_estudiante` DECIMAL(10,2) DEFAULT 3000.00,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `voluntarios_estadocuotasbombero` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `voluntario_id` BIGINT NOT NULL UNIQUE,
  `es_estudiante` BOOLEAN DEFAULT FALSE,
  `cuotas_desactivadas` BOOLEAN DEFAULT FALSE,
  `motivo_desactivacion` TEXT NULL,
  `fecha_desactivacion` DATE NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `voluntarios_pagocuota` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `voluntario_id` BIGINT NOT NULL,
  `mes` INT NOT NULL,
  `anio` INT NOT NULL,
  `monto_pagado` DECIMAL(10,2) NOT NULL,
  `fecha_pago` DATE NOT NULL,
  `metodo_pago` VARCHAR(50) DEFAULT 'Efectivo',
  `numero_comprobante` VARCHAR(100) NULL,
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_pago_cuota` (`voluntario_id`, `mes`, `anio`),
  INDEX `idx_fecha` (`fecha_pago`),
  INDEX `idx_anio_mes` (`anio`, `mes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE BENEFICIOS
-- ================================================================================

CREATE TABLE `voluntarios_beneficio` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(200) NOT NULL,
  `tipo_beneficio` VARCHAR(50) DEFAULT 'Curanto',
  `descripcion` TEXT NULL,
  `precio_tarjeta` DECIMAL(10,2) NOT NULL,
  `precio_tarjeta_extra` DECIMAL(10,2) NOT NULL,
  `fecha_evento` DATE NULL,
  `fecha_limite_venta` DATE NULL,
  `estado` VARCHAR(20) DEFAULT 'activo',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  INDEX `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `voluntarios_asignacionbeneficio` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `beneficio_id` BIGINT NOT NULL,
  `voluntario_id` BIGINT NOT NULL,
  `tarjetas_asignadas` INT DEFAULT 0,
  `tarjetas_vendidas` INT DEFAULT 0,
  `tarjetas_extras_vendidas` INT DEFAULT 0,
  `tarjetas_liberadas` INT DEFAULT 0,
  `tarjetas_disponibles` INT DEFAULT 0,
  `fecha_asignacion` DATE NOT NULL,
  `monto_total` DECIMAL(10,2) DEFAULT 0,
  `monto_pagado` DECIMAL(10,2) DEFAULT 0,
  `monto_pendiente` DECIMAL(10,2) DEFAULT 0,
  `estado_pago` VARCHAR(20) DEFAULT 'pendiente',
  `historial_liberaciones` JSON NULL,
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`beneficio_id`) REFERENCES `voluntarios_beneficio`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_asignacion` (`beneficio_id`, `voluntario_id`),
  INDEX `idx_estado` (`estado_pago`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `voluntarios_pagobeneficio` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `asignacion_id` BIGINT NOT NULL,
  `cantidad_tarjetas` INT NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `fecha_pago` DATE NOT NULL,
  `tipo_pago` VARCHAR(10) DEFAULT 'normal',
  `metodo_pago` VARCHAR(50) DEFAULT 'Efectivo',
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`asignacion_id`) REFERENCES `voluntarios_asignacionbeneficio`(`id`) ON DELETE CASCADE,
  INDEX `idx_asignacion` (`asignacion_id`),
  INDEX `idx_fecha` (`fecha_pago`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE UNIFORMES
-- ================================================================================

CREATE TABLE `voluntarios_contadoruniformes` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `contador_estructural` INT DEFAULT 0,
  `contador_forestal` INT DEFAULT 0,
  `contador_rescate` INT DEFAULT 0,
  `contador_usar` INT DEFAULT 0,
  `contador_agreste` INT DEFAULT 0,
  `contador_um6` INT DEFAULT 0,
  `contador_gersa` INT DEFAULT 0,
  `contador_parada` INT DEFAULT 0,
  `contador_tenida` INT DEFAULT 0,
  `contador_accesorios` INT DEFAULT 0,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `voluntarios_uniforme` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `id_uniforme` VARCHAR(20) NOT NULL UNIQUE,
  `voluntario_id` BIGINT NOT NULL,
  `tipo_uniforme` VARCHAR(50) NOT NULL,
  `fecha_entrega` DATE NOT NULL,
  `cerrado` BOOLEAN DEFAULT FALSE,
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE CASCADE,
  INDEX `idx_tipo` (`tipo_uniforme`),
  INDEX `idx_cerrado` (`cerrado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `voluntarios_piezauniforme` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `uniforme_id` BIGINT NOT NULL,
  `nombre_pieza` VARCHAR(100) NOT NULL,
  `cantidad` INT DEFAULT 1,
  `talla` VARCHAR(20) NULL,
  `condicion` VARCHAR(20) DEFAULT 'Nuevo',
  `estado_fisico` VARCHAR(20) DEFAULT 'Buen Estado',
  `devuelto` BOOLEAN DEFAULT FALSE,
  `fecha_devolucion` DATE NULL,
  `condicion_devolucion` VARCHAR(20) NULL,
  `estado_devolucion` VARCHAR(20) NULL,
  `observaciones_devolucion` TEXT NULL,
  `historial` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`uniforme_id`) REFERENCES `voluntarios_uniforme`(`id`) ON DELETE CASCADE,
  INDEX `idx_uniforme` (`uniforme_id`),
  INDEX `idx_devuelto` (`devuelto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE ASISTENCIAS
-- ================================================================================

CREATE TABLE `voluntarios_cicloasistencia` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `anio` INT NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `activo` BOOLEAN DEFAULT FALSE,
  `minimo_emergencias` INT DEFAULT 0,
  `minimo_asambleas` INT DEFAULT 0,
  `minimo_ejercicios` INT DEFAULT 0,
  `duracion_estimada_dias` INT DEFAULT 365,
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  INDEX `idx_anio` (`anio`),
  INDEX `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `voluntarios_eventoasistencia` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ciclo_id` BIGINT NOT NULL,
  `voluntario_id` BIGINT NOT NULL,
  `tipo_evento` VARCHAR(20) NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NULL,
  `presente` BOOLEAN DEFAULT TRUE,
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`ciclo_id`) REFERENCES `voluntarios_cicloasistencia`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_asistencia` (`voluntario_id`, `tipo_evento`, `fecha`),
  INDEX `idx_tipo` (`tipo_evento`),
  INDEX `idx_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE TESORERÍA
-- ================================================================================

CREATE TABLE `voluntarios_movimientofinanciero` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `tipo_movimiento` VARCHAR(10) NOT NULL,
  `concepto` VARCHAR(200) NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `fecha` DATE NOT NULL,
  `voluntario_id` BIGINT NULL,
  `cuota_id` BIGINT NULL,
  `beneficio_id` BIGINT NULL,
  `observaciones` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by_id` INT NULL,
  FOREIGN KEY (`voluntario_id`) REFERENCES `voluntarios_voluntario`(`id`) ON DELETE SET NULL,
  INDEX `idx_tipo` (`tipo_movimiento`),
  INDEX `idx_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- MÓDULO DE PERSONALIZACIÓN
-- ================================================================================

CREATE TABLE `voluntarios_logocompania` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `imagen` LONGTEXT NOT NULL,
  `usar_en_pdfs` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================================
-- DATOS INICIALES
-- ================================================================================

-- Insertar configuración de cuotas por defecto
INSERT INTO `voluntarios_configuracioncuotas` (`id`, `precio_regular`, `precio_estudiante`) 
VALUES (1, 5000.00, 3000.00);

-- Insertar contador de uniformes
INSERT INTO `voluntarios_contadoruniformes` (`id`) VALUES (1);

-- ================================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ================================================================================

-- Índices compuestos para búsquedas frecuentes
CREATE INDEX `idx_voluntario_estado_fecha` ON `voluntarios_voluntario` (`estado_bombero`, `fecha_ingreso`);
CREATE INDEX `idx_pago_cuota_anio_mes` ON `voluntarios_pagocuota` (`anio`, `mes`, `voluntario_id`);
CREATE INDEX `idx_beneficio_fecha_estado` ON `voluntarios_beneficio` (`fecha_evento`, `estado`);
CREATE INDEX `idx_asignacion_estado_voluntario` ON `voluntarios_asignacionbeneficio` (`estado_pago`, `voluntario_id`);

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================================
-- FIN DEL SCHEMA
-- Total de tablas: 18 tablas principales
-- Módulos: 10 módulos completos
-- ================================================================================

-- Para importar este archivo en MySQL:
-- mysql -u root -p < SCHEMA_MYSQL_BOMBEROS.sql

-- O desde MySQL:
-- SOURCE /ruta/al/archivo/SCHEMA_MYSQL_BOMBEROS.sql;
