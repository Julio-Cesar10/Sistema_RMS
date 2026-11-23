const toDate = (d) => new Date(d.length === 10 ? `${d}T00:00` : d);
export const fmtData = (d) => (d ? toDate(d).toLocaleDateString("pt-BR") : "—");
export const fmtDataHora = (d) => (d ? toDate(d).toLocaleString("pt-BR") : "—");
