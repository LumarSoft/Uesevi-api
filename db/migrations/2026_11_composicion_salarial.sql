-- Composición del salario de referencia que se muestra a los afiliados en la home
-- ("Salario del mes"). Una fila por período (año/mes) y categoría.
--
-- Los conceptos (Básico, Presentismo, Viáticos, Suma no remunerativa, ...) se guardan
-- como JSON para no fijar columnas y permitir agregar/quitar ítems desde el admin:
--   [{"nombre":"Básico","monto":1053200}, {"nombre":"Presentismo","monto":180000}, ...]
-- El total NO se persiste: se calcula sumando los montos (una sola fuente de verdad).
--
-- `publicado` permite cargar el mes siguiente por adelantado sin mostrarlo todavía.

CREATE TABLE IF NOT EXISTS `composicion_salarial` (
  `id`        INT NOT NULL AUTO_INCREMENT,
  `year`      INT NOT NULL,
  `mes`       INT NOT NULL,                                   -- 1..12
  `categoria` VARCHAR(120) NOT NULL DEFAULT 'Vigilador General',
  `conceptos` JSON NOT NULL,                                  -- [{nombre, monto}]
  `nota`      VARCHAR(255) DEFAULT NULL,                      -- aclaración al pie (ej: "Viáticos: referencia de 25 días")
  `publicado` TINYINT NOT NULL DEFAULT 1,                     -- 0 = borrador, 1 = visible en la web
  `created`   DATETIME NOT NULL,
  `modified`  DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_composicion_periodo` (`year`, `mes`, `categoria`),
  KEY `idx_composicion_publicado` (`publicado`, `year`, `mes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
