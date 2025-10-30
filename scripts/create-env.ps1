<#
  scripts/create-env.ps1

  Prompts for Supabase environment variables and writes a .env file in the repository root.
  This script runs locally and does NOT send your secrets anywhere.

  Usage (PowerShell):
    powershell -ExecutionPolicy Bypass -File .\scripts\create-env.ps1

  The generated .env is ignored by .gitignore.
#>

try {
    $root = Split-Path -Parent $MyInvocation.MyCommand.Path
    # Move up one directory if running from scripts folder
    $projectRoot = Resolve-Path (Join-Path $root "..")
    $envPath = Join-Path $projectRoot '.env'

    Write-Host "Creando .env en: $envPath" -ForegroundColor Cyan

    $supabaseUrl = Read-Host "VITE_SUPABASE_URL (ej: https://abcd.supabase.co)"

    # Read key as SecureString and convert to plain text only to write file locally
    Write-Host "Introduce VITE_SUPABASE_ANON_KEY (se ocultará mientras escribes):"
    $secureKey = Read-Host -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $anonKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

    $bucket = Read-Host "VITE_SUPABASE_BUCKET_NAME (opcional, presiona Enter para 'examenes')"
    if ([string]::IsNullOrWhiteSpace($bucket)) { $bucket = 'examenes' }

    $content = @"
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$anonKey
VITE_SUPABASE_BUCKET_NAME=$bucket
"@

    # Write file with UTF8 encoding
    $content | Out-File -FilePath $envPath -Encoding utf8 -Force

    Write-Host "Archivo .env creado correctamente en $envPath" -ForegroundColor Green
    Write-Host "Recuerda: no compartas este archivo ni subas las claves a repositorios públicos." -ForegroundColor Yellow
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
