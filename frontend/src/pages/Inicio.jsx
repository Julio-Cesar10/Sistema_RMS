import { useTitulo } from "../services/titulo.js";
import { useEffect } from "react";
import { TabelaProtocolos } from "../components/Ui.jsx";
import { STATUS, useProtocolos } from "../services/contexto.js";

export default function Inicio() {
  useTitulo("Página inicial");
  const { lista, carregar } = useProtocolos();
  useEffect(() => {
    carregar();
  }, [carregar]);
  const recentes = lista
    .filter((p) => p.ultimoAcesso)
    .sort((a, b) => b.ultimoAcesso.localeCompare(a.ultimoAcesso))
    .slice(0, 5);

  return (
    <>
      <h1>Página inicial</h1>
      <div className="resumo">
        <div><strong>{lista.length}</strong><span>Total</span></div>
        {STATUS.map((s) => (
          <div key={s}><strong>{lista.filter((p) => p.status === s).length}</strong><span>{s}</span></div>
        ))}
      </div>
      <h2>Acessados recentemente</h2>
      <TabelaProtocolos itens={recentes} />
      <h2>Todos os protocolos</h2>
      <TabelaProtocolos itens={lista} />
    </>
  );
}
