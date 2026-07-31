-- Fix — filas duplicadas en pagos_panel (mismo mes repetido en el panel).
--
-- CAUSA: `upsertPayment` usaba INSERT ... ON DUPLICATE KEY UPDATE, que depende
-- del índice único `uq_pagos_panel_ddjj (declaracion_jurada_id)`. Si ese índice
-- no existe en la base (la tabla puede haberse creado antes de la migración
-- 2026_07_pagos_panel.sql, y `CREATE TABLE IF NOT EXISTS` no la modifica), el
-- ON DUPLICATE nunca dispara y **cada guardado inserta una fila nueva**.
-- Resultado visible: el mismo período aparecía 2 o 3 veces en el detalle de la
-- empresa, con estados distintos según qué fila tomaba el JOIN.
--
-- El código ya no depende del índice (ahora hace UPDATE por id o INSERT), pero
-- igual conviene: (1) limpiar lo duplicado y (2) crear el índice como red de
-- seguridad a nivel base.
--
-- CORRER LOS PASOS EN ORDEN.

-- ---------------------------------------------------------------------------
-- PASO 1 — Diagnóstico. Ver qué duplicados hay antes de tocar nada.
-- ---------------------------------------------------------------------------
SELECT declaracion_jurada_id, empresa_id, mes, year,
       COUNT(*) AS filas,
       SUM(estado_pago = 1) AS confirmadas
FROM pagos_panel
GROUP BY declaracion_jurada_id, empresa_id, mes, year
HAVING COUNT(*) > 1
ORDER BY filas DESC, year DESC, mes DESC;

-- ¿Existe el índice único? Si esta consulta no devuelve filas, ahí está el bug.
SHOW INDEX FROM `pagos_panel` WHERE Key_name = 'uq_pagos_panel_ddjj';

-- ---------------------------------------------------------------------------
-- PASO 2 — Deduplicar. Se conserva UNA fila por declaración:
--   primero la confirmada (estado_pago = 1) y, entre iguales, la más reciente.
--   Es el mismo criterio que aplica el código.
-- ---------------------------------------------------------------------------
DELETE pp FROM pagos_panel pp
INNER JOIN (
  SELECT declaracion_jurada_id,
         SUBSTRING_INDEX(
           GROUP_CONCAT(id ORDER BY estado_pago DESC, id DESC), ',', 1
         ) AS keep_id
  FROM pagos_panel
  GROUP BY declaracion_jurada_id
  HAVING COUNT(*) > 1
) k
  ON k.declaracion_jurada_id = pp.declaracion_jurada_id
 AND pp.id <> k.keep_id;

-- Control: esta consulta tiene que devolver 0 filas.
SELECT declaracion_jurada_id, COUNT(*) AS filas
FROM pagos_panel
GROUP BY declaracion_jurada_id
HAVING COUNT(*) > 1;

-- ---------------------------------------------------------------------------
-- PASO 3 — Crear el índice único (recién después de que el paso 2 dé 0 filas).
-- Si ya existe, MySQL tira "Duplicate key name" y se puede ignorar.
-- ---------------------------------------------------------------------------
ALTER TABLE `pagos_panel`
  ADD UNIQUE KEY `uq_pagos_panel_ddjj` (`declaracion_jurada_id`);
