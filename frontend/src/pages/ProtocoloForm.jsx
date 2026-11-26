import { useTitulo } from "../services/titulo.js";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Etiqueta } from "../components/Ui.jsx";
import { STATUS, useProtocolos } from "../services/contexto.js";

function CampoResponsaveis({ valor, onChange, sugestoes }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");

  const adicionar = () => {
    const n = nome.trim();
    if (n && !valor.includes(n)) onChange([...valor, n]);
    setNome("");
    setAberto(false);
  };

  return (
    <div className="etiquetas-campo">
      {valor.map((n) => <Etiqueta key={n} nome={n} onRemover={(x) => onChange(valor.filter((v) => v !== x))} />)}
      {aberto ? (
        <span className="etiqueta-nova">
          <input
            autoFocus
            list="sugestoes-resp"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionar();
              }
            }}
          />
          <datalist id="sugestoes-resp">
            {sugestoes.filter((s) => !valor.includes(s)).map((s) => <option key={s} value={s} />)}
          </datalist>
          <button type="button" onClick={adicionar}>OK</button>
        </span>
      ) : (
        <button type="button" className="mais" onClick={() => setAberto(true)}>+ Adicionar</button>
      )}
    </div>
  );
}

function Formulario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lista, buscar, salvar } = useProtocolos();
  const existente = id ? buscar(id) : null;
  const [f, setF] = useState(
    existente ? { ...existente } : { numero: "", titulo: "", partes: "", descricao: "", status: "em aberto", dataMovimentacao: "", prazo: "", responsaveis: [] }
  );
  const [erros, setErros] = useState([]);
  const sugestoes = [...new Set(lista.flatMap((p) => p.responsaveis))];
  const set = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  useTitulo(existente ? "Editar protocolo" : "Novo protocolo");

  if (id && !existente) return <p className="vazio">Protocolo não encontrado.</p>;

  const enviar = async (e) => {
    e.preventDefault();
    const er = [];
    if (!f.numero.trim()) er.push("Informe o número do protocolo.");
    else if (lista.some((p) => p.numero === f.numero.trim() && p.id !== existente?.id)) er.push("Já existe um protocolo com este número.");
    if (!f.titulo.trim()) er.push("Informe o título.");
    if (!f.prazo) er.push("Informe o prazo de entrega.");
    setErros(er);
    if (er.length) return;
    const dados = { numero: f.numero.trim(), titulo: f.titulo.trim(), partes: f.partes, descricao: f.descricao, status: f.status, dataMovimentacao: f.dataMovimentacao, prazo: f.prazo, responsaveis: f.responsaveis };
    try {
      navigate(`/processos/${await salvar(dados, existente?.id)}`);
    } catch (x) {
      setErros([x.message]);
    }
  };

  return (
    <>
      <h1>{existente ? `Editar protocolo ${existente.numero}` : "Novo protocolo"}</h1>
      <form className="formulario" onSubmit={enviar} noValidate>
        {erros.length > 0 && <ul className="erros">{erros.map((x) => <li key={x}>{x}</li>)}</ul>}
        <label>Número do protocolo *<input value={f.numero} onChange={set("numero")} /></label>
        <label>Título / assunto *<input value={f.titulo} onChange={set("titulo")} /></label>
        <label className="larga">Partes envolvidas<input value={f.partes} onChange={set("partes")} /></label>
        <label className="larga">Descrição<textarea rows="4" value={f.descricao} onChange={set("descricao")} /></label>
        <label>Status *
          <select value={f.status} onChange={set("status")}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
        <label>Data de movimentação<input type="date" value={f.dataMovimentacao} onChange={set("dataMovimentacao")} /></label>
        <label>Prazo de entrega *<input type="date" value={f.prazo} onChange={set("prazo")} /></label>
        <div className="larga">
          <span className="rotulo">Responsáveis</span>
          <CampoResponsaveis valor={f.responsaveis} sugestoes={sugestoes} onChange={(responsaveis) => setF({ ...f, responsaveis })} />
        </div>
        <div className="acoes larga">
          <button className="btn" type="submit">Salvar</button>
          <Link className="btn sec" to={existente ? `/processos/${existente.id}` : "/processos"}>Cancelar</Link>
        </div>
      </form>
    </>
  );
}

export default function ProtocoloForm() {
  const { carregando, carregar } = useProtocolos();
  useEffect(() => {
    carregar();
  }, [carregar]);
  if (carregando) return <p className="vazio">Carregando...</p>;
  return <Formulario />;
}
