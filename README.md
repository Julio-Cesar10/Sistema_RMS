# Sistema RMS

Sistema de gestão de protocolos — Roseno, Morais & Sexto Advogados.

## Estrutura
- `frontend/` — interface (React + Vite)
- `backend/`  — servidor Node.js + Express e acesso ao MySQL
- `database/` — script de criação das tabelas (`schema.sql`)
- `docs/`     — documentação e código-fonte dos executáveis (`docs/launcher`)

## Uso no dia a dia (Windows)
- `Sistema RMS.exe`: abre o sistema em http://localhost:3001 (na primeira vez prepara a interface sozinho)
- `Encerrar Sistema RMS.exe`: encerra o sistema

## Desenvolvimento
1. Tenha o MySQL instalado e em execução.
2. Em `backend/`, copie `.env.example` para `.env` e preencha `DB_USER`, `DB_PASSWORD`, `ADMIN_USUARIO` e `ADMIN_SENHA`.
3. `cd backend`, `npm install`, `npm run db:init` e `npm run dev`.
4. Em outro terminal: `cd frontend`, `npm install` e `npm run dev` (http://localhost:5173).

## Pacote para enviar a outro computador
Rode `powershell -ExecutionPolicy Bypass -File montar-pacote.ps1`. O `SistemaRMS.zip` é salvo na Área de Trabalho, com Node.js e MySQL embutidos.

## Recompilar os executáveis
Os códigos estão em `docs/launcher`. Para alterar o ícone ou o comportamento, compile com `csc` ou `mcs` usando `-target:winexe -win32icon:icone.ico`.
