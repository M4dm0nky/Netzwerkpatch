// ============================================================
// 11. VLAN MANAGEMENT
// ============================================================

const VLAN_PRESETS = [
  '#4a90e8','#4ae8a0','#e8a04a','#e84a9f','#a04ae8',
  '#e8e84a','#4ae8e8','#e84a4a','#4a6ee8','#88e84a',
  '#e8604a','#c84ae8','#4ae8c8','#e8b44a','#8ae84a','#e84a74'
];

// ============================================================
// VLAN CRUD
// ============================================================
function openNewVlanModal(editId) {
  const modal = document.getElementById('vlanModal');
  const title = document.getElementById('vlanModalTitle');
  const idEl  = document.getElementById('vlanIdInput');
  const nameEl = document.getElementById('vlanNameInput');
  const colorEl = document.getElementById('vlanColorInput');
  const descEl = document.getElementById('vlanDescInput');
  const idField = document.getElementById('vlanIdField');

  if (editId != null) {
    // Bearbeiten
    const vlan = getVlan(editId);
    if (!vlan) return;
    if (title) title.textContent = 'VLAN BEARBEITEN';
    if (idEl)   { idEl.value = vlan.id; idEl.disabled = true; }
    if (nameEl)  nameEl.value = vlan.name;
    if (colorEl) { colorEl.value = vlan.color; updateColorPreview(vlan.color); }
    if (descEl)  descEl.value = vlan.description || '';
    modal.dataset.editId = editId;
  } else {
    // Neu
    if (title) title.textContent = 'NEUE VLAN';
    if (idEl)   { idEl.value = nextFreeVlanId(); idEl.disabled = false; }
    if (nameEl)  nameEl.value = '';
    const presetColor = VLAN_PRESETS[(state.vlans.length) % VLAN_PRESETS.length];
    if (colorEl) { colorEl.value = presetColor; updateColorPreview(presetColor); }
    if (descEl)  descEl.value = '';
    delete modal.dataset.editId;
  }
  if (idField) idField.classList.remove('has-error');
  openModal('vlanModal');
  setTimeout(() => { if (nameEl) nameEl.focus(); }, 120);
  renderColorPresets();
}

function nextFreeVlanId() {
  const used = new Set(state.vlans.map(v => v.id));
  for (let i = 2; i <= 4094; i++) {
    if (!used.has(i)) return i;
  }
  return 4094;
}

function confirmVlan() {
  const modal  = document.getElementById('vlanModal');
  const idEl   = document.getElementById('vlanIdInput');
  const nameEl = document.getElementById('vlanNameInput');
  const colorEl = document.getElementById('vlanColorInput');
  const descEl = document.getElementById('vlanDescInput');
  const idField = document.getElementById('vlanIdField');
  const nameField = document.getElementById('vlanNameField');

  const id    = parseInt(idEl?.value || 0);
  const name  = nameEl?.value.trim() || '';
  const color = colorEl?.value || '#4a90e8';
  const desc  = descEl?.value.trim() || '';

  let hasError = false;
  if (!name) {
    if (nameField) nameField.classList.add('has-error');
    hasError = true;
  } else {
    if (nameField) nameField.classList.remove('has-error');
  }

  const isEdit = modal.dataset.editId != null;
  if (!isEdit) {
    if (!id || id < 1 || id > 4094 || (state.vlans.some(v => v.id === id))) {
      if (idField) idField.classList.add('has-error');
      hasError = true;
    } else {
      if (idField) idField.classList.remove('has-error');
    }
  }

  if (hasError) return;

  if (isEdit) {
    const vlan = getVlan(parseInt(modal.dataset.editId));
    if (vlan) {
      vlan.name = name;
      vlan.color = color;
      vlan.description = desc;
      showToast('VLAN ' + vlan.id + ' aktualisiert.', 'success');
    }
  } else {
    state.vlans.push({ id, name, color, description: desc });
    state.vlans.sort((a,b) => a.id - b.id);
    showToast('VLAN ' + id + ' angelegt.', 'success');
  }

  markModified();
  closeModal('vlanModal');
  renderVlanPanel();
  renderVlanManagerTab();
  renderAllDevices(); // Badges aktualisieren
  renderPatchTable();
}

