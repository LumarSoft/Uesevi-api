# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
pnpm install            # el lockfile del repo es pnpm-lock.yaml (bcrypt necesita build: ver pnpm-workspace.yaml)
pnpm dev                # nodemon app.js  → http://localhost:3010
node app.js             # sin recarga
pnpm test               # node --test test/*.test.js
node --test test/ownership.test.js                    # un archivo
node --test --test-name-pattern "empresa" test/*.test.js  # un test puntual
pm2 start ecosystem.config.cjs                        # producción (app "uesevi_api")
```

No hay linter ni formatter configurados.

`.env` (no versionado) requiere: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`, `MAIL_USER`, `MAIL_PASS`.

**`CRONS_HABILITADOS=false` es obligatorio en cualquier instancia que no sea producción.** El cron del día 15 manda un mail real a todas las empresas de la base; dos instancias levantadas = mail duplicado a cada empresa (`cronJobs.js`).

`app.js` usa `findAvailablePort`: si 3010 está ocupado sube a 3011, 3012… El puerto real aparece en el log de arranque.

## Contexto

API del sindicato UESEVI (Rosario). El repo raíz es `/Users/marce/Desktop/Lumarsoft/Uesevi`, con `api/` (esto) y `front/` (Next.js + TypeScript + Zustand). Producción: front `https://uesevi.org.ar`, API `https://apiuesevi.jpmanagementgroup.com.ar`. `../SEGURIDAD_API_ROADMAP.md` documenta el plan de seguridad y el estado de los entornos.

Node ESM (`"type": "module"`) — todos los imports llevan extensión `.js`. Express 4 + MySQL con `mysql2/promise`. No hay ORM ni migraciones automáticas: los `.sql` de `db/migrations/` y `database_indexes.sql` se ejecutan a mano contra la base.

## Arquitectura

Tres capas estrictas, un archivo por dominio en cada una, con el mismo nombre base:

```
routes/xRoute.js  →  controllers/xController.js  →  models/xModel.js  →  pool (db/db.js)
```

- **routes**: declaran el path y encadenan los middlewares de seguridad. El comentario al final de cada línea documenta el endpoint.
- **controllers**: leen `req.body`/`req.params`, llaman al modelo y responden. Cada controller define sus propios helpers locales `response(res, data, statusCode, message)` y `handleError(res, error, statusCode, defaultMessage)` — no están compartidos, se copian entre archivos.
- **models**: objeto literal exportado por default con métodos `async` que hacen SQL crudo contra `pool`. Toda la lógica de negocio vive acá.

Formato de respuesta (respetarlo, el front lo consume así):

```js
{ ok: true,  status: "success", statusCode: 200, message, data }
{ ok: false, status: "error",   statusCode, message, error }   // message en el primer nivel
```

`req.pool` está inyectado por un middleware de `app.js`, pero los modelos importan `pool` directamente desde `db/db.js`.

## Seguridad y autorización

`app.js` divide las rutas en dos bloques con una **barrera** `app.use(authRequired)` en el medio:

1. **Antes de la barrera** (montaje público): `/login` (con rate limit 10/15min), `/news`, `/inquiries`, `/forms`, `/companies`, `/scales`. Estos routers protegen sus propios endpoints de escritura internamente con `authRequired` + `requireRole` por ruta.
2. **Después de la barrera**: todo lo demás exige `Bearer <token>`.

Roles: `"admin"` y `"empresa"` (columna `usuarios.rol`). El JWT (`loginModel.generateToken`, exp `1h`) lleva `{ id, email, rol, idEmpresa? }` — `idEmpresa` sólo para el rol `empresa`.

`middlewares/ownership.js` impide que una empresa toque datos de otra. **`admin` siempre pasa de largo.** Guards disponibles:

| Guard | Compara contra |
|---|---|
| `ownCompanyOrAdmin(param)` | `req.params[param]` vs `token.idEmpresa` |
| `ownBodyCompanyOrAdmin(field)` | `req.body[field]` — **debe ir después de multer** para que `req.body` exista |
| `ownEmployeeOrAdmin(param)` | `:param` es `usuarios.id`; verifica contrato vigente con esa empresa |
| `ownStatementOrAdmin(param)` / `ownBodyStatementOrAdmin(field)` | `declaraciones_juradas.empresa_id` |

El orden canónico en una ruta es `requireRole(...)` → `upload.none()/any()` → guard de ownership → controller.

`createOwnershipGuards(database)` recibe la base por inyección para poder testear sin MySQL; ése es el patrón de `test/ownership.test.js` (único test suite del repo).

## Modelo de datos

Esquema real de producción: `../DLL.sql`. Leerlo antes de escribir SQL nuevo — la base tiene particularidades que rompen cualquier supuesto de ORM:

- **No hay ni una sola FOREIGN KEY.** Nada garantiza integridad referencial: hay que chequearla en el código.
- **Casi nada es AUTO_INCREMENT.** Sólo `inscripcion` y `pagos_panel`. Todas las demás (`usuarios`, `empleados`, `contratos`, `declaraciones_juradas`, `sueldos`, `auxiliar`, `categorias`…) llevan `id int NOT NULL` a secas, por eso todos los modelos generan el id con `SELECT MAX(id) + 1` **dentro de la transacción**. Al agregar un INSERT hay que seguir ese patrón; dos cargas simultáneas de empresas distintas pueden colisionar.
- **`sueldos`, `usuarios` y `tasa` no tienen PRIMARY KEY** (`sueldos` tampoco tiene índices). Los `SELECT MAX(id)` sobre `sueldos` hacen full scan.
- **`auxiliar.fas`, `.solidario`, `.sindical` y `.total` son `int`**, mientras que `declaraciones_juradas.subtotal`/`importe` son `decimal(10,2)`. Los aportes se calculan con decimales y MySQL los redondea al guardarlos en `auxiliar`: **el desglose y el importe de la DDJJ no cierran al centavo**. Es esperado, no un bug a "arreglar" sin migrar la tabla.
- **`sueldos.year` y `sueldos.mes` existen pero los flujos de carga NO los completan** (quedan NULL). El período de una fila de `sueldos` se obtiene **siempre** por `declaraciones_juradas` vía `s.declaraciones_jurada_id`. Nunca filtrar por `sueldos.mes`/`sueldos.year`.
- Bajas lógicas por columna `deleted` (datetime), no `DELETE`. La excepción es `statementsModel.deleteOne`, que sí borra físicamente `sueldos` y la DDJJ.
- `phinxlog`, `sueldos.bkp`, `inscripcion_old` y las tablas `old_*` son restos del sistema anterior (CakePHP/Phinx). Las `old_*` (`old_empresas`, `old_declaraciones_juradas`, `old_contratos`, `old_sueldos`…) son sólo lectura y las sirven los routers `/old-*`.

### La cadena de entidades

```
usuarios ──1:1──> empleados ──1:N──> contratos ──1:N──> sueldos ──N:1──> declaraciones_juradas ──1:N──> auxiliar
 (rol,           (cuil,            (empleado_id,     (fila por           (empresa_id, mes,        (desglose
  nombre,         categoria_id,     empresa_id,       empleado y           year, rectificada,      FAS/sol/sind
  apellido)       sindicato_activo) deleted)          por DDJJ)            subtotal, importe)      congelado)
                                          │
                                    empresas.id
```

- **`usuarios` guarda nombre/apellido de TODOS**: empleados (`rol='empleado'`), empresas (`rol='empresa'`) y administradores (`rol='admin'`). `empresas.usuario_id` y `empleados.usuario_id` apuntan ahí.
- **La identidad del empleado es el CUIL** (`empleados.cuil`), no el id. Toda la carga busca por CUIL con `ORDER BY id DESC LIMIT 1` porque el CUIL no tiene UNIQUE y puede estar duplicado.
- **`empleados.categoria_id` y `empleados.sindicato_activo` son el estado ACTUAL y global del empleado**, no del período: cada carga los pisa. El valor histórico de cada mes vive congelado en `sueldos`.
- **`contratos` NO es un contrato laboral**: es el vínculo empleado↔empresa vigente, y **cada carga de DDJJ genera una fila nueva**. Los campos `puesto`, `sueldo`, `fecha_ingreso`, `estado_civil`, `hijos`, `cantidad_familiares` nunca se completan en este flujo (quedan NULL); sólo se setea `estado = '1'`. Un empleado con 20 declaraciones tiene 20 filas en `contratos`, 19 con `deleted` y una vigente.
- **`sueldos` es el snapshot congelado** de un empleado en una DDJJ. Nunca se recalcula: editar una categoría o un empleado NO cambia las declaraciones ya presentadas.

Columnas de `sueldos` — cuál es cuál importa mucho:

| Columna | Qué es |
|---|---|
| `monto` | El sueldo que **declaró la empresa** en el Excel (`sueldo_bsico` de la fila). |
| `sueldo_basico` | El básico **de la categoría** según el sistema al momento de la carga. **No** es el del Excel. |
| `presentismo` | El presentismo de la categoría al momento de la carga (congelado igual que el básico). |
| `adicional` | Columna "Adicionales" del Excel. |
| `adicional_norem` | Columna "Suma no remunerativa" del Excel. |
| `remunerativo_adicional` | Columna "Adicional remunerativo" del Excel. |
| `categoria_id`, `sindicato_activo` | Congelados del período; los vigentes están en `empleados`. |
| `year`, `mes`, `extra_contribution` | Sin uso en el flujo actual (NULL). |

### Estados

`declaraciones_juradas.estado`: `0` Pendiente · `1` Aprobado/Pagado · `2` Pago parcial (usa `pago_parcial`) · `3` Rechazado. **`rectify` también setea `estado = 3` en la declaración que reemplaza**, así que un 3 significa "rechazada o superada por una rectificativa".

`pagos_panel.estado_pago` (`0` Pendiente / `1` Pagado) es **independiente** de `declaraciones_juradas.estado`.

### DDJJ vigente

**La declaración vigente de un período es la de mayor `rectificada` para `(empresa_id, mes, year)`.** Rectificar nunca modifica la anterior: inserta una fila nueva con `rectificada + 1`. En producción **falta el UNIQUE** `(empresa_id, mes, year, rectificada)`, así que puede haber duplicados con la misma `rectificada`; las queries de listado (`getAll`, `VIGENTES_QUERY` del panel) están escritas para devolver exactamente una fila por período aun así — no simplificarlas.

`auxiliar` también puede tener varias filas por declaración: siempre `MAX(id)` / `ORDER BY id DESC LIMIT 1`.

## Flujo de carga de la DDJJ (leer completo antes de tocarlo)

Es el corazón del sistema. Dos entradas, con la **misma mecánica**:

| | Alta | Rectificación |
|---|---|---|
| Endpoint | `POST /employees/import` | `POST /statements/rectifications` |
| Modelo | `employeesModel.importEmployees` | `statementsModel.rectify` |
| Rol | `admin` o `empresa` (`ownBodyCompanyOrAdmin`) | ídem + `ownBodyStatementOrAdmin` |

Ambos reciben del front un array `employees` parseado desde un Excel, en una única transacción (`pool.getConnection()` + `beginTransaction`), con `rollback` y **re-throw** ante cualquier error. Ese re-throw es deliberado: antes se logueaba y se seguía, y la API respondía "cargado con éxito" sobre un rollback.

### Paso 0 — Validación previa (fuera de la transacción)

El controlador valida **todo el archivo antes de abrir la transacción** con `utils/employeeImportValidation.js` (`validateEmployees`), y devuelve `422` con la lista de errores fila por fila (numeradas como en el Excel vía `excelRowNumber` = índice + 2).

Las claves del payload llegan del Excel **sin acentos y con el nombre mutilado**: `categora` (Categoría), `sueldo_bsico` (Sueldo básico), más `nombre`, `apellido`, `cuil`, `adherido_a_sindicato`, `adicionales`, `suma_no_remunerativa`, `ad_remunerativo`.

Qué normaliza/valida:

- **CUIL**: se le sacan los no-dígitos (`normalizeCuil`), debe tener 11 y no repetirse en el archivo.
- **Categoría**: debe existir en `categorias` (comparación case-insensitive); se reemplaza por el nombre exacto del sistema, porque el modelo después busca `WHERE nombre = ?`.
- **Adherido a sindicato**: `isAfiliado()` acepta `si/sí/true/verdadero/1`; `no/false/falso/0` es no afiliado. Cualquier otra cosa es error de validación. **Usar siempre `isAfiliado`, nunca comparar contra `"si"` a mano**: los modelos lo hacían así y un Excel con `TRUE`/`1` quedaba silenciosamente como no afiliado (aporte solidario en lugar de sindical).
- **Importes**: `parseAmount` acepta formato argentino (`"$ 1.234,56"` → `1234.56`); vacío es `0`.

### Paso 1 — Guards de negocio (sólo en el alta)

`importEmployees` corta antes de tocar nada y devuelve un `status` de negocio (no lanza error); el controlador lo mapea a HTTP:

| status | Cuándo | HTTP |
|---|---|---|
| `NO_EMPLOYEES` | array vacío → commit sin cambios | 500 genérico |
| `DUPLICATE` | ya existe una DDJJ con `rectificada = 0` para `(empresa, mes, year)`. Anti doble submit; para corregir se usa Rectificar | 409 |
| `GAP` | falta la DDJJ del **mes inmediatamente anterior**. Sólo se valida ese mes, **no** todo el historial: hay empresas con huecos migrados que quedarían bloqueadas para siempre | 409 |
| `OK` | carga completa | 201 |

`rectify` **no** tiene estos guards (salvo `NO_EMPLOYEES`).

### Paso 2 — Se borra el padrón vigente de la empresa

```sql
UPDATE contratos SET deleted = NOW() WHERE empresa_id = ? AND deleted IS NULL;
```

Se dan de baja **todos** los contratos vigentes de la empresa. El padrón se reconstruye desde cero con lo que traiga el Excel: **quien no está en el archivo, queda dado de baja**. Es el comportamiento buscado (la DDJJ es la foto del mes), pero significa que un Excel incompleto borra empleados del padrón vigente. El histórico no se pierde: sigue en `sueldos` de las DDJJ anteriores.

### Paso 3 — Alta/actualización de cada empleado

Por cada fila, busca en `empleados` por CUIL (`ORDER BY id DESC LIMIT 1`):

**No existe** → crea la cadena completa:
1. `usuarios` (`rol='empleado'`, `estado=1`, y **`email` y `password` explícitos en `''`**: son `NOT NULL` sin default y en modo estricto la carga fallaba).
2. `empleados` (`cuil`, `usuario_id`, `categoria_id`, `sindicato_activo`).
3. `contratos` (`empleado_id`, `empresa_id`, `estado='1'`).

**Ya existe** → lo reutiliza y lo re-vincula:
1. `UPDATE empleados SET categoria_id, sindicato_activo` — pisa el estado global con lo del Excel.
2. `UPDATE usuarios SET nombre, apellido, deleted = NULL` — **resucita** a un empleado dado de baja.
3. Sólo en el alta: `UPDATE contratos SET deleted = NOW() WHERE empleado_id = ?` — da de baja los contratos del empleado **en TODAS las empresas**. Es lo que impone la regla de *un contrato activo por empleado en todo el sistema*: si una empresa declara un CUIL que otra tenía activo, se lo lleva. `rectify` **no** hace este paso (única diferencia real entre los dos flujos en esta etapa).
4. `INSERT` de un contrato nuevo para esta empresa.

### Paso 4 — Se crea la declaración

`INSERT INTO declaraciones_juradas` con `importe = 0` (se completa al final) y:

- **Alta**: `rectificada = 0`; `vencimiento` = último día del mes siguiente al período, en UTC (`new Date(Date.UTC(dueYear, dueMonth, 0, 23, 59, 59))`).
- **Rectificación**: copia `mes`, `year` y `vencimiento` de la declaración original, usa `rectificada + 1`, y marca la original con `estado = 3`.
- `sueldo_basico` = `SELECT sueldo_basico FROM categorias WHERE id = 1` — el básico de la **categoría general**, congelado en la DDJJ. Es la base del FAS.

### Paso 5 — `sueldos` y cálculo de aportes

Segundo recorrido sobre el mismo array. Por empleado busca su contrato con:

```sql
SELECT id FROM contratos
WHERE empleado_id = (SELECT id FROM empleados WHERE cuil = ? ORDER BY id DESC LIMIT 1)
ORDER BY id DESC LIMIT 1;
```

⚠️ Esa query **no filtra por `empresa_id` ni por `deleted`**: toma el contrato más nuevo de ese CUIL. Funciona porque el paso 3 acaba de crearlo para esta empresa, pero es frágil ante cargas concurrentes del mismo CUIL desde dos empresas.

Fórmulas (idénticas en `importEmployees` y `rectify` — si se cambia una hay que cambiar la otra):

- **FAS**, por empleado y siempre: `sueldo_basico de la categoría 1 × 0.01`.
- **Afiliado** (`sindicato_activo = 1`) → **aporte sindical**: `(sueldo_bsico + adicionales + suma_no_remunerativa + ad_remunerativo) × 0.03`, todo **declarado por la empresa** en el Excel.
- **No afiliado** → **aporte solidario**: `(categorias.sueldo_basico + categorias.presentismo) × 0.02`. Sale **del sistema**, de la categoría: no depende del sueldo real, ni de adicionales, ni de nada que declare la empresa. Por eso el presentismo se configura en Categorías y **no viene en el Excel**. Si la categoría no tiene presentismo cargado, el término suma 0.
- Total de la DDJJ = Σ (FAS + aporte) de todos los empleados.

El `INSERT INTO sueldos` congela `categorySueldoBasico` y `categoryPresentismo` en `sueldo_basico`/`presentismo`, y manda el sueldo del Excel a `monto`. **El aporte solidario NUNCA se calcula sobre `monto`.**

### Paso 6 — Cierre

1. `INSERT INTO auxiliar` con los acumulados `fas`, `solidario`, `sindical`, `total` (recordar: columnas `int`, se redondean).
2. `UPDATE declaraciones_juradas SET subtotal = ?, interes = 0, importe = ?` con el total redondeado a 2 decimales.
3. `commit`. Devuelve `{ status: "OK", declaracionId, empleados, importe }` (+ `rectificada` en la rectificación).

### Lectura de una DDJJ

`statementsModel.getInfo(idEmpresa, idDeclaracion)` es la referencia: arma la cabecera, la lista de empleados uniendo

```
sueldos s → declaraciones_juradas d (s.declaraciones_jurada_id) → contratos c (s.contrato_id) → empleados → usuarios → categorias
WHERE d.id = ? AND c.empresa_id = ?
```

y agrega `desglose` leyendo la última fila de `auxiliar` de esa declaración. **El desglose FAS/Solidario/Sindical no se recalcula nunca**: es el snapshot de `auxiliar`, y es el mismo dato que consume el Panel de Pagos — por eso Panel y DDJJ coinciden. Si una declaración legacy no tiene fila en `auxiliar`, `desglose` viene `null` y el front cae al cálculo tradicional.

Para leer el padrón de un período **no** se filtra por `contratos.deleted`: los contratos de ese mes ya están dados de baja. Se entra siempre por `sueldos.declaraciones_jurada_id`. `contratos.deleted IS NULL` sirve sólo para el padrón *vigente* (`employeesModel.getByEmpresa`).

### Borrado de una declaración (`statementsModel.deleteOne`, sólo admin)

Es la única operación destructiva del flujo, y hace algo no obvio: busca la declaración anterior de la empresa (`MAX(id)` excluyendo la que se borra), **reactiva** los contratos de esa declaración (`deleted = NULL`), da de baja los de la que se borra, y después `DELETE` de `sueldos` y de la DDJJ. Es decir: restaura el padrón al estado previo. Ojo: "anterior" es por `MAX(id)`, no por período, así que puede ser una rectificativa de otro mes.

Tras un borrado, el guard `GAP` del paso 1 bloquea a la empresa hasta que recargue el mes que quedó faltando.

### Alta/edición manual de empleados

`addEmployee`, `editEmployee` y `deleteEmployee` (`employeesModel`) operan **fuera** del flujo de DDJJ, sin transacción, y sólo tocan `usuarios`/`empleados`/`contratos`. Nunca modifican `sueldos`, así que **no alteran declaraciones ya presentadas**. `deleteEmployee` es un soft-delete sobre `usuarios`, no sobre el contrato. `addEmployee` tiene un `catch (error) {}` vacío que se traga los fallos.

### Categorías y valores programados

`categorias` guarda el valor vigente (`sueldo_basico`, `presentismo`) y el programado (`sueldo_futuro`, `presentismo_futuro`) con sus fechas (`fecha_vigencia`, `fecha_vigencia_presentismo`). Un cron diario (`cronJobs.js`, 00:00) promueve los vencidos llamando a `categoryModel.updateNow()` — **esa es la única implementación del UPDATE**; `cronJobs.js` tenía su propia copia que sólo contemplaba el sueldo y quedó desincronizada al agregar el presentismo. No volver a duplicarla.

Como los aportes se congelan al cargar, un cambio de categoría afecta sólo a las DDJJ que se carguen de ahí en adelante.

## Intereses y Panel de Pagos

`utils/interest.js` (`calcInterest`) centraliza el cálculo: vencimiento = último día del mes siguiente al período, se suma **+1 día** a la fecha de pago, y el interés es `subtotal × tasa.porcentaje × díasAtraso / 100`.

⚠️ `statementsModel.changeDatePayment` tiene su **propia copia** de la fórmula y calcula el vencimiento con `new Date(new Date().getFullYear(), mes + 1, 0)` — el **año actual**, no el de la declaración. Para períodos de años anteriores da distinto que `calcInterest`. Al tocar intereses, migrar hacia `calcInterest` en lugar de replicar la copia vieja.

### Panel de Pagos (`/payments-panel`, sólo admin)

Tabla companion `pagos_panel`: guarda overrides manuales y el estado de confirmación **sin tocar la DDJJ** (`UNIQUE` por `declaracion_jurada_id`). La propuesta sale de la DDJJ vigente + `auxiliar` + `tasa`; el valor final es `pagos_panel.<campo> ?? auxiliar.<campo>`. Estado: `Pagado` si `estado_pago = 1`, `Pendiente` si hay DDJJ vigente sin pagar, `Sin DDJJ` si no hay declaración del período. `aplica_interes` permite desactivar el interés de una fila.

## Archivos sueltos relevantes

- `multerconfig.js` — subidas a `uploads/` con nombre original y sufijo `-1`, `-2` ante colisión. `uploads/` se sirve estático y sin auth. Varias rutas usan `upload.none()` sólo para parsear multipart.
- `mailer.js` — transporter Gmail; `MAIL_PASS` es una *contraseña de aplicación* de 16 caracteres, no la de la cuenta.
- `db/migrations/*.sql`, `database_indexes.sql` — se aplican manualmente.
- `bcrypt_test.js`, `scripts/` — utilidades sueltas de diagnóstico, no forman parte del arranque.
- `README.md` — receta de 4 pasos para agregar un endpoint (ruta → controlador → modelo); el resto del archivo es un árbol de directorios autogenerado y obsoleto.

## Idioma

Código, comentarios, mensajes de error y de commit en **español**. Los comentarios del repo explican el *porqué* de decisiones no obvias (invariantes de queries, bugs históricos) — mantener ese estilo al tocar esas zonas.
