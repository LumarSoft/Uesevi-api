/**
 * Crea (o restablece) una cuenta EMPRESA de prueba para probar el circuito
 * completo: login -> cargar declaración jurada.
 *
 * USO
 *   node scripts/crearEmpresaPrueba.js
 *   node scripts/crearEmpresaPrueba.js --email otra@prueba.test --password Otra1234
 *   node scripts/crearEmpresaPrueba.js --borrar     # elimina la cuenta de prueba
 *
 * Es idempotente: si la cuenta ya existe le restablece la contraseña en vez de
 * duplicarla. Corre contra la base que indique DB_DATABASE en api/.env, así que
 * NO ejecutarlo apuntando a producción.
 *
 * Si la tabla `categorias` está vacía (base recién creada) siembra las
 * categorías estándar, que son necesarias para poder importar el Excel.
 */

import { pool } from "../db/db.js";
import bcrypt from "bcrypt";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const EMAIL = getArg("email", "empresa.prueba@uesevi.test");
const PASSWORD = getArg("password", "Prueba1234");
const NOMBRE_EMPRESA = getArg("empresa", "Empresa de Prueba SRL");
const CUIT = getArg("cuit", "30712345678");
const BORRAR = args.includes("--borrar");

const nextId = async (conn, table) => {
  const [rows] = await conn.query(`SELECT COALESCE(MAX(id), 0) + 1 AS id FROM \`${table}\``);
  return rows[0].id;
};

const CATEGORIAS_BASE = [
  ["Vigilador General", 500000, 50000],
  ["Vigilador Bombero", 520000, 52000],
  ["Administrativo", 540000, 54000],
  ["Vigilador Principal", 560000, 56000],
  ["Verificador Evento", 500000, 50000],
  ["Operador de monitoreo", 530000, 53000],
  ["Guía Técnico", 550000, 55000],
  ["Instalador de elementos de seguridad electrónica", 570000, 57000],
  ["Controlador de admisión y permanencia en gral.", 510000, 51000],
];

const main = async () => {
  const conn = await pool.getConnection();
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");

  try {
    await conn.beginTransaction();

    const [users] = await conn.query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [EMAIL]
    );

    if (BORRAR) {
      if (!users.length) {
        console.log(`No existe ninguna cuenta con el email ${EMAIL}.`);
      } else {
        await conn.query("DELETE FROM empresas WHERE usuario_id = ?", [users[0].id]);
        await conn.query("DELETE FROM usuarios WHERE id = ?", [users[0].id]);
        console.log(`Cuenta de prueba ${EMAIL} eliminada de la base "${db}".`);
      }
      await conn.commit();
      return;
    }

    const hash = await bcrypt.hash(PASSWORD, 10);
    let userId;

    if (users.length) {
      userId = users[0].id;
      await conn.query(
        `UPDATE usuarios
            SET password = ?, rol = 'empresa', estado = '1', deleted = NULL, modified = NOW()
          WHERE id = ?`,
        [hash, userId]
      );
      console.log(`Usuario existente actualizado (id ${userId}).`);
    } else {
      userId = await nextId(conn, "usuarios");
      await conn.query(
        `INSERT INTO usuarios (id, email, password, nombre, apellido, telefono, rol, estado, created, modified)
         VALUES (?, ?, ?, 'Empresa', 'De Prueba', '3410000000', 'empresa', '1', NOW(), NOW())`,
        [userId, EMAIL, hash]
      );
      console.log(`Usuario creado (id ${userId}).`);
    }

    const [empresas] = await conn.query(
      "SELECT id FROM empresas WHERE usuario_id = ? LIMIT 1",
      [userId]
    );

    let empresaId;
    if (empresas.length) {
      empresaId = empresas[0].id;
      // 'Activo' es lo que espera el login: con 'Pendiente' rechaza el acceso.
      await conn.query(
        "UPDATE empresas SET estado = 'Activo', modified = NOW() WHERE id = ?",
        [empresaId]
      );
      console.log(`Empresa existente reactivada (id ${empresaId}).`);
    } else {
      empresaId = await nextId(conn, "empresas");
      await conn.query(
        `INSERT INTO empresas
           (id, usuario_id, cuit, nombre, domicilio, telefono, ciudad, estado, email_contacto, created, modified)
         VALUES (?, ?, ?, ?, 'Calle Falsa 123', '3410000000', 'Rosario', 'Activo', ?, NOW(), NOW())`,
        [empresaId, userId, CUIT, NOMBRE_EMPRESA, EMAIL]
      );
      console.log(`Empresa creada (id ${empresaId}).`);
    }

    // Categorías: sin ellas no se puede importar el Excel.
    const [[{ c: cantidadCategorias }]] = await conn.query(
      "SELECT COUNT(*) AS c FROM categorias"
    );
    if (cantidadCategorias === 0) {
      let id = await nextId(conn, "categorias");
      for (const [nombre, basico, presentismo] of CATEGORIAS_BASE) {
        await conn.query(
          `INSERT INTO categorias (id, nombre, created, modified, sueldo_basico, presentismo)
           VALUES (?, ?, NOW(), NOW(), ?, ?)`,
          [id++, nombre, basico, presentismo]
        );
      }
      console.log(
        `Se sembraron ${CATEGORIAS_BASE.length} categorías (la tabla estaba vacía). Los importes son de EJEMPLO.`
      );
    } else {
      console.log(`Categorías existentes: ${cantidadCategorias} (no se tocaron).`);
    }

    await conn.commit();

    console.log("\n──────────────── CUENTA DE PRUEBA ────────────────");
    console.log(`  Base de datos : ${db}`);
    console.log(`  Ingreso       : /loginempresa`);
    console.log(`  Email         : ${EMAIL}`);
    console.log(`  Contraseña    : ${PASSWORD}`);
    console.log(`  Empresa       : ${NOMBRE_EMPRESA} (id ${empresaId}, CUIT ${CUIT})`);
    console.log("──────────────────────────────────────────────────");
    console.log(
      "\nLa empresa no tiene declaraciones previas, así que Importación mostrará\n" +
        '"No hay declaraciones juradas previas" y podrás cargar el mes anterior.'
    );
  } catch (error) {
    await conn.rollback();
    console.error("\nNo se pudo crear la cuenta de prueba:", error.message);
    if (error.code === "ER_NO_SUCH_TABLE") {
      console.error(
        `La base "${db}" no tiene las tablas del sistema. Cargá primero el esquema/dump y volvé a ejecutar el script.`
      );
    }
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
};

main();
