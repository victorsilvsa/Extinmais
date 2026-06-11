// SISTEMA DE ALERTAS - MOBILE FIRST
// ========================================

let todosAlertas = [];
let alertasFiltrados = [];
let filtroAtual = 'all';
let alertaSelecionado = null;
let paginaAtual = 1;
let itensPorPagina = 10;
let empresasExpandidas = new Set();
let inspecoesExpandidas = new Set();

// ========================================
// CRIAR MODAL DE EDIÇÃO
// ========================================
function criarModalValidade() {
  if (document.getElementById('editValidadeModal')) {
    return;
  }

  const modalHTML = `
    <div id="editValidadeModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Editar Validade</h3>
          <button class="btn-close-modal" onclick="fecharModalValidade()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="info-card">
            <div class="info-row">
              <i class="fas fa-building"></i>
              <div>
                <span class="label">Empresa</span>
                <span class="value" id="modalEmpresa">-</span>
              </div>
            </div>
            
            <div class="info-row">
              <i class="fas fa-tag"></i>
              <div>
                <span class="label">Categoria</span>
                <span class="value" id="modalCategoria">-</span>
              </div>
            </div>
            
            <div class="info-row">
              <i class="fas fa-cube"></i>
              <div>
                <span class="label">Item</span>
                <span class="value" id="modalTipo">-</span>
              </div>
            </div>
            
            <div class="info-row status-row" id="modalStatus">
              <i class="fas fa-exclamation-triangle"></i>
              <div>
                <span class="label">Status</span>
                <span class="value" id="modalStatusTexto">-</span>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>
        <i class="fas fa-calendar-alt" style="font-size: 15px;"></i>
              Nova Data de Validade
            </label>
            <input 
              type="date" 
              id="inputNovaValidade" 
              class="input-date"
            >
          </div>
          
          <div class="info-atual">
            <i class="fas fa-info-circle"></i>
            <div>
              <strong>Validade atual:</strong>
              <span id="modalValidadeAtual">-</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" onclick="fecharModalValidade()">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button class="btn-save" onclick="salvarNovaValidade()">
            <i class="fas fa-save"></i>
            Salvar
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ========================================
// IDENTIFICAR CATEGORIA DO ITEM
// ========================================
function identificarCategoria(campo) {
  if (campo.includes('mangueira')) {
    return { categoria: 'Mangueira', icon: 'fa-water', cor: '#3b82f6' };
  } else if (campo.includes('extintor') || campo === 'extintores_validade') {
    return { categoria: 'Extintor', icon: 'fa-fire-extinguisher', cor: '#ef4444' };
  } else if (campo.includes('cert')) {
    return { categoria: 'Certificado', icon: 'fa-certificate', cor: '#f59e0b' };
  } else if (campo.includes('alarme')) {
    return { categoria: 'Alarme de Incêndio', icon: 'fa-bell', cor: '#ec4899' };
  } else if (campo.includes('botoeira')) {
    return { categoria: 'Botoeira', icon: 'fa-circle', cor: '#06b6d4' };
  } else if (campo.includes('central')) {
    return { categoria: 'Central de Alarme', icon: 'fa-microchip', cor: '#8b5cf6' };
  } else if (campo.includes('detector')) {
    return { categoria: 'Detector de Fumaça', icon: 'fa-smoke', cor: '#6366f1' };
  } else if (campo.includes('hidrante')) {
    return { categoria: 'Hidrante', icon: 'fa-hydrant', cor: '#10b981' };
  } else if (campo.includes('iluminacao')) {
    return { categoria: 'Iluminação de Emergência', icon: 'fa-lightbulb', cor: '#fbbf24' };
  } else if (campo.includes('projeto_spda')) {
    return { categoria: 'Projeto SPDA', icon: 'fa-bolt', cor: '#f97316' };
  } else if (campo.includes('sprinklers')) {
    return { categoria: 'Sprinklers', icon: 'fa-spray-can', cor: '#14b8a6' };
  }
  return { categoria: 'Outros', icon: 'fa-cube', cor: '#6b7280' };
}

// ========================================
// BUSCAR E AGRUPAR ALERTAS
// ========================================
async function buscarAlertasVencimento() {
  const inspectionsRef = firebase.database().ref('inspections');

  inspectionsRef.on('value', (snapshot) => {
    try {
      const inspections = snapshot.val();

      if (!inspections) {
        todosAlertas = [];
        alertasFiltrados = [];
        atualizarContadores();
        renderizarAlertas();
        return;
      }

      const empresasMap = {};

      Object.entries(inspections).forEach(([id, inspecao]) => {
        const razaoSocial = inspecao.razao_social || 'Empresa sem nome';
        const cnpj = inspecao.cnpj || '-';
        const dataInspecao = inspecao.data_inspecao || null;

        if (!empresasMap[razaoSocial]) {
          empresasMap[razaoSocial] = {
            empresa: razaoSocial,
            cnpj: cnpj,
            inspecoes: [],
            totalVencidos: 0,
            totalProximos: 0
          };
        }

        const itensVencidos = [];

        // ========== VERIFICA MANGUEIRA ==========
        if (inspecao.mangueira_data_vencimento) {
          const dataValidade = inspecao.mangueira_data_vencimento;
          const diasRestantes = calcularDiasRestantes(dataValidade);

          if (diasRestantes !== null) {
            const status = determinarStatus(diasRestantes);

            if (status !== 'ok') {
              const tipoMangueira = inspecao.mangueira_tipo || 'Mangueira';
              const diametroMangueira = inspecao.mangueira_diametro || '';
              const comprimentoMangueira = inspecao.mangueira_comprimento ? inspecao.mangueira_comprimento + 'm' : '';

              const tipo = `${tipoMangueira} ${diametroMangueira} ${comprimentoMangueira}`.trim();

              itensVencidos.push({
                id: `${id}-mangueira_data_vencimento`,
                tipo: tipo,
                validade: dataValidade,
                diasRestantes: diasRestantes,
                status: status,
                campo: 'mangueira_data_vencimento',
                categoria: 'Mangueira',
                inspectionId: id
              });

              if (status === 'vencido') {
                empresasMap[razaoSocial].totalVencidos++;
              } else if (status === 'proximo') {
                empresasMap[razaoSocial].totalProximos++;
              }
            }
          }
        }

        // ========== VERIFICA EXTINTORES ==========
        // Campo geral de validade dos extintores
        if (inspecao.extintores_validade) {
          const dataValidade = inspecao.extintores_validade;
          const diasRestantes = calcularDiasRestantes(dataValidade);

          if (diasRestantes !== null) {
            const status = determinarStatus(diasRestantes);

            if (status !== 'ok') {
              const tipo = formatarTipoCampo('extintores_validade', inspecao);

              itensVencidos.push({
                id: `${id}-extintores_validade`,
                tipo: tipo,
                validade: dataValidade,
                diasRestantes: diasRestantes,
                status: status,
                campo: 'extintores_validade',
                categoria: 'Extintor',
                inspectionId: id
              });

              if (status === 'vencido') {
                empresasMap[razaoSocial].totalVencidos++;
              } else if (status === 'proximo') {
                empresasMap[razaoSocial].totalProximos++;
              }
            }
          }
        }

        // Verifica extintores individuais (extintores_validade_1, extintores_validade_2, etc.)
        Object.keys(inspecao).forEach(campo => {
          if (campo.startsWith('extintores_validade_') && inspecao[campo]) {
            const dataValidade = inspecao[campo];
            const diasRestantes = calcularDiasRestantes(dataValidade);

            if (diasRestantes !== null) {
              const status = determinarStatus(diasRestantes);

              if (status !== 'ok') {
                const tipo = formatarTipoCampo(campo, inspecao);

                itensVencidos.push({
                  id: `${id}-${campo}`,
                  tipo: tipo,
                  validade: dataValidade,
                  diasRestantes: diasRestantes,
                  status: status,
                  campo: campo,
                  categoria: 'Extintor',
                  inspectionId: id
                });

                if (status === 'vencido') {
                  empresasMap[razaoSocial].totalVencidos++;
                } else if (status === 'proximo') {
                  empresasMap[razaoSocial].totalProximos++;
                }
              }
            }
          }
        });

        // ========== VERIFICA CERTIFICADO ==========
        if (inspecao.cert_validade) {
          const dataValidade = inspecao.cert_validade;
          const diasRestantes = calcularDiasRestantes(dataValidade);

          if (diasRestantes !== null) {
            const status = determinarStatus(diasRestantes);

            if (status !== 'ok') {
              const tipo = `Certificado ${inspecao.cert_tipo || ''}`.trim();

              itensVencidos.push({
                id: `${id}-cert_validade`,
                tipo: tipo,
                validade: dataValidade,
                diasRestantes: diasRestantes,
                status: status,
                campo: 'cert_validade',
                categoria: 'Certificado',
                inspectionId: id
              });

              if (status === 'vencido') {
                empresasMap[razaoSocial].totalVencidos++;
              } else if (status === 'proximo') {
                empresasMap[razaoSocial].totalProximos++;
              }
            }
          }
        }

        // ========== VERIFICA OUTROS CAMPOS ==========
        Object.keys(inspecao).forEach(campo => {
          // Busca apenas campos que terminam com "validade"
          if (campo.endsWith('validade') &&
            !campo.includes('inicio') &&
            !campo.includes('mangueira') &&
            !campo.includes('extintor') &&
            !campo.includes('cert') &&
            inspecao[campo]) {

            const dataValidade = inspecao[campo];
            const diasRestantes = calcularDiasRestantes(dataValidade);

            if (diasRestantes !== null) {
              const status = determinarStatus(diasRestantes);

              if (status !== 'ok') {
                const tipo = formatarTipoCampo(campo, inspecao);

                itensVencidos.push({
                  id: `${id}-${campo}`,
                  tipo: tipo,
                  validade: dataValidade,
                  diasRestantes: diasRestantes,
                  status: status,
                  campo: campo,
                  categoria: identificarCategoria(campo).categoria,
                  inspectionId: id
                });

                if (status === 'vencido') {
                  empresasMap[razaoSocial].totalVencidos++;
                } else if (status === 'proximo') {
                  empresasMap[razaoSocial].totalProximos++;
                }
              }
            }
          }
        });

        if (itensVencidos.length > 0) {
          empresasMap[razaoSocial].inspecoes.push({
            inspectionId: id,
            dataInspecao: dataInspecao,
            itens: itensVencidos.sort((a, b) => {
              if (a.status === 'vencido' && b.status !== 'vencido') return -1;
              if (a.status !== 'vencido' && b.status === 'vencido') return 1;
              return a.diasRestantes - b.diasRestantes;
            })
          });
        }
      });

      const empresasArray = Object.values(empresasMap)
        .filter(emp => emp.inspecoes.length > 0)
        .sort((a, b) => {
          if (a.totalVencidos !== b.totalVencidos) return b.totalVencidos - a.totalVencidos;
          if (a.totalProximos !== b.totalProximos) return b.totalProximos - a.totalProximos;
          return a.empresa.localeCompare(b.empresa);
        });

      todosAlertas = empresasArray;
      alertasFiltrados = empresasArray;

      atualizarContadores();
      renderizarAlertas();

    } catch (error) {
      console.error('Erro ao processar alertas:', error);
    }
  }, (error) => {
    console.error('Erro na conexão em tempo real:', error);
    showToast('Erro ao sincronizar alertas', 'error');
  });
}

// ========================================
// FORMATAR TIPO DE CAMPO
// ========================================
function formatarTipoCampo(campo, inspecao) {
  if (campo === 'cert_validade') return `Certificado ${inspecao.cert_tipo || ''}`;
  if (campo.startsWith('extintores_validade_')) {
    const index = campo.replace('extintores_validade_', '');
    return `${inspecao[`extintores_tipo_${index}`] || 'Extintor'} ${inspecao[`extintores_peso_${index}`] || ''}`.trim();
  }
  const nomes = {
    'alarme_incendio_validade': 'Alarme de Incêndio',
    'botoeira_validade': 'Botoeira',
    'central_alarme_validade': 'Central de Alarme',
    'detector_fumaca_validade': 'Detector de Fumaça',
    'hidrante_validade': 'Hidrante',
    'iluminacao_emergencia_validade': 'Iluminação de Emergência',
    'mangueira_validade': 'Mangueira',
    'projeto_spda_validade': 'Projeto SPDA',
    'sprinklers_validade': 'Sprinklers'
  };
  return nomes[campo] || campo.replace('_validade', '').replace(/_/g, ' ');
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================
function calcularDiasRestantes(dataValidade) {
  if (!dataValidade) return null;

  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const validade = new Date(dataValidade);

    if (isNaN(validade.getTime())) {
      return null;
    }

    validade.setHours(0, 0, 0, 0);

    const diffTime = validade - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    return null;
  }
}

function determinarStatus(diasRestantes) {
  if (diasRestantes === null) return 'ok';
  if (diasRestantes < 0) {
    return 'vencido';
  } else if (diasRestantes <= 30) {
    return 'proximo';
  }
  return 'ok';
}



function atualizarContadores() {
  let totalItens = 0;
  let totalVencidos = 0;
  let totalProximos = 0;

  todosAlertas.forEach(empresa => {
    totalVencidos += empresa.totalVencidos;
    totalProximos += empresa.totalProximos;
    empresa.inspecoes.forEach(inspecao => {
      totalItens += inspecao.itens.length;
    });
  });

  const alertsBadge = document.getElementById('alertsBadge');
  const totalAlertasEl = document.getElementById('totalAlertas');

  if (alertsBadge) alertsBadge.textContent = totalItens;
  if (totalAlertasEl) totalAlertasEl.textContent = totalItens;

  const countAll = document.getElementById('countAll');
  const countVencido = document.getElementById('countVencido');
  const countProximo = document.getElementById('countProximo');

  if (countAll) countAll.textContent = totalItens;
  if (countVencido) countVencido.textContent = totalVencidos;
  if (countProximo) countProximo.textContent = totalProximos;
}

// ========================================
// TOGGLE FUNCTIONS
// ========================================
// toggleAlertsList duplicado removido (ver definição acima)

function toggleEmpresa(empresaNome) {
  if (empresasExpandidas.has(empresaNome)) {
    empresasExpandidas.delete(empresaNome);
  } else {
    empresasExpandidas.add(empresaNome);
  }
  renderizarAlertas();
}

function toggleInspecao(inspectionId) {
  if (inspecoesExpandidas.has(inspectionId)) {
    inspecoesExpandidas.delete(inspectionId);
  } else {
    inspecoesExpandidas.add(inspectionId);
  }
  renderizarAlertas();
}

// ========================================
// FILTROS
// ========================================
function filterAlerts(tipo) {
  filtroAtual = tipo;
  paginaAtual = 1;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const filterBtn = document.querySelector(`[data-filter="${tipo}"]`);
  if (filterBtn) {
    filterBtn.classList.add('active');
  }

  if (tipo === 'all') {
    alertasFiltrados = todosAlertas;
  } else {
    alertasFiltrados = todosAlertas.map(empresa => {
      const inspecoesFiltradas = empresa.inspecoes.map(inspecao => {
        const itensFiltrados = inspecao.itens.filter(item => item.status === tipo);
        if (itensFiltrados.length > 0) {
          return { ...inspecao, itens: itensFiltrados };
        }
        return null;
      }).filter(i => i !== null);

      if (inspecoesFiltradas.length > 0) {
        const totalVencidos = inspecoesFiltradas.reduce((sum, insp) =>
          sum + insp.itens.filter(i => i.status === 'vencido').length, 0);
        const totalProximos = inspecoesFiltradas.reduce((sum, insp) =>
          sum + insp.itens.filter(i => i.status === 'proximo').length, 0);

        return {
          ...empresa,
          inspecoes: inspecoesFiltradas,
          totalVencidos,
          totalProximos
        };
      }
      return null;
    }).filter(e => e !== null);
  }

  renderizarAlertas();
}

// ========================================
// RENDERIZAR ALERTAS (MOBILE FIRST)
// ========================================
function renderizarAlertas() {
  const container = document.getElementById('alertsList');
  const paginationContainer = document.getElementById('paginationContainer');

  if (!container) return;

  if (alertasFiltrados.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px; text-align: center; color: #D4C29A;">
        <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <p>Nenhum item ${filtroAtual === 'vencido' ? 'vencido' : filtroAtual === 'proximo' ? 'próximo do vencimento' : 'vencido ou próximo'}</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.style.display = 'none';
    return;
  }

  const totalItens = alertasFiltrados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);

  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  if (paginaAtual < 1) paginaAtual = 1;

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = Math.min(inicio + itensPorPagina, totalItens);
  const empresasPaginadas = alertasFiltrados.slice(inicio, fim);

  const btnPDFGeral = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; width: 100%; background: #1a1a1a; padding: 15px; border-radius: 12px; border: 1px solid #333;">
      <div style="color: #efefef; font-size: 0.9rem;">
        <i class="fas fa-file-invoice" style="color: #D4C29A; margin-right: 8px;"></i>
        Relatório de <strong>${totalItens}</strong> registros
      </div>
      <button onclick="gerarPDFVencimentos()" style="
        background: linear-gradient(180deg, #D4C29A, #a7926d);
        color: #0f0f0f;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 700;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      " onmouseover="this.style.filter='brightness(1.2)'; this.style.transform='scale(1.02)'" onmouseout="this.style.filter='none'; this.style.transform='scale(1)'">
        <i class="fas fa-file-pdf"></i> Exportar Tudo
      </button>
    </div>
  `;

  container.innerHTML = btnPDFGeral + empresasPaginadas.map(empresa => {
    const isEmpresaExpanded = empresasExpandidas.has(empresa.empresa);
    const statusClass = empresa.totalVencidos > 0 ? 'vencido' : 'proximo';
    const empresaNomeEscaped = empresa.empresa.replace(/'/g, "\\'");

    return `
      <div class="empresa-card ${statusClass}">
        <div class="empresa-header" onclick="toggleEmpresa('${empresaNomeEscaped}')">
          <div class="empresa-info">
            <div class="empresa-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="empresa-data">
              <div class="empresa-nome">${empresa.empresa}</div>
              <div class="empresa-cnpj">${empresa.cnpj}</div>
            </div>
          </div>
          
          <div class="empresa-badges" style="display: flex; align-items: center; gap: 12px;">
            <button onclick="event.stopPropagation(); gerarPDFVencimentos('${empresaNomeEscaped}')" 
              title="Baixar PDF desta empresa" 
              style="
                background: transparent;
                border: 1px solid #D4C29A;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                color: #D4C29A;
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 11px;
                font-weight: 600;
                transition: all 0.2s;
              "
              onmouseover="this.style.background='#D4C29A'; this.style.color='#0f0f0f'" 
              onmouseout="this.style.background='transparent'; this.style.color='#D4C29A'">
              <i class="fas fa-download"></i> PDF
            </button>

            ${empresa.totalVencidos > 0 ? `<span class="badge badge-vencido">${empresa.totalVencidos}</span>` : ''}
            ${empresa.totalProximos > 0 ? `<span class="badge badge-proximo">${empresa.totalProximos}</span>` : ''}
            <i class="fas fa-chevron-${isEmpresaExpanded ? 'up' : 'down'} chevron-icon"></i>
          </div>
        </div>
        
        ${isEmpresaExpanded ? `
          <div class="empresa-inspecoes">
            ${empresa.inspecoes.map(inspecao => {
      const isInspecaoExpanded = inspecoesExpandidas.has(inspecao.inspectionId);
      return `
                <div class="inspecao-item">
                  <div class="inspecao-header" onclick="event.stopPropagation(); toggleInspecao('${inspecao.inspectionId}')">
                    <div class="inspecao-info">
                      <i class="fas fa-clipboard-check"></i>
                      <span>Inspeção ${formatarData(inspecao.dataInspecao)}</span>
                    </div>
                    <div class="inspecao-count">
                      <span>${inspecao.itens.length} itens</span>
                      <i class="fas fa-chevron-${isInspecaoExpanded ? 'up' : 'down'}"></i>
                    </div>
                  </div>
                  ${isInspecaoExpanded ? `
                    <div class="itens-list">
                      ${inspecao.itens.map(item => {
        const tipoEscaped = item.tipo.replace(/'/g, "\\'");
        const campoEscaped = item.campo ? item.campo.replace(/'/g, "\\'") : '';
        const categoriaInfo = identificarCategoria(item.campo);
        const empresaNomeEscapedItem = empresa.empresa.replace(/'/g, "\\'");

        return `
                        <div class="item-card ${item.status}">
                          <div class="item-header">
                            <div class="item-icon"><i class="fas fa-${item.status === 'vencido' ? 'times-circle' : 'exclamation-circle'}"></i></div>
                            <div class="item-info">
                              <div class="item-categoria" style="font-size: 11px; color: #888; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                <i class="fas ${categoriaInfo.icon}" style="color: ${categoriaInfo.cor};"></i>
                                ${item.categoria}
                              </div>
                              <div class="item-nome">${item.tipo}</div>
                              <div class="item-meta">
                                <span><i class="fas fa-calendar"></i> ${formatarData(item.validade)}</span>
                                <span class="status-text">${item.status === 'vencido' ? 'Vencido' : 'Próximo'}</span>
                              </div>
                            </div>
                            <button 
                              onclick="event.stopPropagation(); abrirModalEdicaoItem('${inspecao.inspectionId}', '${campoEscaped}', '${empresaNomeEscapedItem}', '${tipoEscaped}', '${item.categoria}')" 
                              title="Editar validade" 
                              style="
                                background: transparent;
                                border: 1px solid #D4C29A;
                                padding: 6px 12px;
                                border-radius: 6px;
                                cursor: pointer;
                                color: #D4C29A;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                                font-size: 11px;
                                font-weight: 600;
                                transition: all 0.2s;
                                margin-left: auto;
                              "
                              onmouseover="this.style.background='#D4C29A'; this.style.color='#0f0f0f'" 
                              onmouseout="this.style.background='transparent'; this.style.color='#D4C29A'">
                              <i class="fas fa-edit"></i> Editar
                            </button>
                          </div>
                        </div>
                      `;
      }).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
    }).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  if (totalItens > 5) {
    if (paginationContainer) paginationContainer.style.display = 'flex';
    atualizarPaginacao(totalItens, inicio, fim, totalPaginas);
  } else {
    if (paginationContainer) paginationContainer.style.display = 'none';
  }
}
// ===================================
