// ============================================================
// 13. FILE I/O — Projekt speichern & laden
// ============================================================

// FileSystem Access API Handle (für direktes Speichern)
let fileHandle = null;

function triggerLoad() {
  if (state.modified && state.devices.length > 0) {
    if (!confirm('Ungespeicherte Änderungen gehen verloren. Trotzdem öffnen?')) return;
  }
  document.getElementById('fileInput').click();
}

function handleFileLoad(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      loadProjectData(data);
      showToast('Projekt geladen: ' + (data.projectName || file.name), 'success');
    } catch {
      showToast('Fehler beim Laden der Datei.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function loadProjectData(data) {
  if (!data || !Array.isArray(data.devices)) {
    showToast('Ungültiges Projektformat.', 'error');
    return;
  }
  state.projectName    = data.projectName || 'Unbenannt';
  state.created        = data.created || new Date().toISOString();
  state.projectCreated = true;
  state.devices        = data.devices || [];
  state.vlans          = data.vlans   || [];

  // Rückwärtskompatibilität: fehlende Portfelder ergänzen
  state.devices.forEach(d => {
    d.ports.forEach(p => {
      // uid sicherstellen (SFP-Ports bekommen 100+id falls uid fehlt)
      if (p.uid === undefined) {
        p.uid = p.type === 'sfp' ? 100 + p.id : p.id;
      }
      if (p.speed       === undefined) p.speed       = p.type === 'sfp' ? '10G' : '1G';
      if (p.mode        === undefined) p.mode        = 'disabled';
      if (p.accessVlan  === undefined) p.accessVlan  = 1;
      if (p.taggedVlans === undefined) p.taggedVlans = [];
      if (p.nativeVlan  === undefined) p.nativeVlan  = 1;
      if (p.label       === undefined) p.label       = '';
      if (p.notes       === undefined) p.notes       = '';
    });
  });

  markSaved();
  updateProjectDisplay();
  renderVlanPanel();
  renderAllDevices();
  renderPatchTable();
  updateEmptyState();
}

// ============================================================
// SPEICHERN — Dialog
// ============================================================
function saveProjectDialog() {
  if (!state.projectCreated) {
    showToast('Kein aktives Projekt.', 'warning');
    return;
  }
  // FileSystem Access API: direktes Speichern wenn Handle vorhanden
  if (fileHandle) {
    saveToFileHandle();
    return;
  }
  // Kein Handle → Dialog anzeigen
  const body = document.getElementById('saveModalBody');
  body.innerHTML = '';

  if ('showSaveFilePicker' in window) {
    const opt1 = makeSaveOption('💾', 'In Datei speichern', 'Überschreibt die aktuell geöffnete Datei oder wählt eine neue.', () => {
      closeModal('saveModal');
      saveWithFilePicker();
    });
    body.appendChild(opt1);
  }

  const opt2 = makeSaveOption('⬇', 'Download', 'Speichert die Datei als Download (Backup).', () => {
    closeModal('saveModal');
    downloadProject();
  });
  body.appendChild(opt2);

  openModal('saveModal');
}

function saveProjectAs() {
  if (!state.projectCreated) { showToast('Kein aktives Projekt.', 'warning'); return; }
  if ('showSaveFilePicker' in window) {
    saveWithFilePicker(true);
  } else {
    downloadProject();
  }
}

function makeSaveOption(icon, label, desc, handler) {
  const div = document.createElement('div');
  div.className = 'save-option';
  div.innerHTML = `
    <div class="save-option-icon">${icon}</div>
    <div class="save-option-text">
      <strong>${label}</strong>
      <span>${desc}</span>
    </div>
  `;
  div.onclick = handler;
  return div;
}

async function saveWithFilePicker(forceNew = false) {
  try {
    if (!fileHandle || forceNew) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: sanitizeFilename(state.projectName) + '.json',
        types: [{ description: 'Netzwerkpatch JSON', accept: { 'application/json': ['.json'] } }],
      });
    }
    await saveToFileHandle();
  } catch (e) {
    if (e.name !== 'AbortError') showToast('Speichern fehlgeschlagen.', 'error');
  }
}

