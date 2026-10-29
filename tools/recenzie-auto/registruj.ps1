# Zaregistruje dennu automatiku recenzii Google v Planovaci uloh (uloha "LCD Recenzie Google").
# Spustat AZ PO pushi tools/recenzie-auto do main (beh ide z klonu automatiky na origin/main).
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\recenzie-auto\registruj.ps1          # pripravi klon + zaregistruje
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\recenzie-auto\registruj.ps1 -Skus    # len vypise, co by spravil
#
# Uloha: denne 8:30 + 15 min po prihlaseni (zmeskany beh dobehne co najskor), len ked je Michal prihlaseny
# (scraper potrebuje Chrome), bez okna (wscript + spusti-skryto.vbs), nizsia priorita, max 1 h, nikdy 2 naraz.
# Ak dnes uz raz uspesne prebehla, dalsie spustenie v ten isty den hned skonci (beh.mjs).
# Odregistrovanie: tools\recenzie-auto\odregistruj.ps1. Navod: docs\recenzie-automatika.md
param(
  [string]$Repo = 'C:\Users\M\Desktop\spt-luxuryCar-recenzie-beh',
  [string]$Cas = '08:30',
  [switch]$Skus
)
$ErrorActionPreference = 'Stop'
$Nazov = 'LCD Recenzie Google'
$node = (Get-Command node -ErrorAction Stop).Source
$behZdroj = Join-Path $PSScriptRoot 'beh.mjs'

# 1) klon automatiky (git clone ak chyba) + reset na origin/main; overi, ze automatika uz je v main
if ($Skus) {
  Write-Host "[skuska] node `"$behZdroj`" --len-priprav --repo `"$Repo`"  (klon + reset na origin/main)"
} else {
  & $node $behZdroj --len-priprav --repo $Repo
  if ($LASTEXITCODE -ne 0) { throw "Priprava klonu $Repo zlyhala (exit $LASTEXITCODE) - pozri vypis vyssie. Nic nie je zaregistrovane." }
}
$vbs = Join-Path $Repo 'tools\recenzie-auto\spusti-skryto.vbs'

# 2) uloha v Planovaci
$pouzivatel = "$env:USERDOMAIN\$env:USERNAME"
$akcia = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"{0}" "{1}"' -f $vbs, $node) -WorkingDirectory $Repo
$denne = New-ScheduledTaskTrigger -Daily -At $Cas
$prihlasenie = New-ScheduledTaskTrigger -AtLogOn -User $pouzivatel
$prihlasenie.Delay = 'PT15M'
$nastavenia = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew -Priority 7
$kto = New-ScheduledTaskPrincipal -UserId $pouzivatel -LogonType Interactive -RunLevel Limited
$popis = 'Recenzie Google -> web LCD (assets/js/reviews-data.js v main). Klon: ' + $Repo + '. Logy: Documents\LCD-recenzie-auto\logy. Navod: docs\recenzie-automatika.md v repe spt-luxuryCar.'

if ($Skus) {
  $uloha = New-ScheduledTask -Action $akcia -Trigger @($denne, $prihlasenie) -Settings $nastavenia -Principal $kto -Description $popis
  Write-Host "[skuska] Register-ScheduledTask -TaskName '$Nazov' (NEREGISTRUJEM)"
  Write-Host ("  akcia:    wscript.exe {0}" -f $akcia.Arguments)
  Write-Host ("  priecinok: {0}" -f $akcia.WorkingDirectory)
  Write-Host ("  spustace: denne {0} | po prihlaseni {1} + {2}" -f $Cas, $pouzivatel, $prihlasenie.Delay)
  Write-Host ("  nastavenia: StartWhenAvailable={0} Limit={1} Instancie={2} Priorita={3} Prihlasenie={4}" -f `
    $uloha.Settings.StartWhenAvailable, $uloha.Settings.ExecutionTimeLimit, $uloha.Settings.MultipleInstances, $uloha.Settings.Priority, $kto.LogonType)
  if (Get-ScheduledTask -TaskName $Nazov -ErrorAction SilentlyContinue) { Write-Host "  (uloha '$Nazov' uz existuje - ostry beh ju prepise)" }
  return
}

Register-ScheduledTask -TaskName $Nazov -Action $akcia -Trigger @($denne, $prihlasenie) -Settings $nastavenia `
  -Principal $kto -Description $popis -Force | Out-Null
$t = Get-ScheduledTask -TaskName $Nazov
$i = $t | Get-ScheduledTaskInfo
Write-Host "Zaregistrovane: '$Nazov' ($($t.State)), dalsi beh: $($i.NextRunTime)"
Write-Host "Rucne spustit hned: Start-ScheduledTask -TaskName '$Nazov'   | Log: $env:USERPROFILE\Documents\LCD-recenzie-auto\logy"
