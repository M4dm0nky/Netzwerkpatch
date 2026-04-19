# Changelog

Alle relevanten Änderungen am Projekt werden hier dokumentiert.
Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [v0.2.7] — 2026-04-19

### Added
- Trunk-Modus: Multi-Select für Tagged VLANs (IDs 2–12) im Port-Popover

---

## [v0.2.6] — 2026-04-19

### Changed
- Port-Popover: Access- und Trunk-Modus in einem einzigen VLAN-Dropdown zusammengefasst (ID 0 = Trunk, ID 1–12 = Access)
- VLAN-Farbzuweisung direkt im Popover (Farbzeile erscheint bei Access-VLANs 2–12)

---

## [v0.2.5] — 2026-04-19

### Changed
- Interne Korrekturen und Stabilisierungen nach v0.2.4

---

## [v0.2.4] — 2026-04-18

### Added
- Custom-Select-Widget (VCS) für VLAN-Auswahl im Popover mit Farbindikator und Suchfilter
- Multi-Select-Widget (VCS Multi) für Tagged VLANs im Trunk-Modus
- Neues Modal-CSS (`modal.css`)

### Changed
- Port-Popover komplett überarbeitet (Access VLAN / Native VLAN / Tagged VLANs als separate Zeilen)
- SFP-Port-Darstellung verbessert

---

## [v0.2.1] — 2026-04-18

### Added
- Drag & Drop: Trunk-Eintrag in VLAN-Sidebar setzt Port direkt auf Trunk-Modus
- Management-VLAN (ID 1) ist vor Bearbeitung geschützt (Edit-Button deaktiviert)

### Removed
- Beschreibungsfeld aus VLAN-Modal entfernt

---

## [v0.2.0] — 2026-04-18

### Changed
- Versionsschema auf `v0.2.x` angehoben

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
