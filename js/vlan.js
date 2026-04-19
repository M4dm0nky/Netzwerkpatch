// ============================================================
// 11. VLAN MANAGEMENT
// ============================================================

const VLAN_PRESETS = [
  '#0066ff', // Blau
  '#ff0000', // Rot
  '#00cc00', // Grün
  '#ffdd00', // Gelb
  '#9900ff', // Lila
  '#00ccff', // Cyan
  '#ff8800', // Orange
  '#ff00ff', // Magenta
  '#ffffff', // Weiß
  '#00ffaa', // Mint
  '#ff6600', // Dunkelorange
  '#6600cc', // Violett
  '#00ff00', // Hellgrün
  '#ff0088', // Pink
  '#0099ff', // Hellblau
  '#ffff00', // Reingelb
];

// ============================================================
// VLAN CRUD
// ============================================================
function openNewVlanModal(editId) {
  if (editId === 1) {
    showToast('Management-VLAN kann nicht bearbeitet werden.', 'warning');
    return;
  }
  const modal = document.getElementById('vlanModal');
  const title = document.getElementById('vlanModalTitle');
  const idEl  = document.getElementById('vlanIdInput');
  const nameEl = document.getElementById('vlanNameInput');
  const colorEl = document.getElementById('vlanColorInput');
  const idField = document.getElementById('vlanIdField');

  if (editId != null) {
    // Bearbeiten
    const vlan = getVlan(editId);
    if (!vlan) return;
    if (title) title.textContent = 'VLAN BEARBEITEN';
    if (idEl)   { idEl.value = vlan.id; idEl.disabled = true; }
    if (nameEl)  nameEl.value = vlan.name;
    if (colorEl) { colorEl.value = vlan.color; updateColorPreview(vlan.color); }
    modal.dataset.editId = editId;
  } else {
    // Neu
    if (title) title.textContent = 'NEUE VLAN';
    if (idEl)   { idEl.value = nextFreeVlanId(); idEl.disabled = false; }
    if (nameEl)  nameEl.value = '';
    const presetColor = VLAN_PRESETS[(state.vlans.length) % VLAN_PRESETS.length];
    if (colorEl) { colorEl.value = presetColor; updateColorPreview(presetColor); }
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
  const idField = document.getElementById('vlanIdField');
  const nameField = document.getElementById('vlanNameField');

  const id    = parseInt(idEl?.value || 0);
  const name  = nameEl?.value.trim() || '';
  const color = colorEl?.value || '#4a90e8';

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
    state.vlans.push({ id, name, color });
    state.vlans.sort((a,b) => a.id - b.id);
    showToast('VLAN ' + id + ' angelegt.', 'success');
  }

  markModified();
  closeModal('vlanModal');
  renderVlanPanel();
  renderVlanManagerTab();
  renderAllDevices(); // Badges aktualisieren
  renderPatchTable();
  if (vlanPopoverRefreshCallback) {
    vlanPopoverRefreshCallback();
    vlanPopoverRefreshCallback = null;
  }
}

