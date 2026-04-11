@echo off
TITLE Hearthstone Card Explorer
:: Wechselt in das Verzeichnis, in dem dieses Skript liegt
cd /d "%~dp0"

:: Prüft, ob die Abhängigkeiten bereits installiert sind
IF NOT EXIST "node_modules" (
    echo Installiere fehlende Abhaengigkeiten...
    npm install
)

echo Starte Hearthstone Card Explorer...
npm run dev
pause
