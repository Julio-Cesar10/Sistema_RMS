import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Inicio from "./pages/Inicio.jsx";
import Login from "./pages/Login.jsx";
import Processo from "./pages/Processo.jsx";
import ProtocoloForm from "./pages/ProtocoloForm.jsx";
import Processos from "./pages/Processos.jsx";
import { ProtocolosProvider } from "./services/protocolos.jsx";
import "./styles/App.css";

function App() {
    return (
        <ProtocolosProvider>
            <Routes>
                <Route path="/login" element={<div className="pagina"><main className="conteudo"><Login /></main></div>} />
                <Route element={<Layout />}>
                    <Route path="/inicio" element={<Inicio />} />
                    <Route path="/processos" element={<Processos />} />
                    <Route path="/processos/novo" element={<ProtocoloForm key="novo" />} />
                    <Route path="/processos/:id" element={<Processo />} />
                    <Route path="/processos/:id/editar" element={<ProtocoloForm key="editar" />} />
                </Route>
                <Route path="*" element={<Navigate to="/inicio" replace />} />
            </Routes>
        </ProtocolosProvider>
    );
}

export default App;
