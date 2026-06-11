
// ===================================
// FUNÇÃO DE ASSINATURAS
// ===================================
function epdfSignaturesVencimento(dadosEmpresaCompletos, empresa) {
  const tecnico = (window.currentUser && window.currentUser.nome) ? window.currentUser.nome : 'Técnico Responsável';
  const cnpjTec = (window.currentUser && window.currentUser.cnpj) ? window.currentUser.cnpj : '—';
  const responsavel = dadosEmpresaCompletos?.responsavel || dadosEmpresaCompletos?.responsavel_predio || 'Responsável';
  const razaoSocial = dadosEmpresaCompletos?.razao_social || dadosEmpresaCompletos?.razao_social_predio || empresa?.empresa || '—';
  const endereco = dadosEmpresaCompletos?.endereco || dadosEmpresaCompletos?.endereco_predio || '—';

  return `
    <div class="section-card sig-card">
      <div class="section-title">
        <i class="fas fa-pen-nib"></i> ASSINATURAS E RESPONSABILIDADES
      </div>
      <div class="sig-grid">
        <div class="sig-block">
          <div class="sig-role"><i class="fas fa-hard-hat"></i> Técnico Responsável</div>
          <div class="sig-line-area"></div>
          <div class="sig-name">${tecnico}</div>
          <div class="sig-sub">CNPJ: ${cnpjTec}</div>
          <div class="sig-sub2">EXTINMAIS — Proteção e Combate a Incêndio</div>
        </div>
        <div class="sig-block">
          <div class="sig-role"><i class="fas fa-user-tie"></i> Responsável pelo Local</div>
          <div class="sig-line-area"></div>
          <div class="sig-name">${responsavel}</div>
          <div class="sig-sub">${razaoSocial}</div>
          <div class="sig-sub2">${endereco}</div>
        </div>
      </div>
    </div>
  `;
}

