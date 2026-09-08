# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

REST API of UESEVI (sindicato / obra social de Rosario). Express 4 + MySQL (mysql2), ESM (`"type": "module"`), no build step, no test suite. The front-end lives in a separate repo and talks to this API from `https://uesevi.org.ar` / `http://localhost:3000` (the CORS allowlist in `app.js`).

## Commands

```bash
pnpm install                 # pnpm-workspace.yaml exists (allowBuilds: bcrypt); npm also works
pnpm dev                     # nodemon app.js
node app.js                  # plain run
pm2 start ecosystem.config.cjs   # production (app name uesevi_api, logs in logs/)
node scripts/verificarCambiosAgosto.js   # read-only end-to-end check against the REAL db
```

`npm test` is not configured. There are no automated tests — verify changes by running the API and hitting the endpoints.

`.env` is required before anything starts (`db/config.js` and `mailer.js` read it):
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`, `MAIL_USER`, `MAIL_PASS` (Gmail *app password*, not the account password), optional `PORT` (default 3010) and `CRONS_HABILITADOS`.

`OPENAI_API_KEY` is optional but required by `/chatbot` (the admin assistant): without it the endpoint answers 503 and the rest of the API keeps working. `OPENAI_MODEL` overrides the model (default `gpt-5.6-luna`); the chatbot uses the OpenAI **Responses** API with `store: false`, so no conversation is retained on OpenAI's side. `POST /chatbot` also accepts an optional `archivo` (the DDJJ Excel an admin was forwarded): it uses its own **memory-storage** multer, never the shared `multerconfig.js` — that one writes into `uploads/`, which is served statically, and a payroll file must not end up public. `utils/chatbotExcel.js` runs it through the same `validateEmployees` as the real import so the diagnosis matches what the company would see.

**Always set `CRONS_HABILITADOS=false` outside production.** `cronJobs.js` mails every company in the database on the 15th of the month; two live instances = duplicate mail to every real company.

The port logic in `app.js` (`findAvailablePort`) auto-increments if the port is taken, so the server may not be on the port you expect — read the startup log.

## Layered structure

Every feature is the same three files, named after the same resource:

`routes/<x>Route.js` → `controllers/<x>Controller.js` → `models/<x>Model.js`

- **Route**: path, auth middlewares, multer, and a one-line trailing comment with the full URL. Registered in `app.js`.
- **Controller**: reads `req.body`/`req.params`, calls the model, formats the reply. Each controller defines its **own local copies** of `handleError(res, error, statusCode, message)` and `response(res, data, statusCode, message)` — copy that pattern rather than introducing a shared helper.
- **Model**: default-exports an object of async functions holding the raw SQL. Imports `pool` from `db/db.js` directly (the `req.pool` injected in `app.js` is legacy and mostly unused).

Response envelope, used everywhere including the auth middlewares:
```js
{ ok, status: "success"|"error", statusCode, message, data? , error? }
```

## Auth and authorization

`app.js` splits the router table in two: everything mounted **before** `app.use(authRequired)` is public (`/health`, `/login`, `/news`, `/inquiries`, `/forms`), everything after requires a Bearer token. The public routers re-apply `authRequired` per-route for their admin-only writes — when adding an endpoint to `newsRoute`, `formRoute` or `inquiriesRoute`, remember it is public by default.

- `middlewares/auth.js` — `authRequired` verifies the JWT into `req.user` (`{ id, email, rol, idEmpresa? }`, 1h expiry); `requireRole("admin")` gates admin actions.
- `middlewares/ownership.js` — `ownCompanyOrAdmin("idCompany")` lets `rol: "admin"` through and otherwise requires `req.user.idEmpresa` to match the route param. Any endpoint that takes a company id in the path must use it.
- Two roles matter: `admin` (staff) and `empresa` (company portal, logs in via `POST /login/company`, gets `idEmpresa` in the token). Passwords are bcrypt; legacy `$2y$` hashes are rewritten to `$2b$` before comparing.

## Conventions that will bite you

- **Multipart everywhere.** The front sends `FormData` even for plain JSON-shaped payloads, so most POST/PUT routes pass `upload.none()` (or `upload.any()`) from `multerconfig.js` just to populate `req.body`. Omitting it leaves `req.body` empty.
- **Manual primary keys.** The legacy schema has no `AUTO_INCREMENT` on most tables; models do `SELECT MAX(id)` then insert `lastId + 1`, inside a transaction (`pool.getConnection()` / `beginTransaction` / `rollback`). Follow the surrounding code rather than assuming inserted ids.
- **Spanish DB, English API.** Tables and columns are Spanish (`empresas`, `empleados`, `declaraciones_juradas`, `contratos`, `categorias`, `auxiliar`, `tasa`, `noticias`); routes, controllers and models are English. Comments and user-facing messages are in Spanish — keep writing them in Spanish.
- **Migrations are manual.** `db/migrations/*.sql` and `database_indexes.sql` are applied by hand against MySQL; there is no migration runner. Add a new dated `.sql` file and say it needs to be run.
- **Uploads** land in `uploads/` (served statically at `/uploads`, `helmet` is configured with `crossOriginResourcePolicy: cross-origin` so the front can load them). Filenames collide-and-suffix, they are not hashed.

## Database structure

MySQL, InnoDB, mostly `latin1`. Legacy schema inherited from a CakePHP/Phinx app (`phinxlog`, `id_viejo` columns everywhere, no `AUTO_INCREMENT` on the old tables). The full baseline dump is `uesevipr_uesevi.sql` (~70 MB — grep it with `awk '/^CREATE TABLE \`x\` \(/,/^\) ENGINE/'`, don't open it). Anything added after that dump lives in `db/migrations/*.sql`, applied by hand.

### Identity and actors

```
usuarios ──1:1── empresas        (empresas.usuario_id → usuarios.id, rol = "empresa")
usuarios ──1:1── empleados       (empleados.usuario_id → usuarios.id)
empleados ──1:N── contratos ──N:1── empresas
```

- `usuarios` — single login table for both roles. `rol` is `"admin"` or `"empresa"`; `estado`, `deleted` (soft delete), bcrypt `password`, plus legacy password-reset columns (`olvido_password`, `hash`, `caducidad`) that the current reset flow does not use (it keeps codes in an in-memory `Map` in `loginController`).
- `empresas` — `cuit`, `nombre`, `email_contacto` (used by the cron mailer), `estado` as a **string**: a new company self-registers as `'Pendiente'` and cannot log in until an admin approves it.
- `empleados` — identified by `cuil`; `sindicato_activo` marks affiliation, `categoria_id` is the default category.
- `contratos` — the employee↔company link, one active per employee (`estado`, `deleted`). Importing an employee into a new company **deactivates their contracts elsewhere**. `sueldos` rows point at `contrato_id`, not at the employee, so the contract is what ties a declared salary to a company.
- `categorias` — the salary scale. `sueldo_basico` / `presentismo` are the current values; `sueldo_futuro` + `fecha_vigencia` and `presentismo_futuro` + `fecha_vigencia_presentismo` hold scheduled changes that the daily cron promotes (`categoryModel.updateNow()`). **Category id 1 is the "categoría general"** whose `sueldo_basico` is the base of the FAS — it is hardcoded as `WHERE id = 1`.
- `tasa` — a single row, `porcentaje` = the *daily* late-payment rate.

### Declaraciones juradas (DDJJ) — the heart of the system

A DDJJ is one company's monthly sworn statement of its payroll. Everything else (debt, payments panel, dashboard) is derived from it.

```
declaraciones_juradas (1 per empresa+mes+year+rectificada)
   ├── sueldos     N rows — one per employee declared in that DDJJ
   ├── auxiliar    1 row  — frozen FAS / solidario / sindical breakdown
   └── pagos_panel 1 row  — manual payment overrides (only if touched by the panel)
```

**`declaraciones_juradas`**

| column | meaning |
|---|---|
| `empresa_id`, `mes` (1-12), `year` | the period |
| `rectificada` | correction counter — see below |
| `subtotal`, `interes`, `importe` | amount owed; `importe = subtotal + interes` |
| `vencimiento` | due date = last day of the **following** month |
| `fecha_pago`, `pago_parcial` | payment data loaded by an admin |
| `estado` | `0` pending · `1` approved/paid · `2` partial payment · `3` superseded by a rectification |
| `sueldo_basico` | snapshot of category 1's básico at load time |

**Rectifications — the single most important rule.** A correction never updates a row. `statementsModel.rectify` sets the old row to `estado = 3` and inserts a **new** row for the same `empresa_id/mes/year` with `rectificada + 1`. So a period has N rows and only one is current. Every read query must select the current one with the same idiom used throughout `statementsModel` / `paymentsPanelModel`:

```sql
INNER JOIN (
  SELECT empresa_id, mes, year, MAX(rectificada) AS max_rectificada
  FROM declaraciones_juradas GROUP BY empresa_id, mes, year
) mx ON mx.empresa_id = dj.empresa_id AND mx.mes = dj.mes
    AND mx.year = dj.year AND mx.max_rectificada = dj.rectificada
```

Forgetting this join is the classic bug here: duplicated months, wrong totals, a period showing two different states.

**`sueldos`** — one row per employee per DDJJ (`declaraciones_jurada_id`, note the singular/plural typo in the column name, + `contrato_id`). It is a **snapshot, never recalculated**:
- `monto` = the salary the company declared in the Excel.
- `sueldo_basico` = the **category's** básico at load time (not the declared one).
- `presentismo` = the category's presentismo at load time; NULL on pre-August-2026 rows, which `COALESCE(...,0)` turns back into the old formula.
- `adicional`, `adicional_norem`, `remunerativo_adicional`, `sindicato_activo`, `categoria_id`.

Because the historical breakdown is *read, not recomputed*, changing a category's amounts today never moves old declarations. Preserve that invariant.

**How the amount is computed** (identical in `employeesModel.importEmployees` for a new DDJJ and `statementsModel.rectify` for a correction — the two copies must stay in sync):

- **FAS**, per employee: `1% × categorias[id=1].sueldo_basico`. Same for everyone, affiliated or not.
- **Affiliated** (`sindicato_activo`): `3% × (sueldo declarado + adicionales + suma no remunerativa + adicional remunerativo)` → accumulates into `sindical`.
- **Not affiliated** (aporte solidario): `2% × (categoria.sueldo_basico + categoria.presentismo)` → accumulates into `solidario`. Fixed per category — it does **not** depend on the declared salary, which is why presentismo is configured in Admin → Categorías and is absent from the Excel.
- `importe = FAS total + sindical + solidario`.

**`auxiliar`** — companion of the DDJJ (`id_declaracion`, `id_empresa`, `fas`, `solidario`, `sindical`, `total`, `fecha`), written once when the DDJJ is created or rectified. It is the frozen breakdown shown in the DDJJ detail and consumed by the Panel de Pagos, which is why the two always agree. Legacy declarations have no `auxiliar` row: readers take `ORDER BY id DESC LIMIT 1` and fall back to `null`. *(Not present in the baseline dump; it already exists in the live database.)*

**Guards when loading a DDJJ** (`employeesModel.importEmployees`, returning a `status` string instead of throwing):
- `NO_EMPLOYEES` — nothing to declare.
- `DUPLICATE` — an original (`rectificada = 0`) already exists for the period; corrections must go through Rectificar.
- `GAP` — the **immediately previous** month has no declaration. Only the previous month is checked, never the whole history: companies migrated with older holes would be blocked forever.

**`pagos_panel`** (migration `2026_07_pagos_panel.sql`) — the Panel de Pagos companion, one row per DDJJ, `UNIQUE (declaracion_jurada_id)`. It stores *only* manual overrides (`importe_fas`, `importe_solidario`, `importe_sindical`, `importe_intereses`, `total`) where `NULL` means "use the value from `auxiliar`", plus `estado_pago` (0/1), `aplica_interes`, `observaciones` and `usuario_carga`. The DDJJ + `auxiliar` remain the source of truth for the proposal; the panel only records the confirmation and the adjustment. Confirming/unconfirming a payment syncs the DDJJ state, nothing else.
- `aplica_interes = 0` means "do not recompute interest when the payment date changes" — the default for already-confirmed/backfilled old declarations.
- **Interest has one implementation**: `utils/interest.js` `calcInterest()` (`subtotal × tasa.porcentaje × días de atraso / 100`, due date = last day of the following month, payment date +1 day). `statementsModel.changeDatePayment` and the panel both call it — do not re-derive the formula.

### Secondary tables

- `noticias` + `imagenes_noticias` + `noticia_videos` — CMS news; `cuerpo` is HTML, stripped with cheerio in the list endpoints.
- `inscripcion` — the public affiliation form (`/forms`, flat denormalized copy of the applicant's and company's data); `consultas` — the public contact form (`/inquiries`); `archivos` — generic file records; `estados` — a small lookup table.
- `old_*` (`old_declaraciones_juradas`, `old_empresas`, `old_contratos`, `old_empleados`, `old_sueldos`, `old_usuarios`, `old_pagos`, `old_categorias`) — read-only pre-migration archive, exposed through the `/old-*` routes. `sueldos.bkp`, `pagos` and `phinxlog` are dead weight; nothing in the code reads them.

## Adding an endpoint

1. Add the route to the matching `routes/*Route.js` (create the file and register it in `app.js` only for a genuinely new resource), with `requireRole` / `ownCompanyOrAdmin` and `upload.none()` as appropriate.
2. Add the controller method using the local `response` / `handleError` helpers.
3. Add the model method with the SQL; use a transaction if it writes more than one table.
