import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const formModel = {
  getAll: async () => {
    const query = `SELECT e.empresa_provisoria_nombre, e.cuil, u.nombre, u.apellido, u.created, u.email, e.numero_socio, u.estado, e.nacionalidad, e.codigo_postal, e.domicilio, e.fecha_nacimiento, u.telefono FROM empleados e JOIN usuarios u ON e.usuario_id = u.id WHERE e.empresa_provisoria_nombre IS NOT NULL`;
    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      fecha_nacimiento: formatDate(result.fecha_nacimiento),
    }));

    return formattedResults;
  },

  changeCompany: async (id, empresa) => {
    try {
      const query = `UPDATE empleados SET empresa_provisoria_nombre = ? WHERE numero_socio = ?`;

      const [results] = await pool.query(query, [empresa, id]);

      return results;
    } catch (error) {
      console.error(error);
    }
  },
};

export default formModel;
