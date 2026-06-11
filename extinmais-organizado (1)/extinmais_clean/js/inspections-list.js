// FINISH INSPECTION - COM OPÇÃO DE REVISITORIA
// ============================================
if (document.getElementById('finishInspectionBtn')) {
  document.getElementById('finishInspectionBtn').addEventListener('click', async () => {
    showFinishOrRevisitModal();
  });
}

// ============================================
// MODAL: FINALIZAR OU FAZER REVISITORIA
// ============================================
function showFinishOrRevisitModal() {
  const overlay = document.createElement('div');
  overlay.id = 'finishOrRevisitOverlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85); display: flex; justify-content: center;
    align-items: center; z-index: 99999; padding: 20px; box-sizing: border-box;
    animation: fadeIn 0.3s ease-out;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 2px solid #D4C29A; border-radius: 16px; padding: 30px;
    width: 100%; max-width: 480px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8); animation: slideUp 0.3s ease-out; box-sizing: border-box;
  `;

  modal.innerHTML = `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="width: 70px; height: 70px; background: rgba(212,194,154,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <i class="fas fa-clipboard-check" style="font-size: 32px; color: #D4C29A;"></i>
      </div>
      <h2 style="color: #D4C29A; font-size: 20px; margin: 0 0 8px; font-weight: 700;">Concluir Vistoria</h2>
      <p style="color: #9ca3af; font-size: 14px; margin: 0;">O que deseja fazer com esta inspeção?</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px;">
      <button id="btnFinalizar" style="
        background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none;
        border-radius: 10px; padding: 16px 20px; cursor: pointer; font-size: 15px; font-weight: 700;
        display: flex; align-items: center; gap: 12px; transition: all 0.3s; text-align: left;
      ">
        <i class="fas fa-check-circle" style="font-size: 22px;"></i>
        <div>
          <div>Finalizar Inspeção</div>
          <div style="font-size: 12px; font-weight: 400; opacity: 0.85;">Salvar como concluída</div>
        </div>
      </button>

      <button id="btnRevisitoria" style="
        background: linear-gradient(135deg, #b45309, #92400e); color: white; border: none;
        border-radius: 10px; padding: 16px 20px; cursor: pointer; font-size: 15px; font-weight: 700;
        display: flex; align-items: center; gap: 12px; transition: all 0.3s; text-align: left;
      ">
        <i class="fas fa-redo-alt" style="font-size: 22px;"></i>
        <div>
          <div>Fazer Revisitoria</div>
          <div style="font-size: 12px; font-weight: 400; opacity: 0.85;">Registrar correções realizadas</div>
        </div>
      </button>

      <button id="btnCancelarFinish" style="
        background: #374151; color: #9ca3af; border: 1px solid #4b5563;
        border-radius: 10px; padding: 12px 20px; cursor: pointer; font-size: 14px; font-weight: 600;
        transition: all 0.3s;
      ">
        <i class="fas fa-times"></i> Cancelar
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('btnFinalizar').onclick = () => {
    overlay.remove();
    executeFinishInspection(false, null);
  };

  document.getElementById('btnRevisitoria').onclick = () => {
    overlay.remove();
    showRevisitoriaModal();
  };

  document.getElementById('btnCancelarFinish').onclick = () => {
    overlay.remove();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  injectAnimations();
}

// ============================================
// MODAL DE REVISITORIA (NOVA INSPEÇÃO EM ABERTO)
// ============================================
function showRevisitoriaModal(inspData) {
  const overlay = document.createElement('div');
  overlay.id = 'revisitoriaModalOverlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.9); display: flex; justify-content: center;
    align-items: flex-start; z-index: 99999; padding: 20px; box-sizing: border-box;
    animation: fadeIn 0.3s ease-out; overflow-y: auto;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 2px solid #b45309; border-radius: 16px; padding: 28px;
    width: 100%; max-width: 600px; margin: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8); animation: slideUp 0.3s ease-out; box-sizing: border-box;
  `;

  // Se passou inspData (revisitoria de inspeção já salva), usa esses dados
  // Se não passou, usa o formulário aberto
  let data = {};
  if (inspData) {
    data = inspData;
  } else {
    const form = document.getElementById('inspectionForm');
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
      if (form.elements[key]?.type === 'checkbox') {
        data[key] = form.elements[key].checked;
      } else {
        data[key] = value;
      }
    }
  }

  let sistemasHtml = '';

  if (data.has_bombas) {
    sistemasHtml += buildRevisitoriaSection('bombas', 'fa-water', 'Sistema de Bombas', [
      { id: 'rev_bombas_reservatorio', label: 'Reservatório' },
      { id: 'rev_bombas_principal', label: 'Bomba Principal' },
      { id: 'rev_bombas_partida', label: 'Teste de Partida' },
      { id: 'rev_bombas_estado', label: 'Estado Geral' },
      { id: 'rev_bombas_jockey', label: 'Bomba Jockey' },
    ]);
  }

  if (data.has_hidrantes) {
    sistemasHtml += buildRevisitoriaSection('hidrantes', 'fa-truck-droplet', 'Rede de Hidrantes', [
      { id: 'rev_hidrantes_suportes', label: 'Suportes' },
      { id: 'rev_hidrantes_vazamentos', label: 'Vazamentos' },
      { id: 'rev_hidrantes_mangueira', label: 'Mangueira' },
      { id: 'rev_hidrantes_esguicho', label: 'Esguicho' },
      { id: 'rev_hidrantes_adaptador', label: 'Adaptador Storz' },
    ]);
  }

  if (data.has_alarme) {
    sistemasHtml += buildRevisitoriaSection('alarme', 'fa-bell', 'Sistema de Alarme', [
      { id: 'rev_alarme_central', label: 'Central de Alarme' },
      { id: 'rev_alarme_baterias', label: 'Baterias' },
      { id: 'rev_alarme_detectores', label: 'Detectores' },
      { id: 'rev_alarme_falhas', label: 'Falhas no sistema' },
    ]);
  }

  if (data.has_extintores) {
    sistemasHtml += buildRevisitoriaSection('extintores', 'fa-fire-extinguisher', 'Extintores', [
      { id: 'rev_ext_validade', label: 'Validade' },
      { id: 'rev_ext_lacres', label: 'Lacres' },
      { id: 'rev_ext_manometro', label: 'Manômetro' },
      { id: 'rev_ext_fixacao', label: 'Fixação' },
    ]);
  }

  if (data.has_sinalizacao) {
    sistemasHtml += buildRevisitoriaSection('sinalizacao', 'fa-sign', 'Sinalização', [
      { id: 'rev_sinal_placas', label: 'Placas Fotoluminescentes' },
      { id: 'rev_sinal_posicionamento', label: 'Posicionamento' },
      { id: 'rev_sinal_quantidade', label: 'Quantidade' },
    ]);
  }

  // Conformidade sempre presente
  sistemasHtml += buildRevisitoriaSection('conformidade', 'fa-check-circle', 'Conformidade Geral', [
    { id: 'rev_conf_rotas', label: 'Rotas de Fuga' },
    { id: 'rev_conf_equipamentos', label: 'Acesso aos Equipamentos' },
    { id: 'rev_conf_limpeza', label: 'Limpeza e Organização' },
  ]);

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h2 style="color: #f59e0b; font-size: 20px; margin: 0 0 4px; font-weight: 700;">
          <i class="fas fa-redo-alt"></i> Registro de Revisitoria
        </h2>
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">Informe as não conformidades e as correções realizadas</p>
      </div>
    </div>

    <div id="revisitoriaForm" style="max-height: 60vh; overflow-y: auto; padding-right: 6px;">

      <div style="background: rgba(245,158,11,0.08); border: 1px solid #b45309; border-radius: 10px; padding: 14px; margin-bottom: 18px;">
        <label style="color: #f59e0b; font-weight: 700; font-size: 13px; display: block; margin-bottom: 8px;">
          <i class="fas fa-exclamation-triangle"></i> Não Conformidades Identificadas na Vistoria Original
        </label>
        <textarea id="rev_nao_conformidades" placeholder="Descreva todos os itens em não conformidade encontrados na vistoria original..." style="
          width: 100%; min-height: 90px; background: #1a1a1a; color: #e5e7eb;
          border: 1px solid #b45309; border-radius: 8px; padding: 10px; font-size: 13px;
          resize: vertical; box-sizing: border-box; font-family: inherit;
        "></textarea>
      </div>

      <div style="background: rgba(34,197,94,0.08); border: 1px solid #16a34a; border-radius: 10px; padding: 14px; margin-bottom: 18px;">
        <label style="color: #4ade80; font-weight: 700; font-size: 13px; display: block; margin-bottom: 8px;">
          <i class="fas fa-tools"></i> Correções Realizadas
        </label>
        <textarea id="rev_correcoes_realizadas" placeholder="Descreva todas as correções realizadas antes desta revisitoria..." style="
          width: 100%; min-height: 90px; background: #1a1a1a; color: #e5e7eb;
          border: 1px solid #16a34a; border-radius: 8px; padding: 10px; font-size: 13px;
          resize: vertical; box-sizing: border-box; font-family: inherit;
        "></textarea>
      </div>

      <div style="margin-bottom: 18px;">
        <label style="color: #D4C29A; font-weight: 700; font-size: 13px; display: block; margin-bottom: 12px;">
          <i class="fas fa-tasks"></i> Itens Verificados na Revisitoria
        </label>
        ${sistemasHtml}
      </div>

      <div style="background: rgba(99,102,241,0.08); border: 1px solid #4f46e5; border-radius: 10px; padding: 14px; margin-bottom: 18px;">
        <label style="color: #818cf8; font-weight: 700; font-size: 13px; display: block; margin-bottom: 8px;">
          <i class="fas fa-sticky-note"></i> Observações Gerais da Revisitoria
        </label>
        <textarea id="rev_obs_geral" placeholder="Observações adicionais sobre a revisitoria..." style="
          width: 100%; min-height: 80px; background: #1a1a1a; color: #e5e7eb;
          border: 1px solid #4f46e5; border-radius: 8px; padding: 10px; font-size: 13px;
          resize: vertical; box-sizing: border-box; font-family: inherit;
        "></textarea>
      </div>

      <div style="background: rgba(212,194,154,0.08); border: 1px solid #6b5e3a; border-radius: 10px; padding: 14px; margin-bottom: 6px;">
        <label style="color: #D4C29A; font-weight: 700; font-size: 13px; display: block; margin-bottom: 10px;">
          <i class="fas fa-check-double"></i> Resultado da Revisitoria
        </label>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #e5e7eb; font-size: 14px;">
            <input type="radio" name="rev_resultado" value="conforme" style="accent-color: #16a34a; width: 16px; height: 16px;">
            <span style="color: #4ade80; font-weight: 600;">✓ Em Conformidade</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #e5e7eb; font-size: 14px;">
            <input type="radio" name="rev_resultado" value="parcial" style="accent-color: #f59e0b; width: 16px; height: 16px;">
            <span style="color: #fbbf24; font-weight: 600;">⚠ Parcialmente Conforme</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #e5e7eb; font-size: 14px;">
            <input type="radio" name="rev_resultado" value="nao_conforme" style="accent-color: #ef4444; width: 16px; height: 16px;">
            <span style="color: #f87171; font-weight: 600;">✗ Ainda Não Conforme</span>
          </label>
        </div>
      </div>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap;">
      <button id="btnSalvarRevisitoria" style="
        flex: 1; background: linear-gradient(135deg, #b45309, #92400e); color: white;
        border: none; border-radius: 10px; padding: 14px 20px; cursor: pointer;
        font-size: 15px; font-weight: 700; display: flex; align-items: center;
        justify-content: center; gap: 10px; transition: all 0.3s; min-width: 160px;
      ">
        <i class="fas fa-save"></i> Salvar Revisitoria
      </button>
      <button id="btnCancelarRevisitoria" style="
        background: #374151; color: #9ca3af; border: 1px solid #4b5563;
        border-radius: 10px; padding: 14px 20px; cursor: pointer; font-size: 14px;
        font-weight: 600; transition: all 0.3s;
      ">
        <i class="fas fa-arrow-left"></i> Voltar
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('btnSalvarRevisitoria').onclick = async () => {
    const revisitoriaData = coletarDadosRevisitoria();
    if (inspData) {
      // Salvar revisitoria em inspeção já existente no banco
      await salvarRevisitoriaEmInspecaoExistente(inspData._id, revisitoriaData);
    } else {
      await executeFinishInspection(true, revisitoriaData);
    }
    overlay.remove();
  };

  document.getElementById('btnCancelarRevisitoria').onclick = () => {
    overlay.remove();
    if (!inspData) {
      showFinishOrRevisitModal();
    }
  };

  injectAnimations();
}

// ============================================
// SALVAR REVISITORIA EM INSPEÇÃO JÁ FINALIZADA
// ============================================
async function salvarRevisitoriaEmInspecaoExistente(inspectionId, revisitoriaData) {
  try {
    // Adiciona a revisitoria ao array de revisitorias da inspeção
    const snapshot = await database.ref('inspections/' + inspectionId).once('value');
    const insp = snapshot.val();

    if (!insp) {
      showToast('Inspeção não encontrada!', 'error');
      return;
    }

    const revisitorias = insp.revisitorias || [];
    revisitorias.push(revisitoriaData);

    await database.ref('inspections/' + inspectionId).update({
      is_revisitoria: true,
      revisitoria: revisitoriaData,        // compatibilidade: última revisitoria
      revisitorias: revisitorias,           // histórico completo
      ultima_revisitoria: revisitoriaData.data
    });

    showToast('Revisitoria adicionada com sucesso!', 'success');
    loadInspections();
  } catch (error) {
    console.error('Erro ao salvar revisitoria:', error);
    showToast('Erro ao salvar revisitoria: ' + error.message, 'error');
  }
}

// ============================================
// HELPER: CONSTRÓI SEÇÃO DE REVISITORIA
// ============================================
function buildRevisitoriaSection(id, icon, titulo, itens) {
  const itemsHtml = itens.map(item => `
    <div style="display: flex; flex-direction: column; gap: 6px; background: #1f1f1f; border-radius: 8px; padding: 10px; border: 1px solid #333;">
      <div style="color: #d1d5db; font-size: 12px; font-weight: 600;">${item.label}</div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px;">
          <input type="radio" name="${item.id}" value="ok" style="accent-color: #16a34a;">
          <span style="color: #4ade80;">✓ OK</span>
        </label>
        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px;">
          <input type="radio" name="${item.id}" value="corrigido" style="accent-color: #f59e0b;">
          <span style="color: #fbbf24;">⚙ Corrigido</span>
        </label>
        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px;">
          <input type="radio" name="${item.id}" value="pendente" style="accent-color: #ef4444;">
          <span style="color: #f87171;">✗ Pendente</span>
        </label>
        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px;">
          <input type="radio" name="${item.id}" value="na" checked style="accent-color: #6b7280;">
          <span style="color: #9ca3af;">— N/A</span>
        </label>
      </div>
      <input type="text" id="${item.id}_obs" placeholder="Observação (opcional)" style="
        background: #111; color: #d1d5db; border: 1px solid #333; border-radius: 6px;
        padding: 6px 8px; font-size: 11px; width: 100%; box-sizing: border-box;
      ">
    </div>
  `).join('');

  return `
    <div style="margin-bottom: 12px; border: 1px solid #374151; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #374151, #1f2937); padding: 10px 14px; display: flex; align-items: center; gap: 8px;">
        <i class="fas ${icon}" style="color: #D4C29A; font-size: 14px;"></i>
        <span style="color: #D4C29A; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${titulo}</span>
      </div>
      <div style="padding: 12px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; background: #1a1a1a;">
        ${itemsHtml}
      </div>
    </div>
  `;
}

// ============================================
// COLETA OS DADOS DA REVISITORIA DO FORMULÁRIO
// ============================================
function coletarDadosRevisitoria() {
  const revisitoria = {
    nao_conformidades: document.getElementById('rev_nao_conformidades')?.value || '',
    correcoes_realizadas: document.getElementById('rev_correcoes_realizadas')?.value || '',
    obs_geral: document.getElementById('rev_obs_geral')?.value || '',
    resultado: document.querySelector('input[name="rev_resultado"]:checked')?.value || 'nao_definido',
    data: new Date().toISOString(),
    itens: {}
  };

  const radios = document.querySelectorAll('#revisitoriaForm input[type="radio"]:checked');
  radios.forEach(radio => {
    if (radio.name !== 'rev_resultado') {
      revisitoria.itens[radio.name] = {
        status: radio.value,
        obs: document.getElementById(`${radio.name}_obs`)?.value || ''
      };
    }
  });

  return revisitoria;
}

// ============================================
// EXECUTA O SALVAMENTO DA INSPEÇÃO
// ============================================
async function executeFinishInspection(isRevisitoria, revisitoriaData) {
  const button = document.getElementById('finishInspectionBtn');
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span> Finalizando...';
  }

  try {
    const form = document.getElementById('inspectionForm');
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      if (form.elements[key]?.type === 'checkbox') {
        data[key] = form.elements[key].checked;
      } else {
        data[key] = value;
      }
    }

    const todasAsFotos = PhotosManager.getAllPhotos();
    const inspectionData = {
      ...data,
      tecnico_id: currentUser?.id,
      tecnico_nome: currentUser?.nome,
      data: new Date().toISOString(),
      completed: true,
      tipo: window.ultimaEmpresaCadastrada?.tipo || 'empresa',
      observacoes: document.getElementById('inspecaoObservacoes')?.value || '',
      fotos: todasAsFotos,
      total_fotos: todasAsFotos.length,
      section_photos: PhotosManager.sectionStorage,
      is_revisitoria: isRevisitoria,
      revisitoria: isRevisitoria ? revisitoriaData : null,
      revisitorias: isRevisitoria ? [revisitoriaData] : []
    };

    if (window.ultimaEmpresaCadastrada?.tipo === 'predio') {
      inspectionData.razao_social_predio = data.razao_social || window.ultimaEmpresaCadastrada.razao_social_predio;
      inspectionData.cnpj_predio = data.cnpj || window.ultimaEmpresaCadastrada.cnpj_predio;
      inspectionData.telefone_predio = data.telefone || window.ultimaEmpresaCadastrada.telefone_predio;
      inspectionData.responsavel_predio = data.responsavel || window.ultimaEmpresaCadastrada.responsavel_predio;
      inspectionData.cep_predio = data.cep || window.ultimaEmpresaCadastrada.cep_predio;
      inspectionData.endereco_predio = data.endereco || window.ultimaEmpresaCadastrada.endereco_predio;
      inspectionData.numero_predio = data.numero_predio || window.ultimaEmpresaCadastrada.numero_predio;
    }

    await database.ref('inspections').push(inspectionData);

    showToast(isRevisitoria ? 'Revisitoria salva com sucesso!' : 'Inspeção finalizada com sucesso!');

    closeModal('inspectionFormModal');
    form.reset();
    PhotosManager.clearAll();
    document.querySelectorAll('.conditional-section').forEach(sec => sec.classList.remove('visible'));
    window.ultimaEmpresaCadastrada = null;

    setTimeout(() => {
      navigateToSection('inspections');
      document.querySelectorAll('.nav-item-mobile').forEach(nav => {
        if (nav.dataset.section === 'inspections') nav.classList.add('active');
        else nav.classList.remove('active');
      });
      document.querySelectorAll('.nav-item-desktop').forEach(nav => {
        if (nav.dataset.section === 'inspections') nav.classList.add('active');
        else nav.classList.remove('active');
      });
    }, 1000);
  } catch (error) {
    console.error('Error finishing inspection:', error);
    showToast('Erro ao finalizar inspeção', 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar Inspeção';
    }
  }
}

// ===== PAGINAÇÃO INSPEÇÕES =====
let currentInspectionPage = 1;
const inspectionsPerPage = 7;

function changeInspectionPage(page) {
  currentInspectionPage = page;
  loadInspections();
  window.scrollTo(0, 0);
}

// ============================================
// EXCLUIR INSPEÇÃO
// ============================================
function deleteInspection(inspectionId) {
  database.ref('inspections/' + inspectionId).once('value').then(snapshot => {
    const insp = snapshot.val();

    if (!insp) {
      showToast('Inspeção não encontrada!', 'error');
      return;
    }

    const isPredio = insp.tipo === 'predio';
    const nomeCliente = isPredio
      ? (insp.razao_social_predio || insp.razao_social || 'Esta inspeção')
      : (insp.razao_social || 'Esta inspeção');

    const overlay = document.createElement('div');
    overlay.id = 'deleteConfirmOverlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; justify-content: center;
      align-items: center; z-index: 99999; padding: 20px; box-sizing: border-box;
      animation: fadeIn 0.3s ease-out;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
      border: 2px solid #ef4444; border-radius: 16px; padding: 30px;
      width: 100%; max-width: 500px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8); animation: slideUp 0.3s ease-out; box-sizing: border-box;
    `;

    modal.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 80px; height: 80px; background: rgba(239,68,68,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: #ef4444;"></i>
        </div>
        <h2 style="color: #fff; font-size: 24px; margin: 0 0 15px; font-weight: 700;">Confirmar Exclusão</h2>
        <p style="color: #bbb; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Tem certeza que deseja excluir a inspeção de:</p>
        <p style="color: #D4C29A; font-size: 18px; font-weight: 600; margin: 0 0 25px; word-wrap: break-word;">${escapeHtml(nomeCliente)}</p>
        <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin: 0 0 30px;">Esta ação não pode ser desfeita!</p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button id="cancelDeleteBtn" type="button" style="background: #444; border: 1px solid #666; color: #fff; border-radius: 8px; padding: 12px 24px; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-times"></i> Cancelar
          </button>
          <button id="confirmDeleteBtn" type="button" style="background: #ef4444; border: none; color: #fff; border-radius: 8px; padding: 12px 24px; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-trash"></i> Sim, Excluir
          </button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    cancelBtn.onmouseover = () => { cancelBtn.style.background = '#555'; };
    cancelBtn.onmouseout = () => { cancelBtn.style.background = '#444'; };
    confirmBtn.onmouseover = () => { confirmBtn.style.background = '#dc2626'; };
    confirmBtn.onmouseout = () => { confirmBtn.style.background = '#ef4444'; };

    cancelBtn.onclick = () => {
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    };

    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.6';
      confirmBtn.style.cursor = 'not-allowed';
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

      try {
        await database.ref('inspections/' + inspectionId).remove();
        overlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => overlay.remove(), 300);
        showToast('Inspeção excluída com sucesso!', 'success');
        loadInspections();
      } catch (error) {
        console.error('Erro ao excluir inspeção:', error);
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Sim, Excluir';
        showToast('Erro ao excluir inspeção: ' + error.message, 'error');
      }
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => overlay.remove(), 300);
      }
    };

    injectAnimations();
  });
}