// ===================================
// FUNÇÃO PRINCIPAL PARA GERAR PDF
// ===================================
async function gerarPDFVencimentos(empresaAlvo = null) {
  try {
    const dadosParaImprimir = empresaAlvo
      ? alertasFiltrados.filter(e => e.empresa === empresaAlvo)
      : alertasFiltrados;

    if (dadosParaImprimir.length === 0) {
      showToast('Nenhum dado encontrado para gerar o PDF', 'warning');
      return;
    }

    const isIndividual = empresaAlvo !== null;
    const tipoRelatorio = isIndividual ? 'Individual' : 'Geral';
    const totalEmpresas = dadosParaImprimir.length;

    showToast(`Iniciando geração do PDF...`, 'info');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    let primeiraFolha = true;

    for (const [empresaIdx, empresa] of dadosParaImprimir.entries()) {
      showToast(`Processando empresa ${empresaIdx + 1} de ${totalEmpresas}: ${empresa.empresa}`, 'info');

      // Buscar dados completos da empresa no Firebase
      let dadosEmpresaCompletos = null;
      try {
        const dbRef = firebase.database().ref('companies');
        const snapshot = await dbRef.once('value');
        const prediosRef = firebase.database().ref('buildings');
        const snapshotPredios = await prediosRef.once('value');

        if (snapshot.exists()) {
          const companies = snapshot.val();
          for (const [id, empresaData] of Object.entries(companies)) {
            if (
              empresaData.razao_social === empresa.empresa ||
              empresaData.razao_social?.toLowerCase() === empresa.empresa?.toLowerCase() ||
              empresa.cnpj === empresaData.cnpj
            ) {
              dadosEmpresaCompletos = empresaData;
              break;
            }
          }
        }

        if (!dadosEmpresaCompletos && snapshotPredios.exists()) {
          const predios = snapshotPredios.val();
          for (const [id, predioData] of Object.entries(predios)) {
            if (
              predioData.razao_social_predio === empresa.empresa ||
              predioData.razao_social_predio?.toLowerCase() === empresa.empresa?.toLowerCase() ||
              empresa.cnpj === predioData.cnpj_predio
            ) {
              dadosEmpresaCompletos = predioData;
              break;
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados da empresa/prédio:', error);
      }

      // Coletar TODOS os vencimentos da empresa em uma lista plana
      const todosVencimentos = [];
      empresa.inspecoes.forEach(inspecao => {
        inspecao.itens.forEach(item => {
          todosVencimentos.push({
            ...item,
            inspecaoTipo: inspecao.tipo,
            inspecaoData: inspecao.dataInspecao
          });
        });
      });

      const totalItensEmpresa = todosVencimentos.length;
      const vencidosEmpresa = todosVencimentos.filter(i => i.status === 'vencido').length;
      const aVencerEmpresa = totalItensEmpresa - vencidosEmpresa;

      // ── Dividir em chunks de 10 itens por folha ──
      const ITENS_POR_FOLHA = 10;
      const chunks = [];
      for (let i = 0; i < todosVencimentos.length; i += ITENS_POR_FOLHA) {
        chunks.push(todosVencimentos.slice(i, i + ITENS_POR_FOLHA));
      }
      if (chunks.length === 0) chunks.push([]); // empresa sem itens: 1 folha vazia

      for (const [chunkIdx, chunk] of chunks.entries()) {
        const isPrimeiraFolhaEmpresa = chunkIdx === 0;
        const isUltimaFolhaEmpresa   = chunkIdx === chunks.length - 1;
        const offsetIdx              = chunkIdx * ITENS_POR_FOLHA; // numeração global de linha

        if (!primeiraFolha) {
          pdf.addPage();
        }
        primeiraFolha = false;

        const paginaHTML = gerarPaginaEmpresaHTML({
          tipoRelatorio,
          isIndividual,
          empresa,
          dadosEmpresaCompletos,
          todosVencimentos: chunk,
          offsetIdx,
          totalItensEmpresa,
          vencidosEmpresa,
          aVencerEmpresa,
          isPrimeiraFolhaEmpresa,
          isUltimaFolhaEmpresa,
          paginaAtualEmpresa: chunkIdx + 1,
          totalPaginasEmpresa: chunks.length
        });

        await renderizarPaginaNoPDF(pdf, paginaHTML);
      }
    }

    // Nome e download do arquivo
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    let nomeArquivo;
    if (isIndividual) {
      const nomeEmpresaLimpo = dadosParaImprimir[0].empresa.replace(/[^a-zA-Z0-9]/g, '_');
      nomeArquivo = `Vencimento_${nomeEmpresaLimpo}_${dataAtual}.pdf`;
    } else {
      nomeArquivo = `Relatorio_Geral_Vencimentos_${dataAtual}.pdf`;
    }

    showToast(`Baixando PDF...`, 'info');
    pdf.save(nomeArquivo);
    showToast(` PDF gerado com sucesso!`, 'success');

  } catch (error) {
    console.error('Erro ao gerar PDFs:', error);
    showToast('❌ Erro ao gerar PDF: ' + error.message, 'error');
  }
}

// ===================================
// FUNÇÃO PARA MONTAR HTML DA PÁGINA DA EMPRESA
// ===================================
function gerarPaginaEmpresaHTML(opcoes) {
  const {
    tipoRelatorio,
    isIndividual,
    empresa,
    dadosEmpresaCompletos,
    todosVencimentos,   // chunk atual (≤ 10 itens)
    offsetIdx,          // índice global do primeiro item deste chunk
    totalItensEmpresa,
    vencidosEmpresa,
    aVencerEmpresa,
    isPrimeiraFolhaEmpresa,
    isUltimaFolhaEmpresa,
    paginaAtualEmpresa,
    totalPaginasEmpresa
  } = opcoes;

  const proximosVencer = isPrimeiraFolhaEmpresa
    ? todosVencimentos.filter(i => i.status !== 'vencido' && i.diasRestantes <= 30).length
    : 0;

  // ── Badge do header ──
  // Individual: ícone building + texto "RELATÓRIO INDIVIDUAL" (sem cor extra, usa o padrão do CSS)
  // Geral: ícone chart-bar + texto "RELATÓRIO GERAL" + tag [GERAL] diferenciando visualmente
  const badgeHTML = isIndividual
    ? `<div class="header-badge">
         <i class="fas fa-building"></i>&nbsp; RELATÓRIO INDIVIDUAL
       </div>`
    : `<div class="header-badge header-badge-geral">
         <i class="fas fa-chart-bar"></i>&nbsp; RELATÓRIO GERAL
         <span class="badge-geral-tag">GERAL</span>
       </div>`;

  // ── Continuação: só mostra dados da empresa e resumo na primeira folha ──
  const secaoDadosEmpresa = isPrimeiraFolhaEmpresa ? `
    <div class="section-card">
      <div class="section-title">
        <i class="fas fa-building"></i> DADOS DA EMPRESA
      </div>
      <div class="dados-empresa-grid">
        <div class="dado-item">
          <div class="dado-label"><i class="fas fa-file-signature"></i> RAZÃO SOCIAL</div>
          <div class="dado-valor">${empresa.empresa || '-'}</div>
        </div>
        <div class="dado-item">
          <div class="dado-label"><i class="fas fa-phone"></i> TELEFONE</div>
          <div class="dado-valor">${dadosEmpresaCompletos?.telefone || dadosEmpresaCompletos?.telefone_predio || '—'}</div>
        </div>
        <div class="dado-item">
          <div class="dado-label"><i class="fas fa-id-card"></i> CNPJ / CPF</div>
          <div class="dado-valor">${empresa.cnpj || '-'}</div>
        </div>
        <div class="dado-item">
          <div class="dado-label"><i class="fas fa-user-tie"></i> RESPONSÁVEL</div>
          <div class="dado-valor">${dadosEmpresaCompletos?.responsavel || dadosEmpresaCompletos?.responsavel_predio || '—'}</div>
        </div>
        <div class="dado-item">
          <div class="dado-label"><i class="fas fa-map-marker-alt"></i> CEP</div>
          <div class="dado-valor">${dadosEmpresaCompletos?.cep || dadosEmpresaCompletos?.cep_predio || '—'}</div>
        </div>
        <div class="dado-item">
          <div class="dado-label"><i class="fas fa-envelope"></i> EMAIL</div>
          <div class="dado-valor">${dadosEmpresaCompletos?.email || dadosEmpresaCompletos?.email_predio || '—'}</div>
        </div>
        <div class="dado-item col-span-2">
          <div class="dado-label"><i class="fas fa-location-arrow"></i> ENDEREÇO</div>
          <div class="dado-valor">${dadosEmpresaCompletos?.endereco || dadosEmpresaCompletos?.endereco_predio || '—'}</div>
        </div>
        <div class="dado-item">
          <div class="dado-label"><i class="far fa-calendar-alt"></i> DATA DO RELATÓRIO</div>
          <div class="dado-valor">${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title-row">
        <div class="section-title"><i class="fas fa-chart-pie"></i> RESUMO DE VENCIMENTOS</div>
        <div class="resumo-badge-total">${totalItensEmpresa} ITENS</div>
      </div>
      <div class="resumo-cards">
        <div class="resumo-card">
          <div class="resumo-card-valor total">${totalItensEmpresa}</div>
          <div class="resumo-card-label"><i class="fas fa-list"></i> TOTAL</div>
        </div>
        <div class="resumo-card">
          <div class="resumo-card-valor em-dia">${aVencerEmpresa - proximosVencer}</div>
          <div class="resumo-card-label"><i class="fas fa-check-circle"></i> EM DIA</div>
        </div>
        <div class="resumo-card">
          <div class="resumo-card-valor prox-vencer">${proximosVencer}</div>
          <div class="resumo-card-label"><i class="fas fa-exclamation-triangle"></i> PRÓX. VENC.</div>
        </div>
        <div class="resumo-card">
          <div class="resumo-card-valor vencidos">${vencidosEmpresa}</div>
          <div class="resumo-card-label"><i class="fas fa-times-circle"></i> VENCIDOS</div>
        </div>
      </div>
    </div>
  ` : `
    <div class="section-card continuacao-card">
      <div class="continuacao-info">
        <i class="fas fa-building"></i>
        <span class="cont-empresa">${empresa.empresa}</span>
        <span class="cont-sep">—</span>
        <span class="cont-label">Continuação (Folha ${paginaAtualEmpresa} de ${totalPaginasEmpresa})</span>
      </div>
    </div>
  `;

  // ── Linhas da tabela com numeração global ──
  const linhasTabela = todosVencimentos.map((v, idx) => {
    const isVencido = v.status === 'vencido';
    const statusClass = isVencido ? 'status-vencido' : 'status-avencer';
    const statusTexto = isVencido ? 'Vencido' : 'A Vencer';

    return `
      <tr>
        <td class="col-num">${offsetIdx + idx + 1}</td>
        <td class="col-nome">${v.tipo || '-'}</td>
        <td class="col-func">${v.categoria || '-'}</td>
        <td class="col-cpf">${formatarData(v.inspecaoData) || '-'}</td>
        <td class="col-bc">${formatarData(v.validade) || '-'}</td>
        <td class="col-tel">${Math.abs(v.diasRestantes)} dia${Math.abs(v.diasRestantes) !== 1 ? 's' : ''}</td>
        <td class="col-status"><span class="badge-status ${statusClass}">${statusTexto}</span></td>
      </tr>
    `;
  }).join('');

  // Badge de itens mostrados nesta folha
  const itensMostrando = `${offsetIdx + 1}–${offsetIdx + todosVencimentos.length} / ${totalItensEmpresa}`;

  // Assinaturas só na última folha de cada empresa
  const secaoAssinaturas = isUltimaFolhaEmpresa
    ? epdfSignaturesVencimento(dadosEmpresaCompletos, empresa)
    : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link rel="stylesheet" href="./css/pdf-vencimentos-styles.css">
      <style>
        /* ── Diferenciação Geral ── */
        .header-badge-geral {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .badge-geral-tag {
          font-size: 9px;
          font-weight: 800;
          background: rgba(255,255,255,0.25);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 3px;
          padding: 1px 5px;
          letter-spacing: 1px;
        }

        /* ── Card de continuação ── */
        .continuacao-card {
          padding: 10px 16px !important;
          background: #f8f8f8 !important;
          border-left: 4px solid #B32117 !important;
        }
        .continuacao-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #444;
        }
        .cont-empresa { font-weight: 700; color: #1a1a1a; }
        .cont-sep { color: #aaa; }
        .cont-label { color: #666; font-style: italic; }

        /* ── Assinaturas ── */
        .sig-card { margin-top: 14px; }
        .sig-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          padding: 12px 0 4px;
        }
        .sig-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
        }
        .sig-role {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #B32117;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .sig-line-area {
          width: 80%;
          border-bottom: 1.5px solid #444;
          margin-bottom: 8px;
          height: 32px;
        }
        .sig-name {
          font-size: 11px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .sig-sub {
          font-size: 9.5px;
          color: #555;
        }
        .sig-sub2 {
          font-size: 9px;
          color: #888;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="pdf-page">

        <!-- HEADER -->
        <div class="pdf-header">
          <div class="header-top">
            <div class="logo-section">
              ${typeof getPDFLogoHtml === 'function' ? getPDFLogoHtml('dark') : '<div class="logo-icon"><i class="fas fa-fire-extinguisher"></i></div><div><div class="logo-text">EXTINMAIS</div><div class="logo-sub">PROTEÇÃO E COMBATE AO INCÊNDIO</div></div>'}
            </div>
            ${badgeHTML}
          </div>
          <div class="header-divider"></div>
          <div class="header-info">
            <div class="header-info-item"><i class="far fa-clock"></i><span>${formatarDataHora()}</span></div>
          </div>
        </div>

        <!-- BODY -->
        <div class="pdf-body">

          ${secaoDadosEmpresa}

          <!-- TABELA DE VENCIMENTOS -->
          <div class="section-card">
            <div class="section-title-row">
              <div class="section-title"><i class="fas fa-list-alt"></i> LISTA DE VENCIMENTOS</div>
              <div class="resumo-badge-total">${itensMostrando}</div>
            </div>
            <table class="tabela-vencimentos">
              <thead>
                <tr>
                  <th class="col-num">#</th>
                  <th class="col-nome">ITEM / TIPO</th>
                  <th class="col-func">CATEGORIA</th>
                  <th class="col-cpf">INSPEÇÃO</th>
                  <th class="col-bc">VALIDADE</th>
                  <th class="col-tel">DIAS</th>
                  <th class="col-status">STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${linhasTabela}
              </tbody>
            </table>
          </div>

          <!-- ASSINATURAS (só na última folha desta empresa) -->
          ${secaoAssinaturas}

        </div>

        <!-- FOOTER -->
        <div class="pdf-footer">
          <div class="footer-brand"><i class="fas fa-fire-extinguisher"></i> EXTINMAIS</div>
          <div class="footer-info">${typeof getPDFFooterHtml === 'function' ? getPDFFooterHtml() : ''}</div>
          <div class="footer-timestamp">Documento gerado em ${formatarDataHora()}</div>
        </div>

      </div>
    </body>
    </html>
  `;
}

// ===================================
// FUNÇÃO PARA RENDERIZAR PÁGINA NO PDF
// ===================================
async function renderizarPaginaNoPDF(pdf, htmlString) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlString);
    iframeDoc.close();

    iframe.onload = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));

        const canvas = await html2canvas(iframeDoc.body, {
          scale: 3,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

        document.body.removeChild(iframe);
        resolve();
      } catch (error) {
        document.body.removeChild(iframe);
        reject(error);
      }
    };

    iframe.onerror = (error) => {
      document.body.removeChild(iframe);
      reject(error);
    };
  });
}

// ===================================
// FUNÇÕES AUXILIARES
// ===================================
function formatarData(data) {
  if (!data) return '-';
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

function formatarDataHora() {
  const agora = new Date();
  return `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// ========================================
// PAGINAÇÃO
// ========================================
function atualizarPaginacao(totalItens, inicio, fim, totalPaginas) {
  document.getElementById('showingFrom').textContent = inicio + 1;
  document.getElementById('showingTo').textContent = fim;
  document.getElementById('totalItems').textContent = totalItens;

  const btnFirst = document.getElementById('btnFirst');
  const btnPrev  = document.getElementById('btnPrev');
  const btnNext  = document.getElementById('btnNext');
  const btnLast  = document.getElementById('btnLast');

  if (btnFirst) btnFirst.disabled = paginaAtual === 1;
  if (btnPrev)  btnPrev.disabled  = paginaAtual === 1;
  if (btnNext)  btnNext.disabled  = paginaAtual === totalPaginas;
  if (btnLast)  btnLast.disabled  = paginaAtual === totalPaginas;

  const paginationNumbers = document.getElementById('paginationNumbers');
  if (!paginationNumbers) return;

  paginationNumbers.innerHTML = '';

  let paginasParaMostrar = [];

  if (totalPaginas <= 5) {
    for (let i = 1; i <= totalPaginas; i++) paginasParaMostrar.push(i);
  } else {
    if (paginaAtual <= 3) {
      paginasParaMostrar = [1, 2, 3, '...', totalPaginas];
    } else if (paginaAtual >= totalPaginas - 2) {
      paginasParaMostrar = [1, '...', totalPaginas - 2, totalPaginas - 1, totalPaginas];
    } else {
      paginasParaMostrar = [1, '...', paginaAtual, '...', totalPaginas];
    }
  }

  paginasParaMostrar.forEach(page => {
    if (page === '...') {
      const dots = document.createElement('span');
      dots.className = 'pagination-dots';
      dots.textContent = '...';
      paginationNumbers.appendChild(dots);
    } else {
      const btn = document.createElement('button');
      btn.className = 'pagination-btn' + (page === paginaAtual ? ' active' : '');
      btn.textContent = page;
      btn.onclick = () => goToPage(page);
      paginationNumbers.appendChild(btn);
    }
  });
}

function goToPage(page) {
  paginaAtual = page;
  renderizarAlertas();
  const alertsList = document.getElementById('alertsList');
  if (alertsList) alertsList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function previousPage() {
  if (paginaAtual > 1) goToPage(paginaAtual - 1);
}

function nextPage() {
  const totalPaginas = Math.ceil(alertasFiltrados.length / itensPorPagina);
  if (paginaAtual < totalPaginas) goToPage(paginaAtual + 1);
}

function goToLastPage() {
  const totalPaginas = Math.ceil(alertasFiltrados.length / itensPorPagina);
  goToPage(totalPaginas);
}

function changeItemsPerPage() {
  const select = document.getElementById('itemsPerPage');
  if (select) {
    itensPorPagina = parseInt(select.value);
    paginaAtual = 1;
    renderizarAlertas();
  }
}

// ========================================
// MODAL DE EDIÇÃO
// ========================================
function abrirModalEdicaoItem(inspectionId, campo, empresa, tipo, categoria) {
  criarModalValidade();

  firebase.database().ref(`inspections/${inspectionId}`).once('value').then(snapshot => {
    const inspecao = snapshot.val();
    if (!inspecao) return;

    const dataValidade   = inspecao[campo];
    const diasRestantes  = calcularDiasRestantes(dataValidade);
    const status         = determinarStatus(diasRestantes);

    alertaSelecionado = {
      inspectionId,
      campo,
      empresa,
      tipo,
      validade: dataValidade,
      diasRestantes,
      status,
      categoria
    };

    document.getElementById('modalEmpresa').textContent       = empresa;
    document.getElementById('modalCategoria').textContent     = categoria;
    document.getElementById('modalTipo').textContent          = tipo;
    document.getElementById('modalValidadeAtual').textContent = formatarData(dataValidade);

    const statusDiv = document.getElementById('modalStatus');
    statusDiv.className = 'info-row status-row ' + status;

    const textoStatus = status === 'vencido'
      ? `Vencido há ${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? 'dia' : 'dias'}`
      : `Vence em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`;

    document.getElementById('modalStatusTexto').textContent = textoStatus;
    document.getElementById('inputNovaValidade').value = '';

    const modal = document.getElementById('editValidadeModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  });
}

function fecharModalValidade() {
  const modal = document.getElementById('editValidadeModal');
  if (modal) modal.classList.remove('show');
  alertaSelecionado = null;
  document.body.style.overflow = '';
}

async function salvarNovaValidade() {
  if (!alertaSelecionado) return;

  const novaValidade = document.getElementById('inputNovaValidade').value;
  if (!novaValidade) {
    showToast('Selecione uma data', 'error');
    return;
  }

  try {
    await firebase.database().ref(`inspections/${alertaSelecionado.inspectionId}`).update({
      [alertaSelecionado.campo]: novaValidade
    });
    showToast('Validade atualizada com sucesso!', 'success');
    fecharModalValidade();
    await buscarAlertasVencimento();
  } catch (error) {
    console.error('Erro ao salvar validade:', error);
    showToast('Erro ao salvar alteração', 'error');
  }
}

// ========================================
// INICIALIZAÇÃO
// ========================================
function inicializarAlertas() {
  criarModalValidade();
  buscarAlertasVencimento();
  setInterval(buscarAlertasVencimento, 5 * 60 * 1000);
}

document.addEventListener('click', function (event) {
  const modal = document.getElementById('editValidadeModal');
  if (event.target === modal) fecharModalValidade();
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') fecharModalValidade();
});

if (typeof firebase !== 'undefined' && firebase.database) {
  setTimeout(() => inicializarAlertas(), 1000);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => inicializarAlertas());
  } else {
    inicializarAlertas();
  }
} else {
  setTimeout(() => {
    if (typeof firebase !== 'undefined' && firebase.database) inicializarAlertas();
  }, 2000);
}

function toggleAlertsList() {
  const body = document.getElementById('alertsBody');
  const btn  = document.getElementById('alertsToggleBtn');
  if (body.style.display === 'none' || body.style.display === '') {
    body.style.display = 'block';
    btn.classList.add('open');
  } else {
    body.style.display = 'none';
    btn.classList.remove('open');
  }
}

// versão silenciosa
(function corrigirCepDuplicado() {
  const elementos = document.querySelectorAll('#cep');
  if (elementos.length <= 1) return;
  elementos.forEach((el, index) => {
    if (index === 0) return;
    el.id = `cep-${index + 1}`;
  });
})();

let allCompanies = [];

async function loadClientsForOS() {
  try {
    const companiesSnapshot = await database.ref('companies').once('value');
    const companies = companiesSnapshot.val() || {};
    const buildingsSnapshot = await database.ref('buildings').once('value');
    const buildings = buildingsSnapshot.val() || {};

    allCompanies = [];

    Object.keys(companies).forEach(key => {
      allCompanies.push({ id: key, tipo: 'empresa', ...companies[key] });
    });
    Object.keys(buildings).forEach(key => {
      allCompanies.push({ id: key, tipo: 'predio', ...buildings[key] });
    });

    populateClientSelect();
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
  }
}

function populateClientSelect() {
  const select = document.getElementById('clienteSelect');
  if (!select) { console.error('Select clienteSelect não encontrado!'); return; }

  select.innerHTML = '<option value="">Selecione um cliente</option>';

  allCompanies.forEach(client => {
    const isPredio = client.tipo === 'predio';
    const option   = document.createElement('option');
    option.value   = client.id;

    const nomeCliente = isPredio ? (client.razao_social_predio || 'Sem nome') : (client.razao_social || 'Sem nome');
    const prefixo     = isPredio ? '[PREDIO]' : '[EMPRESA]';
    option.textContent = `${prefixo} ${nomeCliente}`;

    option.dataset.tipo        = client.tipo || 'empresa';
    option.dataset.nome        = nomeCliente;
    option.dataset.cnpj        = isPredio ? (client.cnpj_predio || '') : (client.cnpj || '');
    option.dataset.cep         = isPredio ? (client.cep_predio || '') : (client.cep || '');
    option.dataset.endereco    = isPredio ? (client.endereco_predio || '') : (client.endereco || '');
    option.dataset.telefone    = isPredio ? (client.telefone_predio || '') : (client.telefone || '');
    option.dataset.email       = isPredio ? (client.email_predio || '') : (client.email || '');
    option.dataset.responsavel = isPredio ? (client.responsavel_predio || '') : (client.responsavel || '');
    option.dataset.numeroPredio   = isPredio ? (client.numero_predio || '') : '';
    option.dataset.numeroEmpresa  = !isPredio ? (client.numero_empresa || '') : '';

    select.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const clienteSelect = document.getElementById('clienteSelect');
  if (!clienteSelect) return;

  clienteSelect.addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    const camposEmpresa  = document.getElementById('camposEmpresa');
    const camposPredio   = document.getElementById('camposPredio');

    if (camposEmpresa) camposEmpresa.style.display = 'none';
    if (camposPredio)  camposPredio.style.display  = 'none';

    if (selectedOption.value) {
      const tipo = selectedOption.dataset.tipo;

      document.getElementById('cnpjInput').value          = selectedOption.dataset.cnpj || '';
      document.getElementById('clienteNomeHidden').value  = selectedOption.dataset.nome || '';
      document.getElementById('clienteTipoHidden').value  = tipo || 'empresa';

      if (tipo === 'predio') {
        if (camposPredio) {
          camposPredio.style.display = 'block';
          document.getElementById('telefonePredioInput').value   = selectedOption.dataset.telefone || '';
          document.getElementById('emailPredioInput').value      = selectedOption.dataset.email || '';
          document.getElementById('responsavelPredioInput').value= selectedOption.dataset.responsavel || '';
          document.getElementById('cepPredioInput').value        = selectedOption.dataset.cep || '';
          document.getElementById('enderecoPredioInput').value   = selectedOption.dataset.endereco || '';
          document.getElementById('numeroPredioInput').value     = selectedOption.dataset.numeroPredio || '';
        }
      } else {
        if (camposEmpresa) {
          camposEmpresa.style.display = 'block';
          document.getElementById('telefoneEmpresaInput').value   = selectedOption.dataset.telefone || '';
          document.getElementById('emailEmpresaInput').value      = selectedOption.dataset.email || '';
          document.getElementById('responsavelEmpresaInput').value= selectedOption.dataset.responsavel || '';
          document.getElementById('cepEmpresaInput').value        = selectedOption.dataset.cep || '';
          document.getElementById('enderecoEmpresaInput').value   = selectedOption.dataset.endereco || '';
          document.getElementById('numeroEmpresaInput').value     = selectedOption.dataset.numeroEmpresa || '';
        }
      }
    } else {
      document.getElementById('cnpjInput').value         = '';
      document.getElementById('clienteNomeHidden').value = '';
      document.getElementById('clienteTipoHidden').value = '';
    }
  });
});

function switchSubTab(tabName) {
  document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  if (tabName === 'empresa') document.getElementById('empresaContent').classList.add('active');
  else if (tabName === 'predio') document.getElementById('predioContent').classList.add('active');
}

const subTabStyles = `
  .sub-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #D4C29A; }
  .sub-tab { padding: 10px 20px; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #888; border-bottom: 3px solid transparent; transition: all 0.3s ease; }
  .sub-tab:hover { color: #D4C29A; }
  .sub-tab.active { color: #D4C29A; border-bottom-color: #B32117; }
  .sub-tab-content { display: none; }
  .sub-tab-content.active { display: block; }
`;

if (!document.getElementById('subTabStyles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'subTabStyles';
  styleSheet.textContent = subTabStyles;
  document.head.appendChild(styleSheet);
}

