// ============================================================
// 14. INITIALISIERUNG
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Version anzeigen
  const versionEl = document.getElementById('appVersionDisplay');
  if (versionEl) versionEl.textContent = APP_VERSION;

  // Letztes Projekt aus localStorage laden
  const saved = localStorage.getItem('netzwerkpatch_autosave');
  if (saved) {
    try {
      loadProjectData(JSON.parse(saved));
      showToast('Letztes Projekt geladen ✓', 'success');
    } catch {
      updateEmptyState();
      updateProjectDisplay();
    }
  } else {
    updateEmptyState();
    updateProjectDisplay();
  }

  console.log('NETZWERKPATCH', APP_VERSION, '— bereit.');
});
