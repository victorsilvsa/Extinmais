async function loadDashboard() {
  const companiesSnapshot = await database.ref('companies').once('value');
  const buildingsSnapshot = await database.ref('buildings').once('value');
  const inspectionsSnapshot = await database.ref('inspections').once('value');

  const companies = companiesSnapshot.val() || {};
  const buildings = buildingsSnapshot.val() || {};
  const inspections = inspectionsSnapshot.val() || {};

  const totalCompanies = Object.keys(companies).length;
  const totalBuildings = Object.keys(buildings).length;
  const totalInspections = Object.keys(inspections).length;
  const pendingInspections = Object.values(inspections).filter(i => !i.completed).length;

  document.getElementById('totalCompanies').textContent = totalCompanies + totalBuildings;
  document.getElementById('totalInspections').textContent = totalInspections;
  document.getElementById('pendingInspections').textContent = pendingInspections;
}


/* ==========================================================
   FUNÇÃO PRINCIPAL PARA CARREGAR EMPRESAS E PRÉDIOS
========================================================== */
// Variáveis de paginação
let currentCompanyPage = 1;
let currentBuildingPage = 1;
const itemsPerPage = 10;

// Variáveis de controle de expansão
let companiesExpanded = true;
let buildingsExpanded = true;




// Funções de mudança de página
function changeCompanyPage(page) {
  const companiesSnapshot = database.ref('companies').once('value');
  companiesSnapshot.then(snapshot => {
    const companies = snapshot.val() || {};
    const totalPages = Math.ceil(Object.keys(companies).length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      currentCompanyPage = page;
      loadCompanies();
    }
  });
}



