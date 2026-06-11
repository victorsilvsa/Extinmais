// INICIALIZAR
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendar);
} else {
  initCalendar();
}
// ============================================
// BRIGADA - VARIÁVEIS GLOBAIS
// ============================================
let brigadaData = {};
let expandedBrigadaCompanies = {};
const membersPerPage = 8;

// ============================================
// BRIGADA - CARREGAMENTO INICIAL
// ============================================
async function initBrigada() {
  await loadBrigadaOverview();
  await loadAllBrigadaCompanies();
  setupBrigadaRealtimeListener();
}

// ============================================
// BRIGADA - LISTENER REALTIME
// ============================================
function setupBrigadaRealtimeListener() {
  if (!database) return;
  database.ref('brigada').on('value', (snapshot) => {
    brigadaData = snapshot.val() || {};
    updateBrigadaBadge();
    loadAllBrigadaCompanies();
  });
}

// ============================================
// BRIGADA - CARREGAR OVERVIEW
// ============================================
async function loadBrigadaOverview() {
  try {
    const brigadaSnapshot = await database.ref('brigada').once('value');
    brigadaData = brigadaSnapshot.val() || {};
    updateBrigadaBadge();
  } catch (error) {
    console.error('Erro ao carregar brigadistas:', error);
  }
}

// ============================================
// BRIGADA - ATUALIZAR BADGE
// ============================================
function updateBrigadaBadge() {
  let totalBrigadistas = 0;
  Object.values(brigadaData).forEach(company => {
    const brigadistas = company?.brigadistas || {};
    totalBrigadistas += Object.keys(brigadistas).length;
  });
  const badge = document.getElementById('brigadaBadge');
  if (badge) {
    badge.textContent = totalBrigadistas;
    badge.style.display = totalBrigadistas > 0 ? 'block' : 'none';
  }
}

// ============================================
// BRIGADA - CARREGAR TODAS AS EMPRESAS
// ============================================
async function loadAllBrigadaCompanies() {
  try {
    const companiesSnapshot = await database.ref('companies').once('value');
    const companies = companiesSnapshot.val() || {};
    const companiesList = document.getElementById('brigadaCompaniesList');
    if (!companiesList) return;

    companiesList.innerHTML = '';

    if (Object.keys(companies).length === 0) {
      companiesList.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px 20px; color: rgba(255, 255, 255, 0.5);">
          <i class="fas fa-building" style="font-size: 40px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
          <p style="margin: 0; font-size: 13px;">Nenhuma empresa cadastrada</p>
        </div>
      `;
      return;
    }

    Object.entries(companies).forEach(([companyKey, company]) => {
      const brigadistaCount = (brigadaData[companyKey]?.brigadistas && Object.keys(brigadaData[companyKey].brigadistas).length) || 0;
      const isExpanded = expandedBrigadaCompanies[companyKey] || false;

      const card = document.createElement('div');
      card.id = `brigada-company-${companyKey}`;
      card.style.cssText = `
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 0;
        transition: all 0.3s ease;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        background: rgba(0, 0, 0, 0.2);
        transition: all 0.2s;
      `;
      header.onmouseover = () => header.style.background = 'rgba(0, 0, 0, 0.35)';
      header.onmouseout = () => header.style.background = 'rgba(0, 0, 0, 0.2)';

      header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #B32117 0%, #8B1810 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
            <i class="fas fa-building"></i>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="color: #fff; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${company.razao_social}</div>
            <div style="color: rgba(255, 255, 255, 0.5); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${company.cnpj}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
          <div style="background: rgba(212, 194, 154, 0.2); color: #D4C29A; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; min-width: 30px; text-align: center;">
            ${brigadistaCount}
          </div>
          <button
            onclick="event.stopPropagation(); openBrigadaPDFSelector('${companyKey}')"
            style="
              background: rgba(212, 194, 154, 0.2);
              color: #D4C29A;
              border: 1px solid rgba(212, 194, 154, 0.3);
              width: 28px; height: 28px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              display: flex; align-items: center; justify-content: center;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='rgba(212, 194, 154, 0.35)'"
            onmouseout="this.style.background='rgba(212, 194, 154, 0.2)'"
            title="Gerar PDF"
          >
            <i class="fas fa-file-pdf"></i>
          </button>
          <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.5); font-size: 14px;">
            <i class="fas fa-chevron-down" style="transform: ${isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}; transition: transform 0.3s;"></i>
          </div>
        </div>
      `;

      header.onclick = (e) => {
        if (!e.target.closest('button')) toggleBrigadaCompany(companyKey);
      };
      card.appendChild(header);

      if (isExpanded) {
        const content = document.createElement('div');
        content.id = `brigada-content-${companyKey}`;
        content.style.cssText = `
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideDown 0.3s ease;
        `;
        card.appendChild(content);
        renderBrigadaMembers(companyKey, content, company.razao_social);
      }

      companiesList.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar empresas:', error);
  }
}

// ============================================
// BRIGADA - TOGGLE LISTA
// ============================================
function toggleBrigadaList() {
  const body = document.getElementById('brigadaBody');
  const icon = document.querySelector('#brigadaToggleBtn .alerts-toggle-icon');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    icon.style.transform = 'rotate(180deg)';
  } else {
    body.style.display = 'none';
    icon.style.transform = 'rotate(0deg)';
  }
}

// ============================================
// BRIGADA - TOGGLE EMPRESA
// ============================================
function toggleBrigadaCompany(companyKey) {
  expandedBrigadaCompanies[companyKey] = !expandedBrigadaCompanies[companyKey];
  loadAllBrigadaCompanies();
}

// ============================================
// UTILITÁRIO - VERIFICAR VENCIMENTO
// ============================================
function verificarVencimento(dataVencimento) {
  if (!dataVencimento) return { vencido: false, dias: null };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento); vencimento.setHours(0, 0, 0, 0);
  const diferenca = Math.floor((vencimento - hoje) / (1000 * 60 * 60 * 24));
  return { vencido: diferenca < 0, proxAVencer: diferenca >= 0 && diferenca <= 30, dias: diferenca };
}

