import { useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/emblema-rms.png";
import "../styles/telas.css";

const icones = {
  menu: "M3 6h18M3 12h18M3 18h18",
  inicio: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  lista: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  novo: "M12 5v14M5 12h14",
  sair: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

const Icone = ({ nome }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={icones[nome]} />
  </svg>
);

const itens = [
  ["/inicio", "Página inicial", "inicio", false],
  ["/processos", "Processos", "lista", true],
  ["/processos/novo", "Novo protocolo", "novo", false],
];

export default function Layout() {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(() => localStorage.getItem("rms_menu") !== "fechado");
  if (!sessionStorage.getItem("rms_auth")) return <Navigate to="/login" replace />;

  const alternar = () => {
    localStorage.setItem("rms_menu", aberto ? "fechado" : "aberto");
    setAberto(!aberto);
  };

  const sair = () => {
    sessionStorage.removeItem("rms_auth");
    navigate("/login");
  };

  return (
    <div className="app">
      <aside className={`menu${aberto ? "" : " recolhido"}`}>
        <button type="button" className="alternar" onClick={alternar} aria-expanded={aberto} aria-label={aberto ? "Recolher menu" : "Expandir menu"}>
          <Icone nome="menu" />
        </button>
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
      <main className="principal"><Outlet /></main>
    </div>
  );
}
