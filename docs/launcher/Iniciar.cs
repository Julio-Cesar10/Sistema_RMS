using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;

[assembly: AssemblyTitle("Sistema RMS")]
[assembly: AssemblyProduct("Sistema RMS - Gestao de Protocolos")]
[assembly: AssemblyCompany("Roseno, Morais & Sexto Advogados")]
[assembly: AssemblyVersion("1.0.0.0")]

class Iniciar
{
    const int Porta = 3001;

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern int MessageBox(IntPtr janela, string texto, string titulo, uint tipo);

    static void Aviso(string texto)
    {
        try { MessageBox(IntPtr.Zero, texto, "Sistema RMS", 0x40); }
        catch { Console.WriteLine(texto); }
    }

    static bool Aberta()
    {
        try
        {
            using (TcpClient c = new TcpClient())
            {
                c.Connect("127.0.0.1", Porta);
                return true;
            }
        }
        catch { return false; }
    }

    static void Abrir()
    {
        try { Process.Start("http://localhost:" + Porta); }
        catch { }
    }

    static int Executar(string exe, string argumentos, string pasta)
    {
        ProcessStartInfo i = new ProcessStartInfo(exe, argumentos);
        i.WorkingDirectory = pasta;
        i.UseShellExecute = false;
        i.CreateNoWindow = true;
        using (Process p = Process.Start(i))
        {
            p.WaitForExit();
            return p.ExitCode;
        }
    }

    static void Main()
    {
        string raiz = AppDomain.CurrentDomain.BaseDirectory;
        string backend = Path.Combine(raiz, "backend");
        string frontend = Path.Combine(raiz, "frontend");

        if (Aberta()) { Abrir(); return; }

        string node = Path.Combine(raiz, "node", "node.exe");
        bool portatil = File.Exists(node);
        if (!portatil) node = "node";

        if (!File.Exists(Path.Combine(frontend, "dist", "index.html")))
        {
            if (portatil)
            {
                Aviso("Arquivos do sistema incompletos. Extraia novamente a pasta inteira do arquivo .zip.");
                return;
            }
            Aviso("Preparando o sistema pela primeira vez. Pode levar alguns minutos: clique em OK e aguarde o navegador abrir.");
            if (!Directory.Exists(Path.Combine(frontend, "node_modules")) && Executar("cmd.exe", "/c npm install", frontend) != 0) { Aviso("Falha ao executar 'npm install' na pasta frontend."); return; }
            if (Executar("cmd.exe", "/c npm run build", frontend) != 0) { Aviso("Falha ao executar 'npm run build' na pasta frontend."); return; }
        }
        if (!portatil && !Directory.Exists(Path.Combine(backend, "node_modules")))
        {
            if (Executar("cmd.exe", "/c npm install", backend) != 0) { Aviso("Falha ao executar 'npm install' na pasta backend."); return; }
        }

        ProcessStartInfo info = new ProcessStartInfo(node, "--env-file=.env src/server.js");
        info.WorkingDirectory = backend;
        info.UseShellExecute = false;
        info.CreateNoWindow = true;

        string dados = Path.Combine(raiz, "dados");
        string mysqld = Path.Combine(raiz, "mysql", "bin", "mysqld.exe");
        if (File.Exists(mysqld))
        {
            info.EnvironmentVariables["MYSQL_EXE"] = mysqld;
            info.EnvironmentVariables["MYSQL_BASE"] = Path.Combine(raiz, "mysql");
            info.EnvironmentVariables["MYSQL_DADOS"] = Path.Combine(dados, "mysql");
            info.EnvironmentVariables["MYSQL_LOG"] = Path.Combine(dados, "mysql-erro.log");
        }
        info.EnvironmentVariables["PARAR_ARQUIVO"] = Path.Combine(Directory.Exists(dados) ? dados : backend, "parar.txt");

        Process servidor = Process.Start(info);
        for (int i = 0; i < 120 && !Aberta() && !servidor.HasExited; i++) Thread.Sleep(500);

        if (!Aberta())
        {
            Aviso(portatil
                ? "O sistema nao iniciou. Veja o arquivo dados\\mysql-erro.log."
                : "O sistema nao iniciou. Confira se o MySQL esta ligado e se o arquivo backend\\.env esta correto.");
            return;
        }
        Abrir();
    }
}