function deleteVlan(id) {
  const vlan = getVlan(id);
  if (!vlan) return;
  // Prüfen ob Ports dieses VLAN nutzen
  const used = [];
  state.devices.forEach(d => {
    d.ports.forEach(p => {
      if (p.accessVlan === id || p.nativeVlan === id || p.taggedVlans.includes(id)) {
        used.push(d.name + ':Port' + p.id);
      }
    });
  });
  let msg = 'VLAN ' + id + ' (' + vlan.name + ') wirklich löschen?';
  if (used.length > 0) {
    msg += '\n\nDieses VLAN ist noch ' + used.length + ' Port(s) zugewiesen:\n' + used.slice(0,5).join(', ');
    if (used.length > 5) msg += ' …';
  }
  if (!confirm(msg)) return;
  state.vlans = state.vlans.filter(v => v.id !== id);
  markModified();
  renderVlanPanel();
  renderVlanManagerTab();
  renderAllDevices();
  renderPatchTable();
  showToast('VLAN ' + id + ' gelöscht.', 'info');
}

// ============================================================
// VLAN SIDEBAR PANEL
// ============================================================
function renderVlanPanel() {
  const panel = document.getElementById('vlanPanel');
  if (!panel) return;
  panel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'vlan-panel-header';
  header.textContent = 'VLANS';
  panel.appendChild(header);

  const addBtn = document.createElement('button');
  addBtn.className = 'vlan-panel-add';
  addBtn.textContent = '⊕ Neue VLAN';
  addBtn.onclick = () => openNewVlanModal();
  panel.appendChild(addBtn);

  if (state.vlans.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:12px;font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);letter-spacing:0.5px;opacity:0.7;';
    empty.textContent = 'Noch keine VLANs';
    panel.appendChild(empty);
    return;
  }

  const sep = document.createElement('div');
  sep.className = 'vlan-panel-sep';
  panel.appendChild(sep);

  state.vlans.forEach(vlan => {
    const entry = document.createElement('div');
    entry.className = 'vlan-entry';
    entry.draggable = true;
    entry.title = 'VLAN ' + vlan.id + ': ' + vlan.name + '\nZiehen → Port zum Zuweisen';
    entry.dataset.vlanId = vlan.id;

    entry.addEventListener('dragstart', e => {
      e.dataTransfer.setData('vlanId', vlan.id);
      e.dataTransfer.effectAllowed = 'link';
    });

    const dot = document.createElement('div');
    dot.className = 'vlan-entry-dot';
    dot.style.background = vlan.color;
    dot.style.boxShadow = '0 0 4px ' + vlan.color + '80';

    const name = document.createElement('div');
    name.className = 'vlan-entry-name';
    name.textContent = vlan.name;

    const idLbl = document.createElement('div');
    idLbl.className = 'vlan-entry-id';
    idLbl.textContent = vlan.id;

    entry.appendChild(dot);
    entry.appendChild(name);
    entry.appendChild(idLbl);
    panel.appendChild(entry);
  });
}

