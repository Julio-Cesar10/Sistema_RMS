import { useEffect } from "react";

export const useTitulo = (texto) => {
  useEffect(() => {
    document.title = texto;
  }, [texto]);
};