// Função para criar e mostrar modal de edição de empresa
function editCompany(key) {
  database.ref('companies/' + key).once('value').then(snapshot => {
    const company = snapshot.val();
    if (!company) return;

    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
      overflow-y: auto;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        border-radius: 16px;
        padding: 30px;
        max-width: 600px;
        width: 100%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        border: 1px solid #D4C29A;
        max-height: 90vh;
        overflow-y: auto;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <h2 style="color: #D4C29A; margin: 0; font-size: 24px; font-weight: bold;">
            <i class="fas fa-edit"></i> Editar Empresa
          </h2>
          <button onclick="closeEditModal()" style="
            background: none;
            border: none;
            color: #D4C29A;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
          ">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form id="editCompanyForm" style="display: flex; flex-direction: column; gap: 20px;">
          <div>
            <label style="color: #D4C29A; display: block; margin-bottom: 8px; font-weight: bold;">
              Razão Social *
            </label>
            <input 
              type="text" 
              id="edit_razao_social" 
              value="${company.razao_social || ''}"
              required
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #D4C29A;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #D4C29A; display: block; margin-bottom: 8px; font-weight: bold;">
              CNPJ *
            </label>
            <input 
              type="text" 
              id="edit_cnpj" 
              value="${company.cnpj || ''}"
              required
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #D4C29A;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #D4C29A; display: block; margin-bottom: 8px; font-weight: bold;">
              Telefone
            </label>
            <input 
              type="text" 
              id="edit_telefone" 
              value="${company.telefone || ''}"
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #D4C29A;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #D4C29A; display: block; margin-bottom: 8px; font-weight: bold;">
              Número da Empresa
            </label>
            <input 
              type="text" 
              id="edit_numero_empresa" 
              value="${company.numero_empresa || ''}"
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #D4C29A;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #D4C29A; display: block; margin-bottom: 8px; font-weight: bold;">
              Responsável
            </label>
            <input 
              type="text" 
              id="edit_responsavel" 
              value="${company.responsavel || ''}"
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #D4C29A;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #D4C29A; display: block; margin-bottom: 8px; font-weight: bold;">
              Endereço
            </label>
            <textarea 
              id="edit_endereco" 
              rows="3"
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #D4C29A;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
                resize: vertical;
              "
            >${company.endereco || ''}</textarea>
          </div>

          <div style="display: flex; gap: 15px; margin-top: 10px;">
            <button 
              type="submit"
              style="
                flex: 1;
                padding: 14px;
                background: linear-gradient(135deg, #D4C29A 0%, #B8A47E 100%);
                color: #0d0d0d;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(212, 194, 154, 0.35);
              "
            >
              <i class="fas fa-save"></i> Salvar Alterações
            </button>
            <button 
              type="button"
              onclick="closeEditModal()"
              style="
                flex: 1;
                padding: 14px;
                background: #444;
                color: #fff;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
              "
            >
              <i class="fas fa-times"></i> Cancelar
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handler do formulário
    document.getElementById('editCompanyForm').onsubmit = (e) => {
      e.preventDefault();

      const updatedData = {
        razao_social: document.getElementById('edit_razao_social').value.trim(),
        cnpj: document.getElementById('edit_cnpj').value.trim(),
        telefone: document.getElementById('edit_telefone').value.trim(),
        numero_empresa: document.getElementById('edit_numero_empresa').value.trim(),
        responsavel: document.getElementById('edit_responsavel').value.trim(),
        endereco: document.getElementById('edit_endereco').value.trim()
      };

      // Atualizar no Firebase
      database.ref('companies/' + key).update(updatedData)
        .then(() => {
          closeEditModal();
          loadCompanies();
          showNotification('Empresa atualizada com sucesso!', 'success');
        })
        .catch((error) => {
          console.error('Erro ao atualizar empresa:', error);
          showNotification('Erro ao atualizar empresa. Tente novamente.', 'error');
        });
    };
  });
}

// Função para criar e mostrar modal de edição de prédio
function editBuilding(key) {
  database.ref('buildings/' + key).once('value').then(snapshot => {
    const building = snapshot.val();
    if (!building) return;

    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
      overflow-y: auto;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        border-radius: 16px;
        padding: 30px;
        max-width: 600px;
        width: 100%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        border: 1px solid #2ecc71;
        max-height: 90vh;
        overflow-y: auto;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <h2 style="color: #2ecc71; margin: 0; font-size: 24px; font-weight: bold;">
            <i class="fas fa-edit"></i> Editar Prédio
          </h2>
          <button onclick="closeEditModal()" style="
            background: none;
            border: none;
            color: #2ecc71;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
          ">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form id="editBuildingForm" style="display: flex; flex-direction: column; gap: 20px;">
          <div>
            <label style="color: #2ecc71; display: block; margin-bottom: 8px; font-weight: bold;">
              Razão Social *
            </label>
            <input 
              type="text" 
              id="edit_razao_social_predio" 
              value="${building.razao_social_predio || ''}"
              required
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #2ecc71;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #2ecc71; display: block; margin-bottom: 8px; font-weight: bold;">
              CNPJ *
            </label>
            <input 
              type="text" 
              id="edit_cnpj_predio" 
              value="${building.cnpj_predio || ''}"
              required
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #2ecc71;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #2ecc71; display: block; margin-bottom: 8px; font-weight: bold;">
              Telefone
            </label>
            <input 
              type="text" 
              id="edit_telefone_predio" 
              value="${building.telefone_predio || ''}"
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #2ecc71;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #2ecc71; display: block; margin-bottom: 8px; font-weight: bold;">
              Número do Prédio
            </label>
            <input 
              type="text" 
              id="edit_numero_predio" 
              value="${building.numero_predio || ''}"
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #2ecc71;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div>
            <label style="color: #2ecc71; display: block; margin-bottom: 8px; font-weight: bold;">
              Endereço
            </label>
            <textarea 
              id="edit_endereco_predio" 
              rows="3"
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #2ecc71;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
                resize: vertical;
              "
            >${building.endereco_predio || ''}</textarea>
          </div>

          <div>
            <label style="color: #2ecc71; display: block; margin-bottom: 8px; font-weight: bold;">
              Responsável
            </label>
            <input 
              type="text" 
              id="edit_responsavel_predio" 
              value="${building.responsavel_predio || ''}"
              style="
                width: 100%;
                padding: 12px;
                background: #1a1a1a;
                border: 2px solid #2ecc71;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: all 0.3s;
              "
            >
          </div>

          <div style="display: flex; gap: 15px; margin-top: 10px;">
            <button 
              type="submit"
              style="
                flex: 1;
                padding: 14px;
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                color: #0d0d0d;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(46, 204, 113, 0.35);
              "
            >
              <i class="fas fa-save"></i> Salvar Alterações
            </button>
            <button 
              type="button"
              onclick="closeEditModal()"
              style="
                flex: 1;
                padding: 14px;
                background: #444;
                color: #fff;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
              "
            >
              <i class="fas fa-times"></i> Cancelar
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handler do formulário
    document.getElementById('editBuildingForm').onsubmit = (e) => {
      e.preventDefault();

      const updatedData = {
        razao_social_predio: document.getElementById('edit_razao_social_predio').value.trim(),
        cnpj_predio: document.getElementById('edit_cnpj_predio').value.trim(),
        telefone_predio: document.getElementById('edit_telefone_predio').value.trim(),
        numero_predio: document.getElementById('edit_numero_predio').value.trim(),
        endereco_predio: document.getElementById('edit_endereco_predio').value.trim(),
        responsavel_predio: document.getElementById('edit_responsavel_predio').value.trim()
      };

      // Atualizar no Firebase
      database.ref('buildings/' + key).update(updatedData)
        .then(() => {
          closeEditModal();
          loadCompanies();
          showNotification('Prédio atualizado com sucesso!', 'success');
        })
        .catch((error) => {
          console.error('Erro ao atualizar prédio:', error);
          showNotification('Erro ao atualizar prédio. Tente novamente.', 'error');
        });
    };
  });
}

// Função para fechar o modal
function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.remove();
  }
}

// Função para mostrar notificações
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'};
    color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-weight: bold;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    ${message}
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Função principal de carregamento
