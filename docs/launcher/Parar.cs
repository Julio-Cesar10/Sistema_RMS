using System;
using System.IO;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;

[assembly: AssemblyTitle("Encerrar Sistema RMS")]
[assembly: AssemblyProduct("Sistema RMS - Gestao de Protocolos")]
[assembly: AssemblyCompany("Roseno, Morais & Sexto Advogados")]
[assembly: AssemblyVersion("1.0.0.0")]

class Parar
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

    static string Raiz()
    {
        string pasta = AppDomain.CurrentDomain.BaseDirectory;
        if (Directory.Exists(Path.Combine(pasta, "backend"))) return pasta;
        DirectoryInfo pai = Directory.GetParent(pasta.TrimEnd(Path.DirectorySeparatorChar));
        if (pai != null && Directory.Exists(Path.Combine(pai.FullName, "backend"))) return pai.FullName + Path.DirectorySeparatorChar;
        return pasta;
    }

    static void Main()
    {
        string raiz = Raiz();
        string dados = Path.Combine(raiz, "dados");
        string pasta = Directory.Exists(dados) ? dados : Path.Combine(raiz, "backend");

        if (!Aberta()) { Aviso("O Sistema RMS nao esta em execucao."); return; }
        if (!Directory.Exists(pasta)) { Aviso("Execute este arquivo dentro da pasta do sistema."); return; }

        File.WriteAllText(Path.Combine(pasta, "parar.txt"), "parar");
        for (int i = 0; i < 60 && Aberta(); i++) Thread.Sleep(500);
        Aviso(Aberta() ? "O sistema ainda esta encerrando. Aguarde mais alguns segundos." : "Sistema RMS encerrado.");
    }
}