function deleteVlan(id) {
  if (id === 1) {
    showToast('Management-VLAN kann nicht gelöscht werden.', 'warning');
    return;
  }
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

  // Fester Trunk-Eintrag (kein VLAN-ID, alle VLANs gehen durch)
  const trunkEntry = document.createElement('div');
  trunkEntry.className = 'vlan-entry';
  trunkEntry.draggable = true;
  trunkEntry.title = 'TRUNK — Alle VLANs\nZiehen → Port auf Trunk setzen';
  trunkEntry.dataset.vlanId = '__trunk__';
  trunkEntry.addEventListener('dragstart', e => {
    e.dataTransfer.setData('vlanId', '__trunk__');
    e.dataTransfer.effectAllowed = 'link';
  });
  const trunkDot = document.createElement('div');
  trunkDot.className = 'vlan-entry-dot';
  trunkDot.style.background = '#808080';
  trunkDot.style.boxShadow = '0 0 4px #80808080';
  const trunkName = document.createElement('div');
  trunkName.className = 'vlan-entry-name';
  trunkName.textContent = 'Trunk';
  const trunkLbl = document.createElement('div');
  trunkLbl.className = 'vlan-entry-id';
  trunkLbl.textContent = 'ALL';
  trunkEntry.appendChild(trunkDot);
  trunkEntry.appendChild(trunkName);
  trunkEntry.appendChild(trunkLbl);
  panel.appendChild(trunkEntry);

  const sep2 = document.createElement('div');
  sep2.className = 'vlan-panel-sep';
  panel.appendChild(sep2);

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
        ${vlan.id === 1
          ? '<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);letter-spacing:0.5px;">🔒 System</span>'
          : `<button class="vlan-action-btn" onclick="openNewVlanModal(${vlan.id})">Bearbeiten</button>
             <button class="vlan-action-btn danger" onclick="deleteVlan(${vlan.id})">Löschen</button>`
        }
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
let vlanPopoverRefreshCallback = null;
let pendingVlanColor = null;

function openVlanPopover(deviceId, portId, anchorEl) {
  closeVlanPopover();
  pendingVlanColor = null;

  const port = getPort(deviceId, portId);
  if (!port) return;

  popoverDeviceId = deviceId;
  popoverPortId   = portId;

  const isManagementPort = port.id === 1 && port.type === 'rj45';

  const pop = document.createElement('div');
  pop.className = 'vlan-popover';
  pop.id = 'vlanPopover';

  // Titel
  const hdr = document.createElement('div');
  hdr.className = 'vlan-pop-header';
  const typeLabel = port.type === 'sfp' ? 'SFP ' : 'PORT ';
  const mgmtBadge = isManagementPort
    ? ' <span style="font-size:9px;background:var(--text-secondary);color:#000;padding:1px 5px;border-radius:2px;letter-spacing:1px;vertical-align:middle;">MGMT</span>'
    : '';
  hdr.innerHTML = `
    <span class="vlan-pop-title">${typeLabel}${port.id}${mgmtBadge}</span>
    <button class="vlan-pop-close" onclick="closeVlanPopover()">✕</button>
  `;
  pop.appendChild(hdr);

  // Body
  const body = document.createElement('div');
  body.className = 'vlan-pop-body';

  // Modus: disabled | access | trunk
  const modeRow = document.createElement('div');
  modeRow.className = 'vlan-pop-row';
  modeRow.innerHTML = `
    <label class="vlan-pop-label">MODUS</label>
    <div class="pop-mode-group">
      <label class="pop-mode-opt">
        <input type="radio" name="popMode" value="disabled" ${port.mode === 'disabled' ? 'checked' : ''}>
        <span>Inaktiv</span>
      </label>
      <label class="pop-mode-opt">
        <input type="radio" name="popMode" value="access" ${port.mode === 'access' ? 'checked' : ''}>
        <span>Access</span>
      </label>
      <label class="pop-mode-opt">
        <input type="radio" name="popMode" value="trunk" ${port.mode === 'trunk' ? 'checked' : ''}>
        <span>Trunk</span>
      </label>
    </div>
  `;
  body.appendChild(modeRow);

  // === ACCESS SECTION ===
  const accessSection = document.createElement('div');
  accessSection.id = 'popAccessSection';

  // VLAN-Zeile mit [+]-Button
  const vlanLabelRow = document.createElement('div');
  vlanLabelRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
  const vlanLabel = document.createElement('label');
  vlanLabel.className = 'vlan-pop-label';
  vlanLabel.textContent = 'VLAN';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'pop-add-btn';
  addBtn.textContent = '+ NEU';
  vlanLabelRow.appendChild(vlanLabel);
  vlanLabelRow.appendChild(addBtn);

  // Farbzeile vorab erzeugen
  const colorRow = document.createElement('div');
  colorRow.className = 'vlan-pop-row';
  colorRow.id = 'popColorRow';
  colorRow.innerHTML = '<label class="vlan-pop-label">FARBE</label>';
  colorRow.appendChild(buildColorRow(port.accessVlan || 1));

  const vlanRow = document.createElement('div');
  vlanRow.className = 'vlan-pop-row';
  vlanRow.id = 'popVlanRow';
  vlanRow.appendChild(vlanLabelRow);
  vlanRow.appendChild(buildVcsSelect('popVlanSelect', state.vlans, port.accessVlan || 1, (vlanId) => {
    updateColorRow(colorRow, vlanId);
    updatePopoverMode();
  }));
  accessSection.appendChild(vlanRow);
  accessSection.appendChild(colorRow);

  // Inline VLAN Creator für Access-Modus
  const accessCreator = buildInlineVlanCreator((newVlan) => {
    refreshPopoverVlanLists();
    const vlanWrap = document.getElementById('popVlanSelect')?.closest('.vcs-wrap');
    if (vlanWrap?._selectById) vlanWrap._selectById(newVlan.id);
    updateColorRow(colorRow, newVlan.id);
    updatePopoverMode();
    accessCreator.style.display = 'none';
  });
  accessCreator.style.display = 'none';
  addBtn.addEventListener('click', () => {
    accessCreator.style.display = accessCreator.style.display === 'none' ? '' : 'none';
  });
  accessSection.appendChild(accessCreator);
  body.appendChild(accessSection);

  // === TRUNK SECTION ===
  const trunkSection = document.createElement('div');
  trunkSection.id = 'popTrunkSection';

  // Native VLAN
  const nativeRow = document.createElement('div');
  nativeRow.className = 'vlan-pop-row';
  nativeRow.innerHTML = '<label class="vlan-pop-label">NATIVE VLAN</label>';
  nativeRow.appendChild(buildVcsSelect('popNativeVlan', state.vlans, port.nativeVlan || 1));
  trunkSection.appendChild(nativeRow);

  // Tagged VLANs
  const taggedRow = document.createElement('div');
  taggedRow.className = 'vlan-pop-row';
  taggedRow.id = 'popTaggedRow';
  taggedRow.innerHTML = '<label class="vlan-pop-label">TAGGED VLANS</label>';
  taggedRow.appendChild(buildVcsMulti('popTaggedVlans', state.vlans, port.taggedVlans));
  trunkSection.appendChild(taggedRow);

  // [+] VLAN für Trunk
  const trunkAddBtn = document.createElement('button');
  trunkAddBtn.type = 'button';
  trunkAddBtn.className = 'pop-add-btn pop-add-btn--full';
  trunkAddBtn.textContent = '+ VLAN erstellen';
  const trunkCreator = buildInlineVlanCreator((newVlan) => {
    refreshPopoverVlanLists();
    trunkCreator.style.display = 'none';
  });
  trunkCreator.style.display = 'none';
  trunkAddBtn.addEventListener('click', () => {
    trunkCreator.style.display = trunkCreator.style.display === 'none' ? '' : 'none';
  });
  trunkSection.appendChild(trunkAddBtn);
  trunkSection.appendChild(trunkCreator);
  body.appendChild(trunkSection);

  // Label
  const labelRow = document.createElement('div');
  labelRow.className = 'vlan-pop-row';
  labelRow.innerHTML = `
    <label class="vlan-pop-label">LABEL</label>
    <input type="text" id="popLabel" class="vlan-pop-input" value="${escHtml(port.label)}" maxlength="30" placeholder="z.B. PC-Büro">
  `;
  body.appendChild(labelRow);

  // Notizen
  const notesRow = document.createElement('div');
  notesRow.className = 'vlan-pop-row';
  notesRow.innerHTML = `
    <label class="vlan-pop-label">NOTIZEN</label>
    <input type="text" id="popNotes" class="vlan-pop-input" value="${escHtml(port.notes)}" maxlength="80" placeholder="optional">
  `;
  body.appendChild(notesRow);

  // Speed
  const speedRow = document.createElement('div');
  speedRow.className = 'vlan-pop-row';
  speedRow.innerHTML = `
    <label class="vlan-pop-label">SPEED</label>
    <select id="popSpeed" class="vlan-pop-select">
      ${['100M','1G','2.5G','10G','25G'].map(s =>
        `<option value="${s}"${port.speed === s ? ' selected' : ''}>${s}</option>`
      ).join('')}
    </select>
  `;
  body.appendChild(speedRow);

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

  updatePopoverMode();
  pop.querySelectorAll('input[name="popMode"]').forEach(r => {
    r.addEventListener('change', updatePopoverMode);
  });

  pop.addEventListener('click', e => {
    if (!e.target.closest('.vcs-wrap')) {
      pop.querySelectorAll('.vcs-list.open, .vcs-trigger.open').forEach(el => el.classList.remove('open'));
    }
  });

  body.addEventListener('scroll', () => {
    pop.querySelectorAll('.vcs-list.open, .vcs-trigger.open').forEach(el => el.classList.remove('open'));
  });

  positionPopover(pop, anchorEl);

  setTimeout(() => {
    document.addEventListener('click', outsidePopoverClick, { once: false });
  }, 100);
}

// ---- Custom VLAN Select (Einzelauswahl, Combobox mit Farbpunkt) ----
function buildVcsSelect(hiddenId, vlans, selectedId, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'vcs-wrap';

  let selVlan = vlans.find(v => v.id === selectedId) || null;

  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.id = hiddenId;
  hidden.value = selVlan ? selVlan.id : '';

  const trigger = document.createElement('div');
  trigger.className = 'vcs-trigger';

  const dot = document.createElement('span');
  dot.className = 'vcs-dot';
  dot.style.background = selVlan ? selVlan.color : 'transparent';

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'vcs-input';
  inp.value = selVlan ? (selVlan.id === 0 ? selVlan.name : `${selVlan.id} — ${selVlan.name}`) : '';
  inp.placeholder = 'VLAN...';
  inp.autocomplete = 'off';
  inp.spellcheck = false;

  const arrow = document.createElement('span');
  arrow.className = 'vcs-arrow';
  arrow.textContent = '▾';

  trigger.appendChild(dot);
  trigger.appendChild(inp);
  trigger.appendChild(arrow);

  const list = document.createElement('div');
  list.className = 'vcs-list';

  function vcsItemLabel(v) {
    return v.id === 0 ? v.name : `${v.id} — ${escHtml(v.name)}`;
  }

  function selectVlan(v) {
    selVlan = v;
    hidden.value = v ? v.id : '';
    dot.style.background = v ? v.color : 'transparent';
    inp.value = v ? (v.id === 0 ? v.name : `${v.id} — ${v.name}`) : '';
    list.querySelectorAll('.vcs-item').forEach(i => {
      i.classList.toggle('selected', parseInt(i.dataset.value) === (v ? v.id : -1));
    });
    if (onChange) onChange(v ? v.id : null);
  }

  function buildItems(filter) {
    list.innerHTML = '';
    const f = (filter || '').trim().toLowerCase();
    const shown = f
      ? vlans.filter(v => (v.id > 0 ? String(v.id).startsWith(f) : false) || v.name.toLowerCase().includes(f))
      : vlans;
    shown.forEach(v => {
      const item = document.createElement('div');
      item.className = 'vcs-item' + (v.id === parseInt(hidden.value) ? ' selected' : '');
      item.dataset.value = v.id;
      item.innerHTML = `<span class="vcs-dot" style="background:${v.color}"></span><span>${vcsItemLabel(v)}</span>`;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        selectVlan(v);
        closeList();
      });
      list.appendChild(item);
    });
  }

  function openList() {
    document.querySelectorAll('.vcs-list.open, .vcs-trigger.open').forEach(el => el.classList.remove('open'));
    const currentText = selVlan ? `${selVlan.id} — ${selVlan.name}` : '';
    buildItems(inp.value === currentText ? '' : inp.value);
    const rect = trigger.getBoundingClientRect();
    list.style.top   = rect.bottom + 'px';
    list.style.left  = rect.left   + 'px';
    list.style.width = rect.width  + 'px';
    list.classList.add('open');
    trigger.classList.add('open');
  }

  function closeList() {
    list.classList.remove('open');
    trigger.classList.remove('open');
    inp.value = selVlan ? (selVlan.id === 0 ? selVlan.name : `${selVlan.id} — ${selVlan.name}`) : '';
  }

  // Klick auf Pfeil oder Dot → Input fokussieren
  trigger.addEventListener('click', e => {
    if (e.target !== inp) { e.preventDefault(); inp.focus(); }
  });

  inp.addEventListener('focus', () => openList());

  inp.addEventListener('input', () => {
    buildItems(inp.value);
    if (!list.classList.contains('open')) openList();
  });

  inp.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeList(); inp.blur(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const num = parseInt(inp.value);
      const byId = vlans.find(v => v.id === num);
      if (byId) { selectVlan(byId); closeList(); inp.blur(); return; }
      const items = list.querySelectorAll('.vcs-item');
      if (items.length === 1) {
        const v = vlans.find(v => v.id === parseInt(items[0].dataset.value));
        if (v) { selectVlan(v); closeList(); inp.blur(); }
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const first = list.querySelector('.vcs-item');
      if (first) first.focus();
    }
  });

  buildItems();
  wrap._rebuildItems = () => buildItems();
  wrap._selectById   = (id) => { selectVlan(vlans.find(v => v.id === id) || null); };

  wrap.appendChild(hidden);
  wrap.appendChild(trigger);
  wrap.appendChild(list);
  return wrap;
}

