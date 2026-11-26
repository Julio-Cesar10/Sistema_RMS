import { useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/emblema-rms.png";
import { api } from "../services/api.js";
import { useProtocolos } from "../services/contexto.js";
import "../styles/telas.css";
import Icone from "./Icone.jsx";
import Notificacoes from "./Notificacoes.jsx";

const itens = [
  ["/inicio", "Página inicial", "inicio", false],
  ["/processos", "Processos", "lista", true],
  ["/processos/novo", "Novo protocolo", "novo", false],
];

export default function Layout() {
  const navigate = useNavigate();
  const { erro } = useProtocolos();
  const [aberto, setAberto] = useState(false);
  if (!sessionStorage.getItem("rms_auth")) return <Navigate to="/login" replace />;

  const sair = async () => {
    await api.post("/api/logout").catch(() => {});
    sessionStorage.removeItem("rms_auth");
    navigate("/login");
  };

  return (
    <div className="app">
      <aside className={`menu${aberto ? "" : " recolhido"}`}>
        <div className="menu-topo">
          <button type="button" className="alternar" onClick={() => setAberto(!aberto)} aria-expanded={aberto} aria-label={aberto ? "Recolher menu" : "Expandir menu"}>
            <Icone nome="menu" />
          </button>
          <Notificacoes recolhido={!aberto} />
        </div>
        <img src={logo} alt="Roseno, Morais & Sexto Advogados" />
        <nav>
          {itens.map(([to, texto, icone, end]) => (
            <NavLink key={to} to={to} end={end} title={texto}>
              <Icone nome={icone} />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sair" onClick={sair} title="Sair">
          <Icone nome="sair" />
          <span>Sair</span>
        </button>
      </aside>
      <main className="principal">
        {erro && <p className="erros">{erro}</p>}
        <Outlet />
      </main>
    </div>
  );
}
