# NETZWERKPATCH

Browserbasiertes Netzwerk-Dokumentationstool für Switch-Port- und VLAN-Verwaltung.
Kein Server, keine Abhängigkeiten — eine einzige HTML-Datei.

**Version:** v0.2.9 · [![App öffnen](https://img.shields.io/badge/App-%C3%B6ffnen-4a90e8?style=flat-square)](https://m4dm0nky.github.io/Netzwerkpatch/netzwerkpatch.html)

> **Direktlink:** [https://m4dm0nky.github.io/Netzwerkpatch/netzwerkpatch.html](https://m4dm0nky.github.io/Netzwerkpatch/netzwerkpatch.html)

## Features

- Visuelle Patch-Ansicht mit realistischen Switch-Karten (RJ45 + SFP-Ports)
- VLAN-Verwaltung: Anlegen, Bearbeiten, Löschen mit Farbkodierung
- Port-Konfiguration per Klick-Popover (Mode: disabled / access / trunk)
- Drag & Drop: VLAN aus Sidebar auf Port ziehen
- Schematische Tabellen-Ansicht aller Ports mit VLAN-Info
- Druckexport (eigenes Print-Fenster)
- Speichern via FileSystem Access API oder Download als `.json`
- Auto-Save in `localStorage` (alle 90 Sekunden)
- Rückwärtskompatibilität beim Laden älterer Projektdateien

## Schnellstart

```bash
python3 build.py        # Einmalig bauen
open netzwerkpatch.html # Im Browser öffnen
```

Oder einfach `netzwerkpatch.html` direkt im Browser öffnen — keine Installation nötig.

## Build

```bash
python3 build.py
```

`build.py` liest `src/template.html`, bündelt alle CSS- und JS-Dateien und schreibt `netzwerkpatch.html`.

Ausgabedatei: `netzwerkpatch.html` (Single-File, direkt deploybar)

## Projektstruktur

```
netzwerkpatch/
├── build.py              # Build-Skript
├── netzwerkpatch.html    # Fertige Single-File App (Build-Output)
├── src/
│   └── template.html     # HTML-Template mit BUILD:CSS / BUILD:JS Platzhaltern
├── css/
│   ├── variables.css     # CSS Custom Properties, Design-Token
│   ├── layout.css        # Header, Sidebar, Main, Tabs
│   ├── rack.css          # Switch-Karten, Ports (RJ45, SFP), 7-Segment-Display
│   ├── patch-table.css   # Schematische Tabelle
│   ├── vlan-manager.css  # VLAN-Manager Tab + Popover + Custom Select
│   ├── modal.css         # Modale Dialoge
│   └── misc.css          # Toast, Print, sonstige Hilfsstile
└── js/
    ├── state.js          # APP_VERSION, globaler State, Utilities
    ├── ui.js             # Modal, Tab, Toast, Projektname-Dialog
    ├── device-render.js  # Switch-Karten Rendering, 7-Segment-Display
    ├── device-crud.js    # Gerät anlegen / löschen / duplizieren
    ├── vlan.js           # VLAN CRUD, Sidebar-Panel, Popover, Custom Select
    ├── patch.js          # Port-VLAN-Zuweisung, Patch-Tabelle
    ├── storage.js        # Speichern / Laden (FileSystem API + Download), Drucken
    └── main.js           # DOMContentLoaded Initialisierung
```

## Dateiformat (`.json`)

```json
{
  "appVersion": "v0.2.9",
  "projectName": "Büronetzwerk",
  "created": "2026-04-18T10:00:00.000Z",
  "savedAt": "2026-04-18T10:05:00.000Z",
  "vlans": [
    { "id": 10, "name": "Office", "color": "#4a90e8", "description": "" }
  ],
  "devices": [
    {
      "id": "uuid",
      "name": "Core Switch",
      "type": "managed-switch",
      "rj45Count": 24,
      "sfpCount": 2,
      "notes": "",
      "ports": [
        {
          "uid": 1,
          "id": 1,
          "type": "rj45",
          "label": "PC-Büro 1",
          "notes": "",
          "active": false,
          "speed": "1G",
          "mode": "access",
          "accessVlan": 10,
          "taggedVlans": [],
          "nativeVlan": 1
        }
      ]
    }
  ]
}
```

## Port-Typen und UIDs

| Typ   | id (Display) | uid (intern)  | Präfix |
|-------|-------------|---------------|--------|
| RJ45  | 1–24        | = id          | P01…P24 |
| SFP   | 1–4         | 100 + id      | S01…S04 |

UIDs verhindern Kollisionen zwischen RJ45- und SFP-Ports innerhalb eines Geräts.

## Port-Modi

| Modus     | Beschreibung |
|-----------|-------------|
| disabled  | Port inaktiv, keine VLAN-Zuweisung |
| access    | Einzelner Access-VLAN |
| trunk     | Native VLAN + beliebig viele Tagged VLANs |

## Gerätetypen

| Wert               | Label            |
|--------------------|-----------------|
| managed-switch     | MANAGED SWITCH  |
| poe-switch         | POE SWITCH      |
| gigabit-switch     | GIGABIT SWITCH  |
| unmanaged-switch   | SWITCH          |

## Lizenz

Privates Projekt.
