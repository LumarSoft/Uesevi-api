import { pool } from "../db/db.js";

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
    const query = `SELECT 
    d.id,
    e.nombre AS nombre_empresa,
    COUNT(DISTINCT emp.id) AS cantidad_empleados_declaracion,
    COUNT(DISTINCT CASE WHEN emp.sindicato_activo = 1 THEN emp.id END) AS cantidad_afiliados_declaracion,
    d.year,
    d.mes,
    d.rectificada,
    d.vencimiento,
    d.fecha_pago,
    d.pago_parcial,
    d.subtotal,
    d.sueldo_basico  
FROM 
    contratos c
INNER JOIN 
    empleados emp ON c.empleado_id = emp.id
INNER JOIN 
    usuarios u ON emp.usuario_id = u.id
INNER JOIN 
    empresas e ON c.empresa_id = e.id
INNER JOIN 
    declaraciones_juradas d ON d.id = ?
WHERE 
    c.empresa_id = ?
    AND c.deleted IS NULL`;
    const [result] = await pool.query(query, [idDeclaracion, idEmpresa]);

    const query2 = `SELECT 
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo, 
    CASE WHEN emp.sindicato_activo = 1 THEN 'Sí' ELSE 'No' END AS afiliado,
    emp.cuil,
    s.sueldo_basico,
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
    emp.sindicato_activo DESC,  
    u.apellido ASC;       

`;

    const [result2] = await pool.query(query2, [idDeclaracion, idEmpresa]);

    return { ...result[0], empleados: result2 };
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
        SET estado = ?, pago_parcial = NULL
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
      // Hacemos una query para poner el campo deleted a todos los empleados que estén en la empresa en este momento
      const queryDeleteEmployees = `UPDATE contratos SET deleted = NOW() WHERE empresa_id = ?;`;
      await connection.query(queryDeleteEmployees, [companyId]);

      // También lo hacemos en la tabla usuarios
      const queryDeleteUsers = `UPDATE usuarios SET deleted = NOW() WHERE id IN (SELECT usuario_id FROM empleados WHERE id IN (SELECT empleado_id FROM contratos WHERE empresa_id = ?));`;
      await connection.query(queryDeleteUsers, [companyId]);

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
          const categoryId = resultsCategoryId[0].id;

          //Si el empleado no existe en la base de datos, lo agregamos
          if (results.length === 0) {
            // Para insertar primero va a ser necesario obtener el ultimo id de la tabla usuarios
            const queryLastId = `SELECT MAX(id) as lastId FROM usuarios`;
            const [resultsLastId] = await connection.query(queryLastId);
            const lastIdUser = resultsLastId[0].lastId;

            // Insertamos el usuario
            const queryInsertUser = `INSERT INTO usuarios (id, nombre, apellido, rol, estado, created, modified) VALUES (?, ?, ?, ?, ?, NOW(), NOW());`;

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
              employee.adherido_a_sindicato === "Si" ? 1 : 0,
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
              employee.adherido_a_sindicato === "Si" ? 1 : 0,
              result.id,
            ]);

            // Actualizamos el usuario
            const queryUpdateUser = `UPDATE usuarios SET nombre = ?, apellido = ?, modified = NOW(), deleted = null WHERE id = ?;`;
            await connection.query(queryUpdateUser, [
              employee.nombre,
              employee.apellido,
              result.usuario_id,
            ]);

            // Tendriamos que ver si es necesario actualizar empresa_id en la tabla contratos
            const queryUpdateContract = `UPDATE contratos SET empresa_id = ?, modified = NOW(), deleted = null WHERE empleado_id = ?;`;
            await connection.query(queryUpdateContract, [companyId, result.id]);
          }
        } catch (error) {
          console.error(
            `Error en el primer for con el empleado: ${employee.nombre} ${index}:`,
            error
          );
          throw error;
        }
        //Primero validamos si el empleado no exiten en la base de datos
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

      // Ahora registramos datos en la tabla sueldos
      for (const [index, employee] of employees.entries()) {
        try {
          // Primero buscar el id del contrato de cada empleado
          const queryContractId = `SELECT id FROM contratos WHERE empleado_id = ( SELECT id FROM empleados WHERE cuil = ? ORDER BY id DESC LIMIT 1 ) ORDER BY id DESC LIMIT 1;`; // Correccion aca?;
          const [resultsContractId] = await connection.query(queryContractId, [
            employee.cuil,
          ]);
          const contractId = resultsContractId[0].id;

          // Ahora que tenemos el id del contrato de la persona insertamos en sueldos
          const queryLastIdSalary = `SELECT MAX(id) as lastId FROM sueldos`;
          const [resultsLastIdSalary] = await connection.query(
            queryLastIdSalary
          );
          const lastIdSalary = resultsLastIdSalary[0].lastId;

          const queryCategoryId = `SELECT id,sueldo_basico FROM categorias WHERE nombre = ?`;
          const [resultsCategoryId] = await connection.query(queryCategoryId, [
            employee.categora,
          ]);
          const categoryId = resultsCategoryId[0].id;
          const categorySueldoBasico = resultsCategoryId[0].sueldo_basico;

          const queryInsertSalary = `INSERT INTO sueldos (id, contrato_id, declaraciones_jurada_id,adicional, sueldo_basico, categoria_id, sindicato_activo, monto, created, modified) VALUES (?, ?, ?, ?, ? , ?, ?, ?, now(), now());`;
          await connection.query(queryInsertSalary, [
            lastIdSalary + 1,
            contractId,
            lastIdDeclaration + 1,
            Number(employee.adicionales) || 0,
            categorySueldoBasico,
            categoryId,
            employee.adherido_a_sindicato === "Si" ? 1 : 0,
            employee.sueldo_bsico,
          ]);

          // Convertimos los valores a números y nos aseguramos que sean válidos
          const sueldoBasico = Number(employee.sueldo_bsico) || 0;
          const adicionales = Number(employee.adicionales) || 0;

          // Calculamos el FAS (1% del sueldo básico de la categoría 1)
          const fas = sueldoBasicoCategoriaGeneral * 0.01;

          // Variable para almacenar el aporte (sindicato o solidario)
          let aportes = 0;

          // Calculamos el aporte según corresponda
          if (employee.adherido_a_sindicato === "Si") {
            // Si es adherente: 3% del (sueldo básico + adicionales)
            aportes = (sueldoBasico + adicionales) * 0.03;
          } else {
            // Si no es adherente: 2% del sueldo básico
            aportes = sueldoBasico * 0.02;
          }

          // Sumamos al monto total tanto el FAS como los aportes
          amount += fas + aportes;
        } catch (error) {
          console.error(
            `Error en el segundo for con el empleado: ${employee.nombre} ${index}:`,
            error
          );
          throw error;
        }
      }

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
    } catch (error) {
      // Si ocurre un error, deshacemos la transacción
      await connection.rollback();
      console.error(
        "Error en la transacción:",
        error,
        ". El error ocurrio en la empresa con id: ",
        companyId
      );
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
    } catch (error) {
      // Si ocurre un error, deshacemos la transacción
      await connection.rollback();
      console.error(
        "Error en la transacción:",
        error,
        ". El error ocurrio en la empresa con id: ",
        companyId
      );
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
};

export default statementsModel;