// ============================================================
// VLAN MANAGER TAB
// ============================================================
function renderVlanManagerTab() {
  const container = document.getElementById('vlanManagerContent');
  if (!container) return;
  container.innerHTML = '';

  if (state.vlans.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:40px 20px;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);text-align:center;letter-spacing:1px;';
    empty.textContent = 'Noch keine VLANs definiert. Klick auf ⊕ NEUE VLAN.';
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'vlan-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Farbe</th>
        <th>Ports</th>
        <th>Beschreibung</th>
        <th></th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  state.vlans.forEach(vlan => {
    const portCount = countPortsUsingVlan(vlan.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="vlan-td-id">${vlan.id}</td>
      <td class="vlan-td-name">${escHtml(vlan.name)}</td>
      <td class="vlan-td-color">
        <div class="vlan-color-swatch" style="background:${vlan.color};"></div>
        <span class="vlan-color-hex">${vlan.color}</span>
      </td>
      <td class="vlan-td-ports">${portCount > 0 ? portCount + '×' : '—'}</td>
      <td class="vlan-td-desc">${escHtml(vlan.description || '')}</td>
      <td class="vlan-td-actions">
        <button class="vlan-action-btn" onclick="openNewVlanModal(${vlan.id})">Bearbeiten</button>
        <button class="vlan-action-btn danger" onclick="deleteVlan(${vlan.id})">Löschen</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

function countPortsUsingVlan(vlanId) {
  let count = 0;
  state.devices.forEach(d => {
    d.ports.forEach(p => {
      if (p.mode === 'access' && p.accessVlan === vlanId) count++;
      else if (p.mode === 'trunk' && (p.nativeVlan === vlanId || p.taggedVlans.includes(vlanId))) count++;
    });
  });
  return count;
}

// ============================================================
// VLAN POPOVER (Port-Klick)
// ============================================================
let currentPopover = null;
let popoverDeviceId = null;
let popoverPortId   = null;

function openVlanPopover(deviceId, portId, anchorEl) {
  closeVlanPopover();

  const port = getPort(deviceId, portId);
  if (!port) return;

  popoverDeviceId = deviceId;
  popoverPortId   = portId;

  const pop = document.createElement('div');
  pop.className = 'vlan-popover';
  pop.id = 'vlanPopover';

  // Titel
  const hdr = document.createElement('div');
  hdr.className = 'vlan-pop-header';
  const typeLabel = port.type === 'sfp' ? 'SFP ' : 'PORT ';
  hdr.innerHTML = `
    <span class="vlan-pop-title">${typeLabel}${port.id}</span>
    <button class="vlan-pop-close" onclick="closeVlanPopover()">✕</button>
  `;
  pop.appendChild(hdr);

  // Body
  const body = document.createElement('div');
  body.className = 'vlan-pop-body';

  // Modus
  body.innerHTML += `
    <div class="vlan-pop-row">
      <label class="vlan-pop-label">MODUS</label>
      <div class="pop-mode-group">
        <label class="pop-mode-opt">
          <input type="radio" name="popMode" value="disabled" ${port.mode==='disabled'?'checked':''}>
          <span>Deaktiviert</span>
        </label>
        <label class="pop-mode-opt">
          <input type="radio" name="popMode" value="access" ${port.mode==='access'?'checked':''}>
          <span>Access</span>
        </label>
        <label class="pop-mode-opt">
          <input type="radio" name="popMode" value="trunk" ${port.mode==='trunk'?'checked':''}>
          <span>Trunk</span>
        </label>
      </div>
    </div>
  `;

  // Access VLAN
  const accessVlanOptions = state.vlans.map(v =>
    `<option value="${v.id}" ${v.id===port.accessVlan?'selected':''}>${v.id} — ${escHtml(v.name)}</option>`
  ).join('');
  body.innerHTML += `
    <div class="vlan-pop-row" id="popAccessRow">
      <label class="vlan-pop-label">ACCESS VLAN</label>
      <select id="popAccessVlan" class="vlan-pop-select">
        ${accessVlanOptions}
      </select>
    </div>
  `;

  // Trunk: Native VLAN + Tagged VLANs
  const nativeVlanOptions = state.vlans.map(v =>
    `<option value="${v.id}" ${v.id===port.nativeVlan?'selected':''}>${v.id} — ${escHtml(v.name)}</option>`
  ).join('');
  const taggedVlanOptions = state.vlans.map(v =>
    `<option value="${v.id}" ${port.taggedVlans.includes(v.id)?'selected':''}>${v.id} — ${escHtml(v.name)}</option>`
  ).join('');
  body.innerHTML += `
    <div class="vlan-pop-row" id="popNativeRow">
      <label class="vlan-pop-label">NATIVE VLAN</label>
      <select id="popNativeVlan" class="vlan-pop-select">
        ${nativeVlanOptions}
      </select>
    </div>
    <div class="vlan-pop-row" id="popTaggedRow">
      <label class="vlan-pop-label">TAGGED VLANS</label>
      <select id="popTaggedVlans" class="vlan-pop-select tagged-vlan-select" multiple size="4">
        ${taggedVlanOptions}
      </select>
    </div>
  `;

  // Geschwindigkeit
  const speeds = ['100M','1G','2.5G','10G','25G'];
  const speedOptions = speeds.map(s =>
    `<option value="${s}" ${s===port.speed?'selected':''}>${s}</option>`
  ).join('');
  body.innerHTML += `
    <div class="vlan-pop-row">
      <label class="vlan-pop-label">GESCHWINDIGKEIT</label>
      <select id="popSpeed" class="vlan-pop-select">
        ${speedOptions}
      </select>
    </div>
  `;

  // Label + Notizen
  body.innerHTML += `
    <div class="vlan-pop-row">
      <label class="vlan-pop-label">LABEL</label>
      <input type="text" id="popLabel" class="vlan-pop-input" value="${escHtml(port.label)}" maxlength="30" placeholder="z.B. PC-Büro">
    </div>
    <div class="vlan-pop-row">
      <label class="vlan-pop-label">NOTIZEN</label>
      <input type="text" id="popNotes" class="vlan-pop-input" value="${escHtml(port.notes)}" maxlength="80" placeholder="optional">
    </div>
  `;

  pop.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'vlan-pop-footer';
  footer.innerHTML = `
    <button class="btn-cancel vlan-pop-cancel" onclick="closeVlanPopover()">Abbrechen</button>
    <button class="btn-primary vlan-pop-save" onclick="saveVlanPopover()">Übernehmen</button>
  `;
  pop.appendChild(footer);

  document.body.appendChild(pop);
  currentPopover = pop;

  // Modus-Sichtbarkeit schalten
  updatePopoverMode();
  pop.querySelectorAll('input[name="popMode"]').forEach(r => {
    r.addEventListener('change', updatePopoverMode);
  });

  // Positionierung
  positionPopover(pop, anchorEl);

  // Klick außerhalb → schließen
  setTimeout(() => {
    document.addEventListener('click', outsidePopoverClick, { once: false });
  }, 100);
}

function updatePopoverMode() {
  const mode = document.querySelector('input[name="popMode"]:checked')?.value || 'disabled';
  const accessRow  = document.getElementById('popAccessRow');
  const nativeRow  = document.getElementById('popNativeRow');
  const taggedRow  = document.getElementById('popTaggedRow');

  if (accessRow)  accessRow.style.display  = mode === 'access'  ? '' : 'none';
  if (nativeRow)  nativeRow.style.display  = mode === 'trunk'   ? '' : 'none';
  if (taggedRow)  taggedRow.style.display  = mode === 'trunk'   ? '' : 'none';
}

function positionPopover(pop, anchor) {
  pop.style.position = 'fixed';
  pop.style.zIndex   = '600';
  const rect = anchor.getBoundingClientRect();
  let top  = rect.bottom + 8;
  let left = rect.left;
  const pw = 300;
  if (left + pw > window.innerWidth - 16) left = window.innerWidth - pw - 16;
  if (left < 8) left = 8;
  if (top + 400 > window.innerHeight - 16) top = rect.top - 400 - 8;
  if (top < 8) top = 8;
  pop.style.top  = top  + 'px';
  pop.style.left = left + 'px';
}

function outsidePopoverClick(e) {
  if (currentPopover && !currentPopover.contains(e.target) && !e.target.closest('.rj45-port') && !e.target.closest('.sfp-port')) {
    closeVlanPopover();
  }
}

function closeVlanPopover() {
  document.removeEventListener('click', outsidePopoverClick);
  if (currentPopover) {
    currentPopover.remove();
    currentPopover = null;
  }
  popoverDeviceId = null;
  popoverPortId   = null;
}

function saveVlanPopover() {
  const mode   = document.querySelector('input[name="popMode"]:checked')?.value || 'disabled';
  const access = parseInt(document.getElementById('popAccessVlan')?.value || 1);
  const native = parseInt(document.getElementById('popNativeVlan')?.value || 1);
  const tagged = Array.from(document.getElementById('popTaggedVlans')?.selectedOptions || []).map(o => parseInt(o.value));
  const speed  = document.getElementById('popSpeed')?.value || '1G';
  const label  = (document.getElementById('popLabel')?.value || '').trim();
  const notes  = (document.getElementById('popNotes')?.value || '').trim();

  updatePortVlan(popoverDeviceId, popoverPortId, mode, access, tagged, native, speed, label, notes);
  closeVlanPopover();
}

// ============================================================
// COLOR PREVIEW & PRESETS (für VLAN Modal)
// ============================================================
function updateColorPreview(color) {
  const box = document.getElementById('vlanColorPreview');
  if (box) box.style.background = color;
}

function renderColorPresets() {
  const container = document.getElementById('vlanColorPresets');
  if (!container) return;
  container.innerHTML = '';
  const currentColor = document.getElementById('vlanColorInput')?.value || '';
  VLAN_PRESETS.forEach(color => {
    const dot = document.createElement('div');
    dot.className = 'color-preset-dot' + (color === currentColor ? ' selected' : '');
    dot.style.background = color;
    dot.title = color;
    dot.onclick = () => {
      const inp = document.getElementById('vlanColorInput');
      if (inp) { inp.value = color; updateColorPreview(color); }
      container.querySelectorAll('.color-preset-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
    };
    container.appendChild(dot);
  });
}
