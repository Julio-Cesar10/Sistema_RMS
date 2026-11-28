$ErrorActionPreference = "Stop"

$csc = "$env:windir\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { $csc = "$env:windir\Microsoft.NET\Framework\v4.0.30319\csc.exe" }
if (-not (Test-Path $csc)) { throw "Compilador do .NET Framework nao encontrado neste computador." }

$raiz = Split-Path -Parent $PSScriptRoot
$fontes = Join-Path $raiz "docs\launcher"
$icone = Join-Path $fontes "icone.ico"

function Compilar($arquivo, $saida) {
    $argumentos = "/nologo /target:winexe /win32icon:`"$icone`" /out:`"$PSScriptRoot\$saida`" `"$fontes\$arquivo`""
    $p = Start-Process -FilePath $csc -ArgumentList $argumentos -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { throw "Falha ao compilar $arquivo" }
}

Compilar "Iniciar.cs" "Sistema RMS.exe"
Compilar "Parar.cs" "Encerrar Sistema RMS.exe"
Write-Host "Pronto! Executaveis criados em $PSScriptRoot"
