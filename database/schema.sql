CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(60) NOT NULL UNIQUE,
  senha_hash VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS processos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero_protocolo VARCHAR(50) NOT NULL UNIQUE,
  titulo VARCHAR(255) NOT NULL,
  partes TEXT NULL,
  descricao TEXT NULL,
  status ENUM('em aberto','deferido','arquivado') NOT NULL DEFAULT 'em aberto',
  data_movimentacao DATE NULL,
  prazo_entrega DATE NOT NULL,
  criado_em DATETIME(3) NOT NULL,
  salvo_em DATETIME(3) NOT NULL,
  ultimo_acesso DATETIME(3) NULL,
  editado_por VARCHAR(60) NULL,
  INDEX idx_status (status),
  INDEX idx_prazo (prazo_entrega)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS responsaveis (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  cor_etiqueta VARCHAR(20) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS processo_responsaveis (
  processo_id INT UNSIGNED NOT NULL,
  responsavel_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (processo_id, responsavel_id),
  FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE,
  FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS documentos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  processo_id INT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(150) NULL,
  caminho VARCHAR(255) NOT NULL,
  origem VARCHAR(20) NOT NULL DEFAULT 'local',
  incluido_em DATETIME(3) NOT NULL,
  FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historico (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  processo_id INT UNSIGNED NOT NULL,
  acao VARCHAR(60) NOT NULL,
  campos_alterados TEXT NULL,
  data_hora DATETIME(3) NOT NULL,
  FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS acessos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  processo_id INT UNSIGNED NOT NULL,
  data_hora DATETIME(3) NOT NULL,
  FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notificacoes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  processo_id INT UNSIGNED NOT NULL,
  prazo_referencia DATE NOT NULL,
  criada_em DATETIME(3) NOT NULL,
  lida_em DATETIME(3) NULL,
  UNIQUE KEY uq_notificacao (processo_id, prazo_referencia),
  FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
