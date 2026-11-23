import { createContext, useContext } from "react";

export const Contexto = createContext(null);
export const useProtocolos = () => useContext(Contexto);
export const STATUS = ["em aberto", "deferido", "arquivado"];