// ============================================
// BACK TO FORM
// ============================================
document.getElementById('backToFormBtn').addEventListener('click', () => {
  openModal('inspectionFormModal');
  navigateToSection('inspections');
});

// ============================================
// DOWNLOAD PDF
// ============================================
document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
  const button = document.getElementById('downloadPdfBtn');

  button.disabled = true;
  button.innerHTML = '<span class="loading"></span> Gerando...';

  try {
    const { jsPDF } = window.jspdf;

    // CLASSE CORRETA DAS PÁGINAS
    const pages = document.querySelectorAll('#pdfPreview .extinpdf-page');

    console.log('Páginas encontradas:', pages.length);

    if (!pages.length) {
      throw new Error('Nenhuma página encontrada para exportação.');
    }

    // Aguarda renderização completa
    await new Promise(resolve => setTimeout(resolve, 300));

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      });

      console.log(
        `Página ${i + 1}:`,
        canvas.width,
        canvas.height
      );

      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      if (i > 0) {
        pdf.addPage();
      }

      const pdfWidth = 210;
      const pdfHeight = 297;

      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pdfWidth,
        pdfHeight
      );
    }

    const nomeCliente =
      currentInspectionData.tipo === 'predio'
        ? (
          currentInspectionData.razao_social_predio ||
          currentInspectionData.razao_social ||
          'Cliente'
        )
        : (
          currentInspectionData.razao_social ||
          'Cliente'
        );

    const fileName =
      `Inspecao_${nomeCliente.replace(/[^a-zA-Z0-9]/g, '_')
      }_${new Date().toISOString().split('T')[0]
      }.pdf`;

    pdf.save(fileName);

    showToast('PDF baixado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    showToast('Erro ao gerar PDF', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML =
      '<i class="fas fa-download"></i> Baixar PDF';
  }
});

