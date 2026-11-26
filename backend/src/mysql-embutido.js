import { spawn } from "node:child_process";
import net from "node:net";

const esperarPorta = (porta, limiteMs) =>
  new Promise((ok, falha) => {
    const fim = Date.now() + limiteMs;
    const tentar = () => {
      const s = net.connect(porta, "127.0.0.1");
      s.on("connect", () => {
        s.destroy();
        ok();
      });
      s.on("error", () => {
        s.destroy();
        if (Date.now() > fim) falha(new Error("O MySQL não respondeu a tempo."));
        else setTimeout(tentar, 500);
      });
    };
    tentar();
  });

export async function iniciarMysql({ exe, base, dados, porta, log }) {
  const filho = spawn(
    exe,
    [`--basedir=${base}`, `--datadir=${dados}`, `--port=${porta}`, "--bind-address=127.0.0.1", "--mysqlx=OFF", `--log-error=${log}`],
    { windowsHide: true, stdio: "ignore" }
  );
  filho.on("error", (e) => console.error("Falha ao iniciar o MySQL:", e.message));
  await esperarPorta(porta, 90000);
  return filho;
}
