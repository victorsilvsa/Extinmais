// Versão com: Toggle por Mês, PDF por Mês, Assinatura, Lucro por Produto,
// Pagamento a Prazo, Avisos de Boleto, Relatórios, Recibo de Quitação

let allOrders = [];
// ============================= 
// CARREGAR ORDENS DO FIREBASE
// ============================= 
async function loadOrders() {
  try {
    const snapshot = await database.ref('orders').once('value');
    const orders = snapshot.val() || {};

    allOrders = Object.entries(orders).map(([id, data]) => {
      const os = data || {};
      const products = Array.isArray(os.products) ? os.products : [];

      let subtotal = Number(os.subtotal);
      if (!subtotal || isNaN(subtotal)) {
        subtotal = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.qty)), 0);
      }

      const profitPercent = Number(os.profitPercent) || 0;
      const profitValue = subtotal * (profitPercent / 100);

      let total = Number(os.total);
      if (!total || isNaN(total)) {
        total = subtotal + profitValue;
      }

      return {
        id, ...os, products, subtotal, profitPercent, profitValue, total,
        preco: total || Number(os.preco) || 0
      };
    });

    renderFilteredOrders();
    verificarAvisosVencimento();

  } catch (err) {
    console.error('Erro ao carregar orders:', err);
    showToast('Erro ao carregar ordens', 'error');
  }
}

// ============================= 
// LISTENER FIREBASE
// ============================= 
firebase.database().ref('orders').on('value', (snapshot) => {
  allOrders = [];
  const data = snapshot.val();

  if (data) {
    Object.keys(data).forEach(key => {
      allOrders.push({ id: key, ...data[key] });
    });
  }

  allOrders.sort((a, b) => {
    const dateA = new Date(a.data || 0).getTime();
    const dateB = new Date(b.data || 0).getTime();
    return dateB - dateA;
  });

  renderFilteredOrders();

  if (typeof updateDashboard === 'function') updateDashboard();
});
// ============================= 
// AGRUPAR PRODUTOS DUPLICADOS
// ============================= 
function agruparProdutos(produtos) {
  const agrupados = {};
  produtos.forEach(p => {
    const key = p.id || p.name;
    if (agrupados[key]) {
      agrupados[key].qty += Number(p.qty) || 0;
    } else {
      agrupados[key] = {
        id: p.id, name: p.name,
        price: Number(p.price) || 0,
        qty: Number(p.qty) || 0
      };
    }
  });
  return Object.values(agrupados);
}

// ============================= 
// AGRUPAR ORDENS POR MÊS
// ============================= 
function agruparOrdensPorMes(orders) {
  const grupos = {};
  orders.forEach(os => {
    const d = os.data ? new Date(os.data) : new Date(0);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!grupos[chave]) grupos[chave] = { label, chave, items: [] };
    grupos[chave].items.push(os);
  });
  return Object.values(grupos).sort((a, b) => b.chave.localeCompare(a.chave));
}

