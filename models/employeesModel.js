// models/empleadosModel.js
import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const employeesModel = {
  getAll: async () => {
    const query = `
    SELECT DISTINCT
    CONCAT(u.apellido, ', ', u.nombre) AS nombre,
    u.email,
    e.cuil, 
    e.categoria_id,
    c.created,
    c.empresa_id,
    em.nombre AS nombre_empresa,
    e.sindicato_activo 
FROM 
    usuarios u
INNER JOIN 
    empleados e ON u.id = e.usuario_id
INNER JOIN 
    contratos c ON e.id = c.empleado_id
INNER JOIN 
    empresas em ON c.empresa_id = em.id
WHERE 
    u.rol = 'empleado'
    AND c.estado = 1 
    AND c.deleted IS NULL;
    `;
    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  getByEmpresa: async (id) => {
    const query = `
    SELECT DISTINCT
      u.id,
      u.apellido,
      u.nombre,
      u.email,
      u.telefono,
      u.estado,
      e.id AS empleado_id,
      e.cuil, 
      e.domicilio,
      e.categoria_id,
      c.created,
      c.empresa_id,
      em.nombre AS nombre_empresa,
      e.sindicato_activo 
    FROM 
      usuarios u
    INNER JOIN 
      empleados e ON u.id = e.usuario_id
    INNER JOIN 
      contratos c ON e.id = c.empleado_id
    INNER JOIN 
      empresas em ON c.empresa_id = em.id
    WHERE 
      u.rol = 'empleado'
      AND c.deleted IS NULL
      AND u.deleted IS NULL
      AND c.empresa_id = ?;
    `;

    const [results] = await pool.query(query, [id]);
    console.log(results);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  getHistoricByEmpresa: async (id) => {
    const query = `
   SELECT 
      MIN(u.id) AS id,
      MIN(u.apellido) AS apellido,
      MIN(u.nombre) AS nombre,
      MIN(u.email) AS email,
      MIN(u.telefono) AS telefono,
      MIN(u.estado) AS estado,
      e.id AS empleado_id,
      e.cuil, 
      MIN(e.domicilio) AS domicilio,
      MIN(e.categoria_id) AS categoria_id,
      MIN(c.created) AS created,
      c.empresa_id,
      em.nombre AS nombre_empresa,
      e.sindicato_activo 
FROM 
      usuarios u
INNER JOIN 
      empleados e ON u.id = e.usuario_id
INNER JOIN 
      contratos c ON e.id = c.empleado_id
INNER JOIN 
      empresas em ON c.empresa_id = em.id
WHERE 
      u.rol = 'empleado'
      AND c.empresa_id = ?
GROUP BY 
      e.cuil
    `;

    const [results] = await pool.query(query, [id]);
    console.log(results);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  getOldByEmpresa: async (id) => {
    const query = `SELECT 
  CONCAT(apellido,', ',nombre) AS nombre, 
  id
FROM 
  old_usuarios 
WHERE 
  id IN (
    SELECT 
      old_usuario_id 
    FROM 
      old_empleados 
    WHERE 
      id IN (
        SELECT 
          DISTINCT old_empleado_id 
        FROM 
          old_contratos 
        WHERE 
          old_empresa_id = ?
      )
  );
`;
    const [results] = await pool.query(query, [id]);
    return results;
  },

  addEmployee: async (
    firstName,
    lastName,
    cuil,
    category,
    employmentStatus,
    unionAdhesion,
    email,
    companyId
  ) => {
    try {
      // obtener ultimo id de usuario
      const queryLastId = `SELECT MAX(id) as lastId FROM usuarios`;
      const [resultsLastId] = await pool.query(queryLastId);
      const lastId = resultsLastId[0].lastId;
      // insersion de usario
      const query = `
      INSERT INTO usuarios (id, nombre, apellido, email, created, estado, rol) VALUES (?, ?, ?, ?, NOW(), 1, 'empleado');`;
      const [results] = await pool.query(query, [
        lastId + 1,
        firstName,
        lastName,
        email,
      ]);

      // obtener ultimo id de empleado
      const queryLastIdEmployee = `SELECT MAX(id) as lastId FROM empleados LIMIT 1`;
      const [resultsLastIdEmployee] = await pool.query(queryLastIdEmployee);
      const lastIdEmployee = resultsLastIdEmployee[0].lastId;
      // insersion de empleado
      const queryEmployee = `INSERT INTO empleados (id, cuil, usuario_id, categoria_id, sindicato_activo) VALUES (?, ?, ?, ?, ?);`;
      const [resultsEmployee] = await pool.query(queryEmployee, [
        lastIdEmployee + 1,
        cuil,
        lastId + 1,
        category,
        unionAdhesion,
      ]);

      // insertar en tabla contratos
      const queryLastIdContract = `SELECT MAX(id) as lastId FROM contratos LIMIT 1`;
      const [resultsLastIdContract] = await pool.query(queryLastIdContract);
      const lastIdContract = resultsLastIdContract[0].lastId;

      const queryContract = `INSERT INTO contratos (id, empleado_id, empresa_id, estado, created) VALUES (?, ?, ?, ?, NOW());`;
      const [resultsContract] = await pool.query(queryContract, [
        lastIdContract + 1,
        lastIdEmployee + 1,
        Number(companyId),
        employmentStatus.toString(),
      ]);

      return [results, resultsEmployee, resultsContract];
    } catch (error) { }
  },

  editEmployee: async (
    id,
    firstName,
    lastName,
    cuil,
    category,
    employmentStatus,
    unionMembership
  ) => {
    // Primerop actualizamos en la tabla usuarios
    const query =
      "UPDATE usuarios SET nombre = ?, apellido = ?, estado = ? WHERE id = ?";
    await pool.query(query, [firstName, lastName, employmentStatus, id]);

    // Luego actualizamos en la tabla empleados

    const query2 =
      "UPDATE empleados SET cuil = ?, categoria_id = ?, sindicato_activo = ? WHERE usuario_id = ?";

    const [result] = await pool.query(query2, [
      cuil,
      category,
      unionMembership,
      id,
    ]);

    return result;
  },

  deleteEmployee: async (id) => {
    const query = "UPDATE usuarios SET deleted = NOW() WHERE id = ?";
    const [result] = await pool.query(query, [id]);
    return result;
  },

  importEmployees: async (employees, companyId, selectedMonth) => {
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

          if (results.length === 0) {
            //Si el empleado no existe en la base de datos, lo agregamos
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
              employee.adherido_a_sindicato.toLowerCase() === "si" ? 1 : 0, // Convertimos a minúsculas para asegurar la comparación
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
          }

          // Esto es lo que pasa cuando si se encuentra un empleado
          else {
            // Aca tenemos que validar si los datos son diferentes o iguales a los que ya tenemos
            const result = results[0];

            // Actualizamos el empleado
            const queryUpdateEmployee = `UPDATE empleados SET categoria_id = ?, sindicato_activo = ? WHERE id = ?;`;
            await connection.query(queryUpdateEmployee, [
              categoryId,
              employee.adherido_a_sindicato.toLowerCase() === "si" ? 1 : 0,
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
            `Error en el primer for con el empleado: ${employee.nombre} ${index}:`,
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

      // Buscamos el mes y el año de la ultima declaracion jurada
      const queryLastDeclaration = `SELECT mes, year FROM declaraciones_juradas WHERE empresa_id = ? ORDER BY created DESC LIMIT 1`;
      const [resultsLastDeclaration] = await connection.query(
        queryLastDeclaration,
        [companyId]
      );

      let lastDeclarationMonth;
      let lastDeclarationYear;

      if (resultsLastDeclaration.length === 0) {
        // Si no hay declaraciones previas, tomamos el mes anterior al actual
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // +1 porque getMonth() devuelve 0-11
        const currentYear = currentDate.getFullYear();

        // El mes de la declaración será el anterior al actual
        lastDeclarationMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        lastDeclarationYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      } else {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        // Si el año seleccionado es el actual o el anterior, lo usamos directamente
        lastDeclarationMonth = parseInt(selectedMonth);
        lastDeclarationYear = lastDeclarationMonth === 1 ? currentYear - 1 : currentYear;
      }

      const newDeclarationMonth =
        lastDeclarationMonth === 12 ? 1 : lastDeclarationMonth;
      const newDeclarationYear =
        lastDeclarationMonth === 12
          ? lastDeclarationYear + 1
          : lastDeclarationYear;

      const vencimientoMonth =
        newDeclarationMonth === 12 ? 1 : newDeclarationMonth + 1;
      const vencimientoYear =
        newDeclarationMonth === 12
          ? newDeclarationYear + 1
          : newDeclarationYear;

      const vencimientoDate = new Date(vencimientoYear, vencimientoMonth, 0);

      // Calculamos el último día del mes de la declaración
      console.log(`Fecha actual: ${new Date().toISOString()}`);
      //usar selectedMonth
      console.log(
        `Mes a declarar: ${newDeclarationMonth}, Año: ${newDeclarationYear}`
      );
      console.log(
        `Mes de vencimiento: ${vencimientoMonth}, Año: ${vencimientoYear}`
      );
      console.log(`Fecha de vencimiento: ${vencimientoDate.toISOString()}`);

      const sueldobasico = `SELECT sueldo_basico FROM categorias WHERE id = 1`;
      const [resultsSueldoBasico] = await connection.query(sueldobasico);
      const sueldoBasicoCategoriaGeneral = resultsSueldoBasico[0].sueldo_basico;

      // Insertamos una nueva declaracion jurada
      const queryInsertDeclaration = `
  INSERT INTO declaraciones_juradas (
    id, fecha, empresa_id, mes, year, 
    vencimiento, importe, sueldo_basico, 
    created, modified
  )
  VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, NOW(), NOW());
`;

      await connection.query(queryInsertDeclaration, [
        lastIdDeclaration + 1,
        companyId,
        newDeclarationMonth,
        newDeclarationYear,
        vencimientoDate,
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
            employee.adherido_a_sindicato.toLowerCase() === "si" ? 1 : 0,
            employee.sueldo_bsico,
          ]);

          // Convertimos los valores a números y nos aseguramos que sean válidos
          const sueldoBasico = Number(employee.sueldo_bsico) || 0;
          const adicionales = Number(employee.adicionales) || 0;

          // Calculamos el FAS (1% del sueldo básico de la categoría 1)
          const fas = sueldoBasicoCategoriaGeneral * 0.01;
          fasTotal += fas;

          // Variable para almacenar el aporte (sindicato o solidario)
          let aportes = 0;

          // Calculamos el aporte según corresponda
          if (employee.adherido_a_sindicato.toLowerCase() === "si") {
            // Si es adherente: 3% del (sueldo básico + adicionales)
            aportes = (sueldoBasico + adicionales) * 0.03;
            console.log(
              "Aportes sindicales de ",
              employee.nombre,
              ":",
              aportes
            );
            sindicalTotal += aportes;
          } else {
            // Si no es adherente: 2% del sueldo básico
            aportes = sueldoBasico * 0.02;
            console.log(
              "Aportes solidarios de ",
              employee.nombre,
              ":",
              aportes
            );
            solidarioTotal += aportes;
          }

          // Sumamos al monto total tanto el FAS como los aportes
          amount += fas + aportes;
          contadorPersonas++;
        } catch (error) {
          console.error(
            `Error en el segundo for con el empleado: ${employee.nombre} ${index}:`,
            error
          );
          throw error;
        }
      }

      console.log("Personas ANALIZADAS:", contadorPersonas);
      console.log("FAS total:", fasTotal);
      console.log("Aportes sindicales total:", sindicalTotal);
      console.log("Aportes solidarios total:", solidarioTotal);

      const queryAuxiliar = `INSERT INTO auxiliar (id_declaracion, id_empresa, fas, solidario, sindical, total, fecha) VALUES (?, ?, ?, ?, ?, ?, NOW());`;
      await connection.query(queryAuxiliar, [
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
};

export default employeesModel;
