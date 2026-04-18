# Changelog

Alle relevanten Änderungen am Projekt werden hier dokumentiert.
Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [v0.1.2] — 2026-04-18

### Added
- `README.md` mit vollständiger Projektdokumentation
- `CHANGELOG.md` (diese Datei)
- `CLAUDE.md` mit Claude-Code-Kontext für das Projekt

### Changed
- Version auf `v0.1.2` angehoben (in `js/state.js`, `src/template.html`, Build-Output)

---

## [v0.1.1] — nicht veröffentlicht

Interne Zwischenstände ohne separate Versionsnummer.

---

## [v0.1.0] — Initiales Release

### Added
- Single-File HTML App via `build.py` (CSS + JS in `netzwerkpatch.html` gebündelt)
- Visuelle Switch-Karten (RJ45 bis 24 Ports, SFP bis 4 Ports)
- 7-Segment-Display für Portnummern
- VLAN-Verwaltung: Anlegen, Bearbeiten, Löschen, Farbkodierung
- Port-Konfiguration per Klick-Popover (disabled / access / trunk)
- Drag & Drop: VLAN-Sidebar → Port
- Schematische Patch-Tabelle (Tab "SCHEMATISCH")
- VLAN-Manager Tab
- Speichern via FileSystem Access API und Download (`.json`)
- Auto-Save in `localStorage` (alle 90 Sekunden)
- Druckexport mit eigenem Print-Fenster
- Gerät duplizieren und umbenennen (Doppelklick)
- Rückwärtskompatibilität beim Laden älterer Projektdateien
- Toast-Benachrichtigungen
- Ungespeichert-Indikator im Header
