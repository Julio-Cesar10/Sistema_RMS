import fs from "node:fs";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, ADMIN_USUARIO, ADMIN_SENHA } = process.env;
const banco = DB_NAME || "rms_protocolos";
if (!/^\w+$/.test(banco)) throw new Error("DB_NAME inválido.");

const con = await mysql.createConnection({
  host: DB_HOST || "127.0.0.1",
  port: Number(DB_PORT || 3306),
  user: DB_USER,
  password: DB_PASSWORD,
  multipleStatements: true,
});

await con.query(`CREATE DATABASE IF NOT EXISTS \`${banco}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await con.query(`USE \`${banco}\``);
await con.query(fs.readFileSync(new URL("../../database/schema.sql", import.meta.url), "utf8"));
console.log(`Banco "${banco}" e tabelas prontos.`);

const [[{ total }]] = await con.query("SELECT COUNT(*) AS total FROM usuarios");
if (total > 0) {
  console.log("Usuário administrador já existe; nada a criar.");
} else if (ADMIN_USUARIO && ADMIN_SENHA) {
  await con.query("INSERT INTO usuarios (login, senha_hash) VALUES (?, ?)", [ADMIN_USUARIO, await bcrypt.hash(ADMIN_SENHA, 10)]);
  console.log(`Administrador "${ADMIN_USUARIO}" criado.`);
} else {
  console.log("Defina ADMIN_USUARIO e ADMIN_SENHA no .env e rode de novo para criar o administrador.");
}
await con.end();