// ============================================
// SAVE INSPECTION
// ============================================
document.getElementById('saveInspectionBtn').addEventListener('click', async () => {
  const button = document.getElementById('saveInspectionBtn');
  button.disabled = true;
  button.innerHTML = '<span class="loading"></span> Salvando...';

  try {
    const inspectionData = {
      ...currentInspectionData,
      tecnico_id: currentUser.id,
      tecnico_nome: currentUser.nome,
      data: new Date().toISOString(),
      completed: false,
      tipo: window.ultimaEmpresaCadastrada?.tipo || currentInspectionData.tipo || 'empresa',
      observacoes: document.getElementById('inspecaoObservacoes')?.value || '',
      fotos: PhotosManager.getAllPhotos().map(p => ({
        data: p.data,
        section: p.section,
        timestamp: p.timestamp
      })),
      total_fotos: PhotosManager.getAllPhotos().length
    };

    if (inspectionData.tipo === 'predio' && window.ultimaEmpresaCadastrada) {
      inspectionData.razao_social_predio = currentInspectionData.razao_social || window.ultimaEmpresaCadastrada.razao_social_predio;
      inspectionData.cnpj_predio = currentInspectionData.cnpj || window.ultimaEmpresaCadastrada.cnpj_predio;
      inspectionData.telefone_predio = currentInspectionData.telefone || window.ultimaEmpresaCadastrada.telefone_predio;
      inspectionData.responsavel_predio = currentInspectionData.responsavel || window.ultimaEmpresaCadastrada.responsavel_predio;
      inspectionData.cep_predio = currentInspectionData.cep || window.ultimaEmpresaCadastrada.cep_predio;
      inspectionData.endereco_predio = currentInspectionData.endereco || window.ultimaEmpresaCadastrada.endereco_predio;
      inspectionData.numero_predio = currentInspectionData.numero_predio || window.ultimaEmpresaCadastrada.numero_predio;
    }

    await database.ref('inspections').push(inspectionData);

    showToast('Inspeção salva com sucesso!');

    setTimeout(() => {
      navigateToSection('inspections');
      document.querySelectorAll('.nav-item-mobile').forEach(nav => {
        if (nav.dataset.section === 'inspections') nav.classList.add('active');
        else nav.classList.remove('active');
      });
      document.querySelectorAll('.nav-item-desktop').forEach(nav => {
        if (nav.dataset.section === 'inspections') nav.classList.add('active');
        else nav.classList.remove('active');
      });
    }, 1000);
  } catch (error) {
    console.error('Error saving inspection:', error);
    showToast('Erro ao salvar inspeção', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-save"></i> Salvar';
  }
});

// ============================================
// CARREGAR INSPEÇÕES COM EXCLUIR, BADGE REVISITORIA E BOTÃO ADICIONAR REVISITORIA
// ============================================
async function loadInspections() {
  const snapshot = await database.ref('inspections').once('value');
  const inspections = snapshot.val() || {};
  const list = document.getElementById('inspectionsList');
  list.innerHTML = '';

  const inspectionsArray = Object.entries(inspections).map(([key, value]) => ({
    id: key,
    ...value
  }));

  const filtered = inspectionsArray.filter(insp => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'completed') return insp.completed;
    if (currentFilter === 'pending') return !insp.completed;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-check"></i>
        <p>Nenhuma inspeção encontrada</p>
      </div>
    `;
    return;
  }

  const totalInspectionPages = Math.ceil(filtered.length / inspectionsPerPage);
  const startIndex = (currentInspectionPage - 1) * inspectionsPerPage;
  const endIndex = startIndex + inspectionsPerPage;
  const paginatedInspections = filtered.slice(startIndex, endIndex);

  paginatedInspections.forEach(insp => {
    const statusBadge = insp.completed
      ? '<span class="badge badge-completed">Concluída</span>'
      : '<span class="badge badge-pending">Pendente</span>';

    // Badge revisitoria
    const revisitoriaBadge = insp.is_revisitoria
      ? `<span style="background: linear-gradient(135deg, #b45309, #92400e); color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
           <i class="fas fa-redo-alt"></i> Revisitoria
         </span>`
      : '';

    // Badge quantidade de revisitorias
    const qtdRevisitorias = insp.revisitorias ? insp.revisitorias.length : (insp.is_revisitoria ? 1 : 0);
    const qtdRevisitoriasBadge = qtdRevisitorias > 0
      ? `<span style="background: rgba(180,83,9,0.18); color: #fbbf24; border: 1px solid #b45309; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
           <i class="fas fa-history"></i> ${qtdRevisitorias} revisitoria${qtdRevisitorias > 1 ? 's' : ''}
         </span>`
      : '';

    // Badge resultado revisitoria
    let resultadoBadge = '';
    if (insp.is_revisitoria && insp.revisitoria?.resultado) {
      const resultadoMap = {
        conforme: { color: '#16a34a', bg: 'rgba(22,163,74,0.15)', label: '✓ Conforme' },
        parcial: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: '⚠ Parcial' },
        nao_conforme: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: '✗ Não Conforme' }
      };
      const r = resultadoMap[insp.revisitoria.resultado];
      if (r) {
        resultadoBadge = `<span style="background: ${r.bg}; color: ${r.color}; border: 1px solid ${r.color}; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">${r.label}</span>`;
      }
    }

    const sistemas = [];
    if (insp.has_bombas) sistemas.push('Bombas');
    if (insp.has_hidrantes) sistemas.push('Hidrantes');
    if (insp.has_alarme) sistemas.push('Alarme');
    if (insp.has_extintores) sistemas.push('Extintores');
    if (insp.has_sinalizacao) sistemas.push('Sinalização');

    const isPredio = insp.tipo === 'predio';
    const nomeCliente = isPredio
      ? (insp.razao_social_predio || insp.razao_social || 'N/A')
      : (insp.razao_social || 'N/A');
    const cnpjCliente = isPredio
      ? (insp.cnpj_predio || insp.cnpj || '-')
      : (insp.cnpj || '-');
    const enderecoCliente = isPredio
      ? (insp.endereco_predio || insp.endereco || '-')
      : (insp.endereco || '-');
    const numeroCliente = isPredio
      ? (insp.numero_predio || '-')
      : (insp.numero_empresa || '-');
    const telefoneCliente = isPredio
      ? (insp.telefone_predio || insp.telefone || '-')
      : (insp.telefone || '-');

    const item = document.createElement('div');
    item.className = 'list-item';

    item.innerHTML = `
      <div class="list-item-header">
        <div>
          <div class="list-item-title">
            ${isPredio ? '<i class="fas fa-building"></i>' : '<i class="fas fa-briefcase"></i>'}
            ${nomeCliente}
          </div>
          <div class="list-item-subtitle">${new Date(insp.data).toLocaleDateString('pt-BR')}</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;">
            ${revisitoriaBadge}
            ${qtdRevisitoriasBadge}
            ${resultadoBadge}
          </div>
        </div>
        ${statusBadge}
      </div>

      <div class="list-item-info">
        <div class="list-item-info-row">
          <span class="list-item-info-label">CNPJ:</span>
          <span class="list-item-info-value">${cnpjCliente}</span>
        </div>
        <div class="list-item-info-row">
          <span class="list-item-info-label">Telefone:</span>
          <span class="list-item-info-value">${telefoneCliente}</span>
        </div>
        <div class="list-item-info-row">
          <span class="list-item-info-label">${isPredio ? 'Número do Prédio:' : 'Número da Empresa:'}</span>
          <span class="list-item-info-value">${numeroCliente}</span>
        </div>
        <div class="list-item-info-row">
          <span class="list-item-info-label">Endereço:</span>
          <span class="list-item-info-value">${enderecoCliente}</span>
        </div>
        <div class="list-item-info-row">
          <span class="list-item-info-label">Técnico:</span>
          <span class="list-item-info-value">${insp.tecnico_nome || '-'}</span>
        </div>
        <div class="list-item-info-row">
          <span class="list-item-info-label">Sistemas:</span>
          <span class="list-item-info-value">${sistemas.join(', ') || '-'}</span>
        </div>
        <div class="list-item-info-row">
          <span class="list-item-info-label">Fotos:</span>
          <span class="list-item-info-value">${insp.total_fotos || 0} foto(s)</span>
        </div>
      </div>

      <div class="list-item-actions">
        ${!insp.completed ? `<button class="btn-small btn-success" onclick="markAsCompleted('${insp.id}')">
          <i class="fas fa-check-circle"></i> Finalizar
        </button>` : ''}
        <button class="btn-small btn-info" onclick="viewInspection('${insp.id}')">
          <i class="fas fa-eye"></i> Ver
        </button>
        <button class="btn-small btn-warning" onclick="viewPhotosInspection('${insp.id}')">
          <i class="fas fa-images"></i> Fotos
        </button>
        <button class="btn-small" style="background: linear-gradient(135deg, #b45309, #78350f); color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" onclick="adicionarRevisitoriaEmInspecaoExistente('${insp.id}')">
          <i class="fas fa-redo-alt"></i> Revisitoria
        </button>
        ${insp.is_revisitoria ? `<button class="btn-small" style="background: linear-gradient(135deg, #4f46e5, #3730a3); color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" onclick="viewRevisitoriaReport('${insp.id}')">
          <i class="fas fa-file-invoice"></i> Ver Revisitoria
        </button>` : ''}
        ${qtdRevisitorias > 1 ? `<button class="btn-small" style="background: linear-gradient(135deg, #374151, #1f2937); color: #D4C29A; border: 1px solid #b45309; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;" onclick="viewHistoricoRevisitorias('${insp.id}')">
          <i class="fas fa-history"></i> Histórico
        </button>` : ''}
        <button class="btn-small btn-danger" onclick="deleteInspection('${insp.id}')">
          <i class="fas fa-trash"></i> Excluir
        </button>
        <button class="btn-small btn-primary" onclick="showPDFOptionsForInspection('${insp.id}')">
          <i class="fas fa-download"></i> PDF
        </button>
      </div>
    `;

    list.appendChild(item);
  });

  // Paginação
  if (totalInspectionPages > 1) {
    const paginationControls = document.createElement('div');
    paginationControls.style.cssText = `
      display: flex; align-items: center; justify-content: center; gap: 15px;
      margin: 25px 0; padding: 20px;
      background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
      border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); flex-wrap: wrap;
    `;

    paginationControls.innerHTML = `
      <button onclick="changeInspectionPage(${currentInspectionPage - 1})"
        ${currentInspectionPage === 1 ? 'disabled' : ''}
        style="padding: 10px 20px; background: ${currentInspectionPage === 1 ? '#444' : '#D4C29A'}; color: ${currentInspectionPage === 1 ? '#888' : '#0d0d0d'}; border: none; border-radius: 8px; cursor: ${currentInspectionPage === 1 ? 'not-allowed' : 'pointer'}; font-weight: bold;">
        <i class="fas fa-chevron-left"></i> Anterior
      </button>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: #D4C29A; font-weight: bold; font-size: 14px;">Página</span>
        <input type="number" id="inspectionPageInput" min="1" max="${totalInspectionPages}" value="${currentInspectionPage}"
          onkeypress="if(event.key==='Enter'){const val=parseInt(this.value);if(val>=1&&val<=${totalInspectionPages})changeInspectionPage(val);}"
          style="width: 70px; padding: 8px 12px; background: linear-gradient(135deg, #2a2a2a, #1a1a1a); color: #D4C29A; border: 2px solid #D4C29A; border-radius: 8px; text-align: center; font-weight: bold; font-size: 14px; outline: none;">
        <span style="color: #D4C29A; font-weight: bold; font-size: 14px;">de ${totalInspectionPages}</span>
        <button onclick="const val=parseInt(document.getElementById('inspectionPageInput').value);if(val>=1&&val<=${totalInspectionPages})changeInspectionPage(val);"
          style="padding: 8px 16px; background: #D4C29A; color: #0d0d0d; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px;">
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>
      <button onclick="changeInspectionPage(${currentInspectionPage + 1})"
        ${currentInspectionPage === totalInspectionPages ? 'disabled' : ''}
        style="padding: 10px 20px; background: ${currentInspectionPage === totalInspectionPages ? '#444' : '#D4C29A'}; color: ${currentInspectionPage === totalInspectionPages ? '#888' : '#0d0d0d'}; border: none; border-radius: 8px; cursor: ${currentInspectionPage === totalInspectionPages ? 'not-allowed' : 'pointer'}; font-weight: bold;">
        Próxima <i class="fas fa-chevron-right"></i>
      </button>
    `;

    list.appendChild(paginationControls);
  }
}

// ============================================
// ADICIONAR REVISITORIA EM INSPEÇÃO JÁ EXISTENTE (botão na listagem)
// ============================================
async function adicionarRevisitoriaEmInspecaoExistente(inspectionId) {
  const snapshot = await database.ref('inspections/' + inspectionId).once('value');
  const insp = snapshot.val();

  if (!insp) {
    showToast('Inspeção não encontrada!', 'error');
    return;
  }

  // Passa os dados da inspeção e o id para o modal de revisitoria
  insp._id = inspectionId;
  showRevisitoriaModal(insp);
}

// ============================================
// VER HISTÓRICO DE REVISITORIAS
// ============================================
async function viewHistoricoRevisitorias(inspectionId) {
  const snapshot = await database.ref('inspections/' + inspectionId).once('value');
  const insp = snapshot.val();

  if (!insp || !insp.revisitorias || insp.revisitorias.length === 0) {
    showToast('Nenhuma revisitoria encontrada!', 'warning');
    return;
  }

  const isPredio = insp.tipo === 'predio';
  const nomeCliente = isPredio
    ? (insp.razao_social_predio || insp.razao_social || 'N/A')
    : (insp.razao_social || 'N/A');

  const resultadoMap = {
    conforme: { color: '#16a34a', label: '✓ Conforme', icon: 'fa-check-circle' },
    parcial: { color: '#f59e0b', label: '⚠ Parcial', icon: 'fa-exclamation-circle' },
    nao_conforme: { color: '#ef4444', label: '✗ Não Conforme', icon: 'fa-times-circle' },
    nao_definido: { color: '#6b7280', label: '— N/D', icon: 'fa-question-circle' }
  };

  let revisitoriasHtml = insp.revisitorias.map((rev, idx) => {
    const r = resultadoMap[rev.resultado] || resultadoMap.nao_definido;
    const totalItens = rev.itens ? Object.values(rev.itens).filter(i => i.status !== 'na').length : 0;
    const itensOk = rev.itens ? Object.values(rev.itens).filter(i => i.status === 'ok').length : 0;
    const itensPendentes = rev.itens ? Object.values(rev.itens).filter(i => i.status === 'pendente').length : 0;

    return `
      <div style="border: 1px solid #374151; border-radius: 12px; overflow: hidden; margin-bottom: 14px;">
        <div style="background: linear-gradient(135deg, #374151, #1f2937); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="color: #D4C29A; font-weight: 700; font-size: 14px;">
            <i class="fas fa-redo-alt"></i> Revisitoria ${idx + 1}
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="color: #9ca3af; font-size: 12px;">${new Date(rev.data).toLocaleDateString('pt-BR')}</span>
            <span style="color: ${r.color}; font-weight: 700; font-size: 12px;"><i class="fas ${r.icon}"></i> ${r.label}</span>
          </div>
        </div>
        <div style="background: #1a1a1a; padding: 14px 16px;">
          <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
            <span style="background: rgba(74,222,128,0.1); color: #4ade80; border: 1px solid #16a34a; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;">${itensOk} OK</span>
            <span style="background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid #ef4444; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;">${itensPendentes} Pendentes</span>
            <span style="background: rgba(212,194,154,0.1); color: #D4C29A; border: 1px solid #6b5e3a; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;">${totalItens} Verificados</span>
          </div>
          ${rev.nao_conformidades ? `<div style="margin-bottom: 8px;"><div style="color: #f87171; font-size: 11px; font-weight: 700; margin-bottom: 3px;">NÃO CONFORMIDADES:</div><div style="color: #d1d5db; font-size: 12px; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(rev.nao_conformidades)}</div></div>` : ''}
          ${rev.correcoes_realizadas ? `<div style="margin-bottom: 8px;"><div style="color: #4ade80; font-size: 11px; font-weight: 700; margin-bottom: 3px;">CORREÇÕES REALIZADAS:</div><div style="color: #d1d5db; font-size: 12px; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(rev.correcoes_realizadas)}</div></div>` : ''}
          ${rev.obs_geral ? `<div><div style="color: #818cf8; font-size: 11px; font-weight: 700; margin-bottom: 3px;">OBSERVAÇÕES:</div><div style="color: #d1d5db; font-size: 12px; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(rev.obs_geral)}</div></div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.92); display: flex; justify-content: center;
    align-items: flex-start; z-index: 99999; padding: 20px; box-sizing: border-box;
    animation: fadeIn 0.3s ease-out; overflow-y: auto;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 2px solid #b45309; border-radius: 16px; padding: 28px;
    width: 100%; max-width: 700px; margin: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8); animation: slideUp 0.3s ease-out; box-sizing: border-box;
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="color: #f59e0b; font-size: 20px; margin: 0 0 4px; font-weight: 700;">
          <i class="fas fa-history"></i> Histórico de Revisitorias
        </h2>
        <p style="color: #D4C29A; font-size: 15px; font-weight: 600; margin: 0;">${escapeHtml(nomeCliente)}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0;">${insp.revisitorias.length} revisitoria(s) registrada(s)</p>
      </div>
      <button id="closeHistoricoBtn" style="background: #374151; color: #9ca3af; border: none; border-radius: 8px; width: 38px; height: 38px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div style="max-height: 60vh; overflow-y: auto; padding-right: 4px;">
      ${revisitoriasHtml}
    </div>
    <div style="display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap;">
      <button onclick="adicionarRevisitoriaEmInspecaoExistente('${inspectionId}')" style="
        flex: 1; background: linear-gradient(135deg, #b45309, #92400e); color: white;
        border: none; border-radius: 10px; padding: 13px 18px; cursor: pointer;
        font-size: 14px; font-weight: 700; display: flex; align-items: center;
        justify-content: center; gap: 8px; min-width: 150px;
      ">
        <i class="fas fa-plus"></i> Nova Revisitoria
      </button>
      <button id="closeHistoricoBtn2" style="
        background: #374151; color: #9ca3af; border: 1px solid #4b5563;
        border-radius: 10px; padding: 13px 18px; cursor: pointer; font-size: 14px; font-weight: 600;
      ">
        <i class="fas fa-times"></i> Fechar
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('closeHistoricoBtn').onclick = () => overlay.remove();
  document.getElementById('closeHistoricoBtn2').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  injectAnimations();
}

// ============================================
// VER RELATÓRIO DE REVISITORIA COM COMPARATIVO
// ============================================
async function viewRevisitoriaReport(inspectionId) {
  const snapshot = await database.ref('inspections/' + inspectionId).once('value');
  const insp = snapshot.val();

  if (!insp || !insp.is_revisitoria || !insp.revisitoria) {
    showToast('Dados de revisitoria não encontrados!', 'warning');
    return;
  }

  const rev = insp.revisitoria;
  const isPredio = insp.tipo === 'predio';
  const nomeCliente = isPredio
    ? (insp.razao_social_predio || insp.razao_social || 'N/A')
    : (insp.razao_social || 'N/A');

  const resultadoMap = {
    conforme: { color: '#16a34a', bg: 'rgba(22,163,74,0.15)', border: '#16a34a', label: '✓ Em Conformidade', icon: 'fa-check-circle' },
    parcial: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', label: '⚠ Parcialmente Conforme', icon: 'fa-exclamation-circle' },
    nao_conforme: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '#ef4444', label: '✗ Ainda Não Conforme', icon: 'fa-times-circle' },
    nao_definido: { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: '#6b7280', label: '— Não Definido', icon: 'fa-question-circle' }
  };
  const resultado = resultadoMap[rev.resultado] || resultadoMap.nao_definido;

  let itensHtml = '';
  const statusLabels = {
    ok: { color: '#4ade80', label: '✓ OK', bg: 'rgba(74,222,128,0.1)' },
    corrigido: { color: '#fbbf24', label: '⚙ Corrigido', bg: 'rgba(251,191,36,0.1)' },
    pendente: { color: '#f87171', label: '✗ Pendente', bg: 'rgba(248,113,113,0.1)' },
    na: { color: '#6b7280', label: '— N/A', bg: 'rgba(107,114,128,0.1)' }
  };

  const grupos = {
    'Sistema de Bombas': ['rev_bombas_reservatorio', 'rev_bombas_principal', 'rev_bombas_partida', 'rev_bombas_estado', 'rev_bombas_jockey'],
    'Rede de Hidrantes': ['rev_hidrantes_suportes', 'rev_hidrantes_vazamentos', 'rev_hidrantes_mangueira', 'rev_hidrantes_esguicho', 'rev_hidrantes_adaptador'],
    'Sistema de Alarme': ['rev_alarme_central', 'rev_alarme_baterias', 'rev_alarme_detectores', 'rev_alarme_falhas'],
    'Extintores': ['rev_ext_validade', 'rev_ext_lacres', 'rev_ext_manometro', 'rev_ext_fixacao'],
    'Sinalização': ['rev_sinal_placas', 'rev_sinal_posicionamento', 'rev_sinal_quantidade'],
    'Conformidade Geral': ['rev_conf_rotas', 'rev_conf_equipamentos', 'rev_conf_limpeza']
  };

  const labelsItens = {
    rev_bombas_reservatorio: 'Reservatório', rev_bombas_principal: 'Bomba Principal',
    rev_bombas_partida: 'Teste de Partida', rev_bombas_estado: 'Estado Geral',
    rev_bombas_jockey: 'Bomba Jockey', rev_hidrantes_suportes: 'Suportes',
    rev_hidrantes_vazamentos: 'Vazamentos', rev_hidrantes_mangueira: 'Mangueira',
    rev_hidrantes_esguicho: 'Esguicho', rev_hidrantes_adaptador: 'Adaptador Storz',
    rev_alarme_central: 'Central de Alarme', rev_alarme_baterias: 'Baterias',
    rev_alarme_detectores: 'Detectores', rev_alarme_falhas: 'Falhas no Sistema',
    rev_ext_validade: 'Validade', rev_ext_lacres: 'Lacres',
    rev_ext_manometro: 'Manômetro', rev_ext_fixacao: 'Fixação',
    rev_sinal_placas: 'Placas Fotoluminescentes', rev_sinal_posicionamento: 'Posicionamento',
    rev_sinal_quantidade: 'Quantidade', rev_conf_rotas: 'Rotas de Fuga',
    rev_conf_equipamentos: 'Acesso aos Equipamentos', rev_conf_limpeza: 'Limpeza e Organização'
  };

  if (rev.itens && Object.keys(rev.itens).length > 0) {
    Object.entries(grupos).forEach(([grupoNome, grupoItens]) => {
      const itensDoGrupo = grupoItens.filter(key => rev.itens[key] && rev.itens[key].status !== 'na');
      if (itensDoGrupo.length === 0) return;

      itensHtml += `
        <div style="margin-bottom: 14px; border: 1px solid #374151; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #374151, #1f2937); padding: 9px 14px; color: #D4C29A; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${grupoNome}
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; padding: 12px; background: #1a1a1a;">
      `;

      itensDoGrupo.forEach(key => {
        const item = rev.itens[key];
        const st = statusLabels[item.status] || statusLabels.na;
        itensHtml += `
          <div style="background: ${st.bg}; border: 1px solid ${st.color}33; border-radius: 8px; padding: 10px;">
            <div style="color: #9ca3af; font-size: 11px; margin-bottom: 4px;">${labelsItens[key] || key}</div>
            <div style="color: ${st.color}; font-weight: 700; font-size: 13px;">${st.label}</div>
            ${item.obs ? `<div style="color: #6b7280; font-size: 10px; margin-top: 4px; font-style: italic;">${escapeHtml(item.obs)}</div>` : ''}
          </div>
        `;
      });

      itensHtml += `</div></div>`;
    });
  }

  const totalItens = rev.itens ? Object.values(rev.itens).filter(i => i.status !== 'na').length : 0;
  const itensOk = rev.itens ? Object.values(rev.itens).filter(i => i.status === 'ok').length : 0;
  const itensCorrigidos = rev.itens ? Object.values(rev.itens).filter(i => i.status === 'corrigido').length : 0;
  const itensPendentes = rev.itens ? Object.values(rev.itens).filter(i => i.status === 'pendente').length : 0;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.92); display: flex; justify-content: center;
    align-items: flex-start; z-index: 99999; padding: 20px; box-sizing: border-box;
    animation: fadeIn 0.3s ease-out; overflow-y: auto;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 2px solid #b45309; border-radius: 16px; padding: 28px;
    width: 100%; max-width: 700px; margin: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8); animation: slideUp 0.3s ease-out; box-sizing: border-box;
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h2 style="color: #f59e0b; font-size: 20px; margin: 0 0 4px; font-weight: 700;">
          <i class="fas fa-file-invoice"></i> Relatório de Revisitoria
        </h2>
        <p style="color: #D4C29A; font-size: 15px; font-weight: 600; margin: 0;">${escapeHtml(nomeCliente)}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0;">
          Vistoria: ${new Date(insp.data).toLocaleDateString('pt-BR')} &nbsp;|&nbsp;
          Revisitoria: ${new Date(rev.data).toLocaleDateString('pt-BR')}
        </p>
      </div>
      <button id="closeRevisitoriaReport" style="background: #374151; color: #9ca3af; border: none; border-radius: 8px; width: 38px; height: 38px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Resultado -->
    <div style="background: ${resultado.bg}; border: 2px solid ${resultado.border}; border-radius: 12px; padding: 16px 20px; margin-bottom: 18px; display: flex; align-items: center; gap: 14px;">
      <i class="fas ${resultado.icon}" style="font-size: 32px; color: ${resultado.color};"></i>
      <div>
        <div style="color: ${resultado.color}; font-size: 18px; font-weight: 800;">${resultado.label}</div>
        <div style="color: #9ca3af; font-size: 12px; margin-top: 2px;">Resultado da Revisitoria</div>
      </div>
    </div>

    <!-- Resumo Numérico -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 18px;">
      <div style="background: rgba(74,222,128,0.1); border: 1px solid #16a34a; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="color: #4ade80; font-size: 26px; font-weight: 800;">${itensOk}</div>
        <div style="color: #9ca3af; font-size: 11px;">Itens OK</div>
      </div>
      <div style="background: rgba(251,191,36,0.1); border: 1px solid #b45309; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="color: #fbbf24; font-size: 26px; font-weight: 800;">${itensCorrigidos}</div>
        <div style="color: #9ca3af; font-size: 11px;">Corrigidos</div>
      </div>
      <div style="background: rgba(248,113,113,0.1); border: 1px solid #ef4444; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="color: #f87171; font-size: 26px; font-weight: 800;">${itensPendentes}</div>
        <div style="color: #9ca3af; font-size: 11px;">Pendentes</div>
      </div>
      <div style="background: rgba(212,194,154,0.1); border: 1px solid #6b5e3a; border-radius: 10px; padding: 14px; text-align: center;">
        <div style="color: #D4C29A; font-size: 26px; font-weight: 800;">${totalItens}</div>
        <div style="color: #9ca3af; font-size: 11px;">Total Verificados</div>
      </div>
    </div>

    <div style="max-height: 50vh; overflow-y: auto; padding-right: 4px;">

      ${rev.nao_conformidades ? `
        <div style="background: rgba(239,68,68,0.08); border: 1px solid #7f1d1d; border-radius: 10px; padding: 14px; margin-bottom: 14px;">
          <div style="color: #f87171; font-weight: 700; font-size: 13px; margin-bottom: 8px;">
            <i class="fas fa-exclamation-triangle"></i> Não Conformidades da Vistoria Original
          </div>
          <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(rev.nao_conformidades)}</p>
        </div>
      ` : ''}

      ${rev.correcoes_realizadas ? `
        <div style="background: rgba(34,197,94,0.08); border: 1px solid #14532d; border-radius: 10px; padding: 14px; margin-bottom: 14px;">
          <div style="color: #4ade80; font-weight: 700; font-size: 13px; margin-bottom: 8px;">
            <i class="fas fa-tools"></i> Correções Realizadas
          </div>
          <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(rev.correcoes_realizadas)}</p>
        </div>
      ` : ''}

      ${itensHtml ? `
        <div style="margin-bottom: 14px;">
          <div style="color: #D4C29A; font-weight: 700; font-size: 13px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
            <i class="fas fa-tasks"></i> Itens Verificados por Sistema
          </div>
          ${itensHtml}
        </div>
      ` : ''}

      ${rev.obs_geral ? `
        <div style="background: rgba(99,102,241,0.08); border: 1px solid #312e81; border-radius: 10px; padding: 14px; margin-bottom: 14px;">
          <div style="color: #818cf8; font-weight: 700; font-size: 13px; margin-bottom: 8px;">
            <i class="fas fa-sticky-note"></i> Observações Gerais
          </div>
          <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(rev.obs_geral)}</p>
        </div>
      ` : ''}

    </div>

    <div style="display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap;">
      <button onclick="generateRevisitoriaPDF('${inspectionId}')" style="
        flex: 1; background: linear-gradient(135deg, #b45309, #92400e); color: white;
        border: none; border-radius: 10px; padding: 13px 18px; cursor: pointer;
        font-size: 14px; font-weight: 700; display: flex; align-items: center;
        justify-content: center; gap: 8px; min-width: 150px;
      ">
        <i class="fas fa-file-pdf"></i> Gerar PDF Revisitoria
      </button>
      <button id="closeRevisitoriaReport2" style="
        background: #374151; color: #9ca3af; border: 1px solid #4b5563;
        border-radius: 10px; padding: 13px 18px; cursor: pointer; font-size: 14px; font-weight: 600;
      ">
        <i class="fas fa-times"></i> Fechar
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('closeRevisitoriaReport').onclick = () => overlay.remove();
  document.getElementById('closeRevisitoriaReport2').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  injectAnimations();
}

// ============================================
// GERAR PDF DA REVISITORIA
// ============================================
async function generateRevisitoriaPDF(inspectionId) {
  const snapshot = await database.ref('inspections/' + inspectionId).once('value');
  const insp = snapshot.val();

  if (!insp || !insp.revisitoria) {
    showToast('Dados não encontrados!', 'error');
    return;
  }

  const rev = insp.revisitoria;
  const isPredio = insp.tipo === 'predio';
  const nomeCliente = isPredio
    ? (insp.razao_social_predio || insp.razao_social || 'N/A')
    : (insp.razao_social || 'N/A');

  const resultadoMap = {
    conforme: { color: '#16a34a', label: 'EM CONFORMIDADE', icon: '✓' },
    parcial: { color: '#f59e0b', label: 'PARCIALMENTE CONFORME', icon: '⚠' },
    nao_conforme: { color: '#ef4444', label: 'AINDA NÃO CONFORME', icon: '✗' },
    nao_definido: { color: '#6b7280', label: 'NÃO DEFINIDO', icon: '—' }
  };
  const resultado = resultadoMap[rev.resultado] || resultadoMap.nao_definido;

  const totalItens = rev.itens ? Object.values(rev.itens).filter(i => i.status !== 'na').length : 0;
  const itensOk = rev.itens ? Object.values(rev.itens).filter(i => i.status === 'ok').length : 0;
  const itensCorrigidos = rev.itens ? Object.values(rev.itens).filter(i => i.status === 'corrigido').length : 0;
  const itensPendentes = rev.itens ? Object.values(rev.itens).filter(i => i.status === 'pendente').length : 0;

  const labelsItens = {
    rev_bombas_reservatorio: 'Reservatório', rev_bombas_principal: 'Bomba Principal',
    rev_bombas_partida: 'Teste de Partida', rev_bombas_estado: 'Estado Geral',
    rev_bombas_jockey: 'Bomba Jockey', rev_hidrantes_suportes: 'Suportes',
    rev_hidrantes_vazamentos: 'Vazamentos', rev_hidrantes_mangueira: 'Mangueira',
    rev_hidrantes_esguicho: 'Esguicho', rev_hidrantes_adaptador: 'Adaptador Storz',
    rev_alarme_central: 'Central de Alarme', rev_alarme_baterias: 'Baterias',
    rev_alarme_detectores: 'Detectores', rev_alarme_falhas: 'Falhas no Sistema',
    rev_ext_validade: 'Validade', rev_ext_lacres: 'Lacres',
    rev_ext_manometro: 'Manômetro', rev_ext_fixacao: 'Fixação',
    rev_sinal_placas: 'Placas Fotoluminescentes', rev_sinal_posicionamento: 'Posicionamento',
    rev_sinal_quantidade: 'Quantidade', rev_conf_rotas: 'Rotas de Fuga',
    rev_conf_equipamentos: 'Acesso aos Equipamentos', rev_conf_limpeza: 'Limpeza e Organização'
  };

  let itensPDFHtml = '';
  if (rev.itens) {
    const statusLabels = { ok: '✓ OK', corrigido: '⚙ Corrigido', pendente: '✗ Pendente', na: '— N/A' };
    const statusColors = { ok: '#16a34a', corrigido: '#f59e0b', pendente: '#ef4444', na: '#6b7280' };

    const grupos = {
      'Sistema de Bombas': ['rev_bombas_reservatorio', 'rev_bombas_principal', 'rev_bombas_partida', 'rev_bombas_estado', 'rev_bombas_jockey'],
      'Rede de Hidrantes': ['rev_hidrantes_suportes', 'rev_hidrantes_vazamentos', 'rev_hidrantes_mangueira', 'rev_hidrantes_esguicho', 'rev_hidrantes_adaptador'],
      'Sistema de Alarme': ['rev_alarme_central', 'rev_alarme_baterias', 'rev_alarme_detectores', 'rev_alarme_falhas'],
      'Extintores': ['rev_ext_validade', 'rev_ext_lacres', 'rev_ext_manometro', 'rev_ext_fixacao'],
      'Sinalização': ['rev_sinal_placas', 'rev_sinal_posicionamento', 'rev_sinal_quantidade'],
      'Conformidade Geral': ['rev_conf_rotas', 'rev_conf_equipamentos', 'rev_conf_limpeza']
    };

    Object.entries(grupos).forEach(([grupoNome, grupoItens]) => {
      const itensDoGrupo = grupoItens.filter(key => rev.itens[key] && rev.itens[key].status !== 'na');
      if (itensDoGrupo.length === 0) return;

      itensPDFHtml += `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 9px; font-weight: 800; color: white; background: #4b5563; padding: 6px 10px; text-transform: uppercase; letter-spacing: 0.5px;">${grupoNome}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e5e7eb;">
            ${itensDoGrupo.map((key, idx) => {
        const item = rev.itens[key];
        const color = statusColors[item.status] || '#6b7280';
        const label = statusLabels[item.status] || '—';
        return `
                <div style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; ${idx % 2 === 0 ? 'border-right: 1px solid #e5e7eb;' : ''}">
                  <div style="font-size: 8px; color: #6b7280; text-transform: uppercase; margin-bottom: 2px;">${labelsItens[key] || key}</div>
                  <div style="font-size: 9px; font-weight: 700; color: ${color};">${label}</div>
                  ${item.obs ? `<div style="font-size: 7px; color: #9ca3af; font-style: italic;">${item.obs}</div>` : ''}
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    });
  }

  const pdfHTML = `
    <div class="pdf-page" id="revisitoriaPDFPage">
      ${generatePDFHeader('RELATÓRIO DE REVISITORIA')}
      ${generateClientSection(insp)}

      <div style="margin-bottom: 12px; background: white; border-radius: 6px; border: 2px solid #e5e7eb; overflow: hidden;">
        <div style="font-size: 11px; color: white; font-weight: 800; padding: 8px 12px; background: linear-gradient(135deg, #b32117, #dc2626); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-calendar-alt"></i> Datas
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0;">
          <div style="padding: 7px 10px; border-right: 1px solid #e5e7eb;">
            <div style="font-weight: 700; color: #6b7280; font-size: 8px; text-transform: uppercase; margin-bottom: 2px;">Data da Vistoria Original</div>
            <div style="color: #1f2937; font-weight: 600; font-size: 9px;">${new Date(insp.data).toLocaleDateString('pt-BR')}</div>
          </div>
          <div style="padding: 7px 10px;">
            <div style="font-weight: 700; color: #6b7280; font-size: 8px; text-transform: uppercase; margin-bottom: 2px;">Data da Revisitoria</div>
            <div style="color: #1f2937; font-weight: 600; font-size: 9px;">${new Date(rev.data).toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 12px; background: white; border-radius: 6px; border: 2px solid ${resultado.color}; overflow: hidden;">
        <div style="font-size: 11px; color: white; font-weight: 800; padding: 8px 12px; background: ${resultado.color}; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
          ${resultado.icon} RESULTADO DA REVISITORIA
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;">
          <div style="padding: 10px; text-align: center; border-right: 1px solid #e5e7eb;">
            <div style="font-size: 18px; font-weight: 800; color: #16a34a;">${itensOk}</div>
            <div style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Itens OK</div>
          </div>
          <div style="padding: 10px; text-align: center; border-right: 1px solid #e5e7eb;">
            <div style="font-size: 18px; font-weight: 800; color: #f59e0b;">${itensCorrigidos}</div>
            <div style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Corrigidos</div>
          </div>
          <div style="padding: 10px; text-align: center; border-right: 1px solid #e5e7eb;">
            <div style="font-size: 18px; font-weight: 800; color: #ef4444;">${itensPendentes}</div>
            <div style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Pendentes</div>
          </div>
          <div style="padding: 10px; text-align: center;">
            <div style="font-size: 18px; font-weight: 800; color: #1f2937;">${totalItens}</div>
            <div style="font-size: 8px; color: #6b7280; text-transform: uppercase;">Total</div>
          </div>
        </div>
        <div style="padding: 10px 12px; border-top: 1px solid #e5e7eb; text-align: center;">
          <div style="font-size: 12px; font-weight: 800; color: ${resultado.color};">${resultado.icon} ${resultado.label}</div>
        </div>
      </div>

      ${rev.nao_conformidades ? `
        <div style="margin-bottom: 10px; background: white; border-radius: 6px; border: 2px solid #fca5a5; overflow: hidden;">
          <div style="font-size: 11px; color: white; font-weight: 800; padding: 8px 12px; background: #ef4444; text-transform: uppercase; display: flex; align-items: center; gap: 8px; letter-spacing: 0.5px;">
            <i class="fas fa-exclamation-triangle"></i> Não Conformidades da Vistoria Original
          </div>
          <div style="padding: 10px 12px; font-size: 9px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${rev.nao_conformidades.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      ` : ''}

      ${rev.correcoes_realizadas ? `
        <div style="margin-bottom: 10px; background: white; border-radius: 6px; border: 2px solid #86efac; overflow: hidden;">
          <div style="font-size: 11px; color: white; font-weight: 800; padding: 8px 12px; background: #16a34a; text-transform: uppercase; display: flex; align-items: center; gap: 8px; letter-spacing: 0.5px;">
            <i class="fas fa-tools"></i> Correções Realizadas
          </div>
          <div style="padding: 10px 12px; font-size: 9px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${rev.correcoes_realizadas.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      ` : ''}

      ${itensPDFHtml ? `
        <div style="margin-bottom: 10px; background: white; border-radius: 6px; border: 2px solid #e5e7eb; overflow: hidden;">
          <div style="font-size: 11px; color: white; font-weight: 800; padding: 8px 12px; background: linear-gradient(135deg, #4b5563, #374151); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-tasks"></i> Itens Verificados por Sistema
          </div>
          <div style="padding: 10px 12px; background: white;">
            ${itensPDFHtml}
          </div>
        </div>
      ` : ''}

      ${rev.obs_geral ? `
        <div style="margin-bottom: 10px; background: white; border-radius: 6px; border: 2px solid #a5b4fc; overflow: hidden;">
          <div style="font-size: 11px; color: white; font-weight: 800; padding: 8px 12px; background: #4f46e5; text-transform: uppercase; display: flex; align-items: center; gap: 8px; letter-spacing: 0.5px;">
            <i class="fas fa-sticky-note"></i> Observações Gerais
          </div>
          <div style="padding: 10px 12px; font-size: 9px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${rev.obs_geral.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      ` : ''}

      ${generateSignaturesSection(insp)}
      ${generatePDFFooter()}
    </div>
  `;

  const container = document.createElement('div');
  container.id = 'revisitoriaPDFContainer';
  container.style.cssText = 'position: fixed; top: -9999px; left: -9999px; width: 800px; background: white;';
  container.innerHTML = pdfHTML;
  document.body.appendChild(container);

  showToast('Gerando PDF da revisitoria...');

  try {
    const { jsPDF } = window.jspdf;
    const page = container.querySelector('.pdf-page');
    const canvas = await html2canvas(page, {
      scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pageWidth = 210;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);

    const fileName = `Revisitoria_${nomeCliente.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    showToast('PDF da revisitoria gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    showToast('Erro ao gerar PDF da revisitoria', 'error');
  } finally {
    container.remove();
  }
}

// ============================================
// VER FOTOS DA INSPEÇÃO
// ============================================
async function viewPhotosInspection(inspectionId) {
  const snapshot = await database.ref('inspections/' + inspectionId).once('value');
  const insp = snapshot.val();

  if (!insp || !insp.fotos || insp.fotos.length === 0) {
    showToast('Nenhuma foto encontrada nesta inspeção', 'warning');
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'photosModalOverlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.9); display: flex; justify-content: center;
    align-items: center; z-index: 99999; padding: 20px; box-sizing: border-box;
    animation: fadeIn 0.3s ease-out;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 2px solid #D4C29A; border-radius: 16px; padding: 30px;
    width: 100%; max-width: 800px; max-height: 80vh; overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8); animation: slideUp 0.3s ease-out; box-sizing: border-box;
  `;

  let photosHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="color: #D4C29A; font-size: 24px; margin: 0; font-weight: 700;">
        <i class="fas fa-images"></i> Fotos da Inspeção
      </h2>
      <button id="closePhotosBtn" style="background: #ef4444; color: #fff; border: none; border-radius: 8px; width: 40px; height: 40px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <p style="color: #bbb; margin-bottom: 20px;">Total: ${insp.fotos.length} foto(s)</p>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
  `;

  insp.fotos.forEach((foto, index) => {
    photosHTML += `
      <div style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #D4C29A; cursor: pointer; transition: all 0.3s;"
        onclick="expandPhotoFullscreen('${foto.data.replace(/'/g, "\\'")}', '${foto.timestamp || 'Sem data'}')"
        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 15px rgba(212,194,154,0.5)'"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
        <img src="${foto.data}" style="width: 100%; height: 150px; object-fit: cover; display: block;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: #D4C29A; padding: 8px; font-size: 12px; text-align: center;">
          ${foto.timestamp || 'Sem data'}
        </div>
      </div>
    `;
  });

  photosHTML += `</div>`;
  modal.innerHTML = photosHTML;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('closePhotosBtn').onclick = () => {
    overlay.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    }
  };

  injectAnimations();
}

// ============================================
// EXPANDIR FOTO EM TELA CHEIA
// ============================================
function expandPhotoFullscreen(photoData, timestamp) {
  const overlay = document.createElement('div');
  overlay.id = 'fullscreenPhotoOverlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.95); display: flex; justify-content: center;
    align-items: center; z-index: 999999; padding: 20px; box-sizing: border-box;
    animation: fadeIn 0.3s ease-out;
  `;

  const container = document.createElement('div');
  container.style.cssText = `position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 15px;`;

  const imageContainer = document.createElement('div');
  imageContainer.style.cssText = `flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; max-width: 90vw;`;

  const img = document.createElement('img');
  img.src = photoData;
  img.style.cssText = `max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 12px; box-shadow: 0 0 40px rgba(212,194,154,0.3); animation: slideUp 0.3s ease-out;`;
  imageContainer.appendChild(img);

  const bottomBar = document.createElement('div');
  bottomBar.style.cssText = `background: linear-gradient(135deg, #2a2a2a, #1a1a1a); border: 2px solid #D4C29A; border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 15px; flex-wrap: wrap;`;

  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = `color: #D4C29A; font-weight: 600; font-size: 14px;`;
  infoDiv.textContent = timestamp;

  const buttonsDiv = document.createElement('div');
  buttonsDiv.style.cssText = `display: flex; gap: 10px;`;

  const downloadBtn = document.createElement('button');
  downloadBtn.innerHTML = '<i class="fas fa-download"></i> Baixar';
  downloadBtn.style.cssText = `background: #2a7a3f; color: white; border: none; border-radius: 8px; padding: 10px 15px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 8px;`;
  downloadBtn.onclick = () => downloadPhoto(photoData, timestamp);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<i class="fas fa-times"></i> Fechar';
  closeBtn.style.cssText = `background: #B32117; color: white; border: none; border-radius: 8px; padding: 10px 15px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 8px;`;
  closeBtn.onclick = () => {
    overlay.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => overlay.remove(), 300);
  };

  buttonsDiv.appendChild(downloadBtn);
  buttonsDiv.appendChild(closeBtn);
  bottomBar.appendChild(infoDiv);
  bottomBar.appendChild(buttonsDiv);
  container.appendChild(imageContainer);
  container.appendChild(bottomBar);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    }
  };

  injectAnimations();
}

// ============================================
// BAIXAR FOTO
// ============================================
function downloadPhoto(photoData, timestamp) {
  const link = document.createElement('a');
  link.href = photoData;
  link.download = `foto_${timestamp.replace(/[\/\s:]/g, '-')}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Foto baixada com sucesso!', 'success');
}

// ============================================
// MENSAGEM DE SUCESSO
// ============================================
function showSuccessMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
  messageDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff; padding: 16px 24px; border-radius: 10px;
    font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 100000; display: flex; align-items: center; gap: 10px;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);

  if (!document.getElementById('slideAnimations')) {
    const style = document.createElement('style');
    style.id = 'slideAnimations';
    style.textContent = `
      @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
    `;
    document.head.appendChild(style);
  }
}

// ============================================
// INJECT ANIMATIONS HELPER
// ============================================
function injectAnimations() {
  if (!document.getElementById('globalAnimations')) {
    const style = document.createElement('style');
    style.id = 'globalAnimations';
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
    `;
    document.head.appendChild(style);
  }
}

