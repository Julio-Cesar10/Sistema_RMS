import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useTitulo } from "../services/titulo.js";
import "./Login.css";
import logo from "../assets/emblema-rms.png";

function Login() {
    useTitulo("RMS");
    const navigate = useNavigate();
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");

    const entrar = async (e) => {
        e.preventDefault();
        try {
            await api.post("/api/login", { usuario, senha });
            sessionStorage.setItem("rms_auth", "1");
            navigate("/inicio");
        } catch (x) {
            setErro(x.message);
        }
    };

    return (
        <div className="auth-pagina">
            <div className="login-container form-login">
                <h2>Bem-vindo!</h2>

                <p className="subtitulo">Entre com seus dados para continuar.</p>

                <form onSubmit={entrar}>
                    <label htmlFor="usuario">Usuário</label>
                    <input type="text" id="usuario" placeholder="Digite seu usuário" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} />

                    <label htmlFor="senha">Senha</label>

                    <div className="campo-senha">
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            id="senha"
                            placeholder="Digite sua senha"
                            autoComplete="current-password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                        />

                        <button
                            type="button"
                            className="botao-senha"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                        >
                            {mostrarSenha ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>

                    {erro && <p className="erro-login" role="alert">{erro}</p>}

                    <button type="submit">Entrar</button>
                </form>
            </div>

            <div className="Painel">
                <div className="painel-msg">
                    <img src={logo} alt="Logo RMS" className="painel-logo" />
                    <h2>Realize Login!</h2>
                    <p>Realize o login e acesse a plataforma nesse instante!</p>
                    <p className="painel-footer">© 2026 RMS. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
