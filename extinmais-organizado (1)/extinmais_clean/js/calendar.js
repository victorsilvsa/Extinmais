// CALENDÁRIO INTEGRADO — Versão Refatorada
// Visualizador automático de eventos financeiros das OS
// + Agendamentos operacionais (inspeções/vistorias/visitas)
// ============================================================
// REMOVIDO: cadastro manual de boletos/pagamentos
// ADICIONADO: leitura automática de todos os eventos das OS
//   → vencimentos, pagamentos, atrasos, parcelas, recebimentos
// ============================================================

// ─── Estado Global ────────────────────────────────────────────────────────────
let currentCalendarDate = new Date();
let calendarInspections = [];
let calendarEventosOS = [];   // ← todos os eventos financeiros das OS
let selectedDateForSchedule = null;

// ─── Tipos de evento financeiro (para filtros e badges) ──────────────────────
const EVENTO_TIPO = {
  BOLETO_VENCIDO: 'boleto_vencido',
  BOLETO_PENDENTE: 'boleto_pendente',
  BOLETO_PAGO: 'boleto_pago',
  PAGAMENTO_PAGO: 'pagamento_pago',
  PAGAMENTO_PREV: 'pagamento_previsto',
  PRAZO_VENCIDO: 'prazo_vencido',
  PRAZO_PENDENTE: 'prazo_pendente',
  PARCELA_PAGA: 'parcela_paga',
  PARCELA_PEND: 'parcela_pendente',
  CONTA_RECEBER: 'conta_receber',
};

const EVENTO_COR = {
  [EVENTO_TIPO.BOLETO_VENCIDO]: '#ef4444',
  [EVENTO_TIPO.BOLETO_PENDENTE]: '#f59e0b',
  [EVENTO_TIPO.BOLETO_PAGO]: '#4ade80',
  [EVENTO_TIPO.PAGAMENTO_PAGO]: '#4ade80',
  [EVENTO_TIPO.PAGAMENTO_PREV]: '#60a5fa',
  [EVENTO_TIPO.PRAZO_VENCIDO]: '#ef4444',
  [EVENTO_TIPO.PRAZO_PENDENTE]: '#fb923c',
  [EVENTO_TIPO.PARCELA_PAGA]: '#4ade80',
  [EVENTO_TIPO.PARCELA_PEND]: '#a78bfa',
  [EVENTO_TIPO.CONTA_RECEBER]: '#34d399',
};

const EVENTO_LABEL = {
  [EVENTO_TIPO.BOLETO_VENCIDO]: 'Boleto Vencido',
  [EVENTO_TIPO.BOLETO_PENDENTE]: 'Boleto Pendente',
  [EVENTO_TIPO.BOLETO_PAGO]: 'Boleto Pago',
  [EVENTO_TIPO.PAGAMENTO_PAGO]: 'Pagamento Recebido',
  [EVENTO_TIPO.PAGAMENTO_PREV]: 'Pgto. Previsto',
  [EVENTO_TIPO.PRAZO_VENCIDO]: 'A Prazo Vencido',
  [EVENTO_TIPO.PRAZO_PENDENTE]: 'A Prazo Pendente',
  [EVENTO_TIPO.PARCELA_PAGA]: 'Parcela Paga',
  [EVENTO_TIPO.PARCELA_PEND]: 'Parcela Pendente',
  [EVENTO_TIPO.CONTA_RECEBER]: 'Conta a Receber',
};