// ============================================
// FILTRAR INSPEÇÕES
// ============================================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadInspections();
  });
});

// ============================================
// BUSCAR INSPEÇÕES
// ============================================
document.getElementById('inspectionSearch').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const items = document.querySelectorAll('#inspectionsList .list-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(searchTerm) ? '' : 'none';
  });
});

// Mark as Completed
async function markAsCompleted(inspectionId) {
  if (confirm('Tem certeza que deseja marcar esta inspeção como concluída?')) {
    try {
      await database.ref(`inspections/${inspectionId}`).update({
        completed: true,
        completedDate: new Date().toISOString()
      });
      showToast('Inspeção finalizada com sucesso!');
      loadInspections();
      loadDashboard();
    } catch (error) {
      console.error('Error completing inspection:', error);
      showToast('Erro ao finalizar inspeção', 'error');
    }
  }
}

// View Inspection
async function viewInspection(inspectionId) {
  const snapshot = await database.ref(`inspections/${inspectionId}`).once('value');
  const inspection = snapshot.val();

  // Garante que todos os dados estão presentes, incluindo tipo e campos _predio
  currentInspectionData = {
    ...inspection,
    tipo: inspection.tipo || 'empresa'
  };

  // Show PDF selection
  const grid = document.getElementById('pdfSelectionGrid');
  grid.innerHTML = '';

  const options = [
    { id: 'complete', icon: 'fa-file-alt', title: 'Relatório Completo', desc: 'Todos os sistemas inspecionados' },
  ];

  if (inspection.has_bombas) {
    options.push({ id: 'bombas', icon: 'fa-water', title: 'Sistema de Bombas', desc: 'Apenas bombas e reservatório' });
  }
  if (inspection.has_hidrantes) {
    options.push({ id: 'hidrantes', icon: 'fa-truck-droplet', title: 'Rede de Hidrantes', desc: 'Apenas hidrantes e acessórios' });
  }
  if (inspection.has_alarme) {
    options.push({ id: 'alarme', icon: 'fa-bell', title: 'Sistema de Alarme', desc: 'Apenas alarme e detectores' });
  }
  if (inspection.has_extintores) {
    options.push({ id: 'extintores', icon: 'fa-fire-extinguisher', title: 'Extintores', desc: 'Apenas extintores' });
  }
  if (inspection.has_sinalizacao) {
    options.push({ id: 'sinalizacao', icon: 'fa-sign', title: 'Sinalização', desc: 'Apenas placas e sinalização' });
  }

  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'pdf-option';
    div.innerHTML = `
          <i class="fas ${opt.icon}"></i>
          <div class="pdf-option-content">
            <div class="pdf-option-title">${opt.title}</div>
            <div class="pdf-option-desc">${opt.desc}</div>
          </div>
        `;
    div.onclick = () => generateSelectedPDF(opt.id);
    grid.appendChild(div);
  });

  openModal('pdfSelectionModal');
}

