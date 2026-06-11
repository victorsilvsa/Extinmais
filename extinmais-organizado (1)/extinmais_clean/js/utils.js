function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
  if (modalId === 'orderModal') {
    setTimeout(preencherTecnicoOS, 100);
    loadClientsForOS();
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = '';
}

// Logo Management
async function loadLogo() {
  const logoRef = database.ref('settings/logo');
  const snapshot = await logoRef.once('value');
  const logoData = snapshot.val();

  if (logoData && logoData.url) {
    currentLogoUrl = logoData.url;
    updateLogoDisplay(logoData.url);
  }
}

function updateLogoDisplay(url) {
  document.getElementById('loginLogoImg').src = url;
  document.getElementById('loginLogoImg').style.display = 'block';
  document.getElementById('loginLogoText').style.display = 'none';

  document.getElementById('sidebarLogoImg').src = url;
  document.getElementById('sidebarLogoImg').style.display = 'block';
  document.getElementById('sidebarLogoText').style.display = 'none';

  document.getElementById('logoPreviewImg').src = url;
  document.getElementById('logoPreviewImg').style.display = 'block';
  document.getElementById('logoPreviewText').style.display = 'none';

  document.getElementById('removeLogo').style.display = 'block';
}

function clearLogoDisplay() {
  document.getElementById('loginLogoImg').style.display = 'none';
  document.getElementById('loginLogoText').style.display = 'flex';

  document.getElementById('sidebarLogoImg').style.display = 'none';
  document.getElementById('sidebarLogoText').style.display = 'flex';

  document.getElementById('logoPreviewImg').style.display = 'none';
  document.getElementById('logoPreviewText').style.display = 'flex';

  document.getElementById('removeLogo').style.display = 'none';
}

document.getElementById('logoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('Arquivo muito grande (máx. 2MB)', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    const logoUrl = event.target.result;
    currentLogoUrl = logoUrl;

    await database.ref('settings/logo').set({
      url: logoUrl,
      uploadDate: new Date().toISOString(),
      uploadedBy: currentUser.nome
    });

    updateLogoDisplay(logoUrl);
    showToast('Logo atualizada com sucesso!');
  };
  reader.readAsDataURL(file);
});

document.getElementById('removeLogo').addEventListener('click', async () => {
  if (confirm('Tem certeza que deseja remover a logo?')) {
    await database.ref('settings/logo').remove();
    currentLogoUrl = null;
    clearLogoDisplay();
    showToast('Logo removida com sucesso!');
  }
});

// ============================================================
// SISTEMA CENTRALIZADO DE LOGO PARA PDFs
// Todos os PDFs chamam getPDFLogoHtml() para obter o bloco de marca.
// Se houver logo configurada na conta (currentLogoUrl), ela é exibida.
// Se não houver, exibe o ícone de extintor padrão.
// Os dados de contato (nome, CNPJ, telefone, email) vêm do usuário logado.
// ============================================================

/**
 * Retorna o bloco HTML da marca para usar nos cabeçalhos de PDF.
 * @param {'light'|'dark'} [theme='dark'] - 'dark' = texto branco (fundo escuro), 'light' = texto escuro
 */
function getPDFLogoHtml(theme = 'dark') {
  const nome  = 'EXTINMAIS';
  const cnpj  = (currentUser && currentUser.cnpj)     ? currentUser.cnpj     : '—';
  const tel   = (currentUser && currentUser.telefone) ? currentUser.telefone : '';
  const email = (currentUser && currentUser.email)    ? currentUser.email    : '';

  const textColor   = theme === 'light' ? '#1f2937'            : '#ffffff';
  const subColor    = theme === 'light' ? '#6b7280'            : 'rgba(255,255,255,0.8)';
  const iconBg      = theme === 'light' ? 'rgba(179,33,23,0.1)' : 'rgba(255,255,255,0.15)';
  const iconColor   = theme === 'light' ? '#b32117'            : '#ffffff';

  const logoBlock = currentLogoUrl
    ? `<img src="${currentLogoUrl}" alt="Logo" style="height:48px;max-width:120px;object-fit:contain;display:block;">`
    : `<div style="width:48px;height:48px;background:${iconBg};border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
         <i class="fas fa-fire-extinguisher" style="font-size:22px;color:${iconColor};"></i>
       </div>`;

  const contatos = [
    cnpj  ? `<span><i class="fas fa-id-card"></i> ${cnpj}</span>`  : '',
    tel   ? `<span><i class="fas fa-phone"></i> ${tel}</span>`      : '',
    email ? `<span><i class="fas fa-envelope"></i> ${email}</span>` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  return `
    <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
      ${logoBlock}
      <div>
        <div style="font-size:18px;font-weight:900;color:${textColor};letter-spacing:1px;line-height:1;">EXTINMAIS</div>
        <div style="font-size:9px;color:${subColor};letter-spacing:0.5px;line-height:1.5;">Proteção e Combate a Incêndio</div>
        ${contatos ? `<div style="font-size:8px;color:${subColor};line-height:1.6;display:flex;flex-wrap:wrap;gap:4px;">${contatos}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Retorna o bloco HTML do rodapé de PDF (versão compacta).
 */
function getPDFFooterHtml() {
  const nome  = 'EXTINMAIS';
  const cnpj  = (currentUser && currentUser.cnpj) ? currentUser.cnpj : '';
  const tel   = (currentUser && currentUser.telefone) ? currentUser.telefone : '';
  const email = (currentUser && currentUser.email)    ? currentUser.email    : '';

  const partes = [nome];
  if (cnpj)  partes.push(`CNPJ: ${cnpj}`);
  if (tel)   partes.push(tel);
  if (email) partes.push(email);

  return partes.join(' &nbsp;·&nbsp; ');
}

// Auto Login
async function autoLogin() {
  const savedUserId = localStorage.getItem('currentUserId');
  if (savedUserId) {
    const snapshot = await database.ref(`users/${savedUserId}`).once('value');
    if (snapshot.exists()) {
      const userData = { id: savedUserId, ...snapshot.val() };
      loginUser(userData);
    } else {
      localStorage.removeItem('currentUserId');
    }
  }
}

// Login
