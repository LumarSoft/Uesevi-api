-- Presentismo por categoría — aporte solidario sobre básico + presentismo (agosto 2026).
--
-- Regla nueva: el aporte solidario de los NO afiliados pasa a ser
--   2% × (categorias.sueldo_basico + categorias.presentismo)
-- en lugar de 2% × categorias.sueldo_basico. Sigue siendo FIJO por categoría:
-- no depende del sueldo real del empleado ni de lo que declare la empresa, por
-- eso el presentismo se configura acá y NO viene en el Excel de la declaración.
--
-- Ver docs/Uesevi_Cambios_Agosto2026_Presentismo_y_Panel_Pagos.md (Parte A).
--
-- NO incluye carga de datos: los montos los carga UESEVI desde Admin → Categorías.
-- Mientras una categoría tenga presentismo NULL, su aporte se calcula como
-- 2% × (básico + 0), es decir exactamente como venía funcionando.
--
-- ⚠️ SON DOS ALTER Y HAY QUE CORRER LOS DOS.
-- Correr sólo el primero deja la aplicación ROTA: la carga y la rectificación
-- de declaraciones juradas fallan con "Unknown column 'presentismo'". El
-- PASO 3 de abajo verifica que quedaron los dos aplicados — no dar la
-- migración por terminada hasta que devuelva las 4 filas.

-- ---------------------------------------------------------------------------
-- PASO 1 de 3 — Configuración del monto por categoría.
--   presentismo_futuro + fecha_vigencia_presentismo replican el mecanismo que
--   ya existe para los sueldos (sueldo_futuro / fecha_vigencia), promovido por
--   el cron categoryModel.updateNow().
-- ---------------------------------------------------------------------------
ALTER TABLE `categorias`
  ADD COLUMN `presentismo`                DECIMAL(10,2) DEFAULT NULL AFTER `sueldo_basico`,
  ADD COLUMN `presentismo_futuro`         DECIMAL(10,2) DEFAULT NULL AFTER `presentismo`,
  ADD COLUMN `fecha_vigencia_presentismo` DATETIME      DEFAULT NULL AFTER `presentismo_futuro`;

-- ---------------------------------------------------------------------------
-- PASO 2 de 3 — SNAPSHOT POR EMPLEADO. **NO SALTEAR.**
--   Igual que sueldos.sueldo_basico, el presentismo se congela al cargar o
--   rectificar la DDJJ. Esto es lo que evita tener que versionar la fórmula:
--     • DDJJ ya cargadas  -> presentismo NULL -> COALESCE(...,0) -> 2% × básico
--       = exactamente lo que muestran hoy. Lo histórico no se mueve.
--     • DDJJ nuevas       -> presentismo congelado -> si mañana cambia el monto
--       de la categoría, las declaraciones viejas siguen mostrando lo declarado.
--   Regla del proyecto: el desglose histórico se lee, no se recalcula.
-- ---------------------------------------------------------------------------
ALTER TABLE `sueldos`
  ADD COLUMN `presentismo` DECIMAL(10,2) DEFAULT NULL AFTER `sueldo_basico`;

-- ---------------------------------------------------------------------------
-- PASO 3 de 3 — Verificación. TIENE QUE DEVOLVER EXACTAMENTE 4 FILAS:
--   categorias.presentismo, categorias.presentismo_futuro,
--   categorias.fecha_vigencia_presentismo, sueldos.presentismo
-- Si devuelve menos, faltó correr algún ALTER de arriba.
-- (La API también avisa de esto en el log de arranque — ver db/schemaCheck.js.)
-- ---------------------------------------------------------------------------
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE()
   AND (
        (TABLE_NAME = 'categorias' AND COLUMN_NAME IN
          ('presentismo', 'presentismo_futuro', 'fecha_vigencia_presentismo'))
     OR (TABLE_NAME = 'sueldos' AND COLUMN_NAME = 'presentismo')
   )
 ORDER BY TABLE_NAME, COLUMN_NAME;