// Show PDF Options for Inspection
async function showPDFOptionsForInspection(inspectionId) {
  const snapshot = await database.ref(`inspections/${inspectionId}`).once('value');
  const inspection = snapshot.val();

  currentInspectionData = inspection;

  // Show PDF selection
  const grid = document.getElementById('pdfSelectionGrid');
  grid.innerHTML = '';

  const options = [
    { id: 'complete', icon: 'fa-file-alt', title: 'Relatório Completo', desc: 'Todos os sistemas inspecionados' },
  ];

  if (inspection.has_bombas) {
    options.push({ id: 'bombas', icon: 'fa-water', title: 'Sistema de Bombas', desc: 'Apenas bombas e reservatório' });
  }
  if (inspection.has_hidrantes) {
    options.push({ id: 'hidrantes', icon: 'fa-truck-droplet', title: 'Rede de Hidrantes', desc: 'Apenas hidrantes e acessórios' });
  }
  if (inspection.has_alarme) {
    options.push({ id: 'alarme', icon: 'fa-bell', title: 'Sistema de Alarme', desc: 'Apenas alarme e detectores' });
  }
  if (inspection.has_extintores) {
    options.push({ id: 'extintores', icon: 'fa-fire-extinguisher', title: 'Extintores', desc: 'Apenas extintores' });
  }
  if (inspection.has_sinalizacao) {
    options.push({ id: 'sinalizacao', icon: 'fa-sign', title: 'Sinalização', desc: 'Apenas placas e sinalização' });
  }

  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'pdf-option';
    div.innerHTML = `
          <i class="fas ${opt.icon}"></i>
          <div class="pdf-option-content">
            <div class="pdf-option-title">${opt.title}</div>
            <div class="pdf-option-desc">${opt.desc}</div>
          </div>
        `;
    div.onclick = () => {
      generateSelectedPDF(opt.id);
      // Auto download after generation
      setTimeout(() => {
        document.getElementById('downloadPdfBtn').click();
      }, 500);
    };
    grid.appendChild(div);
  });

  openModal('pdfSelectionModal');
}

// Load Config
