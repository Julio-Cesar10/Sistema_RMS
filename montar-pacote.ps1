param(
    [string]$MysqlBase = "C:\Program Files\MySQL\MySQL Server 8.0"
)

$ErrorActionPreference = "Stop"
$raiz = $PSScriptRoot
$saida = Join-Path $env:TEMP "SistemaRMS-pacote\SistemaRMS"
$zip = Join-Path ([Environment]::GetFolderPath("Desktop")) "SistemaRMS.zip"
$porta = 3307

if (-not (Test-Path "$MysqlBase\bin\mysqld.exe")) { throw "MySQL nao encontrado em $MysqlBase. Use -MysqlBase para informar a pasta." }
$node = (Get-Command node).Source

$usuario = Read-Host "Usuario do administrador do sistema"
$senhaAdmin = Read-Host "Senha do administrador do sistema"
if (-not $usuario -or -not $senhaAdmin) { throw "Informe o usuario e a senha." }

function NovaSenha {
    $chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    $b = New-Object byte[] 24
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    -join ($b | ForEach-Object { $chars[$_ % $chars.Length] })
}

function Executar($exe, $argumentos, $pasta, $ignorarErro) {
    $p = Start-Process -FilePath $exe -ArgumentList $argumentos -WorkingDirectory $pasta -Wait -PassThru -NoNewWindow
    if (-not $ignorarErro -and $p.ExitCode -ne 0) { throw "Falhou (codigo $($p.ExitCode)): $exe $argumentos" }
}

function Copiar($origem, $destino, $extra) {
    robocopy $origem $destino /E /NFL /NDL /NJH /NJS /NP @extra | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar $origem" }
}

function EsperarPorta {
    for ($i = 0; $i -lt 90; $i++) {
        try {
            $c = New-Object Net.Sockets.TcpClient
            $c.Connect("127.0.0.1", $porta)
            $c.Close()
            return
        } catch { Start-Sleep -Seconds 1 }
    }
    throw "O MySQL nao respondeu na porta $porta."
}

Write-Host "1/7 Gerando a interface (frontend)..."
Executar "cmd.exe" "/c npm ci" "$raiz\frontend" $false
Executar "cmd.exe" "/c npm run build" "$raiz\frontend" $false

if (Test-Path $saida) { Remove-Item $saida -Recurse -Force }
New-Item -ItemType Directory -Force -Path "$saida\node", "$saida\dados", "$saida\backend", "$saida\frontend", "$saida\database" | Out-Null

Write-Host "2/7 Copiando Node.js e MySQL..."
Copy-Item $node "$saida\node\node.exe"
Copiar "$MysqlBase\bin" "$saida\mysql\bin" @("/XF", "*.pdb")
Copiar "$MysqlBase\lib" "$saida\mysql\lib" @("/XF", "*.pdb")
Copiar "$MysqlBase\share" "$saida\mysql\share" @()

Write-Host "3/7 Copiando o sistema..."
Copiar "$raiz\backend\src" "$saida\backend\src" @()
Copiar "$raiz\backend\scripts" "$saida\backend\scripts" @()
Copy-Item "$raiz\backend\package.json", "$raiz\backend\package-lock.json" "$saida\backend"
Executar "cmd.exe" "/c npm ci --omit=dev" "$saida\backend" $false
Copiar "$raiz\frontend\dist" "$saida\frontend\dist" @()
Copy-Item "$raiz\database\schema.sql" "$saida\database"
Copy-Item "$raiz\Sistema RMS.exe", "$raiz\Encerrar Sistema RMS.exe" $saida
$leia = @'
SISTEMA RMS - Gestao de Protocolos
Roseno, Morais & Sexto Advogados

COMO USAR
1. Extraia a pasta inteira do arquivo .zip para um local simples, por exemplo C:\SistemaRMS
   (nao use a pasta Arquivos de Programas nem rode de dentro do .zip).
2. De um duplo clique em "Sistema RMS.exe". O sistema abre no navegador em http://localhost:3001
3. Entre com o usuario e a senha do administrador.
4. Para encerrar, use "Encerrar Sistema RMS.exe".

OPCIONAL
- Para ter um atalho na Area de Trabalho: botao direito em "Sistema RMS.exe", Enviar para, Area de trabalho.
- Para abrir junto com o Windows: tecle Win+R, digite shell:startup e coloque la o atalho.

REQUISITOS
- Windows 10 ou 11 de 64 bits. Nao precisa instalar nada.
- O Windows pode mostrar um aviso de seguranca na primeira vez. Clique em "Mais informacoes"
  e depois em "Executar assim mesmo". Se o antivirus bloquear, libere a pasta do sistema.

ONDE FICAM OS DADOS
- dados\          banco de dados
- backend\storage documentos anexados aos processos
Para fazer copia de seguranca, encerre o sistema e copie essas duas pastas.
'@
Set-Content -Path "$saida\LEIA-ME.txt" -Value $leia -Encoding ASCII

Write-Host "4/7 Criando o banco de dados..."
$mysqld = "$saida\mysql\bin\mysqld.exe"
$cliente = "$saida\mysql\bin\mysql.exe"
$dados = "$saida\dados\mysql"
$base = "$saida\mysql"
Executar $mysqld "--initialize-insecure --basedir=`"$base`" --datadir=`"$dados`"" $saida $false

$servidor = Start-Process -FilePath $mysqld -PassThru -WindowStyle Hidden -ArgumentList "--basedir=`"$base`" --datadir=`"$dados`" --port=$porta --bind-address=127.0.0.1 --mysqlx=OFF --log-error=`"$saida\dados\mysql-erro.log`""
EsperarPorta

Write-Host "5/7 Criando tabelas e o administrador..."
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "$porta"
$env:DB_USER = "root"
$env:DB_PASSWORD = ""
$env:DB_NAME = "rms_protocolos"
$env:ADMIN_USUARIO = $usuario
$env:ADMIN_SENHA = $senhaAdmin
Executar "$saida\node\node.exe" "scripts\init-db.js" "$saida\backend" $false

Write-Host "6/7 Protegendo o banco com senha..."
$senhaApp = NovaSenha
$senhaRoot = NovaSenha
$sql = "CREATE USER 'rms'@'localhost' IDENTIFIED BY '$senhaApp'; GRANT ALL PRIVILEGES ON rms_protocolos.* TO 'rms'@'localhost'; GRANT SHUTDOWN ON *.* TO 'rms'@'localhost'; ALTER USER 'root'@'localhost' IDENTIFIED BY '$senhaRoot'; FLUSH PRIVILEGES;"
Executar $cliente "-h127.0.0.1 -P$porta -uroot -e `"$sql`"" $saida $false
Executar $cliente "-h127.0.0.1 -P$porta -uroot -p$senhaRoot -e `"SHUTDOWN`"" $saida $true
$servidor.WaitForExit(60000) | Out-Null

$env:ADMIN_USUARIO = ""
$env:ADMIN_SENHA = ""
$linhas = @("PORT=3001", "DB_HOST=127.0.0.1", "DB_PORT=$porta", "DB_USER=rms", "DB_PASSWORD=$senhaApp", "DB_NAME=rms_protocolos")
Set-Content -Path "$saida\backend\.env" -Value $linhas -Encoding ASCII

Write-Host "7/7 Compactando..."
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path $saida -DestinationPath $zip -CompressionLevel Optimal

$tamanho = [math]::Round((Get-Item $zip).Length / 1MB)
Write-Host ""
Remove-Item (Split-Path -Parent $saida) -Recurse -Force
Write-Host "Pronto! Arquivo para enviar (na Area de Trabalho): $zip ($tamanho MB)"