// ============================= 
// RENDERIZAR ORDENS FILTRADAS (COM TOGGLE POR MÊS)
// ============================= 
function renderFilteredOrders() {
  const list = document.getElementById('ordersList');
  if (!list) return;

  list.innerHTML = '';

  const search = (document.getElementById('orderSearch')?.value || '').toLowerCase();
  const activeFilterBtn = document.querySelector('#ordersSection .filter-btn.active');
  const activeFilter = activeFilterBtn?.dataset?.filter || 'all';

  const filtered = allOrders.filter(os => {
    const cliente = (os.cliente || '').toLowerCase();
    const servico = (os.servico || '').toLowerCase();
    const cnpj = (os.cnpj || '').toLowerCase();
    const matchesText = cliente.includes(search) || servico.includes(search) || cnpj.includes(search);
    const statusRaw = (os.status || os.estado || os.completed || 'Pendente').toString().toLowerCase();
    let matchesStatus = true;
    if (activeFilter === 'completed') matchesStatus = /conclu|finaliz|true/.test(statusRaw);
    if (activeFilter === 'pending') matchesStatus = !/conclu|finaliz|true/.test(statusRaw);
    return matchesText && matchesStatus;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>Nenhuma ordem de serviço encontrada</p></div>`;
    return;
  }

  const grupos = agruparOrdensPorMes(filtered);

  grupos.forEach(grupo => {
    const totalMes = grupo.items.reduce((acc, os) => acc + (Number(os.total) || Number(os.preco) || 0), 0);
    const totalMesFmt = totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const qtdMes = grupo.items.length;

    // ===== CABEÇALHO DO MÊS =====
    const mesHeader = document.createElement('div');
    mesHeader.style.cssText = `
      display: flex; align-items: center; margin: 32px 0 0 0; position: relative; cursor: pointer;
    `;
    mesHeader.onclick = () => toggleMes(grupo.chave);
    mesHeader.innerHTML = `
      <div style="flex:1;height:2px;background:linear-gradient(to right,transparent,#D4C29A);box-shadow:0 0 6px rgba(212,194,154,0.35);"></div>
      <div style="
        position:relative;background:linear-gradient(135deg,#2a2a2a 0%,#1a1a1a 100%);
        border-radius:40px;padding:10px 24px;margin:0 16px;
        box-shadow:0 6px 24px rgba(0,0,0,0.55),0 0 0 1px rgba(212,194,154,0.25);
        display:flex;align-items:center;gap:12px;overflow:hidden;user-select:none;
      ">
        <div style="
          background:linear-gradient(135deg,#D4C29A 0%,#B8A47E 100%);
          width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 10px rgba(212,194,154,0.35);
        ">
          <i class="fas fa-calendar-alt" style="color:#0d0d0d;font-size:15px;"></i>
        </div>
        <div style="min-width:0;">
          <div style="color:#D4C29A;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1.4px;opacity:0.7;margin-bottom:1px;">
            ${qtdMes} OS &bull; ${totalMesFmt}
          </div>
          <div style="color:#fff;font-size:17px;font-weight:900;letter-spacing:0.5px;text-transform:capitalize;">
            ${grupo.label}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-left:8px;">
          <button onclick="event.stopPropagation();baixarPDFMes('${grupo.chave}')" title="Baixar PDF do Mês" style="
            background:rgba(212,194,154,0.12);border:1px solid rgba(212,194,154,0.3);
            color:#D4C29A;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:12px;
            transition:all 0.2s;
          " onmouseover="this.style.background='rgba(212,194,154,0.25)'" onmouseout="this.style.background='rgba(212,194,154,0.12)'">
            <i class="fas fa-file-pdf"></i>
          </button>
          <div id="toggle-mes-icon-${grupo.chave}" style="
            color:#D4C29A;font-size:14px;transition:transform 0.3s;transform:rotate(-90deg);
          ">
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>
      <div style="flex:1;height:2px;background:linear-gradient(to left,transparent,#D4C29A);box-shadow:0 0 6px rgba(212,194,154,0.35);"></div>
    `;
    list.appendChild(mesHeader);

    // ===== CONTAINER DAS OS DO MÊS =====
    const mesContainer = document.createElement('div');
    mesContainer.id = `mes-container-${grupo.chave}`;
    // Inicia FECHADO por padrão
    mesContainer.style.cssText = `max-height:0;overflow:hidden;transition:max-height 0.4s ease;`;
    mesContainer.dataset.aberto = 'false';
    list.appendChild(mesContainer);

    // Renderizar cada OS dentro do container do mês
    grupo.items.forEach((os, index) => {
      renderOSCard(os, index, mesContainer);
    });
  });
}

// ============================= 
// TOGGLE MOSTRAR/OCULTAR MÊS
// ============================= 
function toggleMes(chave) {
  const container = document.getElementById(`mes-container-${chave}`);
  const iconWrap = document.getElementById(`toggle-mes-icon-${chave}`);
  if (!container || !iconWrap) return;

  const aberto = container.dataset.aberto === 'true';
  if (aberto) {
    // Fechar: captura altura atual, força reflow, anima para 0
    const altura = container.scrollHeight;
    container.style.overflow = 'hidden';
    container.style.transition = 'max-height 0.4s ease';
    container.style.maxHeight = altura + 'px';
    // Força reflow antes de animar
    container.offsetHeight;
    container.style.maxHeight = '0';
    container.dataset.aberto = 'false';
    iconWrap.style.transform = 'rotate(-90deg)';
  } else {
    // Abrir: anima para scrollHeight e depois libera overflow
    container.style.overflow = 'hidden';
    container.style.transition = 'max-height 0.4s ease';
    container.style.maxHeight = container.scrollHeight + 'px';
    container.dataset.aberto = 'true';
    iconWrap.style.transform = 'rotate(0deg)';
    // Após a animação, libera overflow para os detalhes internos funcionarem
    container.addEventListener('transitionend', function onEnd() {
      if (container.dataset.aberto === 'true') {
        container.style.maxHeight = 'none';
        container.style.overflow = 'visible';
      }
      container.removeEventListener('transitionend', onEnd);
    });
  }
}
// ============================= 
// RENDERIZAR CARD DE UMA OS
// ============================= 
function renderOSCard(os, index, container) {
  const statusText = (os.status || os.estado || (os.completed ? 'Concluída' : 'Pendente')).toString();
  const isFinalizada = /conclu|finaliz/i.test(statusText);

  const statusBadge = isFinalizada
    ? '<span class="badge badge-completed" style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;background:#052e16;color:#4ade80;border:1px solid #166534;">Finalizada</span>'
    : '<span class="badge badge-pending" style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;background:#2a1a00;color:#fbbf24;border:1px solid #92400e;">Pendente</span>';

  const finalizarBtn = !isFinalizada
    ? `<button class="btn-small btn-success" onclick="finalizarOS('${os.id}')" style="flex:1 1 calc(50% - 4px);border-radius:8px;font-weight:600;">
        <i class="fas fa-check-circle"></i> Finalizar
      </button>` : '';

  const dataStr = os.data ? new Date(os.data).toLocaleDateString('pt-BR') : '-';
  const produtosOriginais = Array.isArray(os.products) ? os.products : [];
  const produtos = agruparProdutos(produtosOriginais);
  const qtdProdutos = produtos.reduce((acc, p) => acc + p.qty, 0);
  const formaPagamento = os.payment_method || os.formaPagamento || 'Não informado';
  const statusPagamento = os.payment_status || os.statusPagamento || 'Não Pago';
  const ano = new Date(os.data || Date.now()).getFullYear();
  const numeroSeq = String(index + 1).padStart(2, '0');

  // Aviso de boleto vencido
  const avisoVencimento = os.vencimentoBoleto && statusPagamento !== 'Pago'
    ? `<div style="background:#7f1d1d;border:1px solid #ef4444;border-radius:6px;padding:6px 10px;font-size:11px;color:#fca5a5;margin-bottom:8px;">
        <i class="fas fa-bell"></i> Vencimento: ${new Date(os.vencimentoBoleto).toLocaleDateString('pt-BR')}
       </div>` : '';

  // Produtos com lucro por item
  let produtosListaHTML = '';
  if (produtos.length > 0) {
    produtosListaHTML = produtos.map(p => {
      const lucroItem = (Number(p.price) * (Number(os.profitPercent) || 0) / 100) * p.qty;
      return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;
        background:#1a1a1a;border:1px solid #333;margin-bottom:6px;border-radius:8px;">
        <span style="color:#fff;flex:1;font-size:13px;font-weight:500;word-break:break-word;">
          <i class="fas fa-box" style="margin-right:6px;color:#D4C29A;font-size:11px;"></i>
          ${escapeHtml(p.name || 'Produto')}
        </span>
        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
          <span style="color:#D4C29A;font-weight:700;background:#0d0d0d;padding:4px 8px;border-radius:5px;font-size:12px;border:1px solid #D4C29A;">${p.qty}x</span>
          ${os.profitPercent > 0 ? `<span style="color:#4ade80;font-size:10px;background:#052e16;padding:2px 6px;border-radius:4px;">+${(os.profitPercent)}% = R$${lucroItem.toFixed(2)}</span>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // Info prazo de pagamento
  const prazoInfo = os.prazoPagamento
    ? `<div style="font-size:11px;color:#fbbf24;margin-top:4px;"><i class="fas fa-clock"></i> Prazo: ${os.prazoPagamento} dias</div>`
    : '';

  const div = document.createElement('div');
  div.className = 'list-item';
  div.style.cssText = 'margin-bottom:20px;box-shadow:0 8px 20px rgba(0,0,0,0.5);border-radius:12px;overflow:hidden;';

  div.innerHTML = `
    ${avisoVencimento}

    <!-- ===== HEADER ===== -->
    <div style="display:flex;align-items:stretch;background:#111;border-bottom:2px solid #D4C29A;">

      <!-- Bloco do número -->
      <div style="background:#D4C29A;display:flex;flex-direction:column;align-items:center;
        justify-content:center;padding:14px 18px;min-width:88px;flex-shrink:0;gap:2px;">
        <div style="font-size:9px;color:#5a4f2a;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">OS nº</div>
        <div style="font-size:32px;font-weight:800;color:#1a1200;line-height:1;">${numeroSeq}</div>
        <div style="font-size:11px;color:#6b5c2e;font-weight:600;">${ano}</div>
      </div>

      <!-- Separador vertical -->
      <div style="width:1px;background:#2a2a2a;margin:8px 0;flex-shrink:0;"></div>

      <!-- Cliente + data + badge -->
      <div style="flex:1;padding:14px 16px;display:flex;flex-direction:column;justify-content:center;gap:7px;min-width:0;overflow:hidden;">
        <div style="font-size:16px;font-weight:700;color:#D4C29A;line-height:1.3;word-break:break-word;">
          ${escapeHtml(os.cliente || 'Cliente não informado')}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:12px;color:#888;display:flex;align-items:center;gap:4px;">
            <i class="fas fa-calendar-alt" style="font-size:10px;flex-shrink:0;"></i>
            ${dataStr}
          </span>
          <span style="color:#444;font-size:10px;">•</span>
          ${statusBadge}
        </div>
      </div>

    </div>
    <!-- ===== FIM DO HEADER ===== -->

    <div class="list-item-info" style="padding:16px;gap:14px;background:#0d0d0d;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:12px;min-width:0;overflow:hidden;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;display:flex;align-items:center;gap:5px;">
            <i class="fas fa-tools" style="color:#D4C29A;flex-shrink:0;"></i> Serviço
          </div>
          <div style="font-size:14px;color:#fff;font-weight:600;word-break:break-word;line-height:1.3;">${escapeHtml(os.servico || '-')}</div>
        </div>
        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:12px;min-width:0;overflow:hidden;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;display:flex;align-items:center;gap:5px;">
            <i class="fas fa-user-hard-hat" style="color:#D4C29A;flex-shrink:0;"></i> Técnico
          </div>
          <div style="font-size:14px;color:#fff;font-weight:600;word-break:break-word;line-height:1.3;">${escapeHtml(os.tecnico || '-')}</div>
        </div>
      </div>

      <div id="os-details-${os.id}" class="os-details-collapsed" style="max-height:0;overflow:hidden;transition:max-height 0.3s ease;">
        <div style="padding-top:14px;">
          <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:12px;margin-bottom:14px;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;display:flex;align-items:center;gap:5px;">
              <i class="fas fa-map-marker-alt" style="color:#D4C29A;flex-shrink:0;"></i> Endereço e CEP
            </div>
            <div style="font-size:14px;color:#fff;font-weight:500;margin-bottom:6px;word-break:break-word;line-height:1.4;">${escapeHtml(os.endereco || '-')}</div>
            <div style="font-size:13px;color:#aaa;">CEP: ${escapeHtml(os.cep || '-')}</div>
          </div>

          <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:12px;margin-bottom:14px;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;display:flex;align-items:center;gap:5px;">
              <i class="fas fa-circle-check" style="color:${statusPagamento === 'Pago' ? '#28a745' : '#dc3545'};flex-shrink:0;"></i> Status de Pagamento
            </div>
            <div style="font-size:14px;color:${statusPagamento === 'Pago' ? '#28a745' : '#dc3545'};font-weight:700;margin-bottom:8px;">
              <i class="fas fa-${statusPagamento === 'Pago' ? 'check-circle' : 'times-circle'}"></i> ${escapeHtml(statusPagamento)}
            </div>
            ${prazoInfo}
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-top:10px;border-top:1px solid #333;display:flex;align-items:center;gap:5px;">
              <i class="fas fa-credit-card" style="color:#D4C29A;flex-shrink:0;"></i> Forma de Pagamento
            </div>
            <div style="font-size:14px;color:#fff;font-weight:600;word-break:break-word;">${escapeHtml(formaPagamento)}</div>
          </div>

          ${produtosListaHTML ? `
            <div style="margin-top:14px;margin-bottom:14px;">
              <div style="color:#D4C29A;font-size:12px;font-weight:700;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;border-bottom:2px solid #D4C29A;">
                <i class="fas fa-boxes" style="margin-right:8px;font-size:11px;"></i> Produtos Utilizados (${qtdProdutos} un.)
              </div>
              <div style="max-height:220px;overflow-y:auto;">${produtosListaHTML}</div>
            </div>
          ` : `
            <div style="margin:14px 0;padding:14px;background:#1a1a1a;border:2px dashed #333;border-radius:8px;color:#888;font-size:13px;text-align:center;">
              <i class="fas fa-inbox" style="margin-right:8px;font-size:16px;color:#D4C29A;"></i> Nenhum produto cadastrado
            </div>
          `}

          <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:12px;margin-top:14px;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;display:flex;align-items:center;gap:5px;">
              <i class="fas fa-dollar-sign" style="color:#D4C29A;flex-shrink:0;"></i> Valor Total da OS
            </div>
            <div style="font-size:18px;color:#4ade80;font-weight:700;">
              ${(Number(os.total) || Number(os.preco) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            ${os.profitPercent > 0 ? `
              <div style="font-size:11px;color:#a3a3a3;margin-top:4px;">
                Subtotal: ${(Number(os.subtotal) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                <span style="color:#4ade80;"> + ${os.profitPercent}% lucro = ${(Number(os.profitValue) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>` : ''}
          </div>
        </div>
      </div>

      <button class="btn-toggle-details" onclick="toggleOSDetails('${os.id}')" style="
        margin-top:14px;width:100%;background:#2a2a2a;border:2px solid #D4C29A;color:#D4C29A;
        padding:11px;border-radius:8px;cursor:pointer;display:flex;align-items:center;
        justify-content:center;gap:8px;font-weight:600;font-size:14px;transition:all 0.3s;
      " onmouseover="this.style.background='#3a3a3a'" onmouseout="this.style.background='#2a2a2a'">
        <span>Ver Detalhes</span>
        <i class="fas fa-chevron-down" id="toggle-icon-${os.id}" style="font-size:12px;transition:transform 0.3s;"></i>
      </button>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#000;border-top:2px solid #D4C29A;">
      <button class="btn-small" onclick="viewOrder('${os.id}')" style="flex:1 1 calc(50% - 4px);font-size:12px;padding:10px 12px;border-radius:8px;font-weight:600;background:#1a1a1a;color:#3b82f6;border:2px solid #3b82f6;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='#3b82f6';this.style.color='#fff'" onmouseout="this.style.background='#1a1a1a';this.style.color='#3b82f6'">
        <i class="fas fa-eye"></i> <span>Ver</span>
      </button>
      <button class="btn-small" onclick="abrirModalPagamento('${os.id}')" style="flex:1 1 calc(50% - 4px);font-size:12px;padding:10px 12px;border-radius:8px;font-weight:600;background:#1a1a1a;color:#10b981;border:2px solid #10b981;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='#10b981';this.style.color='#fff'" onmouseout="this.style.background='#1a1a1a';this.style.color='#10b981'">
        <i class="fas fa-credit-card"></i> <span>Pagamento</span>
      </button>
      <button class="btn-small" onclick="mostrarOpcoesPDF('${os.id}')" style="flex:1 1 calc(50% - 4px);font-size:12px;padding:10px 12px;border-radius:8px;font-weight:600;background:#1a1a1a;color:#f43f5e;border:2px solid #f43f5e;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='#f43f5e';this.style.color='#fff'" onmouseout="this.style.background='#1a1a1a';this.style.color='#f43f5e'">
        <i class="fas fa-file-pdf"></i> <span>PDF</span>
      </button>
      <button class="btn-small" onclick="editarOS('${os.id}')" style="flex:1 1 calc(50% - 4px);font-size:12px;padding:10px 12px;border-radius:8px;font-weight:600;background:#1a1a1a;color:#D4C29A;border:2px solid #D4C29A;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='#D4C29A';this.style.color='#0d0d0d'" onmouseout="this.style.background='#1a1a1a';this.style.color='#D4C29A'">
        <i class="fas fa-edit"></i> <span>Editar</span>
      </button>
      ${isFinalizada && (os.payment_status === 'Pago' || os.statusPagamento === 'Pago')
      ? `<button class="btn-small" onclick="gerarReciboQuitacao('${os.id}')" style="flex:1 1 calc(50% - 4px);font-size:12px;padding:10px 12px;border-radius:8px;font-weight:600;background:#1a1a1a;color:#22c55e;border:2px solid #22c55e;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='#22c55e';this.style.color='#fff'" onmouseout="this.style.background='#1a1a1a';this.style.color='#22c55e'">
              <i class="fas fa-receipt"></i> <span>Recibo</span>
            </button>` : ''}
      ${finalizarBtn}
      <button class="btn-small" onclick="excluirOS('${os.id}')" style="flex:1 1 calc(50% - 4px);font-size:12px;padding:10px 12px;border-radius:8px;font-weight:600;background:#1a1a1a;color:#dc2626;border:2px solid #dc2626;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.background='#dc2626';this.style.color='#fff'" onmouseout="this.style.background='#1a1a1a';this.style.color='#dc2626'">
        <i class="fas fa-trash"></i> <span>Excluir</span>
      </button>
    </div>
  `;

  container.appendChild(div);
}
// ============================= 
// TOGGLE DETALHES DE UMA OS
// ============================= 
const toggleCache = new Map();

window.toggleOSDetails = function (osId) {
  const detailsDiv = document.getElementById(`os-details-${osId}`);
  const icon = document.getElementById(`toggle-icon-${osId}`);
  if (!detailsDiv || !icon) return;

  const isCollapsed = detailsDiv.classList.contains('os-details-collapsed');

  if (isCollapsed) {
    // Mede a altura real antes de expandir
    detailsDiv.style.maxHeight = 'none';
    detailsDiv.style.visibility = 'hidden';
    detailsDiv.classList.remove('os-details-collapsed');
    const altura = detailsDiv.scrollHeight;
    detailsDiv.style.maxHeight = '0';
    detailsDiv.style.visibility = '';
    detailsDiv.classList.add('os-details-collapsed');

    toggleCache.set(osId, altura);

    // Força reflow e anima
    detailsDiv.offsetHeight;
    detailsDiv.classList.remove('os-details-collapsed');
    detailsDiv.style.maxHeight = altura + 'px';
    icon.style.transform = 'rotate(180deg)';

    // Após animação, libera maxHeight para não cortar scroll interno
    detailsDiv.addEventListener('transitionend', function onEnd() {
      if (!detailsDiv.classList.contains('os-details-collapsed')) {
        detailsDiv.style.maxHeight = 'none';
      }
      detailsDiv.removeEventListener('transitionend', onEnd);
    });

  } else {
    // Fecha: fixa a altura atual antes de animar para 0
    detailsDiv.style.maxHeight = detailsDiv.scrollHeight + 'px';
    detailsDiv.offsetHeight; // força reflow
    detailsDiv.style.maxHeight = '0';
    detailsDiv.classList.add('os-details-collapsed');
    icon.style.transform = 'rotate(0deg)';
  }
};

window.clearToggleCache = function () { toggleCache.clear(); };
// =============================
// CSS COMPARTILHADO — TODOS OS PDFs
// =============================
const PDF_BASE_CSS = `
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:100%;height:auto;font-family:'Segoe UI',Arial,sans-serif;}
  body{background:#ffffff;padding:0;}

  /* PÁGINA A4 */
  .pdf-nota-page{width:210mm;height:297mm;margin:0 auto 10mm auto;background:#ffffff;display:flex;flex-direction:column;position:relative;overflow:hidden;page-break-after:always;}
  .pdf-nota-page:last-child{margin-bottom:0;}

  /* HEADER */
  .pdf-nota-header{background:linear-gradient(135deg,#b91c1c 0%,#dc2626 100%);color:white;padding:12px 15px;border-bottom:3px solid #7f1d1d;flex-shrink:0;}
  .pdf-nota-header-top{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;}
  .pdf-nota-logo-section{display:flex;flex-direction:column;gap:3px;}
  .pdf-nota-logo-header{display:flex;align-items:center;gap:8px;}
  .pdf-nota-logo-text{font-size:14px;font-weight:900;}
  .pdf-nota-company-info{font-size:7px;line-height:1.4;opacity:0.9;}
  .pdf-nota-header-center{text-align:center;flex:1;}
  .pdf-nota-header-center h1{font-size:16px;font-weight:900;margin:0 0 2px 0;}
  .pdf-nota-header-center p{font-size:9px;margin:0;opacity:0.9;}
  .pdf-nota-header-right{text-align:right;font-size:8px;line-height:1.4;}
  .pdf-nota-header-item{font-weight:600;margin:2px 0;}

  /* BODY */
  .pdf-nota-body{flex:1;padding:10px 15px;background:#fafafa;overflow:hidden;}

  /* SEÇÕES */
  .pdf-nota-section{margin-bottom:8px;background:white;border:1px solid #d1d5db;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);border-radius:6px;}
  .pdf-nota-section-title{background:linear-gradient(135deg,#4b5563,#6b7280);color:white;padding:6px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;display:flex;align-items:center;gap:6px;}
  .pdf-nota-section-title.vermelho{background:linear-gradient(135deg,#b91c1c,#dc2626);border-bottom:2px solid #7f1d1d;}
  .pdf-nota-section-title.verde{background:linear-gradient(135deg,#15803d,#16a34a);border-bottom:2px solid #14532d;}
  .pdf-nota-section-title i{font-size:10px;}
  .pdf-nota-section-content{padding:8px 10px;}

  /* DADOS INLINE (grid 3 colunas) */
  .pdf-nota-dados-inline{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
  .pdf-nota-dados-inline.col2{grid-template-columns:repeat(2,1fr);}
  .pdf-nota-dados-inline.col4{grid-template-columns:repeat(4,1fr);}
  .pdf-nota-dado-item{background:#f9fafb;border:1px solid #e5e7eb;border-left:3px solid #6b7280;padding:5px 8px;display:flex;flex-direction:column;gap:2px;border-radius:4px;}
  .pdf-nota-dado-item.destaque{border-left-color:#b91c1c;background:#fef2f2;}
  .pdf-nota-dado-item.verde{border-left-color:#16a34a;background:#f0fdf4;}
  .pdf-nota-dado-label{font-size:7px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.2px;}
  .pdf-nota-dado-valor{font-size:9px;font-weight:600;color:#1f2937;word-break:break-word;}

  /* RESUMO FINANCEIRO */
  .pdf-nota-resumo-compact{display:flex;gap:8px;align-items:stretch;}
  .pdf-nota-resumo-item{flex:1;background:#f9fafb;border:1px solid #e5e7eb;padding:8px;text-align:center;display:flex;flex-direction:column;justify-content:center;border-radius:4px;}
  .pdf-nota-resumo-item.destaque{background:linear-gradient(135deg,#b91c1c,#dc2626);color:white;border:2px solid #7f1d1d;}
  .pdf-nota-resumo-item.verde{background:linear-gradient(135deg,#15803d,#16a34a);color:white;border:2px solid #14532d;}
  .pdf-nota-resumo-label{font-size:7px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;}
  .pdf-nota-resumo-item.destaque .pdf-nota-resumo-label,
  .pdf-nota-resumo-item.verde .pdf-nota-resumo-label{color:rgba(255,255,255,0.8);}
  .pdf-nota-resumo-valor{font-size:11px;font-weight:800;color:#1f2937;}
  .pdf-nota-resumo-item.destaque .pdf-nota-resumo-valor,
  .pdf-nota-resumo-item.verde .pdf-nota-resumo-valor{color:#ffffff;font-size:15px;}

  /* PRODUTOS */
  .pdf-produtos-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
  .pdf-produtos-columns>div:only-child{grid-column:1/-1;max-width:100%;}

  /* CONDIÇÕES */
  .pdf-nota-condicoes-list{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
  .pdf-nota-condicoes-item{display:flex;gap:6px;align-items:flex-start;font-size:8px;line-height:1.3;color:#374151;padding:4px;background:#f9fafb;border-left:2px solid #6b7280;border-radius:4px;}
  .pdf-nota-condicoes-item i{color:#22c55e;font-size:8px;margin-top:1px;flex-shrink:0;}

  /* ASSINATURAS */
  .pdf-nota-assinaturas{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:8px;}
  .pdf-nota-assinatura-campo{display:flex;flex-direction:column;gap:3px;}
  .pdf-nota-assinatura-linha{border-bottom:1.5px solid #374151;height:20px;}
  .pdf-nota-assinatura-nome{font-weight:700;color:#1f2937;font-size:8px;text-align:center;}
  .pdf-nota-assinatura-info{font-size:7px;color:#6b7280;text-align:center;line-height:1.3;}

  /* TABELA PADRÃO */
  .pdf-tabela{width:100%;border-collapse:collapse;font-size:11px;border:2px solid #d1d5db;border-radius:6px;overflow:hidden;}
  .pdf-tabela thead tr{background:linear-gradient(135deg,#4b5563,#6b7280);}
  .pdf-tabela th{padding:7px 10px;color:white;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;font-weight:700;border-right:1px solid rgba(255,255,255,0.2);}
  .pdf-tabela th:last-child{border-right:none;}
  .pdf-tabela td{padding:6px 10px;border-bottom:1px solid #e5e7eb;border-right:1px solid #f3f4f6;font-size:10px;color:#374151;}
  .pdf-tabela td:last-child{border-right:none;}
  .pdf-tabela tfoot tr{background:linear-gradient(135deg,#b91c1c,#dc2626);}
  .pdf-tabela tfoot td{padding:9px 10px;color:white;font-weight:800;font-size:11px;border:none;}

  /* OBSERVAÇÕES */
  .pdf-nota-observacoes-texto{font-size:8px;line-height:1.5;color:#4b5563;margin:0;padding:6px;background:#f9fafb;border-left:3px solid #f59e0b;border-radius:4px;}

  /* STAMP (QUITADO) */
  .pdf-stamp{position:absolute;right:28px;top:160px;transform:rotate(-15deg);border:3px solid #16a34a;border-radius:8px;padding:7px 14px;color:#16a34a;font-weight:900;font-size:20px;opacity:0.25;letter-spacing:3px;pointer-events:none;}

  /* DECLARAÇÃO */
  .pdf-declaracao{font-size:10px;color:#4b5563;text-align:center;line-height:1.6;background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:6px;padding:10px 14px;}

  /* FOOTER */
  .pdf-nota-pdf-footer{width:100%;padding:8px 15px;border-top:3px solid #b91c1c;text-align:center;background:#f9fafb;flex-shrink:0;}
  .pdf-nota-footer-brand{font-size:11px;font-weight:900;color:#1f2937;margin-bottom:3px;display:flex;align-items:center;justify-content:center;gap:5px;}
  .pdf-nota-footer-brand i{color:#b91c1c;}
  .pdf-nota-footer-info{font-size:7px;color:#6b7280;margin-bottom:2px;}
  .pdf-nota-footer-timestamp{font-size:6px;color:#9ca3af;font-style:italic;}

  @media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}body{margin:0;padding:0;}.pdf-nota-page{max-width:none;margin:0;}}
`;

// Helper: montar o <head> padrão com CSS base
function pdfHtmlShell(bodyContent) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>${PDF_BASE_CSS}</style>
</head>
<body>${bodyContent}</body>
</html>`;
}

// Helper: header padrão de página
function pdfHeaderPadrao({ titulo, subtitulo, leftTop, leftBottom, rightLines = [] }) {
  const logoBlock = typeof getPDFLogoHtml === 'function'
    ? getPDFLogoHtml('dark')
    : `<div class="pdf-nota-logo-header"><i class="fas fa-fire-extinguisher" style="font-size:16px;opacity:0.9;"></i><div class="pdf-nota-logo-text">${leftTop || 'EXTINMAIS'}</div></div><div class="pdf-nota-company-info">${leftBottom || ''}</div>`;
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

// Helper: footer padrão
function pdfFooterPadrao() {
  const nome = 'EXTINMAIS';
  const info = typeof getPDFFooterHtml === 'function' ? getPDFFooterHtml() : '';
  return `
  <div class="pdf-nota-pdf-footer">
    <div class="pdf-nota-footer-brand"><i class="fas fa-fire-extinguisher"></i> EXTINMAIS</div>
    <div class="pdf-nota-footer-info">${info}</div>
    <div class="pdf-nota-footer-timestamp">Emitido em: ${new Date().toLocaleString('pt-BR')}</div>
  </div>`;
}

// =============================
// MODAL DE OPÇÕES PDF
// =============================
function mostrarOpcoesPDF(osId) {
  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;animation:fadeIn 0.2s ease;`;

  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);border-radius:16px;padding:28px;max-width:420px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,0.7);border:2px solid #D4C29A;animation:slideUp 0.3s ease;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="background:linear-gradient(135deg,#D4C29A 0%,#B8A47E 100%);width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 4px 12px rgba(212,194,154,0.4);">
          <i class="fas fa-file-pdf" style="color:#0d0d0d;font-size:28px;"></i>
        </div>
        <h3 style="color:#D4C29A;font-size:22px;font-weight:700;margin-bottom:8px;">Gerar PDF</h3>
        <p style="color:#aaa;font-size:14px;line-height:1.5;">Escolha o tipo de PDF</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
        <button onclick="gerarPDFOrdem('${osId}','com_valores');document.body.removeChild(this.closest('div').parentElement)" style="width:100%;padding:16px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
          <i class="fas fa-dollar-sign" style="font-size:18px;"></i> PDF com Valores
        </button>
        <button onclick="gerarPDFOrdem('${osId}','sem_valores');document.body.removeChild(this.closest('div').parentElement)" style="width:100%;padding:16px;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
          <i class="fas fa-file-alt" style="font-size:18px;"></i> PDF sem Valores
        </button>
        <button onclick="gerarPDFOrdem('${osId}','valores_detalhados');document.body.removeChild(this.closest('div').parentElement)" style="width:100%;padding:16px;background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
          <i class="fas fa-list-check" style="font-size:18px;"></i> PDF com Valores Detalhados
        </button>
        <button onclick="gerarPDFOrdem('${osId}','sem_quantidade');document.body.removeChild(this.closest('div').parentElement)" style="width:100%;padding:16px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
          <i class="fas fa-file" style="font-size:18px;"></i> PDF sem Quantidade
        </button>
      </div>
      <button onclick="document.body.removeChild(this.closest('div').parentElement)" style="width:100%;padding:12px;background:transparent;color:#999;border:2px solid #333;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.borderColor='#D4C29A';this.style.color='#D4C29A'" onmouseout="this.style.borderColor='#333';this.style.color='#999'">
        Cancelar
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

// =============================
// MODAL DE PAGAMENTO
// =============================
let modalPagamentoAberto = null; // Armazena orderId do modal aberto

function abrirModalPagamento(orderId) {
  const ordem = allOrders.find(o => o.id === orderId);
  if (!ordem) { showToast('Ordem não encontrada', 'error'); return; }

  modalPagamentoAberto = orderId; // Guarda qual modal está aberto

  const formaPagamento = ordem.payment_method || ordem.formaPagamento || 'Não informado';
  const statusPagamento = ordem.payment_status || ordem.statusPagamento || 'Não Pago';
  const totalFinal = Number(ordem.total) || Number(ordem.preco) || 0;
  const precoFmt = totalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const overlay = document.createElement('div');
  overlay.id = 'modalPagamentoOverlay';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,0,0.85);
    display:flex;align-items:center;justify-content:center;
    z-index:10000;padding:16px;
    animation:fadeIn 0.2s ease;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background:#1a1a1a;
    border:2px solid #D4C29A;
    border-radius:14px;
    padding:0;
    width:min(680px, 100%);
    max-width:100%;
    box-shadow:0 20px 60px rgba(0,0,0,0.9);
    animation:slideUp 0.3s ease;
    max-height:92vh;
    overflow-y:auto;
  `;

  const isPago = statusPagamento === 'Pago';

  modal.innerHTML = `
    <div style="padding:20px 28px;border-bottom:2px solid #D4C29A;display:flex;justify-content:space-between;align-items:center;">
      <h3 style="color:#D4C29A;margin:0;font-size:18px;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-credit-card"></i> Informações de Pagamento
      </h3>
      <button onclick="fecharModalPagamento()" style="background:none;border:none;color:#999;font-size:20px;cursor:pointer;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:all 0.2s;" onmouseover="this.style.background='#2a2a2a';this.style.color='#D4C29A'" onmouseout="this.style.background='none';this.style.color='#999'">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div style="padding:24px 28px;">

      <!-- Cliente + Valor lado a lado em telas largas -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div style="background:#2a2a2a;border:1px solid #3a3a3a;border-radius:10px;padding:16px;">
          <div style="color:#888;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.6px;">Cliente</div>
          <div style="color:#D4C29A;font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(ordem.cliente || 'Não informado')}</div>
        </div>
        <div style="background:#2a2a2a;border:1px solid #D4C29A;border-radius:10px;padding:16px;">
          <div style="color:#888;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.6px;">Valor Total</div>
          <div style="color:#D4C29A;font-size:22px;font-weight:700;">${precoFmt}</div>
        </div>
      </div>

      <!-- Status e Forma atuais lado a lado -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div>
          <div style="color:#888;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;">Status Atual</div>
          <div style="background:#2a2a2a;border:1px solid ${isPago ? '#28a745' : '#dc3545'};border-radius:8px;padding:12px 14px;color:#fff;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-${isPago ? 'check-circle' : 'times-circle'}" style="color:${isPago ? '#28a745' : '#dc3545'};"></i>
            ${escapeHtml(statusPagamento)}
          </div>
        </div>
        <div>
          <div style="color:#888;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;">Forma Atual</div>
          <div style="background:#2a2a2a;border:1px solid #D4C29A;border-radius:8px;padding:12px 14px;color:#fff;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;overflow:hidden;">
            <i class="fas fa-wallet" style="color:#D4C29A;flex-shrink:0;"></i>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(formaPagamento)}</span>
          </div>
        </div>
      </div>

      <!-- Alterar Status e Forma lado a lado -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div>
          <div style="color:#888;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;">Alterar Status</div>
          <select id="novoStatusPagamento" style="width:100%;padding:11px 14px;background:#2a2a2a;border:1px solid #D4C29A;border-radius:8px;color:#fff;font-size:14px;cursor:pointer;">
            <option value="">Selecione</option>
            <option value="Pago">✓ Pago</option>
            <option value="Não Pago">✗ Não Pago</option>
          </select>
        </div>
        <div>
          <div style="color:#888;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;">Alterar Forma</div>
          <select id="novaFormaPagamento" style="width:100%;padding:11px 14px;background:#2a2a2a;border:1px solid #D4C29A;border-radius:8px;color:#fff;font-size:14px;cursor:pointer;">
            <option value="">Selecione</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Pix">Pix</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="Cheque Especial">Cheque Especial</option>
            <option value="Boleto">Boleto</option>
            <option value="Transferência">Transferência</option>
            <option value="A Prazo">A Prazo</option>
            <option value="Outro">Outro</option>
          </select>
          <div style="font-size:11px;color:#666;margin-top:5px;">
            <i class="fas fa-info-circle" style="color:#fbbf24;"></i> Boleto e A Prazo abrem configuração de dias.
          </div>
        </div>
      </div>

      <!-- Data do pagamento (aparece só quando Pago) -->
      <div id="dataPagamentoWrap" style="margin-bottom:20px;display:none;">
        <div style="color:#888;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;">
          <i class="fas fa-calendar-check" style="color:#28a745;margin-right:4px;"></i> Data do Pagamento
        </div>
        <input type="date" id="dataPagamentoInput" style="width:100%;padding:11px 14px;background:#2a2a2a;border:1px solid #28a745;border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;">
        <div style="font-size:11px;color:#666;margin-top:5px;">Informe a data em que o pagamento foi realizado.</div>
      </div>

      <!-- Botões -->
      <div style="display:flex;gap:12px;margin-top:24px;">
        <button onclick="fecharModalPagamento()" class="btn-secondary" style="flex:1;padding:13px 20px;border-radius:8px;font-size:14px;font-weight:600;">
          <i class="fas fa-times" style="margin-right:6px;"></i> Cancelar
        </button>
        <button onclick="salvarFormaPagamento('${ordem.id}')" class="btn-primary" style="flex:1;padding:13px 20px;border-radius:8px;font-size:14px;font-weight:600;">
          <i class="fas fa-save" style="margin-right:6px;"></i> Salvar
        </button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) fecharModalPagamento(); };

  setTimeout(() => {
    const selectStatus = document.getElementById('novoStatusPagamento');
    if (selectStatus) {
      selectStatus.addEventListener('change', () => {
        const wrap = document.getElementById('dataPagamentoWrap');
        const input = document.getElementById('dataPagamentoInput');
        if (selectStatus.value === 'Pago') {
          wrap.style.display = 'block';
          if (!input.value) input.value = new Date().toISOString().split('T')[0];
        } else {
          wrap.style.display = 'none';
        }
      });
    }

    const selectForma = document.getElementById('novaFormaPagamento');
    if (selectForma) {
      selectForma.addEventListener('change', () => {
        const val = selectForma.value.toLowerCase();
        if (val === 'boleto' || val === 'a prazo') {
          abrirModalPrazo(selectForma.value);
        }
      });
    }
  }, 100);
}

// ─── Modal secundário: configurar prazo ─────────────────────────────────────

function abrirModalPrazo(tipoForma) {
  const existente = document.getElementById('modalPrazoOverlay');
  if (existente) existente.remove();

  const isBoleto = tipoForma.toLowerCase().includes('boleto');
  const label = isBoleto ? 'Boleto' : 'A Prazo';
  const cor = isBoleto ? '#fbbf24' : '#a78bfa';

  const overlay = document.createElement('div');
  overlay.id = 'modalPrazoOverlay';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,0,0.75);
    display:flex;align-items:center;justify-content:center;
    z-index:10100;padding:16px;
    animation:fadeIn 0.2s ease;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background:#1a1a1a;
    border:2px solid ${cor};
    border-radius:14px;
    padding:0;
    width:min(660px, 100%);
    max-width:100%;
    box-shadow:0 20px 60px rgba(0,0,0,0.95);
    animation:slideUp 0.3s ease;
    max-height:92vh;
    overflow-y:auto;
  `;

  const opcoesRapidas = [7, 14, 15, 21, 28, 30, 45, 60, 90, 120];
  const botoesRapidos = opcoesRapidas.map(d => `
    <button
      type="button"
      onclick="selecionarDiasPrazo(${d})"
      id="btnDias${d}"
      style="padding:9px 0;background:#2a2a2a;border:1px solid #444;border-radius:8px;color:#ccc;font-size:13px;cursor:pointer;transition:all 0.2s;width:100%;"
      onmouseover="if(!this.classList.contains('ativo')){this.style.borderColor='${cor}';this.style.color='${cor}'}"
      onmouseout="if(!this.classList.contains('ativo')){this.style.borderColor='#444';this.style.color='#ccc'}"
    >${d}d</button>
  `).join('');

  const dataDefault = new Date();
  dataDefault.setDate(dataDefault.getDate() + 30);
  const dataDefaultStr = dataDefault.toISOString().split('T')[0];

  modal.innerHTML = `
    <div style="padding:18px 28px;border-bottom:2px solid ${cor};display:flex;justify-content:space-between;align-items:center;">
      <h3 style="color:${cor};margin:0;font-size:17px;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-calendar-alt"></i> Configurar ${label}
      </h3>
      <button onclick="fecharModalPrazo()" style="background:none;border:none;color:#999;font-size:18px;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:6px;" onmouseover="this.style.color='${cor}'" onmouseout="this.style.color='#999'">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div style="padding:24px 28px;">

      <!-- Prazo rápido: grid de 5 colunas por linha -->
      <div style="margin-bottom:20px;">
        <div style="color:#888;font-size:11px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.6px;">Prazo Rápido</div>
        <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px;">
          ${botoesRapidos}
        </div>
      </div>

      <!-- Manual + Data lado a lado -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div>
          <div style="color:#888;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;">
            <i class="fas fa-pencil-alt" style="margin-right:4px;color:${cor}"></i> Dias Manual
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <input
              type="number"
              id="diasPrazoCustom"
              min="1"
              max="999"
              placeholder="Ex: 45"
              style="flex:1;padding:11px 14px;background:#2a2a2a;border:1px solid ${cor};border-radius:8px;color:#fff;font-size:14px;min-width:0;"
            >
            <button
              type="button"
              onclick="aplicarDiasCustom()"
              style="padding:11px 16px;background:#2a2a2a;border:1px solid ${cor};border-radius:8px;color:${cor};font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0;"
            >Aplicar</button>
          </div>
        </div>
        <div>
          <div style="color:#888;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;">
            <i class="fas fa-calendar-check" style="color:${cor};margin-right:4px;"></i> Data de Vencimento
          </div>
          <input
            type="date"
            id="vencimentoBoletoInput"
            value="${dataDefaultStr}"
            style="width:100%;padding:11px 14px;background:#2a2a2a;border:1px solid ${cor};border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;"
          >
        </div>
      </div>

      <!-- Info dias calculados -->
      <div id="diasCalculadosInfo" style="font-size:12px;color:#888;margin-bottom:20px;">
        <i class="fas fa-info-circle" style="color:${cor};margin-right:4px;"></i> Vencimento em <span id="diasContagem" style="color:${cor};font-weight:600;">30</span> dias a partir de hoje.
      </div>

      <!-- Preview da forma final -->
      <div style="margin-bottom:16px;">
        <div style="color:#888;font-size:11px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px;">Forma Final</div>
        <div id="formaFinalPreview" style="background:#2a2a2a;border:1px solid ${cor};border-radius:8px;padding:13px 16px;color:${cor};font-size:14px;font-weight:600;">
          <i class="fas fa-file-invoice" style="margin-right:8px;"></i>${tipoForma} — <span id="labelDiasSelecionados">30 dias</span>
        </div>
      </div>

      <!-- Aviso -->
      <div style="font-size:11px;color:#666;background:#111;border-radius:8px;padding:10px 14px;margin-bottom:22px;">
        <i class="fas fa-bell" style="color:#fbbf24;margin-right:4px;"></i> Você receberá aviso automático 2 dias antes e após o vencimento.
      </div>

      <!-- Botões -->
      <div style="display:flex;gap:12px;">
        <button onclick="fecharModalPrazo()" class="btn-secondary" style="flex:1;padding:13px 20px;border-radius:8px;font-size:14px;font-weight:600;">
          <i class="fas fa-times" style="margin-right:6px;"></i> Cancelar
        </button>
        <button onclick="confirmarModalPrazo('${tipoForma}')" style="flex:1;padding:13px 20px;border-radius:8px;font-size:14px;font-weight:600;background:${cor};color:#111;border:none;cursor:pointer;">
          <i class="fas fa-check" style="margin-right:6px;"></i> Confirmar
        </button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) fecharModalPrazo(); };

  setTimeout(() => {
    const inputData = document.getElementById('vencimentoBoletoInput');
    if (inputData) inputData.addEventListener('change', recalcularDiasFromData);
    selecionarDiasPrazo(30, false);
  }, 100);
}

