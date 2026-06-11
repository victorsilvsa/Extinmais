async function loadCompanies() {
  const list = document.getElementById('companiesList');

  const [companiesSnapshot, buildingsSnapshot] = await Promise.all([
    database.ref('companies').once('value'),
    database.ref('buildings').once('value')
  ]);

  const companies = companiesSnapshot.val() || {};
  const buildings = buildingsSnapshot.val() || {};

  // Limpa a lista para reconstruir toda vez
  list.innerHTML = '';

  const totalItems =
    Object.keys(companies).length + Object.keys(buildings).length;

  if (totalItems === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-building"></i>
        <p>Nenhuma empresa ou prédio cadastrado</p>
      </div>
    `;
    return;
  }

  // ================= EMPRESAS =================
  if (Object.keys(companies).length > 0) {
    const totalCompanies = Object.keys(companies).length;

    const empresasSeparator = document.createElement('div');
    empresasSeparator.style.cssText = `
      display: flex;
      align-items: center;
      margin: 30px 0;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    empresasSeparator.onclick = () => toggleCompanies();

    empresasSeparator.innerHTML = `
      <div style="flex: 1; height: 2px; background: linear-gradient(to right, transparent, #D4C29A); box-shadow: 0 0 6px rgba(212, 194, 154, 0.35);"></div>
      <div style="position: relative; background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%); border-radius: 40px; padding: 14px 36px; margin: 0 20px; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.55), inset 0 2px 4px rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(212, 194, 154, 0.25); display: flex; align-items: center; gap: 12px; overflow: hidden;">
        <div style="position: relative; z-index: 2; background: linear-gradient(135deg, #D4C29A 0%, #B8A47E 100%); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(212, 194, 154, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.25);">
          <i class="fas fa-briefcase" style="color: #0d0d0d; font-size: 18px;"></i>
        </div>
        <div style="position: relative; z-index: 2; display: flex; align-items: center; gap: 12px;">
          <div style="color: #D4C29A; font-size: 18px; font-weight: 900; letter-spacing: 1.2px; text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);">EMPRESAS</div>
          <div style="background: rgba(212, 194, 154, 0.2); padding: 4px 12px; border-radius: 20px; color: #D4C29A; font-size: 14px; font-weight: bold;">${totalCompanies}</div>
        </div>
        <div style="position: relative; z-index: 2; margin-left: 8px;">
          <i class="fas fa-chevron-${companiesExpanded ? 'up' : 'down'}" style="color: #D4C29A; font-size: 16px;"></i>
        </div>
      </div>
      <div style="flex: 1; height: 2px; background: linear-gradient(to left, transparent, #D4C29A); box-shadow: 0 0 6px rgba(212, 194, 154, 0.35);"></div>
    `;
    list.appendChild(empresasSeparator);

    // Container para as empresas
    const companiesContainer = document.createElement('div');
    companiesContainer.id = 'companiesContainer';
    companiesContainer.style.display = companiesExpanded ? 'block' : 'none';
    companiesContainer.style.transition = 'all 0.3s ease';

    if (companiesExpanded) {
      // Paginação de empresas
      const companiesArray = Object.entries(companies);
      const totalCompanyPages = Math.ceil(companiesArray.length / itemsPerPage);
      const startIndex = (currentCompanyPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedCompanies = companiesArray.slice(startIndex, endIndex);

      for (let [key, company] of paginatedCompanies) {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div class="list-item-header">
            <div style="flex: 1; min-width: 0; overflow: hidden;">
              <div class="list-item-title" style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; hyphens: auto; line-height: 1.3;">${company.razao_social}</div>
              <div class="list-item-subtitle">${company.cnpj}</div>
            </div>
          </div>
          <div class="list-item-info">
            <div class="list-item-info-row">
              <span class="list-item-info-label">Telefone:</span>
              <span class="list-item-info-value">${company.telefone || '-'}</span>
            </div>
            <div class="list-item-info-row">
              <span class="list-item-info-label">Número da Empresa:</span>
              <span class="list-item-info-value">${company.numero_empresa || '-'}</span>
            </div>
            <div class="list-item-info-row">
              <span class="list-item-info-label">Responsável:</span>
              <span class="list-item-info-value" style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; hyphens: auto;">${company.responsavel || '-'}</span>
            </div>
            <div class="list-item-info-row">
              <span class="list-item-info-label">Endereço:</span>
              <span class="list-item-info-value" style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; hyphens: auto; line-height: 1.4;">${company.endereco || '-'}</span>
            </div>
          </div>
          <div class="list-item-actions">
            <button class="btn-small btn-primary" onclick="startInspection('${key}')">
              <i class="fas fa-clipboard-check"></i> Nova Inspeção
            </button>
        <button class="btn-small btn-secondary" onclick="editCompany('${key}')" style="background-color:#2c3e50; border-color:#2c3e50;">
  <i class="fas fa-edit"></i> Editar
</button>
            <button
              class="btn-small btn-danger"
              style="background-color:#D4C29A; border-color:#D4C29A; color:#000;"
              onclick="deleteCompany('${key}')">
              <i class="fas fa-trash"></i> Excluir
            </button>
          </div>
        `;
        companiesContainer.appendChild(item);
      }

      // Controles de paginação de empresas
      if (totalCompanyPages > 1) {
        const paginationControls = document.createElement('div');
        paginationControls.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: 25px 0;
          padding: 20px;
          background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          flex-wrap: wrap;
        `;

        paginationControls.innerHTML = `
          <button 
            onclick="changeCompanyPage(${currentCompanyPage - 1})"
            ${currentCompanyPage === 1 ? 'disabled' : ''}
            style="
              padding: 10px 20px;
              background: ${currentCompanyPage === 1 ? '#444' : 'linear-gradient(135deg, #D4C29A 0%, #B8A47E 100%)'};
              color: ${currentCompanyPage === 1 ? '#888' : '#0d0d0d'};
              border: none;
              border-radius: 8px;
              cursor: ${currentCompanyPage === 1 ? 'not-allowed' : 'pointer'};
              font-weight: bold;
              box-shadow: ${currentCompanyPage === 1 ? 'none' : '0 3px 10px rgba(212, 194, 154, 0.35)'};
              transition: all 0.3s;
            ">
            <i class="fas fa-chevron-left"></i> Anterior
          </button>
          
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #D4C29A; font-weight: bold; font-size: 14px;">Página</span>
            <input 
              type="number"
              id="companyPageInput"
              min="1"
              max="${totalCompanyPages}"
              value="${currentCompanyPage}"
              onkeypress="if(event.key === 'Enter') { const val = parseInt(this.value); if(val >= 1 && val <= ${totalCompanyPages}) changeCompanyPage(val); }"
              style="
                width: 70px;
                padding: 8px 12px;
                background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
                color: #D4C29A;
                border: 2px solid #D4C29A;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                outline: none;
                box-shadow: 0 3px 10px rgba(212, 194, 154, 0.2);
              ">
            <span style="color: #D4C29A; font-weight: bold; font-size: 14px;">de ${totalCompanyPages}</span>
            <button 
              onclick="const val = parseInt(document.getElementById('companyPageInput').value); if(val >= 1 && val <= ${totalCompanyPages}) changeCompanyPage(val);"
              style="
                padding: 8px 16px;
                background: linear-gradient(135deg, #D4C29A 0%, #B8A47E 100%);
                color: #0d0d0d;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 3px 10px rgba(212, 194, 154, 0.35);
                transition: all 0.3s;
              ">
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
          
          <button 
            onclick="changeCompanyPage(${currentCompanyPage + 1})"
            ${currentCompanyPage === totalCompanyPages ? 'disabled' : ''}
            style="
              padding: 10px 20px;
              background: ${currentCompanyPage === totalCompanyPages ? '#444' : 'linear-gradient(135deg, #D4C29A 0%, #B8A47E 100%)'};
              color: ${currentCompanyPage === totalCompanyPages ? '#888' : '#0d0d0d'};
              border: none;
              border-radius: 8px;
              cursor: ${currentCompanyPage === totalCompanyPages ? 'not-allowed' : 'pointer'};
              font-weight: bold;
              box-shadow: ${currentCompanyPage === totalCompanyPages ? 'none' : '0 3px 10px rgba(212, 194, 154, 0.35)'};
              transition: all 0.3s;
            ">
            Próxima <i class="fas fa-chevron-right"></i>
          </button>
        `;
        companiesContainer.appendChild(paginationControls);
      }
    }

    list.appendChild(companiesContainer);
  }

  // ================= PRÉDIOS =================
  if (Object.keys(buildings).length > 0) {
    const totalBuildings = Object.keys(buildings).length;

    const prediosSeparator = document.createElement('div');
    prediosSeparator.style.cssText = `
      display: flex;
      align-items: center;
      margin: 50px 0 30px 0;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    prediosSeparator.onclick = () => toggleBuildings();

    prediosSeparator.innerHTML = `
      <div style="flex: 1; height: 2px; background: linear-gradient(to right, transparent, #2ecc71); box-shadow: 0 0 6px rgba(46, 204, 113, 0.35);"></div>
      <div style="position: relative; background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%); border-radius: 40px; padding: 14px 36px; margin: 0 20px; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.55), inset 0 2px 4px rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(46, 204, 113, 0.25); display: flex; align-items: center; gap: 12px; overflow: hidden;">
        <div style="position: relative; z-index: 2; background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(46, 204, 113, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.25);">
          <i class="fas fa-building" style="color: #0d0d0d; font-size: 18px;"></i>
        </div>
        <div style="position: relative; z-index: 2; display: flex; align-items: center; gap: 12px;">
          <div style="color: #2ecc71; font-size: 18px; font-weight: 900; letter-spacing: 1.2px; text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);">PRÉDIOS</div>
          <div style="background: rgba(46, 204, 113, 0.2); padding: 4px 12px; border-radius: 20px; color: #2ecc71; font-size: 14px; font-weight: bold;">${totalBuildings}</div>
        </div>
        <div style="position: relative; z-index: 2; margin-left: 8px;">
          <i class="fas fa-chevron-${buildingsExpanded ? 'up' : 'down'}" style="color: #2ecc71; font-size: 16px;"></i>
        </div>
      </div>
      <div style="flex: 1; height: 2px; background: linear-gradient(to left, transparent, #2ecc71); box-shadow: 0 0 6px rgba(46, 204, 113, 0.35);"></div>
    `;
    list.appendChild(prediosSeparator);

    // Container para os prédios
    const buildingsContainer = document.createElement('div');
    buildingsContainer.id = 'buildingsContainer';
    buildingsContainer.style.display = buildingsExpanded ? 'block' : 'none';
    buildingsContainer.style.transition = 'all 0.3s ease';

    if (buildingsExpanded) {
      // Paginação de prédios
      const buildingsArray = Object.entries(buildings);
      const totalBuildingPages = Math.ceil(buildingsArray.length / itemsPerPage);
      const startIndex = (currentBuildingPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedBuildings = buildingsArray.slice(startIndex, endIndex);

      for (let [key, building] of paginatedBuildings) {
        const item = document.createElement('div');
        item.className = 'list-item list-item-building';
        item.innerHTML = `
          <div class="list-item-header">
            <div style="flex: 1; min-width: 0; overflow: hidden;">
              <div class="list-item-title" style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; hyphens: auto; line-height: 1.3;">${building.razao_social_predio}</div>
              <div class="list-item-subtitle">${building.cnpj_predio}</div>
            </div>
          </div>
          <div class="list-item-info">
            <div class="list-item-info-row">
              <span class="list-item-info-label">Telefone:</span>
              <span class="list-item-info-value">${building.telefone_predio || '-'}</span>
            </div>
            <div class="list-item-info-row">
              <span class="list-item-info-label">Número do Prédio:</span>
              <span class="list-item-info-value">${building.numero_predio || '-'}</span>
            </div>
            <div class="list-item-info-row">
              <span class="list-item-info-label">Endereço:</span>
              <span class="list-item-info-value" style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; hyphens: auto; line-height: 1.4;">${building.endereco_predio || '-'}</span>
            </div>
            <div class="list-item-info-row">
              <span class="list-item-info-label">Responsável:</span>
              <span class="list-item-info-value" style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; hyphens: auto;">${building.responsavel_predio || '-'}</span>
            </div>
          </div>
          <div class="list-item-actions">
            <button class="btn-small btn-primary" onclick="startInspectionBuilding('${key}')">
              <i class="fas fa-clipboard-check"></i> Nova Inspeção
            </button>
     <button class="btn-small btn-secondary" onclick="editBuilding('${key}')" style="background-color:#2c3e50; border-color:#2c3e50;">
  <i class="fas fa-edit"></i> Editar
</button>
            <button
              class="btn-small btn-danger"
              style="background-color:#D4C29A; border-color:#D4C29A; color:#000;"
              onclick="deleteBuilding('${key}')">
              <i class="fas fa-trash"></i> Excluir
            </button>
          </div>
        `;
        buildingsContainer.appendChild(item);
      }

      // Controles de paginação de prédios
      if (totalBuildingPages > 1) {
        const paginationControls = document.createElement('div');
        paginationControls.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: 25px 0;
          padding: 20px;
          background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          flex-wrap: wrap;
        `;

        paginationControls.innerHTML = `
          <button 
            onclick="changeBuildingPage(${currentBuildingPage - 1})"
            ${currentBuildingPage === 1 ? 'disabled' : ''}
            style="
              padding: 10px 20px;
              background: ${currentBuildingPage === 1 ? '#444' : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'};
              color: ${currentBuildingPage === 1 ? '#888' : '#0d0d0d'};
              border: none;
              border-radius: 8px;
              cursor: ${currentBuildingPage === 1 ? 'not-allowed' : 'pointer'};
              font-weight: bold;
              box-shadow: ${currentBuildingPage === 1 ? 'none' : '0 3px 10px rgba(46, 204, 113, 0.35)'};
              transition: all 0.3s;
            ">
            <i class="fas fa-chevron-left"></i> Anterior
          </button>
          
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #2ecc71; font-weight: bold; font-size: 14px;">Página</span>
            <input 
              type="number"
              id="buildingPageInput"
              min="1"
              max="${totalBuildingPages}"
              value="${currentBuildingPage}"
              onkeypress="if(event.key === 'Enter') { const val = parseInt(this.value); if(val >= 1 && val <= ${totalBuildingPages}) changeBuildingPage(val); }"
              style="
                width: 70px;
                padding: 8px 12px;
                background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
                color: #2ecc71;
                border: 2px solid #2ecc71;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                outline: none;
                box-shadow: 0 3px 10px rgba(46, 204, 113, 0.2);
              ">
            <span style="color: #2ecc71; font-weight: bold; font-size: 14px;">de ${totalBuildingPages}</span>
            <button 
              onclick="const val = parseInt(document.getElementById('buildingPageInput').value); if(val >= 1 && val <= ${totalBuildingPages}) changeBuildingPage(val);"
              style="
                padding: 8px 16px;
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                color: #0d0d0d;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 3px 10px rgba(46, 204, 113, 0.35);
                transition: all 0.3s;
              ">
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
          
          <button 
            onclick="changeBuildingPage(${currentBuildingPage + 1})"
            ${currentBuildingPage === totalBuildingPages ? 'disabled' : ''}
            style="
              padding: 10px 20px;
              background: ${currentBuildingPage === totalBuildingPages ? '#444' : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'};
              color: ${currentBuildingPage === totalBuildingPages ? '#888' : '#0d0d0d'};
              border: none;
              border-radius: 8px;
              cursor: ${currentBuildingPage === totalBuildingPages ? 'not-allowed' : 'pointer'};
              font-weight: bold;
              box-shadow: ${currentBuildingPage === totalBuildingPages ? 'none' : '0 3px 10px rgba(46, 204, 113, 0.35)'};
              transition: all 0.3s;
            ">
            Próxima <i class="fas fa-chevron-right"></i>
          </button>
        `;
        buildingsContainer.appendChild(paginationControls);
      }
    }

    list.appendChild(buildingsContainer);
  }
}

