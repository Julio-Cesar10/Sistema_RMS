const icones = {
  menu: "M3 6h18M3 12h18M3 18h18",
  inicio: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  lista: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  novo: "M12 5v14M5 12h14",
  sair: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  sino: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
};

export default function Icone({ nome }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icones[nome]} />
    </svg>
  );
}
