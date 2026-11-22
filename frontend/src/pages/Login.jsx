import { useState } from "react";
import "./Login.css";
import logo from "../assets/Emblema dourado RMS em azul-marinho.png";

function Login() {

    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [cadastro, setCadastro] = useState(false);
    return (
        <div className={`auth-pagina ${cadastro ? "cadastro" : ""}`}>

            <div className="login-container form-login" inert={cadastro}>
                <h2>Bem-vindo!</h2>

                <p className="subtitulo">
                    Entre com seus dados para continuar.
                </p>

                <form>
                    <label htmlFor="email">E-mail</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Digite seu e-mail"
                    />

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

                    <a href="#" className="esqueceu-senha">
                        Esqueceu sua senha?
                    </a>

                    <button type="submit">Entrar</button>
                </form>
            </div>

            <div className="Painel">
                <div className="painel-msg" >
                    <img src={logo} alt="Logo RMS" className="painel-logo"/>

                    <h2>{cadastro ? "Já tem conta?" : "Novo por aqui?"}</h2>
                    
                    <p>{cadastro? "Entre com seus dados para continuar":
                                  "Crie sua conta e comece agora mesmo."
                    }</p>
                <button
                type="button"
                className="botaoAnimado"
                onClick={() => setCadastro(!cadastro)}
                > {cadastro ? "Entrar" : "Cadastrar" }
                </button>
                <p className="painel-footer">© 2026 RMS. Todos os direitos reservados.</p>
            </div>
            </div>
            <div className="login-container form-cadastro" inert={!cadastro}>
                <h2>Criar conta</h2>

                <p className="subtitulo">
                    Preencha seus dados para se cadastrar.
                </p>

                <form>
                    <label htmlFor="nome">Nome</label>
                    <input
                        type="text"
                        id="nome"
                        placeholder="Digite Seu nome"
                    />

                    <label htmlFor="Cpf">CPF</label>
                    <input
                        type="text"
                        id="Cpf"
                        placeholder="Digite seu CPF"
                    />

                    <label htmlFor="cad-email">E-mail</label>
                    <input
                        type="email"
                        id="cad-email"
                        placeholder="Digite seu e-mail"
                    />

                    <label htmlFor="cad-senha">Senha</label>

                    <div className="campo-senha">
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            id="cad-senha"
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

                    
                    <button type="submit">Cadastrar</button>
                </form>
            </div>

        </div>
    );
}

export default Login;