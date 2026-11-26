import { useCallback, useState } from "react";
import { api } from "./api.js";
import { Contexto } from "./contexto.js";

export function ProtocolosProvider({ children }) {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      setLista(await api.get("/api/processos"));
      setErro("");
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const buscar = (id) => lista.find((p) => p.id === Number(id));

  const salvar = async (dados, id) => {
    const r = id ? await api.put(`/api/processos/${id}`, dados) : await api.post("/api/processos", dados);
    await carregar();
    return r.id;
  };

  const remover = async (id) => {
    await api.del(`/api/processos/${id}`);
    await carregar();
  };

  return <Contexto.Provider value={{ lista, carregando, erro, carregar, buscar, salvar, remover }}>{children}</Contexto.Provider>;
}
