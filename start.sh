#!/bin/bash

# Wechselt in das Verzeichnis des Skripts
cd "$(dirname "$0")"

# Prüft, ob die Abhängigkeiten bereits installiert sind
if [ ! -d "node_modules" ]; then
    echo "Installiere fehlende Abhängigkeiten..."
    npm install
fi

echo "Starte Hearthstone Card Explorer..."
npm run dev
