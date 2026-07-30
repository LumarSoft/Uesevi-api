-- Panel de Pagos — control de cálculo de interés por declaración.
--
-- Hasta ahora, cargar una fecha de pago SIEMPRE disparaba el cálculo de interés
-- por mora. Para las declaraciones viejas que hay que completar a mano eso es
-- incorrecto: ya se pagaron, y agregarles interés les cambia el importe.
--
-- `aplica_interes` decide si el interés se recalcula al cambiar la fecha de pago.
-- Va en la base (y no en el front) porque la grilla, el detalle de empresa y los
-- totalizadores tienen que respetar la misma decisión.
--
-- Default por diseño:
--   • DDJJ pendiente (a completar hoy) -> 1, calcula interés.
--   • DDJJ ya confirmada/pagada        -> 0, no se le toca el importe cobrado.
--
-- Ver docs/Uesevi_Cambios_Agosto2026_Presentismo_y_Panel_Pagos.md (Parte B).

-- ⚠️ Sin este ALTER el Panel de Pagos queda roto (grilla, detalle y guardado).
-- La API avisa en el log de arranque si falta — ver db/schemaCheck.js.

ALTER TABLE `pagos_panel`
  ADD COLUMN `aplica_interes` TINYINT NOT NULL DEFAULT 1 AFTER `fecha_pago`;

-- Backfill: lo ya confirmado no debe recalcular interés. Es el caso de las
-- declaraciones viejas backfilleadas por 2026_07_backfill_pagos_aprobados.sql,
-- que se marcaron como pagadas sin importes propios.
UPDATE `pagos_panel` SET `aplica_interes` = 0 WHERE `estado_pago` = 1;

-- Verificación: tiene que devolver 1 fila.
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'pagos_panel'
   AND COLUMN_NAME = 'aplica_interes';
