-- Backfill PROVISORIO del Panel de Pagos.
--
-- Marca como PAGADAS en el Panel (pagos_panel.estado_pago = 1) las declaraciones
-- juradas VIGENTES (última rectificativa) que están en estado "Aprobado" (estado = 1)
-- para períodos hasta el mes actual inclusive.
--
-- Diseño: NO copia los importes (importe_fas/solidario/sindical/intereses/total quedan
-- en NULL). El Panel resuelve esos montos desde la propuesta de la DDJJ + auxiliar,
-- manteniendo una única fuente de verdad para los importes; el pagos_panel solo aporta
-- la marca de "pago confirmado" (independiente del estado de la DDJJ).
--
-- Idempotente: la unique key uq_pagos_panel_ddjj + ON DUPLICATE KEY evita duplicados
-- y reafirma estado_pago = 1 si se corre más de una vez.
--
-- Ver docs/Uesevi_Evolutivo_Panel_de_Pagos_PLAN_TECNICO.md (decisión de independencia
-- de pagos respecto de la aprobación de la DDJJ).

INSERT INTO pagos_panel
  (declaracion_jurada_id, empresa_id, mes, year, fecha_pago,
   estado_pago, observaciones, created, modified)
SELECT
  dj.id,
  dj.empresa_id,
  dj.mes,
  dj.year,
  dj.fecha_pago,
  1,
  'Backfill provisorio: DDJJ Aprobada',
  NOW(),
  NOW()
FROM declaraciones_juradas dj
INNER JOIN (
  SELECT empresa_id, mes, year, MAX(rectificada) AS mr
  FROM declaraciones_juradas
  GROUP BY empresa_id, mes, year
) mx
  ON mx.empresa_id = dj.empresa_id
 AND mx.mes  = dj.mes
 AND mx.year = dj.year
 AND mx.mr   = dj.rectificada
WHERE dj.estado = 1
  AND (dj.year * 12 + dj.mes) <= (YEAR(NOW()) * 12 + MONTH(NOW()))
ON DUPLICATE KEY UPDATE
  estado_pago = 1,
  modified = NOW();
