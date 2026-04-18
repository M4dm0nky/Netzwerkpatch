'use strict';

const APP_VERSION = 'v0.1.0';

// ============================================================
// 1. STATE
// ============================================================
const state = {
  projectName: 'Unbenannt',
  projectCreated: false,
  created: null,
  modified: false,
  devices: [],   // Network Switches
  vlans: [],     // Globale VLAN-Datenbank
};

// ============================================================
// 2. UTILITIES
// ============================================================
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function markModified() {
  state.modified = true;
  const el = document.getElementById('modifiedIndicator');
  if (el) el.classList.add('visible');
}

function markSaved() {
  state.modified = false;
  const el = document.getElementById('modifiedIndicator');
  if (el) el.classList.remove('visible');
}

function updateProjectDisplay() {
  const el = document.getElementById('projectNameDisplay');
  if (el) el.textContent = state.projectName || 'Kein Projekt';
  document.title = (state.projectName || 'NETZWERKPATCH') + ' — NETZWERKPATCH';
}

function showToast(msg, type = 'info', duration = 2800) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getDevice(id) {
  return state.devices.find(d => d.id === id) || null;
}

// portUid = port.uid (eindeutige Identifikation, nicht die Display-Nummer)
function getPort(deviceId, portUid) {
  const dev = getDevice(deviceId);
  if (!dev) return null;
  return dev.ports.find(p => (p.uid ?? p.id) === portUid) || null;
}

function getVlan(id) {
  return state.vlans.find(v => v.id === id) || null;
}

// Gibt eine schöne Hex-Farbe für die Hintergrundfärbung eines VLAN-Badges zurück
// (leicht gedimmt für lesbare schwarze Schrift)
function vlanBadgeStyle(color) {
  return `background:${color};color:${contrastColor(color)};`;
}

// Einfache Kontrastfarbe (schwarz oder weiß)
function contrastColor(hexColor) {
  const r = parseInt(hexColor.slice(1,3), 16);
  const g = parseInt(hexColor.slice(3,5), 16);
  const b = parseInt(hexColor.slice(5,7), 16);
  const lum = 0.299*r + 0.587*g + 0.114*b;
  return lum > 128 ? '#000000' : '#ffffff';
}

// Gibt die primäre VLAN-Farbe eines Ports zurück (für Border-Glow)
function getPortPrimaryColor(port) {
  if (!port || port.mode === 'disabled') return null;
  const vlanId = port.mode === 'access' ? port.accessVlan : port.nativeVlan;
  const vlan = getVlan(vlanId);
  return vlan ? vlan.color : null;
}

function updateEmptyState() {
  const empty = document.getElementById('emptyState');
  const tabs  = document.getElementById('appTabs');
  if (!empty || !tabs) return;
  if (state.projectCreated) {
    empty.style.display = 'none';
    tabs.classList.add('visible');
  } else {
    empty.style.display = '';
    tabs.classList.remove('visible');
  }
}

// Auto-save (alle 90s in localStorage)
let autoSaveTimer = null;
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    if (state.modified) saveToLocalStorage();
  }, 90000);
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('netzwerkpatch_autosave', JSON.stringify(buildSaveData()));
    console.log('Auto-Save in localStorage.');
  } catch(e) { /* ignore quota errors */ }
}

function buildSaveData() {
  return {
    appVersion:   APP_VERSION,
    projectName:  state.projectName,
    created:      state.created || new Date().toISOString(),
    savedAt:      new Date().toISOString(),
    devices:      state.devices,
    vlans:        state.vlans,
  };
}