// ============================================
// BRIGADA - RENDERIZAR MEMBROS
// ============================================
function renderBrigadaMembers(companyKey, container, companyName) {
  const brigadistas = brigadaData[companyKey]?.brigadistas || {};
  const brigadistasArray = Object.entries(brigadistas);
  container.innerHTML = '';

  if (brigadistasArray.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px 12px; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
        <i class="fas fa-users" style="margin-bottom: 8px; display: block; opacity: 0.4;"></i>
        Nenhum brigadista
      </div>
    `;
    addBrigadaBtnToContainer(container, companyKey, companyName);
    return;
  }

  const list = document.createElement('div');
  list.style.cssText = `display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;`;

  brigadistasArray.slice(0, membersPerPage).forEach(([key, brigadista]) => {
    const sv = verificarVencimento(brigadista.dataVencimento);
    let borderColor = '#D4C29A', backgroundColor = 'rgba(255, 255, 255, 0.03)';
    if (sv.vencido) { borderColor = '#B32117'; backgroundColor = 'rgba(179, 33, 23, 0.1)'; }
    else if (sv.proxAVencer) { borderColor = '#FFA500'; backgroundColor = 'rgba(255, 165, 0, 0.1)'; }

    const item = document.createElement('div');
    item.style.cssText = `
      background: ${backgroundColor}; border: 1px solid ${borderColor}4D;
      border-left: 2px solid ${borderColor}; border-radius: 6px;
      padding: 8px 10px; font-size: 12px;
      display: flex; align-items: center; justify-content: space-between; gap: 8px; transition: all 0.3s;
    `;
    const dataVencimento = brigadista.dataVencimento ? new Date(brigadista.dataVencimento).toLocaleDateString('pt-BR') : 'S/ vencimento';
    let statusLabel = '';
    if (sv.vencido) statusLabel = ` <i class="fas fa-exclamation-circle" style="color:#B32117;margin-right:4px;"></i><span style="color:#B32117;font-weight:600;">VENCIDO</span>`;
    else if (sv.proxAVencer) statusLabel = ` <i class="fas fa-clock" style="color:#FFA500;margin-right:4px;"></i><span style="color:#FFA500;font-weight:600;">Vence em ${sv.dias}d</span>`;

    item.innerHTML = `
      <div style="flex:1;min-width:0;">
        <div style="color:#fff;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${brigadista.nome}</div>
        <div style="color:${sv.vencido ? '#B32117' : sv.proxAVencer ? '#FFA500' : 'rgba(255,255,255,0.5)'};font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${brigadista.funcao} • ${dataVencimento}${statusLabel}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button onclick="editBrigadaModal('${companyKey}','${key}')" style="background:rgba(212,194,154,0.2);color:#D4C29A;border:1px solid rgba(212,194,154,0.3);padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;transition:all 0.2s;" onmouseover="this.style.background='rgba(212,194,154,0.35)'" onmouseout="this.style.background='rgba(212,194,154,0.2)'"><i class="fas fa-edit"></i></button>
        <button onclick="deleteBrigadaModal('${companyKey}','${key}')" style="background:rgba(179,33,23,0.2);color:#B32117;border:1px solid rgba(179,33,23,0.3);padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;transition:all 0.2s;" onmouseover="this.style.background='rgba(179,33,23,0.35)'" onmouseout="this.style.background='rgba(179,33,23,0.2)'"><i class="fas fa-trash"></i></button>
      </div>
    `;
    list.appendChild(item);
  });

  container.appendChild(list);

  if (brigadistasArray.length > membersPerPage) {
    const viewMoreBtn = document.createElement('button');
    viewMoreBtn.style.cssText = `width:100%;padding:6px;background:rgba(212,194,154,0.1);border:1px solid rgba(212,194,154,0.2);color:#D4C29A;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;margin-bottom:8px;`;
    viewMoreBtn.textContent = `Ver todos (${brigadistasArray.length})`;
    viewMoreBtn.onmouseover = () => viewMoreBtn.style.background = 'rgba(212,194,154,0.2)';
    viewMoreBtn.onmouseout = () => viewMoreBtn.style.background = 'rgba(212,194,154,0.1)';
    viewMoreBtn.onclick = () => openBrigadaMembersModal(companyKey, companyName);
    container.appendChild(viewMoreBtn);
  }

  addBrigadaBtnToContainer(container, companyKey, companyName);
}

// ============================================
// BRIGADA - MODAL VER TODOS
// ============================================
async function openBrigadaMembersModal(companyKey, companyName) {
  const brigadistas = brigadaData[companyKey]?.brigadistas || {};
  const brigadistasArray = Object.entries(brigadistas);

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.style.cssText = `display:flex!important;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:9999;align-items:center;justify-content:center;padding:20px;`;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);border:2px solid #D4C29A;border-radius:12px;padding:0;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;`;
  modalContent.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:2px solid #D4C29A;position:sticky;top:0;background:#0d0d0d;z-index:10;">
      <div><h2 style="margin:0;color:#D4C29A;font-size:16px;font-weight:700;">Brigadistas</h2><p style="margin:4px 0 0 0;color:rgba(255,255,255,0.5);font-size:11px;">${companyName}</p></div>
      <button onclick="this.closest('.modal').remove()" style="background:none;border:none;color:#D4C29A;font-size:20px;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:14px;background:#0d0d0d;"><div id="modalBrigadistasList" style="display:flex;flex-direction:column;gap:8px;"></div></div>
  `;
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  const listContainer = modal.querySelector('#modalBrigadistasList');
  brigadistasArray.forEach(([key, brigadista]) => {
    const sv = verificarVencimento(brigadista.dataVencimento);
    let borderColor = '#D4C29A', backgroundColor = 'rgba(255,255,255,0.03)';
    if (sv.vencido) { borderColor = '#B32117'; backgroundColor = 'rgba(179,33,23,0.1)'; }
    else if (sv.proxAVencer) { borderColor = '#FFA500'; backgroundColor = 'rgba(255,165,0,0.1)'; }

    const item = document.createElement('div');
    item.style.cssText = `background:${backgroundColor};border:1px solid ${borderColor}4D;border-left:2px solid ${borderColor};border-radius:6px;padding:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;`;
    const dataVencimento = brigadista.dataVencimento ? new Date(brigadista.dataVencimento).toLocaleDateString('pt-BR') : 'S/ vencimento';
    const dataCadastro = new Date(brigadista.dataCadastro).toLocaleDateString('pt-BR');
    const dataInicio = brigadista.dataInicio ? new Date(brigadista.dataInicio).toLocaleDateString('pt-BR') : 'N/A';
    let statusHTML = '';
    if (sv.vencido) statusHTML = ` <span style="color:#B32117;font-weight:600;font-size:10px;"><i class="fas fa-exclamation-circle"></i> VENCIDO</span>`;
    else if (sv.proxAVencer) statusHTML = ` <span style="color:#FFA500;font-weight:600;font-size:10px;"><i class="fas fa-clock"></i> Vence em ${sv.dias}d</span>`;

    item.innerHTML = `
      <div style="flex:1;min-width:0;">
        <div style="color:#fff;font-weight:600;font-size:12px;">${brigadista.nome}${statusHTML}</div>
        <div style="color:rgba(255,255,255,0.5);font-size:11px;">${brigadista.funcao}</div>
        <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:2px;font-family:monospace;">CPF: ${brigadista.cpf} | RG: ${brigadista.rg || 'N/A'} | Tel: ${brigadista.telefone || 'N/A'}</div>
        <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:1px;font-family:monospace;">Email: ${brigadista.email || 'N/A'}</div>
        <div style="color:${sv.vencido ? '#B32117' : sv.proxAVencer ? '#FFA500' : 'rgba(212,194,154,0.6)'};font-size:10px;margin-top:4px;"><i class="fas fa-calendar-alt"></i> Início: ${dataInicio} | Cadastro: ${dataCadastro} | Vencimento: ${dataVencimento}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button onclick="editBrigadaModal('${companyKey}','${key}')" style="background:rgba(212,194,154,0.2);color:#D4C29A;border:1px solid rgba(212,194,154,0.3);padding:6px 10px;border-radius:4px;cursor:pointer;font-size:11px;" onmouseover="this.style.background='rgba(212,194,154,0.35)'" onmouseout="this.style.background='rgba(212,194,154,0.2)'"><i class="fas fa-edit"></i></button>
        <button onclick="deleteBrigadaModal('${companyKey}','${key}')" style="background:rgba(179,33,23,0.2);color:#B32117;border:1px solid rgba(179,33,23,0.3);padding:6px 10px;border-radius:4px;cursor:pointer;font-size:11px;" onmouseover="this.style.background='rgba(179,33,23,0.35)'" onmouseout="this.style.background='rgba(179,33,23,0.2)'"><i class="fas fa-trash"></i></button>
      </div>
    `;
    listContainer.appendChild(item);
  });
}

// ============================================
// BRIGADA - BOTÃO ADICIONAR
// ============================================
function addBrigadaBtnToContainer(container, companyKey, companyName) {
  const btnDiv = document.createElement('div');
  btnDiv.style.marginTop = '8px';
  const btn = document.createElement('button');
  btn.style.cssText = `width:100%;padding:8px;background:linear-gradient(135deg,#B32117 0%,#8B1810 100%);border:none;color:white;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;`;
  btn.innerHTML = '<i class="fas fa-plus"></i> Adicionar';
  btn.onmouseover = () => btn.style.filter = 'brightness(1.1)';
  btn.onmouseout = () => btn.style.filter = 'brightness(1)';
  btn.onclick = () => openAddBrigadaModal(companyKey, companyName);
  btnDiv.appendChild(btn);
  container.appendChild(btnDiv);
}

