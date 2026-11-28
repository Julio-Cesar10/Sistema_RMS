import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { fmtData } from "../services/formatar.js";
import Icone from "./Icone.jsx";

const hojeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Notificacoes({ recolhido }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [dados, setDados] = useState({ naoLidas: 0, itens: [] });
  const [aberto, setAberto] = useState(false);
  const botao = useRef(null);
  const painel = useRef(null);

  useEffect(() => {
    let ativo = true;
    const buscar = () =>
      api
        .get("/api/notificacoes")
        .then((d) => {
          if (ativo) setDados(d);
        })
        .catch(() => {});
    buscar();
    const timer = setInterval(buscar, 60000);
    window.addEventListener("rms:atualizar", buscar);
    return () => {
      ativo = false;
      clearInterval(timer);
      window.removeEventListener("rms:atualizar", buscar);
    };
  }, [pathname]);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => {
      if (!painel.current?.contains(e.target) && !botao.current?.contains(e.target)) setAberto(false);
    };
    const esc = (e) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const abrir = (n) => {
    setAberto(false);
    if (!n.lida) {
      setDados((d) => ({ naoLidas: d.naoLidas - 1, itens: d.itens.map((i) => (i.id === n.id ? { ...i, lida: true } : i)) }));
      api.post(`/api/notificacoes/${n.id}/lida`).catch(() => {});
    }
    navigate(`/processos/${n.processoId}`);
  };

  const marcarTodas = async () => {
    await api.post("/api/notificacoes/lidas").catch(() => {});
    setDados((d) => ({ naoLidas: 0, itens: d.itens.map((i) => ({ ...i, lida: true })) }));
  };

  const hoje = hojeLocal();
  const diasDeAtraso = (prazo) => Math.round((new Date(`${hoje}T00:00:00Z`) - new Date(`${prazo}T00:00:00Z`)) / 86400000);
  const texto = (n) => {
    const d = diasDeAtraso(n.prazo);
    return d <= 0 ? "O prazo de entrega é hoje" : `Em atraso há ${d} ${d === 1 ? "dia" : "dias"} (prazo: ${fmtData(n.prazo)})`;
  };

  return (
    <>
      <button ref={botao} type="button" className="sino" onClick={() => setAberto(!aberto)} aria-expanded={aberto} aria-label={`Notificações: ${dados.naoLidas} não lidas`} title="Notificações">
        <Icone nome="sino" />
        {dados.naoLidas > 0 && <span className="contador">{dados.naoLidas > 99 ? "99+" : dados.naoLidas}</span>}
      </button>
      {aberto &&
        createPortal(
          <div ref={painel} className={`painel-notif${recolhido ? " recolhido" : ""}`} role="dialog" aria-label="Notificações">
            <div className="painel-notif-topo">
              <strong>Notificações</strong>
              {dados.naoLidas > 0 && <button type="button" onClick={marcarTodas}>Marcar todas como lidas</button>}
            </div>
            {dados.itens.length === 0 ? (
              <p className="vazio">Nenhuma notificação.</p>
            ) : (
              <ul>
                {dados.itens.map((n) => (
                  <li key={n.id}>
                    <button type="button" className={n.lida ? "lida" : ""} onClick={() => abrir(n)}>
                      <strong>{texto(n)}</strong>
                      <span>{n.numero} · {n.titulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
