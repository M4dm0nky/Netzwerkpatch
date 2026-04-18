# CLAUDE.md — NETZWERKPATCH

## Projektüberblick

Browserbasiertes Switch-Port & VLAN-Dokumentationstool.
Single-File HTML App — kein Framework, kein Build-System außer `build.py`.

## Build-Workflow

```bash
python3 build.py
```

Bündelt `src/template.html` + `css/*.css` + `js/*.js` → `netzwerkpatch.html`.
**Nach jeder Änderung an CSS oder JS immer neu bauen.**

Die fertige `netzwerkpatch.html` ist die deploybare Datei — direkt im Browser öffnen.

## Architektur

Alle JS-Module sind globale Skripte (kein ES-Module-System).
Ladereihenfolge in `build.py` → `JS_FILES` ist bindend:

1. `state.js` — APP_VERSION, State-Objekt, Utility-Funktionen (muss zuerst geladen werden)
2. `ui.js` — Modal, Tab, Projektname
3. `device-render.js` — Switch-Karten, Port-Rendering, 7-Segment
4. `device-crud.js` — Gerät anlegen / löschen / duplizieren
5. `vlan.js` — VLAN CRUD, Popover, Custom-Select-Widgets
6. `patch.js` — Port-VLAN-Zuweisung, Patch-Tabelle
7. `storage.js` — Speichern, Laden, Drucken
8. `main.js` — DOMContentLoaded Init

## Versioning

Version wird an **drei Stellen** gepflegt — immer alle drei gleichzeitig ändern:

| Datei                  | Zeile | Inhalt                          |
|------------------------|-------|---------------------------------|
| `js/state.js`          | 3     | `const APP_VERSION = 'vX.Y.Z';` |
| `src/template.html`    | 21    | `>vX.Y.Z</div>`                 |
| `netzwerkpatch.html`   | auto  | via `python3 build.py` erzeugt  |

Nach der Versionsänderung immer `python3 build.py` ausführen.

## State-Struktur

```js
state = {
  projectName: string,
  projectCreated: boolean,
  created: ISO-string,
  modified: boolean,
  devices: Device[],
  vlans: Vlan[],
}
```

### Device

```js
{
  id: UUID,
  name: string,
  type: 'managed-switch' | 'poe-switch' | 'gigabit-switch' | 'unmanaged-switch',
  rj45Count: number,
  sfpCount: number,
  notes: string,
  ports: Port[],
}
```

### Port

```js
{
  uid: number,        // Intern eindeutig: RJ45 = id, SFP = 100+id
  id: number,         // Display-Nummer (1–24 / 1–4)
  type: 'rj45' | 'sfp',
  label: string,
  notes: string,
  active: boolean,
  speed: '100M' | '1G' | '2.5G' | '10G' | '25G',
  mode: 'disabled' | 'access' | 'trunk',
  accessVlan: number,
  taggedVlans: number[],
  nativeVlan: number,
}
```

### Vlan

```js
{ id: number, name: string, color: string, description: string }
```

## Wichtige Funktionen

| Funktion                    | Datei            | Beschreibung |
|-----------------------------|------------------|-------------|
| `createDevice()`            | device-crud.js   | Gerät + Ports erzeugen, State pushen |
| `deleteDevice(id)`          | device-crud.js   | Gerät aus State entfernen |
| `duplicateDevice(id)`       | device-render.js | Deep-Copy, neue UUID, Ports resetten |
| `updatePortVlan()`          | patch.js         | Atomare Port-Konfiguration |
| `refreshPort()`             | device-render.js | Einzelport neu rendern (ohne Full-Rerender) |
| `renderAllDevices()`        | device-render.js | Alle Switch-Karten neu bauen |
| `renderPatchTable()`        | patch.js         | Schematische Tabelle neu aufbauen |
| `renderVlanPanel()`         | vlan.js          | VLAN-Sidebar aktualisieren |
| `loadProjectData(data)`     | storage.js       | JSON laden + Rückwärtskompatibilität |
| `buildSaveData()`           | state.js         | Serialisierbares Objekt aus State |
| `markModified()`            | state.js         | State als geändert markieren |
| `openVlanPopover()`         | vlan.js          | Port-Konfigurations-Popover öffnen |

## CSS-Konventionen

- CSS Custom Properties in `css/variables.css` — nie Farben hardcoden
- Relevante Variablen: `--accent-green`, `--accent-orange`, `--accent-red`, `--text-primary`, `--text-secondary`, `--font-mono`
- Port-VLAN-Farbe wird per CSS Custom Property `--port-vlan-color` auf das Port-Element gesetzt

## Drag & Drop

VLAN-Einträge in der Sidebar sind draggable (`draggable="true"`, `data-vlanId`).
Ports hören auf `dragover` / `drop` und rufen `updatePortVlan()` im Access-Modus auf.

## Nicht tun

- Keine ES-Module (`import`/`export`) — alles bleibt globaler Scope
- `netzwerkpatch.html` nie manuell editieren — immer über `build.py` erzeugen
- Keine externen Abhängigkeiten hinzufügen (außer Google Fonts im Template)