// ============================================
// BRIGADA - MODAL ADICIONAR
// ============================================
async function openAddBrigadaModal(companyKey, companyName) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.style.cssText = `display:flex!important;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:9999;align-items:center;justify-content:center;padding:20px;`;
  const mc = document.createElement('div');
  mc.style.cssText = `background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);border:2px solid #D4C29A;border-radius:12px;padding:0;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;`;
  mc.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:2px solid #D4C29A;">
      <h2 style="margin:0;color:#D4C29A;font-size:16px;font-weight:700;"><i class="fas fa-plus-circle" style="margin-right:8px;"></i>Novo Brigadista</h2>
      <button onclick="this.closest('.modal').remove()" style="background:none;border:none;color:#D4C29A;font-size:20px;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:16px;background:#0d0d0d;">
      <div style="background:rgba(212,194,154,0.1);border-left:2px solid #D4C29A;padding:10px;border-radius:6px;margin-bottom:14px;font-size:11px;color:#999;">
        <strong style="color:#D4C29A;"><i class="fas fa-building" style="margin-right:6px;"></i>${companyName}</strong>
      </div>
      <form id="formAddBrigada" style="display:flex;flex-direction:column;gap:12px;">
        ${_brigadaFormFields()}
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="submit" style="flex:1;padding:10px;background:linear-gradient(135deg,#B32117 0%,#8B1810 100%);color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='brightness(1)'"><i class="fas fa-check" style="margin-right:6px;"></i>Adicionar</button>
          <button type="button" onclick="this.closest('.modal').remove()" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#ccc;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Cancelar</button>
        </div>
      </form>
    </div>
  `;
  modal.appendChild(mc);
  document.body.appendChild(modal);

  document.getElementById('formAddBrigada').onsubmit = async (e) => {
    e.preventDefault();
    const dados = _coletarDadosBrigadaForm('');
    if (!dados.nome || !dados.email || !dados.cpf || !dados.rg || !dados.funcao) {
      showNotification('Preencha todos os campos obrigatórios', 'error'); return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adicionando...';
    try {
      const key = Date.now().toString();
      await database.ref(`brigada/${companyKey}/brigadistas/${key}`).set({ ...dados, dataCadastro: new Date().toISOString() });
      modal.remove();
      showNotification('Brigadista adicionado com sucesso!', 'success');
    } catch (err) {
      showNotification('Erro ao adicionar brigadista', 'error');
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Adicionar';
    }
  };
}

// ============================================
// BRIGADA - MODAL EDITAR
// ============================================
async function editBrigadaModal(companyKey, brigadistaKey) {
  const brigadista = brigadaData[companyKey]?.brigadistas[brigadistaKey];
  if (!brigadista) return;
  const companies = (await database.ref('companies').once('value')).val() || {};
  const companyName = companies[companyKey]?.razao_social || 'Empresa';
  const dataInicioFmt = brigadista.dataInicio ? new Date(brigadista.dataInicio).toISOString().split('T')[0] : '';
  const dataVencimentoFmt = brigadista.dataVencimento ? new Date(brigadista.dataVencimento).toISOString().split('T')[0] : '';

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.style.cssText = `display:flex!important;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:9999;align-items:center;justify-content:center;padding:20px;`;
  const mc = document.createElement('div');
  mc.style.cssText = `background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);border:2px solid #D4C29A;border-radius:12px;padding:0;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;`;
  mc.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:2px solid #D4C29A;">
      <h2 style="margin:0;color:#D4C29A;font-size:16px;font-weight:700;"><i class="fas fa-edit" style="margin-right:8px;"></i>Editar Brigadista</h2>
      <button onclick="this.closest('.modal').remove()" style="background:none;border:none;color:#D4C29A;font-size:20px;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:16px;background:#0d0d0d;">
      <div style="background:rgba(212,194,154,0.1);border-left:2px solid #D4C29A;padding:10px;border-radius:6px;margin-bottom:14px;font-size:11px;color:#999;">
        <strong style="color:#D4C29A;"><i class="fas fa-building" style="margin-right:6px;"></i>${companyName}</strong>
      </div>
      <form id="formEditBrigada" style="display:flex;flex-direction:column;gap:12px;">
        ${_brigadaFormFields('edit', brigadista, dataInicioFmt, dataVencimentoFmt)}
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button type="submit" style="flex:1;padding:10px;background:linear-gradient(135deg,#B32117 0%,#8B1810 100%);color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='brightness(1)'"><i class="fas fa-save" style="margin-right:6px;"></i>Salvar</button>
          <button type="button" onclick="this.closest('.modal').remove()" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#ccc;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Cancelar</button>
        </div>
      </form>
    </div>
  `;
  modal.appendChild(mc);
  document.body.appendChild(modal);

  document.getElementById('formEditBrigada').onsubmit = async (e) => {
    e.preventDefault();
    const dados = _coletarDadosBrigadaForm('edit');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    try {
      await database.ref(`brigada/${companyKey}/brigadistas/${brigadistaKey}`).update(dados);
      modal.remove();
      showNotification('Brigadista atualizado com sucesso!', 'success');
    } catch (err) {
      showNotification('Erro ao atualizar brigadista', 'error');
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Salvar';
    }
  };
}

// ============================================
// BRIGADA - MODAL DELETAR
// ============================================
function deleteBrigadaModal(companyKey, brigadistaKey) {
  const brigadista = brigadaData[companyKey]?.brigadistas[brigadistaKey];
  if (!brigadista) return;
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.style.cssText = `display:flex!important;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:9999;align-items:center;justify-content:center;padding:20px;`;
  const mc = document.createElement('div');
  mc.style.cssText = `background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);border:2px solid #B32117;border-radius:12px;padding:20px;max-width:380px;width:100%;text-align:center;`;
  mc.innerHTML = `
    <div style="width:50px;height:50px;background:rgba(179,33,23,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;color:#B32117;"><i class="fas fa-exclamation-triangle"></i></div>
    <h2 style="color:#fff;margin:0 0 8px 0;font-size:16px;font-weight:700;">Confirmar Exclusão</h2>
    <p style="color:rgba(255,255,255,0.5);margin:0 0 6px 0;font-size:12px;">Deseja remover:</p>
    <p style="color:#D4C29A;margin:0 0 14px 0;font-size:13px;font-weight:600;">${brigadista.nome}</p>
    <div style="display:flex;gap:8px;">
      <button onclick="deleteBrigada('${companyKey}','${brigadistaKey}');this.closest('.modal').remove();" style="flex:1;padding:10px;background:linear-gradient(135deg,#B32117 0%,#8B1810 100%);color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='brightness(1)'"><i class="fas fa-trash"></i> Deletar</button>
      <button onclick="this.closest('.modal').remove()" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#ccc;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Cancelar</button>
    </div>
  `;
  modal.appendChild(mc);
  document.body.appendChild(modal);
}

// ============================================
// BRIGADA - DELETAR
// ============================================
async function deleteBrigada(companyKey, brigadistaKey) {
  try {
    await database.ref(`brigada/${companyKey}/brigadistas/${brigadistaKey}`).remove();
    showNotification('Brigadista removido com sucesso!', 'success');
  } catch (err) {
    showNotification('Erro ao remover brigadista', 'error');
  }
}

// ============================================
// BRIGADA - HELPERS INTERNOS DE FORM
// ============================================
function _fieldStyle() {
  return `width:100%;padding:8px;background:#1a1a1a;border:2px solid #D4C29A;border-radius:6px;color:#fff;font-size:12px;outline:none;box-sizing:border-box;`;
}
function _labelStyle() {
  return `color:#D4C29A;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:4px;`;
}

