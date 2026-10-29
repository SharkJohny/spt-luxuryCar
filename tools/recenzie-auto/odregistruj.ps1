# Vypne alebo zrusi dennu automatiku recenzii Google (uloha "LCD Recenzie Google" v Planovaci uloh).
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\recenzie-auto\odregistruj.ps1            # zrusi ulohu
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\recenzie-auto\odregistruj.ps1 -LenVypni  # docasne vypne (Enable-ScheduledTask ju zapne)
#
# Klon automatiky (Desktop\spt-luxuryCar-recenzie-beh) ani logy/stav (Documents\LCD-recenzie-auto) sa nemazu.
# Web tym nic nestrati: ukazuje posledne nahrate recenzie, len nove nepribudnu.
param([switch]$LenVypni)
$ErrorActionPreference = 'Stop'
$Nazov = 'LCD Recenzie Google'
$t = Get-ScheduledTask -TaskName $Nazov -ErrorAction SilentlyContinue
if (-not $t) { Write-Host "Uloha '$Nazov' nie je zaregistrovana - nic na robenie."; return }
if ($LenVypni) {
  Disable-ScheduledTask -TaskName $Nazov | Out-Null
  Write-Host "Uloha '$Nazov' je VYPNUTA. Zapnut: Enable-ScheduledTask -TaskName '$Nazov'"
} else {
  Unregister-ScheduledTask -TaskName $Nazov -Confirm:$false
  Write-Host "Uloha '$Nazov' je ZRUSENA. Znova: tools\recenzie-auto\registruj.ps1"
}
