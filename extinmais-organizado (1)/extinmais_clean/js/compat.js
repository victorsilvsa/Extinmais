// COMPATIBILIDADE
// ============================================
async function downloadBrigadaPDF(companyKey) {
  await openBrigadaPDFSelector(companyKey);
}
// ==== 1. Evita XMLHttpRequest síncrono ====
(function () {
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async, ...rest) {
    if (async === false) {
      console.warn(
        'Evite usar XMLHttpRequest síncrono. Forçando assíncrono.',
        { method, url }
      );
      async = true; // força assíncrono
    }
    return originalOpen.call(this, method, url, async, ...rest);
  };
})();

// ==== 2. Substitui unload por pagehide ====
(function () {
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function (type, listener, options) {
    if (type === 'unload') {
      console.warn('Evento "unload" está obsoleto. Usando "pagehide".');
      type = 'pagehide'; // substitui automaticamente
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  let counter = 0;

  document.querySelectorAll('label').forEach(label => {
    // Pula labels que já têm 'for'
    if (label.hasAttribute('for')) return;

    // Procura um input/textarea/select dentro do label
    let input = label.querySelector('input, select, textarea');

    // Se não houver, procura o próximo input no mesmo form
    if (!input) {
      const form = label.closest('form');
      if (form) {
        input = form.querySelector('input, select, textarea');
      }
    }

    // Se ainda não encontrou, procura o próximo input no DOM
    if (!input) {
      input = document.querySelector('input, select, textarea');
    }

    // Se encontrou um input existente, associa o label
    if (input) {
      if (!input.id) {
        input.id = `auto-input-${counter++}`;
      }
      label.setAttribute('for', input.id);
    }
  });
});

/* ========== BRIGADA - INICIALIZAR ========== */
window.addEventListener('load', initBrigada);