function _brigadaFormFields(prefix = '', b = {}, dataInicioVal = '', dataVencVal = '') {
  const funcoes = ['Chefe da Brigada', 'Vice-Chefe', 'Brigadista', 'Primeiro Socorrista', 'Responsável por Equipamento'];
  const sel = (v) => funcoes.map(f => `<option value="${f}" ${b.funcao === f ? 'selected' : ''}>${f}</option>`).join('');

  return `
    <div><label style="${_labelStyle()}">Nome *</label><input type="text" id="${prefix}brigadaNome" value="${b.nome || ''}" required placeholder="Nome completo" style="${_fieldStyle()}"></div>
    <div><label style="${_labelStyle()}">Email *</label><input type="email" id="${prefix}brigadaEmail" value="${b.email || ''}" required placeholder="email@example.com" style="${_fieldStyle()}"></div>
    <div><label style="${_labelStyle()}">CPF *</label><input type="text" id="${prefix}brigadaCPF" value="${b.cpf || ''}" required placeholder="000.000.000-00" style="${_fieldStyle()}"></div>
    <div><label style="${_labelStyle()}">RG *</label><input type="text" id="${prefix}brigadaRG" value="${b.rg || ''}" required placeholder="00.000.000-0" style="${_fieldStyle()}"></div>
    <div><label style="${_labelStyle()}">Telefone</label><input type="tel" id="${prefix}brigadaTelefone" value="${b.telefone || ''}" placeholder="(00) 00000-0000" style="${_fieldStyle()}"></div>
    <div><label style="${_labelStyle()}">Função *</label><select id="${prefix}brigadaFuncao" required style="${_fieldStyle()}"><option value="">-- Selecione --</option>${sel(b.funcao)}</select></div>
    <div><label style="${_labelStyle()}">Data de Início</label><input type="date" id="${prefix}brigadaDataInicio" value="${dataInicioVal}" style="${_fieldStyle()}"></div>
    <div><label style="${_labelStyle()}">Data de Vencimento</label><input type="date" id="${prefix}brigadaDataVencimento" value="${dataVencVal}" style="${_fieldStyle()}"></div>
  `;
}

function _coletarDadosBrigadaForm(prefix = '') {
  const g = (id) => document.getElementById(`${prefix}${id}`)?.value?.trim() || '';
  const di = g('brigadaDataInicio');
  const dv = g('brigadaDataVencimento');
  return {
    nome: g('brigadaNome'),
    email: g('brigadaEmail'),
    cpf: g('brigadaCPF'),
    rg: g('brigadaRG'),
    telefone: g('brigadaTelefone'),
    funcao: g('brigadaFuncao'),
    dataInicio: di ? new Date(di).toISOString() : null,
    dataVencimento: dv ? new Date(dv).toISOString() : null,
  };
}


// ============================================================
// PDF DA BRIGADA — DOWNLOAD DIRETO (sem preview, sem print)
// ============================================================


