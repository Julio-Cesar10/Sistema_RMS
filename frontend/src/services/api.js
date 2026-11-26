async function pedir(metodo, caminho, corpo) {
  const opcoes = { method: metodo, headers: {} };
  if (corpo instanceof FormData) {
    opcoes.body = corpo;
  } else if (corpo !== undefined) {
    opcoes.headers["Content-Type"] = "application/json";
    opcoes.body = JSON.stringify(corpo);
  }

  let resposta;
  try {
    resposta = await fetch(caminho, opcoes);
  } catch {
    throw new Error("Não foi possível conectar ao servidor.");
  }

  const dados = await resposta.json().catch(() => ({}));
  if (resposta.status === 401 && caminho !== "/api/login") {
    sessionStorage.removeItem("rms_auth");
    window.location.assign("/login");
  }
  if (!resposta.ok) throw new Error(dados.erro || "Erro inesperado.");
  return dados;
}

export const api = {
  get: (caminho) => pedir("GET", caminho),
  post: (caminho, corpo) => pedir("POST", caminho, corpo),
  put: (caminho, corpo) => pedir("PUT", caminho, corpo),
  del: (caminho) => pedir("DELETE", caminho),
};