// ─── CSS BASE PDF ─────────────────────────────────────────────────────────────
// CORREÇÃO DO FOOTER: .pdf-nota-page usa display:flex + flex-direction:column
// e .pdf-nota-body usa flex:1, fazendo o footer sempre ficar no final da folha.
const PDF_BASE_CSS_CALENDAR = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1f2937; }

  /* ── CORREÇÃO PRINCIPAL: flex column na página ── */
  .pdf-nota-page {
    width:210mm;
    min-height:297mm;
    height:297mm;
    padding:0;
    position:relative;
    background:#fff;
    display:flex;
    flex-direction:column;
  }

  .pdf-nota-header { background:linear-gradient(135deg,#b32117 0%,#dc2626 100%); color:#fff; padding:18px 22px; flex-shrink:0; }
  .pdf-nota-header-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
  .pdf-nota-logo-section { flex-shrink:0; }
  .pdf-nota-logo-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .pdf-nota-logo-text { font-size:22px; font-weight:900; letter-spacing:2px; color:#fff; }
  .pdf-nota-company-info { font-size:9px; color:rgba(255,255,255,0.85); line-height:1.5; }
  .pdf-nota-header-center { flex:1; text-align:center; }
  .pdf-nota-header-center h1 { font-size:16px; font-weight:800; margin-bottom:4px; }
  .pdf-nota-header-center p { font-size:10px; opacity:0.85; }
  .pdf-nota-header-right { text-align:right; flex-shrink:0; }
  .pdf-nota-header-item { font-size:9px; margin-bottom:3px; opacity:0.9; }

  /* ── flex:1 no body empurra o footer para o final ── */
  .pdf-nota-body { padding:14px 20px 10px; flex:1; }

  .pdf-nota-section { margin-bottom:12px; }
  .pdf-nota-section-title { background:linear-gradient(135deg,#374151,#4b5563); color:#fff; padding:7px 12px; border-radius:6px 6px 0 0; font-size:11px; font-weight:700; display:flex; align-items:center; gap:8px; text-transform:uppercase; letter-spacing:0.4px; }
  .pdf-nota-section-title.vermelho { background:linear-gradient(135deg,#b32117,#dc2626); }
  .pdf-nota-section-title.verde { background:linear-gradient(135deg,#15803d,#16a34a); }
  .pdf-nota-section-title.amarelo { background:linear-gradient(135deg,#b45309,#d97706); }
  .pdf-nota-section-content { border:1px solid #e5e7eb; border-top:none; border-radius:0 0 6px 6px; padding:12px; background:#fff; }
  .pdf-nota-dados-inline { display:flex; flex-wrap:wrap; gap:8px; }
  .pdf-nota-dado-item { flex:1 1 160px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:8px 10px; min-width:120px; }
  .pdf-nota-dado-item.destaque { border-color:#b32117; background:#fef2f2; }
  .pdf-nota-dado-item.verde { border-color:#16a34a; background:#f0fdf4; }
  .pdf-nota-dado-label { font-size:9px; color:#6b7280; font-weight:600; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:2px; }
  .pdf-nota-dado-valor { font-size:12px; color:#1f2937; font-weight:600; }
  .pdf-nota-resumo-compact { display:flex; flex-wrap:wrap; gap:8px; }
  .pdf-nota-resumo-item { flex:1 1 100px; background:#f9fafb; border:2px solid #e5e7eb; border-radius:8px; padding:10px; text-align:center; }
  .pdf-nota-resumo-item.verde { border-color:#16a34a; background:#f0fdf4; }
  .pdf-nota-resumo-item.destaque { border-color:#b32117; background:#fef2f2; }
  .pdf-nota-resumo-label { font-size:9px; color:#6b7280; margin-bottom:4px; font-weight:600; }
  .pdf-nota-resumo-valor { font-size:14px; font-weight:800; color:#1f2937; }
  .pdf-tabela { width:100%; border-collapse:collapse; font-size:10px; }
  .pdf-tabela thead tr { background:linear-gradient(135deg,#374151,#4b5563); color:#fff; }
  .pdf-tabela thead th { padding:8px 10px; text-align:left; font-weight:700; border-right:1px solid rgba(255,255,255,0.2); }
  .pdf-tabela thead th:last-child { border-right:none; }
  .pdf-tabela tbody tr { border-bottom:1px solid #e5e7eb; }
  .pdf-tabela tbody td { padding:7px 10px; }
  .pdf-tabela tfoot tr { background:#f9fafb; }
  .pdf-tabela tfoot td { padding:8px 10px; font-weight:800; font-size:11px; border-top:2px solid #b32117; }
  .pdf-nota-assinaturas { display:flex; gap:20px; }
  .pdf-nota-assinatura-campo { flex:1; text-align:center; padding-top:10px; }
  .pdf-nota-assinatura-linha { height:1px; background:#374151; margin-bottom:6px; }
  .pdf-nota-assinatura-nome { font-size:10px; font-weight:700; color:#374151; margin-bottom:3px; }
  .pdf-nota-assinatura-info { font-size:9px; color:#6b7280; line-height:1.5; }

  /* ── footer: flex-shrink:0 garante que não encolhe ── */
  .pdf-nota-pdf-footer {
    background:linear-gradient(135deg,#1f2937,#374151);
    color:#fff;
    padding:8px 20px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-size:8px;
    flex-shrink:0;
    margin-top:auto;
  }

  .pdf-nota-footer-brand { font-weight:800; letter-spacing:1px; display:flex; align-items:center; gap:6px; }
  .pdf-nota-footer-info { opacity:0.8; }
  .pdf-nota-footer-timestamp { opacity:0.7; }
  .badge-pago    { background:#dcfce7; color:#16a34a; padding:3px 8px; border-radius:4px; font-weight:700; font-size:9px; }
  .badge-pendente{ background:#fef2f2; color:#b32117; padding:3px 8px; border-radius:4px; font-weight:700; font-size:9px; }
  .badge-vencido { background:#fee2e2; color:#dc2626; padding:3px 8px; border-radius:4px; font-weight:700; font-size:9px; }
  .pdf-nota-condicoes-list { display:flex; flex-direction:column; gap:4px; }
  .pdf-nota-condicoes-item { display:flex; align-items:center; gap:8px; font-size:10px; color:#374151; }
  .pdf-nota-condicoes-item i { color:#16a34a; flex-shrink:0; }
`;

// ─── Helpers PDF ──────────────────────────────────────────────────────────────
function calPdfHtmlShell(bodyContent) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>${PDF_BASE_CSS_CALENDAR}</style>
</head><body>${bodyContent}</body></html>`;
}

function calPdfHeader({ titulo, subtitulo, rightLines = [] }) {
  const logoBlock = typeof getPDFLogoHtml === 'function'
    ? getPDFLogoHtml('dark')
    : `<div class="pdf-nota-logo-header"><i class="fas fa-fire-extinguisher" style="font-size:16px;opacity:0.9;"></i><div class="pdf-nota-logo-text">EXTINMAIS</div></div>`;
  return `
  <div class="pdf-nota-header">
    <div class="pdf-nota-header-top">
      <div class="pdf-nota-logo-section">
        ${logoBlock}
      </div>
      <div class="pdf-nota-header-center">
        <h1>${titulo}</h1>
        <p>${subtitulo || ''}</p>
      </div>
      <div class="pdf-nota-header-right">
        ${rightLines.map(l => `<div class="pdf-nota-header-item">${l}</div>`).join('')}
      </div>
    </div>
  </div>`;
}

function calPdfFooter() {
  const nome = 'EXTINMAIS';
  const info = typeof getPDFFooterHtml === 'function' ? getPDFFooterHtml() : '';
  return `
  <div class="pdf-nota-pdf-footer">
    <div class="pdf-nota-footer-brand"><i class="fas fa-fire-extinguisher"></i> EXTINMAIS</div>
    <div class="pdf-nota-footer-info">${info}</div>
    <div class="pdf-nota-footer-timestamp">Emitido em: ${new Date().toLocaleString('pt-BR')}</div>
  </div>`;
}

async function calRenderizarEBaixarPDF(htmlContent, nomeArquivo) {
  await new Promise(r => setTimeout(r, 100));
  const div = document.createElement('div');
  div.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;';
  div.innerHTML = htmlContent;
  document.body.appendChild(div);

  const containers = div.querySelectorAll('.pdf-nota-page, .page');
  const renderTargets = containers.length > 0 ? Array.from(containers) : [div.firstElementChild];

  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 300));

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  for (let i = 0; i < renderTargets.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await html2canvas(renderTargets[i], {
      scale: 2, useCORS: true, allowTaint: false,
      backgroundColor: '#ffffff', logging: false,
      width: renderTargets[i].scrollWidth,
      height: renderTargets[i].scrollHeight,
      windowWidth: 794
    });
    pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 210, 297, '', 'FAST');
  }

  document.body.removeChild(div);
  pdf.save(nomeArquivo);
}

// ─── Utilitários de data ──────────────────────────────────────────────────────
function toDateStr(isoOrStr) {
  if (!isoOrStr) return null;
  try {
    return new Date(isoOrStr).toISOString().split('T')[0];
  } catch { return null; }
}

function formatarDataBR(dateStr) {
  if (!dateStr) return 'Não informada';
  const [a, m, d] = dateStr.split('-');
  return `${d}/${m}/${a}`;
}

function diasParaVencer(dateStr) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(dateStr + 'T00:00:00');
  return Math.round((alvo - hoje) / 86400000);
}

// ============================================================
// EXTRAÇÃO DE EVENTOS FINANCEIROS DAS OS
// ============================================================
function extrairEventosFinanceirosOS(orders) {
  const eventos = [];
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  orders.forEach(os => {
    const pago = os.payment_status === 'Pago' || os.statusPagamento === 'Pago';
    const forma = (os.payment_method || os.formaPagamento || '').toLowerCase();
    const total = Number(os.total) || Number(os.preco) || 0;
    const cliente = os.cliente || 'Cliente';

    // ── 1. Pagamento já realizado ────────────────────────────────────────────
    if (pago && os.dataPagamento) {
      const ds = toDateStr(os.dataPagamento);
      if (ds) eventos.push({
        osId: os.id,
        dateStr: ds,
        tipo: EVENTO_TIPO.PAGAMENTO_PAGO,
        os,
        valor: total,
        label: EVENTO_LABEL[EVENTO_TIPO.PAGAMENTO_PAGO],
        descricao: `${cliente} — ${(os.servico || 'Serviço')}`,
      });
    }

    // ── 2. Vencimento de boleto ──────────────────────────────────────────────
    if (os.vencimentoBoleto) {
      const ds = toDateStr(os.vencimentoBoleto);
      const diff = ds ? diasParaVencer(ds) : 0;
      if (ds) {
        const tipo = pago
          ? EVENTO_TIPO.BOLETO_PAGO
          : diff < 0
            ? EVENTO_TIPO.BOLETO_VENCIDO
            : EVENTO_TIPO.BOLETO_PENDENTE;

        eventos.push({
          osId: os.id,
          dateStr: ds,
          tipo,
          os,
          valor: total,
          label: EVENTO_LABEL[tipo],
          descricao: `${cliente} — ${forma.includes('boleto') ? 'Boleto' : 'A Prazo'}`,
        });
      }
    }

    // ── 3. Pagamentos A Prazo sem vencimento explícito ───────────────────────
    if (!pago && forma.includes('prazo') && !os.vencimentoBoleto && os.prazoPagamento && os.data) {
      const base = new Date(os.data);
      base.setDate(base.getDate() + Number(os.prazoPagamento));
      const ds = base.toISOString().split('T')[0];
      const diff = diasParaVencer(ds);
      const tipo = diff < 0 ? EVENTO_TIPO.PRAZO_VENCIDO : EVENTO_TIPO.PRAZO_PENDENTE;
      eventos.push({
        osId: os.id,
        dateStr: ds,
        tipo,
        os,
        valor: total,
        label: EVENTO_LABEL[tipo],
        descricao: `${cliente} — A Prazo (${os.prazoPagamento}d)`,
      });
    }

    // ── 4. Contas a receber ──────────────────────────────────────────────────
    if (!pago) {
      const statusOS = (os.status || os.estado || '').toString();
      const finalizada = /conclu|finaliz/i.test(statusOS);
      if (finalizada && os.data) {
        const ds = toDateStr(os.data);
        const jaTemEvento = eventos.some(e => e.osId === os.id && e.dateStr === ds);
        if (ds && !jaTemEvento && !os.vencimentoBoleto && !forma.includes('boleto') && !forma.includes('prazo')) {
          eventos.push({
            osId: os.id,
            dateStr: ds,
            tipo: EVENTO_TIPO.CONTA_RECEBER,
            os,
            valor: total,
            label: EVENTO_LABEL[EVENTO_TIPO.CONTA_RECEBER],
            descricao: `${cliente} — ${os.servico || 'Serviço'}`,
          });
        }
      }
    }

    // ── 5. Pagamento previsto ────────────────────────────────────────────────
    if (!pago && !os.vencimentoBoleto && !forma.includes('boleto') && !forma.includes('prazo') && os.data) {
      const statusOS = (os.status || os.estado || '').toString();
      const finalizada = /conclu|finaliz/i.test(statusOS);
      if (!finalizada) {
        const ds = toDateStr(os.data);
        if (ds) {
          const jaTemEvento = eventos.some(e => e.osId === os.id);
          if (!jaTemEvento) {
            eventos.push({
              osId: os.id,
              dateStr: ds,
              tipo: EVENTO_TIPO.PAGAMENTO_PREV,
              os,
              valor: total,
              label: EVENTO_LABEL[EVENTO_TIPO.PAGAMENTO_PREV],
              descricao: `${cliente} — Pendente`,
            });
          }
        }
      }
    }
  });

  return eventos;
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
async function initCalendar() {
  await Promise.all([
    carregarInspecoesAgendadas(),
    sincronizarEventosFinanceiros(),
  ]);
  renderCalendar();
  setupCalendarEventListeners();
  verificarAvisosVencimentoOS();

  firebase.database().ref('orders').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    const orders = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    calendarEventosOS = extrairEventosFinanceirosOS(orders);
    renderCalendar();
    verificarAvisosVencimentoOS();
  });
}

async function carregarInspecoesAgendadas() {
  try {
    const snapshot = await database.ref('scheduled_inspections').once('value');
    const data = snapshot.val() || {};
    calendarInspections = Object.keys(data).map(k => ({ id: k, ...data[k] }));
  } catch (error) {
    console.error('Erro ao carregar inspeções:', error);
    showToast('Erro ao carregar inspeções agendadas', 'error');
  }
}

async function sincronizarEventosFinanceiros() {
  try {
    let orders = [];
    if (typeof allOrders !== 'undefined' && Array.isArray(allOrders) && allOrders.length > 0) {
      orders = allOrders;
    } else {
      const snapshot = await database.ref('orders').once('value');
      const data = snapshot.val() || {};
      orders = Object.entries(data).map(([id, v]) => ({ id, ...v }));
    }
    calendarEventosOS = extrairEventosFinanceirosOS(orders);
  } catch (e) {
    console.error('Erro ao sincronizar eventos financeiros:', e);
  }
}

// ============================================================
// AVISOS AUTOMÁTICOS
// ============================================================
function verificarAvisosVencimentoOS() {
  calendarEventosOS.forEach(ev => {
    if (ev.tipo === EVENTO_TIPO.PAGAMENTO_PAGO || ev.tipo === EVENTO_TIPO.BOLETO_PAGO || ev.tipo === EVENTO_TIPO.PARCELA_PAGA) return;
    const diff = diasParaVencer(ev.dateStr);
    if (diff === 2) _mostrarNotifVencimento(ev, `Vence em 2 dias (${formatarDataBR(ev.dateStr)})`);
    if (diff === 0) _mostrarNotifVencimento(ev, `Vence HOJE (${formatarDataBR(ev.dateStr)})!`);
    if (diff === -1) _mostrarNotifVencimento(ev, `Venceu ontem (${formatarDataBR(ev.dateStr)}) — verificar!`);
  });
}

function _mostrarNotifVencimento(ev, msg) {
  const chave = `os_cal_notif_${ev.osId}_${ev.tipo}_${msg.substring(0, 20)}`;
  if (sessionStorage.getItem(chave)) return;
  sessionStorage.setItem(chave, '1');

  const cor = EVENTO_COR[ev.tipo] || '#f59e0b';
  const notif = document.createElement('div');
  notif.style.cssText = `position:fixed;top:20px;right:20px;z-index:99999;background:#1a1a1a;border:2px solid ${cor};border-radius:12px;padding:16px 20px;max-width:340px;box-shadow:0 8px 24px rgba(0,0,0,0.5);animation:slideUp 0.3s ease;`;
  notif.innerHTML = `
    <div style="display:flex;align-items:start;gap:12px;">
      <i class="fas fa-bell" style="color:${cor};font-size:18px;margin-top:2px;flex-shrink:0;"></i>
      <div style="flex:1;min-width:0;">
        <div style="color:${cor};font-weight:700;font-size:12px;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.5px;">${ev.label}</div>
        <div style="color:#fff;font-size:13px;font-weight:600;margin-bottom:3px;word-break:break-word;">${escapeHtml(ev.descricao)}</div>
        <div style="color:#aaa;font-size:11px;margin-bottom:3px;">${msg}</div>
        <div style="color:${cor};font-size:13px;font-weight:800;margin-bottom:10px;">${(ev.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        <div style="display:flex;gap:8px;">
          <button onclick="abrirOSDoEvento('${ev.osId}');this.closest('[style]').remove()"
            style="background:${cor};border:none;color:#111;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">
            Ver OS
          </button>
          <button onclick="this.closest('[style]').remove()"
            style="background:rgba(255,255,255,0.1);border:none;color:#aaa;padding:6px 10px;border-radius:6px;font-size:11px;cursor:pointer;">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(notif);
  setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 15000);
}

// ============================================================
// AÇÃO: Abrir OS do evento
// ============================================================
function abrirOSDoEvento(osId) {
  if (!osId) return;
  if (typeof abrirModalPagamento === 'function') {
    abrirModalPagamento(osId);
    return;
  }
  if (typeof viewOrder === 'function') {
    viewOrder(osId);
    return;
  }
  showToast('Acesse o módulo de OS para ver este registro.', 'info');
}

// ============================================================
// RENDERIZAÇÃO DO CALENDÁRIO
// ============================================================
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const el = document.getElementById('currentMonthTitle');
  if (el) el.textContent = `${monthNames[month]} ${year}`;

  _renderResumoMesHeader(month, year);

  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  grid.innerHTML = '';

  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'calendar-day-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const prevMon = new Date(year, month, 0).getMonth();
  const prevYear2 = new Date(year, month, 0).getFullYear();
  const nextMon = new Date(year, month + 1, 1).getMonth();
  const nextYear2 = new Date(year, month + 1, 1).getFullYear();
  const today = new Date();
  const isThisMon = today.getMonth() === month && today.getFullYear() === year;

  for (let i = firstDay - 1; i >= 0; i--)
    grid.appendChild(_createDayElement(prevLast - i, prevMon, prevYear2, true));

  for (let day = 1; day <= lastDate; day++)
    grid.appendChild(_createDayElement(day, month, year, false, isThisMon && day === today.getDate()));

  const remaining = 42 - (firstDay + lastDate);
  for (let day = 1; day <= remaining; day++)
    grid.appendChild(_createDayElement(day, nextMon, nextYear2, true));
}

// ─── Resumo financeiro no header do mês ──────────────────────────────────────
function _renderResumoMesHeader(month, year) {
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const evsMes = calendarEventosOS.filter(e => (e.dateStr || '').startsWith(monthStr));

  const totalReceber = evsMes
    .filter(e => [EVENTO_TIPO.CONTA_RECEBER, EVENTO_TIPO.BOLETO_PENDENTE, EVENTO_TIPO.PRAZO_PENDENTE, EVENTO_TIPO.PAGAMENTO_PREV].includes(e.tipo))
    .reduce((s, e) => s + e.valor, 0);
  const totalRecebido = evsMes
    .filter(e => [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO, EVENTO_TIPO.PARCELA_PAGA].includes(e.tipo))
    .reduce((s, e) => s + e.valor, 0);
  const totalVencido = evsMes
    .filter(e => [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(e.tipo))
    .reduce((s, e) => s + e.valor, 0);

  const el = document.getElementById('calResumoFinanceiro');
  if (!el) return;

  el.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:10px 0 2px;">
      <div style="display:flex;align-items:center;gap:6px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.3);border-radius:8px;padding:6px 12px;">
        <i class="fas fa-check-circle" style="color:#4ade80;font-size:11px;"></i>
        <div>
          <div style="font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Recebido</div>
          <div style="font-size:13px;font-weight:800;color:#4ade80;">${totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.3);border-radius:8px;padding:6px 12px;">
        <i class="fas fa-clock" style="color:#60a5fa;font-size:11px;"></i>
        <div>
          <div style="font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">A Receber</div>
          <div style="font-size:13px;font-weight:800;color:#60a5fa;">${totalReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </div>
      </div>
      ${totalVencido > 0 ? `
      <div style="display:flex;align-items:center;gap:6px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:6px 12px;">
        <i class="fas fa-exclamation-triangle" style="color:#ef4444;font-size:11px;"></i>
        <div>
          <div style="font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Vencido</div>
          <div style="font-size:13px;font-weight:800;color:#ef4444;">${totalVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </div>
      </div>` : ''}
    </div>
  `;
}

// ─── Célula de dia ────────────────────────────────────────────────────────────
function _createDayElement(day, month, year, isOtherMonth = false, isToday = false) {
  const isMobile = window.innerWidth < 768;
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const dayInsp = calendarInspections.filter(i => i.date === dateStr)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const dayEvs = calendarEventosOS.filter(e => e.dateStr === dateStr);

  const dayDiv = document.createElement('div');
  dayDiv.className = 'calendar-day';

  let bgColor = '#2a2a2a';
  const temVencido = dayEvs.some(e => [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(e.tipo));
  const temRecebido = dayEvs.some(e => [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO].includes(e.tipo));
  const temPendente = dayEvs.some(e => [EVENTO_TIPO.BOLETO_PENDENTE, EVENTO_TIPO.PRAZO_PENDENTE, EVENTO_TIPO.CONTA_RECEBER].includes(e.tipo));
  if (temVencido) bgColor = 'linear-gradient(135deg,#2a2a2a,#3a1a1a)';
  else if (temRecebido) bgColor = 'linear-gradient(135deg,#2a2a2a,#1a3a2a)';
  else if (temPendente) bgColor = 'linear-gradient(135deg,#2a2a2a,#2a2a1a)';
  else if (dayInsp.length > 0) bgColor = 'linear-gradient(135deg,#2a2a2a,#2a2a3a)';

  Object.assign(dayDiv.style, {
    background: bgColor,
    border: isToday ? '2px solid #D4C29A' : `${isMobile ? '1.5' : '1'}px solid #404040`,
    borderRadius: isMobile ? '6px' : '8px',
    padding: isMobile ? '6px' : '10px',
    minHeight: isMobile ? '70px' : '115px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: isMobile ? '3px' : '6px',
    position: 'relative',
    cursor: isOtherMonth ? 'default' : 'pointer',
    transition: 'all 0.2s ease',
  });

  if (isOtherMonth) { dayDiv.style.opacity = '0.3'; dayDiv.style.pointerEvents = 'none'; return dayDiv; }

  if (!isMobile) {
    dayDiv.addEventListener('mouseenter', () => {
      if (!isToday) dayDiv.style.borderColor = '#D4C29A';
      dayDiv.style.transform = 'translateY(-2px)';
      dayDiv.style.boxShadow = '0 4px 12px rgba(212,194,154,0.2)';
    });
    dayDiv.addEventListener('mouseleave', () => {
      if (!isToday) dayDiv.style.borderColor = '#404040';
      dayDiv.style.transform = '';
      dayDiv.style.boxShadow = '';
    });
  }

  // ── Topo: número + badges ─────────────────────────────────────────────────
  const top = document.createElement('div');
  Object.assign(top.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: '0' });

  const num = document.createElement('div');
  num.textContent = day;
  Object.assign(num.style, { fontSize: isMobile ? '0.95rem' : '1.4rem', fontWeight: '700', color: '#D4C29A', lineHeight: '1' });
  top.appendChild(num);

  const badges = document.createElement('div');
  Object.assign(badges.style, { display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' });

  if (dayInsp.length > 0) {
    const b = document.createElement('div');
    b.textContent = dayInsp.length;
    b.title = `${dayInsp.length} inspeç${dayInsp.length !== 1 ? 'ões' : 'ão'}`;
    Object.assign(b.style, { background: '#D4C29A', color: '#1a1a1a', fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: '700', padding: '2px 6px', borderRadius: '8px', minWidth: '16px', textAlign: 'center' });
    badges.appendChild(b);
  }

  if (dayEvs.length > 0) {
    const venc = dayEvs.filter(e => [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(e.tipo)).length;
    const recv = dayEvs.filter(e => [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO].includes(e.tipo)).length;
    const pend = dayEvs.length - venc - recv;

    if (venc > 0) {
      const b = document.createElement('div');
      b.innerHTML = `<i class="fas fa-exclamation-triangle" style="font-size:0.55rem;"></i> ${venc}`;
      b.title = `${venc} vencido${venc !== 1 ? 's' : ''}`;
      Object.assign(b.style, { background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', padding: '2px 5px', borderRadius: '6px', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: '2px' });
      badges.appendChild(b);
    }
    if (pend > 0) {
      const b = document.createElement('div');
      b.innerHTML = `<i class="fas fa-dollar-sign" style="font-size:0.55rem;"></i> ${pend}`;
      b.title = `${pend} pendente${pend !== 1 ? 's' : ''}`;
      Object.assign(b.style, { background: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', padding: '2px 5px', borderRadius: '6px', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '2px' });
      badges.appendChild(b);
    }
    if (recv > 0) {
      const b = document.createElement('div');
      b.innerHTML = `<i class="fas fa-check" style="font-size:0.55rem;"></i> ${recv}`;
      b.title = `${recv} recebido${recv !== 1 ? 's' : ''}`;
      Object.assign(b.style, { background: 'rgba(74,222,128,0.15)', color: '#4ade80', fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', padding: '2px 5px', borderRadius: '6px', border: '1px solid #4ade80', display: 'flex', alignItems: 'center', gap: '2px' });
      badges.appendChild(b);
    }
  }

  top.appendChild(badges);
  dayDiv.appendChild(top);

  // ── Meio: prévia de valores (desktop) ────────────────────────────────────
  if (!isMobile && dayEvs.length > 0) {
    const totalDia = dayEvs.reduce((s, e) => s + e.valor, 0);
    const mid = document.createElement('div');
    mid.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;min-height:0;';
    mid.innerHTML = `<span style="font-size:10px;font-weight:700;color:#D4C29A;opacity:0.8;">${totalDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>`;
    dayDiv.appendChild(mid);
  } else if (!isMobile && dayInsp.length > 0) {
    const mid = document.createElement('div');
    mid.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;min-height:0;';
    mid.innerHTML = `<i class="fas fa-calendar-check" style="font-size:1.2rem;color:#D4C29A;opacity:0.35;"></i>`;
    dayDiv.appendChild(mid);
  }

  // ── Rodapé: botão agendar ────────────────────────────────────────────────
  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';

  const addInspBtn = document.createElement('button');
  addInspBtn.innerHTML = '<i class="fas fa-plus"></i>';
  addInspBtn.title = 'Agendar inspeção/compromisso';
  Object.assign(addInspBtn.style, {
    flex: '1', background: 'rgba(212,194,154,0.1)', border: '1px dashed rgba(212,194,154,0.4)',
    color: '#D4C29A', padding: isMobile ? '3px' : '5px', borderRadius: isMobile ? '4px' : '5px',
    fontSize: isMobile ? '0.6rem' : '0.7rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', minHeight: isMobile ? '20px' : 'auto'
  });
  addInspBtn.onclick = e => { e.stopPropagation(); abrirModalAgendamentoComData(dateStr); };

  footer.appendChild(addInspBtn);
  dayDiv.appendChild(footer);

  dayDiv.onclick = () => _abrirModalDia(dateStr, day, month, year, dayInsp, dayEvs);

  return dayDiv;
}

// ============================================================
// MODAL DO DIA
// ============================================================
function _abrirModalDia(dateStr, day, month, year, dayInsp, dayEvs) {
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const isMobile = window.innerWidth < 768;

  let modal = document.getElementById('modalInspecoesDia');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalInspecoesDia';
    Object.assign(modal.style, {
      display: 'none', position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.95)', zIndex: '10000', overflowY: 'auto',
      padding: isMobile ? '10px' : '15px', boxSizing: 'border-box'
    });
    document.body.appendChild(modal);
  }

  dayInsp = [...dayInsp].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const evFinHTML = dayEvs.length === 0 ? '' : `
    <div style="margin-top:${isMobile ? '12px' : '16px'};">
      <div style="color:#D4C29A;font-size:${isMobile ? '0.85rem' : '0.9rem'};font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:1px solid #333;">
        <i class="fas fa-dollar-sign" style="background:#D4C29A;color:#0d0d0d;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;"></i>
        Movimentações Financeiras — ${formatarDataBR(dateStr)}
      </div>
      ${dayEvs.map(ev => {
    const cor = EVENTO_COR[ev.tipo] || '#aaa';
    const bgCor = cor + '18';
    const isPago = [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO, EVENTO_TIPO.PARCELA_PAGA].includes(ev.tipo);
    const isVenc = [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(ev.tipo);
    const os = ev.os || {};
    const forma = os.payment_method || os.formaPagamento || '-';

    return `
        <div style="background:${bgCor};border:1px solid ${cor}40;border-left:3px solid ${cor};border-radius:${isMobile ? '6px' : '8px'};padding:${isMobile ? '10px' : '12px'};margin-bottom:${isMobile ? '8px' : '10px'};">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:${isMobile ? '0.8rem' : '0.85rem'};font-weight:700;color:${cor};margin-bottom:2px;text-transform:uppercase;letter-spacing:0.5px;">${ev.label}</div>
              <div style="font-size:${isMobile ? '0.9rem' : '0.95rem'};font-weight:600;color:#fff;margin-bottom:4px;word-break:break-word;">${escapeHtml(os.cliente || 'Cliente')}</div>
              <div style="font-size:${isMobile ? '0.75rem' : '0.8rem'};color:#aaa;">${escapeHtml(os.servico || '-')}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:${isMobile ? '1rem' : '1.1rem'};font-weight:800;color:${cor};">${(ev.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div style="font-size:0.7rem;color:#888;margin-top:2px;">${escapeHtml(forma)}</div>
            </div>
          </div>
          ${isVenc ? `<div style="font-size:0.72rem;background:rgba(239,68,68,0.15);border:1px solid #ef44443a;border-radius:5px;padding:4px 8px;color:#ef4444;margin-bottom:8px;display:flex;align-items:center;gap:5px;"><i class="fas fa-exclamation-triangle"></i> Vencido há ${Math.abs(diasParaVencer(dateStr))} dia${Math.abs(diasParaVencer(dateStr)) !== 1 ? 's' : ''}</div>` : ''}
          ${isPago && os.dataPagamento ? `<div style="font-size:0.72rem;background:rgba(74,222,128,0.1);border:1px solid #4ade8030;border-radius:5px;padding:4px 8px;color:#4ade80;margin-bottom:8px;display:flex;align-items:center;gap:5px;"><i class="fas fa-check-circle"></i> Pago em ${formatarDataBR(toDateStr(os.dataPagamento))}</div>` : ''}
          <div style="display:flex;gap:${isMobile ? '4px' : '6px'};">
            <button onclick="fecharModalInspecoesDia();abrirOSDoEvento('${ev.osId}')"
              style="flex:1;padding:${isMobile ? '8px 4px' : '8px 10px'};font-size:${isMobile ? '0.72rem' : '0.78rem'};border:none;border-radius:5px;cursor:pointer;background:${cor};color:#111;font-weight:700;display:flex;align-items:center;justify-content:center;gap:4px;">
              <i class="fas fa-external-link-alt"></i> Ver/Editar OS
            </button>
            ${!isPago ? `
            <button onclick="fecharModalInspecoesDia();abrirModalPagamento('${ev.osId}')"
              style="flex:1;padding:${isMobile ? '8px 4px' : '8px 10px'};font-size:${isMobile ? '0.72rem' : '0.78rem'};border:none;border-radius:5px;cursor:pointer;background:#16a34a;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;gap:4px;">
              <i class="fas fa-credit-card"></i> Registrar Pgto
            </button>` : ''}
            <button onclick="gerarPDFEventoOS('${ev.osId}')"
              style="padding:${isMobile ? '8px' : '8px 12px'};font-size:${isMobile ? '0.72rem' : '0.78rem'};border:none;border-radius:5px;cursor:pointer;background:#374151;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;gap:4px;">
              <i class="fas fa-file-pdf"></i>
            </button>
          </div>
        </div>`;
  }).join('')}
    </div>`;

  const inspHTML = dayInsp.length > 0 ? `
    <div style="background:rgba(212,194,154,0.08);border-left:3px solid #D4C29A;padding:8px 12px;border-radius:4px;margin-bottom:12px;font-size:${isMobile ? '0.82rem' : '0.88rem'};color:#D4C29A;font-weight:600;">
      <i class="fas fa-calendar-check"></i> ${dayInsp.length} inspeç${dayInsp.length !== 1 ? 'ões' : 'ão'} agendada${dayInsp.length !== 1 ? 's' : ''}
    </div>
    <div style="max-height:${isMobile ? '38vh' : '42vh'};overflow-y:auto;margin-bottom:10px;">
      ${dayInsp.map(insp => `
        <div style="background:#2a2a2a;border:1px solid #404040;border-left:3px solid #D4C29A;border-radius:${isMobile ? '6px' : '8px'};padding:${isMobile ? '10px' : '12px'};margin-bottom:${isMobile ? '8px' : '10px'};">
          <div style="font-size:${isMobile ? '0.92rem' : '0.98rem'};font-weight:700;color:#D4C29A;margin-bottom:5px;word-wrap:break-word;">${escapeHtml(insp.clientName)}</div>
          <div style="font-size:0.65rem;color:#999;background:rgba(212,194,154,0.1);padding:2px 6px;border-radius:3px;display:inline-block;margin-bottom:8px;">${insp.clientType === 'predio' ? 'PRÉDIO' : 'EMPRESA'}</div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px;">
            <div style="color:#fff;font-size:${isMobile ? '0.78rem' : '0.83rem'};display:flex;align-items:center;gap:6px;"><i class="fas fa-clock" style="color:#D4C29A;width:14px;"></i>${insp.time}</div>
            <div style="color:#fff;font-size:${isMobile ? '0.78rem' : '0.83rem'};display:flex;align-items:flex-start;gap:6px;"><i class="fas fa-map-marker-alt" style="color:#D4C29A;width:14px;margin-top:2px;flex-shrink:0;"></i><span style="word-wrap:break-word;flex:1;">${escapeHtml(insp.address || 'Endereço não informado')}</span></div>
            ${insp.notes ? `<div style="color:#fff;font-size:${isMobile ? '0.78rem' : '0.83rem'};display:flex;align-items:flex-start;gap:6px;"><i class="fas fa-sticky-note" style="color:#D4C29A;width:14px;margin-top:2px;flex-shrink:0;"></i><span style="word-wrap:break-word;flex:1;">${escapeHtml(insp.notes)}</span></div>` : ''}
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:${isMobile ? '5px' : '6px'};">
            <button onclick='fecharModalInspecoesDia();abrirDetalhesInspecao(${JSON.stringify(insp).replace(/'/g, "&#39;")})' style="padding:${isMobile ? '8px 4px' : '6px'};font-size:${isMobile ? '0.72rem' : '0.78rem'};border:none;border-radius:5px;cursor:pointer;background:#D4C29A;color:#1a1a1a;font-weight:700;">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick='baixarPDFInspecao(${JSON.stringify(insp).replace(/'/g, "&#39;")})' style="padding:${isMobile ? '8px 4px' : '6px'};font-size:${isMobile ? '0.72rem' : '0.78rem'};border:none;border-radius:5px;cursor:pointer;background:#4CAF50;color:#fff;font-weight:700;">
              <i class="fas fa-file-pdf"></i>
            </button>
            <button onclick="deletarInspecao('${insp.id}')" style="padding:${isMobile ? '8px 4px' : '6px'};font-size:${isMobile ? '0.72rem' : '0.78rem'};border:none;border-radius:5px;cursor:pointer;background:#B32117;color:#fff;font-weight:700;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  ` : `
    <div style="text-align:center;padding:${isMobile ? '10px 8px' : '14px'};color:#555;font-size:${isMobile ? '0.85rem' : '0.9rem'};margin-bottom:8px;">
      <i class="fas fa-calendar-times" style="font-size:${isMobile ? '1.5rem' : '1.8rem'};color:#D4C29A40;display:block;margin-bottom:6px;"></i>
      Nenhuma inspeção agendada
    </div>`;

  modal.innerHTML = `
    <div style="background:#1a1a1a;border:2px solid #D4C29A;border-radius:${isMobile ? '10px' : '12px'};padding:${isMobile ? '15px' : '20px'};max-width:${isMobile ? '100%' : '640px'};margin:${isMobile ? '10px auto' : '20px auto'};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${isMobile ? '12px' : '18px'};padding-bottom:${isMobile ? '8px' : '12px'};border-bottom:1px solid #D4C29A;">
        <div style="font-size:${isMobile ? '1.1rem' : '1.3rem'};color:#D4C29A;font-weight:700;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-calendar-day"></i>
          ${day} de ${monthNames[month]}
        </div>
        <button onclick="fecharModalInspecoesDia()" style="background:none;border:none;color:#D4C29A;font-size:${isMobile ? '1.3rem' : '1.5rem'};cursor:pointer;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div style="max-height:${isMobile ? '75vh' : '72vh'};overflow-y:auto;padding-right:4px;">
        ${inspHTML}
        ${evFinHTML}
        ${dayEvs.length === 0 && dayInsp.length === 0 ? `
        <div style="text-align:center;padding:20px;color:#555;">
          <i class="fas fa-calendar" style="font-size:2.5rem;color:#D4C29A30;display:block;margin-bottom:10px;"></i>
          <div style="font-size:0.9rem;">Nenhum evento neste dia</div>
        </div>` : ''}
      </div>
      <div style="display:flex;gap:${isMobile ? '6px' : '8px'};flex-wrap:wrap;margin-top:${isMobile ? '12px' : '16px'};padding-top:12px;border-top:1px solid #333;">
        <button onclick="fecharModalInspecoesDia();abrirModalAgendamentoComData('${dateStr}')"
          style="flex:1;min-width:140px;background:#D4C29A;color:#1a1a1a;border:none;padding:${isMobile ? '10px 8px' : '11px 16px'};border-radius:${isMobile ? '6px' : '7px'};font-weight:700;cursor:pointer;font-size:${isMobile ? '0.8rem' : '0.85rem'};display:flex;align-items:center;justify-content:center;gap:6px;">
          <i class="fas fa-plus"></i> Agendar Inspeção
        </button>
        ${dayInsp.length > 0 ? `
        <button onclick="exportarDiaPDF('${dateStr}')"
          style="flex:1;min-width:130px;background:#374151;color:#fff;border:none;padding:${isMobile ? '10px 8px' : '11px 16px'};border-radius:${isMobile ? '6px' : '7px'};font-weight:700;cursor:pointer;font-size:${isMobile ? '0.8rem' : '0.85rem'};display:flex;align-items:center;justify-content:center;gap:6px;">
          <i class="fas fa-file-pdf"></i> PDF do Dia
        </button>` : ''}
      </div>
    </div>
  `;

  modal.style.display = 'block';
  modal.onclick = e => { if (e.target === modal) fecharModalInspecoesDia(); };
}

function fecharModalInspecoesDia() {
  const m = document.getElementById('modalInspecoesDia');
  if (m) m.style.display = 'none';
}

// ============================================================
// PAINEL FINANCEIRO
// ============================================================
function abrirPainelFinanceiro() {
  const isMobile = window.innerWidth < 768;
  const todos = calendarEventosOS;

  const vencidos = todos.filter(e => [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(e.tipo));
  const pendentes = todos.filter(e => [EVENTO_TIPO.BOLETO_PENDENTE, EVENTO_TIPO.PRAZO_PENDENTE, EVENTO_TIPO.CONTA_RECEBER, EVENTO_TIPO.PAGAMENTO_PREV].includes(e.tipo));
  const recebidos = todos.filter(e => [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO, EVENTO_TIPO.PARCELA_PAGA].includes(e.tipo));

  const totalVenc = vencidos.reduce((s, e) => s + e.valor, 0);
  const totalPend = pendentes.reduce((s, e) => s + e.valor, 0);
  const totalRec = recebidos.reduce((s, e) => s + e.valor, 0);

  const overlay = document.createElement('div');
  overlay.id = 'painelFinanceiroOverlay';
  Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
    background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: '10200', padding: isMobile ? '10px' : '20px',
    boxSizing: 'border-box', animation: 'fadeIn 0.2s ease'
  });

  function renderGrupo(lista, titulo, cor, icone) {
    if (!lista.length) return '';
    return `
      <div style="margin-bottom:20px;">
        <div style="color:${cor};font-size:${isMobile ? '0.85rem' : '0.9rem'};font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px;padding-bottom:8px;border-bottom:2px solid ${cor}30;">
          <i class="fas ${icone}" style="font-size:0.7rem;"></i>
          ${titulo} <span style="background:${cor}20;padding:2px 8px;border-radius:10px;font-size:0.75rem;">${lista.length}</span>
        </div>
        ${lista.map(ev => {
      const os = ev.os || {};
      const diff = diasParaVencer(ev.dateStr);
      return `
          <div style="background:#2a2a2a;border:1px solid #3a3a3a;border-left:3px solid ${cor};border-radius:8px;padding:12px;margin-bottom:8px;display:flex;flex-direction:${isMobile ? 'column' : 'row'};align-items:${isMobile ? 'flex-start' : 'center'};gap:10px;">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;color:#fff;margin-bottom:3px;word-wrap:break-word;">${escapeHtml(os.cliente || '-')}</div>
              <div style="font-size:11px;color:#888;display:flex;flex-wrap:wrap;gap:6px;">
                <span style="background:${cor}20;color:${cor};padding:1px 6px;border-radius:3px;font-weight:600;">${ev.label}</span>
                <span><i class="fas fa-calendar-alt" style="margin-right:3px;"></i>${formatarDataBR(ev.dateStr)}</span>
                ${!os.payment_status || os.payment_status !== 'Pago' ? (diff < 0 ? `<span style="color:#ef4444;">Atrasado ${Math.abs(diff)}d</span>` : diff <= 3 ? `<span style="color:#f59e0b;">Faltam ${diff}d</span>` : '') : ''}
                ${ev.tipo === EVENTO_TIPO.PAGAMENTO_PAGO || ev.tipo === EVENTO_TIPO.BOLETO_PAGO ? `<span style="color:#4ade80;"><i class="fas fa-check-circle"></i> Pago em ${formatarDataBR(toDateStr(os.dataPagamento))}</span>` : ''}
              </div>
              ${os.servico ? `<div style="font-size:11px;color:#666;margin-top:3px;">${escapeHtml(os.servico)}</div>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;${isMobile ? 'width:100%;justify-content:space-between;' : ''}">
              <div style="font-size:${isMobile ? '1.05rem' : '1.1rem'};font-weight:800;color:${cor};">${(ev.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div style="display:flex;gap:5px;">
                <button onclick="document.getElementById('painelFinanceiroOverlay').remove();abrirOSDoEvento('${ev.osId}')"
                  style="padding:6px 10px;background:#D4C29A;border:none;border-radius:5px;color:#111;font-size:12px;cursor:pointer;font-weight:700;" title="Ver OS">
                  <i class="fas fa-external-link-alt"></i>
                </button>
                ${[EVENTO_TIPO.BOLETO_PENDENTE, EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_PENDENTE, EVENTO_TIPO.PRAZO_VENCIDO, EVENTO_TIPO.CONTA_RECEBER].includes(ev.tipo) ? `
                <button onclick="document.getElementById('painelFinanceiroOverlay').remove();abrirModalPagamento('${ev.osId}')"
                  style="padding:6px 10px;background:#16a34a;border:none;border-radius:5px;color:#fff;font-size:12px;cursor:pointer;font-weight:700;" title="Registrar pagamento">
                  <i class="fas fa-check"></i>
                </button>` : ''}
                <button onclick="gerarPDFEventoOS('${ev.osId}')"
                  style="padding:6px 10px;background:#374151;border:none;border-radius:5px;color:#fff;font-size:12px;cursor:pointer;font-weight:700;" title="PDF">
                  <i class="fas fa-file-pdf"></i>
                </button>
              </div>
            </div>
          </div>`;
    }).join('')}
      </div>`;
  }

  overlay.innerHTML = `
    <div style="background:#1a1a1a;border:2px solid #D4C29A;border-radius:${isMobile ? '10px' : '14px'};max-width:760px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.9);animation:slideUp 0.3s ease;">
      <div style="padding:18px 24px;border-bottom:2px solid #D4C29A;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#1a1a1a;z-index:1;">
        <h3 style="color:#D4C29A;margin:0;font-size:${isMobile ? '16px' : '20px'};display:flex;align-items:center;gap:10px;">
          <i class="fas fa-dollar-sign"></i> Painel Financeiro — OS
        </h3>
        <button onclick="document.getElementById('painelFinanceiroOverlay').remove()" style="background:none;border:none;color:#999;font-size:20px;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:20px 24px;">
        <div style="background:rgba(212,194,154,0.08);border:1px solid rgba(212,194,154,0.2);border-radius:8px;padding:10px 14px;margin-bottom:18px;font-size:12px;color:#aaa;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-info-circle" style="color:#D4C29A;flex-shrink:0;"></i>
          Todos os eventos são gerados automaticamente a partir das Ordens de Serviço. Para criar ou editar, acesse a OS correspondente.
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
          <div style="background:#0d0d0d;border:1px solid #ef4444;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:5px;"><i class="fas fa-exclamation-triangle" style="color:#ef4444;margin-right:4px;"></i>Vencidos</div>
            <div style="font-size:${isMobile ? '16px' : '20px'};font-weight:800;color:#ef4444;">${totalVenc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div style="font-size:11px;color:#666;">${vencidos.length} OS</div>
          </div>
          <div style="background:#0d0d0d;border:1px solid #f59e0b;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:5px;"><i class="fas fa-clock" style="color:#f59e0b;margin-right:4px;"></i>A Receber</div>
            <div style="font-size:${isMobile ? '16px' : '20px'};font-weight:800;color:#f59e0b;">${totalPend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div style="font-size:11px;color:#666;">${pendentes.length} OS</div>
          </div>
          <div style="background:#0d0d0d;border:1px solid #4ade80;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:5px;"><i class="fas fa-check-circle" style="color:#4ade80;margin-right:4px;"></i>Recebidos</div>
            <div style="font-size:${isMobile ? '16px' : '20px'};font-weight:800;color:#4ade80;">${totalRec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div style="font-size:11px;color:#666;">${recebidos.length} OS</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
          <button onclick="gerarPDFRelatorioFinanceiro()" style="background:linear-gradient(135deg,#b91c1c,#dc2626);color:#fff;border:none;padding:10px 16px;border-radius:7px;font-weight:700;cursor:pointer;font-size:${isMobile ? '12px' : '13px'};display:flex;align-items:center;gap:6px;">
            <i class="fas fa-file-pdf"></i> Relatório PDF
          </button>
        </div>
        ${vencidos.length > 0 ? renderGrupo(vencidos, 'Vencidos / Atrasados', '#ef4444', 'fa-exclamation-triangle') : ''}
        ${pendentes.length > 0 ? renderGrupo(pendentes, 'Pendentes / A Receber', '#f59e0b', 'fa-clock') : ''}
        ${recebidos.length > 0 ? renderGrupo(recebidos, 'Recebidos / Liquidados', '#4ade80', 'fa-check-circle') : ''}
        ${todos.length === 0 ? `<div style="text-align:center;padding:30px;color:#555;"><i class="fas fa-dollar-sign" style="font-size:2.5rem;color:#D4C29A30;display:block;margin-bottom:12px;"></i>Nenhum evento financeiro encontrado</div>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

// ============================================================
// PDF — Evento/OS individual
// ============================================================
async function gerarPDFEventoOS(osId) {
  if (typeof gerarPDFOrdem === 'function') {
    mostrarOpcoesPDF(osId);
  } else {
    showToast('Acesse o módulo de OS para gerar o PDF.', 'info');
  }
}

// ============================================================
// PDF — Relatório financeiro completo
// ============================================================
async function gerarPDFRelatorioFinanceiro() {
  showToast('Gerando relatório financeiro...', 'info');
  const todos = calendarEventosOS;
  const vencidos = todos.filter(e => [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(e.tipo));
  const pendentes = todos.filter(e => [EVENTO_TIPO.BOLETO_PENDENTE, EVENTO_TIPO.PRAZO_PENDENTE, EVENTO_TIPO.CONTA_RECEBER, EVENTO_TIPO.PAGAMENTO_PREV].includes(e.tipo));
  const recebidos = todos.filter(e => [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO].includes(e.tipo));

  const totalVenc = vencidos.reduce((s, e) => s + e.valor, 0);
  const totalPend = pendentes.reduce((s, e) => s + e.valor, 0);
  const totalRec = recebidos.reduce((s, e) => s + e.valor, 0);
  const totalGeral = totalVenc + totalPend + totalRec;

  const renderLinhas = lista => lista.map((ev, i) => {
    const os = ev.os || {};
    const cor = [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO].includes(ev.tipo) ? '#16a34a'
      : [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(ev.tipo) ? '#dc2626' : '#d97706';
    const bg = i % 2 === 0 ? '#fff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:6px 8px;font-weight:600;">${escapeHtml(os.cliente || '-')}</td>
      <td style="padding:6px 8px;font-size:9px;">${ev.label}</td>
      <td style="padding:6px 8px;">${formatarDataBR(ev.dateStr)}</td>
      <td style="padding:6px 8px;">${escapeHtml(os.payment_method || os.formaPagamento || '-')}</td>
      <td style="padding:6px 8px;color:${cor};font-weight:700;text-align:right;">${(ev.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
    </tr>`;
  }).join('');

  const html = calPdfHtmlShell(`
    <div class="pdf-nota-page">
      ${calPdfHeader({
    titulo: '<i class="fas fa-chart-line"></i> RELATÓRIO FINANCEIRO — OS',
    subtitulo: `Emitido em: ${new Date().toLocaleString('pt-BR')} | Gerado automaticamente pelo sistema`,
    rightLines: [`Total OS: ${todos.length}`, `Período: Todos`]
  })}
      <div class="pdf-nota-body">
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title vermelho"><i class="fas fa-tachometer-alt"></i> RESUMO GERAL</div>
          <div class="pdf-nota-section-content">
            <div class="pdf-nota-resumo-compact">
              <div class="pdf-nota-resumo-item destaque">
                <div class="pdf-nota-resumo-label"><i class="fas fa-exclamation-triangle"></i> Vencidos</div>
                <div class="pdf-nota-resumo-valor" style="color:#dc2626;">${totalVenc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item">
                <div class="pdf-nota-resumo-label"><i class="fas fa-clock"></i> A Receber</div>
                <div class="pdf-nota-resumo-valor" style="color:#d97706;">${totalPend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item verde">
                <div class="pdf-nota-resumo-label"><i class="fas fa-check-circle"></i> Recebidos</div>
                <div class="pdf-nota-resumo-valor" style="color:#16a34a;">${totalRec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item">
                <div class="pdf-nota-resumo-label"><i class="fas fa-sigma"></i> Total</div>
                <div class="pdf-nota-resumo-valor">${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            </div>
          </div>
        </div>
        ${vencidos.length > 0 ? `
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title vermelho"><i class="fas fa-exclamation-triangle"></i> VENCIDOS / ATRASADOS (${vencidos.length})</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead><tr><th>Cliente</th><th>Tipo</th><th>Vencimento</th><th>Forma</th><th style="text-align:right;">Valor</th></tr></thead>
              <tbody>${renderLinhas(vencidos)}</tbody>
              <tfoot><tr><td colspan="4" style="text-align:right;">SUBTOTAL:</td><td style="text-align:right;">${totalVenc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr></tfoot>
            </table>
          </div>
        </div>` : ''}
        ${pendentes.length > 0 ? `
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title amarelo"><i class="fas fa-clock"></i> PENDENTES / A RECEBER (${pendentes.length})</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead><tr><th>Cliente</th><th>Tipo</th><th>Vencimento</th><th>Forma</th><th style="text-align:right;">Valor</th></tr></thead>
              <tbody>${renderLinhas(pendentes)}</tbody>
              <tfoot><tr><td colspan="4" style="text-align:right;">SUBTOTAL:</td><td style="text-align:right;">${totalPend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr></tfoot>
            </table>
          </div>
        </div>` : ''}
        ${recebidos.length > 0 ? `
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title verde"><i class="fas fa-check-circle"></i> RECEBIDOS / LIQUIDADOS (${recebidos.length})</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead><tr><th>Cliente</th><th>Tipo</th><th>Data Pgto.</th><th>Forma</th><th style="text-align:right;">Valor</th></tr></thead>
              <tbody>${renderLinhas(recebidos)}</tbody>
              <tfoot><tr><td colspan="4" style="text-align:right;">SUBTOTAL:</td><td style="text-align:right;">${totalRec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr></tfoot>
            </table>
          </div>
        </div>` : ''}
      </div>
      ${calPdfFooter()}
    </div>
  `);

  await calRenderizarEBaixarPDF(html, `Relatorio_Financeiro_EXTINMAIS_${Date.now()}.pdf`);
  showToast('Relatório financeiro gerado!', 'success');
}

// ============================================================
// PDF DO DIA
// ============================================================
async function exportarDiaPDF(dateStr) {
  const [ano, mes, dia] = dateStr.split('-');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const nomeMes = monthNames[parseInt(mes) - 1];

  const dayInsp = calendarInspections.filter(i => i.date === dateStr)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const dayEvs = calendarEventosOS.filter(e => e.dateStr === dateStr);

  if (dayInsp.length === 0 && dayEvs.length === 0) {
    showToast('Nenhum evento neste dia', 'warning');
    return;
  }
  showToast(`Gerando PDF do dia ${dia}/${mes}/${ano}...`, 'info');

  const linhasInsp = dayInsp.map((insp, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:7px 10px;font-weight:700;color:#b32117;text-align:center;">${String(i + 1).padStart(3, '0')}</td>
      <td style="padding:7px 10px;font-weight:600;">${escapeHtml(insp.clientName)}</td>
      <td style="padding:7px 10px;">${insp.clientType === 'predio' ? 'PRÉDIO' : 'EMPRESA'}</td>
      <td style="padding:7px 10px;text-align:center;">${insp.time}</td>
      <td style="padding:7px 10px;">${escapeHtml(insp.address || '-')}</td>
      <td style="padding:7px 10px;text-align:center;"><span class="badge-pendente">Agendado</span></td>
    </tr>`;
  }).join('');

  const linhasEv = dayEvs.map((ev, i) => {
    const os = ev.os || {};
    const cor = [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO].includes(ev.tipo) ? 'badge-pago'
      : [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(ev.tipo) ? 'badge-vencido' : 'badge-pendente';
    const bg = i % 2 === 0 ? '#fff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:7px 10px;font-weight:600;">${escapeHtml(os.cliente || '-')}</td>
      <td style="padding:7px 10px;font-size:9px;">${ev.label}</td>
      <td style="padding:7px 10px;">${escapeHtml(os.payment_method || os.formaPagamento || '-')}</td>
      <td style="padding:7px 10px;color:#16a34a;font-weight:700;text-align:right;">${(ev.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      <td style="padding:7px 10px;text-align:center;"><span class="${cor}">${[EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO].includes(ev.tipo) ? 'Pago' : [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(ev.tipo) ? 'Vencido' : 'Pendente'}</span></td>
    </tr>`;
  }).join('');

  const html = calPdfHtmlShell(`
    <div class="pdf-nota-page">
      ${calPdfHeader({
    titulo: `<i class="fas fa-calendar-day"></i> AGENDA DO DIA — ${dia}/${mes}/${ano}`,
    subtitulo: `${dia} de ${nomeMes} de ${ano} | ${dayInsp.length} inspeç${dayInsp.length !== 1 ? 'ões' : 'ão'} · ${dayEvs.length} evento${dayEvs.length !== 1 ? 's' : ''} financeiro${dayEvs.length !== 1 ? 's' : ''}`,
    rightLines: [`Emitido: ${new Date().toLocaleDateString('pt-BR')}`]
  })}
      <div class="pdf-nota-body">
        ${dayInsp.length > 0 ? `
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title vermelho"><i class="fas fa-calendar-check"></i> INSPEÇÕES AGENDADAS (${dayInsp.length})</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead><tr><th style="text-align:center;width:6%;">Nº</th><th>Empresa</th><th>Tipo</th><th style="text-align:center;">Hora</th><th>Endereço</th><th style="text-align:center;">Status</th></tr></thead>
              <tbody>${linhasInsp}</tbody>
            </table>
          </div>
        </div>` : ''}
        ${dayEvs.length > 0 ? `
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title amarelo"><i class="fas fa-dollar-sign"></i> MOVIMENTAÇÕES FINANCEIRAS — OS (${dayEvs.length})</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead><tr><th>Cliente</th><th>Tipo</th><th>Forma</th><th style="text-align:right;">Valor</th><th style="text-align:center;">Status</th></tr></thead>
              <tbody>${linhasEv}</tbody>
              <tfoot><tr><td colspan="3" style="text-align:right;">TOTAL:</td><td style="text-align:right;">${dayEvs.reduce((s, e) => s + e.valor, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td></td></tr></tfoot>
            </table>
          </div>
        </div>` : ''}
      </div>
      ${calPdfFooter()}
    </div>
  `);

  await calRenderizarEBaixarPDF(html, `Agenda_${dia}_${mes}_${ano}_EXTINMAIS.pdf`);
  showToast(`PDF do dia ${dia}/${mes} gerado!`, 'success');
}

// ============================================================
// PDF DO MÊS
// ============================================================
async function exportarMesPDF() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const nomeMes = monthNames[month];
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthInsp = calendarInspections.filter(i => i.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  const monthEvs = calendarEventosOS.filter(e => (e.dateStr || '').startsWith(monthStr));

  if (monthInsp.length === 0 && monthEvs.length === 0) {
    showToast('Nenhum evento neste mês', 'warning');
    return;
  }
  showToast(`Gerando PDF de ${nomeMes}/${year}...`, 'info');

  const totalEvs = monthEvs.reduce((s, e) => s + e.valor, 0);
  const totalRec = monthEvs.filter(e => [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO].includes(e.tipo)).reduce((s, e) => s + e.valor, 0);
  const totalVenc = monthEvs.filter(e => [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(e.tipo)).reduce((s, e) => s + e.valor, 0);
  const totalPend = totalEvs - totalRec - totalVenc;

  const linhasInsp = monthInsp.map((insp, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:6px 8px;font-weight:600;">${escapeHtml(insp.clientName)}</td>
      <td style="padding:6px 8px;">${insp.clientType === 'predio' ? 'PRÉDIO' : 'EMPRESA'}</td>
      <td style="padding:6px 8px;">${formatarDataBR(insp.date)}</td>
      <td style="padding:6px 8px;text-align:center;">${insp.time}</td>
      <td style="padding:6px 8px;">${escapeHtml(insp.address || '-')}</td>
    </tr>`;
  }).join('');

  const linhasEvs = monthEvs.map((ev, i) => {
    const os = ev.os || {};
    const cor = [EVENTO_TIPO.PAGAMENTO_PAGO, EVENTO_TIPO.BOLETO_PAGO].includes(ev.tipo) ? '#16a34a'
      : [EVENTO_TIPO.BOLETO_VENCIDO, EVENTO_TIPO.PRAZO_VENCIDO].includes(ev.tipo) ? '#dc2626' : '#d97706';
    const bg = i % 2 === 0 ? '#fff' : '#f9fafb';
    return `<tr style="background:${bg};">
      <td style="padding:6px 8px;font-weight:600;">${escapeHtml(os.cliente || '-')}</td>
      <td style="padding:6px 8px;font-size:9px;">${ev.label}</td>
      <td style="padding:6px 8px;">${formatarDataBR(ev.dateStr)}</td>
      <td style="padding:6px 8px;">${escapeHtml(os.payment_method || os.formaPagamento || '-')}</td>
      <td style="padding:6px 8px;color:${cor};font-weight:700;text-align:right;">${(ev.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
    </tr>`;
  }).join('');

  const html = calPdfHtmlShell(`
    <div class="pdf-nota-page">
      ${calPdfHeader({
    titulo: `<i class="fas fa-calendar-alt"></i> CALENDÁRIO — ${nomeMes.toUpperCase()} ${year}`,
    subtitulo: `${monthInsp.length} inspeções · ${monthEvs.length} eventos financeiros`,
    rightLines: [`Emitido: ${new Date().toLocaleDateString('pt-BR')}`]
  })}
      <div class="pdf-nota-body">
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title vermelho"><i class="fas fa-tachometer-alt"></i> RESUMO DO MÊS</div>
          <div class="pdf-nota-section-content">
            <div class="pdf-nota-resumo-compact">
              <div class="pdf-nota-resumo-item destaque">
                <div class="pdf-nota-resumo-label"><i class="fas fa-calendar-check"></i> Inspeções</div>
                <div class="pdf-nota-resumo-valor">${monthInsp.length}</div>
              </div>
              <div class="pdf-nota-resumo-item">
                <div class="pdf-nota-resumo-label"><i class="fas fa-dollar-sign"></i> Total OS</div>
                <div class="pdf-nota-resumo-valor">${totalEvs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item verde">
                <div class="pdf-nota-resumo-label"><i class="fas fa-check-circle"></i> Recebido</div>
                <div class="pdf-nota-resumo-valor" style="color:#16a34a;">${totalRec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item ${totalVenc > 0 ? 'destaque' : ''}">
                <div class="pdf-nota-resumo-label"><i class="fas fa-exclamation-triangle"></i> Vencidos</div>
                <div class="pdf-nota-resumo-valor" style="color:${totalVenc > 0 ? '#dc2626' : '#16a34a'};">${totalVenc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            </div>
          </div>
        </div>
        ${monthInsp.length > 0 ? `
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title"><i class="fas fa-list-alt"></i> INSPEÇÕES</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead><tr><th>Empresa</th><th>Tipo</th><th>Data</th><th style="text-align:center;">Hora</th><th>Endereço</th></tr></thead>
              <tbody>${linhasInsp}</tbody>
            </table>
          </div>
        </div>` : ''}
        ${monthEvs.length > 0 ? `
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title amarelo"><i class="fas fa-dollar-sign"></i> MOVIMENTAÇÕES FINANCEIRAS</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead><tr><th>Cliente</th><th>Tipo</th><th>Data</th><th>Forma</th><th style="text-align:right;">Valor</th></tr></thead>
              <tbody>${linhasEvs}</tbody>
              <tfoot><tr><td colspan="4" style="text-align:right;">TOTAL DO MÊS:</td><td style="text-align:right;">${totalEvs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr></tfoot>
            </table>
          </div>
        </div>` : ''}
      </div>
      ${calPdfFooter()}
    </div>
  `);

  await calRenderizarEBaixarPDF(html, `Calendario_${nomeMes}_${year}_EXTINMAIS.pdf`);
  showToast(`PDF de ${nomeMes} gerado!`, 'success');
}

// ============================================================
// MODAL DE DETALHES DA INSPEÇÃO
// ============================================================
function abrirDetalhesInspecao(inspection) {
  const content = document.getElementById('inspectionDetailContent');
  if (!content) return;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div style="background:#2a2a2a;padding:18px;border-radius:10px;border:2px solid #D4C29A;">
        <h3 style="color:#D4C29A;margin-bottom:14px;display:flex;align-items:center;gap:10px;"><i class="fas fa-building"></i> Informações do Cliente</h3>
        <div style="display:grid;gap:10px;">
          <div><strong style="color:#D4C29A;">Nome:</strong> <span style="color:#fff;margin-left:8px;">${escapeHtml(inspection.clientName)}</span></div>
          <div><strong style="color:#D4C29A;">Tipo:</strong> <span style="color:#fff;margin-left:8px;">${inspection.clientType === 'predio' ? 'PRÉDIO' : 'EMPRESA'}</span></div>
          <div><strong style="color:#D4C29A;">CNPJ:</strong> <span style="color:#fff;margin-left:8px;">${escapeHtml(inspection.cnpj || 'Não informado')}</span></div>
          <div style="word-wrap:break-word;"><strong style="color:#D4C29A;">Endereço:</strong> <span style="color:#fff;margin-left:8px;">${escapeHtml(inspection.address || 'Não informado')}</span></div>
        </div>
      </div>
      <div style="background:#2a2a2a;padding:18px;border-radius:10px;border:2px solid #D4C29A;">
        <h3 style="color:#D4C29A;margin-bottom:14px;display:flex;align-items:center;gap:10px;"><i class="fas fa-calendar-check"></i> Dados da Inspeção</h3>
        <div style="display:grid;gap:10px;">
          <div><strong style="color:#D4C29A;">Data:</strong> <span style="color:#fff;margin-left:8px;">${formatarDataBR(inspection.date)}</span></div>
          <div><strong style="color:#D4C29A;">Horário:</strong> <span style="color:#fff;margin-left:8px;">${inspection.time}</span></div>
          <div><strong style="color:#D4C29A;">Agendado por:</strong> <span style="color:#fff;margin-left:8px;">${escapeHtml(inspection.createdBy || 'Sistema')}</span></div>
          ${inspection.notes ? `<div style="word-wrap:break-word;"><strong style="color:#D4C29A;">Observações:</strong><div style="color:#fff;margin-top:6px;padding:8px;background:#1a1a1a;border-radius:6px;white-space:pre-wrap;">${escapeHtml(inspection.notes)}</div></div>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-info" onclick='baixarPDFInspecao(${JSON.stringify(inspection).replace(/'/g, "&#39;")})' style="flex:1;min-width:130px;"><i class="fas fa-file-pdf"></i> Baixar PDF</button>
        <button class="btn" onclick="fecharModalDetalhes()" style="flex:1;min-width:130px;background:#6b7280;"><i class="fas fa-times"></i> Fechar</button>
        <button class="btn" onclick="deletarInspecao('${inspection.id}')" style="flex:1;min-width:130px;background:#B32117;"><i class="fas fa-trash"></i> Excluir</button>
      </div>
    </div>
  `;

  document.getElementById('inspectionDetailModal').style.display = 'block';
}

function fecharModalDetalhes() {
  const m = document.getElementById('inspectionDetailModal');
  if (m) m.style.display = 'none';
}

// ============================================================
// MODAL DE AGENDAMENTO DE INSPEÇÕES
// ============================================================
async function abrirModalAgendamento() {
  selectedDateForSchedule = null;
  await loadClientsForSchedule();
  document.getElementById('scheduleForm').reset();
  ['scheduleClientId', 'scheduleClientName', 'scheduleClientType'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const today = new Date().toISOString().split('T')[0];
  const dateEl = document.getElementById('scheduleDate');
  if (dateEl) { dateEl.setAttribute('min', today); dateEl.value = ''; }
  document.getElementById('scheduleModal').style.display = 'block';
}

async function abrirModalAgendamentoComData(dateStr) {
  selectedDateForSchedule = dateStr;
  await loadClientsForSchedule();
  document.getElementById('scheduleForm').reset();
  ['scheduleClientId', 'scheduleClientName', 'scheduleClientType'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const today = new Date().toISOString().split('T')[0];
  const dateEl = document.getElementById('scheduleDate');
  if (dateEl) { dateEl.setAttribute('min', today); dateEl.value = dateStr; }
  document.getElementById('scheduleModal').style.display = 'block';
}

function fecharModalAgendamento() {
  document.getElementById('scheduleModal').style.display = 'none';
  selectedDateForSchedule = null;
}

async function loadClientsForSchedule() {
  try {
    const [compSnap, buildSnap] = await Promise.all([
      database.ref('companies').once('value'),
      database.ref('buildings').once('value')
    ]);
    const companies = compSnap.val() || {};
    const buildings = buildSnap.val() || {};
    const select = document.getElementById('scheduleClientSelect');
    select.innerHTML = '<option value="">Selecione um cliente</option>';

    Object.keys(companies).forEach(key => {
      const c = companies[key];
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `[EMPRESA] ${c.razao_social || 'Sem nome'}`;
      opt.dataset.nome = c.razao_social || '';
      opt.dataset.tipo = 'empresa';
      opt.dataset.cnpj = c.cnpj || '';
      opt.dataset.endereco = `${c.endereco || ''}, ${c.numero_empresa || ''}`.trim();
      select.appendChild(opt);
    });

    Object.keys(buildings).forEach(key => {
      const b = buildings[key];
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `[PRÉDIO] ${b.razao_social_predio || 'Sem nome'}`;
      opt.dataset.nome = b.razao_social_predio || '';
      opt.dataset.tipo = 'predio';
      opt.dataset.cnpj = b.cnpj_predio || '';
      opt.dataset.endereco = `${b.endereco_predio || ''}, ${b.numero_predio || ''}`.trim();
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    showToast('Erro ao carregar lista de clientes', 'error');
  }
}

async function salvarAgendamento(e) {
  e.preventDefault();
  const dados = {
    clientId: document.getElementById('scheduleClientId').value,
    clientName: document.getElementById('scheduleClientName').value,
    clientType: document.getElementById('scheduleClientType').value,
    date: document.getElementById('scheduleDate').value,
    time: document.getElementById('scheduleTime').value,
    address: document.getElementById('scheduleAddress').value,
    cnpj: document.getElementById('scheduleCNPJ').value,
    notes: document.getElementById('scheduleNotes').value,
    createdAt: new Date().toISOString(),
    createdBy: (typeof currentUser !== 'undefined' && currentUser?.nome) || 'Sistema'
  };
  try {
    await database.ref('scheduled_inspections').push(dados);
    showToast('Inspeção agendada com sucesso!', 'success');
    fecharModalAgendamento();
    await carregarInspecoesAgendadas();
    renderCalendar();
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    showToast('Erro ao agendar inspeção', 'error');
  }
}

async function deletarInspecao(inspectionId) {
  if (!confirm('Tem certeza que deseja excluir esta inspeção?')) return;
  try {
    await database.ref(`scheduled_inspections/${inspectionId}`).remove();
    showToast('Inspeção excluída!', 'success');
    fecharModalDetalhes();
    fecharModalInspecoesDia();
    await carregarInspecoesAgendadas();
    renderCalendar();
  } catch (error) {
    console.error('Erro ao excluir inspeção:', error);
    showToast('Erro ao excluir inspeção', 'error');
  }
}

// ============================================================
// PDF INSPEÇÃO INDIVIDUAL
// ============================================================
async function baixarPDFInspecao(inspection) {
  try {
    showToast('Gerando PDF da inspeção...', 'info');
    const html = calPdfHtmlShell(`
      <div class="pdf-nota-page">
        ${calPdfHeader({
      titulo: '<i class="fas fa-calendar-check"></i> AGENDAMENTO DE INSPEÇÃO',
      subtitulo: `${escapeHtml(inspection.clientName)} — ${formatarDataBR(inspection.date)}`,
      rightLines: [`Data: ${formatarDataBR(inspection.date)}`, `Hora: ${inspection.time}`, `Emissão: ${new Date().toLocaleDateString('pt-BR')}`]
    })}
        <div class="pdf-nota-body">
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title vermelho"><i class="fas fa-building"></i> DADOS DO CLIENTE</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-dados-inline">
                <div class="pdf-nota-dado-item destaque"><div class="pdf-nota-dado-label">Nome / Razão Social</div><div class="pdf-nota-dado-valor">${escapeHtml(inspection.clientName)}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">Tipo</div><div class="pdf-nota-dado-valor">${inspection.clientType === 'predio' ? 'PRÉDIO' : 'EMPRESA'}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">CNPJ/CPF</div><div class="pdf-nota-dado-valor">${escapeHtml(inspection.cnpj || 'Não informado')}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">Endereço</div><div class="pdf-nota-dado-valor">${escapeHtml(inspection.address || 'Não informado')}</div></div>
              </div>
            </div>
          </div>
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-calendar-check"></i> DADOS DA INSPEÇÃO</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-resumo-compact">
                <div class="pdf-nota-resumo-item destaque"><div class="pdf-nota-resumo-label"><i class="fas fa-calendar"></i> Data</div><div class="pdf-nota-resumo-valor">${formatarDataBR(inspection.date)}</div></div>
                <div class="pdf-nota-resumo-item"><div class="pdf-nota-resumo-label"><i class="fas fa-clock"></i> Horário</div><div class="pdf-nota-resumo-valor">${inspection.time}</div></div>
                <div class="pdf-nota-resumo-item"><div class="pdf-nota-resumo-label"><i class="fas fa-user"></i> Agendado por</div><div class="pdf-nota-resumo-valor" style="font-size:10px;">${escapeHtml(inspection.createdBy || 'Sistema')}</div></div>
              </div>
            </div>
          </div>
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-list-check"></i> ITENS A VERIFICAR</div>
            <div class="pdf-nota-section-content" style="padding:0;">
              <table class="pdf-tabela">
                <thead><tr><th style="width:8%;text-align:center;">Nº</th><th>Item</th><th style="width:25%;text-align:center;">Status</th></tr></thead>
                <tbody>
                  ${['EPI — Equipamentos de Proteção Individual', 'Extintores de Incêndio', 'Saídas de Emergência', 'Inspeção de Máquinas e Equipamentos', 'Condições de Limpeza e Higiene', 'Sinalização de Segurança', 'Registros e Documentações'].map((item, i) => `
                  <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'};">
                    <td style="padding:7px 10px;font-weight:700;color:#b32117;text-align:center;">${String(i + 1).padStart(2, '0')}</td>
                    <td style="padding:7px 10px;font-weight:600;">${item}</td>
                    <td style="padding:7px 10px;text-align:center;"><span class="badge-pendente">Pendente</span></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
          ${inspection.notes ? `<div class="pdf-nota-section"><div class="pdf-nota-section-title"><i class="fas fa-sticky-note"></i> OBSERVAÇÕES</div><div class="pdf-nota-section-content"><p style="font-size:11px;line-height:1.6;color:#374151;">${escapeHtml(inspection.notes)}</p></div></div>` : ''}
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-pen-square"></i> ASSINATURAS</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-assinaturas">
                <div class="pdf-nota-assinatura-campo">
                  <div class="pdf-nota-assinatura-linha"></div>
                  <div class="pdf-nota-assinatura-nome">Técnico Responsável</div>
                  <div class="pdf-nota-assinatura-info">EXTINMAIS${(window.currentUser && window.currentUser.cnpj) ? '<br>CNPJ: ' + window.currentUser.cnpj : ''}${(window.currentUser && window.currentUser.telefone) ? '<br>' + window.currentUser.telefone : ''}</div>
                </div>
                <div class="pdf-nota-assinatura-campo">
                  <div class="pdf-nota-assinatura-linha"></div>
                  <div class="pdf-nota-assinatura-nome">Responsável pelo Local</div>
                  <div class="pdf-nota-assinatura-info">${escapeHtml(inspection.clientName)}<br>CNPJ: ${escapeHtml(inspection.cnpj || '_____________________')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${calPdfFooter()}
      </div>
    `);
    await calRenderizarEBaixarPDF(html, `Inspecao_${inspection.clientName.replace(/[^a-z0-9]/gi, '_')}_${inspection.date}.pdf`);
    showToast('PDF da inspeção gerado!', 'success');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    showToast('Erro ao gerar PDF', 'error');
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupCalendarEventListeners() {
  function replaceBtn(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const clone = el.cloneNode(true);
    el.replaceWith(clone);
    return clone;
  }

  const prevBtn = replaceBtn('prevMonthBtn');
  const nextBtn = replaceBtn('nextMonthBtn');
  const addBtn = replaceBtn('addScheduleBtn');
  const exportBtn = replaceBtn('exportMonthPDFBtn');
  const painelFinBtn = replaceBtn('painelFinanceiroBtn');

  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
    renderCalendar();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
    renderCalendar();
  });

  if (addBtn) addBtn.addEventListener('click', abrirModalAgendamento);
  if (exportBtn) exportBtn.addEventListener('click', exportarMesPDF);
  if (painelFinBtn) painelFinBtn.addEventListener('click', abrirPainelFinanceiro);

  const schedForm = document.getElementById('scheduleForm');
  if (schedForm) schedForm.addEventListener('submit', salvarAgendamento);

  const schedSel = document.getElementById('scheduleClientSelect');
  if (schedSel) schedSel.addEventListener('change', function () {
    const opt = this.options[this.selectedIndex];
    if (opt.value) {
      document.getElementById('scheduleClientId').value = opt.value;
      document.getElementById('scheduleClientName').value = opt.dataset.nome || '';
      document.getElementById('scheduleClientType').value = opt.dataset.tipo || 'empresa';
      document.getElementById('scheduleCNPJ').value = opt.dataset.cnpj || '';
      document.getElementById('scheduleAddress').value = opt.dataset.endereco || '';
    }
  });
}


// ========================================