// ─── Helpers do modal de prazo ───────────────────────────────────────────────

function selecionarDiasPrazo(dias, atualizarData = true) {
  const botoesRapidos = [7, 14, 15, 21, 28, 30, 45, 60, 90, 120];
  botoesRapidos.forEach(d => {
    const btn = document.getElementById('btnDias' + d);
    if (!btn) return;
    btn.classList.remove('ativo');
    btn.style.borderColor = '#444';
    btn.style.color = '#ccc';
    btn.style.background = '#2a2a2a';
  });

  const btnAtivo = document.getElementById('btnDias' + dias);
  if (btnAtivo) {
    btnAtivo.classList.add('ativo');
    btnAtivo.style.borderColor = '#fbbf24';
    btnAtivo.style.color = '#111';
    btnAtivo.style.background = '#fbbf24';
  }

  const custom = document.getElementById('diasPrazoCustom');
  if (custom) custom.value = '';

  if (atualizarData) {
    const dataVenc = new Date();
    dataVenc.setDate(dataVenc.getDate() + dias);
    const inputData = document.getElementById('vencimentoBoletoInput');
    if (inputData) inputData.value = dataVenc.toISOString().split('T')[0];
  }

  const labelDias = document.getElementById('labelDiasSelecionados');
  if (labelDias) labelDias.textContent = dias + ' dias';
  const contagem = document.getElementById('diasContagem');
  if (contagem) contagem.textContent = dias;
}

function aplicarDiasCustom() {
  const input = document.getElementById('diasPrazoCustom');
  const dias = parseInt(input?.value);
  if (!dias || dias < 1 || dias > 999) {
    showToast('Informe um número de dias válido (1–999)', 'error');
    return;
  }

  const botoesRapidos = [7, 14, 15, 21, 28, 30, 45, 60, 90, 120];
  botoesRapidos.forEach(d => {
    const btn = document.getElementById('btnDias' + d);
    if (!btn) return;
    btn.classList.remove('ativo');
    btn.style.borderColor = '#444';
    btn.style.color = '#ccc';
    btn.style.background = '#2a2a2a';
  });

  const dataVenc = new Date();
  dataVenc.setDate(dataVenc.getDate() + dias);
  const inputData = document.getElementById('vencimentoBoletoInput');
  if (inputData) inputData.value = dataVenc.toISOString().split('T')[0];

  const labelDias = document.getElementById('labelDiasSelecionados');
  if (labelDias) labelDias.textContent = dias + ' dias';
  const contagem = document.getElementById('diasContagem');
  if (contagem) contagem.textContent = dias;
}

function recalcularDiasFromData() {
  const inputData = document.getElementById('vencimentoBoletoInput');
  if (!inputData?.value) return;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(inputData.value + 'T00:00:00');
  const diff = Math.round((venc - hoje) / (1000 * 60 * 60 * 24));
  const dias = diff > 0 ? diff : 0;

  const contagem = document.getElementById('diasContagem');
  if (contagem) contagem.textContent = dias;
  const labelDias = document.getElementById('labelDiasSelecionados');
  if (labelDias) labelDias.textContent = dias + ' dias';

  const botoesRapidos = [7, 14, 15, 21, 28, 30, 45, 60, 90, 120];
  botoesRapidos.forEach(d => {
    const btn = document.getElementById('btnDias' + d);
    if (!btn) return;
    btn.classList.remove('ativo');
    btn.style.borderColor = '#444';
    btn.style.color = '#ccc';
    btn.style.background = '#2a2a2a';
  });
}

function fecharModalPrazo() {
  const overlay = document.getElementById('modalPrazoOverlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => { if (overlay.parentNode) document.body.removeChild(overlay); }, 200);
  }
  // Volta automaticamente pro modal de pagamento SEM resetar o select
}

function confirmarModalPrazo(tipoForma) {
  const inputData = document.getElementById('vencimentoBoletoInput');
  const contagem = document.getElementById('diasContagem');
  const dias = parseInt(contagem?.textContent) || 0;

  if (!inputData?.value) { showToast('Informe a data de vencimento', 'error'); return; }
  if (dias < 1) { showToast('A data de vencimento deve ser futura', 'error'); return; }

  const selectForma = document.getElementById('novaFormaPagamento');
  const formaCompleta = `${tipoForma} ${dias} dias`;

  if (selectForma) {
    const anterior = selectForma.querySelector('option[data-temp="true"]');
    if (anterior) anterior.remove();
    const opt = document.createElement('option');
    opt.value = formaCompleta;
    opt.textContent = formaCompleta;
    opt.setAttribute('data-temp', 'true');
    opt.setAttribute('data-vencimento', inputData.value);
    opt.setAttribute('data-dias', dias);
    selectForma.appendChild(opt);
    selectForma.value = formaCompleta;
  }

  fecharModalPrazo();
  showToast(`${formaCompleta} configurado! Vencimento: ${formatarDataBR(inputData.value)}`, 'success');
}

// formatarDataBR duplicado removido (ver definição acima)

// ─── Modal principal: fechar ─────────────────────────────────────────────────

function fecharModalPagamento() {
  const overlay = document.getElementById('modalPagamentoOverlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => { if (overlay.parentNode) document.body.removeChild(overlay); }, 200);
  }
  modalPagamentoAberto = null;
}

// ─── Salvar ──────────────────────────────────────────────────────────────────

async function salvarFormaPagamento(orderId) {
  const selectForma = document.getElementById('novaFormaPagamento');
  const selectStatus = document.getElementById('novoStatusPagamento');
  const dataPagamentoInput = document.getElementById('dataPagamentoInput');

  const novaForma = selectForma?.value;
  const novoStatus = selectStatus?.value;

  if (!novaForma && !novoStatus) {
    showToast('Selecione pelo menos uma opção para atualizar', 'error');
    return;
  }

  try {
    showToast('Salvando informações de pagamento...', 'info');
    const ordemRef = firebase.database().ref('orders/' + orderId);
    const updates = {};

    if (novaForma) {
      updates.payment_method = novaForma;
      updates.formaPagamento = novaForma;
      const optSelecionada = selectForma.querySelector(`option[value="${CSS.escape ? CSS.escape(novaForma) : novaForma}"]`) || [...selectForma.options].find(o => o.value === novaForma);
      const diasOpt = optSelecionada?.getAttribute('data-dias');
      const vencOpt = optSelecionada?.getAttribute('data-vencimento');
      if (diasOpt) updates.prazoPagamento = parseInt(diasOpt);
      if (vencOpt) updates.vencimentoBoleto = new Date(vencOpt + 'T12:00:00').toISOString();
    }

    if (novoStatus) {
      updates.payment_status = novoStatus;
      updates.statusPagamento = novoStatus;
      if (novoStatus === 'Pago') {
        updates.dataPagamento = dataPagamentoInput?.value
          ? new Date(dataPagamentoInput.value + 'T12:00:00').toISOString()
          : new Date().toISOString();
      }
    }

    await ordemRef.update(updates);

    if (novoStatus === 'Pago') {
      showToast('Pagamento confirmado! Gerando recibo...', 'success');
      fecharModalPagamento();
      if (typeof loadOrders === 'function') await loadOrders();
      setTimeout(() => gerarReciboQuitacao(orderId), 600);
      return;
    }

    showToast('Informações de pagamento atualizadas!', 'success');
    fecharModalPagamento();
    if (typeof loadOrders === 'function') await loadOrders();
  } catch (error) {
    console.error('Erro ao salvar pagamento:', error);
    showToast('Erro ao salvar: ' + error.message, 'error');
  }
}

