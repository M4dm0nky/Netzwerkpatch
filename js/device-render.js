// ============================================================
// 7. RENDERING — SWITCH CARDS
// ============================================================

function renderAllDevices() {
  const container = document.getElementById('devicesContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!state.projectCreated || state.devices.length === 0) {
    const hint = document.createElement('div');
    hint.style.cssText = 'padding:40px 20px;color:var(--text-secondary);font-family:var(--font-mono);font-size:11px;letter-spacing:1px;opacity:0.7;';
    hint.textContent = '← Klick auf ⊕ GERÄT um einen Switch anzulegen';
    container.appendChild(hint);
    return;
  }

  state.devices.forEach(d => container.appendChild(buildSwitchCard(d)));
}

function buildSwitchCard(device) {
  const card = document.createElement('div');
  card.className = 'device-card';
  card.dataset.deviceId = device.id;

  const rackUnit = document.createElement('div');
  rackUnit.className = 'rack-unit';

  rackUnit.appendChild(buildEar());

  const face = document.createElement('div');
  face.className = 'rack-face';

  // Top bar
  const topbar = document.createElement('div');
  topbar.className = 'rack-topbar';

  const nameEl = document.createElement('div');
  nameEl.className = 'device-name-label';
  nameEl.textContent = device.name;
  nameEl.title = 'Doppelklick zum Umbenennen';
  nameEl.ondblclick = () => startRenameDevice(device.id, nameEl);

  const brand = document.createElement('div');
  brand.className = 'brand-label';
  const rj45 = device.ports.filter(p => p.type === 'rj45').length;
  const sfp  = device.ports.filter(p => p.type === 'sfp').length;
  brand.textContent = deviceTypeLabel(device.type) + ' · ' + rj45 + '× RJ45' + (sfp ? ' · ' + sfp + '× SFP' : '');

  const controls = document.createElement('div');
  controls.className = 'rack-controls';

  const dupeBtn = document.createElement('button');
  dupeBtn.className = 'rack-ctrl-btn';
  dupeBtn.textContent = 'Duplizieren';
  dupeBtn.onclick = () => duplicateDevice(device.id);

  const delBtn = document.createElement('button');
  delBtn.className = 'rack-ctrl-btn delete';
  delBtn.textContent = '✕ Löschen';
  delBtn.onclick = () => deleteDevice(device.id);

  controls.appendChild(dupeBtn);
  controls.appendChild(delBtn);

  topbar.appendChild(nameEl);
  topbar.appendChild(brand);
  topbar.appendChild(controls);
  face.appendChild(topbar);

  // Port-Bereich
  face.appendChild(buildPortsArea(device));

  const hint = document.createElement('div');
  hint.className = 'rack-hint';
  hint.textContent = 'KLICK AUF PORT → VLAN ZUWEISEN';
  face.appendChild(hint);

  rackUnit.appendChild(face);
  rackUnit.appendChild(buildEar(true));

  card.appendChild(rackUnit);
  return card;
}

function deviceTypeLabel(type) {
  const map = {
    'managed-switch':       'MANAGED SWITCH',
    'poe-switch':           'POE SWITCH',
    'gigabit-switch':       'GIGABIT SWITCH',
    'unmanaged-switch':     'SWITCH',
    'poe-unmanaged-switch': 'POE SWITCH',
  };
  return map[type] || 'SWITCH';
}

function buildEar(right = false) {
  const ear = document.createElement('div');
  ear.className = 'rack-ear' + (right ? ' right' : '');
  ear.appendChild(buildScrew());
  ear.appendChild(buildScrew());
  return ear;
}

function buildScrew() {
  const s = document.createElement('div');
  s.className = 'rack-screw';
  return s;
}

