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

      console.log(
        lastIdContract + 1,
        lastIdEmployee + 1,
        Number(companyId),
        employmentStatus.toString()
      );

      const queryContract = `INSERT INTO contratos (id, empleado_id, empresa_id, estado, created) VALUES (?, ?, ?, ?, NOW());`;
      const [resultsContract] = await pool.query(queryContract, [
        lastIdContract + 1,
        lastIdEmployee + 1,
        Number(companyId),
        employmentStatus.toString(),
      ]);

      return [results, resultsEmployee, resultsContract];
    } catch (error) {}
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

  importEmployees: async (employees, companyId) => {
    // Inicializamos la transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Hacemos una query para poner el campo deleted a todos los empleados que esten en la empresa en este momento
      const queryDeleteEmployees = `UPDATE contratos SET deleted = NOW() WHERE empresa_id = ?;`;
      await connection.query(queryDeleteEmployees, [companyId]);

      // Tambien lo hacemos en la tabla usuarios
      const queryDeleteUsers = `UPDATE usuarios SET deleted = NOW() WHERE id IN (SELECT usuario_id FROM empleados WHERE id IN (SELECT empleado_id FROM contratos WHERE empresa_id = ?));`;
      await connection.query(queryDeleteUsers, [companyId]);

      let amount = 0;
      // Recorremos cada empleado dentro del array de employees
      for (const employee of employees) {
        //Primero validamos si el empleado no exiten en la base de datos
        const query = `SELECT id, usuario_id, cuil, categoria_id, sindicato_activo FROM empleados WHERE cuil = ?`;
        const [results] = await connection.query(query, [employee.cuil]);

        // Buscamos el id de la categoria, lo vamos a usar encuentre o no encuentre el empleado
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
      }

      // Una vez que termino de recorrer todos los empleados, buscamos cual es el ultimo id que hay en declaraciones juradas
      const queryLastIdDeclaration = `SELECT MAX(id) as lastId FROM declaraciones_juradas`;
      const [resultsLastIdDeclaration] = await connection.query(
        queryLastIdDeclaration
      );
      const lastIdDeclaration = resultsLastIdDeclaration[0].lastId;

      let lastDeclarationMonth;
      let lastDeclarationYear;
      // Buscamos el mes y el año de la ultima declaracion jurada
      const queryLastDeclaration = `SELECT mes, year FROM declaraciones_juradas WHERE empresa_id = ? ORDER BY created DESC LIMIT 1`;
      const [resultsLastDeclaration] = await connection.query(
        queryLastDeclaration,
        [companyId]
      );

      if (resultsLastDeclaration.length === 0) {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        if (currentMonth === 1) {
          lastDeclarationMonth = 12;
          lastDeclarationYear = currentYear - 1;
        } else {
          lastDeclarationMonth = currentMonth;
          lastDeclarationYear = currentYear;
        }
      } else {
        lastDeclarationMonth = resultsLastDeclaration[0].mes;
        lastDeclarationYear = resultsLastDeclaration[0].year;
      }

      const lastDayOfDeclarationMonth = new Date(
        lastDeclarationYear,
        lastDeclarationMonth + 1,
        0
      ).getDate();
      
      const dueDate = new Date(
        lastDeclarationYear,
        lastDeclarationMonth,
        lastDayOfMonth
      );

      // Insertamos una nueva declaracion jurada
      const queryInsertDeclaration = `INSERT INTO declaraciones_juradas (id, fecha, empresa_id, mes, year, vencimiento, importe, sueldo_basico, created, modified) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, NOW(), NOW());`;
      await connection.query(queryInsertDeclaration, [
        lastIdDeclaration + 1,
        companyId,
        lastDeclarationMonth === 12 ? 1 : lastDeclarationMonth + 1,
        lastDeclarationMonth === 12
          ? lastDeclarationYear + 1
          : lastDeclarationYear,
        // ultimo dia del mes de la declaracion
        dueDate,
        0,
        0,
      ]);

      // Ahora registramos datos en la tabla sueldos
      for (const employee of employees) {
        // Primero buscar el id del contrato de cada empleado
        const queryContractId = `SELECT id FROM contratos WHERE empleado_id = (SELECT id FROM empleados WHERE cuil = ?) ORDER BY created DESC LIMIT 1`;
        const [resultsContractId] = await connection.query(queryContractId, [
          employee.cuil,
        ]);
        const contractId = resultsContractId[0].id;

        // Ahora que tenemos el id del contrato de la persona insertamos en sueldos
        const queryLastIdSalary = `SELECT MAX(id) as lastId FROM sueldos`;
        const [resultsLastIdSalary] = await connection.query(queryLastIdSalary);
        const lastIdSalary = resultsLastIdSalary[0].lastId;

        const queryCategoryId = `SELECT id FROM categorias WHERE nombre = ?`;
        const [resultsCategoryId] = await connection.query(queryCategoryId, [
          employee.categora,
        ]);
        const categoryId = resultsCategoryId[0].id;

        const queryInsertSalary = `INSERT INTO sueldos (id, contrato_id, declaraciones_jurada_id,adicional, sueldo_basico, categoria_id, sindicato_activo, created, modified) VALUES (?, ?, ?, ?, ? , ?, ?, now(), now());`;
        await connection.query(queryInsertSalary, [
          lastIdSalary + 1,
          contractId,
          lastIdDeclaration + 1,
          Number(employee.adicionales),
          employee.sueldo_bsico,
          categoryId,
          employee.adherido_a_sindicato === "Si" ? 1 : 0,
        ]);

        let total = 0;
        let aportes = 0;
        total = Number(employee.sueldo_bsico) + Number(employee.adicionales);

        if (employee.adherido_a_sindicato === "Si") {
          aportes = total * 0.04;
        } else {
          aportes = total * 0.03;
        }

        amount = amount + aportes;
      }

      // Actualizamos el importe de la declaracion jurada
      const queryUpdateDeclaration = `UPDATE declaraciones_juradas SET subtotal = ?, interes = 0, importe = ? WHERE id = ?;`;
      await connection.query(queryUpdateDeclaration, [
        amount,
        amount,
        lastIdDeclaration + 1,
      ]);

      // Commit de la transacción
      await connection.commit();
      console.log("Transacción completada con éxito.");
    } catch (error) {
      // Si ocurre un error, deshacemos la transacción
      await connection.rollback();
      console.error("Error en la transacción:", error);
    } finally {
      // Cerramos la conexión
      connection.release();
    }
  },
};

export default employeesModel;
