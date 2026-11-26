import { useTitulo } from "../services/titulo.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TabelaProtocolos } from "../components/Ui.jsx";
import { STATUS, useProtocolos } from "../services/contexto.js";

export default function Processos() {
  useTitulo("Processos");
  const { lista, carregar } = useProtocolos();
  useEffect(() => {
    carregar();
  }, [carregar]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [resp, setResp] = useState("");
  const [prazo, setPrazo] = useState("");

  const responsaveis = [...new Set(lista.flatMap((p) => p.responsaveis))];
  const [agora] = useState(() => Date.now());
  const dia = (n) => new Date(agora + n * 864e5).toISOString().slice(0, 10);
  const termo = busca.trim().toLowerCase();

  const itens = lista.filter(
    (p) =>
      (!termo || [p.numero, p.titulo, ...p.responsaveis].some((v) => v.toLowerCase().includes(termo))) &&
      (!status || p.status === status) &&
      (!resp || p.responsaveis.includes(resp)) &&
      (!prazo || (prazo === "vencidos" ? p.prazo < dia(0) : p.prazo >= dia(0) && p.prazo <= dia(Number(prazo))))
  );

  return (
    <>
      <div className="topo">
        <h1>Processos</h1>
        <Link className="btn" to="/processos/novo">Novo protocolo</Link>
      </div>
      <div className="filtros">
        <input type="search" placeholder="Buscar por número, título ou responsável" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={resp} onChange={(e) => setResp(e.target.value)}>
          <option value="">Todos os responsáveis</option>
          {responsaveis.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={prazo} onChange={(e) => setPrazo(e.target.value)}>
          <option value="">Qualquer prazo</option>
          <option value="vencidos">Vencidos</option>
          <option value="7">Próximos 7 dias</option>
          <option value="30">Próximos 30 dias</option>
        </select>
      </div>
      <TabelaProtocolos itens={itens} />
    </>
  );
}
