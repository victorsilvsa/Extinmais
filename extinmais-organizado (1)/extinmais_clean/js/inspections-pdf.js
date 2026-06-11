
// ============================================
// SISTEMA DE GERAÇÃO DE PDF - EXTINMAIS
// ============================================

// ============================================
// UTILITÁRIOS
// ============================================

function bool(val) {
  return val === true || val === 'true' || val === 'Sim' || val === 1 || val === '1';
}

function check(val) {
  return bool(val)
    ? '<span style="color:#10b981;font-weight:900;font-size:14px;line-height:1;">✓</span>'
    : '<span style="color:#ef4444;font-weight:900;font-size:14px;line-height:1;">✗</span>';
}

function dash(val) {
  return (val !== undefined && val !== null && val !== '') ? val : '—';
}

function fmtDate(val) {
  if (!val) return '—';
  try { return new Date(val).toLocaleDateString('pt-BR'); } catch (e) { return val; }
}

function fmtM(val) {
  return val ? val + ' m' : '—';
}

// ============================================
// INJEÇÃO DE ESTILOS
// ============================================

function injectPDFStyles() {
  if (document.getElementById('extinmais-pdf-styles')) return;
  const style = document.createElement('style');
  style.id = 'extinmais-pdf-styles';
  style.textContent = `
    /* ===== RESET DO PDF ===== */
    #pdfPreview {
      background: #e8e8e8 !important;
      padding: 20px !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      overflow-x: auto !important;
    }

    /* PÁGINA A4 */
    .extinpdf-page {
      background: #ffffff;
      width: 794px;
      min-height: 1123px;
      margin: 0 auto 24px auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      color: #1f2937;
      position: relative;
      overflow: hidden;
      page-break-after: always;
    }

    /* Faixa vermelha do topo */
    .extinpdf-page::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, #991b1b, #dc2626, #ef4444);
    }

    /* ===== HEADER ===== */
    .epdf-header {
      background: linear-gradient(135deg, #991b1b 0%, #b91c1c 45%, #dc2626 100%);
      padding: 16px 24px 14px;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      margin-top: 4px;
    }
    .epdf-header::after {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 160px; height: 160px;
      background: rgba(255,255,255,0.06);
      border-radius: 50%;
    }
    .epdf-header-row1 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .epdf-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .epdf-brand-icon {
      width: 38px; height: 38px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px;
    }
    .epdf-brand-name {
      color: white; font-size: 20px; font-weight: 900;
      letter-spacing: -0.5px; line-height: 1;
    }
    .epdf-brand-sub {
      color: rgba(255,255,255,0.7); font-size: 7.5px;
      text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;
    }
    .epdf-report-badge {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 6px;
      padding: 5px 12px;
      color: white; font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.8px;
    }
    .epdf-header-divider {
      height: 1px;
      background: rgba(255,255,255,0.2);
      margin: 10px 0;
    }
    .epdf-header-row2 {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .epdf-contacts {
      display: flex; gap: 18px;
    }
    .epdf-contact {
      display: flex; align-items: center; gap: 5px;
      color: rgba(255,255,255,0.85); font-size: 8px; font-weight: 500;
    }
    .epdf-contact i { font-size: 9px; }
    .epdf-datetime {
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
      padding: 4px 9px;
      color: rgba(255,255,255,0.8);
      font-size: 8px; font-weight: 500;
      display: flex; align-items: center; gap: 5px;
    }

    /* ===== BODY ===== */
    .epdf-body {
      flex: 1;
      padding: 16px 20px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-sizing: border-box;
      width: 100%;
    }

    /* ===== SECTION CARD ===== */
    .epdf-card {
      background: white;
      border: 1.5px solid #e5e7eb;
      border-radius: 7px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      width: 100%;
      box-sizing: border-box;
    }
    .epdf-card-title {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px;
      font-size: 9.5px; font-weight: 800;
      color: white;
      text-transform: uppercase; letter-spacing: 0.7px;
    }
    .epdf-card-title i { font-size: 12px; }
    .epdf-card-title .epdf-badge {
      margin-left: auto;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 7.5px; font-weight: 700;
    }
    .epdf-ct-red    { background: linear-gradient(135deg,#991b1b,#dc2626); border-bottom: 2px solid #7f1d1d; }
    .epdf-ct-gray   { background: linear-gradient(135deg,#1f2937,#374151); border-bottom: 2px solid #111827; }
    .epdf-ct-blue   { background: linear-gradient(135deg,#1e3a8a,#2563eb); border-bottom: 2px solid #1e3a8a; }
    .epdf-ct-green  { background: linear-gradient(135deg,#064e3b,#047857); border-bottom: 2px solid #022c22; }
    .epdf-ct-orange { background: linear-gradient(135deg,#78350f,#d97706); border-bottom: 2px solid #451a03; }

    /* ===== GRID DE CAMPOS ===== */
    .epdf-grid { display: grid; }
    .epdf-g2 { grid-template-columns: 1fr 1fr; }
    .epdf-g3 { grid-template-columns: 1fr 1fr 1fr; }
    .epdf-g4 { grid-template-columns: 1fr 1fr 1fr 1fr; }

    .epdf-col { display: flex; flex-direction: column; }
    .epdf-col + .epdf-col { border-left: 1px solid #f0f0f0; }

    .epdf-field {
      padding: 6px 12px;
      border-bottom: 1px solid #f5f5f5;
    }
    .epdf-field:last-child { border-bottom: none; }
    .epdf-flabel {
      font-size: 7px; font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 2px;
      display: flex; align-items: center; gap: 3px;
    }
    .epdf-flabel i { font-size: 8px; color: #d1d5db; }
    .epdf-fvalue {
      font-size: 9.5px; font-weight: 600; color: #111827; line-height: 1.3;
    }
    .epdf-fvalue.big { font-size: 12px; font-weight: 700; }

    /* ===== STAT BOXES ===== */
    .epdf-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      padding: 8px 12px;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
    }
    .epdf-stat {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 5px;
      padding: 7px 8px;
      text-align: center;
    }
    .epdf-stat-val {
      font-size: 16px; font-weight: 900;
      color: #111827; line-height: 1; margin-bottom: 3px;
    }
    .epdf-stat-lbl {
      font-size: 7px; font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.3px;
    }

    /* ===== EXTINTOR CARD ===== */
    .epdf-ext-header {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 12px;
      background: #f9fafb;
      border-bottom: 1.5px solid #e5e7eb;
    }
    .epdf-ext-num {
      width: 24px; height: 24px;
      background: linear-gradient(135deg,#374151,#4b5563);
      border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 9px; font-weight: 800;
      flex-shrink: 0;
    }
    .epdf-ext-tipo {
      font-size: 9px; font-weight: 800; color: #1f2937;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .epdf-ext-sub {
      font-size: 7.5px; color: #6b7280; margin-top: 1px;
    }
    .epdf-ext-badges {
      margin-left: auto; display: flex; gap: 4px; flex-shrink: 0;
    }
    .epdf-pill-ok {
      display: inline-flex; align-items: center; gap: 3px;
      background: #dcfce7; color: #166534;
      border-radius: 4px; padding: 2px 6px;
      font-size: 7.5px; font-weight: 700;
    }
    .epdf-pill-fail {
      display: inline-flex; align-items: center; gap: 3px;
      background: #fee2e2; color: #991b1b;
      border-radius: 4px; padding: 2px 6px;
      font-size: 7.5px; font-weight: 700;
    }

    /* ===== CERT BADGE ===== */
    .epdf-cert-avcb { background:#dbeafe; color:#1e40af; border-radius:3px; padding:1px 6px; font-size:8px; font-weight:700; }
    .epdf-cert-clcb { background:#d1fae5; color:#065f46; border-radius:3px; padding:1px 6px; font-size:8px; font-weight:700; }

    /* ===== OBSERVAÇÕES ===== */
    .epdf-obs {
      background: #fffbeb;
      border: 1.5px solid #fcd34d;
      border-radius: 6px;
      overflow: hidden;
    }
    .epdf-obs-hd {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 12px;
      background: #fef3c7;
      border-bottom: 1px solid #fde68a;
      font-size: 8px; font-weight: 800;
      color: #92400e;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .epdf-obs-body {
      padding: 7px 12px;
      font-size: 8.5px; color: #78350f;
      line-height: 1.5; white-space: pre-wrap; word-break: break-word;
    }

    /* ===== ASSINATURAS ===== */
    .epdf-sigs {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0;
      padding: 20px 24px 18px;
    }
    .epdf-sig { text-align: center; padding: 0 20px; }
    .epdf-sig + .epdf-sig { border-left: 1.5px solid #e5e7eb; }
    .epdf-sig-role {
      font-size: 7.5px; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .epdf-sig-line {
      border-top: 2px solid #374151;
      padding-top: 7px; margin-top: 42px;
    }
    .epdf-sig-name  { font-size: 10px; font-weight: 700; color: #111827; margin-bottom: 3px; }
    .epdf-sig-sub   { font-size: 7.5px; color: #6b7280; margin-bottom: 1px; }
    .epdf-sig-sub2  { font-size: 7px; color: #9ca3af; }

    /* ===== FOOTER ===== */
    .epdf-footer {
      background: linear-gradient(90deg,#111827,#1f2937);
      padding: 9px 20px;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
      margin-top: auto;
    }
    .epdf-footer-left {
      display: flex; align-items: center; gap: 10px;
    }
    .epdf-footer-brand {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 800; color: white; letter-spacing: -0.3px;
    }
    .epdf-footer-brand i { color: #f87171; font-size: 13px; }
    .epdf-footer-sep { width: 1px; height: 22px; background: rgba(255,255,255,0.2); }
    .epdf-footer-info { font-size: 7.5px; color: #9ca3af; line-height: 1.5; }
    .epdf-footer-right { font-size: 7.5px; color: #6b7280; text-align: right; line-height: 1.6; }

    /* ===== CONFORMIDADE ===== */
    .epdf-conf-ok   { font-size: 8px; font-weight: 700; color: #059669; }
    .epdf-conf-fail { font-size: 8px; font-weight: 700; color: #dc2626; }

    /* ===== PRINT ===== */
    @media print {
      @page { size: A4; margin: 0; }
      body { margin: 0; padding: 0; background: white; }
      #pdfPreview { padding: 0 !important; background: white !important; }
      .extinpdf-page {
        box-shadow: none;
        margin: 0;
        page-break-after: always;
      }
      .extinpdf-page:last-child { page-break-after: auto; }
    }

    @media (max-width: 860px) {
      .extinpdf-page {
        width: 100%;
        min-height: auto;
      }
      .epdf-g4 { grid-template-columns: 1fr 1fr; }
      .epdf-g3 { grid-template-columns: 1fr 1fr; }
      .epdf-stats { grid-template-columns: repeat(2, 1fr); }
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// BLOCOS HTML
// ============================================

function epdfHeader(title) {
  const now = new Date();
  return `
    <div class="epdf-header">
      <div class="epdf-header-row1">
        <div class="epdf-brand">
          ${typeof getPDFLogoHtml === 'function' ? getPDFLogoHtml('dark') : `<div class="epdf-brand-icon"><i class="fas fa-fire-extinguisher"></i></div><div><div class="epdf-brand-name">EXTINMAIS</div><div class="epdf-brand-sub">Proteção e Combate a Incêndio</div></div>`}
        </div>
        <div class="epdf-report-badge"><i class="fas fa-file-alt" style="margin-right:5px;"></i>${title}</div>
      </div>
      <div class="epdf-header-divider"></div>
      <div class="epdf-header-row2">
        <div class="epdf-datetime"><i class="far fa-clock"></i> ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}</div>
      </div>
    </div>
  `;
}

function epdfFooter(page, total) {
  const now = new Date();
  return `
    <div class="epdf-footer">
      <div class="epdf-footer-left">
        <div class="epdf-footer-brand"><i class="fas fa-fire-extinguisher"></i> EXTINMAIS</div>
        <div class="epdf-footer-sep"></div>
        <div class="epdf-footer-info">
          ${typeof getPDFFooterHtml === 'function' ? getPDFFooterHtml() : ''}
        </div>
      </div>
      <div class="epdf-footer-right">
        ${page && total ? `Página ${page} de ${total}<br>` : ''}
        ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}
      </div>
    </div>
  `;
}

function epdfClient(data) {
  const isPredio = data.tipo === 'predio' || !!data.razao_social_predio;
  const razao = isPredio ? (data.razao_social_predio || data.razao_social || '—') : (data.razao_social || '—');
  const cnpj = isPredio ? (data.cnpj_predio || data.cnpj || '—') : (data.cnpj || '—');
  const tel = isPredio ? (data.telefone_predio || data.telefone || '—') : (data.telefone || '—');
  const cep = isPredio ? (data.cep_predio || data.cep || '—') : (data.cep || '—');
  const end = isPredio ? (data.endereco_predio || data.endereco || '—') : (data.endereco || '—');
  const resp = isPredio ? (data.responsavel_predio || data.responsavel || '—') : (data.responsavel || '—');
  const num = isPredio ? (data.numero_predio || '') : (data.numero_empresa || '');
  const icone = isPredio ? 'fa-building' : 'fa-briefcase';
  const labelR = isPredio ? 'Nome do Prédio' : 'Razão Social';
  const labelN = isPredio ? 'Nº Prédio' : 'Nº Empresa';

  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-red">
        <i class="fas ${icone}"></i> Dados do Cliente
        ${isPredio ? '<span class="epdf-badge">PRÉDIO</span>' : ''}
      </div>
      <div class="epdf-grid epdf-g4">
        <div class="epdf-col">
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-tag"></i>${labelR}</div>
            <div class="epdf-fvalue big">${razao}</div>
          </div>
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-id-card"></i>CNPJ / CPF</div>
            <div class="epdf-fvalue">${cnpj}</div>
          </div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-phone"></i>Telefone</div>
            <div class="epdf-fvalue">${tel}</div>
          </div>
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-user-tie"></i>Responsável</div>
            <div class="epdf-fvalue">${resp}</div>
          </div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-map-pin"></i>CEP</div>
            <div class="epdf-fvalue">${cep}</div>
          </div>
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-map-marker-alt"></i>Endereço</div>
            <div class="epdf-fvalue">${end}</div>
          </div>
        </div>
        <div class="epdf-col">
          ${num ? `<div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-hashtag"></i>${labelN}</div><div class="epdf-fvalue">${num}</div></div>` : ''}
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-calendar-check"></i>Data da Inspeção</div>
            <div class="epdf-fvalue">${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
          ${data.numero_projeto ? `<div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-drafting-compass"></i>Nº Projeto</div><div class="epdf-fvalue">${data.numero_projeto}</div></div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function epdfCertificate(data) {
  if (!data.cert_tipo) return '';
  const tipo = data.cert_tipo || '';
  const cls = tipo.includes('AVCB') ? 'epdf-cert-avcb' : 'epdf-cert-clcb';

  let diasHtml = '';
  if (data.cert_validade) {
    const diff = Math.ceil((new Date(data.cert_validade) - new Date()) / 86400000);
    if (diff < 0) diasHtml = `<span style="color:#dc2626;font-weight:700;font-size:8px;">⚠ VENCIDO há ${Math.abs(diff)} dias</span>`;
    else if (diff <= 60) diasHtml = `<span style="color:#d97706;font-weight:700;font-size:8px;">⚠ Vence em ${diff} dias</span>`;
    else diasHtml = `<span style="color:#059669;font-weight:700;font-size:8px;">✓ Válido — ${diff} dias restantes</span>`;
  }

  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-blue">
        <i class="fas fa-certificate"></i> Certificado AVCB / CLCB
        <span class="epdf-badge">${tipo}</span>
      </div>
      <div class="epdf-grid epdf-g4">
        <div class="epdf-col">
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-certificate"></i>Tipo</div>
            <div class="epdf-fvalue"><span class="${cls}">${dash(tipo)}</span></div>
          </div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-hashtag"></i>Número</div>
            <div class="epdf-fvalue">${dash(data.cert_numero)}</div>
          </div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-calendar-plus"></i>Início Validade</div>
            <div class="epdf-fvalue">${fmtDate(data.cert_inicio_validade)}</div>
          </div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field">
            <div class="epdf-flabel"><i class="fas fa-calendar-times"></i>Vencimento</div>
            <div class="epdf-fvalue">${fmtDate(data.cert_validade)}</div>
          </div>
          ${diasHtml ? `<div class="epdf-field"><div class="epdf-fvalue">${diasHtml}</div></div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function epdfBombas(data) {
  const temJockey = bool(data.has_bomba_jockey);
  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-red">
        <i class="fas fa-water"></i> Sistema de Bombas
        ${temJockey ? '<span class="epdf-badge">+ JOCKEY</span>' : ''}
      </div>
      <div class="epdf-stats">
        <div class="epdf-stat">
          <div class="epdf-stat-val" style="font-size:13px;">${dash(data.reservatorio_tamanho)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-tint" style="color:#3b82f6;"></i> Reserv. (L)</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val" style="font-size:13px;">${dash(data.bomba_principal_potencia)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-bolt" style="color:#f59e0b;"></i> Potência</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val">${check(data.bomba_principal_teste)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-play" style="color:#10b981;"></i> Teste Partida</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val" style="font-size:11px;">${dash(data.bomba_principal_estado)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-heartbeat" style="color:#ef4444;"></i> Estado Geral</div>
        </div>
      </div>
      <div class="epdf-grid ${temJockey ? 'epdf-g3' : 'epdf-g2'}">
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-tag"></i>Marca / Modelo</div><div class="epdf-fvalue">${dash(data.bomba_principal_marca || data.bomba_marca)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-plug"></i>Tipo Acionamento</div><div class="epdf-fvalue">${dash(data.bomba_principal_acionamento || data.bomba_acionamento)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-tint-slash"></i>Sem Vazamento</div><div class="epdf-fvalue">${check(data.bomba_sem_vazamento)}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-tachometer-alt"></i>Pressão de Trabalho</div><div class="epdf-fvalue">${dash(data.bomba_pressao)}${data.bomba_pressao ? ' bar' : ''}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-volume-mute"></i>Sem Ruídos Anormais</div><div class="epdf-fvalue">${check(data.bomba_sem_ruidos)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-check-double"></i>Conexões Apertadas</div><div class="epdf-fvalue">${check(data.bomba_conexoes)}</div></div>
        </div>
        ${temJockey ? `
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-bolt"></i>Potência Jockey</div><div class="epdf-fvalue">${dash(data.jockey_potencia)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-play-circle"></i>Partida Automática</div><div class="epdf-fvalue">${check(data.jockey_partida)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-gauge-high"></i>Pressostato OK</div><div class="epdf-fvalue">${check(data.jockey_pressostato)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-volume-mute"></i>Sem Ruídos (Jockey)</div><div class="epdf-fvalue">${check(data.jockey_ruidos)}</div></div>
        </div>` : ''}
      </div>
    </div>
  `;
}

function epdfHidrantes(data) {
  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-red">
        <i class="fas fa-truck-droplet"></i> Rede de Hidrantes
        <span class="epdf-badge">${dash(data.hidrantes_quantidade)} PONTOS</span>
      </div>
      <div class="epdf-stats">
        <div class="epdf-stat">
          <div class="epdf-stat-val" style="font-size:12px;">${dash(data.hidrantes_diametro)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-circle-notch" style="color:#3b82f6;"></i> Ø Tubulação</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val">${check(data.hidrantes_suportes)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-thumbtack" style="color:#8b5cf6;"></i> Suportes</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val">${check(data.hidrantes_vazamentos)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-tint-slash" style="color:#10b981;"></i> Sem Vazamentos</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val">${check(data.hidrantes_identificacao)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-tag" style="color:#f59e0b;"></i> Identificados</div>
        </div>
      </div>
      <div class="epdf-grid epdf-g3">
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-circle-notch"></i>Adaptador Storz</div><div class="epdf-fvalue">${dash(data.adaptador_storz)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-cubes"></i>Material Adaptador</div><div class="epdf-fvalue">${dash(data.adaptador_material)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-key"></i>Chave Storz</div><div class="epdf-fvalue">${dash(data.chave_storz)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-cubes"></i>Material Chave</div><div class="epdf-fvalue">${dash(data.chave_material)}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-spray-can"></i>Tipo Esguicho</div><div class="epdf-fvalue">${dash(data.esguicho_tipo)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-cubes"></i>Material Esguicho</div><div class="epdf-fvalue">${dash(data.esguicho_material)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-ruler"></i>Comprimento Mangueira</div><div class="epdf-fvalue">${fmtM(data.mangueira_comprimento)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-circle-notch"></i>Ø Mangueira</div><div class="epdf-fvalue">${dash(data.mangueira_diametro)}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-tag"></i>Tipo Mangueira</div><div class="epdf-fvalue">${dash(data.mangueira_tipo)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-calendar-plus"></i>Fab. Mangueira</div><div class="epdf-fvalue">${fmtDate(data.mangueira_data_fabricacao)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-calendar-times"></i>Venc. Mangueira</div><div class="epdf-fvalue">${fmtDate(data.mangueira_data_vencimento)}</div></div>
          ${data.hidrante_rr_possui === 'Sim' ? `
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-fire-hydrant"></i>Hidrante Urbano (RR)</div><div class="epdf-fvalue">${dash(data.hidrante_rr_adaptador)} · ${dash(data.hidrante_rr_medida)}</div></div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function epdfAlarme(data) {
  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-red">
        <i class="fas fa-bell"></i> Sistema de Alarme de Incêndio
        <span class="epdf-badge">${dash(data.alarme_pontos)} PONTOS</span>
      </div>
      <div class="epdf-stats">
        <div class="epdf-stat">
          <div class="epdf-stat-val">${check(data.central_liga)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-power-off" style="color:#10b981;"></i> Central Liga</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val">${check(data.central_sem_falhas)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-shield-alt" style="color:#3b82f6;"></i> Sem Falhas</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val">${check(data.central_baterias_testadas)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-battery-full" style="color:#f59e0b;"></i> Baterias OK</div>
        </div>
        <div class="epdf-stat">
          <div class="epdf-stat-val" style="font-size:14px;">${dash(data.detectores_quantidade)}</div>
          <div class="epdf-stat-lbl"><i class="fas fa-circle-dot" style="color:#8b5cf6;"></i> Detectores</div>
        </div>
      </div>
      <div class="epdf-grid epdf-g3">
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-microchip"></i>Tipo Central</div><div class="epdf-fvalue">${dash(data.alarme_central_tipo)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-tag"></i>Marca Central</div><div class="epdf-fvalue">${dash(data.alarme_central_marca || data.alarme_marca)}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-bell"></i>Qtd Sirenes / Avisadores</div><div class="epdf-fvalue">${dash(data.alarme_sirenes || data.qtd_sirenes)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-hand-pointer"></i>Acionadores Manuais</div><div class="epdf-fvalue">${dash(data.alarme_acionadores || data.qtd_acionadores)}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-check-circle"></i>Acionadores Funcionando</div><div class="epdf-fvalue">${check(data.acionadores_funcionando)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-circle-nodes"></i>Laços / Zonas</div><div class="epdf-fvalue">${dash(data.alarme_lacos || data.qtd_lacos)}</div></div>
        </div>
      </div>
    </div>
  `;
}

function epdfExtintorCard(ext, num, totalCols) {
  const lacresOk = bool(ext.lacres);
  const manomOk = bool(ext.manometro);
  const fixacaoOk = bool(ext.fixacao);

  let vencColor = '#111827', vencExtra = '';
  if (ext.validade) {
    const diff = Math.ceil((new Date(ext.validade) - new Date()) / 86400000);
    if (diff < 0) { vencColor = '#dc2626'; vencExtra = ` <span style="font-size:7px;color:#dc2626;">(VENCIDO)</span>`; }
    else if (diff <= 30) { vencColor = '#d97706'; vencExtra = ` <span style="font-size:7px;color:#d97706;">(${diff}d)</span>`; }
  }

  const borderR = (totalCols > 1) ? 'border-right:2px solid #e5e7eb;' : '';

  return `
    <div style="${borderR}">
      <div class="epdf-ext-header">
        <div class="epdf-ext-num">${num}</div>
        <div>
          <div class="epdf-ext-tipo">${dash(ext.tipo)}</div>
          <div class="epdf-ext-sub">${dash(ext.peso)} &nbsp;·&nbsp; Qtd: ${dash(ext.quantidade)}</div>
        </div>
        <div class="epdf-ext-badges">
          ${lacresOk ? '<span class="epdf-pill-ok"><i class="fas fa-lock"></i>Lacres</span>' : '<span class="epdf-pill-fail"><i class="fas fa-lock-open"></i>Lacres</span>'}
          ${manomOk ? '<span class="epdf-pill-ok"><i class="fas fa-tachometer-alt"></i>Manôm.</span>' : '<span class="epdf-pill-fail"><i class="fas fa-tachometer-alt"></i>Manôm.</span>'}
          ${fixacaoOk ? '<span class="epdf-pill-ok"><i class="fas fa-thumbtack"></i>Fixação</span>' : '<span class="epdf-pill-fail"><i class="fas fa-thumbtack"></i>Fixação</span>'}
        </div>
      </div>
      <div class="epdf-grid epdf-g2">
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-calendar-times"></i>Validade</div><div class="epdf-fvalue" style="color:${vencColor};">${fmtDate(ext.validade)}${vencExtra}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-weight-hanging"></i>Peso / Carga</div><div class="epdf-fvalue">${dash(ext.peso)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-hashtag"></i>Quantidade</div><div class="epdf-fvalue">${dash(ext.quantidade)}</div></div>
        </div>
        <div class="epdf-col">
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-lock"></i>Lacres Intactos</div><div class="epdf-fvalue">${check(ext.lacres)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-tachometer-alt"></i>Manômetro OK</div><div class="epdf-fvalue">${check(ext.manometro)}</div></div>
          <div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-thumbtack"></i>Fixação Adequada</div><div class="epdf-fvalue">${check(ext.fixacao)}</div></div>
        </div>
      </div>
    </div>
  `;
}

function epdfSinalizacao(data) {
  const campos = [];
  campos.push({ label: 'Placas Fotoluminescentes', value: check(data.placas_fotoluminescentes), icon: 'fa-sun' });

  const rotaFuga = [
    { key: 'sinal_saida', label: 'Saída', icon: 'fa-door-open' },
    { key: 'sinal_cam_direita', label: 'Caminhamento →', icon: 'fa-arrow-right' },
    { key: 'sinal_cam_esquerda', label: 'Caminhamento ←', icon: 'fa-arrow-left' },
    { key: 'sinal_esc_up_direita', label: 'Escada ↑ Direita', icon: 'fa-arrow-up' },
    { key: 'sinal_esc_up_esquerda', label: 'Escada ↑ Esquerda', icon: 'fa-arrow-up' },
    { key: 'sinal_esc_down_direita', label: 'Escada ↓ Direita', icon: 'fa-arrow-down' },
    { key: 'sinal_esc_down_esquerda', label: 'Escada ↓ Esquerda', icon: 'fa-arrow-down' },
  ];
  rotaFuga.forEach(c => { if (data[c.key] && parseInt(data[c.key]) > 0) campos.push({ label: c.label, value: data[c.key], icon: c.icon }); });

  const equip = [
    { key: 'sinal_hidrante', label: 'Hidrante', icon: 'fa-fire-hydrant' },
    { key: 'sinal_acion_bomba', label: 'Acionamento de Bomba', icon: 'fa-water' },
    { key: 'sinal_acion_alarme', label: 'Acionamento de Alarme', icon: 'fa-bell' },
    { key: 'sinal_central_alarme', label: 'Central de Alarme', icon: 'fa-microchip' },
    { key: 'sinal_bomba_incendio', label: 'Bomba de Incêndio', icon: 'fa-pump-soap' },
    { key: 'placa_extintor', label: 'Extintor', icon: 'fa-fire-extinguisher' },
    { key: 'placa_ilum_emerg', label: 'Iluminação Emergência', icon: 'fa-lightbulb' },
    { key: 'placa_sinal_emerg', label: 'Sinalização Emergência', icon: 'fa-triangle-exclamation' },
    { key: 'placa_alarme', label: 'Alarme de Incêndio', icon: 'fa-bell' },
    { key: 'placa_lotacao', label: 'Placa Lotação', icon: 'fa-users' },
    { key: 'placa_m1', label: 'Placa M1', icon: 'fa-sign' },
    { key: 'placa_hidrante_espec', label: 'Hidrante (Placa)', icon: 'fa-sign' },
  ];
  equip.forEach(c => { if (data[c.key] && parseInt(data[c.key]) > 0) campos.push({ label: c.label, value: data[c.key], icon: c.icon }); });

  try {
    const lista = JSON.parse(data.sinalizacoes || '[]');
    lista.forEach(item => campos.push({ label: item.nome, value: item.qtd, icon: 'fa-sign' }));
  } catch (e) { }

  let total = 0;
  campos.forEach(c => { const n = parseInt(c.value); if (!isNaN(n)) total += n; });

  const c1 = campos.filter((_, i) => i % 2 === 0);
  const c2 = campos.filter((_, i) => i % 2 === 1);

  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-red">
        <i class="fas fa-sign"></i> Sinalização de Emergência
        ${total > 0 ? `<span class="epdf-badge">${total} PLACAS</span>` : ''}
      </div>
      <div class="epdf-grid epdf-g2">
        <div class="epdf-col">
          ${c1.map(c => `<div class="epdf-field"><div class="epdf-flabel"><i class="fas ${c.icon}"></i>${c.label}</div><div class="epdf-fvalue">${c.value}</div></div>`).join('')}
        </div>
        <div class="epdf-col">
          ${c2.map(c => `<div class="epdf-field"><div class="epdf-flabel"><i class="fas ${c.icon}"></i>${c.label}</div><div class="epdf-fvalue">${c.value}</div></div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function epdfConformidade(data) {
  const items = [
    { label: 'Rotas de Fuga Desobstruídas', val: data.conf_rotas_desobstruidas, icon: 'fa-route' },
    { label: 'Equipamentos Acessíveis', val: data.conf_equipamentos_acessiveis, icon: 'fa-hands-helping' },
    { label: 'Limpeza e Organização', val: data.conf_limpeza, icon: 'fa-broom' },
    { label: 'Conforme Projeto Aprovado', val: data.conf_projeto_aprovado, icon: 'fa-drafting-compass' },
    { label: 'Iluminação de Emergência OK', val: data.conf_iluminacao_emergencia, icon: 'fa-lightbulb' },
    { label: 'Saídas de Emergência Sinalizadas', val: data.conf_saidas_sinalizadas, icon: 'fa-door-open' },
  ].filter(c => c.val !== undefined && c.val !== null && c.val !== '');

  const okCount = items.filter(c => bool(c.val)).length;
  const failCount = items.length - okCount;
  const c1 = items.filter((_, i) => i % 2 === 0);
  const c2 = items.filter((_, i) => i % 2 === 1);

  return `
    <div class="epdf-card">
      <div class="epdf-card-title epdf-ct-green">
        <i class="fas fa-clipboard-check"></i> Conformidade Geral
        ${okCount > 0 ? `<span class="epdf-badge" style="background:rgba(16,185,129,0.25);">✓ ${okCount} OK</span>` : ''}
        ${failCount > 0 ? `<span class="epdf-badge" style="background:rgba(239,68,68,0.25);">✗ ${failCount} NOK</span>` : ''}
      </div>
      <div class="epdf-grid epdf-g2">
        <div class="epdf-col">
          ${c1.map(c => `<div class="epdf-field"><div class="epdf-flabel"><i class="fas ${c.icon}"></i>${c.label}</div><div class="epdf-fvalue">${check(c.val)}</div></div>`).join('')}
          ${data.numero_projeto ? `<div class="epdf-field"><div class="epdf-flabel"><i class="fas fa-hashtag"></i>Nº do Projeto</div><div class="epdf-fvalue">${data.numero_projeto}</div></div>` : ''}
        </div>
        <div class="epdf-col">
          ${c2.map(c => `<div class="epdf-field"><div class="epdf-flabel"><i class="fas ${c.icon}"></i>${c.label}</div><div class="epdf-fvalue">${check(c.val)}</div></div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function epdfObs(titulo, texto, icon) {
  if (!texto || !texto.trim()) return '';
  return `
    <div class="epdf-obs">
      <div class="epdf-obs-hd"><i class="fas ${icon || 'fa-sticky-note'}"></i> Obs. — ${titulo}</div>
      <div class="epdf-obs-body">${texto.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
  `;
}

function epdfSignatures(data) {
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
            <div class="epdf-sig-name">${data.responsavel || 'Responsável'}</div>
            <div class="epdf-sig-sub">${data.razao_social || data.razao_social_predio || '—'}</div>
            <div class="epdf-sig-sub2">${data.endereco || data.endereco_predio || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// COLETA DE EXTINTORES
// ============================================
function getAllExtintores(data) {
  const list = [];
  Object.keys(data).forEach(key => {
    const m = key.match(/^extintores_tipo_(\d+)$/);
    if (!m) return;
    const i = m[1];
    list.push({
      index: parseInt(i),
      tipo: data[`extintores_tipo_${i}`],
      quantidade: data[`extintores_quantidade_${i}`] ?? data.extintores_quantidade,
      peso: data[`extintores_peso_${i}`] ?? data.extintores_peso,
      validade: data[`extintores_validade_${i}`] ?? data.extintores_validade,
      lacres: data[`extintores_lacres_${i}`],
      manometro: data[`extintores_manometro_${i}`],
      fixacao: data[`extintores_fixacao_${i}`]
    });
  });
  list.sort((a, b) => a.index - b.index);
  if (list.length === 0 && data.extintores_tipo) {
    list.push({
      index: 0, tipo: data.extintores_tipo,
      quantidade: data.extintores_quantidade, peso: data.extintores_peso,
      validade: data.extintores_validade, lacres: data.extintores_lacres,
      manometro: data.extintores_manometro, fixacao: data.extintores_fixacao
    });
  }
  return list;
}

// ============================================
// MONTADOR DE PÁGINAS INTELIGENTE
// Empacota seções em páginas sem espaço gigante
// ============================================

// Estimativas de altura em px para cada bloco
const EPDF_H = {
  header: 108, footer: 52, gap: 10, bodyPad: 28,
  client: 100, cert: 82, bombas: 210, bombas_j: 280,
  hidrantes: 235, alarme: 195, extintor_par: 205,
  sinalizacao: 260, conformidade: 140, signatures: 130, obs: 50,
};
// Altura disponível por página (1123 - header - footer - padding)
const EPDF_PAGE_H = 1123 - EPDF_H.header - EPDF_H.footer - EPDF_H.bodyPad;

class EpdfBuilder {
  constructor(title) {
    this.title = title;
    this.pages = [];         // array de arrays de strings html
    this.cur = [];         // página atual
    this.curH = 0;
    this.pageN = 1;
  }

  push(html, h) {
    if (!html) return;
    const eh = h || 100;
    // se não é a primeira seção da página e não cabe → fecha página
    if (this.cur.length > 0 && this.curH + eh + EPDF_H.gap > EPDF_PAGE_H) {
      this._close();
    }
    this.cur.push(html);
    this.curH += eh + EPDF_H.gap;
  }

  _close() {
    if (this.cur.length > 0) {
      this.pages.push([...this.cur]);
      this.cur = [];
      this.curH = 0;
      this.pageN++;
    }
  }

  build() {
    if (this.cur.length > 0) this._close();
    const total = this.pages.length;
    return this.pages.map((items, i) => `
      <div class="extinpdf-page">
        ${epdfHeader(this.title)}
        <div class="epdf-body">
          ${items.join('')}
        </div>
        ${epdfFooter(i + 1, total)}
      </div>
    `).join('');
  }
}

// ============================================
// GERADORES PRINCIPAIS
// ============================================

function generateCompletePDF(data) {
  injectPDFStyles();
  const exts = getAllExtintores(data);
  const builder = new EpdfBuilder('RELATÓRIO COMPLETO DE INSPEÇÃO');

  builder.push(epdfClient(data), EPDF_H.client);
  builder.push(epdfCertificate(data), EPDF_H.cert);

  if (bool(data.has_bombas)) {
    builder.push(epdfBombas(data), bool(data.has_bomba_jockey) ? EPDF_H.bombas_j : EPDF_H.bombas);
    builder.push(epdfObs('Bombas', data.bombas_obs, 'fa-water'), EPDF_H.obs);
  }
  if (bool(data.has_hidrantes)) {
    builder.push(epdfHidrantes(data), EPDF_H.hidrantes);
    builder.push(epdfObs('Hidrantes', data.hidrantes_obs, 'fa-truck-droplet'), EPDF_H.obs);
  }
  if (bool(data.has_alarme)) {
    builder.push(epdfAlarme(data), EPDF_H.alarme);
    builder.push(epdfObs('Alarme', data.alarme_obs, 'fa-bell'), EPDF_H.obs);
  }
  if (bool(data.has_extintores)) {
    for (let p = 0; p < exts.length; p += 2) {
      const par = exts.slice(p, p + 2);
      const html = `
        <div class="epdf-card">
          <div class="epdf-card-title epdf-ct-gray">
            <i class="fas fa-fire-extinguisher"></i> Extintores de Incêndio
            <span class="epdf-badge">Ext. ${p + 1}${par.length > 1 ? '–' + (p + 2) : ''} / ${exts.length}</span>
          </div>
          <div class="epdf-grid ${par.length === 2 ? 'epdf-g2' : ''}">
            ${par.map((ext, i) => epdfExtintorCard(ext, p + i + 1, par.length)).join('')}
          </div>
        </div>`;
      builder.push(html, EPDF_H.extintor_par * (par.length === 2 ? 1 : 0.6));
    }
    builder.push(epdfObs('Extintores', data.extintores_obs, 'fa-fire-extinguisher'), EPDF_H.obs);
  }
  if (bool(data.has_sinalizacao)) {
    builder.push(epdfSinalizacao(data), EPDF_H.sinalizacao);
    builder.push(epdfObs('Sinalização', data.sinalizacao_obs, 'fa-sign'), EPDF_H.obs);
  }

  builder.push(epdfConformidade(data), EPDF_H.conformidade);
  builder.push(epdfObs('Conformidade', data.conformidade_obs, 'fa-clipboard-check'), EPDF_H.obs);
  builder.push(epdfSignatures(data), EPDF_H.signatures);

  return builder.build();
}

function generateBombasPDF(data) {
  injectPDFStyles();
  const b = new EpdfBuilder('RELATÓRIO — SISTEMA DE BOMBAS');
  b.push(epdfClient(data), EPDF_H.client);
  b.push(epdfBombas(data), bool(data.has_bomba_jockey) ? EPDF_H.bombas_j : EPDF_H.bombas);
  b.push(epdfObs('Bombas', data.bombas_obs, 'fa-water'), EPDF_H.obs);
  b.push(epdfSignatures(data), EPDF_H.signatures);
  return b.build();
}

function generateHidrantesPDF(data) {
  injectPDFStyles();
  const b = new EpdfBuilder('RELATÓRIO — REDE DE HIDRANTES');
  b.push(epdfClient(data), EPDF_H.client);
  b.push(epdfHidrantes(data), EPDF_H.hidrantes);
  b.push(epdfObs('Hidrantes', data.hidrantes_obs, 'fa-truck-droplet'), EPDF_H.obs);
  b.push(epdfSignatures(data), EPDF_H.signatures);
  return b.build();
}

function generateAlarmePDF(data) {
  injectPDFStyles();
  const b = new EpdfBuilder('RELATÓRIO — SISTEMA DE ALARME');
  b.push(epdfClient(data), EPDF_H.client);
  b.push(epdfAlarme(data), EPDF_H.alarme);
  b.push(epdfObs('Alarme', data.alarme_obs, 'fa-bell'), EPDF_H.obs);
  b.push(epdfSignatures(data), EPDF_H.signatures);
  return b.build();
}

function generateExtintoresPDF(data) {
  injectPDFStyles();
  const exts = getAllExtintores(data);
  const b = new EpdfBuilder('RELATÓRIO — EXTINTORES DE INCÊNDIO');
  b.push(epdfClient(data), EPDF_H.client);
  if (exts.length === 0) {
    b.push(`<div class="epdf-card"><div class="epdf-card-title epdf-ct-gray"><i class="fas fa-fire-extinguisher"></i> Extintores</div><div style="padding:14px;font-size:9px;color:#6b7280;">Nenhum extintor informado.</div></div>`, 60);
  } else {
    for (let p = 0; p < exts.length; p += 2) {
      const par = exts.slice(p, p + 2);
      const html = `
        <div class="epdf-card">
          <div class="epdf-card-title epdf-ct-gray">
            <i class="fas fa-fire-extinguisher"></i> Extintores de Incêndio
            <span class="epdf-badge">Ext. ${p + 1}${par.length > 1 ? '–' + (p + 2) : ''} / ${exts.length}</span>
          </div>
          <div class="epdf-grid ${par.length === 2 ? 'epdf-g2' : ''}">
            ${par.map((ext, i) => epdfExtintorCard(ext, p + i + 1, par.length)).join('')}
          </div>
        </div>`;
      b.push(html, EPDF_H.extintor_par * (par.length === 2 ? 1 : 0.6));
    }
  }
  b.push(epdfObs('Extintores', data.extintores_obs, 'fa-fire-extinguisher'), EPDF_H.obs);
  b.push(epdfSignatures(data), EPDF_H.signatures);
  return b.build();
}

function generateSinalizacaoPDF(data) {
  injectPDFStyles();
  const b = new EpdfBuilder('RELATÓRIO — SINALIZAÇÃO DE EMERGÊNCIA');
  b.push(epdfClient(data), EPDF_H.client);
  b.push(epdfSinalizacao(data), EPDF_H.sinalizacao);
  b.push(epdfObs('Sinalização', data.sinalizacao_obs, 'fa-sign'), EPDF_H.obs);
  b.push(epdfSignatures(data), EPDF_H.signatures);
  return b.build();
}

// ============================================
// COMPATIBILIDADE COM CÓDIGO ANTIGO
// ============================================
function generateExtintoresSection(d) { return generateExtintoresPDF(d); }
function generateSinalizacaoSection(d) { return epdfSinalizacao(d); }
function generateSinalizacaoSection_Parte1(d) { return epdfSinalizacao(d); }
function generateSinalizacaoSection_Parte2() { return ''; }
function generatePDFHeader(t) { return epdfHeader(t); }
function generatePDFFooter() { return epdfFooter(); }
function generateClientSection(d) { return epdfClient(d); }
function generateCertificateSection(d) { return epdfCertificate(d); }
function generateBombasSection(d) { return epdfBombas(d); }
function generateHidrantesSection(d) { return epdfHidrantes(d); }
function generateAlarmeSection(d) { return epdfAlarme(d); }
function generateConformidadeSection(d) { return epdfConformidade(d); }
function generateSignaturesSection(d) { return epdfSignatures(d); }
function generateObservationsSection(t, o) { return epdfObs(t, o); }

// ============================================
// BOTÃO GERAR RELATÓRIO
// ============================================
document.getElementById('generateReportBtn').addEventListener('click', () => {
  const form = document.getElementById('inspectionForm');
  const formData = new FormData(form);
  const data = {};

  for (let [key, value] of formData.entries()) {
    if (form.elements[key] && form.elements[key].type === 'checkbox') {
      data[key] = form.elements[key].checked;
    } else {
      data[key] = value;
    }
  }

  data.tipo = window.ultimaEmpresaCadastrada?.tipo || 'empresa';

  if (data.tipo === 'predio' && window.ultimaEmpresaCadastrada) {
    data.razao_social_predio = data.razao_social || window.ultimaEmpresaCadastrada.razao_social_predio;
    data.cnpj_predio = data.cnpj || window.ultimaEmpresaCadastrada.cnpj_predio;
    data.telefone_predio = data.telefone || window.ultimaEmpresaCadastrada.telefone_predio;
    data.responsavel_predio = data.responsavel || window.ultimaEmpresaCadastrada.responsavel_predio;
    data.cep_predio = data.cep || window.ultimaEmpresaCadastrada.cep_predio;
    data.endereco_predio = data.endereco || window.ultimaEmpresaCadastrada.endereco_predio;
    data.numero_predio = data.numero_predio || window.ultimaEmpresaCadastrada.numero_predio;
  }

  currentInspectionData = data;

  const grid = document.getElementById('pdfSelectionGrid');
  grid.innerHTML = '';

  const options = [
    { id: 'complete', icon: 'fa-file-alt', title: 'Relatório Completo', desc: 'Todos os sistemas inspecionados' },
  ];
  if (bool(data.has_bombas)) options.push({ id: 'bombas', icon: 'fa-water', title: 'Sistema de Bombas', desc: 'Bombas e reservatório' });
  if (bool(data.has_hidrantes)) options.push({ id: 'hidrantes', icon: 'fa-truck-droplet', title: 'Rede de Hidrantes', desc: 'Hidrantes e acessórios' });
  if (bool(data.has_alarme)) options.push({ id: 'alarme', icon: 'fa-bell', title: 'Sistema de Alarme', desc: 'Alarme e detectores' });
  if (bool(data.has_extintores)) options.push({ id: 'extintores', icon: 'fa-fire-extinguisher', title: 'Extintores', desc: 'Apenas extintores' });
  if (bool(data.has_sinalizacao)) options.push({ id: 'sinalizacao', icon: 'fa-sign', title: 'Sinalização', desc: 'Placas e sinalização' });

  options.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'pdf-option';
    div.innerHTML = `
      <i class="fas ${opt.icon}"></i>
      <div class="pdf-option-content">
        <div class="pdf-option-title">${opt.title}</div>
        <div class="pdf-option-desc">${opt.desc}</div>
      </div>`;
    div.onclick = () => generateSelectedPDF(opt.id);
    grid.appendChild(div);
  });

  closeModal('inspectionFormModal');
  openModal('pdfSelectionModal');
});

// ============================================
// GERAR PDF SELECIONADO
// ============================================
function generateSelectedPDF(type) {
  const data = currentInspectionData;
  let html = '';

  switch (type) {
    case 'complete': html = generateCompletePDF(data); break;
    case 'bombas': html = generateBombasPDF(data); break;
    case 'hidrantes': html = generateHidrantesPDF(data); break;
    case 'alarme': html = generateAlarmePDF(data); break;
    case 'extintores': html = generateExtintoresPDF(data); break;
    case 'sinalizacao': html = generateSinalizacaoPDF(data); break;
  }

  // Insere o HTML do PDF
  document.getElementById('pdfPreview').innerHTML = html;

  // Fecha o modal de seleção de PDF
  closeModal('pdfSelectionModal');

  // Remove a classe ativa dos itens de navegação
  document.querySelectorAll('.nav-item-mobile, .nav-item-desktop')
    .forEach(n => n.classList.remove('active'));

  // Remove a classe ativa de todas as seções
  document.querySelectorAll('.content-section').forEach(s => {
    s.classList.remove('active');
  });

  // Ativa a seção de preview do PDF
  const sec = document.getElementById('pdfPreviewSection');
  sec.classList.add('active');

  // Rola para o topo da seção e da página
  sec.scrollTop = 0;
  window.scrollTo(0, 0);
}



// ===== COMPRESSOR DE IMAGENS =====
