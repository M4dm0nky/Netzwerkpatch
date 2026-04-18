#!/usr/bin/env python3
"""
Netzwerkpatch Build-Skript
Liest src/template.html + alle CSS/JS-Quelldateien
und erzeugt eine vollständige Single-File netzwerkpatch.html.

Verwendung:
    python build.py
    python3 build.py

Ausgabe: netzwerkpatch.html (im selben Verzeichnis, direkt im Browser öffnen)
"""

import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

CSS_FILES = [
    "css/variables.css",
    "css/layout.css",
    "css/rack.css",
    "css/patch-table.css",
    "css/vlan-manager.css",
    "css/modal.css",
    "css/misc.css",
]

JS_FILES = [
    "js/state.js",
    "js/ui.js",
    "js/device-render.js",
    "js/device-crud.js",
    "js/vlan.js",
    "js/patch.js",
    "js/storage.js",
    "js/main.js",
]

def read(rel):
    with open(os.path.join(BASE, rel), encoding="utf-8") as f:
        return f.read()

def build():
    # CSS zusammenbauen
    css_lines = ["  <style>"]
    for f in CSS_FILES:
        css_lines.append(f"    /* ===== {f} ===== */")
        css_lines.append(read(f))
    css_lines.append("  </style>")
    css_block = "\n".join(css_lines)

    # JS zusammenbauen
    js_lines = ["<script>"]
    for f in JS_FILES:
        js_lines.append(f"// ===== {f} =====")
        js_lines.append(read(f))
    js_lines.append("</script>")
    js_block = "\n".join(js_lines)

    # Template einlesen
    html = read("src/template.html")

    # Platzhalter ersetzen
    html = html.replace("<!-- BUILD:CSS -->", css_block)
    html = html.replace("<!-- BUILD:JS -->", js_block)

    # Ausgabe schreiben
    out = os.path.join(BASE, "netzwerkpatch.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)

    lines = html.count("\n")
    print(f"✓  netzwerkpatch.html gebaut ({lines} Zeilen)")
    print(f"   CSS: {', '.join(CSS_FILES)}")
    print(f"   JS:  {', '.join(JS_FILES)}")
    print(f"\n→  Einfach netzwerkpatch.html im Browser öffnen.")

if __name__ == "__main__":
    build()
