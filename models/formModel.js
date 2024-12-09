import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const formModel = {
  getAll: async () => {
    const query = `SELECT 
    *,
    CASE 
        WHEN fecha_ingreso = '0000-00-00' THEN NULL 
        ELSE fecha_ingreso 
    END AS fecha_ingreso
FROM inscripcion`;
    const [results] = await pool.query(query);
    console.log(results);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  changeCompany: async (empresa, id) => {
    try {
      const query = `UPDATE inscripcion SET empresa = ? WHERE id = ?`;

      const [results] = await pool.query(query, [empresa, id]);

      return results;
    } catch (error) {
      console.error(error);
    }
  },

  getToComplete: async (cuil) => {
    const query = `SELECT * FROM inscripcion WHERE cuil = ?`;
    const [results] = await pool.query(query, cuil);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  createRequest: async (data) => {
    const {
      name,
      lastName,
      email,
      phone,
      cuil,
      dni,
      birthDate,
      birthPlace,
      nationality,
      province,
      city,
      address,
      postalCode,
      civilStatus,
      childrenCount,
      company,
      category,
      entryDate,
      companyPhone,
      companyAddress,
      companyCity,
      companyPostalCode,
      companyProvince,
      companyCuit,
      objective,
    } = data;

    const query = `INSERT INTO inscripcion (
      nombre, 
      apellido, 
      correo_electronico, 
      telefono, 
      cuil, 
      dni, 
      fecha_nacimiento, 
      lugar_nacimiento, 
      nacionalidad, 
      provincia, 
      localidad, 
      domicilio, 
      codigo_postal, 
      estado_civil, 
      cantidad_hijos, 
      empresa, 
      categoria, 
      fecha_ingreso, 
      telefono_empresa, 
      domicilio_empresa, 
      localidad_empresa, 
      cod_postal_empresa, 
      provincia_empresa, 
      cuit_empresa, 
      objetivo,
      created
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const values = [
      name,
      lastName,
      email,
      phone,
      cuil,
      dni,
      birthDate,
      birthPlace,
      nationality,
      province,
      city,
      address,
      postalCode,
      civilStatus,
      Number(childrenCount),
      company,
      category,
      entryDate,
      companyPhone,
      companyAddress,
      companyCity,
      companyPostalCode,
      companyProvince,
      companyCuit,
      objective,
    ];

    try {
      const [results] = await pool.query(query, values);
      return results;
    } catch (error) {
      console.error("Error al insertar datos:", error);
      throw error;
    }
  },
};

export default formModel;
