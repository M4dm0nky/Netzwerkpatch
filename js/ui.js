// ============================================================
// 3. MODALS
// ============================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    closeVlanPopover();
  }
});

// ============================================================
// 4. TAB SYSTEM
// ============================================================
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  if (tabName === 'patch') {
    document.getElementById('tabBtnPatch').classList.add('active');
    document.getElementById('tabPatch').classList.add('active');
  } else if (tabName === 'vlans') {
    document.getElementById('tabBtnVlans').classList.add('active');
    document.getElementById('tabVlans').classList.add('active');
    renderVlanManagerTab();
  } else {
    document.getElementById('tabBtnDetails').classList.add('active');
    document.getElementById('tabDetails').classList.add('active');
    renderPatchTable();
  }
}

// ============================================================
// 5. PROJECT FUNCTIONS
// ============================================================
function newProject() {
  openModal('newProjectModal');
  setTimeout(() => {
    const inp = document.getElementById('newProjectNameInput');
    if (inp) inp.focus();
  }, 100);
}

function confirmNewProject() {
  const nameEl = document.getElementById('newProjectNameInput');
  const fieldEl = document.getElementById('npNameField');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) {
    if (fieldEl) fieldEl.classList.add('has-error');
    return;
  }
  if (fieldEl) fieldEl.classList.remove('has-error');
  closeModal('newProjectModal');
  state.projectName  = name;
  state.created      = new Date().toISOString();
  state.projectCreated = true;
  state.devices      = [];
  state.vlans        = [];
  markSaved();
  updateProjectDisplay();
  updateEmptyState();
  renderAllDevices();
  renderVlanPanel();
  // Standardmäßig VLAN 1 anlegen
  if (state.vlans.length === 0) {
    state.vlans.push({ id: 1, name: 'Default', color: '#4a90e8', description: 'Standard-VLAN' });
    renderVlanPanel();
  }
  showToast('Neues Projekt angelegt: ' + name, 'success');
  // Sofort Setup-Modal öffnen
  openNetworkDeviceModal();
}

function openProjectNameModal() {
  const inp = document.getElementById('projectNameInput');
  if (inp) inp.value = state.projectName || '';
  openModal('projectModal');
  setTimeout(() => { if (inp) inp.focus(); }, 100);
}

function confirmProjectName() {
  const inp = document.getElementById('projectNameInput');
  const name = inp ? inp.value.trim() : '';
  if (!name) return;
  state.projectName = name;
  markModified();
  updateProjectDisplay();
  closeModal('projectModal');
}
