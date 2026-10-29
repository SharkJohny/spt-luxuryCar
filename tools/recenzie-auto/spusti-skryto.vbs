' Spusti dennu automatiku recenzii Google BEZ OKNA (styl okna 0 = skryte) a pocka na koniec.
' Vola ho Planovac uloh "LCD Recenzie Google" (registruj.ps1), vzor: LCD Brain Sync (NAHRAJ-BRAIN-AUTO-SILENT.vbs).
'   wscript.exe spusti-skryto.vbs "C:\Program Files\nodejs\node.exe"
' Vsetko ostatne (log, stav, pocitadlo zlyhani) riesi beh.mjs. Navod: docs\recenzie-automatika.md
Option Explicit
Dim sh, fso, priecinok, node, kod
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
priecinok = fso.GetParentFolderName(WScript.ScriptFullName)
node = "node"
If WScript.Arguments.Count > 0 Then node = WScript.Arguments(0)
kod = sh.Run("""" & node & """ """ & priecinok & "\beh.mjs""", 0, True)
WScript.Quit kod
