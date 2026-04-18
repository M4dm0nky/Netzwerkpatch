// ============================================================
// 14. INITIALISIERUNG
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Version anzeigen
  const versionEl = document.getElementById('appVersionDisplay');
  if (versionEl) versionEl.textContent = APP_VERSION;

  // Leeres Projekt → Empty State
  updateEmptyState();
  updateProjectDisplay();

  // Auto-Save aus localStorage wiederherstellen (optional)
  // const saved = localStorage.getItem('netzwerkpatch_autosave');
  // if (saved) { try { loadProjectData(JSON.parse(saved)); } catch {} }

  console.log('NETZWERKPATCH', APP_VERSION, '— bereit.');
});
