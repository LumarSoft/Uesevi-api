import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

// Normaliza un monto que llega del front (FormData => siempre string).
// "" / null / undefined => null (columna en NULL, se interpreta como 0 al calcular).
const toAmount = (v) =>
  v === undefined || v === null || v === "" ? null : Number(v);

// Fecha en formato `yyyy-MM-dd`, que es el ÚNICO que acepta <input type="date">.
// `formatDate` devuelve "dd/MM/yy HH:mm", lindo para la tabla pero inservible
// para el input: si se lo pasás, el campo se renderiza VACÍO y parece que no
// hay nada programado. Por eso se exponen las dos versiones.
const toInputDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const categoryModel = {
  getAll: async () => {
    const query = "SELECT * FROM categorias ORDER BY id DESC";

    const [results] = await pool.query(query);

    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      // Para mostrar en la tabla.
      fecha_vigencia: formatDate(result.fecha_vigencia),
      fecha_vigencia_presentismo: formatDate(result.fecha_vigencia_presentismo),
      // Para precargar los <input type="date"> del diálogo Programar.
      fecha_vigencia_input: toInputDate(result.fecha_vigencia),
      fecha_vigencia_presentismo_input: toInputDate(
        result.fecha_vigencia_presentismo
      ),
    }));

    return formattedResults;
  },

  addCategory: async (name, salary, presentismo) => {
    //Nos traemos el ultimo id

    const queryId = "SELECT id FROM categorias ORDER BY id DESC LIMIT 1";

    const [resultId] = await pool.query(queryId);

    const query =
      "INSERT INTO categorias (id, nombre, sueldo_basico, presentismo, created,modified) VALUES (?,?,?,?, NOW(), NOW())";

    const [result] = await pool.query(query, [
      resultId[0].id + 1,
      name,
      salary,
      toAmount(presentismo),
    ]);

    return result;
  },

  deleteCategory: async (id) => {
    const query = "DELETE FROM categorias WHERE id = ?";

    const [result] = await pool.query(query, [id]);

    return result;
  },

  // El presentismo es opcional: si no viene en el payload NO se toca la columna
  // (update parcial). Sólo se escribe cuando el front lo manda explícitamente,
  // así un cliente viejo que edite nombre/sueldo no borra el monto cargado.
  editCategory: async (id, name, salary, presentismo) => {
    const sets = ["nombre = ?", "sueldo_basico = ?"];
    const params = [name, salary];

    if (presentismo !== undefined) {
      sets.push("presentismo = ?");
      params.push(toAmount(presentismo));
    }

    sets.push("modified = NOW()");
    params.push(id);

    const query = `UPDATE categorias SET ${sets.join(", ")} WHERE id = ?`;

    const [result] = await pool.query(query, params);

    return result;
  },

  // Programa el sueldo básico y/o el presentismo futuros. Cada bloque es
  // independiente: se puede programar sólo el sueldo, sólo el presentismo o
  // ambos. El cron `updateNow` los promueve cuando llega la fecha de vigencia.
  futureSalary: async (
    id,
    futureSalary,
    dateChange,
    futurePresentismo,
    datePresentismo
  ) => {
    const sets = [];
    const params = [];

    if (futureSalary !== undefined) {
      sets.push("sueldo_futuro = ?", "fecha_vigencia = ?");
      params.push(toAmount(futureSalary), dateChange || null);
    }

    if (futurePresentismo !== undefined) {
      sets.push("presentismo_futuro = ?", "fecha_vigencia_presentismo = ?");
      params.push(toAmount(futurePresentismo), datePresentismo || null);
    }

    if (!sets.length) return { affectedRows: 0 };

    sets.push("modified = NOW()");
    params.push(id);

    const query = `UPDATE categorias SET ${sets.join(", ")} WHERE id = ?`;

    const [result] = await pool.query(query, params);

    return result;
  },

  // Promueve los valores programados cuya vigencia ya llegó. Sueldo y
  // presentismo se promueven por separado: pueden tener fechas distintas.
  updateNow: async () => {
    const now = new Date();

    const querySalary =
      "UPDATE categorias SET sueldo_basico = sueldo_futuro, sueldo_futuro = NULL, fecha_vigencia = NULL WHERE fecha_vigencia <= ? AND sueldo_futuro IS NOT NULL";
    const [resultSalary] = await pool.query(querySalary, [now]);

    const queryPresentismo =
      "UPDATE categorias SET presentismo = presentismo_futuro, presentismo_futuro = NULL, fecha_vigencia_presentismo = NULL WHERE fecha_vigencia_presentismo <= ? AND presentismo_futuro IS NOT NULL";
    const [resultPresentismo] = await pool.query(queryPresentismo, [now]);

    return {
      sueldosActualizados: resultSalary.affectedRows,
      presentismosActualizados: resultPresentismo.affectedRows,
      affectedRows: resultSalary.affectedRows + resultPresentismo.affectedRows,
    };
  },
};

export default categoryModel;