// ============================================================
// PORT-BEREICH
// ============================================================
function buildPortsArea(device) {
  const rj45Ports = device.ports.filter(p => p.type === 'rj45');
  const sfpPorts  = device.ports.filter(p => p.type === 'sfp');

  const area = document.createElement('div');
  area.className = 'ports-area';

  // RJ45 Sektion
  if (rj45Ports.length > 0) {
    const rj45Sec = document.createElement('div');
    rj45Sec.className = 'ports-rj45-section';

    const lbl = document.createElement('div');
    lbl.className = 'ports-section-label';
    lbl.textContent = 'RJ45';
    rj45Sec.appendChild(lbl);

    if (rj45Ports.length <= 12) {
      // Einzeilig
      const row = document.createElement('div');
      row.className = 'ports-row';
      rj45Ports.forEach(p => row.appendChild(buildRJ45Port(device, p)));
      rj45Sec.appendChild(row);
    } else {
      // Zweizeilig: Ports 1…Hälfte oben, Rest unten
      const half = Math.ceil(rj45Ports.length / 2);
      const row1 = document.createElement('div');
      row1.className = 'ports-row';
      const row2 = document.createElement('div');
      row2.className = 'ports-row';
      rj45Ports.slice(0, half).forEach(p => row1.appendChild(buildRJ45Port(device, p)));
      rj45Ports.slice(half).forEach(p => row2.appendChild(buildRJ45Port(device, p)));
      rj45Sec.appendChild(row1);
      rj45Sec.appendChild(row2);
    }

    area.appendChild(rj45Sec);
  }

  // SFP Sektion
  if (sfpPorts.length > 0) {
    const sfpSec = document.createElement('div');
    sfpSec.className = 'ports-sfp-section';

    const lbl = document.createElement('div');
    lbl.className = 'ports-section-label';
    lbl.textContent = 'SFP';
    sfpSec.appendChild(lbl);

    const row = document.createElement('div');
    row.className = 'ports-row';
    sfpPorts.forEach(p => row.appendChild(buildSFPPort(device, p)));
    sfpSec.appendChild(row);

    area.appendChild(sfpSec);
  }

  return area;
}

// ============================================================
// RJ45 PORT
// ============================================================
function buildRJ45Port(device, port) {
  const uid = port.uid ?? port.id;
  const wrap = document.createElement('div');
  wrap.className = 'rj45-port';
  wrap.id = 'port_' + device.id + '_' + uid;
  wrap.title = 'Port ' + port.id + (port.label ? ' — ' + port.label : '') + '\nKlick: VLAN zuweisen';

  // VLAN Farbkodierung
  applyPortVlanStyle(wrap, port);

  // Status-LED
  const led = document.createElement('div');
  led.className = 'port-status-led' + (port.mode !== 'disabled' ? ' active' : '');
  wrap.appendChild(led);

  // Buchsen-Gehäuse im Ring-Wrapper
  const ring = document.createElement('div');
  ring.className = 'port-vlan-ring';

  const housing = document.createElement('div');
  housing.className = 'rj45-housing';

  const opening = document.createElement('div');
  opening.className = 'rj45-opening';

  const pins = document.createElement('div');
  pins.className = 'rj45-pins';
  for (let i = 0; i < 8; i++) {
    const pin = document.createElement('div');
    pin.className = 'rj45-pin';
    pins.appendChild(pin);
  }
  opening.appendChild(pins);
  housing.appendChild(opening);
  ring.appendChild(housing);
  wrap.appendChild(ring);

  // 7-Segment Portnummer (skaliert)
  const segWrap = document.createElement('div');
  segWrap.className = 'port-seg-display';
  const portNumStr = String(port.id).padStart(2, '0');
  segWrap.appendChild(buildSegDisplay(portNumStr + '  '));
  wrap.appendChild(segWrap);

  // Label-Text
  const labelEl = document.createElement('div');
  labelEl.className = 'port-label-text' + (port.label ? ' has-label' : '');
  labelEl.textContent = port.label || ('P' + String(port.id).padStart(2, '0'));
  labelEl.id = 'portlabel_' + device.id + '_' + uid;
  wrap.appendChild(labelEl);

  // VLAN-Badge
  const badge = buildPortVlanBadge(port);
  badge.id = 'vlan_badge_' + device.id + '_' + uid;
  wrap.appendChild(badge);

  // Drag-Drop: VLAN aus Sidebar droppen
  wrap.addEventListener('dragover', e => {
    e.preventDefault();
    wrap.classList.add('drag-over');
  });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('drag-over'));
  wrap.addEventListener('drop', e => {
    e.preventDefault();
    wrap.classList.remove('drag-over');
    const vlanId = parseInt(e.dataTransfer.getData('vlanId'));
    if (vlanId) {
      updatePortVlan(device.id, uid, 'access', vlanId, [], vlanId);
      showToast('VLAN ' + vlanId + ' auf Port ' + port.id + ' gesetzt.', 'success', 1800);
    }
  });

  // Klick → Popover
  wrap.addEventListener('click', e => {
    e.stopPropagation();
    openVlanPopover(device.id, uid, wrap);
  });

  return wrap;
}

