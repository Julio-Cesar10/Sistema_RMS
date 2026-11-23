import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTitulo } from "../services/titulo.js";
import "./Login.css";
import logo from "../assets/emblema-rms.png";

function Login() {
    useTitulo("RMS");
    const navigate = useNavigate();
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const entrar = (e) => {
        e.preventDefault();
        sessionStorage.setItem("rms_auth", "1");
        navigate("/inicio");
    };

    return (
        <div className="auth-pagina">
            <div className="login-container form-login">
                <h2>Bem-vindo!</h2>

                <p className="subtitulo">Entre com seus dados para continuar.</p>

                <form onSubmit={entrar}>
                    <label htmlFor="email">E-mail</label>
                    <input type="email" id="email" placeholder="Digite seu e-mail" />

                    <label htmlFor="senha">Senha</label>

                    <div className="campo-senha">
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            id="senha"
                            placeholder="Digite sua senha"
                        />

                        <button
                            type="button"
                            className="botao-senha"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                        >
                            {mostrarSenha ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>

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
