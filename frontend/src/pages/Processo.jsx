import { useTitulo } from "../services/titulo.js";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Etiqueta, Status } from "../components/Ui.jsx";
import { fmtData, fmtDataHora } from "../services/formatar.js";
import { useProtocolos } from "../services/contexto.js";

export default function Processo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buscar, registrarAcesso, anexar, removerDoc, remover } = useProtocolos();
  const p = buscar(id);
  useTitulo(p ? `Processo ${p.numero}` : "Processo");

  useEffect(() => {
    registrarAcesso(Number(id));
  }, [id, registrarAcesso]);

  if (!p) return <p className="vazio">Protocolo não encontrado.</p>;

  const excluir = () => {
    if (window.confirm(`Excluir o protocolo ${p.numero}?`)) {
      remover(p.id);
      navigate("/processos");
    }
  };

  const excluirDoc = (d) => {
    if (window.confirm(`Remover o documento ${d.nome}?`)) removerDoc(p.id, d.id);
  };

  const escolher = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) anexar(p.id, arquivo);
    e.target.value = "";
  };

  const info = [
    ["Status", <Status valor={p.status} />],
    ["Responsáveis", p.responsaveis.length ? p.responsaveis.map((n) => <Etiqueta key={n} nome={n} />) : "—"],
    ["Editado por", p.editadoPor],
    ["Data de movimentação", fmtData(p.dataMovimentacao)],
    ["Prazo de entrega", fmtData(p.prazo)],
    ["Data de criação", fmtDataHora(p.criadoEm)],
    ["Data de salvamento", fmtDataHora(p.salvoEm)],
    ["Último acesso", fmtDataHora(p.ultimoAcesso)],
    ["Partes envolvidas", p.partes || "—"],
    ["Descrição", p.descricao || "—"],
  ];

  return (
    <>
      <div className="topo">
        <h1>{p.numero} · {p.titulo}</h1>
        <div className="acoes">
          <Link className="btn" to={`/processos/${p.id}/editar`}>Editar</Link>
          <button className="btn perigo" type="button" onClick={excluir}>Excluir</button>
        </div>
      </div>

      <h2>Informações do processo</h2>
      <dl className="info">
        {info.map(([rotulo, valor]) => (
          <div key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>
        ))}
      </dl>

      <div className="topo">
        <h2>Documentos arquivados</h2>
        <label className="btn">
          Anexar documento
          <input type="file" hidden onChange={escolher} />
        </label>
      </div>
      {p.documentos.length === 0 ? (
        <p className="vazio">Nenhum documento anexado.</p>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead><tr><th>Nome</th><th>Tipo</th><th>Incluído em</th><th /></tr></thead>
            <tbody>
              {p.documentos.map((d) => (
                <tr key={d.id}>
                  <td>{d.nome}</td>
                  <td>{d.tipo}</td>
                  <td>{fmtDataHora(d.incluidoEm)}</td>
                  <td className="acoes">
                    <a href={d.url} target="_blank" rel="noreferrer">Abrir</a>
                    <button type="button" className="link-perigo" onClick={() => excluirDoc(d)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Histórico de edições e movimentações</h2>
      <ol className="historico">
        {p.historico.map((h, i) => (
          <li key={i}><time>{fmtDataHora(h.dataHora)}</time> <strong>{h.acao}</strong> — {h.campos}</li>
        ))}
      </ol>
    </>
  );
}
