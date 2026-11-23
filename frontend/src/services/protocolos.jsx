import { useCallback, useState } from "react";
import { Contexto } from "./contexto.js";

const agora = () => new Date().toISOString();
const dia = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const rotulos = { numero: "Número", titulo: "Título", partes: "Partes", descricao: "Descrição", status: "Status", dataMovimentacao: "Data de movimentação", prazo: "Prazo de entrega", responsaveis: "Responsáveis" };

const exemplo = (id, numero, titulo, partes, status, prazo, responsaveis, acesso) => ({
  id, numero, titulo, partes, descricao: "", status, dataMovimentacao: dia(-3), prazo,
  criadoEm: agora(), salvoEm: agora(), ultimoAcesso: acesso, editadoPor: "Administrador",
  responsaveis, documentos: [], historico: [{ dataHora: agora(), acao: "Criação", campos: "Protocolo criado" }],
});

const inicial = [
  exemplo(1, "0001/2026", "Ação de cobrança", "Maria Souza x Empresa Alfa", "em aberto", dia(10), ["Julio", "Etelvino"], agora()),
  exemplo(2, "0002/2026", "Revisão contratual", "Construtora Beta x Banco Gama", "deferido", dia(30), ["Etelvino"], agora()),
  exemplo(3, "0003/2026", "Inventário", "Espólio de J. Lima", "arquivado", dia(3), [], null),
];

export function ProtocolosProvider({ children }) {
  const [lista, setLista] = useState(inicial);
  const buscar = (id) => lista.find((p) => p.id === Number(id));
  const atualizar = (id, fn) => setLista((l) => l.map((p) => (p.id === id ? fn(p) : p)));

  const salvar = (dados, id) => {
    const t = agora();
    if (!id) {
      const novoId = Math.max(0, ...lista.map((p) => p.id)) + 1;
      setLista((l) => [...l, { ...dados, id: novoId, criadoEm: t, salvoEm: t, ultimoAcesso: null, editadoPor: "Administrador", documentos: [], historico: [{ dataHora: t, acao: "Criação", campos: "Protocolo criado" }] }]);
      return novoId;
    }
    atualizar(id, (p) => {
      const mudou = Object.keys(rotulos).filter((c) => String(p[c]) !== String(dados[c])).map((c) => rotulos[c]);
      return { ...p, ...dados, salvoEm: t, editadoPor: "Administrador", historico: [...p.historico, { dataHora: t, acao: "Edição", campos: mudou.join(", ") || "Nenhum campo alterado" }] };
    });
    return id;
  };

  const registrarAcesso = useCallback((id) => {
    setLista((l) => l.map((p) => (p.id === id ? { ...p, ultimoAcesso: agora() } : p)));
  }, []);

  const anexar = (id, arquivo) => {
    const t = agora();
    const doc = { id: Date.now(), nome: arquivo.name, tipo: arquivo.type || arquivo.name.split(".").pop(), url: URL.createObjectURL(arquivo), incluidoEm: t };
    atualizar(id, (p) => ({ ...p, documentos: [...p.documentos, doc], historico: [...p.historico, { dataHora: t, acao: "Documento anexado", campos: arquivo.name }] }));
  };

  const removerDoc = (id, docId) => {
    atualizar(id, (p) => {
      const doc = p.documentos.find((d) => d.id === docId);
      return { ...p, documentos: p.documentos.filter((d) => d.id !== docId), historico: [...p.historico, { dataHora: agora(), acao: "Documento removido", campos: doc.nome }] };
    });
  };

  const remover = (id) => setLista((l) => l.filter((p) => p.id !== id));

  return <Contexto.Provider value={{ lista, buscar, salvar, registrarAcesso, anexar, removerDoc, remover }}>{children}</Contexto.Provider>;
}