// ---- Custom VLAN Multi-Select (Mehrfachauswahl mit Farbpunkt) ----
function buildVcsMulti(containerId, vlans, selectedIds) {
  const wrap = document.createElement('div');
  wrap.className = 'vcs-multi';
  wrap.id = containerId;

  function buildMultiItems() {
    wrap.innerHTML = '';
    vlans.forEach(v => {
      const item = document.createElement('div');
      item.className = 'vcs-multi-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = containerId + '_' + v.id;
      cb.value = v.id;
      cb.checked = selectedIds.includes(v.id);
      cb.className = 'vcs-multi-cb';
      const dot = document.createElement('span');
      dot.className = 'vcs-dot';
      dot.style.background = v.color;
      const lbl = document.createElement('label');
      lbl.htmlFor = cb.id;
      lbl.textContent = v.id + ' — ' + v.name;
      item.appendChild(cb);
      item.appendChild(dot);
      item.appendChild(lbl);
      wrap.appendChild(item);
    });
  }

  buildMultiItems();
  wrap._rebuildItems = buildMultiItems;
  return wrap;
}

// ---- Farbzeile im Popover ----
function buildColorRow(vlanId) {
  const row = document.createElement('div');
  row.className = 'vcs-color-row';
  row.dataset.vlanId = vlanId || '';
  if (!vlanId || vlanId <= 1) return row;

  const vlan = state.vlans.find(v => v.id === vlanId);
  const currentColor = (vlan ? vlan.color : '').toLowerCase();

  VLAN_PRESETS.forEach(color => {
    const dot = document.createElement('span');
    dot.className = 'vcs-color-dot';
    dot.dataset.color = color.toLowerCase();
    dot.style.background = color;
    dot.title = color;
    if (color.toLowerCase() === currentColor) dot.classList.add('active');
    dot.addEventListener('click', () => {
      const vid = parseInt(row.dataset.vlanId);
      if (!vid) return;
      pendingVlanColor = { vlanId: vid, color };
      row.querySelectorAll('.vcs-color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      // Dot im VCS-Trigger sofort aktualisieren
      const hiddenEl = document.getElementById('popVlanSelect');
      if (hiddenEl) {
        const triggerDot = hiddenEl.closest('.vcs-wrap')?.querySelector('.vcs-trigger .vcs-dot');
        if (triggerDot) triggerDot.style.background = color;
      }
    });
    row.appendChild(dot);
  });

  return row;
}

function updateColorRow(colorRowEl, vlanId) {
  if (!colorRowEl) return;
  const cr = colorRowEl.querySelector('.vcs-color-row');
  if (!cr) return;
  pendingVlanColor = null;
  cr.dataset.vlanId = vlanId || '';
  const vlan = state.vlans.find(v => v.id === vlanId);
  const currentColor = (vlan ? vlan.color : '').toLowerCase();
  cr.querySelectorAll('.vcs-color-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.color === currentColor);
  });
}