// =============================
// AVISOS DE BOLETO / VENCIMENTO
// =============================

function verificarAvisosVencimento() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  allOrders.forEach(os => {
    if (!os.vencimentoBoleto) return;
    if (os.payment_status === 'Pago' || os.statusPagamento === 'Pago') return;

    const venc = new Date(os.vencimentoBoleto);
    venc.setHours(0, 0, 0, 0);
    const diffDias = Math.round((venc - hoje) / (1000 * 60 * 60 * 24));

    if (diffDias === 2) {
      mostrarNotificacaoVencimento(os, `Boleto vence em 2 dias (${venc.toLocaleDateString('pt-BR')})`);
    } else if (diffDias === -2) {
      mostrarNotificacaoVencimento(os, `Boleto venceu há 2 dias (${venc.toLocaleDateString('pt-BR')}) — verificar pagamento!`);
    }
  });
}

function mostrarNotificacaoVencimento(os, msg) {
  const chaveStorage = `boleto_aviso_${os.id}_${msg.substring(0, 20)}`;
  if (sessionStorage.getItem(chaveStorage)) return;
  sessionStorage.setItem(chaveStorage, '1');

  const notif = document.createElement('div');
  notif.style.cssText = `position:fixed;top:20px;right:20px;z-index:99999;background:linear-gradient(135deg,#7f1d1d,#991b1b);border:2px solid #ef4444;border-radius:12px;padding:16px 20px;max-width:340px;box-shadow:0 8px 24px rgba(239,68,68,0.35);animation:slideUp 0.3s ease;`;
  notif.innerHTML = `
    <div style="display:flex;align-items:start;gap:12px;">
      <i class="fas fa-bell" style="color:#fca5a5;font-size:20px;margin-top:2px;flex-shrink:0;"></i>
      <div style="flex:1;min-width:0;">
        <div style="color:#fca5a5;font-weight:700;font-size:13px;margin-bottom:4px;">Aviso de Vencimento</div>
        <div style="color:#fff;font-size:12px;margin-bottom:6px;font-weight:600;">${escapeHtml(os.cliente || '')}</div>
        <div style="color:#fca5a5;font-size:11px;">${msg}</div>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button onclick="abrirModalPagamento('${os.id}');this.closest('[style]').remove()" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Registrar Pagamento</button>
          <button onclick="this.closest('[style]').remove()" style="background:rgba(255,255,255,0.1);border:none;color:#fca5a5;padding:6px 10px;border-radius:6px;font-size:11px;cursor:pointer;">Fechar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(notif);
  setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 15000);
}



// =============================
// RECIBO DE QUITAÇÃO  ← mesmo layout da OS
// =============================
async function gerarReciboQuitacao(orderId) {
  const ordem = allOrders.find(o => o.id === orderId);
  if (!ordem) { showToast('Ordem não encontrada', 'error'); return; }

  try {
    showToast('Gerando recibo de quitação...', 'info');

    const totalFinal = Number(ordem.total) || Number(ordem.preco) || 0;
    const dataStr = ordem.data ? new Date(ordem.data).toLocaleDateString('pt-BR') : '-';
    const dataPgto = ordem.dataPagamento ? new Date(ordem.dataPagamento).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const formaPgto = ordem.payment_method || ordem.formaPagamento || 'Não informado';
    const idx = allOrders.findIndex(o => o.id === ordem.id);
    const numOS = idx !== -1 ? idx + 1 : '-';
    const ano = new Date().getFullYear();

    let assinaturaBase64 = null;
    try {
      const sigSnap = await database.ref('configuracoes/assinatura').once('value');
      assinaturaBase64 = sigSnap.val();
    } catch (e) { }

    const assinaturaEmpresaHTML = assinaturaBase64
      ? `<img src="${assinaturaBase64}" style="max-height:50px;max-width:180px;display:block;margin:0 auto;">`
      : `<div class="pdf-nota-assinatura-linha"></div>`;

    const html = pdfHtmlShell(`
      <div class="pdf-nota-page">
        ${pdfHeaderPadrao({
      titulo: '<i class="fas fa-receipt"></i> RECIBO DE QUITAÇÃO',
      subtitulo: `Comprovante de Pagamento — OS Nº ${numOS} / ${ano}`,
      rightLines: [`Data OS: ${dataStr}`, `Pgto: ${dataPgto}`, `Emissão: ${new Date().toLocaleDateString('pt-BR')}`]
    })}

        <div class="pdf-nota-body">
          <div class="pdf-stamp">QUITADO</div>

          <!-- DADOS DO CLIENTE -->
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title vermelho"><i class="fas fa-user-circle"></i> DADOS DO CLIENTE</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-dados-inline">
                <div class="pdf-nota-dado-item destaque">
                  <div class="pdf-nota-dado-label">Cliente</div>
                  <div class="pdf-nota-dado-valor">${escapeHtml(ordem.cliente || '-')}</div>
                </div>
                <div class="pdf-nota-dado-item">
                  <div class="pdf-nota-dado-label">CPF / CNPJ</div>
                  <div class="pdf-nota-dado-valor">${escapeHtml(ordem.cnpj || '-')}</div>
                </div>
                <div class="pdf-nota-dado-item">
                  <div class="pdf-nota-dado-label">Telefone</div>
                  <div class="pdf-nota-dado-valor">${escapeHtml(ordem.telefone || ordem.contato || '-')}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- DADOS DO SERVIÇO -->
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-tools"></i> SERVIÇO PRESTADO</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-dados-inline">
                <div class="pdf-nota-dado-item destaque">
                  <div class="pdf-nota-dado-label">Serviço</div>
                  <div class="pdf-nota-dado-valor">${escapeHtml(ordem.servico || '-')}</div>
                </div>
                <div class="pdf-nota-dado-item">
                  <div class="pdf-nota-dado-label">Técnico Responsável</div>
                  <div class="pdf-nota-dado-valor">${escapeHtml(ordem.tecnico || '-')}</div>
                </div>
                <div class="pdf-nota-dado-item">
                  <div class="pdf-nota-dado-label">Data de Execução</div>
                  <div class="pdf-nota-dado-valor">${dataStr}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- DADOS DO PAGAMENTO -->
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-credit-card"></i> INFORMAÇÕES DE PAGAMENTO</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-dados-inline">
                <div class="pdf-nota-dado-item verde">
                  <div class="pdf-nota-dado-label">Status</div>
                  <div class="pdf-nota-dado-valor" style="color:#15803d;"><i class="fas fa-check-circle"></i> PAGO</div>
                </div>
                <div class="pdf-nota-dado-item">
                  <div class="pdf-nota-dado-label">Forma de Pagamento</div>
                  <div class="pdf-nota-dado-valor">${escapeHtml(formaPgto)}</div>
                </div>
                <div class="pdf-nota-dado-item">
                  <div class="pdf-nota-dado-label">Data do Pagamento</div>
                  <div class="pdf-nota-dado-valor">${dataPgto}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- VALOR TOTAL -->
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title verde"><i class="fas fa-check-circle"></i> VALOR TOTAL RECEBIDO</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-resumo-compact">
                <div class="pdf-nota-resumo-item">
                  <div class="pdf-nota-resumo-label"><i class="fas fa-hashtag"></i> Nº OS</div>
                  <div class="pdf-nota-resumo-valor">${numOS}</div>
                </div>
                <div class="pdf-nota-resumo-item">
                  <div class="pdf-nota-resumo-label"><i class="fas fa-calendar"></i> Ano</div>
                  <div class="pdf-nota-resumo-valor">${ano}</div>
                </div>
                <div class="pdf-nota-resumo-item">
                  <div class="pdf-nota-resumo-label"><i class="fas fa-wallet"></i> Forma</div>
                  <div class="pdf-nota-resumo-valor" style="font-size:9px;">${escapeHtml(formaPgto)}</div>
                </div>
                <div class="pdf-nota-resumo-item verde">
                  <div class="pdf-nota-resumo-label"><i class="fas fa-money-bill-wave"></i> Valor Recebido</div>
                  <div class="pdf-nota-resumo-valor">${totalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- DECLARAÇÃO -->
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-file-signature"></i> DECLARAÇÃO</div>
            <div class="pdf-nota-section-content">
              <p class="pdf-declaracao">
                <i class="fas fa-check-double" style="color:#16a34a;margin-right:6px;"></i>
                Declaro para os devidos fins que recebi a quantia de
                <strong>${totalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                referente aos serviços prestados descritos neste documento, dando plena e irrevogável quitação.
              </p>
            </div>
          </div>

          <!-- ASSINATURAS -->
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-pen-square"></i> ASSINATURAS</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-assinaturas">
                <div class="pdf-nota-assinatura-campo">
                  ${assinaturaEmpresaHTML}
                  <div class="pdf-nota-assinatura-nome">Técnico / Empresa</div>
                  <div class="pdf-nota-assinatura-info">
                    EXTINMAIS${(window.currentUser && window.currentUser.cnpj) ? '<br>CNPJ: ' + window.currentUser.cnpj : ''}${(window.currentUser && window.currentUser.telefone) ? '<br>' + window.currentUser.telefone : ''}
                  </div>
                </div>
                <div class="pdf-nota-assinatura-campo">
                  <div class="pdf-nota-assinatura-linha"></div>
                  <div class="pdf-nota-assinatura-nome">Cliente</div>
                  <div class="pdf-nota-assinatura-info">
                    ${escapeHtml(ordem.cliente || '_____________________')}<br>
                    CPF/CNPJ: ${escapeHtml(ordem.cnpj || '_____________________')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${pdfFooterPadrao()}
      </div>
    `);

    await renderizarEBaixarPDF(html, `Recibo_Quitacao_${ordem.cliente || 'cliente'}_${Date.now()}.pdf`);
    showToast('Recibo gerado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao gerar recibo:', error);
    showToast('Erro ao gerar recibo', 'error');
  }
}

// =============================
// MODAL RELATÓRIO
// =============================
function abrirRelatorio() {
  const overlay = document.createElement('div');
  overlay.id = 'relatorioOverlay';
  overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;animation:fadeIn 0.2s ease;`;

  const totalGeral = allOrders.reduce((acc, o) => acc + (Number(o.total) || Number(o.preco) || 0), 0);
  const totalPago = allOrders.filter(o => o.payment_status === 'Pago' || o.statusPagamento === 'Pago').reduce((acc, o) => acc + (Number(o.total) || Number(o.preco) || 0), 0);
  const totalAberto = totalGeral - totalPago;
  const qtdFinalizadas = allOrders.filter(o => /conclu|finaliz/i.test(String(o.status || o.estado || ''))).length;
  const qtdPendentes = allOrders.length - qtdFinalizadas;
  const grupos = agruparOrdensPorMes(allOrders);

  const linhasMes = grupos.map(g => {
    const totalMes = g.items.reduce((acc, o) => acc + (Number(o.total) || Number(o.preco) || 0), 0);
    const pagasMes = g.items.filter(o => o.payment_status === 'Pago' || o.statusPagamento === 'Pago').length;
    const pendMes = g.items.length - pagasMes;
    return `
      <tr style="border-bottom:1px solid #333;">
        <td style="padding:10px 12px;color:#D4C29A;font-weight:600;text-transform:capitalize;">${g.label}</td>
        <td style="padding:10px 12px;color:#fff;text-align:center;">${g.items.length}</td>
        <td style="padding:10px 12px;color:#4ade80;text-align:center;">${pagasMes}</td>
        <td style="padding:10px 12px;color:#f87171;text-align:center;">${pendMes}</td>
        <td style="padding:10px 12px;color:#4ade80;font-weight:700;text-align:right;">${totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td style="padding:10px 12px;text-align:center;">
          <button onclick="baixarPDFMes('${g.chave}')" style="background:rgba(244,63,94,0.15);border:1px solid #f43f5e;color:#f43f5e;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;">
            <i class="fas fa-file-pdf"></i> PDF
          </button>
        </td>
      </tr>`;
  }).join('');

  overlay.innerHTML = `
    <div style="background:#1a1a1a;border:2px solid #D4C29A;border-radius:16px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.9);animation:slideUp 0.3s ease;">
      <div style="padding:20px 24px;border-bottom:2px solid #D4C29A;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#1a1a1a;z-index:1;">
        <h3 style="color:#D4C29A;margin:0;font-size:20px;display:flex;align-items:center;gap:10px;">
          <i class="fas fa-chart-bar"></i> Relatório de Ordens de Serviço
        </h3>
        <button onclick="document.getElementById('relatorioOverlay').remove()" style="background:none;border:none;color:#999;font-size:20px;cursor:pointer;">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div style="padding:24px;">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px;">
          <div style="background:#0d0d0d;border:1px solid #333;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-chart-line" style="margin-right:4px;"></i>Faturamento Total</div>
            <div style="font-size:22px;font-weight:800;color:#4ade80;">${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
          <div style="background:#0d0d0d;border:1px solid #333;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-check-circle" style="margin-right:4px;"></i>Recebido</div>
            <div style="font-size:22px;font-weight:800;color:#D4C29A;">${totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
          <div style="background:#0d0d0d;border:1px solid #333;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-exclamation-circle" style="margin-right:4px;"></i>Em Aberto</div>
            <div style="font-size:22px;font-weight:800;color:#f87171;">${totalAberto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
          <div style="background:#0d0d0d;border:1px solid #333;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:6px;"><i class="fas fa-clipboard-list" style="margin-right:4px;"></i>OS: Finalizadas / Pendentes</div>
            <div style="font-size:22px;font-weight:800;color:#fff;">${qtdFinalizadas} <span style="color:#555;font-size:16px;">/</span> <span style="color:#f87171;">${qtdPendentes}</span></div>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <div style="color:#D4C29A;font-size:13px;font-weight:700;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">
            <i class="fas fa-calendar-alt" style="margin-right:6px;"></i> Por Mês
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#2a2a2a;">
                  <th style="padding:10px 12px;color:#D4C29A;text-align:left;font-size:11px;">Mês</th>
                  <th style="padding:10px 12px;color:#D4C29A;text-align:center;font-size:11px;">Total OS</th>
                  <th style="padding:10px 12px;color:#4ade80;text-align:center;font-size:11px;">Pagas</th>
                  <th style="padding:10px 12px;color:#f87171;text-align:center;font-size:11px;">Pendentes</th>
                  <th style="padding:10px 12px;color:#4ade80;text-align:right;font-size:11px;">Faturamento</th>
                  <th style="padding:10px 12px;color:#D4C29A;text-align:center;font-size:11px;">PDF</th>
                </tr>
              </thead>
              <tbody>${linhasMes}</tbody>
            </table>
          </div>
        </div>
        <div style="display:flex;gap:10px;">
          <button onclick="baixarRelatorioPDF()" style="flex:1;padding:12px;background:linear-gradient(135deg,#b91c1c,#dc2626);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
            <i class="fas fa-file-pdf"></i> Baixar Relatório Completo em PDF
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

// =============================
// PDF RELATÓRIO COMPLETO  ← mesmo layout da OS
// =============================
async function baixarRelatorioPDF() {
  showToast('Gerando relatório completo...', 'info');

  const totalGeral = allOrders.reduce((acc, o) => acc + (Number(o.total) || Number(o.preco) || 0), 0);
  const totalPago = allOrders.filter(o => o.payment_status === 'Pago' || o.statusPagamento === 'Pago').reduce((acc, o) => acc + (Number(o.total) || Number(o.preco) || 0), 0);
  const totalAberto = totalGeral - totalPago;
  const qtdFinalizadas = allOrders.filter(o => /conclu|finaliz/i.test(String(o.status || o.estado || ''))).length;
  const grupos = agruparOrdensPorMes(allOrders);

  const linhasMes = grupos.map((g, idx) => {
    const totalMes = g.items.reduce((acc, o) => acc + (Number(o.total) || Number(o.preco) || 0), 0);
    const pagasMes = g.items.filter(o => o.payment_status === 'Pago' || o.statusPagamento === 'Pago').length;
    const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `
      <tr style="background:${bg};">
        <td style="padding:7px 10px;font-weight:600;text-transform:capitalize;">${g.label}</td>
        <td style="padding:7px 10px;text-align:center;">${g.items.length}</td>
        <td style="padding:7px 10px;text-align:center;color:#16a34a;font-weight:700;">${pagasMes}</td>
        <td style="padding:7px 10px;text-align:center;color:#dc2626;font-weight:700;">${g.items.length - pagasMes}</td>
        <td style="padding:7px 10px;text-align:right;color:#16a34a;font-weight:700;">${totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>`;
  }).join('');

  const linhasOS = allOrders.map((os, idx) => {
    const statusPag = os.payment_status || os.statusPagamento || 'Não Pago';
    const statusOS = /conclu|finaliz/i.test(String(os.status || os.estado || '')) ? 'Finalizada' : 'Pendente';
    const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `
      <tr style="background:${bg};">
        <td style="padding:5px 8px;">${escapeHtml(os.cliente || '-')}</td>
        <td style="padding:5px 8px;">${escapeHtml(os.servico || '-')}</td>
        <td style="padding:5px 8px;">${os.data ? new Date(os.data).toLocaleDateString('pt-BR') : '-'}</td>
        <td style="padding:5px 8px;color:${statusOS === 'Finalizada' ? '#16a34a' : '#dc2626'};font-weight:700;">${statusOS}</td>
        <td style="padding:5px 8px;color:${statusPag === 'Pago' ? '#16a34a' : '#dc2626'};font-weight:700;">${statusPag}</td>
        <td style="padding:5px 8px;text-align:right;color:#16a34a;font-weight:700;">${(Number(os.total) || Number(os.preco) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>`;
  }).join('');

  const html = pdfHtmlShell(`
    <div class="pdf-nota-page">
      ${pdfHeaderPadrao({
    titulo: '<i class="fas fa-chart-bar"></i> RELATÓRIO GERAL DE SERVIÇOS',
    subtitulo: `Emitido em: ${new Date().toLocaleString('pt-BR')}`,
    rightLines: [`Total OS: ${allOrders.length}`, `Finalizadas: ${qtdFinalizadas}`]
  })}

      <div class="pdf-nota-body">

        <!-- KPIs -->
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title vermelho"><i class="fas fa-tachometer-alt"></i> RESUMO GERAL</div>
          <div class="pdf-nota-section-content">
            <div class="pdf-nota-resumo-compact">
              <div class="pdf-nota-resumo-item verde">
                <div class="pdf-nota-resumo-label"><i class="fas fa-chart-line"></i> Faturamento Total</div>
                <div class="pdf-nota-resumo-valor">${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item">
                <div class="pdf-nota-resumo-label"><i class="fas fa-check-circle"></i> Recebido</div>
                <div class="pdf-nota-resumo-valor" style="color:#16a34a;">${totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item">
                <div class="pdf-nota-resumo-label"><i class="fas fa-clock"></i> Em Aberto</div>
                <div class="pdf-nota-resumo-valor" style="color:#dc2626;">${totalAberto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item destaque">
                <div class="pdf-nota-resumo-label"><i class="fas fa-clipboard-list"></i> Total de OS</div>
                <div class="pdf-nota-resumo-valor">${allOrders.length} <span style="font-size:10px;opacity:0.8;">(${qtdFinalizadas} fin.)</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- RESUMO POR MÊS -->
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title"><i class="fas fa-calendar-alt"></i> RESUMO POR MÊS</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead>
                <tr>
                  <th><i class="fas fa-calendar"></i> Mês</th>
                  <th style="text-align:center;">Total OS</th>
                  <th style="text-align:center;color:#bbf7d0;">Pagas</th>
                  <th style="text-align:center;color:#fecaca;">Pendentes</th>
                  <th style="text-align:right;">Faturamento</th>
                </tr>
              </thead>
              <tbody>${linhasMes}</tbody>
            </table>
          </div>
        </div>

        <!-- TODAS AS OS -->
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title"><i class="fas fa-list-alt"></i> TODAS AS ORDENS DE SERVIÇO</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead>
                <tr>
                  <th><i class="fas fa-user"></i> Cliente</th>
                  <th>Serviço</th>
                  <th>Data</th>
                  <th>Status OS</th>
                  <th>Pagamento</th>
                  <th style="text-align:right;">Valor</th>
                </tr>
              </thead>
              <tbody>${linhasOS}</tbody>
              <tfoot>
                <tr>
                  <td colspan="5" style="text-align:right;"><i class="fas fa-sigma"></i> TOTAL GERAL:</td>
                  <td style="text-align:right;">${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
      ${pdfFooterPadrao()}
    </div>
  `);

  await renderizarEBaixarPDF(html, `Relatorio_Geral_EXTINMAIS_${Date.now()}.pdf`);
  showToast('Relatório gerado!', 'success');
}

// =============================
// PDF POR MÊS  ← mesmo layout da OS
// =============================
async function baixarPDFMes(chave) {
  const grupos = agruparOrdensPorMes(allOrders);
  const grupo = grupos.find(g => g.chave === chave);
  if (!grupo) { showToast('Mês não encontrado', 'error'); return; }

  showToast(`Gerando PDF de ${grupo.label}...`, 'info');

  const totalMes = grupo.items.reduce((acc, o) => acc + (Number(o.total) || Number(o.preco) || 0), 0);
  const totalPago = grupo.items.filter(o => o.payment_status === 'Pago' || o.statusPagamento === 'Pago').reduce((acc, o) => acc + (Number(o.total) || Number(o.preco) || 0), 0);
  const pagasMes = grupo.items.filter(o => o.payment_status === 'Pago' || o.statusPagamento === 'Pago').length;
  const pendMes = grupo.items.length - pagasMes;

  const linhas = grupo.items.map((os, idx) => {
    const statusPag = os.payment_status || os.statusPagamento || 'Não Pago';
    const statusOS = /conclu|finaliz/i.test(String(os.status || os.estado || '')) ? 'Finalizada' : 'Pendente';
    const forma = os.payment_method || os.formaPagamento || '-';
    const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `
      <tr style="background:${bg};">
        <td style="padding:6px 8px;font-weight:600;">${escapeHtml(os.cliente || '-')}</td>
        <td style="padding:6px 8px;">${escapeHtml(os.servico || '-')}</td>
        <td style="padding:6px 8px;">${os.data ? new Date(os.data).toLocaleDateString('pt-BR') : '-'}</td>
        <td style="padding:6px 8px;color:${statusOS === 'Finalizada' ? '#16a34a' : '#dc2626'};font-weight:700;">${statusOS}</td>
        <td style="padding:6px 8px;color:${statusPag === 'Pago' ? '#16a34a' : '#dc2626'};font-weight:700;">${statusPag}</td>
        <td style="padding:6px 8px;">${escapeHtml(forma)}</td>
        <td style="padding:6px 8px;text-align:right;color:#16a34a;font-weight:800;">${(Number(os.total) || Number(os.preco) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>`;
  }).join('');

  const html = pdfHtmlShell(`
    <div class="pdf-nota-page">
      ${pdfHeaderPadrao({
    titulo: `<i class="fas fa-calendar-alt"></i> OS — ${grupo.label.toUpperCase()}`,
    subtitulo: `${grupo.items.length} ordens &bull; ${pagasMes} pagas &bull; ${pendMes} pendentes`,
    rightLines: [`Emitido: ${new Date().toLocaleDateString('pt-BR')}`]
  })}

      <div class="pdf-nota-body">

        <!-- KPIs DO MÊS -->
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title vermelho"><i class="fas fa-tachometer-alt"></i> RESUMO DO MÊS — ${grupo.label.toUpperCase()}</div>
          <div class="pdf-nota-section-content">
            <div class="pdf-nota-resumo-compact">
              <div class="pdf-nota-resumo-item verde">
                <div class="pdf-nota-resumo-label"><i class="fas fa-chart-line"></i> Faturamento</div>
                <div class="pdf-nota-resumo-valor">${totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item">
                <div class="pdf-nota-resumo-label"><i class="fas fa-check-circle"></i> Recebido</div>
                <div class="pdf-nota-resumo-valor" style="color:#16a34a;">${totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div class="pdf-nota-resumo-item">
                <div class="pdf-nota-resumo-label"><i class="fas fa-clipboard-list"></i> Total OS</div>
                <div class="pdf-nota-resumo-valor">${grupo.items.length}</div>
              </div>
              <div class="pdf-nota-resumo-item destaque">
                <div class="pdf-nota-resumo-label"><i class="fas fa-exclamation-circle"></i> Pendentes Pgto.</div>
                <div class="pdf-nota-resumo-valor">${pendMes}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABELA DE OS DO MÊS -->
        <div class="pdf-nota-section">
          <div class="pdf-nota-section-title"><i class="fas fa-list-alt"></i> ORDENS DE SERVIÇO — ${grupo.label.toUpperCase()}</div>
          <div class="pdf-nota-section-content" style="padding:0;">
            <table class="pdf-tabela">
              <thead>
                <tr>
                  <th><i class="fas fa-user"></i> Cliente</th>
                  <th>Serviço</th>
                  <th>Data</th>
                  <th>Status OS</th>
                  <th>Pgto.</th>
                  <th>Forma</th>
                  <th style="text-align:right;">Valor</th>
                </tr>
              </thead>
              <tbody>${linhas}</tbody>
              <tfoot>
                <tr>
                  <td colspan="6" style="text-align:right;"><i class="fas fa-sigma"></i> TOTAL DO MÊS:</td>
                  <td style="text-align:right;">${totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
      ${pdfFooterPadrao()}
    </div>
  `);

  await renderizarEBaixarPDF(html, `OS_${grupo.label.replace(/\s/g, '_')}_EXTINMAIS_${Date.now()}.pdf`);
  showToast(`PDF de ${grupo.label} gerado!`, 'success');
}

// =============================
// HELPER: RENDERIZAR HTML → PDF
// =============================
async function renderizarEBaixarPDF(htmlContent, nomeArquivo) {
  await new Promise(resolve => setTimeout(resolve, 100));

  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  div.style.top = '0';
  div.style.width = '210mm';
  div.innerHTML = htmlContent;
  document.body.appendChild(div);

  const containers = div.querySelectorAll('.pdf-nota-page, .recibo-page, .page');
  const renderTargets = containers.length > 0 ? Array.from(containers) : [div.firstElementChild];

  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 300));

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  for (let i = 0; i < renderTargets.length; i++) {
    if (i > 0) pdf.addPage();
    const canvas = await html2canvas(renderTargets[i], {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: renderTargets[i].scrollWidth,
      height: renderTargets[i].scrollHeight,
      windowWidth: 794  // 210mm em ~96dpi
    });
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, '', 'FAST');
  }

  document.body.removeChild(div);
  pdf.save(nomeArquivo);
}

// =============================
// GERAR PDF DA ORDEM DE SERVIÇO
// =============================
async function gerarPDFOrdem(orderId, tipoRelatorio = 'com_valores') {
  const ordem = allOrders.find(o => o.id === orderId);
  if (!ordem) { showToast('Ordem não encontrada', 'error'); return; }

  try {
    const msgs = {
      'com_valores': 'Gerando PDF com valor total...',
      'sem_valores': 'Gerando PDF sem valores...',
      'valores_detalhados': 'Gerando PDF com valores detalhados...',
      'sem_quantidade': 'Gerando PDF sem quantidade...'
    };
    showToast(msgs[tipoRelatorio] || 'Gerando PDF...', 'info');

    const produtosOriginais = Array.isArray(ordem.products) ? ordem.products : [];
    const produtos = agruparProdutos(produtosOriginais);
    const dataStr = ordem.data ? new Date(ordem.data).toLocaleDateString('pt-BR') : '-';
    const formaPagamento = ordem.payment_method || ordem.formaPagamento || 'Não informado';
    const statusPagamento = ordem.payment_status || ordem.statusPagamento || 'Não Pago';
    const totalFinal = Number(ordem.total) || Number(ordem.preco) || 0;
    const statusText = (ordem.status || ordem.estado || (ordem.completed ? 'Concluída' : 'Pendente')).toString();

    // ── Numeração sequencial dentro do mês ──────────────────────────────────
    const d = ordem.data ? new Date(ordem.data) : new Date(0);
    const chavesMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const ordensDesseMes = allOrders
      .filter(o => {
        const od = o.data ? new Date(o.data) : new Date(0);
        return `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, '0')}` === chavesMes;
      });
    const indexNoMes = ordensDesseMes.findIndex(o => o.id === ordem.id);
    const numeroSequencial = indexNoMes !== -1 ? String(indexNoMes + 1).padStart(2, '0') : '-';
    // ────────────────────────────────────────────────────────────────────────

    let numero = ordem.numeroPredio || ordem.numeroEmpresa || '';
    let enderecoCompleto = ordem.endereco || '-';
    if (numero) enderecoCompleto = `${enderecoCompleto}, Nº ${numero}`;
    const qtdTotal = produtos.reduce((acc, p) => acc + p.qty, 0);

    let assinaturaBase64 = null;
    try {
      const sigSnap = await database.ref('configuracoes/assinatura').once('value');
      assinaturaBase64 = sigSnap.val();
    } catch (e) { }

    const assinaturaEmpresaHTML = assinaturaBase64
      ? `<img src="${assinaturaBase64}" style="max-height:50px;max-width:180px;display:block;margin:0 auto;">`
      : `<div class="pdf-nota-assinatura-linha"></div>`;

    const qtdProdutos = produtos.length;
    let fontSizes = { tabelaTh: '10px', tabelaTd: '11px', tabelaNumero: '9px', maxNomeLength: 80 };
    if (qtdProdutos > 10 && qtdProdutos <= 30) fontSizes = { tabelaTh: '8px', tabelaTd: '9px', tabelaNumero: '7px', maxNomeLength: 60 };
    else if (qtdProdutos > 30 && qtdProdutos <= 60) fontSizes = { tabelaTh: '7px', tabelaTd: '7.5px', tabelaNumero: '6px', maxNomeLength: 45 };
    else if (qtdProdutos > 60) fontSizes = { tabelaTh: '6px', tabelaTd: '6.5px', tabelaNumero: '5px', maxNomeLength: 35 };

    function dividirEmColunas(array, itensPorColuna) {
      const colunas = [];
      for (let i = 0; i < array.length; i += itensPorColuna) colunas.push(array.slice(i, i + itensPorColuna));
      return colunas;
    }

    const ITENS_PRIMEIRA_PAGINA = 10;
    const ITENS_POR_COLUNA_PRIM = 10;
    const ITENS_POR_COLUNA = 40;
    const COLUNAS_POR_PAGINA = 1;
    let paginasProdutos = [];

    if (produtos.length > 0) {
      const primeiros = produtos.slice(0, ITENS_PRIMEIRA_PAGINA);
      paginasProdutos.push(dividirEmColunas(primeiros, ITENS_POR_COLUNA_PRIM));
      if (produtos.length > ITENS_PRIMEIRA_PAGINA) {
        const restantes = produtos.slice(ITENS_PRIMEIRA_PAGINA);
        const cols = dividirEmColunas(restantes, ITENS_POR_COLUNA);
        for (let i = 0; i < cols.length; i += COLUNAS_POR_PAGINA) paginasProdutos.push(cols.slice(i, i + COLUNAS_POR_PAGINA));
      }
    }

    const totalPaginas = paginasProdutos.length;
    const truncarNome = (nome, max = fontSizes.maxNomeLength) => {
      if (!nome) return '-';
      return nome.length <= max ? nome : nome.substring(0, max) + '...';
    };

    const renderizarTabelaProdutos = (lista, offset = 0) => {
      if (!lista || !lista.length) return '';
      if (tipoRelatorio === 'valores_detalhados') {
        return `<table style="width:100%;border-collapse:collapse;background:white;font-size:${fontSizes.tabelaTd};border:2px solid #d1d5db;border-radius:6px;overflow:hidden;">
          <thead style="background:linear-gradient(135deg,#4b5563,#6b7280);color:white;">
            <tr>
              <th style="padding:6px 8px;text-align:center;font-size:${fontSizes.tabelaTh};width:30px;border-right:1px solid rgba(255,255,255,0.2);">N°</th>
              <th style="padding:6px 8px;text-align:left;font-size:${fontSizes.tabelaTh};border-right:1px solid rgba(255,255,255,0.2);">Produto</th>
              <th style="padding:6px 8px;text-align:center;font-size:${fontSizes.tabelaTh};width:40px;border-right:1px solid rgba(255,255,255,0.2);">Qtd</th>
              <th style="padding:6px 8px;text-align:right;font-size:${fontSizes.tabelaTh};width:65px;border-right:1px solid rgba(255,255,255,0.2);">Unit.</th>
              <th style="padding:6px 8px;text-align:right;font-size:${fontSizes.tabelaTh};width:70px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lista.map((p, idx) => {
          const valorUn = (Number(p.price) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const subtotal = ((Number(p.price) || 0) * p.qty).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
          return `<tr style="background:${bg};border-bottom:1px solid #e5e7eb;">
                <td style="padding:5px 8px;color:#6b7280;text-align:center;font-weight:700;font-size:${fontSizes.tabelaNumero};border-right:1px solid #e5e7eb;">${offset + idx + 1}</td>
                <td style="padding:5px 8px;color:#374151;white-space:nowrap;font-size:${fontSizes.tabelaTd};border-right:1px solid #e5e7eb;">${truncarNome(p.name)}</td>
                <td style="padding:5px 8px;color:#374151;text-align:center;font-weight:600;font-size:${fontSizes.tabelaTd};border-right:1px solid #e5e7eb;">${p.qty}x</td>
                <td style="padding:5px 8px;color:#b91c1c;text-align:right;font-weight:600;font-size:${fontSizes.tabelaTd};border-right:1px solid #e5e7eb;">${valorUn}</td>
                <td style="padding:5px 8px;color:#1f2937;text-align:right;font-weight:700;font-size:${fontSizes.tabelaTd};">${subtotal}</td>
              </tr>`;
        }).join('')}
          </tbody>
        </table>`;
      } else if (tipoRelatorio === 'sem_quantidade') {
        return `<table style="width:100%;border-collapse:collapse;background:white;font-size:${fontSizes.tabelaTd};border:2px solid #d1d5db;border-radius:6px;overflow:hidden;">
          <thead style="background:linear-gradient(135deg,#4b5563,#6b7280);color:white;">
            <tr>
              <th style="padding:6px 8px;text-align:center;font-size:${fontSizes.tabelaTh};width:30px;border-right:1px solid rgba(255,255,255,0.2);">N°</th>
              <th style="padding:6px 8px;text-align:left;font-size:${fontSizes.tabelaTh};">Produto</th>
            </tr>
          </thead>
          <tbody>
            ${lista.map((p, idx) => `<tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};border-bottom:1px solid #e5e7eb;">
              <td style="padding:5px 8px;color:#6b7280;text-align:center;font-weight:700;font-size:${fontSizes.tabelaNumero};border-right:1px solid #e5e7eb;">${offset + idx + 1}</td>
              <td style="padding:5px 8px;color:#374151;white-space:nowrap;font-size:${fontSizes.tabelaTd};">${truncarNome(p.name)}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
      } else {
        return `<table style="width:100%;border-collapse:collapse;background:white;font-size:${fontSizes.tabelaTd};border:2px solid #d1d5db;border-radius:6px;overflow:hidden;">
          <thead style="background:linear-gradient(135deg,#4b5563,#6b7280);color:white;">
            <tr>
              <th style="padding:6px 8px;text-align:center;font-size:${fontSizes.tabelaTh};width:30px;border-right:1px solid rgba(255,255,255,0.2);">N°</th>
              <th style="padding:6px 8px;text-align:left;font-size:${fontSizes.tabelaTh};border-right:1px solid rgba(255,255,255,0.2);">Produto</th>
              <th style="padding:6px 8px;text-align:center;font-size:${fontSizes.tabelaTh};width:40px;">Qtd</th>
            </tr>
          </thead>
          <tbody>
            ${lista.map((p, idx) => `<tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};border-bottom:1px solid #e5e7eb;">
              <td style="padding:5px 8px;color:#6b7280;text-align:center;font-weight:700;font-size:${fontSizes.tabelaNumero};border-right:1px solid #e5e7eb;">${offset + idx + 1}</td>
              <td style="padding:5px 8px;color:#374151;white-space:nowrap;font-size:${fontSizes.tabelaTd};border-right:1px solid #e5e7eb;">${truncarNome(p.name)}</td>
              <td style="padding:5px 8px;color:#374151;text-align:center;font-weight:600;font-size:${fontSizes.tabelaTd};">${p.qty}x</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
      }
    };

    const gerarHeaderOS = (numeroPagina = 1) => `
      <div class="pdf-nota-header">
        <div class="pdf-nota-header-top">
          <div class="pdf-nota-logo-section">
            ${typeof getPDFLogoHtml === 'function' ? getPDFLogoHtml('dark') : '<div class="pdf-nota-logo-header"><i class="fas fa-fire-extinguisher" style="font-size:16px;opacity:0.9;"></i><div class="pdf-nota-logo-text">EXTINMAIS</div></div>'}
          </div>
          <div class="pdf-nota-header-center">
            <h1>NOTA DE SERVIÇO${numeroPagina > 1 ? ` — PARTE ${numeroPagina}` : ''}</h1>
            <p>Nº OS: ${numeroSequencial}</p>
          </div>
          <div class="pdf-nota-header-right">
            <div class="pdf-nota-header-item">Status: ${statusText}</div>
            <div class="pdf-nota-header-item">Data: ${dataStr}</div>
            ${totalPaginas > 1 ? `<div class="pdf-nota-header-item">Pág: ${numeroPagina}/${totalPaginas}</div>` : ''}
          </div>
        </div>
      </div>`;

    const gerarPrimeiraPagina = () => `
      <div class="pdf-nota-page">
        ${gerarHeaderOS(1)}
        <div class="pdf-nota-body">

          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title vermelho"><i class="fas fa-user-circle"></i> DADOS DO CLIENTE</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-dados-inline">
                <div class="pdf-nota-dado-item destaque"><div class="pdf-nota-dado-label">Cliente</div><div class="pdf-nota-dado-valor">${ordem.cliente || '-'}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">CPF/CNPJ</div><div class="pdf-nota-dado-valor">${ordem.cnpj || '____'}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">Telefone</div><div class="pdf-nota-dado-valor">${ordem.telefone || ordem.contato || '____'}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">E-mail</div><div class="pdf-nota-dado-valor">${ordem.email || '____'}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">Endereço</div><div class="pdf-nota-dado-valor">${enderecoCompleto}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">CEP</div><div class="pdf-nota-dado-valor">${ordem.cep || '____'}</div></div>
              </div>
            </div>
          </div>

          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-tools"></i> DESCRIÇÃO DO SERVIÇO</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-dados-inline">
                <div class="pdf-nota-dado-item destaque"><div class="pdf-nota-dado-label">Serviço</div><div class="pdf-nota-dado-valor">${ordem.servico || '-'}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">Técnico</div><div class="pdf-nota-dado-valor">${ordem.tecnico || '-'}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">Data Execução</div><div class="pdf-nota-dado-valor">${dataStr}</div></div>
                <div class="pdf-nota-dado-item"><div class="pdf-nota-dado-label">Cidade</div><div class="pdf-nota-dado-valor">${ordem.cidade || '-'}</div></div>
              </div>
            </div>
          </div>

          ${produtos.length && paginasProdutos[0] ? `
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-box"></i> MATERIAIS E PRODUTOS ${tipoRelatorio === 'sem_quantidade' ? `(${produtos.length} itens)` : `(${qtdTotal} un.)`}</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-produtos-columns">
                ${paginasProdutos[0].map((col, idx) => `<div>${renderizarTabelaProdutos(col, idx * ITENS_POR_COLUNA_PRIM)}</div>`).join('')}
              </div>
            </div>
          </div>` : ''}

          ${tipoRelatorio !== 'sem_valores' ? `
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title vermelho"><i class="fas fa-chart-line"></i> RESUMO FINANCEIRO</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-resumo-compact">
                <div class="pdf-nota-resumo-item"><div class="pdf-nota-resumo-label">Total Itens</div><div class="pdf-nota-resumo-valor">${tipoRelatorio === 'sem_quantidade' ? produtos.length : qtdTotal}</div></div>
                <div class="pdf-nota-resumo-item"><div class="pdf-nota-resumo-label">Pagamento</div><div class="pdf-nota-resumo-valor" style="font-size:9px;">${formaPagamento}</div></div>
                <div class="pdf-nota-resumo-item"><div class="pdf-nota-resumo-label">Status</div><div class="pdf-nota-resumo-valor" style="font-size:9px;color:${statusPagamento === 'Pago' ? '#22c55e' : '#ef4444'};">${statusPagamento}</div></div>
                <div class="pdf-nota-resumo-item destaque"><div class="pdf-nota-resumo-label">Valor Total</div><div class="pdf-nota-resumo-valor">${totalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></div>
              </div>
            </div>
          </div>` : ''}

          ${ordem.observacoes || ordem.notas || ordem.descricao ? `
          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-sticky-note"></i> OBSERVAÇÕES</div>
            <div class="pdf-nota-section-content"><p class="pdf-nota-observacoes-texto">${ordem.observacoes || ordem.notas || ordem.descricao}</p></div>
          </div>` : ''}

          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-shield-alt"></i> CONDIÇÕES GERAIS</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-condicoes-list">
                <div class="pdf-nota-condicoes-item"><i class="fas fa-check-circle"></i><span>Garantia de 90 dias para serviços e peças.</span></div>
                <div class="pdf-nota-condicoes-item"><i class="fas fa-check-circle"></i><span>Garantia não cobre mau uso ou danos.</span></div>
                <div class="pdf-nota-condicoes-item"><i class="fas fa-check-circle"></i><span>Validade do orçamento: 30 dias.</span></div>
              </div>
            </div>
          </div>

          <div class="pdf-nota-section">
            <div class="pdf-nota-section-title"><i class="fas fa-pen-square"></i> ASSINATURAS</div>
            <div class="pdf-nota-section-content">
              <div class="pdf-nota-assinaturas">
                <div class="pdf-nota-assinatura-campo">
                  ${assinaturaEmpresaHTML}
                  <div class="pdf-nota-assinatura-nome">Técnico Responsável</div>
                  <div class="pdf-nota-assinatura-info">Nome: ${ordem.tecnico || '_____________________'}${(window.currentUser && window.currentUser.telefone) ? '<br>' + window.currentUser.telefone : ''}</div>
                </div>
                <div class="pdf-nota-assinatura-campo">
                  <div class="pdf-nota-assinatura-linha"></div>
                  <div class="pdf-nota-assinatura-nome">Cliente</div>
                  <div class="pdf-nota-assinatura-info">Nome: ${ordem.cliente || '_____________________'}<br>CPF/CNPJ: ${ordem.cnpj || '_____________________'}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
        ${pdfFooterPadrao()}
      </div>`;

    const gerarPaginaProdutos = (numeroPagina, colunas) => {
      const offsetInicial = ITENS_PRIMEIRA_PAGINA + ((numeroPagina - 2) * ITENS_POR_COLUNA * COLUNAS_POR_PAGINA);
      return `
        <div class="pdf-nota-page">
          ${gerarHeaderOS(numeroPagina)}
          <div class="pdf-nota-body">
            <div class="pdf-nota-section">
              <div class="pdf-nota-section-title"><i class="fas fa-box"></i> MATERIAIS E PRODUTOS (CONTINUAÇÃO) ${tipoRelatorio === 'sem_quantidade' ? `(${produtos.length} itens)` : `(${qtdTotal} un.)`}</div>
              <div class="pdf-nota-section-content">
                <div class="pdf-produtos-columns">
                  ${colunas.map((col, idx) => `<div>${renderizarTabelaProdutos(col, offsetInicial + (idx * ITENS_POR_COLUNA))}</div>`).join('')}
                </div>
              </div>
            </div>
          </div>
          ${pdfFooterPadrao()}
        </div>`;
    };

    const htmlPDF = pdfHtmlShell(`
      ${gerarPrimeiraPagina()}
      ${paginasProdutos.slice(1).map((colunas, idx) => gerarPaginaProdutos(idx + 2, colunas)).join('')}
    `);

    const nomeArquivos = {
      'com_valores': `Nota_Servico_${ordem.cliente || 'cliente'}_ComValorTotal_${Date.now()}.pdf`,
      'sem_valores': `Nota_Servico_${ordem.cliente || 'cliente'}_SemValores_${Date.now()}.pdf`,
      'valores_detalhados': `Nota_Servico_${ordem.cliente || 'cliente'}_Detalhado_${Date.now()}.pdf`,
      'sem_quantidade': `Nota_Servico_${ordem.cliente || 'cliente'}_SemQtdValor_${Date.now()}.pdf`
    };

    await renderizarEBaixarPDF(htmlPDF, nomeArquivos[tipoRelatorio]);
    showToast('PDF gerado com sucesso!', 'success');

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    showToast('Erro ao gerar PDF. Tente novamente.', 'error');
  }
}

// ============================= 
// EDITAR OS
// ============================= 
let editingOSId = null;
let editingProducts = [];
let produtosOriginaisOS = [];
let estoqueBackup = {};

async function editarOS(orderId) {
  try {
    const snapshot = await database.ref(`orders/${orderId}`).once('value');
    const ordem = snapshot.val();
    if (!ordem) { showToast('Ordem não encontrada no banco', 'error'); return; }

    editingOSId = orderId;
    produtosOriginaisOS = Array.isArray(ordem.products) ? [...ordem.products] : [];
    estoqueBackup = {};
    products.forEach(p => { estoqueBackup[p.id] = p.quantity || 0; });

    for (const prodOS of produtosOriginaisOS) {
      const produtoOriginal = products.find(p => p.id === prodOS.id);
      if (produtoOriginal) produtoOriginal.quantity = (produtoOriginal.quantity || 0) + prodOS.qty;
    }

    editingProducts = [...produtosOriginaisOS];

    document.getElementById('editCliente').value = ordem.cliente || '';
    document.getElementById('editCNPJ').value = ordem.cnpj || '';
    document.getElementById('editEndereco').value = ordem.endereco || '';
    document.getElementById('editServico').value = ordem.servico || '';
    document.getElementById('editTecnico').value = ordem.tecnico || '';
    document.getElementById('editPagamento').value = ordem.payment_method || ordem.formaPagamento || '';
    document.getElementById('editProfitPercent').value = ordem.profitPercent ?? 0;
    if (ordem.data) document.getElementById('editData').value = new Date(ordem.data).toISOString().split('T')[0];

    renderizarProdutosEdicao();
    atualizarTotaisEdicao();
    document.getElementById('editOSModal').style.display = 'flex';
    showToast('Editando ordem de serviço', 'info');
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar OS', 'error');
  }
}

function renderizarProdutosEdicao() {
  const container = document.getElementById('editProductsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!editingProducts || editingProducts.length === 0) {
    container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Nenhum produto nesta ordem</p>';
    return;
  }

  editingProducts.forEach((product, index) => {
    const totalProd = (product.price || 0) * (product.qty || 1);
    container.insertAdjacentHTML('beforeend', `
      <div class="product-edit-item" data-prod-index="${index}" style="background:#242424;border:1px solid #333;border-radius:10px;margin-bottom:12px;overflow:hidden;">
        <div class="product-header-collapsed" onclick="toggleProdutoEdicao(${index})" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#1a1a1a;cursor:pointer;user-select:none;transition:background 0.3s;flex-wrap:wrap;gap:8px;" onmouseover="this.style.background='#2a2a2a'" onmouseout="this.style.background='#1a1a1a'">
          <div style="display:flex;gap:8px;align-items:center;flex:1;min-width:0;">
            <i class="fas fa-boxes" style="color:#10b981;font-size:1rem;flex-shrink:0;"></i>
            <span style="color:#fff;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(product.name || 'Sem nome').substring(0, 25)}${(product.name || '').length > 25 ? '...' : ''}</span>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
            <span style="color:#999;font-size:0.9rem;">Qtd: <strong style="color:#10b981;">${product.qty || 1}</strong></span>
            <span style="color:#10b981;font-weight:600;">R$ ${totalProd.toFixed(2)}</span>
          </div>
          <button class="toggle-btn-${index}" style="background:transparent;border:none;color:#10b981;font-size:1.2rem;cursor:pointer;padding:4px 8px;display:flex;align-items:center;transition:transform 0.3s;">
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
        <div class="product-content-${index}" style="padding:16px;display:none;background:#1a1a1a;border-top:1px solid #333;">
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div class="form-group" style="width:100%;">
              <label style="font-weight:600;color:#fff;display:block;margin-bottom:8px;"><i class="fas fa-box" style="color:#10b981;"></i> Nome do Produto</label>
              <input type="text" class="product-name" value="${(product.name || '').replace(/"/g, '&quot;')}" placeholder="Nome do produto" style="width:100%;padding:10px;border:1px solid #333;border-radius:6px;font-size:0.95rem;background:#2a2a2a;color:#fff;box-sizing:border-box;" onchange="atualizarProdutoEdicao(${index})">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label style="font-weight:600;color:#fff;display:block;margin-bottom:8px;"><i class="fas fa-boxes" style="color:#10b981;"></i> Qtd</label>
                <input type="number" class="product-qty" value="${product.qty || 1}" placeholder="1" min="1" step="1" style="width:100%;padding:10px;border:1px solid #333;border-radius:6px;font-size:0.95rem;background:#2a2a2a;color:#fff;box-sizing:border-box;" onchange="atualizarProdutoEdicao(${index})">
              </div>
              <div class="form-group">
                <label style="font-weight:600;color:#fff;display:block;margin-bottom:8px;"><i class="fas fa-tag" style="color:#10b981;"></i> Preço (R$)</label>
                <input type="number" class="product-price" value="${product.price || 0}" placeholder="0.00" step="0.01" style="width:100%;padding:10px;border:1px solid #333;border-radius:6px;font-size:0.95rem;background:#2a2a2a;color:#fff;box-sizing:border-box;" onchange="atualizarProdutoEdicao(${index})">
              </div>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #333;padding-top:12px;">
              <button class="btn btn-danger" onclick="apagarProdutoEdicao(${index})" style="padding:8px 16px;font-size:0.9rem;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                <i class="fas fa-trash"></i> Apagar
              </button>
            </div>
          </div>
        </div>
      </div>
    `);
  });
}

function toggleProdutoEdicao(index) {
  const content = document.querySelector(`.product-content-${index}`);
  const btn = document.querySelector(`.toggle-btn-${index}`);
  if (!content || !btn) return;
  if (content.style.display === 'none') { content.style.display = 'block'; btn.style.transform = 'rotate(180deg)'; }
  else { content.style.display = 'none'; btn.style.transform = 'rotate(0deg)'; }
}

function apagarProdutoEdicao(index) {
  const container = document.getElementById('editProductsContainer');
  const productElement = container.querySelector(`[data-prod-index="${index}"]`);
  if (!productElement) return;

  const confirmHtml = `
    <div id="confirm-delete-${index}" style="background:rgba(239,68,68,0.1);border:2px solid #ef4444;border-radius:8px;padding:12px;margin:8px 0;display:flex;justify-content:space-between;align-items:center;">
      <span style="color:#ef4444;font-weight:600;"><i class="fas fa-exclamation-triangle"></i> Confirmar exclusão?</span>
      <div style="display:flex;gap:8px;">
        <button onclick="confirmarExclusaoProduto(${index})" style="padding:6px 12px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Sim</button>
        <button onclick="cancelarExclusaoProduto(${index})" style="padding:6px 12px;background:#333;color:white;border:none;border-radius:6px;cursor:pointer;">Não</button>
      </div>
    </div>`;
  productElement.insertAdjacentHTML('beforebegin', confirmHtml);
}

function confirmarExclusaoProduto(index) {
  const produto = editingProducts[index];
  if (!produto) return;
  const produtoOriginal = products.find(p => p.id === produto.id);
  if (produtoOriginal) produtoOriginal.quantity = (produtoOriginal.quantity || 0) + produto.qty;
  editingProducts.splice(index, 1);
  const confirmDiv = document.getElementById(`confirm-delete-${index}`);
  if (confirmDiv) confirmDiv.remove();
  renderizarProdutosEdicao();
  atualizarTotaisEdicao();
  showToast('Produto removido e devolvido ao estoque!', 'success');
}

function cancelarExclusaoProduto(index) {
  const confirmDiv = document.getElementById(`confirm-delete-${index}`);
  if (confirmDiv) confirmDiv.remove();
}

async function atualizarProdutoEdicao(index) {
  const element = document.querySelector(`[data-prod-index="${index}"]`);
  if (!element) return;
  const nomeEl = element.querySelector('.product-name');
  const qtyEl = element.querySelector('.product-qty');
  const precoEl = element.querySelector('.product-price');
  if (!nomeEl || !qtyEl || !precoEl) { showToast('Erro ao localizar campos do produto', 'error'); return; }

  const nome = nomeEl.value;
  const novaQty = parseInt(qtyEl.value) || 1;
  const preco = parseFloat(precoEl.value) || 0;

  if (!nome.trim()) { showToast('Nome do produto é obrigatório', 'error'); return; }
  if (novaQty <= 0) { showToast('Quantidade deve ser maior que zero', 'error'); qtyEl.value = editingProducts[index].qty || 1; return; }

  const produtoAtual = editingProducts[index];
  const qtyAnterior = produtoAtual.qty || 0;
  const diferencaQty = novaQty - qtyAnterior;

  if (diferencaQty !== 0) {
    const product = products.find(p => p.id === produtoAtual.id);
    if (!product) { showToast('Produto não encontrado no estoque', 'error'); qtyEl.value = qtyAnterior; return; }
    const estoqueAtual = product.quantity || 0;
    if (diferencaQty > 0) {
      if (diferencaQty > estoqueAtual) { showToast(`Estoque insuficiente! Disponível: ${estoqueAtual}`, 'error'); qtyEl.value = qtyAnterior; return; }
      product.quantity = estoqueAtual - diferencaQty;
    } else {
      product.quantity = estoqueAtual + Math.abs(diferencaQty);
    }
  }

  editingProducts[index] = { ...editingProducts[index], name: nome, description: editingProducts[index].description || '', qty: novaQty, price: preco, id: editingProducts[index]?.id || '' };
  atualizarTotaisEdicao();
  renderizarProdutosEdicao();
}

function atualizarTotaisEdicao() {
  let subtotal = 0;
  editingProducts.forEach(prod => { subtotal += (prod.price || 0) * (prod.qty || 1); });
  const profitPercentEl = document.getElementById('editProfitPercent');
  let profitPercent = 0;
  if (profitPercentEl) { const v = parseFloat(profitPercentEl.value); if (!isNaN(v)) profitPercent = v; }
  const profitValue = (subtotal * profitPercent) / 100;
  const total = subtotal + profitValue;
  const subtotalEl = document.getElementById('editSubtotal');
  const totalEl = document.getElementById('editTotalComLucro');
  if (subtotalEl) subtotalEl.value = subtotal.toFixed(2);
  if (totalEl) totalEl.value = total.toFixed(2);
}

async function salvarEdicaoOS() {
  if (!editingOSId) { showToast('ID da OS não encontrado', 'error'); return; }

  try {
    editingProducts.forEach((_, index) => {
      const element = document.querySelector(`[data-prod-index="${index}"]`);
      if (element) {
        const nomeEl = element.querySelector('.product-name');
        const qtyEl = element.querySelector('.product-qty');
        const precoEl = element.querySelector('.product-price');
        editingProducts[index] = {
          ...editingProducts[index],
          name: nomeEl ? nomeEl.value : (editingProducts[index].name || ''),
          description: editingProducts[index].description || '',
          qty: qtyEl ? (parseInt(qtyEl.value) || 1) : (editingProducts[index].qty || 1),
          price: precoEl ? (parseFloat(precoEl.value) || 0) : (editingProducts[index].price || 0)
        };
      }
    });

    const produtosRemovidos = produtosOriginaisOS.filter(original => !editingProducts.some(editado => editado.id == original.id));
    const produtosAlterados = produtosOriginaisOS.filter(original => {
      const editado = editingProducts.find(p => p.id == original.id);
      return editado && editado.qty !== original.qty;
    });

    for (const produtoRemovido of produtosRemovidos) {
      try {
        const produtoSnapshot = await database.ref('products').orderByChild('id').equalTo(Number(produtoRemovido.id)).once('value');
        if (produtoSnapshot.exists()) {
          produtoSnapshot.forEach(async (childSnapshot) => {
            const produto = childSnapshot.val();
            await database.ref(`products/${childSnapshot.key}`).update({ quantity: (produto.quantity || 0) + produtoRemovido.qty });
          });
        }
      } catch (error) { console.error(`Erro ao devolver estoque de ${produtoRemovido.name}:`, error); }
    }

    for (const produtoOriginal of produtosAlterados) {
      try {
        const produtoEditado = editingProducts.find(p => p.id == produtoOriginal.id);
        if (!produtoEditado) continue;
        const diferencaQty = produtoOriginal.qty - produtoEditado.qty;
        const produtoSnapshot = await database.ref('products').orderByChild('id').equalTo(Number(produtoOriginal.id)).once('value');
        if (produtoSnapshot.exists()) {
          produtoSnapshot.forEach(async (childSnapshot) => {
            const produto = childSnapshot.val();
            const novoEstoque = (produto.quantity || 0) + diferencaQty;
            if (novoEstoque < 0) { showToast(`Estoque insuficiente para ${produto.name}`, 'error'); return; }
            await database.ref(`products/${childSnapshot.key}`).update({ quantity: novoEstoque });
          });
        }
      } catch (error) { console.error(`Erro ao ajustar estoque:`, error); }
    }

    const produtosLimpos = editingProducts.map(prod => ({ id: prod.id || '', name: prod.name || '', description: prod.description || '', qty: prod.qty || 1, price: prod.price || 0 }));
    let subtotal = 0;
    produtosLimpos.forEach(prod => { subtotal += (prod.price || 0) * (prod.qty || 1); });

    const profitPercentEl = document.getElementById('editProfitPercent');
    const profitPercent = profitPercentEl ? (isNaN(parseFloat(profitPercentEl.value)) ? 0 : parseFloat(profitPercentEl.value)) : 0;
    const profitValue = (subtotal * profitPercent) / 100;
    const total = subtotal + profitValue;

    const clienteEl = document.getElementById('editCliente');
    const cnpjEl = document.getElementById('editCNPJ');
    const enderecoEl = document.getElementById('editEndereco');
    const servicoEl = document.getElementById('editServico');
    const tecnicoEl = document.getElementById('editTecnico');
    const pagamentoEl = document.getElementById('editPagamento');
    const dataEl = document.getElementById('editData');

    const dadosAtualizados = {
      cliente: clienteEl ? (clienteEl.value || '') : '',
      cnpj: cnpjEl ? (cnpjEl.value || '') : '',
      endereco: enderecoEl ? (enderecoEl.value || '') : '',
      servico: servicoEl ? (servicoEl.value || '') : '',
      tecnico: tecnicoEl ? (tecnicoEl.value || '') : '',
      payment_method: pagamentoEl ? (pagamentoEl.value || '') : '',
      formaPagamento: pagamentoEl ? (pagamentoEl.value || '') : '',
      data: dataEl && dataEl.value ? new Date(dataEl.value).toISOString() : new Date().toISOString(),
      products: produtosLimpos,
      subtotal: Math.round(subtotal * 100) / 100,
      profitPercent, profitValue: Math.round(profitValue * 100) / 100,
      total: Math.round(total * 100) / 100, preco: Math.round(total * 100) / 100
    };

    await database.ref(`orders/${editingOSId}`).update(dadosAtualizados);
    produtosOriginaisOS = []; editingProducts = []; editingOSId = null;
    closeEditOSModal();
    showToast('Ordem atualizada com sucesso!', 'success');
    if (typeof loadOrders === 'function') loadOrders();

  } catch (err) {
    console.error('Erro ao salvar:', err);
    showToast('Erro ao salvar edição: ' + err.message, 'error');
  }
}

function closeEditOSModal() {
  if (Object.keys(estoqueBackup).length > 0) {
    products.forEach(p => { if (estoqueBackup.hasOwnProperty(p.id)) p.quantity = estoqueBackup[p.id]; });
  }
  document.getElementById('editOSModal').style.display = 'none';
  editingOSId = null; editingProducts = []; produtosOriginaisOS = []; estoqueBackup = {};
}

// ============================= 
// FILTRAR PRODUTOS EDIT OS MODAL
// ============================= 
function filtrarProdutosEditOSModal() {
  const searchInput = document.getElementById('searchProductEditOSInput');
  const searchTerm = searchInput?.value.toLowerCase() || '';
  const list = document.getElementById('productEditOSModalList');
  if (!list) return;

  database.ref('products').once('value', (snapshot) => {
    const produtosDisponiveis = [];
    snapshot.forEach((childSnapshot) => {
      const produto = childSnapshot.val();
      if (produto.quantity > 0) produtosDisponiveis.push({ ...produto, firebaseKey: childSnapshot.key });
    });
    const produtosNaoAdicionados = produtosDisponiveis.filter(p => !editingProducts.some(ep => ep.id == p.id));
    const produtosFiltrados = produtosNaoAdicionados.filter(p => p.name.toLowerCase().includes(searchTerm) || (p.description && p.description.toLowerCase().includes(searchTerm)));

    if (produtosFiltrados.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#666;"><i class="fas fa-search" style="font-size:3rem;margin-bottom:15px;opacity:0.3;"></i><p style="margin:0;">Nenhum produto encontrado</p></div>`;
      return;
    }
    list.innerHTML = produtosFiltrados.map(produto => `
      <div style="background:#2a2a2a;border:2px solid #333;border-radius:10px;padding:14px;margin-bottom:10px;transition:all 0.2s;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='#333'">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
          <div style="flex:1;">
            <div style="color:#fff;font-weight:700;font-size:15px;margin-bottom:4px;">${escapeHtml(produto.name)}</div>
            ${produto.description ? `<div style="color:#999;font-size:12px;margin-bottom:6px;">${escapeHtml(produto.description)}</div>` : ''}
            <div style="display:flex;gap:12px;font-size:13px;color:#aaa;">
              <span><strong style="color:#10b981;">Preço:</strong> R$ ${produto.price.toFixed(2)}</span>
              <span><strong style="color:${produto.quantity <= 5 ? '#ef4444' : '#10b981'};">Estoque:</strong> ${produto.quantity}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="number" id="qty_edit_${produto.id}" min="1" max="${produto.quantity}" value="1" style="width:80px;padding:8px 10px;background:#1a1a1a;border:2px solid #333;border-radius:8px;color:#fff;font-size:14px;font-weight:600;text-align:center;">
          <button onclick="selecionarProdutoEditOSModal('${produto.id}')" style="flex:1;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">
            <i class="fas fa-plus"></i> Adicionar
          </button>
        </div>
      </div>
    `).join('');
  });
}

function renderizarListaProdutosEditOSModal() {
  const list = document.getElementById('productEditOSModalList');
  if (!list) return;

  database.ref('products').once('value', (snapshot) => {
    const produtosDisponiveis = [];
    snapshot.forEach((childSnapshot) => {
      const produto = childSnapshot.val();
      if (produto.quantity > 0) produtosDisponiveis.push({ ...produto, firebaseKey: childSnapshot.key });
    });
    const produtosNaoAdicionados = produtosDisponiveis.filter(p => !editingProducts.some(ep => ep.id == p.id));

    if (produtosNaoAdicionados.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#666;"><i class="fas fa-box-open" style="font-size:3rem;margin-bottom:15px;opacity:0.3;"></i><p style="margin:0;">Nenhum produto disponível</p></div>`;
      return;
    }
    list.innerHTML = produtosNaoAdicionados.map(produto => `
      <div style="background:#2a2a2a;border:2px solid #333;border-radius:10px;padding:14px;margin-bottom:10px;transition:all 0.2s;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='#333'">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
          <div style="flex:1;">
            <div style="color:#fff;font-weight:700;font-size:15px;margin-bottom:4px;">${escapeHtml(produto.name)}</div>
            ${produto.description ? `<div style="color:#999;font-size:12px;margin-bottom:6px;">${escapeHtml(produto.description)}</div>` : ''}
            <div style="display:flex;gap:12px;font-size:13px;color:#aaa;">
              <span><strong style="color:#10b981;">Preço:</strong> R$ ${produto.price.toFixed(2)}</span>
              <span><strong style="color:${produto.quantity <= 5 ? '#ef4444' : '#10b981'};">Estoque:</strong> ${produto.quantity}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="number" id="qty_edit_${produto.id}" min="1" max="${produto.quantity}" value="1" style="width:80px;padding:8px 10px;background:#1a1a1a;border:2px solid #333;border-radius:8px;color:#fff;font-size:14px;font-weight:600;text-align:center;">
          <button onclick="selecionarProdutoEditOSModal('${produto.id}')" style="flex:1;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">
            <i class="fas fa-plus"></i> Adicionar
          </button>
        </div>
      </div>
    `).join('');
  });
}

function validarQuantidadeEditModalOS(prodId, maxStock) {
  const input = document.getElementById(`qty_edit_${prodId}`);
  if (!input) return;
  let valor = parseInt(input.value);
  if (isNaN(valor) || valor < 1) input.value = 1;
  else if (valor > maxStock) { input.value = maxStock; showToast(`Quantidade máxima disponível: ${maxStock}`, 'info'); }
  else input.value = valor;
}

// alterarQuantidadeEditModal duplicado removido (ver definição acima)

// ============================= 
// LISTENER PRODUTOS (TEMPO REAL)
// ============================= 
const productsRef = database.ref('products');
const osRef = database.ref('os');

productsRef.on('value', (snapshot) => {
  products = [];
  const data = snapshot.val();
  if (data) { Object.keys(data).forEach(key => { products.push({ firebaseKey: key, ...data[key] }); }); }
  if (typeof renderProducts === 'function') renderProducts();
});

async function selecionarProdutoEditOSModal(productId) {
  try {
    const produtoSnapshot = await database.ref('products').orderByChild('id').equalTo(Number(productId)).once('value');
    if (!produtoSnapshot.exists()) { showToast('Produto não encontrado', 'error'); return; }

    let produto = null, firebaseKey = null;
    produtoSnapshot.forEach((childSnapshot) => { produto = childSnapshot.val(); firebaseKey = childSnapshot.key; });

    const produtoJaAdicionado = editingProducts.find(p => p.id == productId);
    if (produtoJaAdicionado) { showToast('Este produto já foi adicionado à OS', 'error'); return; }

    const qtyInput = document.getElementById(`qty_edit_${productId}`);
    const qty = parseInt(qtyInput?.value) || 1;
    if (qty <= 0) { showToast('Quantidade inválida', 'error'); return; }

    const stockAvailable = produto.quantity || 0;
    if (qty > stockAvailable) { showToast(`Estoque insuficiente! Disponível: ${stockAvailable}`, 'error'); return; }

    await database.ref(`products/${firebaseKey}/quantity`).set(stockAvailable - qty);
    editingProducts.push({ id: produto.id, firebaseKey, name: produto.name, description: produto.description || '', qty, price: produto.price });

    closeProductModal();
    if (typeof renderizarProdutosEdicao === 'function') renderizarProdutosEdicao();
    if (typeof atualizarTotaisEdicao === 'function') atualizarTotaisEdicao();
    if (document.getElementById('productEditOSModalList')) renderizarListaProdutosEditOSModal();
    showToast(`${produto.name} (${qty}x) adicionado!`, 'success');

  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    showToast('Erro ao adicionar produto', 'error');
  }
}

async function removerProdutoEdicao(index) {
  try {
    const produtoRemovido = editingProducts[index];
    if (!produtoRemovido) { showToast('Produto não encontrado', 'error'); return; }

    if (produtoRemovido.firebaseKey) {
      const produtoRef = database.ref(`products/${produtoRemovido.firebaseKey}`);
      const snapshot = await produtoRef.once('value');
      const produtoAtual = snapshot.val();
      if (produtoAtual) await produtoRef.update({ quantity: (produtoAtual.quantity || 0) + produtoRemovido.qty });
    }

    editingProducts.splice(index, 1);
    if (typeof renderizarProdutosEdicao === 'function') renderizarProdutosEdicao();
    if (typeof atualizarTotaisEdicao === 'function') atualizarTotaisEdicao();
    if (document.getElementById('productEditOSModalList')) renderizarListaProdutosEditOSModal();
    showToast(`${produtoRemovido.name} removido - estoque devolvido`, 'success');
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    showToast('Erro ao remover produto', 'error');
  }
}

async function salvarOSNoFirebase(osData) {
  try {
    if (osData.id) {
      await database.ref(`os/${osData.id}`).update(osData);
    } else {
      const newOsRef = osRef.push();
      osData.id = newOsRef.key;
      await newOsRef.set(osData);
    }
    showToast('OS salva com sucesso!', 'success');
    return osData.id;
  } catch (error) {
    console.error('Erro ao salvar OS:', error);
    showToast('Erro ao salvar OS', 'error');
    return null;
  }
}

function monitorarOS(osId, callback) {
  const osItemRef = database.ref(`os/${osId}`);
  osItemRef.on('value', (snapshot) => {
    const osData = snapshot.val();
    if (osData && typeof callback === 'function') callback(osData);
  });
  return () => osItemRef.off('value');
}

function desconectarListeners() { productsRef.off(); osRef.off(); }

// ============================= 
// EXCLUIR OS
// ============================= 
async function excluirOS(orderId) {
  const ordem = allOrders.find(o => o.id === orderId);
  if (!ordem) { showToast('Ordem não encontrada', 'error'); return; }

  const confirmed = await showConfirmDialog(
    'Confirmar Exclusão',
    `Tem certeza que deseja excluir a ordem de <strong>${escapeHtml(ordem.cliente || 'este cliente')}</strong>?<br><br><span style="color:#10b981;">Os produtos serão devolvidos ao estoque.</span>`
  );
  if (!confirmed) return;

  try {
    showToast('Excluindo ordem e devolvendo estoque...', 'info');
    const produtosDaOS = Array.isArray(ordem.products) ? ordem.products : [];

    for (const osProd of produtosDaOS) {
      const product = products.find(p => p.id === osProd.id);
      if (product) {
        const newStock = (product.quantity || 0) + (osProd.qty || 0);
        await firebase.database().ref('products/' + osProd.id).update({ quantity: newStock });
        product.quantity = newStock;
      }
    }

    await firebase.database().ref('orders/' + orderId).remove();
    showToast('Ordem excluída - Produtos devolvidos ao estoque!', 'success');
    if (typeof loadOrders === 'function') loadOrders();
  } catch (error) {
    console.error('Erro ao excluir ordem:', error);
    showToast('Erro ao excluir: ' + error.message, 'error');
  }
}

// ============================= 
// SWITCH TAB EDIT OS
// ============================= 
function switchEditTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => { tab.style.display = 'none'; });
  document.querySelectorAll('.tab-btn').forEach(btn => { btn.style.borderBottomColor = 'transparent'; btn.style.color = '#666'; btn.classList.remove('active'); });

  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) selectedTab.style.display = 'block';

  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeBtn) { activeBtn.style.borderBottomColor = '#10b981'; activeBtn.style.color = '#10b981'; activeBtn.classList.add('active'); }

  if (tabName === 'produtos') renderizarProdutosEdicao();
}

document.addEventListener('DOMContentLoaded', function () {
  document.addEventListener('click', function (e) {
    if (e.target && (e.target.id === 'addProductToEditOSBtn' || e.target.closest('#addProductToEditOSBtn'))) {
      e.preventDefault(); e.stopPropagation();
      abrirModalSelecionarProdutoEditOS();
    }
  });
});

// ============================= 
// DIALOG DE CONFIRMAÇÃO
// ============================= 
function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;animation:fadeIn 0.2s ease;`;

    const dialog = document.createElement('div');
    dialog.style.cssText = `background:#1a1a1a;border:2px solid #D4C29A;border-radius:12px;padding:24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.9);animation:slideUp 0.3s ease;`;

    dialog.innerHTML = `
      <h3 style="color:#D4C29A;margin:0 0 12px 0;font-size:18px;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-exclamation-triangle" style="font-size:22px;"></i> ${title}
      </h3>
      <p style="color:#fff;margin:0 0 24px 0;font-size:14px;line-height:1.6;">${message}</p>
      <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
        <button id="cancelBtn" class="btn-secondary" style="padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;flex:1;min-width:100px;">
          <i class="fas fa-times" style="margin-right:6px;"></i> Cancelar
        </button>
        <button id="confirmBtn" class="btn-danger" style="padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;flex:1;min-width:100px;">
          <i class="fas fa-trash" style="margin-right:6px;"></i> Excluir
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.getElementById('confirmBtn').onclick = () => { document.body.removeChild(overlay); resolve(true); };
    document.getElementById('cancelBtn').onclick = () => { document.body.removeChild(overlay); resolve(false); };
    overlay.onclick = (e) => { if (e.target === overlay) { document.body.removeChild(overlay); resolve(false); } };
  });
}

// ============================= 
// ANIMAÇÕES CSS (UMA VEZ)
// ============================= 
if (!document.getElementById('modalAnimations')) {
  const style = document.createElement('style');
  style.id = 'modalAnimations';
  style.textContent = `
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes fadeOut{from{opacity:1}to{opacity:0}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  `;
  document.head.appendChild(style);
}

// ============================= 
// CRIAR NOVA OS (FORM SUBMIT)
// ============================= 
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  try {
    const clienteTipo = document.getElementById('clienteTipoHidden').value;
    const clienteNome = document.getElementById('clienteNomeHidden').value;
    const clienteSelect = document.getElementById('clienteSelect');
    const cnpj = document.getElementById('cnpjInput').value;

    let telefone, email, responsavel, cep, endereco, numeroPredio, numeroEmpresa;

    if (clienteTipo === 'predio') {
      telefone = document.getElementById('telefonePredioInput')?.value || '';
      email = document.getElementById('emailPredioInput')?.value || '';
      responsavel = document.getElementById('responsavelPredioInput')?.value || '';
      cep = document.getElementById('cepPredioInput')?.value || '';
      endereco = document.getElementById('enderecoPredioInput')?.value || '';
      numeroPredio = document.getElementById('numeroPredioInput')?.value || '';
      numeroEmpresa = '';
    } else {
      telefone = document.getElementById('telefoneEmpresaInput')?.value || '';
      email = document.getElementById('emailEmpresaInput')?.value || '';
      responsavel = document.getElementById('responsavelEmpresaInput')?.value || '';
      cep = document.getElementById('cepEmpresaInput')?.value || '';
      endereco = document.getElementById('enderecoEmpresaInput')?.value || '';
      numeroEmpresa = document.getElementById('numeroEmpresaInput')?.value || '';
      numeroPredio = '';
    }

    const servico = document.getElementById('servico').value;
    const tecnico = document.getElementById('tecnicoInput').value;
    const status = form.querySelector('[name="status"]').value;

    const subtotal = osSelectedProducts.reduce((acc, p) => acc + (Number(p.price) * Number(p.qty)), 0);
    const profitPercent = parseFloat(document.getElementById('profitPercent')?.value) || 0;
    const profitValue = subtotal * (profitPercent / 100);
    const totalFinal = subtotal + profitValue;

    const data = {
      cliente: clienteNome, clienteId: clienteSelect.value, clienteTipo, cnpj,
      telefone, email, responsavel, cep, endereco, numeroPredio, numeroEmpresa,
      servico, tecnico,
      preco: totalFinal, total: totalFinal,
      products: osSelectedProducts, subtotal, profitPercent, profitValue,
      status, data: new Date().toISOString()
    };

    for (const produto of osSelectedProducts) {
      if (produto.id) {
        const produtoSnapshot = await database.ref(`products/${produto.id}`).once('value');
        const produtoNoEstoque = produtoSnapshot.val();
        if (produtoNoEstoque) {
          const novaQuantidade = (produtoNoEstoque.quantity || 0) - (produto.qty || 0);
          await database.ref(`products/${produto.id}`).update({ quantity: novaQuantidade < 0 ? 0 : novaQuantidade });
        }
      }
    }

    await database.ref('orders').push(data);
    form.reset();
    osSelectedProducts = [];
    renderOSProducts();

    const camposEmpresa = document.getElementById('camposEmpresa');
    const camposPredio = document.getElementById('camposPredio');
    if (camposEmpresa) camposEmpresa.style.display = 'none';
    if (camposPredio) camposPredio.style.display = 'none';

    closeModal('orderModal');
    showToast('Ordem de Serviço criada!');
    loadOrders();

  } catch (err) {
    console.error('Erro criando OS:', err);
    showToast('Erro ao criar OS', 'error');
  }
});

// ============================= 
// BUSCA E FILTROS
// ============================= 
document.getElementById('orderSearch')?.addEventListener('input', () => { renderFilteredOrders(); });
document.querySelectorAll('#ordersSection .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#ordersSection .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFilteredOrders();
  });
});

window.addEventListener('load', () => { setTimeout(() => { loadOrders(); }, 100); });

// ============================= 
// VIEW ORDER (MODAL COMPACTO)
// ============================= 
async function viewOrder(orderId) {
  try {
    const snapshot = await database.ref(`orders/${orderId}`).once('value');
    const os = snapshot.val();
    if (!os) { showToast('OS não encontrada', 'error'); return; }

    const modalHtml = `
      <div id="viewOrderModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Arial,sans-serif;">
        <div style="background:#1a1a1a;border:2px solid #D4C29A;border-radius:10px;width:92%;max-width:380px;color:#f5f5f5;box-shadow:0 6px 18px rgba(0,0,0,0.6);">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid rgba(212,194,154,0.15);">
            <h3 style="margin:0;font-size:0.95rem;color:#D4C29A;"><i class="fas fa-file-invoice"></i> OS</h3>
            <button onclick="closeViewOrderModal()" style="background:none;border:none;color:#D4C29A;font-size:1rem;cursor:pointer;"><i class="fas fa-times"></i></button>
          </div>
          <div style="padding:10px 12px;display:grid;grid-template-columns:1fr;gap:6px;font-size:0.82rem;">
            ${compactLine("Cliente", os.cliente)}
            ${compactLine("Serviço", os.servico)}
            ${compactLine("Preço", "R$ " + parseFloat(os.preco || 0).toFixed(2))}
            ${compactLine("Status", os.status)}
            ${compactLine("Data", new Date(os.data).toLocaleDateString('pt-BR'))}
          </div>
          <div style="padding:0 12px 10px;">
            <button onclick="closeViewOrderModal()" style="width:100%;background:#D4C29A;color:#1a1a1a;border:none;border-radius:8px;padding:8px;font-size:0.85rem;font-weight:bold;cursor:pointer;">Fechar</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (err) {
    console.error(err);
    showToast('Erro ao abrir a OS', 'error');
  }
}

function compactLine(label, value) {
  value = value || '-';
  return `<div style="border:1px solid rgba(212,194,154,0.12);border-radius:6px;padding:6px 8px;">
    <div style="font-size:0.68rem;color:#D4C29A;margin-bottom:2px;text-transform:uppercase;">${label}</div>
    <div style="font-size:0.82rem;">${value}</div>
  </div>`;
}

function closeViewOrderModal() {
  const modal = document.getElementById('viewOrderModal');
  if (modal) modal.remove();
}

// ============================= 
// PREENCHER TÉCNICO NA OS
// ============================= 
function preencherTecnicoOS() {
  const tecnicoInput = document.getElementById('tecnicoInput');
  if (tecnicoInput && currentUser?.nome) tecnicoInput.value = currentUser.nome;
}

// openModal duplicado removido (ver definição principal acima)

// ============================= 
// INSPEÇÕES
// ============================= 
function preencherDadosInspecaoFromObj(obj) {
  if (!obj) return;
  const isPredio = obj.tipo === 'predio';
  const dadosNormalizados = {
    razao_social: isPredio ? (obj.razao_social_predio || obj.razao_social || '') : (obj.razao_social || ''),
    cnpj: isPredio ? (obj.cnpj_predio || obj.cnpj || '') : (obj.cnpj || ''),
    telefone: isPredio ? (obj.telefone_predio || obj.telefone || '') : (obj.telefone || ''),
    responsavel: isPredio ? (obj.responsavel_predio || obj.responsavel || '') : (obj.responsavel || ''),
    cep: isPredio ? (obj.cep_predio || obj.cep || '') : (obj.cep || ''),
    endereco: isPredio ? (obj.endereco_predio || obj.endereco || '') : (obj.endereco || ''),
    numero_predio: isPredio ? (obj.numero_predio || '') : (obj.numero_predio || ''),
    numero_empresa: !isPredio ? (obj.numero_empresa || '') : ''
  };

  const mapById = {
    'inspecaoRazao': dadosNormalizados.razao_social, 'inspecaoCnpj': dadosNormalizados.cnpj,
    'inspecaoTelefone': dadosNormalizados.telefone, 'inspecaoResponsavel': dadosNormalizados.responsavel,
    'inspecaoCep': dadosNormalizados.cep, 'inspecaoEndereco': dadosNormalizados.endereco,
    'inspecaoNumeroPredio': dadosNormalizados.numero_predio, 'inspecaoNumeroEmpresa': dadosNormalizados.numero_empresa
  };

  Object.entries(mapById).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });

  try {
    Object.entries(dadosNormalizados).forEach(([name, val]) => {
      const el = document.querySelector(`#inspectionForm [name="${name}"]`);
      if (el) el.value = val;
    });
  } catch (e) { /* silencioso */ }
}

function ajustarFormularioTipo(tipo) {
  const labelRazaoNome = document.getElementById('labelRazaoNome');
  const rowNumeroPredio = document.getElementById('rowNumeroPredio');
  const rowNumeroEmpresa = document.getElementById('rowNumeroEmpresa');
  if (tipo === 'predio') {
    if (labelRazaoNome) labelRazaoNome.textContent = 'Nome do Prédio';
    if (rowNumeroPredio) rowNumeroPredio.style.display = 'flex';
    if (rowNumeroEmpresa) rowNumeroEmpresa.style.display = 'none';
  } else {
    if (labelRazaoNome) labelRazaoNome.textContent = 'Razão Social';
    if (rowNumeroPredio) rowNumeroPredio.style.display = 'none';
    if (rowNumeroEmpresa) rowNumeroEmpresa.style.display = 'flex';
  }
}

function preencherDadosInspecao(obj) {
  if (!obj) return;
  ajustarFormularioTipo(obj.tipo || 'empresa');
  let attempts = 0;
  const iv = setInterval(() => {
    attempts++;
    preencherDadosInspecaoFromObj(obj);
    const razaoEl = document.querySelector('#inspectionForm [name="razao_social"], #inspecaoRazao');
    if (razaoEl && razaoEl.value && razaoEl.value.trim().length > 0) { clearInterval(iv); return; }
    if (attempts >= 6) clearInterval(iv);
  }, 100);
}

function preencherDadosInspecaoAlt(data) {
  if (!data) return;
  const set = (name, value) => { const el = document.querySelector(`#inspectionFormModal [name="${name}"]`); if (el) el.value = value || ''; };
  set('razao_social', data.razao_social || data.razao_social_predio || '');
  set('cnpj', data.cnpj || data.cnpj_predio || '');
  set('telefone', data.telefone || data.telefone_predio || '');
  set('responsavel', data.responsavel || data.responsavel_predio || '');
  set('cep', data.cep || data.cep_predio || '');
  set('endereco', data.endereco || data.endereco_predio || '');
  set('numero_predio', data.numero_predio || '');
}

async function startInspection(companyId) {
  try {
    const snapshot = await database.ref(`companies/${companyId}`).once('value');
    const company = snapshot.val();
    if (!company) return showToast('Empresa não encontrada', 'error');

    window.ultimaEmpresaCadastrada = { id: companyId, tipo: 'empresa', ...company };
    openModal('inspectionFormModal');

    setTimeout(() => {
      const labelRazaoNome = document.getElementById('labelRazaoNome');
      if (labelRazaoNome) labelRazaoNome.textContent = 'Razão Social';
      const campos = [
        ['inspecaoRazao', company.razao_social], ['inspecaoCnpj', company.cnpj],
        ['inspecaoTelefone', company.telefone], ['inspecaoResponsavel', company.responsavel],
        ['inspecaoCep', company.cep], ['inspecaoEndereco', company.endereco],
        ['inspecaoNumeroEmpresa', company.numero_empresa]
      ];
      campos.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val || ''; });

      const rowEmpresa = document.getElementById('rowNumeroEmpresa');
      const rowPredio = document.getElementById('rowNumeroPredio');
      const campoNumeroPredio = document.getElementById('inspecaoNumeroPredio');
      if (rowEmpresa) rowEmpresa.style.display = 'flex';
      if (rowPredio) rowPredio.style.display = 'none';
      if (campoNumeroPredio) campoNumeroPredio.value = '';
      window.currentInspectionType = 'empresa';
    }, 200);
  } catch (err) { console.error('Erro startInspection:', err); showToast('Erro ao iniciar inspeção', 'error'); }
}

async function startInspectionBuilding(buildingId) {
  try {
    const snapshot = await database.ref(`buildings/${buildingId}`).once('value');
    const building = snapshot.val();
    if (!building) return showToast('Prédio não encontrado', 'error');

    window.ultimaEmpresaCadastrada = { id: buildingId, tipo: 'predio', ...building };
    openModal('inspectionFormModal');

    setTimeout(() => {
      const labelRazaoNome = document.getElementById('labelRazaoNome');
      if (labelRazaoNome) labelRazaoNome.textContent = 'Nome do Prédio';
      const campos = [
        ['inspecaoRazao', building.razao_social_predio], ['inspecaoCnpj', building.cnpj_predio],
        ['inspecaoTelefone', building.telefone_predio], ['inspecaoResponsavel', building.responsavel_predio],
        ['inspecaoCep', building.cep_predio], ['inspecaoEndereco', building.endereco_predio],
        ['inspecaoNumeroPredio', building.numero_predio]
      ];
      campos.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val || ''; });

      const rowEmpresa = document.getElementById('rowNumeroEmpresa');
      const rowPredio = document.getElementById('rowNumeroPredio');
      const campoNumeroEmpresa = document.getElementById('inspecaoNumeroEmpresa');
      if (rowEmpresa) rowEmpresa.style.display = 'none';
      if (rowPredio) rowPredio.style.display = 'flex';
      if (campoNumeroEmpresa) campoNumeroEmpresa.value = '';
      window.currentInspectionType = 'predio';
    }, 200);
  } catch (err) { console.error('Erro startInspectionBuilding:', err); showToast('Erro ao iniciar inspeção do prédio', 'error'); }
}

