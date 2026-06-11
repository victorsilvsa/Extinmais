window.addEventListener('load', () => {
  initializeAdmin();
  autoLogin();
});

// Responsive
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024 && currentUser) {
    document.getElementById('sidebarDesktop').style.display = 'flex';
  } else {
    document.getElementById('sidebarDesktop').style.display = 'none';
  }
});
// ===== ORDENS DE SERVIÇO - Código Unificado Completo =====
