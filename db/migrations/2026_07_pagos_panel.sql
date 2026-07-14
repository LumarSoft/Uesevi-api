-- Panel de Pagos de Empresas — tabla companion de overrides de confirmación de pago.
-- La DDJJ (declaraciones_juradas) + auxiliar siguen siendo la fuente de la PROPUESTA.
-- Esta tabla guarda los AJUSTES manuales y el estado de confirmación del panel,
-- sin tocar la declaración jurada. Una fila por DDJJ vigente confirmada/ajustada.
-- Ver: docs/Uesevi_Evolutivo_Panel_de_Pagos_PLAN_TECNICO.md (Sección 2).

CREATE TABLE IF NOT EXISTS `pagos_panel` (
  `id`                    INT NOT NULL AUTO_INCREMENT,
  `declaracion_jurada_id` INT NOT NULL,               -- FK a la DDJJ vigente del período
  `empresa_id`            INT NOT NULL,                -- desnormalizado para agregaciones
  `mes`                   INT NOT NULL,
  `year`                  INT NOT NULL,
  `fecha_pago`            DATE DEFAULT NULL,           -- carga manual; dispara cálculo de intereses
  `importe_fas`           DECIMAL(12,2) DEFAULT NULL,  -- override; NULL = usar auxiliar.fas
  `importe_solidario`     DECIMAL(12,2) DEFAULT NULL,  -- override; NULL = usar auxiliar.solidario
  `importe_sindical`      DECIMAL(12,2) DEFAULT NULL,  -- override; NULL = usar auxiliar.sindical
  `importe_intereses`     DECIMAL(12,2) DEFAULT NULL,  -- auto por fecha_pago, editable
  `total`                 DECIMAL(12,2) DEFAULT NULL,  -- fas+solidario+sindical+intereses (cacheado)
  `estado_pago`           TINYINT NOT NULL DEFAULT 0,  -- 0=Pendiente, 1=Pagado
  `observaciones`         TEXT DEFAULT NULL,           -- motivo del ajuste manual
  `usuario_carga`         INT DEFAULT NULL,            -- trazabilidad (usuarios.id)
  `created`               DATETIME NOT NULL,
  `modified`              DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pagos_panel_ddjj` (`declaracion_jurada_id`),
  KEY `idx_pagos_panel_periodo` (`empresa_id`, `year`, `mes`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