if (!window.openModalOriginal) {
  window.openModalOriginal = window.openModal || function (id) { const modal = document.getElementById(id); if (modal) modal.classList.add('active'); };
  window.openModal = function (id) {
    window.openModalOriginal(id);
    if (id === 'inspectionFormModal') {
      if (window.ultimaEmpresaCadastrada) {
        ajustarFormularioTipo(window.ultimaEmpresaCadastrada.tipo || 'empresa');
        setTimeout(() => preencherDadosInspecao(window.ultimaEmpresaCadastrada), 120);
      } else {
        ajustarFormularioTipo('empresa');
      }
    }
  };
}

// ============================= 
// CONTROLE INPUTS NUMBER
// ============================= 
document.addEventListener('focusin', function (e) {
  const el = e.target;
  if (el.tagName === 'INPUT' && el.type === 'number' && el.value === '0') el.value = '';
});

document.addEventListener('input', function (e) {
  const el = e.target;
  if (el.tagName === 'INPUT' && el.type === 'number' && el.value.startsWith('-')) el.value = el.value.replace('-', '');
});

document.addEventListener('blur', function (e) {
  const el = e.target;
  if (el.tagName === 'INPUT' && el.type === 'number' && el.value.trim() === '') el.value = '0';
}, true);

document.addEventListener('DOMContentLoaded', () => {
  const campos = document.querySelectorAll('input, textarea, select');
  campos.forEach(campo => {
    campo.setAttribute('autocomplete', 'off'); campo.setAttribute('autocorrect', 'off');
    campo.setAttribute('autocapitalize', 'off'); campo.setAttribute('spellcheck', 'false');
  });
});

