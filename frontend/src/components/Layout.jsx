import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/emblema-rms.png";
import "../styles/telas.css";

export default function Layout() {
  const navigate = useNavigate();
  if (!sessionStorage.getItem("rms_auth")) return <Navigate to="/login" replace />;

  const sair = () => {
    sessionStorage.removeItem("rms_auth");
    navigate("/login");
  };

  return (
    <div className="app">
      <aside className="menu">
        <img src={logo} alt="Roseno, Morais & Sexto Advogados" />
        <nav>
          <NavLink to="/inicio">Página inicial</NavLink>
          <NavLink to="/processos" end>Processos</NavLink>
          <NavLink to="/processos/novo">Novo protocolo</NavLink>
        </nav>
        <button type="button" onClick={sair}>Sair</button>
      </aside>
      <main className="principal"><Outlet /></main>
    </div>
  );
}