// ============================================
// PDF - INJEÇÃO DE ESTILOS
// ============================================
function injectBrigadaPDFStyles() {
  if (!document.getElementById('extinmais-pdf-styles')) {
    if (typeof injectPDFStyles === 'function') injectPDFStyles();
  }
  if (document.getElementById('brigada-pdf-extra-styles')) return;
  const style = document.createElement('style');
  style.id = 'brigada-pdf-extra-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Pinyon+Script&family=Great+Vibes&display=swap');
    .epdf-brigada-table {
      width: 100%; border-collapse: collapse; font-size: 8px;
    }
    .epdf-brigada-table thead tr {
      background: linear-gradient(135deg, #991b1b, #dc2626); color: white;
    }
    .epdf-brigada-table thead th {
      padding: 6px 8px; text-align: center; font-weight: 700;
      font-size: 7px; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
    }
    .epdf-brigada-table tbody tr:nth-child(even) { background: #f9fafb; }
    .epdf-brigada-table tbody tr:nth-child(odd)  { background: #ffffff; }
    .epdf-brigada-table td {
      padding: 5px 8px; border-bottom: 1px solid #f0f0f0;
      text-align: center; font-size: 7.5px; color: #1f2937; font-weight: 500;
    }
    .epdf-brigada-table td.td-nome  { text-align:left; font-weight:700; color:#111827; font-size:8px; }
    .epdf-brigada-table td.td-num   { font-weight:800; color:#374151; font-size:9px; }
    .epdf-brigada-table .td-status-ok   { color:#059669; font-weight:700; }
    .epdf-brigada-table .td-status-venc { color:#dc2626; font-weight:700; }
    .epdf-brigada-table .td-status-prox { color:#d97706; font-weight:700; }
    .epdf-brigada-stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 6px; padding: 10px 14px;
      background: #fafafa; border-bottom: 1px solid #f0f0f0;
    }
    @media print {
      .cert-landscape-page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// PDF - BLOCO: CARD EMPRESA (brigada)
// ============================================
function epdfBrigadaEmpresa(company) {
  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-red">
        <i class="fas fa-building"></i> Dados da Empresa
      </div>
      <div class="epdf-grid epdf-g4">
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-tag"></i>Razão Social</div><div class="epdf-fvalue big">${company.razao_social || '—'}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-id-card"></i>CNPJ / CPF</div><div class="epdf-fvalue">${company.cnpj || '—'}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-phone"></i>Telefone</div><div class="epdf-fvalue">${company.telefone || '—'}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-user-tie"></i>Responsável</div><div class="epdf-fvalue">${company.responsavel || '—'}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-map-pin"></i>CEP</div><div class="epdf-fvalue">${company.cep || '—'}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-map-marker-alt"></i>Endereço</div><div class="epdf-fvalue">${company.endereco || '—'}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-envelope"></i>Email</div><div class="epdf-fvalue">${company.email || '—'}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-calendar-check"></i>Data do Relatório</div><div class="epdf-fvalue">${new Date().toLocaleDateString('pt-BR')}</div></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// PDF - BLOCO: ESTATÍSTICAS DA BRIGADA
// ============================================
function epdfBrigadaStats(brigadistasArray) {
  const total = brigadistasArray.length;
  const vencidos = brigadistasArray.filter(([, b]) => verificarVencimento(b.dataVencimento).vencido).length;
  const proximos = brigadistasArray.filter(([, b]) => verificarVencimento(b.dataVencimento).proxAVencer).length;
  const ok = total - vencidos - proximos;
  const chefes = brigadistasArray.filter(([, b]) => b.funcao === 'Chefe da Brigada').length;
  const vice = brigadistasArray.filter(([, b]) => b.funcao === 'Vice-Chefe').length;
  const membros = total - chefes - vice;

  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-gray">
        <i class="fas fa-chart-bar"></i> Resumo da Brigada
        <span class="epdf-badge">${total} BRIGADISTAS</span>
      </div>
      <div class="epdf-brigada-stats">
        <div class="epdf-stat"><div class="epdf-stat-val" style="color:#111827;">${total}</div><div class="epdf-stat-lbl"><i class="fas fa-users" style="color:#6b7280;"></i> Total</div></div>
        <div class="epdf-stat"><div class="epdf-stat-val" style="color:#059669;">${ok}</div><div class="epdf-stat-lbl"><i class="fas fa-check-circle" style="color:#059669;"></i> Em Dia</div></div>
        <div class="epdf-stat"><div class="epdf-stat-val" style="color:#d97706;">${proximos}</div><div class="epdf-stat-lbl"><i class="fas fa-clock" style="color:#d97706;"></i> Próx. Venc.</div></div>
        <div class="epdf-stat"><div class="epdf-stat-val" style="color:#dc2626;">${vencidos}</div><div class="epdf-stat-lbl"><i class="fas fa-exclamation-circle" style="color:#dc2626;"></i> Vencidos</div></div>
      </div>
      <div class="epdf-grid epdf-g3">
        <div class="epdf-col"><div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-star"></i>Chefes de Brigada</div><div class="epdf-fvalue">${chefes}</div></div></div>
        <div class="epdf-col"><div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-star-half-alt"></i>Vice-Chefes</div><div class="epdf-fvalue">${vice}</div></div></div>
        <div class="epdf-col"><div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-user-shield"></i>Demais Membros</div><div class="epdf-fvalue">${membros}</div></div></div>
      </div>
    </div>
  `;
}

// ============================================
// PDF - BLOCO: TABELA DE BRIGADISTAS
// ============================================
function epdfBrigadaTabela(brigadistasArray, inicio, fim) {
  const slice = brigadistasArray.slice(inicio, fim);
  const rows = slice.map(([, b], idx) => {
    const sv = verificarVencimento(b.dataVencimento);
    const dataInicio = b.dataInicio ? new Date(b.dataInicio).toLocaleDateString('pt-BR') : '—';
    const dataVenc = b.dataVencimento ? new Date(b.dataVencimento).toLocaleDateString('pt-BR') : '—';
    let statusCls = '', statusTxt = '';
    if (sv.vencido) { statusCls = 'td-status-venc'; statusTxt = 'Vencido'; }
    else if (sv.proxAVencer) { statusCls = 'td-status-prox'; statusTxt = `${sv.dias}d`; }
    else { statusCls = 'td-status-ok'; statusTxt = 'OK'; }

    return `
      <tr>
        <td class="td-num">${inicio + idx + 1}</td>
        <td class="td-nome">${b.nome || '—'}</td>
        <td>${b.funcao || '—'}</td>
        <td>${b.cpf || '—'}</td>
        <td>${b.rg || '—'}</td>
        <td>${b.telefone || '—'}</td>
        <td>${b.email || '—'}</td>
        <td>${dataInicio}</td>
        <td>${dataVenc}</td>
        <td class="${statusCls}">${statusTxt}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-gray">
        <i class="fas fa-list-ul"></i> Lista de Brigadistas
        <span class="epdf-badge">${inicio + 1}–${Math.min(fim, brigadistasArray.length)} / ${brigadistasArray.length}</span>
      </div>
      <div style="overflow-x:auto;">
        <table class="epdf-brigada-table">
          <thead>
            <tr>
              <th>#</th><th>Nome</th><th>Função</th><th>CPF</th><th>RG</th>
              <th>Telefone</th><th>Email</th><th>Início</th><th>Vencimento</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================
// PDF - BLOCO: ASSINATURAS (brigada)
// ============================================
function epdfBrigadaSignatures(company) {
  const tecnico = (window.currentUser && window.currentUser.nome) ? window.currentUser.nome : 'Técnico Responsável';
  const cnpjTec = (window.currentUser && window.currentUser.cnpj) ? window.currentUser.cnpj : '—';
  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-gray">
        <i class="fas fa-pen-nib"></i> Assinaturas e Responsabilidades
      </div>
      <div class="epdf-sigs">
        <div class="epdf-sig">
          <div class="epdf-sig-role"><i class="fas fa-hard-hat" style="margin-right:4px;"></i>Técnico Responsável</div>
          <div class="epdf-sig-line">
            <div class="epdf-sig-name">${tecnico}</div>
            <div class="epdf-sig-sub">CNPJ: ${cnpjTec}</div>
            <div class="epdf-sig-sub2">EXTINMAIS — Proteção e Combate a Incêndio</div>
          </div>
        </div>
        <div class="epdf-sig">
          <div class="epdf-sig-role"><i class="fas fa-user-tie" style="margin-right:4px;"></i>Responsável pelo Local</div>
          <div class="epdf-sig-line">
            <div class="epdf-sig-name">${company.responsavel || 'Responsável'}</div>
            <div class="epdf-sig-sub">${company.razao_social || '—'}</div>
            <div class="epdf-sig-sub2">${company.endereco || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// PDF - GERADOR: RELATÓRIO COMPLETO
// ============================================
// ============================================
// PDF - GERADOR: RELATÓRIO COMPLETO
// ============================================
function generateBrigadaRelatorio(company, brigadistasArray) {
  if (typeof injectPDFStyles === 'function') injectPDFStyles();
  injectBrigadaPDFStyles();

  const H = {
    header: 108, footer: 52, gap: 10, bodyPad: 28,
    empresa: 100, stats: 165,
    tabela_header: 36, tabela_row: 18, signatures: 130,
  };
  const PAGE_H = 1123 - H.header - H.footer - H.bodyPad;
  const total = brigadistasArray.length;
  const POR_PAGINA_PRIMEIRA = Math.floor((PAGE_H - H.empresa - H.gap - H.stats - H.gap - H.tabela_header) / H.tabela_row);
  const POR_PAGINA_DEMAIS = Math.floor((PAGE_H - H.tabela_header - H.signatures - H.gap) / H.tabela_row);

  const pages = [];
  const fimPag1 = Math.min(POR_PAGINA_PRIMEIRA, total);
  pages.push(`
    ${epdfBrigadaEmpresa(company)}
    ${epdfBrigadaStats(brigadistasArray)}
    ${total > 0 ? epdfBrigadaTabela(brigadistasArray, 0, fimPag1) : ''}
  `);

  let cursor = fimPag1;
  while (cursor < total) {
    const fimPagN = Math.min(cursor + POR_PAGINA_DEMAIS, total);
    pages.push(`
      ${epdfBrigadaTabela(brigadistasArray, cursor, fimPagN)}
    `);
    cursor = fimPagN;
  }

  if (total === 0) {
    pages[0] += `
      <div class="epdf-card">
        <div class="epdf-card-title epdf-ct-gray"><i class="fas fa-users"></i> Brigadistas</div>
        <div style="padding:14px;font-size:9px;color:#6b7280;text-align:center;">Nenhum brigadista cadastrado.</div>
      </div>
    `;
  }

  // ✅ Adiciona assinaturas na ÚLTIMA página após construir todas
  const lastPageIdx = pages.length - 1;
  pages[lastPageIdx] += epdfBrigadaSignatures(company);

  const totalPages = pages.length;
  return pages.map((body, i) => `
    <div class="extinpdf-page">
      ${epdfHeader('RELATÓRIO DE BRIGADA DE INCÊNDIO')}
      <div class="epdf-body">${body}</div>
      ${epdfFooter(i + 1, totalPages)}
    </div>
  `).join('');
}




// ============================================================
// PDF - CERTIFICADO INDIVIDUAL — PAISAGEM A4 (CORRIGIDO v2)
// SEM writing-mode em nenhum elemento — compatível html2canvas
// ============================================================

function buildCertificadoLandscapeHTML(b, company, pageNum, totalPages, logoUrl) {
  const sv = verificarVencimento(b.dataVencimento);
  const dataInicio = b.dataInicio ? new Date(b.dataInicio).toLocaleDateString('pt-BR') : '—';
  const dataVencimento = b.dataVencimento ? new Date(b.dataVencimento).toLocaleDateString('pt-BR') : '—';
  const dataEmissao = new Date().toLocaleDateString('pt-BR');

  const tecnico = (window.currentUser && window.currentUser.nome) ? window.currentUser.nome : 'Técnico Responsável';
  const cnpjTec = (window.currentUser && window.currentUser.cnpj) ? window.currentUser.cnpj : '—';
  const telefoneTec = (window.currentUser && window.currentUser.telefone) ? window.currentUser.telefone : '—';

  const numSeq = String(pageNum).padStart(4, '0');
  const registro = `BRI-${new Date().getFullYear()}-${numSeq}`;

  let statusBg = '#15803d', statusTxt = 'CERTIFICADO VÁLIDO', statusIcon = '✓';
  if (sv.vencido) { statusBg = '#b91c1c'; statusTxt = 'CERTIFICADO VENCIDO'; statusIcon = '✗'; }
  else if (sv.proxAVencer) { statusBg = '#b45309'; statusTxt = `VENCE EM ${sv.dias} DIAS`; statusIcon = '⚠'; }

  const validadeColor = sv.vencido ? '#b91c1c' : sv.proxAVencer ? '#b45309' : '#3a2010';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@300;400;700;900&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 297mm; height: 210mm; overflow: hidden; background: #faf7f0; }

    .dado-cel {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      min-height: 11mm;
      padding-bottom: 2.5mm;
    }
    .dado-label {
      font-family: 'Lato', sans-serif;
      font-size: 7.5pt;
      color: #9a7040;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1.5mm;
      font-weight: 700;
      line-height: 1;
    }
    .dado-valor {
      font-family: 'Courier New', monospace;
      font-size: 9.5pt;
      font-weight: 700;
      color: #2d1a0a;
      letter-spacing: 0.5px;
      line-height: 1.3;
      word-break: break-all;
      overflow-wrap: break-word;
    }
  </style>
</head>
<body>
<div style="width:297mm;height:210mm;background:#faf7f0;display:flex;flex-direction:row;overflow:hidden;position:relative;font-family:'Lato',sans-serif;">

  <!-- FAIXA LATERAL ESQUERDA -->
  <div style="
    width:50mm;min-width:50mm;height:210mm;
    background:#6b0000;
    display:flex;flex-direction:column;align-items:center;justify-content:space-between;
    padding:10mm 5mm 9mm 5mm;position:relative;overflow:hidden;
  ">
    <!-- Borda dourada direita -->
    <div style="position:absolute;top:0;right:0;bottom:0;width:3px;background:#c9a96e;z-index:1;"></div>

    <!-- TOPO -->
    <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:4mm;width:100%;">
      <div style="width:20mm;height:20mm;border-radius:50%;
        background:#8B0000;
        border:2px solid rgba(201,169,110,0.85);
        box-shadow:0 0 16px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f0d898" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      <div style="width:70%;height:1px;background:#c9a96e;"></div>
      <div style="font-family:'Lato',sans-serif;font-size:13pt;font-weight:900;color:#fff;
        letter-spacing:3px;text-transform:uppercase;text-align:center;line-height:1;
        text-shadow:0 2px 8px rgba(0,0,0,0.4);">EXTINMAIS</div>
      <div style="font-family:'Lato',sans-serif;font-size:7.5pt;font-style:italic;
        color:rgba(240,216,152,0.75);letter-spacing:1px;text-align:center;line-height:1.7;">
        Proteção e Combate<br>a Incêndio
      </div>
    </div>

    <!-- CENTRO -->
    <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;
      gap:0;padding:7mm 2mm;
      border-top:1px solid rgba(201,169,110,0.3);
      border-bottom:1px solid rgba(201,169,110,0.3);
      width:100%;">
      <div style="font-family:'Dancing Script',cursive;font-size:14pt;font-weight:700;
        color:rgba(240,216,152,0.92);text-align:center;line-height:1.5;letter-spacing:0;
        text-shadow:0 1px 4px rgba(0,0,0,0.35);white-space:nowrap;">
        Certificado
      </div>
      <div style="width:50%;height:1px;background:rgba(201,169,110,0.3);margin:3mm 0;"></div>
      <div style="font-family:'Dancing Script',cursive;font-size:14pt;font-weight:700;
        color:rgba(240,216,152,0.92);text-align:center;line-height:1.5;letter-spacing:0;
        text-shadow:0 1px 4px rgba(0,0,0,0.35);white-space:nowrap;">
        Brigada
      </div>
    </div>

    <!-- BASE -->
    <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:2.5mm;width:100%;">
      <div style="width:70%;height:1px;background:#c9a96e;"></div>
      <div style="font-family:'Courier New',monospace;font-size:7pt;color:rgba(240,216,152,0.7);text-align:center;letter-spacing:1px;">${registro}</div>
      <div style="font-family:'Lato',sans-serif;font-size:7pt;color:rgba(240,216,152,0.4);text-align:center;">Pág. ${pageNum} de ${totalPages}</div>
    </div>
  </div>


  <!-- COLUNA DIREITA — CONTEÚDO -->
  <div style="flex:1;height:210mm;display:flex;flex-direction:column;justify-content:space-between;
    padding:8mm 11mm 7mm 10mm;position:relative;overflow:hidden;background:#faf7f0;">

    <!-- Marca d'água -->
    <div style="position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(-22deg);
      font-family:'Lato',sans-serif;font-size:48pt;font-weight:900;
      color:rgba(139,0,0,0.028);white-space:nowrap;pointer-events:none;
      z-index:0;letter-spacing:6px;text-transform:uppercase;user-select:none;">
      BRIGADA DE INCÊNDIO
    </div>

    <!-- Ornamentos de canto -->
    <div style="position:absolute;top:5mm;right:5mm;width:8mm;height:8mm;border-top:1.5px solid rgba(139,0,0,0.2);border-right:1.5px solid rgba(139,0,0,0.2);pointer-events:none;z-index:1;"></div>
    <div style="position:absolute;bottom:5mm;right:5mm;width:8mm;height:8mm;border-bottom:1.5px solid rgba(139,0,0,0.2);border-right:1.5px solid rgba(139,0,0,0.2);pointer-events:none;z-index:1;"></div>
    <div style="position:absolute;top:5mm;left:3mm;width:8mm;height:8mm;border-top:1.5px solid rgba(139,0,0,0.2);border-left:1.5px solid rgba(139,0,0,0.2);pointer-events:none;z-index:1;"></div>
    <div style="position:absolute;bottom:5mm;left:3mm;width:8mm;height:8mm;border-bottom:1.5px solid rgba(139,0,0,0.2);border-left:1.5px solid rgba(139,0,0,0.2);pointer-events:none;z-index:1;"></div>

    <!-- CONTEÚDO PRINCIPAL -->
    <div style="position:relative;z-index:2;display:flex;flex-direction:column;justify-content:space-between;height:100%;">

      <!-- TOPO -->
      <div>
        <div style="font-family:'Lato',sans-serif;font-size:9pt;font-weight:700;color:#8B0000;
          letter-spacing:4px;text-transform:uppercase;margin-bottom:3mm;">
          Brigada de Incêndio &nbsp;&nbsp;·&nbsp;&nbsp; ABNT NBR 14276
        </div>
        <div style="display:flex;align-items:center;gap:3mm;">
          <div style="flex:1;height:1.5px;background:#8B0000;"></div>
          <div style="width:14mm;height:1.5px;background:rgba(139,0,0,0.1);"></div>
        </div>
      </div>

      <!-- BLOCO CENTRAL -->
      <div style="display:flex;flex-direction:column;gap:3mm;">

        <div style="font-family:'Dancing Script',cursive;font-size:15pt;color:#6b3a1f;line-height:1.2;letter-spacing:0;white-space:nowrap;">
          Certificamos
        </div>

        <div style="font-family:'Playfair Display',serif;font-size:24pt;font-weight:900;
          color:#1a0500;line-height:1.05;padding-bottom:2.5mm;border-bottom:2px solid #c9a96e;
          letter-spacing:0.5px;">
          ${b.nome || '—'}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:2mm;">
          <div style="font-family:'Lato',sans-serif;font-size:9.5pt;font-weight:900;
            color:#8B0000;letter-spacing:3px;text-transform:uppercase;">
            ${b.funcao || 'Brigadista'}
          </div>
          <div style="background:${statusBg};color:#fff;font-family:'Lato',sans-serif;
            font-size:8pt;font-weight:800;padding:2.5mm 6mm;letter-spacing:1.5px;
            text-transform:uppercase;border-radius:2px;">
            ${statusIcon}&nbsp;&nbsp;${statusTxt}
          </div>
        </div>

        <div style="font-family:'Lato',sans-serif;font-size:9.5pt;color:#5a3a20;font-style:italic;line-height:1.65;">
          concluiu com aproveitamento o curso de
          <strong style="font-style:normal;color:#8B0000;">Brigada de Incêndio</strong>,
          conforme as normas da
          <strong style="font-style:normal;color:#4a2800;">ABNT NBR 14276</strong>,
          estando apto a atuar como membro da Brigada de Emergência do estabelecimento.
        </div>

        <!-- Dados linha 1 -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0 5mm;">
          <div class="dado-cel" style="border-bottom:1px solid #c9a96e;">
            <div class="dado-label">CPF</div>
            <div class="dado-valor">${b.cpf || '—'}</div>
          </div>
          <div class="dado-cel" style="border-bottom:1px solid #c9a96e;">
            <div class="dado-label">RG</div>
            <div class="dado-valor">${b.rg || '—'}</div>
          </div>
          <div class="dado-cel" style="border-bottom:1px solid #c9a96e;">
            <div class="dado-label">Início do Treinamento</div>
            <div class="dado-valor">${dataInicio}</div>
          </div>
          <div class="dado-cel" style="border-bottom:1px solid ${sv.vencido ? '#b91c1c' : sv.proxAVencer ? '#b45309' : '#c9a96e'};">
            <div class="dado-label">Data de Vencimento</div>
            <div class="dado-valor" style="color:${validadeColor};">${dataVencimento}</div>
          </div>
        </div>

        <!-- Dados linha 2 -->
        <div style="display:grid;grid-template-columns:1fr 1.5fr 1fr 1fr;gap:0 5mm;">
          <div class="dado-cel" style="border-bottom:1px solid rgba(201,169,110,0.5);">
            <div class="dado-label">Telefone</div>
            <div class="dado-valor">${b.telefone || '—'}</div>
          </div>
          <div class="dado-cel" style="border-bottom:1px solid rgba(201,169,110,0.5);">
            <div class="dado-label">E-mail</div>
            <div class="dado-valor" style="font-size:9pt;word-break:break-all;overflow-wrap:break-word;white-space:normal;">${b.email || '—'}</div>
          </div>
          <div class="dado-cel" style="border-bottom:1px solid rgba(201,169,110,0.5);">
            <div class="dado-label">Emissão</div>
            <div class="dado-valor">${dataEmissao}</div>
          </div>
          <div class="dado-cel" style="border-bottom:1px solid rgba(201,169,110,0.5);">
            <div class="dado-label">Brigadista Apto</div>
            <div class="dado-valor">${b.nome || '8h'}</div>
          </div>
        </div>

      </div>

      <!-- DIVISOR -->
      <div style="display:flex;align-items:center;gap:3mm;">
        <div style="width:14mm;height:1px;background:rgba(139,0,0,0.18);"></div>
        <div style="color:#8B0000;font-size:9pt;font-family:'Playfair Display',serif;line-height:1;">✦</div>
        <div style="flex:1;height:1px;background:rgba(139,0,0,0.18);"></div>
      </div>

      <!-- ASSINATURAS -->
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8mm;align-items:end;">

        <div>
          <div style="height:7mm;"></div>
          <div style="border-bottom:1.5px solid #6a4828;margin-bottom:2.5mm;"></div>
          <div style="font-family:'Playfair Display',serif;font-size:10.5pt;font-weight:700;color:#1a0a00;line-height:1.3;">${tecnico}</div>
          <div style="font-family:'Lato',sans-serif;font-size:8pt;color:#7a5030;margin-top:1.5mm;letter-spacing:0.3px;">CNPJ: ${cnpjTec}</div>
          ${telefoneTec !== '—' ? `<div style="font-family:'Lato',sans-serif;font-size:8pt;color:#7a5030;margin-top:1mm;letter-spacing:0.3px;">${telefoneTec}</div>` : ''}
          <div style="font-family:'Lato',sans-serif;font-size:7.5pt;color:#9a7050;margin-top:1.5mm;letter-spacing:0.5px;text-transform:uppercase;font-weight:700;">Técnico Responsável &nbsp;·&nbsp; EXTINMAIS</div>
        </div>

        <div style="display:flex;flex-direction:column;align-items:center;gap:2mm;padding-bottom:1mm;">
          <div style="width:22mm;height:22mm;border-radius:50%;border:2px solid #8B0000;
            background:#fff8ec;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            position:relative;box-shadow:0 3px 12px rgba(139,0,0,0.2);">
            <div style="position:absolute;inset:3px;border-radius:50%;border:1px dashed rgba(201,169,110,0.5);"></div>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B0000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:1;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            ${logoUrl
              ? `<img src="${logoUrl}" alt="Logo" style="height:22px;max-width:32px;object-fit:contain;position:relative;z-index:1;border-radius:2px;">`
              : `<div style="font-family:'Lato',sans-serif;font-size:5.5pt;font-weight:900;color:#8B0000;text-align:center;position:relative;z-index:1;line-height:1.3;margin-top:3px;letter-spacing:0.5px;">${tecnico}<br>OFICIAL</div>`}
          </div>
          <div style="font-family:'Lato',sans-serif;font-size:7pt;color:#9a7050;text-align:center;line-height:1.4;">
            Emitido em ${dataEmissao}
          </div>
        </div>

        <div>
          <div style="height:7mm;"></div>
          <div style="border-bottom:1.5px solid #6a4828;margin-bottom:2.5mm;"></div>
          <div style="font-family:'Playfair Display',serif;font-size:10.5pt;font-weight:700;color:#1a0a00;line-height:1.3;">${company.responsavel || 'Responsável'}</div>
          <div style="font-family:'Lato',sans-serif;font-size:8pt;color:#7a5030;margin-top:1.5mm;letter-spacing:0.3px;">${company.razao_social || '—'}</div>
          <div style="font-family:'Lato',sans-serif;font-size:8pt;color:#7a5030;margin-top:1mm;letter-spacing:0.3px;">CNPJ: ${company.cnpj || '—'}</div>
          <div style="font-family:'Lato',sans-serif;font-size:7.5pt;color:#9a7050;margin-top:1.5mm;letter-spacing:0.5px;text-transform:uppercase;font-weight:700;">Responsável pelo Local</div>
        </div>

      </div>

    </div>
  </div>

</div>
</body>
</html>`;
}



// ============================================
// PDF - CARREGAMENTO DE DEPENDÊNCIAS
// ============================================
function _loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function _ensurePDFLibs() {
  await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
}


// ============================================
// PDF - DOWNLOAD DIRETO: CERTIFICADOS (LANDSCAPE)
// Usa iframe oculto para garantir carregamento das Google Fonts
// ============================================
async function downloadCertificadosPDF(company, brigadistasArray, logoUrl) {
  await _ensurePDFLibs();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const W_MM = 297;
  const H_MM = 210;
  const SCALE = 2;
  const W_PX = Math.round(W_MM * (96 / 25.4));
  const H_PX = Math.round(H_MM * (96 / 25.4));

  for (let i = 0; i < brigadistasArray.length; i++) {
    const [, b] = brigadistasArray[i];

    // Renderiza o HTML completo (com <html><head> e Google Fonts) num iframe
    const html = buildCertificadoLandscapeHTML(b, company, i + 1, brigadistasArray.length, logoUrl);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${W_PX}px;
      height: ${H_PX}px;
      border: none;
      visibility: hidden;
    `;
    document.body.appendChild(iframe);

    // Escreve o HTML no iframe e aguarda as fontes carregarem
    await new Promise(resolve => {
      iframe.onload = resolve;
      iframe.srcdoc = html;
    });

    // Aguarda fontes Google renderizarem
    try {
      await iframe.contentDocument.fonts.ready;
    } catch (e) { }
    await new Promise(r => setTimeout(r, 400));

    const canvas = await html2canvas(iframe.contentDocument.body, {
      scale: SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#faf7f0',
      width: W_PX,
      height: H_PX,
      windowWidth: W_PX,
      windowHeight: H_PX,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.93);

    if (i > 0) doc.addPage('a4', 'landscape');
    doc.addImage(imgData, 'JPEG', 0, 0, W_MM, H_MM);

    document.body.removeChild(iframe);
  }

  const nomeEmpresa = (company.razao_social || 'empresa').replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim().replace(/\s+/g, '_');
  doc.save(`Certificados_Brigada_${nomeEmpresa}_${new Date().toISOString().slice(0, 10)}.pdf`);
}


// ============================================
// PDF - DOWNLOAD DIRETO: RELATÓRIO (retrato)
// ============================================
async function downloadRelatorioPDF(company, brigadistasArray) {
  await _ensurePDFLibs();

  if (typeof injectPDFStyles === 'function') injectPDFStyles();
  injectBrigadaPDFStyles();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W_MM = 210;
  const H_MM = 297;
  const SCALE = 2;
  const W_PX = Math.round(W_MM * (96 / 25.4) * SCALE);
  const H_PX = Math.round(H_MM * (96 / 25.4) * SCALE);

  const htmlRelatorio = generateBrigadaRelatorio(company, brigadistasArray);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:fixed;top:-9999px;left:-9999px;z-index:-1;background:#fff;`;
  wrapper.innerHTML = htmlRelatorio;
  document.body.appendChild(wrapper);

  const pages = wrapper.querySelectorAll('.extinpdf-page');

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i];
    pageEl.style.cssText += `
      width: ${W_PX / SCALE}px !important;
      min-height: ${H_PX / SCALE}px !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    `;

    await new Promise(r => setTimeout(r, 60));

    const canvas = await html2canvas(pageEl, {
      scale: SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: W_PX / SCALE,
      height: H_PX / SCALE,
      windowWidth: W_PX / SCALE,
      windowHeight: H_PX / SCALE,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) doc.addPage('a4', 'portrait');
    doc.addImage(imgData, 'JPEG', 0, 0, W_MM, H_MM);
  }

  document.body.removeChild(wrapper);

  const nomeEmpresa = (company.razao_social || 'empresa').replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim().replace(/\s+/g, '_');
  doc.save(`Relatorio_Brigada_${nomeEmpresa}_${new Date().toISOString().slice(0, 10)}.pdf`);
}


// ============================================
// PDF - SELETOR DE TIPO
// ============================================
async function openBrigadaPDFSelector(companyKey) {
  try {
    const companies = (await database.ref('companies').once('value')).val() || {};
    const company = companies[companyKey];
    const brigadistas = brigadaData[companyKey]?.brigadistas || {};

    if (!company) { showNotification('Empresa não encontrada', 'error'); return; }

    const brigadistasArray = Object.entries(brigadistas);

    if (brigadistasArray.length === 0) {
      showNotification('Nenhum brigadista cadastrado nesta empresa', 'warning');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'brigadaPDFSelectorModal';
    modal.style.cssText = `display:flex!important;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:9999;align-items:center;justify-content:center;padding:20px;`;

    const mc = document.createElement('div');
    mc.style.cssText = `background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);border:2px solid #D4C29A;border-radius:14px;padding:0;max-width:480px;width:100%;`;
    mc.innerHTML = `
      <div style="padding:18px 20px;border-bottom:1px solid rgba(212,194,154,0.3);">
        <h2 style="margin:0;color:#D4C29A;font-size:15px;font-weight:800;display:flex;align-items:center;gap:8px;"><i class="fas fa-file-pdf" style="color:#ef4444;"></i>Gerar PDF — Brigada</h2>
        <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.45);font-size:11px;">${company.razao_social} · ${brigadistasArray.length} brigadista(s)</p>
      </div>
      <div style="padding:16px;">
        <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 12px 0;">Selecione o tipo de documento:</p>
        <div id="brigadaPDFGrid" style="display:flex;flex-direction:column;gap:8px;"></div>
        <button onclick="this.closest('.modal').remove()" style="width:100%;margin-top:12px;padding:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#9ca3af;border-radius:8px;font-size:11px;cursor:pointer;">Cancelar</button>
      </div>
    `;
    modal.appendChild(mc);
    document.body.appendChild(modal);

    const grid = mc.querySelector('#brigadaPDFGrid');
    const options = [
      {
        id: 'relatorio',
        icon: 'fa-file-alt',
        title: 'Relatório Completo',
        desc: 'Todos os brigadistas em tabela + estatísticas · Retrato A4',
      },
      {
        id: 'certificados',
        icon: 'fa-certificate',
        title: 'Certificados Individuais',
        desc: `${brigadistasArray.length} certificado(s) — layout oficial com header lateral · 1 por página`,
      },
    ];

    options.forEach(opt => {
      const btn = document.createElement('div');
      btn.style.cssText = `display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;transition:all 0.2s;`;
      btn.onmouseover = () => { btn.style.background = 'rgba(239,68,68,0.1)'; btn.style.borderColor = 'rgba(239,68,68,0.3)'; };
      btn.onmouseout = () => { btn.style.background = 'rgba(255,255,255,0.04)'; btn.style.borderColor = 'rgba(255,255,255,0.1)'; };
      btn.innerHTML = `
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#991b1b,#dc2626);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;flex-shrink:0;">
          <i class="fas ${opt.icon}"></i>
        </div>
        <div>
          <div style="color:#fff;font-size:12px;font-weight:700;">${opt.title}</div>
          <div style="color:rgba(255,255,255,0.45);font-size:10px;margin-top:2px;">${opt.desc}</div>
        </div>
        <i class="fas fa-download" style="margin-left:auto;color:rgba(255,255,255,0.3);font-size:12px;"></i>
      `;
      btn.onclick = async () => {
        modal.remove();
        const loadingModal = _showLoadingModal(opt.id === 'certificados' ? 'Gerando certificados...' : 'Gerando relatório...');
        try {
          if (opt.id === 'certificados') {
            await downloadCertificadosPDF(company, brigadistasArray, window.currentLogoUrl || null);
          } else {
            await downloadRelatorioPDF(company, brigadistasArray);
          }
          showNotification('PDF gerado e baixado com sucesso!', 'success');
        } catch (err) {
          console.error('Erro ao gerar PDF:', err);
          showNotification('Erro ao gerar PDF. Tente novamente.', 'error');
        } finally {
          loadingModal.remove();
        }
      };
      grid.appendChild(btn);
    });

  } catch (err) {
    console.error('Erro ao abrir seletor de PDF:', err);
    showNotification('Erro ao abrir seletor de PDF', 'error');
  }
}

// ============================================
// PDF - MODAL DE LOADING
// ============================================
function _showLoadingModal(mensagem) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    display:flex!important;position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.92);z-index:99999;align-items:center;justify-content:center;
  `;
  modal.innerHTML = `
    <div style="text-align:center;color:#fff;">
      <div style="
        width:64px;height:64px;
        border:4px solid rgba(212,194,154,0.2);
        border-top:4px solid #D4C29A;
        border-radius:50%;
        animation:brigadaSpin 0.9s linear infinite;
        margin:0 auto 16px;
      "></div>
      <div style="font-size:14px;font-weight:600;color:#D4C29A;">${mensagem}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:6px;">Isso pode levar alguns segundos...</div>
    </div>
    <style>
      @keyframes brigadaSpin { to { transform: rotate(360deg); } }
    </style>
  `;
  document.body.appendChild(modal);
  return modal;
}


// ============================================
