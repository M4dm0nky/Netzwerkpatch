// ============================================================
// 10. DEVICE CRUD — Netzwerkgeräte anlegen / löschen
// ============================================================

// Standard-Portgeschwindigkeiten
const DEFAULT_SPEED_RJ45 = '1G';
const DEFAULT_SPEED_SFP  = '10G';

function openNetworkDeviceModal() {
  // Felder zurücksetzen
  const nameEl = document.getElementById('newDeviceName');
  const typeEl = document.getElementById('newDeviceType');
  const rj45El = document.getElementById('newDeviceRJ45');
  const sfpEl  = document.getElementById('newDeviceSFP');

  if (nameEl) nameEl.value = '';
  if (typeEl) typeEl.value = 'managed-switch';
  if (rj45El) rj45El.value = '24';
  if (sfpEl)  sfpEl.value  = '0';

  updateDevicePreview();
  openModal('newDeviceModal');
  setTimeout(() => { if (nameEl) nameEl.focus(); }, 120);
}

function updateDevicePreview() {
  const previewEl = document.getElementById('newDevicePreview');
  if (!previewEl) return;

  const rj45 = parseInt(document.getElementById('newDeviceRJ45')?.value || 24);
  const sfp  = parseInt(document.getElementById('newDeviceSFP')?.value  || 0);
  const total = rj45 + sfp;

  previewEl.innerHTML = '';

  const info = document.createElement('div');
  info.style.cssText = 'font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);margin-bottom:8px;letter-spacing:1px;';
  info.textContent = 'Gesamt: ' + total + ' Ports';
  previewEl.appendChild(info);

  // Mini-Vorschau der Ports
  const portRow = document.createElement('div');
  portRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;';

  for (let i = 0; i < Math.min(rj45, 24); i++) {
    const p = document.createElement('div');
    p.style.cssText = 'width:14px;height:12px;background:linear-gradient(160deg,#aaa 0%,#777 55%,#444 100%);border:1px solid #999;border-radius:1px;';
    portRow.appendChild(p);
  }
  for (let i = 0; i < Math.min(sfp, 4); i++) {
    const p = document.createElement('div');
    p.style.cssText = 'width:10px;height:15px;background:linear-gradient(160deg,#888 0%,#555 55%,#333 100%);border:1px solid #777;border-radius:1px;margin-left:4px;';
    portRow.appendChild(p);
  }

  previewEl.appendChild(portRow);
}

function confirmNewDevice() {
  const nameEl = document.getElementById('newDeviceName');
  const typeEl = document.getElementById('newDeviceType');
  const rj45El = document.getElementById('newDeviceRJ45');
  const sfpEl  = document.getElementById('newDeviceSFP');
  const nameFieldEl = document.getElementById('newDeviceNameField');

  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) {
    if (nameFieldEl) nameFieldEl.classList.add('has-error');
    return;
  }
  if (nameFieldEl) nameFieldEl.classList.remove('has-error');

  const type  = typeEl  ? typeEl.value  : 'managed-switch';
  const rj45  = Math.min(24, Math.max(0, parseInt(rj45El?.value  || 24)));
  const sfp   = Math.min(4,  Math.max(0, parseInt(sfpEl?.value   || 0)));

  if (rj45 + sfp < 1) {
    showToast('Mindestens 1 Port erforderlich.', 'warning');
    return;
  }

  createDevice(name, type, rj45, sfp);
  closeModal('newDeviceModal');
}

function createDevice(name, type, rj45Count, sfpCount) {
  const ports = [];
  // RJ45 Ports (portNum 1-24, uid = portNum)
  for (let i = 1; i <= rj45Count; i++) {
    ports.push({
      uid:         i,           // unique inner ID (used for DOM + state lookups)
      id:          i,           // display number (P01 … P24)
      type:        'rj45',
      label:       '',
      notes:       '',
      active:      false,
      speed:       DEFAULT_SPEED_RJ45,
      mode:        'disabled',
      accessVlan:  1,
      taggedVlans: [],
      nativeVlan:  1,
    });
  }
  // SFP Ports (portNum 1-4, uid = 100+portNum → kein Konflikt mit RJ45)
  for (let i = 1; i <= sfpCount; i++) {
    ports.push({
      uid:         100 + i,     // unique inner ID
      id:          i,           // display number (S01 … S04)
      type:        'sfp',
      label:       '',
      notes:       '',
      active:      false,
      speed:       DEFAULT_SPEED_SFP,
      mode:        'disabled',
      accessVlan:  1,
      taggedVlans: [],
      nativeVlan:  1,
    });
  }

  const device = {
    id:        generateUUID(),
    name,
    type,
    rj45Count,
    sfpCount,
    notes:     '',
    ports,
  };

  state.devices.push(device);
  markModified();
  renderAllDevices();
  renderVlanPanel();
  renderPatchTable();
  showToast('Gerät "' + name + '" angelegt (' + (rj45Count + sfpCount) + ' Ports).', 'success');
}

function deleteDevice(id) {
  const dev = getDevice(id);
  if (!dev) return;
  if (!confirm('Gerät "' + dev.name + '" wirklich löschen?')) return;
  state.devices = state.devices.filter(d => d.id !== id);
  markModified();
  renderAllDevices();
  renderPatchTable();
  showToast('Gerät gelöscht.', 'info', 2000);
}
