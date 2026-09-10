import { pool } from "../db/db.js";
import {
  isAfiliado,
  excelRowNumber,
} from "../utils/employeeImportValidation.js";

const statementsModel = {
  getAll: async () => {
    const query = `
    SELECT
  dj.*,
  e.nombre AS nombre_empresa,
  e.cuit AS cuit_empresa
FROM
  declaraciones_juradas dj
INNER JOIN
  empresas e ON dj.empresa_id = e.id
INNER JOIN (
  SELECT
    empresa_id,
    mes,
    year,
    MAX(rectificada) AS max_rectificada
  FROM
    declaraciones_juradas
  GROUP BY
    empresa_id, mes, year
) AS max_dj ON dj.empresa_id = max_dj.empresa_id
  AND dj.mes = max_dj.mes
  AND dj.year = max_dj.year
  AND dj.rectificada = max_dj.max_rectificada
ORDER BY
  dj.id DESC;
    `;
    const [results] = await pool.query(query);
    return results;
  },

  getOne: async (id) => {
    const query = `
      SELECT dj.*, e.nombre AS nombre_empresa, e.cuit AS cuit_empresa
      FROM declaraciones_juradas dj
      INNER JOIN empresas e ON dj.empresa_id = e.id
      WHERE dj.id = ?
    `;
    const [result] = await pool.query(query, id);
    return result[0];
  },

  getInfo: async (idEmpresa, idDeclaracion) => {
    // Cabecera de la declaración. Los contadores salen de `sueldos` (la foto de
    // ESA declaración), NO del padrón vigente de la empresa: antes esta query
    // entraba por `contratos ... deleted IS NULL`, así que devolvía los
    // empleados/afiliados que la empresa tiene HOY. En una declaración vieja o
    // rectificada eso no tiene nada que ver con lo declarado, y si la empresa
    // se quedaba sin contratos vigentes la query no devolvía ninguna fila y la
    // cabecera entera venía vacía.
    //
    // Los dos contadores repiten el MISMO criterio que la nómina de abajo
    // (join a contratos con la empresa de la declaración) para que cabecera y
    // tabla siempre cierren: hay ~800 declaraciones históricas con filas de
    // `sueldos` colgando de un contrato de otra empresa —el paso 5 del flujo de
    // carga busca el contrato por CUIL sin filtrar por empresa_id— y esas filas
    // no se listan en la nómina.
    //
    // `empresas` va con LEFT JOIN a propósito: hay declaraciones migradas cuya
    // empresa_id no existe en `empresas` (la base no tiene foreign keys). Con
    // INNER JOIN esas declaraciones dejaban de abrirse; así se muestran con
    // nombre_empresa en null en vez de romper la pantalla.
    const query = `SELECT
    d.id,
    e.nombre AS nombre_empresa,
    (SELECT COUNT(*)
       FROM sueldos s
       INNER JOIN contratos c ON c.id = s.contrato_id
      WHERE s.declaraciones_jurada_id = d.id
        AND c.empresa_id = d.empresa_id) AS cantidad_empleados_declaracion,
    -- Afiliados CONGELADOS de la declaración (sueldos.sindicato_activo).
    -- empleados.sindicato_activo es el estado global de HOY: cada carga lo
    -- pisa, así que una rectificación sin afiliados borraba los afiliados de
    -- todas las declaraciones anteriores del mismo empleado.
    (SELECT COUNT(*)
       FROM sueldos s
       INNER JOIN contratos c ON c.id = s.contrato_id
       INNER JOIN empleados emp ON emp.id = c.empleado_id
      WHERE s.declaraciones_jurada_id = d.id
        AND c.empresa_id = d.empresa_id
        AND COALESCE(s.sindicato_activo, emp.sindicato_activo) = 1) AS cantidad_afiliados_declaracion,
    d.year,
    d.mes,
    -- Fecha en que se CARGÓ la declaración. Determina qué fórmula del aporte
    -- solidario aplica al mostrarla (ver shared/utils/aportes.ts). NO usar
    -- mes/year para eso: el período no dice cuándo se cargó la declaración.
    d.fecha AS fecha_carga,
    d.rectificada,
    d.vencimiento,
    d.fecha_pago,
    d.pago_parcial,
    d.subtotal,
    d.sueldo_basico,
    d.estado,
    d.ajuste
FROM
    declaraciones_juradas d
LEFT JOIN
    empresas e ON e.id = d.empresa_id
WHERE
    d.id = ?
    AND d.empresa_id = ?`;
    const [result] = await pool.query(query, [idDeclaracion, idEmpresa]);

    // Sin cabecera no hay declaración de esa empresa: devolvemos null para que
    // el controlador responda 404 en lugar de un objeto sin campos.
    if (!result.length) return null;

    const query2 = `SELECT
    CONCAT(u.apellido, ' ', u.nombre) AS nombre_completo,
    -- Afiliación CONGELADA del período (sueldos.sindicato_activo), NO el estado
    -- global de empleados: ese lo pisa cada carga/rectificación, así que al
    -- declarar a alguien como no afiliado la nómina de TODAS sus declaraciones
    -- anteriores pasaba a mostrar "No". El resumen sale del snapshot de
    -- auxiliar y no cambia, por eso resumen y nómina se contradecían: el
    -- resumen mostraba aporte sindical y ninguna fila lo tenía (y encima al
    -- ex afiliado se le calculaba aporte solidario, que no le corresponde).
    --
    -- El COALESCE es sólo para los datos migrados del sistema viejo: en 2021 y
    -- 2022 hay filas de sueldos con sindicato_activo en NULL (no existía el
    -- snapshot). Ahí no hay dato congelado que leer, así que se mantiene el
    -- comportamiento anterior (el flag global) en vez de degradarlas a "No".
    -- De 2023 en adelante no hay ni un NULL, así que el COALESCE nunca entra.
    CASE WHEN COALESCE(s.sindicato_activo, emp.sindicato_activo) = 1 THEN 'Sí' ELSE 'No' END AS afiliado,
    emp.cuil,
    s.sueldo_basico,
    -- Presentismo CONGELADO al cargar la DDJJ. Las declaraciones anteriores al
    -- cambio no tienen el dato (NULL) y muestran 0: es correcto, en ese momento
    -- el aporte se calculaba sólo sobre el básico de la categoría.
    COALESCE(s.presentismo, 0) AS presentismo,
    s.monto,
    s.remunerativo_adicional,
    s.adicional_norem AS suma_no_remunerativa,
    c2.nombre AS categoria,
    s.adicional,
    (s.sueldo_basico + s.remunerativo_adicional + s.adicional_norem + s.adicional) AS total_bruto
FROM 
    sueldos s
INNER JOIN 
    declaraciones_juradas d ON s.declaraciones_jurada_id = d.id
INNER JOIN 
    contratos c ON s.contrato_id = c.id
INNER JOIN 
    empleados emp ON c.empleado_id = emp.id
INNER JOIN 
    usuarios u ON emp.usuario_id = u.id
INNER JOIN 
    categorias c2 ON s.categoria_id = c2.id
WHERE 
    d.id = ?
    AND c.empresa_id = ?
    ORDER BY
    COALESCE(s.sindicato_activo, emp.sindicato_activo) DESC,
    u.apellido ASC;

`;

    const [result2] = await pool.query(query2, [idDeclaracion, idEmpresa]);

    // Desglose CONGELADO (snapshot) por concepto, tomado de la tabla auxiliar
    // al momento en que se cargó/rectificó la declaración. Es la fuente de
    // verdad del desglose FAS / Solidario / Sindical: NO se recalcula en vivo,
    // así los valores no cambian aunque cambien los básicos de categoría o la
    // fórmula. Si la declaración es legacy y no tiene fila en auxiliar, queda
    // null y el front cae al cálculo tradicional. Es el mismo dato que consume
    // el Panel de Pagos, por eso Panel y DDJJ coinciden.
    const queryAux = `SELECT fas, solidario, sindical, total FROM auxiliar WHERE id_declaracion = ? ORDER BY id DESC LIMIT 1`;
    const [auxRows] = await pool.query(queryAux, [idDeclaracion]);
    const desglose = auxRows.length
      ? {
          fas: Number(auxRows[0].fas) || 0,
          solidario: Number(auxRows[0].solidario) || 0,
          sindical: Number(auxRows[0].sindical) || 0,
          total: Number(auxRows[0].total) || 0,
        }
      : null;

    return { ...result[0], empleados: result2, desglose };
  },

  getStatementsByCompany: async (idCompany) => {
    const query = `
      SELECT 
        dj.*,
        e.nombre AS nombre_empresa,
        e.cuit AS cuit_empresa
      FROM 
        declaraciones_juradas dj
      INNER JOIN 
        empresas e ON dj.empresa_id = e.id
      INNER JOIN (
        SELECT
          empresa_id,
          mes,
          year,
          MAX(rectificada) AS max_rectificada
        FROM
          declaraciones_juradas
        WHERE 
          empresa_id = ?
        GROUP BY
          empresa_id, mes, year
      ) AS max_dj ON dj.empresa_id = max_dj.empresa_id
        AND dj.mes = max_dj.mes
        AND dj.year = max_dj.year
        AND dj.rectificada = max_dj.max_rectificada
      WHERE 
        dj.empresa_id = ?
      ORDER BY
        dj.year DESC,
        dj.mes DESC,
        dj.modified DESC;
    `;
    const [results] = await pool.query(query, [idCompany, idCompany]);
    return results;
  },

  getHistory: async (idEmpresa, year, month) => {
    const query = `
      SELECT dj.*, e.nombre AS nombre_empresa, e.cuit AS cuit_empresa
      FROM declaraciones_juradas dj
      INNER JOIN empresas e ON dj.empresa_id = e.id
      WHERE dj.empresa_id = ? AND dj.year = ? AND dj.mes = ?
      ORDER BY dj.modified DESC
    `;
    const [results] = await pool.query(query, [idEmpresa, year, month]);
    return results;
  },

  // statementsModel.js - Método getDebtorCompanies
  getDebtorCompanies: async () => {
    const query = `
    SELECT 
    dj.empresa_id, 
    e.nombre, 
    e.cuit, 
    SUM(dj.importe) AS total_deuda
    FROM declaraciones_juradas dj
    JOIN empresas e ON dj.empresa_id = e.id
    WHERE dj.estado <> 1 
    AND dj.estado <> 3 
    AND e.estado = 'Activo'
    AND dj.mes >= 1
    AND dj.year >= 2025
    GROUP BY dj.empresa_id, e.nombre, e.cuit
    `;
    console.log("Ejecutando query de empresas deudoras...");
    const [results] = await pool.query(query);
    console.log("Resultados obtenidos:", results);
    return results;
  },

  changeState: async (id, state, partial_payment) => {
    let query;
    let params;

    // En caso que el estado sea 1, actualizar fecha_pago con la fecha actual y poner pago_parcial en NULL
    if (state === "1") {
      query = `
        UPDATE declaraciones_juradas
        SET estado = ?, pago_parcial = NULL
        WHERE id = ?
      `;
      params = [state, id];
    } else if (state === "2") {
      query = `
        UPDATE declaraciones_juradas
        SET estado = ?, pago_parcial = ?
        WHERE id = ?
      `;
      params = [state, partial_payment, id];
    } else if (state === "0" || state === "3") {
      query = `
        UPDATE declaraciones_juradas
        SET estado = ?, pago_parcial = NULL, fecha_pago = NULL
        WHERE id = ?
      `;
      params = [state, id];
    } else {
      query = `
        UPDATE declaraciones_juradas
        SET estado = ?
        WHERE id = ?
      `;
      params = [state, id];
    }

    const [result] = await pool.query(query, params);
    return result;
  },

  changeDatePayment: async (id, date) => {
    // Consulta para obtener el porcentaje de la tasa
    const queryTasa = `SELECT porcentaje FROM tasa`;
    const [resultTasa] = await pool.query(queryTasa);
    const porcentaje = parseFloat(resultTasa[0].porcentaje);

    // Consulta para obtener los datos de la declaración jurada
    const queryDatoDeclaracion = `SELECT subtotal, mes FROM declaraciones_juradas WHERE id = ?`;
    const [resultDatoDeclaracion] = await pool.query(queryDatoDeclaracion, id);
    const subtotal = parseFloat(resultDatoDeclaracion[0].subtotal);
    const mes = resultDatoDeclaracion[0].mes;

    // Calculamos el último día del mes de la declaración jurada (fecha de vencimiento original)
    const vencimientoOriginal = new Date(new Date().getFullYear(), mes + 1, 0); // último día del mes
    console.log(vencimientoOriginal);

    // Pasamos la fecha que envía el usuario a un objeto Date
    const datePayment = new Date(date);
    datePayment.setDate(datePayment.getDate() + 1);

    let diffDays = 0;
    let interesesRedondeado = 0;
    let importe = subtotal;

    // Verificamos si la fecha de pago está después de la fecha de vencimiento original
    if (datePayment > vencimientoOriginal) {
      // Calculamos la diferencia de días entre la fecha de vencimiento original y la fecha de pago
      const diffTime = Math.abs(datePayment - vencimientoOriginal);
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

      // Calculamos los intereses basados en los días de retraso
      const intereses = (subtotal * porcentaje * diffDays) / 100;

      // Redondear a dos decimales
      interesesRedondeado = parseFloat(intereses.toFixed(2));
      importe = parseFloat((subtotal + interesesRedondeado).toFixed(2));

      console.log("Se pasó de la fecha de vencimiento en:", diffDays, "días");
      console.log("Intereses calculados:", interesesRedondeado);
    } else {
      console.log("La fecha de pago está dentro del plazo de vencimiento.");
    }

    console.log("Subtotal:", subtotal);
    console.log("Importe final:", importe);

    // const datePaymentPlusOne = new Date(datePayment);
    // datePaymentPlusOne.setDate(datePaymentPlusOne.getDate() + 1);

    // Actualizamos la base de datos con los nuevos valores
    const queryUpdate = `UPDATE declaraciones_juradas SET vencimiento = ?, importe = ?, interes = ?, fecha_pago = ? WHERE id = ?`;
    const [result] = await pool.query(queryUpdate, [
      vencimientoOriginal, // Sumar un día a la fecha de pago
      importe,
      interesesRedondeado,
      datePayment,
      id,
    ]);

    return result;
  },

  changeExpiration: async (id, expiration) => {
    const query = `UPDATE declaraciones_juradas SET vencimiento = ? WHERE id = ?`;
    const [result] = await pool.query(query, [expiration, id]);
    return result;
  },

  rectify: async (employees, companyId, statementId, year, month) => {
    // Inicializamos la transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Si no hay empleados para rectificar, no tocamos contratos ni creamos nueva DJ
      if (!employees || employees.length === 0) {
        console.log(
          "rectify: no se recibieron empleados, se mantienen contratos existentes y no se crea nueva declaración."
        );
        await connection.commit();
        return { status: "NO_EMPLOYEES" };
      }

      // Hacemos una query para poner el campo deleted a todos los contratos activos de esa empresa en este momento
      const queryDeleteEmployees = `UPDATE contratos SET deleted = NOW() WHERE empresa_id = ? AND deleted IS NULL;`;
      await connection.query(queryDeleteEmployees, [companyId]);

      let amount = 0;
      // Recorremos cada empleado dentro del array de employees
      for (const [index, employee] of employees.entries()) {
        try {
          const query = `SELECT id, usuario_id, cuil, categoria_id, sindicato_activo FROM empleados WHERE cuil = ? ORDER BY id DESC LIMIT 1`;
          const [results] = await connection.query(query, [employee.cuil]);

          // Buscamos el id y el sueldo basico de la categoria, lo vamos a usar encuentre o no encuentre el empleado
          const queryCategoryId = `SELECT id FROM categorias WHERE nombre = ?`;
          const [resultsCategoryId] = await connection.query(queryCategoryId, [
            employee.categora,
          ]);
          if (!resultsCategoryId.length) {
            throw new Error(
              `Fila ${excelRowNumber(index)}: la categoría "${
                employee.categora
              }" no existe en el sistema (empleado ${employee.nombre} ${
                employee.apellido
              }, CUIL ${employee.cuil}).`
            );
          }
          const categoryId = resultsCategoryId[0].id;

          //Si el empleado no existe en la base de datos, lo agregamos
          if (results.length === 0) {
            // Para insertar primero va a ser necesario obtener el ultimo id de la tabla usuarios
            const queryLastId = `SELECT MAX(id) as lastId FROM usuarios`;
            const [resultsLastId] = await connection.query(queryLastId);
            const lastIdUser = resultsLastId[0].lastId;

            // Insertamos el usuario
            // email y password son NOT NULL sin default: se explicitan en ''
            // (es el valor que la base ya tiene en los empleados creados por
            // esta vía). Sin esto la carga falla si MySQL corre en modo
            // estricto, y antes ese fallo se reportaba como éxito.
            const queryInsertUser = `INSERT INTO usuarios (id, nombre, apellido, email, password, rol, estado, created, modified) VALUES (?, ?, ?, '', '', ?, ?, NOW(), NOW());`;

            await connection.query(queryInsertUser, [
              lastIdUser + 1,
              employee.nombre,
              employee.apellido,
              "empleado",
              1,
            ]);

            // Buscamos el ultimo id de la tabla empleados
            const queryLastIdEmployee = `SELECT MAX(id) as lastId FROM empleados`;
            const [resultsLastIdEmployee] = await connection.query(
              queryLastIdEmployee
            );
            const lastIdEmployee = resultsLastIdEmployee[0].lastId;

            // Insertamos el empleado
            const queryInsertEmployee = `INSERT INTO empleados (id, cuil, usuario_id, categoria_id, sindicato_activo) VALUES (?, ?, ?, ?, ?);`;

            await connection.query(queryInsertEmployee, [
              lastIdEmployee + 1,
              employee.cuil,
              lastIdUser + 1,
              categoryId,
              isAfiliado(employee.adherido_a_sindicato) ? 1 : 0,
            ]);

            // Buscamos el ultimo id de la tabla contratos
            const queryLastIdContract = `SELECT MAX(id) as lastId FROM contratos`;
            const [resultsLastIdContract] = await connection.query(
              queryLastIdContract
            );
            const lastIdContract = resultsLastIdContract[0].lastId;

            // Insertamos el contrato
            const queryInsertContract = `INSERT INTO contratos (id, empleado_id, empresa_id, estado, created, modified) VALUES (?, ?, ?, '1', NOW(), NOW());`;

            await connection.query(queryInsertContract, [
              lastIdContract + 1,
              lastIdEmployee + 1,
              companyId,
            ]);
          } else {
            // Aca tenemos que validar si los datos son diferentes o iguales a los que ya tenemos
            const result = results[0];

            // Actualizamos el empleado
            const queryUpdateEmployee = `UPDATE empleados SET categoria_id = ?, sindicato_activo = ? WHERE id = ?;`;
            await connection.query(queryUpdateEmployee, [
              categoryId,
              isAfiliado(employee.adherido_a_sindicato) ? 1 : 0,
              result.id,
            ]);

            // Actualizamos el usuario
            const queryUpdateUser = `UPDATE usuarios SET nombre = ?, apellido = ?, modified = NOW(), deleted = null WHERE id = ?;`;
            await connection.query(queryUpdateUser, [
              employee.nombre,
              employee.apellido,
              result.usuario_id,
            ]);

            // Crear un nuevo contrato asociando al empleado con la empresa
            const queryLastIdContract = `SELECT MAX(id) as lastId FROM contratos`;
            const [resultsLastIdContract] = await connection.query(
              queryLastIdContract
            );
            const lastIdContract = resultsLastIdContract[0].lastId;

            const queryInsertContract = `INSERT INTO contratos (id, empleado_id, empresa_id, estado, created, modified) VALUES (?, ?, ?, '1', NOW(), NOW());`;

            await connection.query(queryInsertContract, [
              lastIdContract + 1,
              result.id,
              companyId,
            ]);
          }
        } catch (error) {
          console.error(
            `Error al registrar el empleado ${employee.nombre} ${employee.apellido} (fila ${excelRowNumber(
              index
            )}):`,
            error
          );
          throw error;
        }
      }

      // Una vez que termino de recorrer todos los empleados, buscamos cual es el ultimo id que hay en declaraciones juradas
      const queryLastIdDeclaration = `SELECT MAX(id) as lastId FROM declaraciones_juradas`;
      const [resultsLastIdDeclaration] = await connection.query(
        queryLastIdDeclaration
      );
      const lastIdDeclaration = resultsLastIdDeclaration[0].lastId;

      let monthDeclaration;
      let yearDeclaration;
      let vencimiento;
      let rectificada;
      // Ya que esto es una rectificacion tenemos que insertar dentro de declaracion jurada el mismo mes y anio que la recibimos el id
      const queryGetMonthAndYear = `SELECT mes, year,vencimiento,rectificada FROM declaraciones_juradas WHERE id = ?`;
      const [resultMonthAndYear] = await connection.query(
        queryGetMonthAndYear,
        statementId
      );
      // query para cambiar el estado de la declaracion jurada ya rectificada a 3
      const queryChangeState = `UPDATE declaraciones_juradas SET estado = 3 WHERE id = ?`;
      await connection.query(queryChangeState, [statementId]);

      monthDeclaration = resultMonthAndYear[0].mes;
      yearDeclaration = resultMonthAndYear[0].year;
      vencimiento = resultMonthAndYear[0].vencimiento;
      rectificada = resultMonthAndYear[0].rectificada + 1;

      console.log("Esta es una declaracion que se va a rectificar");
      console.log(monthDeclaration);
      console.log(yearDeclaration);
      console.log(vencimiento);
      console.log(rectificada);

      const sueldobasico = `SELECT sueldo_basico FROM categorias WHERE id = 1`;
      const [resultsSueldoBasico] = await connection.query(sueldobasico);
      const sueldoBasicoCategoriaGeneral = resultsSueldoBasico[0].sueldo_basico;

      // Insertamos una nueva declaracion jurada
      const queryInsertDeclaration = `
    INSERT INTO declaraciones_juradas (
      id, fecha, empresa_id, mes, year, rectificada,
      vencimiento, importe, sueldo_basico, 
      created, modified
    )
    VALUES (?, NOW(), ?, ?, ?, ?, ?,?, ?, NOW(), NOW());
  `;

      await connection.query(queryInsertDeclaration, [
        lastIdDeclaration + 1,
        companyId,
        monthDeclaration,
        yearDeclaration,
        rectificada,
        vencimiento,
        0,
        sueldoBasicoCategoriaGeneral,
      ]);

      let fasTotal = 0;
      let solidarioTotal = 0;
      let sindicalTotal = 0;
      let contadorPersonas = 0;

      // Ahora registramos datos en la tabla sueldos
      for (const [index, employee] of employees.entries()) {
        try {
          // Primero buscar el id del contrato de cada empleado
          const queryContractId = `SELECT id FROM contratos WHERE empleado_id = ( SELECT id FROM empleados WHERE cuil = ? ORDER BY id DESC LIMIT 1 ) ORDER BY id DESC LIMIT 1;`;
          const [resultsContractId] = await connection.query(queryContractId, [
            employee.cuil,
          ]);
          if (!resultsContractId.length) {
            throw new Error(
              `Fila ${excelRowNumber(index)}: no se pudo registrar el contrato de ${
                employee.nombre
              } ${employee.apellido} (CUIL ${employee.cuil}).`
            );
          }
          const contractId = resultsContractId[0].id;

          // Ahora que tenemos el id del contrato de la persona insertamos en sueldos
          const queryLastIdSalary = `SELECT MAX(id) as lastId FROM sueldos`;
          const [resultsLastIdSalary] = await connection.query(
            queryLastIdSalary
          );
          const lastIdSalary = resultsLastIdSalary[0].lastId;

          const queryCategoryId = `SELECT id,sueldo_basico,presentismo FROM categorias WHERE nombre = ?`;
          const [resultsCategoryId] = await connection.query(queryCategoryId, [
            employee.categora,
          ]);
          if (!resultsCategoryId || resultsCategoryId.length === 0) {
            throw new Error(
              `Fila ${excelRowNumber(index)}: la categoría "${
                employee.categora
              }" no existe en el sistema (empleado ${employee.nombre} ${
                employee.apellido
              }, CUIL ${employee.cuil}).`
            );
          }
          const categoryId = resultsCategoryId[0].id;
          const categorySueldoBasico = resultsCategoryId[0].sueldo_basico;
          // Presentismo vigente de la categoría. NULL (categoría sin monto
          // cargado) => 0, con lo cual el aporte queda como antes del cambio.
          const categoryPresentismo =
            Number(resultsCategoryId[0].presentismo) || 0;

          // Convertimos los valores a números y nos aseguramos que sean válidos
          const sueldoBasico = Number(employee.sueldo_bsico) || 0;
          const adicionales = Number(employee.adicionales) || 0;
          const sumaNoRemunerativa = Number(employee.suma_no_remunerativa) || 0;
          const remunerativoAdicional = Number(employee.ad_remunerativo) || 0;
          const esAfiliado = isAfiliado(employee.adherido_a_sindicato);

          // Calculamos el FAS (1% del sueldo básico de la categoría 1)
          const fas = sueldoBasicoCategoriaGeneral * 0.01;
          fasTotal += fas;

          // Variable para almacenar el aporte (sindicato o solidario)
          let aportes = 0;

          // Calculamos el aporte según corresponda
          if (esAfiliado) {
            // Si es adherente: 3% del (sueldo básico + adicionales)
            aportes = (sueldoBasico + adicionales + sumaNoRemunerativa + remunerativoAdicional) * 0.03;
            sindicalTotal += aportes;
          } else {
            // Aporte solidario (no afiliados): 2% FIJO de (sueldo básico +
            // presentismo) de la CATEGORÍA, tomados del sistema (tabla
            // categorias). No depende del sueldo real del empleado ni de
            // adicionales/sumas no remunerativas, ni de lo que declare la
            // empresa: por eso el presentismo se configura en Categorías y NO
            // viene en el Excel. Si la categoría no tiene presentismo cargado
            // el término suma 0 y el aporte queda como antes del cambio.
            aportes =
              (Number(categorySueldoBasico) + categoryPresentismo) * 0.02;
            solidarioTotal += aportes;
          }

          // Se congela el presentismo en la fila de sueldos, igual que el sueldo
          // básico DE LA CATEGORÍA: el histórico se lee, no se recalcula.
          // OJO: sueldo_basico = básico de la CATEGORÍA; el sueldo que carga la
          // empresa en el Excel va en `monto`. El aporte solidario NUNCA se
          // calcula sobre `monto`.
          const queryInsertSalary = `INSERT INTO sueldos (id, contrato_id, declaraciones_jurada_id,adicional, sueldo_basico, presentismo, categoria_id, sindicato_activo, monto, adicional_norem, remunerativo_adicional, created, modified) VALUES (?, ?, ?, ?, ?, ? , ?, ?, ?, ?, ?, now(), now());`;
          await connection.query(queryInsertSalary, [
            lastIdSalary + 1,
            contractId,
            lastIdDeclaration + 1,
            adicionales,
            categorySueldoBasico,
            categoryPresentismo,
            categoryId,
            esAfiliado ? 1 : 0,
            employee.sueldo_bsico,
            employee.suma_no_remunerativa || 0,
            employee.ad_remunerativo || 0
          ]);

          // Sumamos al monto total tanto el FAS como los aportes
          amount += fas + aportes;
          contadorPersonas++;
        } catch (error) {
          console.error(
            `Error al calcular los aportes de ${employee.nombre} ${employee.apellido} (fila ${excelRowNumber(
              index
            )}):`,
            error
          );
          throw error;
        }
      }

      const lastAuxiliar = `SELECT MAX(id) as lastId FROM auxiliar`;
      const [resultsLastAuxiliar] = await connection.query(lastAuxiliar);
      const lastIdAuxiliar = resultsLastAuxiliar[0].lastId;

      const queryAuxiliar = `INSERT INTO auxiliar (id,id_declaracion, id_empresa, fas, solidario, sindical, total, fecha) VALUES (?,?, ?, ?, ?, ?, ?, NOW());`;
      await connection.query(queryAuxiliar, [
        lastIdAuxiliar + 1,
        lastIdDeclaration + 1,
        Number(companyId),
        fasTotal,
        solidarioTotal,
        sindicalTotal,
        amount,
      ]);

      const finalAmount = Number(amount.toFixed(2));

      // Actualizamos el importe de la declaracion jurada
      const queryUpdateDeclaration = `
        UPDATE declaraciones_juradas 
        SET subtotal = ?, 
            interes = 0, 
            importe = ? 
        WHERE id = ?;
      `;

      await connection.query(queryUpdateDeclaration, [
        finalAmount,
        finalAmount,
        lastIdDeclaration + 1,
      ]);

      // Commit de la transacción
      await connection.commit();
      console.log("Transacción completada con éxito.");

      return {
        status: "OK",
        declaracionId: lastIdDeclaration + 1,
        empleados: contadorPersonas,
        importe: finalAmount,
        rectificada,
      };
    } catch (error) {
      // Si ocurre un error, deshacemos la transacción.
      // IMPORTANTE: el error se vuelve a lanzar. Antes se logueaba y se
      // seguía, así que el controlador respondía "Declaración rectificada con
      // éxito" aunque el rollback había descartado todo.
      await connection.rollback();
      console.error(
        "Error en la transacción:",
        error,
        ". El error ocurrio en la empresa con id: ",
        companyId
      );
      throw error;
    } finally {
      // Cerramos la conexión
      connection.release();
    }
  },

  deleteOne: async (id) => {
    // Inicializamos la transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      //Primero tenemos que saber cual es la ultima declaracion de la empresa, sin contar la que estamos borrando
      const queryLastDeclaration = `SELECT MAX(id) as lastId FROM declaraciones_juradas WHERE empresa_id = (SELECT empresa_id FROM declaraciones_juradas WHERE id = ?) AND id != ?;`;

      const [resultsLastDeclaration] = await connection.query(
        queryLastDeclaration,
        [id, id]
      );
      const lastIdDeclaration = resultsLastDeclaration[0].lastId;

      //Ahora que sabemos cual es el id de la ultima declaracion sin contar la que estamos borrando vamos a reactivar los contratos anteriores. El id de los contratos esta en la tabla sueldos
      const queryContracts = `UPDATE contratos SET deleted = NULL WHERE id IN (SELECT contrato_id FROM sueldos WHERE declaraciones_jurada_id = ?);`;
      await connection.query(queryContracts, [lastIdDeclaration]);

      // ponemos deleted los contratos
      const queryDeleteContracts = `UPDATE contratos SET deleted = NOW() WHERE id IN (SELECT contrato_id FROM sueldos WHERE declaraciones_jurada_id = ?);`;
      await connection.query(queryDeleteContracts, [id]);

      // hacemos en la tabla sueldos los sueldos que tengan declaraciones_jurada_id = id
      const queryDeleteSalaries = `DELETE FROM sueldos WHERE declaraciones_jurada_id = ?;`;
      await connection.query(queryDeleteSalaries, [id]);

      // Despues lo que hacemos es borrar la declaracion jurada
      const queryDeleteDeclaration = `DELETE FROM declaraciones_juradas WHERE id = ?;`;
      await connection.query(queryDeleteDeclaration, [id]);

      // Commit de la transacción
      await connection.commit();
      console.log("Transacción completada con éxito.");

      return { status: "OK", declaracionId: Number(id) };
    } catch (error) {
      // Si ocurre un error, deshacemos la transacción y avisamos: antes se
      // logueaba `companyId` (variable inexistente acá) y el borrado fallido se
      // reportaba como exitoso.
      await connection.rollback();
      console.error(
        "Error al eliminar la declaración con id:",
        id,
        error
      );
      throw error;
    } finally {
      // La conexión quedaba tomada del pool en cada borrado.
      connection.release();
    }
  },

  getSalaries: async (idEmployee) => {
    // De aca me interesa la informacion basica del empleado pero sobre todo en que declaracion se presento su salario
    const query = `SELECT
    s.id,
    s.monto,
    s.remunerativo_adicional,
    s.adicional_norem AS suma_no_remunerativa,
    s.adicional,
    s.sueldo_basico,
    s.created,
    s.modified,
    d.id AS declaracion_id,
    d.year,
    d.mes,
    d.rectificada,
    d.vencimiento,
    d.fecha_pago,
    d.pago_parcial,
    d.subtotal
FROM
    sueldos s
INNER JOIN
    declaraciones_juradas d ON s.declaraciones_jurada_id = d.id
WHERE
    s.contrato_id = (SELECT id FROM contratos WHERE empleado_id = ? AND deleted IS NULL)
ORDER BY
    d.year DESC,
    d.mes DESC,
    d.rectificada DESC;`;
    const [results] = await pool.query(query, idEmployee);
    return results;
  },

  getLastDeclaration: async (idCompany) => {
    const query = `SELECT * FROM declaraciones_juradas WHERE empresa_id = ? ORDER BY id DESC LIMIT 1;`;
    const [results] = await pool.query(query, idCompany);
    return results[0];
  },

  getMissingStatements: async (companyId) => {
    // Obtener la primera declaración
    const queryFirstStatement = `
      SELECT mes, year 
      FROM declaraciones_juradas 
      WHERE empresa_id = ? 
      ORDER BY year ASC, mes ASC 
      LIMIT 1
    `;
    const [firstStatement] = await pool.query(queryFirstStatement, [companyId]);

    if (!firstStatement.length) {
      return {
        status: "NO_STATEMENTS",
        message: "No hay declaraciones juradas cargadas",
        data: [],
      };
    }

    // Obtener todas las declaraciones existentes
    const queryAllStatements = `
      SELECT DISTINCT mes, year
      FROM declaraciones_juradas
      WHERE empresa_id = ?
      ORDER BY year, mes
    `;
    const [existingStatements] = await pool.query(queryAllStatements, [
      companyId,
    ]);

    // Obtener fecha actual
    const currentDate = new Date();

    // Calcular el mes anterior
    let previousMonth = currentDate.getMonth(); // 0-11
    let yearOfPreviousMonth = currentDate.getFullYear();

    // Ajustar el año si el mes anterior corresponde al año anterior
    if (previousMonth === 0) {
      // Si estamos en enero (0)
      previousMonth = 12; // El mes anterior es diciembre
      yearOfPreviousMonth--; // Del año anterior
    }

    // Convertir declaraciones existentes a un Set para búsqueda eficiente
    const existingSet = new Set(
      existingStatements.map(
        (stmt) => `${stmt.year}-${String(stmt.mes).padStart(2, "0")}`
      )
    );

    const missingStatements = [];
    let checkYear = firstStatement[0].year;
    let checkMonth = firstStatement[0].mes;

    // Crear fecha de inicio para comparación
    let checkDate = new Date(checkYear, checkMonth - 1, 1);

    // Crear fecha límite (último día del mes anterior)
    const limitDate = new Date(yearOfPreviousMonth, previousMonth, 0);

    // Iterar desde la primera declaración hasta el mes anterior
    while (checkDate <= limitDate) {
      const yearMonth = `${checkDate.getFullYear()}-${String(
        checkDate.getMonth() + 1
      ).padStart(2, "0")}`;

      // Si no existe la declaración para este mes/año, agregarlo a los faltantes
      if (!existingSet.has(yearMonth)) {
        missingStatements.push({
          mes: checkDate.getMonth() + 1, // Convertir de 0-11 a 1-12
          year: checkDate.getFullYear(),
        });
      }

      // Avanzar al siguiente mes
      checkDate.setMonth(checkDate.getMonth() + 1);
    }

    // Ordenar los resultados por año y mes
    missingStatements.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.mes - b.mes;
    });

    // Si no hay declaraciones faltantes, significa que está al día
    if (missingStatements.length === 0) {
      return {
        status: "UP_TO_DATE",
        message: "Todas las declaraciones juradas están al día",
        data: [],
      };
    }

    // Si hay declaraciones faltantes, las retornamos
    return {
      status: "PENDING_STATEMENTS",
      message: "Hay declaraciones juradas pendientes",
      data: missingStatements,
    };
  },
};

export default statementsModel;