// ============================================================
// SFP PORT
// ============================================================
function buildSFPPort(device, port) {
  const uid = port.uid ?? port.id;
  const wrap = document.createElement('div');
  wrap.className = 'sfp-port';
  wrap.id = 'port_' + device.id + '_' + uid;
  wrap.title = 'SFP ' + port.id + (port.label ? ' — ' + port.label : '') + '\nKlick: VLAN zuweisen';

  applyPortVlanStyle(wrap, port);

  // Status-LED
  const led = document.createElement('div');
  led.className = 'port-status-led' + (port.mode !== 'disabled' ? ' active' : '');
  wrap.appendChild(led);

  // Slot-Gehäuse im Ring-Wrapper
  const ring = document.createElement('div');
  ring.className = 'port-vlan-ring';

  const housing = document.createElement('div');
  housing.className = 'sfp-housing';

  const slot = document.createElement('div');
  slot.className = 'sfp-slot';

  const sym = document.createElement('div');
  sym.className = 'sfp-symbol';
  slot.appendChild(sym);
  housing.appendChild(slot);
  ring.appendChild(housing);
  wrap.appendChild(ring);

  // Typ-Label
  const typeLbl = document.createElement('div');
  typeLbl.className = 'sfp-type-label';
  typeLbl.textContent = 'SFP';
  wrap.appendChild(typeLbl);

  // Port-Label
  const labelEl = document.createElement('div');
  labelEl.className = 'port-label-text' + (port.label ? ' has-label' : '');
  labelEl.textContent = port.label || ('S' + String(port.id).padStart(2, '0'));
  labelEl.id = 'portlabel_' + device.id + '_' + uid;
  wrap.appendChild(labelEl);

  // VLAN-Badge
  const badge = buildPortVlanBadge(port);
  badge.id = 'vlan_badge_' + device.id + '_' + uid;
  wrap.appendChild(badge);

  // Drag-Drop
  wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('drag-over'); });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('drag-over'));
  wrap.addEventListener('drop', e => {
    e.preventDefault();
    wrap.classList.remove('drag-over');
    const vlanId = parseInt(e.dataTransfer.getData('vlanId'));
    if (vlanId) {
      updatePortVlan(device.id, uid, 'access', vlanId, [], vlanId);
      showToast('VLAN ' + vlanId + ' auf SFP ' + port.id + ' gesetzt.', 'success', 1800);
    }
  });

  // Klick → Popover
  wrap.addEventListener('click', e => {
    e.stopPropagation();
    openVlanPopover(device.id, uid, wrap);
  });

  return wrap;
}

// ============================================================
// VLAN STYLING FÜR PORTS
// ============================================================
function applyPortVlanStyle(portEl, port) {
  portEl.classList.remove('vlan-assigned', 'vlan-trunk');
  portEl.style.removeProperty('--port-vlan-color');
  portEl.style.removeProperty('--port-vlan-glow');

  if (port.mode === 'disabled') return;

  if (port.mode === 'trunk') {
    portEl.style.setProperty('--port-vlan-color', '#777777');
    portEl.style.setProperty('--port-vlan-glow', '#77777760');
    portEl.classList.add('vlan-trunk');
  } else {
    const color = getPortPrimaryColor(port);
    if (color) {
      portEl.style.setProperty('--port-vlan-color', color);
      portEl.style.setProperty('--port-vlan-glow', color + '99');
      portEl.classList.add('vlan-assigned');
    }
  }
}