// Adicionar estilos de animação para notificações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', loadCompanies);


// Funções de toggle (colapsar/expandir)
function toggleCompanies() {
  companiesExpanded = !companiesExpanded;
  loadCompanies();
}

function toggleBuildings() {
  buildingsExpanded = !buildingsExpanded;
  loadCompanies();
}




function changeBuildingPage(newPage) {
  currentBuildingPage = newPage;
  loadCompanies();
  // Scroll suave para o topo da seção de prédios
  const container = document.getElementById('buildingsContainer');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Função auxiliar para criar e mostrar o modal de confirmação personalizado
function confirmModal(titulo, mensagem, callback) {
  // Remove modal anterior se existir
  const existingModal = document.getElementById('customConfirmModal');
  if (existingModal) existingModal.remove();

  const modalHtml = `
        <div id="customConfirmModal" style="display: flex; align-items: center; justify-content: center; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);">
            <div style="background: #1a1a1a; border: 1px solid #D4C29A; padding: 30px; border-radius: 12px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <div style="color: #D4C29A; font-size: 40px; margin-bottom: 15px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="color: #D4C29A; margin-bottom: 15px; font-family: 'Playfair Display', serif;">${titulo}</h3>
                <p style="color: #ccc; margin-bottom: 25px; line-height: 1.5;">${mensagem}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="btnCancel" style="padding: 12px 20px; background: #333; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; flex: 1;">Cancelar</button>
                    <button id="btnConfirm" style="padding: 12px 20px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; flex: 1;">Excluir</button>
                </div>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('customConfirmModal');

  document.getElementById('btnCancel').onclick = () => {
    modal.remove();
  };

  document.getElementById('btnConfirm').onclick = async () => {
    const btn = document.getElementById('btnConfirm');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
    btn.style.pointerEvents = 'none';

    await callback();
    modal.remove();
  };
}

// Função para deletar Empresa (deleta a empresa e seus prédios)
async function deleteCompany(id) {
  confirmModal(
    'Excluir Empresa',
    'Isso excluirá permanentemente a empresa e TODOS os prédios vinculados a ela. Deseja continuar?',
    async () => {
      try {
        // 1. Remove a empresa
        await database.ref('companies/' + id).remove();

        // 2. Busca e remove prédios vinculados
        const buildingsSnapshot = await database.ref('buildings').once('value');
        const buildings = buildingsSnapshot.val();

        if (buildings) {
          const updates = {};
          Object.entries(buildings).forEach(([bid, bData]) => {
            // Verifica se o prédio pertence a esta empresa (ajuste o nome do campo se necessário)
            if (bData.companyId === id || bData.empresaId === id) {
              updates[`/buildings/${bid}`] = null;
            }
          });
          await database.ref().update(updates);
        }

        showToast('Empresa e dependências excluídas!');

        // Se não estiver usando .on('value'), recarregue a lista:
        if (typeof loadCompanies === 'function') loadCompanies();
        if (typeof loadDashboard === 'function') loadDashboard();

      } catch (error) {
        showToast('Erro técnico ao excluir empresa');
      }
    }
  );
}

// Função para deletar apenas o Prédio
async function deleteBuilding(id) {
  confirmModal(
    'Excluir Prédio',
    'Deseja realmente remover este prédio do sistema?',
    async () => {
      try {
        await database.ref('buildings/' + id).remove();
        showToast('Prédio excluído com sucesso!');

        if (typeof loadCompanies === 'function') loadCompanies();
        if (typeof loadDashboard === 'function') loadDashboard();
      } catch (error) {
        showToast('Erro ao excluir prédio');
      }
    }
  );
}






// Add Company
document.getElementById('addCompanyBtn').addEventListener('click', () => {
  openModal('addCompanyModal');
});

// Manual Inspection
// Cria o modal de seleção dinamicamente
function criarModalSelecao() {
  const modalHTML = `
      <div id="selectionModal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h2><i class="fas fa-search"></i> Selecionar Cliente</h2>
            <span class="close" onclick="closeModal('selectionModal')" style="cursor: pointer;">×</span>
          </div>
          <div class="modal-body">
            <!-- Abas de Empresas e Prédios -->
            <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #D4C29A;">
              <button id="tabEmpresas" class="tab-button active" onclick="switchTab('empresas')" style="flex: 1; padding: 12px 24px; background: transparent; border: none; color: #D4C29A; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s; border-bottom: 3px solid #D4C29A;">
                <i class="fas fa-briefcase"></i> Empresas
              </button>
              <button id="tabPredios" class="tab-button" onclick="switchTab('predios')" style="flex: 1; padding: 12px 24px; background: transparent; border: none; color: #888; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s; border-bottom: 3px solid transparent;">
                <i class="fas fa-building"></i> Prédios
              </button>
            </div>

            <!-- Campo de Busca -->
            <div style="margin-bottom: 20px;">
              <input 
                type="text" 
                id="searchSelection" 
                placeholder="Buscar por nome, CNPJ ou responsável..."
                style="width: 100%; padding: 12px; border: 2px solid #D4C29A; border-radius: 8px; background: #2a2a2a; color: #fff; font-size: 14px;"
                onkeyup="filtrarSelecao()"
              >
            </div>

            <!-- Lista de Empresas -->
            <div id="listaEmpresas" style="max-height: 400px; overflow-y: auto; padding: 10px;">
              <div style="text-align: center; color: #D4C29A; padding: 40px; font-size: 18px;">
                <i class="fas fa-spinner fa-spin"></i> Carregando empresas...
              </div>
            </div>

            <!-- Lista de Prédios -->
            <div id="listaPredios" style="max-height: 400px; overflow-y: auto; padding: 10px; display: none;">
              <div style="text-align: center; color: #D4C29A; padding: 40px; font-size: 18px;">
                <i class="fas fa-spinner fa-spin"></i> Carregando prédios...
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

  // Adiciona o modal ao body se ainda não existir
  if (!document.getElementById('selectionModal')) {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
}


// Variável para controlar qual aba está ativa
let todasEmpresas = [];
let todosPredios = [];
let abaAtiva = 'empresas';



// Abre o modal de seleção
async function abrirModalSelecao() {
  criarModalSelecao();
  openModal('selectionModal');
  await carregarDadosSelecao();
}

// Carrega empresas e prédios do Firebase
async function carregarDadosSelecao() {
  try {
    const [companiesSnapshot, buildingsSnapshot] = await Promise.all([
      database.ref('companies').once('value'),
      database.ref('buildings').once('value')
    ]);

    const companies = companiesSnapshot.val() || {};
    const buildings = buildingsSnapshot.val() || {};

    todasEmpresas = Object.entries(companies).map(([id, data]) => ({ id, ...data, tipo: 'empresa' }));
    todosPredios = Object.entries(buildings).map(([id, data]) => ({ id, ...data, tipo: 'predio' }));

    renderizarLista();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showToast('Erro ao carregar dados', 'error');
  }
}

// Alterna entre abas
function switchTab(aba) {
  abaAtiva = aba;

  const tabEmpresas = document.getElementById('tabEmpresas');
  const tabPredios = document.getElementById('tabPredios');

  if (aba === 'empresas') {
    tabEmpresas.style.background = 'linear-gradient(135deg, #D4C29A 0%, #b8a676 100%)';
    tabEmpresas.style.color = '#1a1a1a';
    tabEmpresas.style.border = 'none';
    tabEmpresas.style.boxShadow = '0 4px 15px rgba(212, 194, 154, 0.3)';

    tabPredios.style.background = 'transparent';
    tabPredios.style.color = '#888';
    tabPredios.style.border = '2px solid #444';
    tabPredios.style.boxShadow = 'none';
  } else {
    tabPredios.style.background = 'linear-gradient(135deg, #D4C29A 0%, #b8a676 100%)';
    tabPredios.style.color = '#1a1a1a';
    tabPredios.style.border = 'none';
    tabPredios.style.boxShadow = '0 4px 15px rgba(212, 194, 154, 0.3)';

    tabEmpresas.style.background = 'transparent';
    tabEmpresas.style.color = '#888';
    tabEmpresas.style.border = '2px solid #444';
    tabEmpresas.style.boxShadow = 'none';
  }

  document.getElementById('listaEmpresas').style.display = aba === 'empresas' ? 'block' : 'none';
  document.getElementById('listaPredios').style.display = aba === 'predios' ? 'block' : 'none';

  document.getElementById('searchSelection').value = '';
  renderizarLista();
}

// Renderiza a lista baseada na aba ativa
function renderizarLista(filtro = '') {
  const listaEmpresas = document.getElementById('listaEmpresas');
  const listaPredios = document.getElementById('listaPredios');

  const empresasFiltradas = todasEmpresas.filter(emp => {
    if (!filtro) return true;
    const searchTerm = filtro.toLowerCase();
    return (
      (emp.razao_social || '').toLowerCase().includes(searchTerm) ||
      (emp.cnpj || '').toLowerCase().includes(searchTerm) ||
      (emp.responsavel || '').toLowerCase().includes(searchTerm)
    );
  });

  const prediosFiltrados = todosPredios.filter(pred => {
    if (!filtro) return true;
    const searchTerm = filtro.toLowerCase();
    return (
      (pred.razao_social_predio || '').toLowerCase().includes(searchTerm) ||
      (pred.cnpj_predio || '').toLowerCase().includes(searchTerm) ||
      (pred.responsavel_predio || '').toLowerCase().includes(searchTerm)
    );
  });

  if (empresasFiltradas.length === 0) {
    listaEmpresas.innerHTML = '<div style="text-align: center; color: #888; padding: 40px 20px; font-size: 15px; background: #2a2a2a; border-radius: 8px; border: 2px dashed #444;"><i class="fas fa-inbox" style="font-size: 36px; margin-bottom: 10px; color: #D4C29A; display: block;"></i>Nenhuma empresa encontrada</div>';
  } else {
    listaEmpresas.innerHTML = empresasFiltradas.map(emp => `
      <div onclick="selecionarCliente('${emp.id}', 'empresa')" style="background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%); border: 2px solid #D4C29A; border-radius: 10px; padding: 15px; margin-bottom: 12px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 6px 20px rgba(212, 194, 154, 0.4)'; this.style.borderColor='#D4C29A';" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'; this.style.borderColor='#D4C29A';">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #D4C29A 0%, #b8a676 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #1a1a1a; flex-shrink: 0;">
            <i class="fas fa-briefcase"></i>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="color: #D4C29A; font-size: 16px; font-weight: bold; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${emp.razao_social}</div>
            <div style="color: #888; font-size: 13px;"><i class="fas fa-id-card"></i> ${emp.cnpj}</div>
          </div>
        </div>
        <div style="color: #ccc; font-size: 12px; display: flex; gap: 15px; flex-wrap: wrap; padding-top: 10px; border-top: 1px solid #444;">
          <span><i class="fas fa-user" style="color: #D4C29A;"></i> ${emp.responsavel || 'Não informado'}</span>
          <span><i class="fas fa-building" style="color: #D4C29A;"></i> Nº ${emp.numero_empresa || '-'}</span>
        </div>
      </div>
    `).join('');
  }

  if (prediosFiltrados.length === 0) {
    listaPredios.innerHTML = '<div style="text-align: center; color: #888; padding: 40px 20px; font-size: 15px; background: #2a2a2a; border-radius: 8px; border: 2px dashed #444;"><i class="fas fa-inbox" style="font-size: 36px; margin-bottom: 10px; color: #D4C29A; display: block;"></i>Nenhum prédio encontrado</div>';
  } else {
    listaPredios.innerHTML = prediosFiltrados.map(pred => `
      <div onclick="selecionarCliente('${pred.id}', 'predio')" style="background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%); border: 2px solid #D4C29A; border-radius: 10px; padding: 15px; margin-bottom: 12px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 6px 20px rgba(212, 194, 154, 0.4)'; this.style.borderColor='#D4C29A';" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'; this.style.borderColor='#D4C29A';">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #D4C29A 0%, #b8a676 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #1a1a1a; flex-shrink: 0;">
            <i class="fas fa-building"></i>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="color: #D4C29A; font-size: 16px; font-weight: bold; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pred.razao_social_predio}</div>
            <div style="color: #888; font-size: 13px;"><i class="fas fa-id-card"></i> ${pred.cnpj_predio}</div>
          </div>
        </div>
        <div style="color: #ccc; font-size: 12px; display: flex; gap: 15px; flex-wrap: wrap; padding-top: 10px; border-top: 1px solid #444;">
          <span><i class="fas fa-user" style="color: #D4C29A;"></i> ${pred.responsavel_predio || 'Não informado'}</span>
          <span><i class="fas fa-building" style="color: #D4C29A;"></i> Nº ${pred.numero_predio || '-'}</span>
        </div>
      </div>
    `).join('');
  }
}

// Filtrar ao digitar
function filtrarSelecao() {
  const filtro = document.getElementById('searchSelection').value;
  renderizarLista(filtro);
}

// Seleciona cliente e abre inspeção
async function selecionarCliente(id, tipo) {
  closeModal('selectionModal');

  if (tipo === 'empresa') {
    await startInspection(id);
  } else {
    await startInspectionBuilding(id);
  }
}

// Atualiza o botão de inspeção manual
document.getElementById('manualInspectionBtn').addEventListener('click', () => {
  abrirModalSelecao();
});





document.getElementById('addCompanyForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const companyData = Object.fromEntries(formData);

  await database.ref('companies').push(companyData);

  showToast('Empresa cadastrada com sucesso!');
  closeModal('addCompanyModal');
  e.target.reset();
  loadCompanies();
  loadDashboard();
});


// Add Building Form Submit
document.getElementById('addBuildingForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const buildingData = Object.fromEntries(formData);

  // Salva no Firebase
  await database.ref('buildings').push(buildingData);

  showToast('Prédio cadastrado com sucesso!');
  closeModal('addCompanyModal');
  e.target.reset();

  // ALTERAÇÃO AQUI:
  // Use loadCompanies() pois ela é a responsável por renderizar a lista no DOM
  loadCompanies();
  loadDashboard();
});

// Inspection Tabs
