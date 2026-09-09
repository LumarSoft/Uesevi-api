-- ---------------------------------------------------------------------------
-- Medición y cupo del asistente "Nacho".
--
-- La API crea estas tablas sola la primera vez que se usa el asistente
-- (models/chatbotUsoModel.js). Este archivo queda como referencia y para poder
-- crearlas a mano en producción antes de un deploy.
--
-- `chatbot_uso` guarda una fila por consulta: los tokens que consumió y el
-- costo en dólares con la tarifa vigente en ese momento. Los tokens son el dato
-- durable; el costo se puede recalcular con otras tarifas cuando cambien.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS chatbot_uso (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  periodo CHAR(7) NOT NULL COMMENT 'aaaa-mm del consumo',
  modelo VARCHAR(80) NOT NULL,
  vueltas TINYINT UNSIGNED NOT NULL DEFAULT 0,
  llamadas_modelo TINYINT UNSIGNED NOT NULL DEFAULT 0,
  herramientas TINYINT UNSIGNED NOT NULL DEFAULT 0,
  tokens_entrada INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_cacheados INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_salida INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_razonamiento INT UNSIGNED NOT NULL DEFAULT 0,
  costo_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  duracion_ms INT UNSIGNED NOT NULL DEFAULT 0,
  con_archivo TINYINT(1) NOT NULL DEFAULT 0,
  estado ENUM('ok','error','cancelada') NOT NULL DEFAULT 'ok',
  KEY idx_chatbot_uso_periodo (periodo),
  KEY idx_chatbot_uso_usuario_periodo (usuario_id, periodo),
  KEY idx_chatbot_uso_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Una sola fila (id = 1): el plan vigente del cliente.
--   modo 'prueba' -> se mide todo y no se bloquea por cupo (sí por tope_usd)
--   modo 'plan'   -> al agotar consultas_incluidas del mes, se bloquea
CREATE TABLE IF NOT EXISTS chatbot_plan (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  modo ENUM('prueba','plan') NOT NULL DEFAULT 'prueba',
  consultas_incluidas INT UNSIGNED NOT NULL DEFAULT 300,
  tope_usd DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  prueba_inicio DATE NULL,
  prueba_dias SMALLINT UNSIGNED NOT NULL DEFAULT 14,
  actualizado DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO chatbot_plan
  (id, modo, consultas_incluidas, tope_usd, prueba_inicio, prueba_dias, actualizado)
VALUES (1, 'prueba', 300, 5.00, CURDATE(), 14, NOW());
