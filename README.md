# Hearthstone Card Explorer

Ein Tool zum Abrufen, Anzeigen und Exportieren von Hearthstone-Kartendaten über die offizielle Battle.net API.

## 🚀 Schnellstart

### 1. API-Schlüssel konfigurieren
Erstelle eine Datei namens `.env` im Hauptverzeichnis (du kannst die `.env.example` als Vorlage kopieren) und trage deine Blizzard API-Zugangsdaten ein:

```env
BLIZZARD_CLIENT_ID=DEINE_CLIENT_ID
BLIZZARD_CLIENT_SECRET=DEIN_CLIENT_SECRET
BLIZZARD_REGION=eu
GEMINI_API_KEY=DEIN_GEMINI_KEY
```

Deine Blizzard-Keys erhältst du unter [develop.battle.net](https://develop.battle.net/access/clients).

### 2. App starten

#### Windows
Doppelklicke auf die Datei **`start.bat`**.

#### macOS / Linux
1. Öffne das Terminal.
2. Mache das Skript ausführbar: `chmod +x start.sh`
3. Starte das Skript: `./start.sh`

## 🛠 Features
- **Vollständiger Datenabruf:** Lädt alle Karten inklusive Metadaten (Sets, Klassen, Typen).
- **Format-Erkennung:** Automatische Unterscheidung zwischen Standard und Wild.
- **Export:** Exportiere die gesamte Kartenliste als **JSON** oder **CSV**.
- **Filter:** Suche nach Namen oder filtere nach Klasse und Format.

## 📦 Technologien
- **Backend:** Node.js, Express, Axios (OAuth 2.0 Flow)
- **Frontend:** React, Tailwind CSS, Lucide Icons, Framer Motion
- **Build-Tool:** Vite
