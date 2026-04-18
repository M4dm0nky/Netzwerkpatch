// ============================================================
// 12. PATCH — Port-VLAN-Zuweisung & Tabelle
// ============================================================

// Atomare Aktualisierung der Port-Konfiguration
// portUid = port.uid (unique inner ID, nicht die Display-Nummer)
function updatePortVlan(deviceId, portUid, mode, accessVlan, taggedVlans, nativeVlan, speed, label, notes) {
  const device = getDevice(deviceId);
  if (!device) return;
  const port = device.ports.find(p => (p.uid ?? p.id) === portUid);
  if (!port) return;

  port.mode        = mode        ?? port.mode;
  port.accessVlan  = accessVlan  ?? port.accessVlan;
  port.taggedVlans = taggedVlans ?? port.taggedVlans;
  port.nativeVlan  = nativeVlan  ?? port.nativeVlan;
  if (speed !== undefined) port.speed = speed;
  if (label !== undefined) port.label = label;
  if (notes !== undefined) port.notes = notes;

  markModified();
  refreshPort(deviceId, portUid);
  renderPatchTable();
}

// ============================================================
// SCHEMATISCH-TABELLE
// ============================================================
function renderPatchTable() {
  const tbody = document.getElementById('patchTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (state.devices.length === 0) return;

  state.devices.forEach(device => {
    const rj45Ports = device.ports.filter(p => p.type === 'rj45');
    const sfpPorts  = device.ports.filter(p => p.type === 'sfp');
    const allPorts  = [...rj45Ports, ...sfpPorts];

    allPorts.forEach((port, idx) => {
      const tr = document.createElement('tr');
      if (idx % 2 !== 0) tr.classList.add('odd');

      // Gerätename (nur erste Zeile des Geräts)
      const tdDevice = document.createElement('td');
      tdDevice.className = 'pt-device';
      if (idx === 0) {
        tdDevice.textContent = device.name;
        tdDevice.rowSpan = allPorts.length;
      }
      if (idx === 0) tr.appendChild(tdDevice);

      // Port-Nummer
      const tdPort = document.createElement('td');
      tdPort.className = 'pt-port';
      const prefix = port.type === 'sfp' ? 'S' : 'P';
      tdPort.textContent = prefix + String(port.id).padStart(2, '0');
      tr.appendChild(tdPort);

      // Typ
      const tdType = document.createElement('td');
      tdType.className = 'pt-type';
      tdType.textContent = port.type.toUpperCase();
      tr.appendChild(tdType);

      // Label
      const tdLabel = document.createElement('td');
      tdLabel.className = 'pt-label';
      tdLabel.textContent = port.label || '—';
      if (port.label) tdLabel.style.color = 'var(--text-mono)';
      tr.appendChild(tdLabel);

      // Modus
      const tdMode = document.createElement('td');
      tdMode.className = 'pt-mode';
      const modeLabels = { 'access':'ACCESS', 'trunk':'TRUNK', 'disabled':'—' };
      tdMode.textContent = modeLabels[port.mode] || port.mode;
      if (port.mode === 'access') tdMode.style.color = 'var(--accent-green)';
      else if (port.mode === 'trunk') tdMode.style.color = 'var(--accent-orange)';
      tr.appendChild(tdMode);

      // Access VLAN / Native VLAN
      const tdAccessVlan = document.createElement('td');
      tdAccessVlan.className = 'pt-access-vlan';
      if (port.mode === 'access') {
        const vlan = getVlan(port.accessVlan);
        if (vlan) {
          tdAccessVlan.innerHTML = `<span class="pt-vlan-badge" style="${vlanBadgeStyle(vlan.color)}">${vlan.id}</span> ${escHtml(vlan.name)}`;
        }
      } else if (port.mode === 'trunk') {
        const vlan = getVlan(port.nativeVlan);
        if (vlan) {
          tdAccessVlan.innerHTML = `<span class="pt-vlan-badge" style="${vlanBadgeStyle(vlan.color)}">${vlan.id}</span> <span style="color:var(--text-secondary)">nativ</span>`;
        }
      } else {
        tdAccessVlan.textContent = '—';
        tdAccessVlan.style.color = 'var(--text-secondary)';
      }
      tr.appendChild(tdAccessVlan);

      // Tagged VLANs
      const tdTagged = document.createElement('td');
      tdTagged.className = 'pt-tagged';
      if (port.mode === 'trunk' && port.taggedVlans.length > 0) {
        const badges = port.taggedVlans.map(vid => {
          const vlan = getVlan(vid);
          if (!vlan) return '';
          return `<span class="pt-vlan-badge" style="${vlanBadgeStyle(vlan.color)}" title="${escHtml(vlan.name)}">${vlan.id}</span>`;
        }).join(' ');
        tdTagged.innerHTML = badges;
      } else {
        tdTagged.textContent = '—';
        tdTagged.style.color = 'var(--text-secondary)';
      }
      tr.appendChild(tdTagged);

      // Geschwindigkeit
      const tdSpeed = document.createElement('td');
      tdSpeed.className = 'pt-speed';
      tdSpeed.textContent = port.speed || '—';
      if (port.mode !== 'disabled') tdSpeed.style.color = 'var(--text-primary)';
      else tdSpeed.style.color = 'var(--text-secondary)';
      tr.appendChild(tdSpeed);

      // Notizen
      const tdNotes = document.createElement('td');
      tdNotes.className = 'pt-notes';
      tdNotes.textContent = port.notes || '';
      tdNotes.style.color = 'var(--text-secondary)';
      tr.appendChild(tdNotes);

      tbody.appendChild(tr);
    });
  });
}