// Aktualisiert alle VLAN-Dropdowns im offenen Popover nach VLAN-Erstellung
function refreshPopoverVlanLists() {
  if (!currentPopover) return;
  // Einzelauswahl-Wraps neu aufbauen
  currentPopover.querySelectorAll('.vcs-wrap').forEach(wrap => {
    if (wrap._rebuildItems) wrap._rebuildItems();
  });
  // Multi-Wrap neu aufbauen (selectedIds aus aktuellen Checkboxen lesen)
  const multiWrap = currentPopover.querySelector('.vcs-multi');
  if (multiWrap && multiWrap._rebuildItems) {
    // aktuelle Auswahl sichern
    const checked = Array.from(multiWrap.querySelectorAll('.vcs-multi-cb:checked')).map(cb => parseInt(cb.value));
    // Funktion ist closure, braucht neue selectedIds – wir rufen direkt rebuild auf
    // und setzen danach die vorherigen + neue VLAN wieder
    multiWrap._rebuildItems();
    multiWrap.querySelectorAll('.vcs-multi-cb').forEach(cb => {
      if (checked.includes(parseInt(cb.value))) cb.checked = true;
    });
  }
}

function updatePopoverMode() {
  const mode          = document.querySelector('input[name="popMode"]:checked')?.value || 'disabled';
  const accessSection = document.getElementById('popAccessSection');
  const trunkSection  = document.getElementById('popTrunkSection');
  const colorRow      = document.getElementById('popColorRow');

  if (accessSection) accessSection.style.display = mode === 'access' ? '' : 'none';
  if (trunkSection)  trunkSection.style.display  = mode === 'trunk'  ? '' : 'none';

  if (colorRow) {
    const selId = parseInt(document.getElementById('popVlanSelect')?.value || 0);
    colorRow.style.display = (mode === 'access' && selId > 1) ? '' : 'none';
  }
}