// ============================= 
// SUB ABAS ORDENS DE SERVIÇO
// ============================= 
document.querySelectorAll('.orders-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.getAttribute('data-tab');
    document.querySelectorAll('.orders-tab').forEach(btn => btn.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.orders-tab-content').forEach(content => content.classList.remove('active'));
    const targetContent = document.getElementById(`orders-tab-${targetTab}`);
    if (targetContent) targetContent.classList.add('active');
  });
});

// ============================= 
// PRODUTO - SALVAR
// ============================= 
function saveProduct() {
  const name = document.getElementById('productName').value.trim();
  const description = document.getElementById('productDescription').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const quantity = parseInt(document.getElementById('productQuantity').value) || 0;

  if (!name || isNaN(price) || price < 0) { showToast('Preencha todos os campos obrigatórios corretamente', 'error'); return; }

  const productId = Date.now();
  firebase.database().ref('products/' + productId).set({ id: productId, name, description, price, quantity })
    .then(() => { showToast('Produto cadastrado com sucesso!', 'success'); closeProductModal(); clearProductForm(); })
    .catch(err => { console.error(err); showToast('Erro ao salvar produto', 'error'); });
}

function clearProductForm() {
  document.getElementById('productName').value = '';
  document.getElementById('productDescription').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productQuantity').value = '';
}

// ============================= 
// BOTÃO DE RELATÓRIO (ATALHO)
// ============================= 
// Para usar: adicione <button onclick="abrirRelatorio()"> no seu HTML
// Ex: <button onclick="abrirRelatorio()" class="btn-primary">
//       <i class="fas fa-chart-bar"></i> Relatórios
//     </button>
/* ============================= */
/* CARREGAR PRODUTOS DO FIREBASE */
/* ============================= */
// ===========================