async function saveToFileHandle() {
  if (!fileHandle) { downloadProject(); return; }
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(buildSaveData(), null, 2));
    await writable.close();
    markSaved();
    showToast('Gespeichert.', 'success', 1800);
  } catch {
    showToast('Speichern fehlgeschlagen.', 'error');
  }
}

function downloadProject() {
  const json = JSON.stringify(buildSaveData(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = sanitizeFilename(state.projectName) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  markSaved();
  showToast('Datei heruntergeladen.', 'success', 1800);
}

function sanitizeFilename(name) {
  return (name || 'netzwerkpatch').replace(/[^a-zA-Z0-9_\-äöüÄÖÜß ]/g, '').replace(/\s+/g, '_');
}

// ============================================================
// DRUCKEN
// ============================================================
function exportPrint() {
  if (state.devices.length === 0) {
    showToast('Keine Geräte vorhanden.', 'warning');
    return;
  }

  const dateStr  = new Date().toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
  const projName = escHtml(state.projectName || 'Unbenannt');

  let rows = '';
  state.devices.forEach(dev => {
    const rj45Ports = dev.ports.filter(p => p.type === 'rj45');
    const sfpPorts  = dev.ports.filter(p => p.type === 'sfp');
    const allPorts  = [...rj45Ports, ...sfpPorts];

    allPorts.forEach((port, idx) => {
      const prefix  = port.type === 'sfp' ? 'S' : 'P';
      const portNum = prefix + String(port.id).padStart(2,'0');
      let vlanInfo  = '—';
      if (port.mode === 'access') {
        const vlan = getVlan(port.accessVlan);
        vlanInfo = vlan ? vlan.id + ' ' + vlan.name : '—';
      } else if (port.mode === 'trunk') {
        const native = getVlan(port.nativeVlan);
        const tagged = port.taggedVlans.map(id => id).join(', ');
        vlanInfo = (native ? 'N:' + native.id : '') + (tagged ? ' T:' + tagged : '');
      }
      rows += `<tr${idx===0?' class="first-of-device"':''}>
        ${idx===0 ? `<td class="td-device" rowspan="${allPorts.length}">${escHtml(dev.name)}</td>` : ''}
        <td>${portNum}</td>
        <td>${port.type.toUpperCase()}</td>
        <td>${escHtml(port.label||'')}</td>
        <td>${port.mode.toUpperCase()}</td>
        <td>${vlanInfo}</td>
        <td>${port.speed||'—'}</td>
        <td>${escHtml(port.notes||'')}</td>
      </tr>`;
    });
  });

  const printHtml = `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8">
<title>NETZWERKPATCH — ${projName}</title>
<style>
body { font-family: 'Barlow Condensed', Arial, sans-serif; font-size: 11pt; color: #111; margin: 20px; }
h1 { font-size: 24pt; letter-spacing: 4px; margin-bottom: 4px; }
.meta { color: #666; font-size: 9pt; margin-bottom: 16px; }
table { border-collapse: collapse; width: 100%; }
th { background: #1c2030; color: #e8c84a; text-transform: uppercase; font-size: 8pt; letter-spacing: 1.5px; padding: 6px 10px; text-align: left; }
td { border-bottom: 1px solid #ddd; padding: 5px 10px; font-size: 10pt; }
.td-device { font-weight: 700; background: #f6f7fa; vertical-align: top; padding-top: 8px; }
tr.first-of-device td { border-top: 2px solid #aaa; }
@media print { body { margin: 10px; } }
</style></head>
<body>
<h1>NETZWERKPATCH</h1>
<div class="meta">Projekt: ${projName} · Gedruckt: ${dateStr}</div>
<table>
  <thead><tr><th>Gerät</th><th>Port</th><th>Typ</th><th>Label</th><th>Modus</th><th>VLAN</th><th>Speed</th><th>Notizen</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(printHtml);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

// ============================================================
// LEEREN
// ============================================================
function clearAll() {
  if (!state.projectCreated) return;
  if (!confirm('Alle Geräte und VLANs löschen? (Das Projekt bleibt erhalten.)')) return;
  state.devices = [];
  state.vlans   = [];
  fileHandle    = null;
  markModified();
  renderAllDevices();
  renderVlanPanel();
  renderPatchTable();
  showToast('Projekt geleert.', 'info');
}