function positionPopover(pop, anchor) {
  pop.style.position   = 'fixed';
  pop.style.zIndex     = '600';
  pop.style.visibility = 'hidden';
  requestAnimationFrame(() => {
    const rect = anchor.getBoundingClientRect();
    const pw   = pop.offsetWidth || 300;

    let left = rect.left;
    if (left + pw > window.innerWidth - 16) left = window.innerWidth - pw - 16;
    if (left < 8) left = 8;

    const spaceBelow = window.innerHeight - rect.bottom - 8 - 16;
    const spaceAbove = rect.top - 8 - 8;
    let top, maxH;

    if (spaceBelow >= spaceAbove) {
      top  = rect.bottom + 8;
      maxH = spaceBelow;
    } else {
      maxH = spaceAbove;
      top  = rect.top - 8 - maxH;
    }

    pop.style.maxHeight  = maxH + 'px';
    pop.style.top        = top  + 'px';
    pop.style.left       = left + 'px';
    pop.style.visibility = 'visible';
  });
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
  popoverDeviceId  = null;
  popoverPortId    = null;
  pendingVlanColor = null;
}

function saveVlanPopover() {
  const port = getPort(popoverDeviceId, popoverPortId);
  if (!port) return;

  const mode  = document.querySelector('input[name="popMode"]:checked')?.value || 'disabled';
  const label = (document.getElementById('popLabel')?.value || '').trim();
  const notes = (document.getElementById('popNotes')?.value || '').trim();
  const speed = document.getElementById('popSpeed')?.value || port.speed;

  let access, tagged, native;
  if (mode === 'access') {
    access = parseInt(document.getElementById('popVlanSelect')?.value || port.accessVlan);
    tagged = [];
    native = port.nativeVlan || 1;
  } else if (mode === 'trunk') {
    access = port.accessVlan;
    tagged = Array.from(
      document.querySelectorAll('#popTaggedVlans .vcs-multi-cb:checked')
    ).map(cb => parseInt(cb.value));
    native = parseInt(document.getElementById('popNativeVlan')?.value || port.nativeVlan || 1);
  } else {
    access = port.accessVlan;
    tagged = port.taggedVlans;
    native = port.nativeVlan;
  }

  updatePortVlan(popoverDeviceId, popoverPortId, mode, access, tagged, native, speed, label, notes);

  const colorChange = pendingVlanColor;
  closeVlanPopover();

  if (colorChange) {
    const vlan = state.vlans.find(v => v.id === colorChange.vlanId);
    if (vlan) {
      vlan.color = colorChange.color;
      markModified();
      renderVlanPanel();
      renderAllDevices();
    }
  }
}