function buildPortVlanBadge(port) {
  const wrap = document.createElement('div');
  wrap.className = 'vlan-badge-wrap';
  // ID wird vom Aufrufer (buildRJ45Port/buildSFPPort) gesetzt

  if (port.mode === 'disabled') return wrap;

  if (port.mode === 'access') {
    const vlan = getVlan(port.accessVlan);
    if (vlan) {
      const badge = document.createElement('div');
      badge.className = 'vlan-badge';
      badge.style.cssText = vlanBadgeStyle(vlan.color);
      badge.textContent = vlan.id;
      badge.title = vlan.name;
      wrap.appendChild(badge);
    }
  } else if (port.mode === 'trunk') {
    const allVlans = [port.nativeVlan, ...port.taggedVlans].filter(Boolean);
    const unique = [...new Set(allVlans)];
    const max = 3;
    unique.slice(0, max).forEach(vid => {
      const vlan = getVlan(vid);
      if (!vlan) return;
      const badge = document.createElement('div');
      badge.className = 'vlan-badge';
      badge.style.cssText = vlanBadgeStyle(vlan.color);
      badge.textContent = vlan.id;
      badge.title = vlan.name + (vid === port.nativeVlan ? ' (nativ)' : ' (tagged)');
      wrap.appendChild(badge);
    });
    if (unique.length > max) {
      const more = document.createElement('div');
      more.className = 'vlan-badge-more';
      more.textContent = '+' + (unique.length - max);
      wrap.appendChild(more);
    }
  }

  return wrap;
}

// ============================================================
// PORT AKTUALISIEREN (ohne komplettes Neurendern)
// ============================================================
// portUid = port.uid (unique inner ID)
function refreshPort(deviceId, portUid) {
  const port = getPort(deviceId, portUid);
  if (!port) return;

  const portEl = document.getElementById('port_' + deviceId + '_' + portUid);
  if (!portEl) return;

  // VLAN-Stil
  applyPortVlanStyle(portEl, port);

  // LED
  const led = portEl.querySelector('.port-status-led');
  if (led) {
    if (port.mode !== 'disabled') led.classList.add('active');
    else led.classList.remove('active');
  }

  // Label
  const labelEl = document.getElementById('portlabel_' + deviceId + '_' + portUid);
  if (labelEl) {
    labelEl.textContent = port.label || (port.type === 'sfp' ? 'S' : 'P') + String(port.id).padStart(2,'0');
    labelEl.className = 'port-label-text' + (port.label ? ' has-label' : '');
  }

  // VLAN-Badge aktualisieren
  const badgeWrap = portEl.querySelector('.vlan-badge-wrap');
  if (badgeWrap) {
    const newBadge = buildPortVlanBadge(port);
    newBadge.id = 'vlan_badge_' + deviceId + '_' + portUid;
    badgeWrap.replaceWith(newBadge);
  }
}

// ============================================================
// RENAME / DUPLICATE
// ============================================================
function startRenameDevice(deviceId, nameEl) {
  const device = getDevice(deviceId);
  if (!device) return;
  const input = document.createElement('input');
  input.className = 'device-name-input';
  input.value = device.name;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  function finish() {
    const newName = input.value.trim() || device.name;
    device.name = newName;
    markModified();
    const card = document.querySelector('[data-device-id="' + deviceId + '"]');
    if (card) card.replaceWith(buildSwitchCard(device));
    renderPatchTable();
  }
  input.addEventListener('blur', finish);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
}

function duplicateDevice(id) {
  const src = getDevice(id);
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = generateUUID();
  copy.name = src.name + ' (Kopie)';
  copy.ports.forEach(p => { p.mode = 'disabled'; p.accessVlan = 1; p.taggedVlans = []; p.label = ''; });
  state.devices.push(copy);
  markModified();
  renderAllDevices();
  renderPatchTable();
  showToast('Gerät dupliziert.', 'success');
}

