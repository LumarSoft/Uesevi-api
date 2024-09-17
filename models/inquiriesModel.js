import { pool } from "../db/db.js";

const inquiriesModel = {
  getAllInquiries: async () => {
    const query = `SELECT * FROM consultas ORDER BY created DESC`;
    const [results] = await pool.query(query);
    return results;
  },

  addInquiry: async (name, email, message, phone) => {
    try {
      // Obtener el ID máximo actual
      const getMaxIdQuery = `SELECT MAX(id) AS maxId FROM consultas`;
      const [rows] = await pool.query(getMaxIdQuery);
      const newId = (rows[0].maxId || 0) + 1; // Si no hay registros, usamos 1

      // Insertar el nuevo registro con el ID calculado
      const query = `INSERT INTO consultas (id, nombre, email, mensaje, telefono, created) VALUES (?, ?, ?, ?, ?, NOW())`;
      const result = await pool.query(query, [
        newId,
        name,
        email,
        message,
        phone,
      ]);

      return result;
    } catch (error) {
      console.error("Error al agregar la consulta:", error);
      throw error;
    }
  },
};

export default inquiriesModel;