// ---- Inline VLAN Creator (Schnell-Anlegen im Popover) ----
function buildInlineVlanCreator(onCreated) {
  const wrap = document.createElement('div');
  wrap.className = 'pop-inline-creator';

  const row1 = document.createElement('div');
  row1.className = 'pop-inline-row';
  row1.innerHTML = `
    <div class="pop-inline-field">
      <label class="vlan-pop-label">ID</label>
      <input type="number" class="vlan-pop-input pop-inline-id" min="1" max="4094" placeholder="1–4094">
    </div>
    <div class="pop-inline-field pop-inline-field--grow">
      <label class="vlan-pop-label">NAME</label>
      <input type="text" class="vlan-pop-input pop-inline-name" maxlength="30" placeholder="z.B. Office">
    </div>
  `;
  wrap.appendChild(row1);

  const colorLabel = document.createElement('label');
  colorLabel.className = 'vlan-pop-label';
  colorLabel.textContent = 'FARBE';
  wrap.appendChild(colorLabel);

  let selectedColor = VLAN_PRESETS[0];
  const colorDots = document.createElement('div');
  colorDots.className = 'vcs-color-row';
  VLAN_PRESETS.forEach((color, i) => {
    const dot = document.createElement('span');
    dot.className = 'vcs-color-dot' + (i === 0 ? ' active' : '');
    dot.style.background = color;
    dot.title = color;
    dot.addEventListener('click', () => {
      selectedColor = color;
      colorDots.querySelectorAll('.vcs-color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
    colorDots.appendChild(dot);
  });
  wrap.appendChild(colorDots);

  const errorEl = document.createElement('div');
  errorEl.className = 'pop-inline-error';
  errorEl.style.display = 'none';
  wrap.appendChild(errorEl);

  const btnRow = document.createElement('div');
  btnRow.className = 'pop-inline-btns';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-cancel';
  cancelBtn.style.cssText = 'font-size:11px;padding:4px 10px;';
  cancelBtn.textContent = 'Abbrechen';
  cancelBtn.addEventListener('click', () => { wrap.style.display = 'none'; });

  const createBtn = document.createElement('button');
  createBtn.type = 'button';
  createBtn.className = 'btn-primary';
  createBtn.style.cssText = 'font-size:11px;padding:4px 12px;';
  createBtn.textContent = 'Erstellen';
  createBtn.addEventListener('click', () => {
    const idInput   = wrap.querySelector('.pop-inline-id');
    const nameInput = wrap.querySelector('.pop-inline-name');
    const id   = parseInt(idInput.value);
    const name = nameInput.value.trim();

    if (!id || id < 1 || id > 4094) {
      errorEl.textContent = 'Ungültige VLAN-ID (1–4094)';
      errorEl.style.display = '';
      return;
    }
    if (!name) {
      errorEl.textContent = 'Name ist erforderlich';
      errorEl.style.display = '';
      return;
    }
    if (state.vlans.find(v => v.id === id)) {
      errorEl.textContent = `VLAN ${id} existiert bereits`;
      errorEl.style.display = '';
      return;
    }

    errorEl.style.display = 'none';
    const newVlan = { id, name, color: selectedColor, description: '' };
    state.vlans.push(newVlan);
    state.vlans.sort((a, b) => a.id - b.id);
    markModified();
    renderVlanPanel();
    idInput.value   = '';
    nameInput.value = '';
    if (onCreated) onCreated(newVlan);
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(createBtn);
  wrap.appendChild(btnRow);
  return wrap;
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