// ============================================================
// 9. 7-SEGMENT DISPLAY (von Boosterpatch übernommen)
// ============================================================
const SEG_MAP = {
  '0':[1,1,1,1,1,1,0, 0,0,0,0], '1':[0,1,1,0,0,0,0, 0,0,0,0],
  '2':[1,1,0,1,1,0,1, 0,0,0,0], '3':[1,1,1,1,0,0,1, 0,0,0,0],
  '4':[0,1,1,0,0,1,1, 0,0,0,0], '5':[1,0,1,1,0,1,1, 0,0,0,0],
  '6':[1,0,1,1,1,1,1, 0,0,0,0], '7':[1,1,1,0,0,0,0, 0,0,0,0],
  '8':[1,1,1,1,1,1,1, 0,0,0,0], '9':[1,1,1,1,0,1,1, 0,0,0,0],
  'A':[1,1,1,0,1,1,1, 0,0,0,0], 'B':[0,0,1,1,1,1,1, 0,0,0,0],
  'C':[1,0,0,1,1,1,0, 0,0,0,0], 'D':[0,1,1,1,1,0,1, 0,0,0,0],
  'E':[1,0,0,1,1,1,1, 0,0,0,0], 'F':[1,0,0,0,1,1,1, 0,0,0,0],
  'G':[1,0,1,1,1,1,0, 0,0,0,0], 'H':[0,1,1,0,1,1,1, 0,0,0,0],
  'I':[1,0,0,1,0,0,0, 0,0,0,0], 'J':[0,1,1,1,0,0,0, 0,0,0,0],
  'K':[0,0,0,0,1,1,0, 0,1,0,1], 'L':[0,0,0,1,1,1,0, 0,0,0,0],
  'M':[0,1,1,0,1,1,0, 1,1,0,0], 'N':[0,1,1,0,1,1,0, 1,0,0,1],
  'O':[1,1,1,1,1,1,0, 0,0,0,0], 'P':[1,1,0,0,1,1,1, 0,0,0,0],
  'Q':[1,1,1,1,1,1,0, 0,0,0,1], 'R':[1,1,0,0,1,1,1, 0,0,0,1],
  'S':[1,0,1,1,0,1,1, 0,0,0,0], 'T':[1,0,0,0,0,0,0, 0,0,1,1],
  'U':[0,1,1,1,1,1,0, 0,0,0,0], 'V':[0,0,0,0,0,1,0, 0,0,1,1],
  'W':[0,1,1,0,1,1,0, 0,0,1,1], 'X':[0,0,0,0,0,0,0, 1,1,1,1],
  'Y':[0,1,1,0,0,1,0, 0,0,0,0], 'Z':[1,0,0,1,0,0,0, 0,1,1,0],
  '-':[0,0,0,0,0,0,1, 0,0,0,0], ' ':[0,0,0,0,0,0,0, 0,0,0,0],
  '/':[0,0,0,0,0,0,0, 0,1,1,0], '.':[0,0,0,1,0,0,0, 0,0,0,0],
  '[':[1,0,0,1,1,1,0, 0,0,0,0], ']':[1,1,1,1,0,0,0, 0,0,0,0],
  '\\':[0,0,0,0,0,0,0, 1,0,0,1],
};

function buildSegDisplay(text) {
  const disp = document.createElement('div');
  disp.className = 'seg-display';
  const str = (text || '    ').slice(0, 4).padEnd(4, ' ');
  for (let i = 0; i < 4; i++) {
    const ch = str[i].toUpperCase();
    const digit = document.createElement('div');
    digit.className = 'seg-digit';
    const pattern = SEG_MAP[ch] || SEG_MAP[' '];
    ['a','b','c','d','e','f','g','ul','ur','ll','lr'].forEach((s, j) => {
      const seg = document.createElement('div');
      seg.className = 'seg seg-' + s + (pattern[j] ? ' on' : '');
      digit.appendChild(seg);
    });
    disp.appendChild(digit);
  }
  return disp;
}
