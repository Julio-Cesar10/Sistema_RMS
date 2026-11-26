import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import express from "express";
import multer from "multer";
import mysql from "mysql2/promise";
import { iniciarMysql } from "./mysql-embutido.js";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pastaDocs = path.resolve(aqui, "../storage");
const pastaFront = path.resolve(aqui, "../../frontend/dist");
fs.mkdirSync(pastaDocs, { recursive: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "rms_protocolos",
  charset: "utf8mb4",
  timezone: "Z",
  dateStrings: ["DATE"],
});

const STATUS = ["em aberto", "deferido", "arquivado"];
const ROTULOS = { numero: "Número", titulo: "Título", partes: "Partes", descricao: "Descrição", status: "Status", dataMovimentacao: "Data de movimentação", prazo: "Prazo de entrega", responsaveis: "Responsáveis" };
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const dataValida = (v) => {
  if (!DATA.test(v || "")) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
const OITO_HORAS = 8 * 60 * 60 * 1000;
const sessoes = new Map();

const rota = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const iso = (d) => (d ? new Date(d).toISOString() : null);
const diaLocal = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const cookieDe = (req) => {
  const par = (req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).find(([k]) => k === "rms_sessao");
  return par?.[1];
};

const autenticar = (req, res, next) => {
  const s = sessoes.get(cookieDe(req));
  if (!s || s.expira < Date.now()) return res.status(401).json({ erro: "Sessão expirada. Faça login novamente." });
  req.usuario = s.usuario;
  next();
};

const transacao = async (fn) => {
  const con = await pool.getConnection();
  try {
    await con.beginTransaction();
    const r = await fn(con);
    await con.commit();
    return r;
  } catch (e) {
    await con.rollback();
    throw e;
  } finally {
    con.release();
  }
};

const mapa = (p, responsaveis) => ({
  id: p.id,
  numero: p.numero_protocolo,
  titulo: p.titulo,
  partes: p.partes || "",
  descricao: p.descricao || "",
  status: p.status,
  dataMovimentacao: p.data_movimentacao || "",
  prazo: p.prazo_entrega,
  criadoEm: iso(p.criado_em),
  salvoEm: iso(p.salvo_em),
  ultimoAcesso: iso(p.ultimo_acesso),
  editadoPor: p.editado_por || "",
  responsaveis,
});

const nomesLimpos = (lista) => [...new Set((lista || []).map((n) => String(n).trim()).filter(Boolean))];

const gravarResponsaveis = async (con, id, nomes) => {
  await con.query("DELETE FROM processo_responsaveis WHERE processo_id = ?", [id]);
  for (const nome of nomesLimpos(nomes)) {
    await con.query("INSERT IGNORE INTO responsaveis (nome) VALUES (?)", [nome]);
    const [[r]] = await con.query("SELECT id FROM responsaveis WHERE nome = ?", [nome]);
    await con.query("INSERT INTO processo_responsaveis (processo_id, responsavel_id) VALUES (?, ?)", [id, r.id]);
  }
};

const validar = async (d, idAtual) => {
  const erros = [];
  const numero = String(d.numero ?? "").trim();
  if (!numero) erros.push("Informe o número do protocolo.");
  else {
    const [r] = await pool.query("SELECT id FROM processos WHERE numero_protocolo = ? AND id <> ?", [numero, idAtual || 0]);
    if (r.length) erros.push("Já existe um protocolo com este número.");
  }
  if (!String(d.titulo ?? "").trim()) erros.push("Informe o título.");
  if (!STATUS.includes(d.status)) erros.push("Status inválido.");
  if (!dataValida(d.prazo)) erros.push("Informe o prazo de entrega com uma data válida.");
  if (d.dataMovimentacao && !dataValida(d.dataMovimentacao)) erros.push("Data de movimentação inválida.");
  return erros;
};

const upload = multer({
  storage: multer.diskStorage({
    destination: pastaDocs,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).replace(/[^.\w]/g, "").slice(0, 10)),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const apagarArquivo = (caminho) => fs.promises.unlink(path.join(pastaDocs, path.basename(caminho))).catch(() => {});

const app = express();
app.disable("x-powered-by");
app.use(express.json());

const embutido = Boolean(process.env.MYSQL_EXE);
let liberarBanco;
let mysqlFilho = null;
const bancoPronto = embutido ? new Promise((ok, falha) => { liberarBanco = { ok, falha }; }) : Promise.resolve();
bancoPronto.catch((e) => console.error(e.message));

app.use("/api", async (req, res, next) => {
  try {
    await bancoPronto;
    next();
  } catch {
    res.status(503).json({ erro: "O banco de dados não iniciou. Veja o arquivo dados/mysql-erro.log." });
  }
});

app.post("/api/login", rota(async (req, res) => {
  const { usuario = "", senha = "" } = req.body;
  const [[u]] = await pool.query("SELECT login, senha_hash FROM usuarios WHERE login = ?", [String(usuario)]);
  if (!u || !(await bcrypt.compare(String(senha), u.senha_hash))) return res.status(401).json({ erro: "Usuário ou senha inválidos." });
  const token = crypto.randomBytes(32).toString("hex");
  sessoes.set(token, { usuario: u.login, expira: Date.now() + OITO_HORAS });
  res.setHeader("Set-Cookie", `rms_sessao=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${OITO_HORAS / 1000}`);
  res.json({ usuario: u.login });
}));

app.post("/api/logout", (req, res) => {
  sessoes.delete(cookieDe(req));
  res.setHeader("Set-Cookie", "rms_sessao=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.use("/api", autenticar);

app.get("/api/processos", rota(async (req, res) => {
  const [lista] = await pool.query("SELECT * FROM processos ORDER BY id");
  const [vinculos] = await pool.query("SELECT pr.processo_id, r.nome FROM processo_responsaveis pr JOIN responsaveis r ON r.id = pr.responsavel_id ORDER BY r.nome");
  const porProcesso = {};
  for (const v of vinculos) (porProcesso[v.processo_id] ||= []).push(v.nome);
  res.json(lista.map((p) => mapa(p, porProcesso[p.id] || [])));
}));

app.get("/api/processos/:id", rota(async (req, res) => {
  const id = Number(req.params.id);
  const [[p]] = await pool.query("SELECT * FROM processos WHERE id = ?", [id]);
  if (!p) return res.status(404).json({ erro: "Protocolo não encontrado." });
  if (req.query.acesso !== "0") {
    const agora = new Date();
    await pool.query("UPDATE processos SET ultimo_acesso = ? WHERE id = ?", [agora, id]);
    await pool.query("INSERT INTO acessos (processo_id, data_hora) VALUES (?, ?)", [id, agora]);
    p.ultimo_acesso = agora;
  }
  const [resp] = await pool.query("SELECT r.nome FROM processo_responsaveis pr JOIN responsaveis r ON r.id = pr.responsavel_id WHERE pr.processo_id = ? ORDER BY r.nome", [id]);
  const [docs] = await pool.query("SELECT id, nome, tipo, incluido_em FROM documentos WHERE processo_id = ? ORDER BY id", [id]);
  const [hist] = await pool.query("SELECT acao, campos_alterados, data_hora FROM historico WHERE processo_id = ? ORDER BY id", [id]);
  res.json({
    ...mapa(p, resp.map((r) => r.nome)),
    documentos: docs.map((d) => ({ id: d.id, nome: d.nome, tipo: d.tipo, incluidoEm: iso(d.incluido_em) })),
    historico: hist.map((h) => ({ acao: h.acao, campos: h.campos_alterados, dataHora: iso(h.data_hora) })),
  });
}));

app.post("/api/processos", rota(async (req, res) => {
  const d = req.body;
  const erros = await validar(d);
  if (erros.length) return res.status(400).json({ erro: erros.join(" "), erros });
  const agora = new Date();
  const id = await transacao(async (con) => {
    const [r] = await con.query(
      "INSERT INTO processos (numero_protocolo, titulo, partes, descricao, status, data_movimentacao, prazo_entrega, criado_em, salvo_em, editado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [String(d.numero).trim(), String(d.titulo).trim(), d.partes || null, d.descricao || null, d.status, d.dataMovimentacao || null, d.prazo, agora, agora, req.usuario]
    );
    await gravarResponsaveis(con, r.insertId, d.responsaveis);
    await con.query("INSERT INTO historico (processo_id, acao, campos_alterados, data_hora) VALUES (?, 'Criação', 'Protocolo criado', ?)", [r.insertId, agora]);
    return r.insertId;
  });
  res.status(201).json({ id });
}));

app.put("/api/processos/:id", rota(async (req, res) => {
  const id = Number(req.params.id);
  const [[atual]] = await pool.query("SELECT * FROM processos WHERE id = ?", [id]);
  if (!atual) return res.status(404).json({ erro: "Protocolo não encontrado." });
  const d = req.body;
  const erros = await validar(d, id);
  if (erros.length) return res.status(400).json({ erro: erros.join(" "), erros });
  const [antes] = await pool.query("SELECT r.nome FROM processo_responsaveis pr JOIN responsaveis r ON r.id = pr.responsavel_id WHERE pr.processo_id = ? ORDER BY r.nome", [id]);
  const novo = {
    numero: String(d.numero).trim(), titulo: String(d.titulo).trim(), partes: d.partes || "", descricao: d.descricao || "",
    status: d.status, dataMovimentacao: d.dataMovimentacao || "", prazo: d.prazo, responsaveis: nomesLimpos(d.responsaveis).sort().join(","),
  };
  const velho = { ...mapa(atual, []), responsaveis: antes.map((r) => r.nome).sort().join(",") };
  const mudou = Object.keys(ROTULOS).filter((c) => String(velho[c]) !== String(novo[c])).map((c) => ROTULOS[c]);
  const agora = new Date();
  await transacao(async (con) => {
    await con.query(
      "UPDATE processos SET numero_protocolo = ?, titulo = ?, partes = ?, descricao = ?, status = ?, data_movimentacao = ?, prazo_entrega = ?, salvo_em = ?, editado_por = ? WHERE id = ?",
      [novo.numero, novo.titulo, novo.partes || null, novo.descricao || null, novo.status, novo.dataMovimentacao || null, novo.prazo, agora, req.usuario, id]
    );
    await gravarResponsaveis(con, id, d.responsaveis);
    await con.query("INSERT INTO historico (processo_id, acao, campos_alterados, data_hora) VALUES (?, 'Edição', ?, ?)", [id, mudou.join(", ") || "Nenhum campo alterado", agora]);
  });
  res.json({ id });
}));

app.delete("/api/processos/:id", rota(async (req, res) => {
  const id = Number(req.params.id);
  const [docs] = await pool.query("SELECT caminho FROM documentos WHERE processo_id = ?", [id]);
  const [r] = await pool.query("DELETE FROM processos WHERE id = ?", [id]);
  if (!r.affectedRows) return res.status(404).json({ erro: "Protocolo não encontrado." });
  await Promise.all(docs.map((d) => apagarArquivo(d.caminho)));
  res.json({ ok: true });
}));

app.post("/api/processos/:id/documentos", upload.single("arquivo"), rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!req.file) return res.status(400).json({ erro: "Nenhum arquivo enviado." });
  const [[p]] = await pool.query("SELECT id FROM processos WHERE id = ?", [id]);
  if (!p) {
    await apagarArquivo(req.file.filename);
    return res.status(404).json({ erro: "Protocolo não encontrado." });
  }
  const nome = Buffer.from(req.file.originalname, "latin1").toString("utf8");
  const agora = new Date();
  await transacao(async (con) => {
    await con.query("INSERT INTO documentos (processo_id, nome, tipo, caminho, incluido_em) VALUES (?, ?, ?, ?, ?)", [id, nome, req.file.mimetype, req.file.filename, agora]);
    await con.query("INSERT INTO historico (processo_id, acao, campos_alterados, data_hora) VALUES (?, 'Documento anexado', ?, ?)", [id, nome, agora]);
  });
  res.status(201).json({ ok: true });
}));

app.get("/api/documentos/:id/arquivo", rota(async (req, res) => {
  const [[d]] = await pool.query("SELECT nome, tipo, caminho FROM documentos WHERE id = ?", [Number(req.params.id)]);
  if (!d) return res.status(404).json({ erro: "Documento não encontrado." });
  const perigoso = /html|svg|xml|javascript/i.test(d.tipo || "");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", d.tipo || "application/octet-stream");
  res.setHeader("Content-Disposition", `${perigoso ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(d.nome)}`);
  res.sendFile(path.join(pastaDocs, path.basename(d.caminho)));
}));

app.delete("/api/documentos/:id", rota(async (req, res) => {
  const [[d]] = await pool.query("SELECT id, processo_id, nome, caminho FROM documentos WHERE id = ?", [Number(req.params.id)]);
  if (!d) return res.status(404).json({ erro: "Documento não encontrado." });
  await transacao(async (con) => {
    await con.query("DELETE FROM documentos WHERE id = ?", [d.id]);
    await con.query("INSERT INTO historico (processo_id, acao, campos_alterados, data_hora) VALUES (?, 'Documento removido', ?, ?)", [d.processo_id, d.nome, new Date()]);
  });
  await apagarArquivo(d.caminho);
  res.json({ ok: true });
}));

const TABELA_NOTIFICACOES = `CREATE TABLE IF NOT EXISTS notificacoes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  processo_id INT UNSIGNED NOT NULL,
  prazo_referencia DATE NOT NULL,
  criada_em DATETIME(3) NOT NULL,
  lida_em DATETIME(3) NULL,
  UNIQUE KEY uq_notificacao (processo_id, prazo_referencia),
  FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
let tabelaNotificacoes = null;
const garantirNotificacoes = () => {
  tabelaNotificacoes ||= pool.query(TABELA_NOTIFICACOES).catch((e) => {
    tabelaNotificacoes = null;
    throw e;
  });
  return tabelaNotificacoes;
};

const gerarNotificacoes = async () => {
  await garantirNotificacoes();
  await pool.query(
    "INSERT IGNORE INTO notificacoes (processo_id, prazo_referencia, criada_em) SELECT id, prazo_entrega, ? FROM processos WHERE status = 'em aberto' AND prazo_entrega <= ?",
    [new Date(), diaLocal(new Date())]
  );
};

app.get("/api/notificacoes", rota(async (req, res) => {
  await gerarNotificacoes();
  const [linhas] = await pool.query(
    "SELECT n.id, n.processo_id, n.lida_em, p.numero_protocolo, p.titulo, p.prazo_entrega FROM notificacoes n JOIN processos p ON p.id = n.processo_id AND p.prazo_entrega = n.prazo_referencia AND p.status = 'em aberto' ORDER BY (n.lida_em IS NULL) DESC, p.prazo_entrega DESC, n.id DESC LIMIT 50"
  );
  const itens = linhas.map((l) => ({ id: l.id, processoId: l.processo_id, numero: l.numero_protocolo, titulo: l.titulo, prazo: l.prazo_entrega, lida: Boolean(l.lida_em) }));
  res.json({ naoLidas: itens.filter((i) => !i.lida).length, itens });
}));

app.post("/api/notificacoes/lidas", rota(async (req, res) => {
  await gerarNotificacoes();
  await pool.query("UPDATE notificacoes SET lida_em = ? WHERE lida_em IS NULL", [new Date()]);
  res.json({ ok: true });
}));

app.post("/api/notificacoes/:id/lida", rota(async (req, res) => {
  await garantirNotificacoes();
  await pool.query("UPDATE notificacoes SET lida_em = ? WHERE id = ? AND lida_em IS NULL", [new Date(), Number(req.params.id)]);
  res.json({ ok: true });
}));

app.use("/api", (req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

if (fs.existsSync(pastaFront)) {
  app.use(express.static(pastaFront));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(pastaFront, "index.html")));
}

app.use((err, req, res, next) => {
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Já existe um protocolo com este número." });
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ erro: "O arquivo passa de 50 MB." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ erro: "Requisição inválida." });
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

const porta = Number(process.env.PORT || 3001);
const arquivoPid = path.resolve(aqui, "../servidor.pid");

const servidor = app.listen(porta, "127.0.0.1");
servidor.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log("O Sistema RMS já está em execução.");
    process.exit(0);
  }
  throw e;
});
servidor.on("listening", () => {
  fs.writeFileSync(arquivoPid, String(process.pid));
  console.log(`Servidor RMS em http://localhost:${porta}`);
  if (embutido) {
    iniciarMysql({
      exe: process.env.MYSQL_EXE,
      base: process.env.MYSQL_BASE,
      dados: process.env.MYSQL_DADOS,
      porta: Number(process.env.DB_PORT || 3306),
      log: process.env.MYSQL_LOG,
    })
      .then((filho) => {
        mysqlFilho = filho;
        liberarBanco.ok();
      })
      .catch((e) => liberarBanco.falha(e));
  }
});

let encerrando = false;
const encerrar = async () => {
  if (encerrando) return;
  encerrando = true;
  if (mysqlFilho) {
    await pool.query("SHUTDOWN").catch(() => {});
    if (mysqlFilho.exitCode === null) {
      await Promise.race([new Promise((ok) => mysqlFilho.once("exit", ok)), new Promise((ok) => setTimeout(ok, 20000))]);
    }
  }
  fs.rmSync(arquivoPid, { force: true });
  process.exit(0);
};
for (const sinal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sinal, encerrar);

const arquivoParar = process.env.PARAR_ARQUIVO;
if (arquivoParar) {
  fs.rmSync(arquivoParar, { force: true });
  setInterval(() => {
    if (fs.existsSync(arquivoParar)) {
      fs.rmSync(arquivoParar, { force: true });
      encerrar();
    }
  }, 2000);
}
