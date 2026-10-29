# Ulozi kluc CRM (Supabase secret / service_role) pre automatiku recenzii - aby pri 3. neuspesnom dni
# vedela zalozit ulohu v CRM. Kluc vklada MICHAL SAM do skryteho vstupu (Claude ho nikdy nevidi ani nekopiruje).
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\recenzie-auto\nastav-kluc-crm.ps1
#
# Kluc: Supabase -> projekt CRM (jwhbnsbozakeehnvfcvj) -> Project Settings -> API Keys -> Secret keys ->
#       "+ New secret key", nazov napr. recenzie_pc_2026_10 (vlastny kluc = da sa zrusit samostatne).
# Ulozi sa do  %USERPROFILE%\.claude\secrets\crm.env  (mimo repa, ako ostatne kluce), nikdy nie do gitu.
# Potom hned overi (len citanie): node beh.mjs --over-crm
$ErrorActionPreference = 'Stop'
$priecinok = Join-Path $env:USERPROFILE '.claude\secrets'
$subor = Join-Path $priecinok 'crm.env'
New-Item -ItemType Directory -Force $priecinok | Out-Null
$bezpecny = Read-Host -AsSecureString 'Vloz Supabase secret kluc CRM (Ctrl+V, Enter) - nezobrazi sa'
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($bezpecny)
try { $kluc = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr).Trim() } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if ($kluc.Length -lt 20) { throw 'Kluc je prilis kratky - nic som neulozil.' }
$obsah = "# CRM (kontakty-app) Supabase - pre automatiku recenzii (tools/recenzie-auto/beh.mjs). Nikdy necommitovat.`r`n" +
  "SUPABASE_URL=https://jwhbnsbozakeehnvfcvj.supabase.co`r`nSUPABASE_SERVICE_ROLE_KEY=$kluc`r`n"
[IO.File]::WriteAllText($subor, $obsah, (New-Object Text.UTF8Encoding $false))
$kluc = $null
Write-Host "Ulozene do $subor. Overujem (len citanie)..."
& node (Join-Path $PSScriptRoot 'beh.mjs') --over-crm
