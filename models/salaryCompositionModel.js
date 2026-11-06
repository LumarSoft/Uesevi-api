import { pool } from "../db/db.js";
import { totalConceptos } from "../utils/salaryComposition.js";

// MySQL devuelve la columna JSON ya parseada con mysql2, pero por las dudas
// (drivers viejos / TEXT) se contempla el string.
const parseRow = (row) => {
  if (!row) return null;
  const conceptos =
    typeof row.conceptos === "string"
      ? JSON.parse(row.conceptos)
      : row.conceptos || [];
  return { ...row, conceptos, total: totalConceptos(conceptos) };
};

const salaryCompositionModel = {
  // Lo que ve el público: solo lo publicado, del período más reciente hacia atrás.
  getPublic: async (limit = 12) => {
    const query = `
      SELECT id, year, mes, categoria, conceptos, nota
      FROM composicion_salarial
      WHERE publicado = 1
      ORDER BY year DESC, mes DESC, categoria ASC
      LIMIT ?`;
    const [rows] = await pool.query(query, [Number(limit)]);
    return rows.map(parseRow);
  },

  getAll: async () => {
    const query = `
      SELECT *
      FROM composicion_salarial
      ORDER BY year DESC, mes DESC, categoria ASC`;
    const [rows] = await pool.query(query);
    return rows.map(parseRow);
  },

  getById: async (id) => {
    const [rows] = await pool.query(
      "SELECT * FROM composicion_salarial WHERE id = ?",
      [id]
    );
    return parseRow(rows[0]);
  },

  create: async (data) => {
    const query = `
      INSERT INTO composicion_salarial
        (year, mes, categoria, conceptos, nota, publicado, created, modified)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const [result] = await pool.query(query, [
      data.year,
      data.mes,
      data.categoria,
      JSON.stringify(data.conceptos),
      data.nota,
      data.publicado,
    ]);
    return salaryCompositionModel.getById(result.insertId);
  },

  update: async (id, data) => {
    const query = `
      UPDATE composicion_salarial
      SET year = ?, mes = ?, categoria = ?, conceptos = ?, nota = ?, publicado = ?, modified = NOW()
      WHERE id = ?`;
    const [result] = await pool.query(query, [
      data.year,
      data.mes,
      data.categoria,
      JSON.stringify(data.conceptos),
      data.nota,
      data.publicado,
      id,
    ]);
    return result;
  },

  delete: async (id) => {
    const [result] = await pool.query(
      "DELETE FROM composicion_salarial WHERE id = ?",
      [id]
    );
    return result;
  },
};

export default salaryCompositionModel;
