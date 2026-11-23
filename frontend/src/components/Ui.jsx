import { Link } from "react-router-dom";
import { fmtData, fmtDataHora } from "../services/formatar.js";

const cor = (nome) => {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 45% 40%)`;
};

export function Etiqueta({ nome, onRemover }) {
  return (
    <span className="etiqueta" style={{ background: cor(nome) }}>
      {nome}
      {onRemover && <button type="button" aria-label={`Remover ${nome}`} onClick={() => onRemover(nome)}>×</button>}
    </span>
  );
}

export const Status = ({ valor }) => <span className={`status ${valor.replace(" ", "-")}`}>{valor}</span>;

export function TabelaProtocolos({ itens }) {
  if (!itens.length) return <p className="vazio">Nenhum protocolo encontrado.</p>;
  return (
    <div className="tabela-rolagem">
      <table>
        <thead>
          <tr><th>Protocolo</th><th>Título</th><th>Status</th><th>Responsáveis</th><th>Prazo</th><th>Último acesso</th><th>Última edição</th></tr>
        </thead>
        <tbody>
          {itens.map((p) => (
            <tr key={p.id}>
              <td><Link to={`/processos/${p.id}`}>{p.numero}</Link></td>
              <td>{p.titulo}</td>
              <td><Status valor={p.status} /></td>
              <td>{p.responsaveis.map((n) => <Etiqueta key={n} nome={n} />)}</td>
              <td>{fmtData(p.prazo)}</td>
              <td>{fmtDataHora(p.ultimoAcesso)}</td>
              <td>{fmtDataHora(p.salvoEm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
