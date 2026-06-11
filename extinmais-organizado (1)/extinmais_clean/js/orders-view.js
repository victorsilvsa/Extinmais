// FUNÇÃO PARA ALTERNAR VISUALIZAÇÃO
// ============================================

function toggleProductView(mode) {
  productViewMode = mode;
  updateViewButtons();
  renderProducts();
}

// ============================================
// FUNÇÃO PARA ATUALIZAR VISUAL DOS BOTÕES
// ============================================

function updateViewButtons() {
  const cardsBtn = document.getElementById('viewCardsBtn');
  const listBtn = document.getElementById('viewListBtn');

  if (!cardsBtn || !listBtn) return;

  if (productViewMode === 'cards') {
    cardsBtn.style.background = 'rgba(16, 185, 129, 0.2)';
    cardsBtn.style.borderColor = '#10b981';
    cardsBtn.style.color = '#10b981';

    listBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    listBtn.style.borderColor = '#333';
    listBtn.style.color = '#999';
  } else {
    listBtn.style.background = 'rgba(16, 185, 129, 0.2)';
    listBtn.style.borderColor = '#10b981';
    listBtn.style.color = '#10b981';

    cardsBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    cardsBtn.style.borderColor = '#333';
    cardsBtn.style.color = '#999';
  }
}


// ============================================
// RENDERIZAR COMO CARDS
// ============================================
// ============================================
// RENDERIZAR PRODUTOS COMO CARDS
// ============================================

function renderProductsAsCards(container, productsArray) {
  const gridContainer = document.createElement('div');
  gridContainer.style.cssText = `
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    width: 100%;
  `;

  const updateGridLayout = () => {
    if (window.innerWidth >= 1200) {
      gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else if (window.innerWidth >= 768) {
      gridContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
      gridContainer.style.gridTemplateColumns = '1fr';
    }
  };

  updateGridLayout();
  window.addEventListener('resize', updateGridLayout);

  productsArray.forEach(prod => {
    // ✅ Usar quantidade sempre do array atualizado
    const quantity = prod.quantity !== undefined ? prod.quantity : 0;

    let status = '';
    let statusColor = '';
    let statusBg = '';
    let borderColor = '';
    let statusIcon = '';

    if (quantity === 0) {
      status = 'SEM ESTOQUE';
      statusColor = '#ef4444';
      statusBg = 'rgba(239, 68, 68, 0.15)';
      borderColor = 'rgba(239, 68, 68, 0.4)';
      statusIcon = 'fa-times-circle';
    } else if (quantity <= 5) {
      status = 'ESTOQUE BAIXO';
      statusColor = '#f59e0b';
      statusBg = 'rgba(245, 158, 11, 0.15)';
      borderColor = 'rgba(245, 158, 11, 0.4)';
      statusIcon = 'fa-exclamation-triangle';
    } else if (quantity <= 10) {
      status = 'ATENÇÃO';
      statusColor = '#eab308';
      statusBg = 'rgba(234, 179, 8, 0.15)';
      borderColor = 'rgba(234, 179, 8, 0.4)';
      statusIcon = 'fa-exclamation-circle';
    } else {
      status = 'EM ESTOQUE';
      statusColor = '#10b981';
      statusBg = 'rgba(16, 185, 129, 0.15)';
      borderColor = 'rgba(47, 47, 47, 0.6)';
      statusIcon = 'fa-check-circle';
    }

    const card = document.createElement('div');
    card.style.cssText = `
      background: linear-gradient(145deg, #1f1f1f 0%, #1a1a1a 100%);
      border: 2px solid ${borderColor};
      border-radius: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 280px;
    `;

    card.onmouseenter = function () {
      this.style.transform = 'translateY(-4px)';
      this.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${statusColor}40`;
      this.style.borderColor = statusColor;
    };

    card.onmouseleave = function () {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
      this.style.borderColor = borderColor;
    };

    const statusBadge = document.createElement('div');
    statusBadge.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      background: ${statusBg};
      border: 1px solid ${statusColor};
      color: ${statusColor};
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 2;
      text-transform: uppercase;
    `;
    statusBadge.innerHTML = `<i class="fas ${statusIcon}"></i> ${status}`;

    const cardHeader = document.createElement('div');
    cardHeader.style.cssText = `
      padding-right: 120px;
      flex-shrink: 0;
    `;
    cardHeader.innerHTML = `
      <h3 style="
        color: #f1f1f1;
        font-weight: 700;
        font-size: 17px;
        margin: 0 0 8px 0;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      ">
        ${escapeHtml(prod.name)}
      </h3>
      <p style="
        color: #8b8b8b;
        font-size: 13px;
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      ">
        ${escapeHtml(prod.description || 'Sem descrição')}
      </p>
    `;

    const infoSection = document.createElement('div');
    infoSection.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
      border-top: 1px solid #2a2a2a;
      border-bottom: 1px solid #2a2a2a;
      flex: 1;
    `;

    const priceDiv = document.createElement('div');
    priceDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    priceDiv.innerHTML = `
      <i class="fas fa-dollar-sign" style="color: #10b981; font-size: 14px;"></i>
      <span style="color: #4ade80; font-weight: 700; font-size: 20px;">
        R$ ${prod.price.toFixed(2)}
      </span>
    `;

    const stockDiv = document.createElement('div');
    stockDiv.style.cssText = `
      background: #0d0d0d;
      border: 1px solid ${borderColor};
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    stockDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-boxes" style="color: ${statusColor}; font-size: 14px;"></i>
        <span style="color: #999; font-size: 13px; font-weight: 500;">Estoque</span>
      </div>
      <span style="
        color: ${statusColor};
        font-weight: 700;
        font-size: 18px;
        text-shadow: 0 0 10px ${statusColor}40;
      ">
        ${quantity}
      </span>
    `;

    infoSection.appendChild(priceDiv);
    infoSection.appendChild(stockDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: auto;
    `;

    const addStockBtn = document.createElement('button');
    addStockBtn.innerHTML = '<i class="fas fa-plus"></i><span style="margin-left: 6px;">Adicionar</span>';
    addStockBtn.style.cssText = `
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      border-radius: 10px;
      padding: 10px 14px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    addStockBtn.onmouseover = function () {
      this.style.background = 'rgba(16, 185, 129, 0.2)';
      this.style.transform = 'scale(1.02)';
    };
    addStockBtn.onmouseout = function () {
      this.style.background = 'rgba(16, 185, 129, 0.1)';
      this.style.transform = 'scale(1)';
    };
    addStockBtn.onclick = function () {
      openStockModal(prod.id, 'add');
    };

    const removeStockBtn = document.createElement('button');
    removeStockBtn.innerHTML = '<i class="fas fa-minus"></i><span style="margin-left: 6px;">Remover</span>';
    removeStockBtn.style.cssText = `
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
      border-radius: 10px;
      padding: 10px 14px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      ${quantity === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
    `;
    if (quantity > 0) {
      removeStockBtn.onmouseover = function () {
        this.style.background = 'rgba(245, 158, 11, 0.2)';
        this.style.transform = 'scale(1.02)';
      };
      removeStockBtn.onmouseout = function () {
        this.style.background = 'rgba(245, 158, 11, 0.1)';
        this.style.transform = 'scale(1)';
      };
    }
    removeStockBtn.onclick = function () {
      if (quantity === 0) {
        showToast('Não há estoque para remover!', 'error');
        return;
      }
      openStockModal(prod.id, 'remove');
    };

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i><span style="margin-left: 6px;">Editar</span>';
    editBtn.style.cssText = `
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #3b82f6;
      border-radius: 10px;
      padding: 10px 14px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    editBtn.onmouseover = function () {
      this.style.background = 'rgba(59, 130, 246, 0.2)';
      this.style.transform = 'scale(1.02)';
    };
    editBtn.onmouseout = function () {
      this.style.background = 'rgba(59, 130, 246, 0.1)';
      this.style.transform = 'scale(1)';
    };
    editBtn.onclick = function () {
      openEditModal(prod.id);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i><span style="margin-left: 6px;">Excluir</span>';
    deleteBtn.style.cssText = `
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      border-radius: 10px;
      padding: 10px 14px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    deleteBtn.onmouseover = function () {
      this.style.background = 'rgba(239, 68, 68, 0.2)';
      this.style.transform = 'scale(1.02)';
    };
    deleteBtn.onmouseout = function () {
      this.style.background = 'rgba(239, 68, 68, 0.1)';
      this.style.transform = 'scale(1)';
    };
    deleteBtn.onclick = function () {
      deleteProduct(prod.id);
    };

    actionsDiv.appendChild(addStockBtn);
    actionsDiv.appendChild(removeStockBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    card.appendChild(statusBadge);
    card.appendChild(cardHeader);
    card.appendChild(infoSection);
    card.appendChild(actionsDiv);

    gridContainer.appendChild(card);
  });

  container.appendChild(gridContainer);
}

// ============================================
// RENDERIZAR COMO LISTA
// ============================================

function renderProductsAsList(container, productsArray) {
  const listContainer = document.createElement('div');
  listContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  `;

  productsArray.forEach(prod => {
    const quantity = prod.quantity !== undefined ? prod.quantity : 0;

    let statusColor = '';
    let statusBg = '';
    let statusIcon = '';
    let statusText = '';

    if (quantity === 0) {
      statusText = 'SEM ESTOQUE';
      statusColor = '#ef4444';
      statusBg = 'rgba(239, 68, 68, 0.15)';
      statusIcon = 'fa-times-circle';
    } else if (quantity <= 5) {
      statusText = 'ESTOQUE BAIXO';
      statusColor = '#f59e0b';
      statusBg = 'rgba(245, 158, 11, 0.15)';
      statusIcon = 'fa-exclamation-triangle';
    } else if (quantity <= 10) {
      statusText = 'ATENÇÃO';
      statusColor = '#eab308';
      statusBg = 'rgba(234, 179, 8, 0.15)';
      statusIcon = 'fa-exclamation-circle';
    } else {
      statusText = 'EM ESTOQUE';
      statusColor = '#10b981';
      statusBg = 'rgba(16, 185, 129, 0.15)';
      statusIcon = 'fa-check-circle';
    }

    const row = document.createElement('div');
    row.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.3s ease;
      flex-wrap: wrap;
    `;

    row.onmouseenter = function () {
      this.style.background = '#1f1f1f';
      this.style.borderColor = statusColor;
      this.style.transform = 'translateX(4px)';
    };

    row.onmouseleave = function () {
      this.style.background = '#1a1a1a';
      this.style.borderColor = '#2a2a2a';
      this.style.transform = 'translateX(0)';
    };

    const infoCol = document.createElement('div');
    infoCol.style.cssText = `
      flex: 1;
      min-width: 200px;
    `;
    infoCol.innerHTML = `
      <div style="color: #f1f1f1; font-weight: 700; font-size: 15px; margin-bottom: 6px;">
        ${escapeHtml(prod.name)}
      </div>
      <div style="color: #8b8b8b; font-size: 12px;">
        ${escapeHtml(prod.description || 'Sem descrição')}
      </div>
    `;

    const priceCol = document.createElement('div');
    priceCol.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    priceCol.innerHTML = `
      <i class="fas fa-dollar-sign" style="color: #10b981; font-size: 12px;"></i>
      <span style="color: #4ade80; font-weight: 700; font-size: 16px;">
        R$ ${prod.price.toFixed(2)}
      </span>
    `;

    const stockCol = document.createElement('div');
    stockCol.style.cssText = `
      background: ${statusBg};
      border: 1px solid ${statusColor};
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 140px;
    `;
    stockCol.innerHTML = `
      <i class="fas ${statusIcon}" style="color: ${statusColor}; font-size: 12px;"></i>
      <span style="color: ${statusColor}; font-size: 13px; font-weight: 700;">
        ${quantity} un
      </span>
    `;

    const actionsCol = document.createElement('div');
    actionsCol.style.cssText = `
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    `;

    const addBtn = document.createElement('button');
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addBtn.title = 'Adicionar estoque';
    addBtn.style.cssText = `
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    `;
    addBtn.onmouseover = function () {
      this.style.background = 'rgba(16, 185, 129, 0.2)';
    };
    addBtn.onmouseout = function () {
      this.style.background = 'rgba(16, 185, 129, 0.1)';
    };
    addBtn.onclick = function () {
      openStockModal(prod.id, 'add');
    };

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="fas fa-minus"></i>';
    removeBtn.title = 'Remover estoque';
    removeBtn.style.cssText = `
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
      ${quantity === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
    `;
    if (quantity > 0) {
      removeBtn.onmouseover = function () {
        this.style.background = 'rgba(245, 158, 11, 0.2)';
      };
      removeBtn.onmouseout = function () {
        this.style.background = 'rgba(245, 158, 11, 0.1)';
      };
    }
    removeBtn.onclick = function () {
      if (quantity === 0) {
        showToast('Não há estoque para remover!', 'error');
        return;
      }
      openStockModal(prod.id, 'remove');
    };

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Editar produto';
    editBtn.style.cssText = `
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #3b82f6;
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    `;
    editBtn.onmouseover = function () {
      this.style.background = 'rgba(59, 130, 246, 0.2)';
    };
    editBtn.onmouseout = function () {
      this.style.background = 'rgba(59, 130, 246, 0.1)';
    };
    editBtn.onclick = function () {
      openEditModal(prod.id);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Excluir produto';
    deleteBtn.style.cssText = `
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    `;
    deleteBtn.onmouseover = function () {
      this.style.background = 'rgba(239, 68, 68, 0.2)';
    };
    deleteBtn.onmouseout = function () {
      this.style.background = 'rgba(239, 68, 68, 0.1)';
    };
    deleteBtn.onclick = function () {
      deleteProduct(prod.id);
    };

    actionsCol.appendChild(addBtn);
    actionsCol.appendChild(removeBtn);
    actionsCol.appendChild(editBtn);
    actionsCol.appendChild(deleteBtn);

    row.appendChild(infoCol);
    row.appendChild(priceCol);
    row.appendChild(stockCol);
    row.appendChild(actionsCol);

    listContainer.appendChild(row);
  });

  container.appendChild(listContainer);
}

// ============================================
// FUNÇÃO PRINCIPAL: RENDERIZAR PRODUTOS
// ============================================

function renderProducts() {
  const list = document.getElementById('productsList');
  if (!list) {
    console.log('Elemento productsList não encontrado!');
    return;
  }

  list.innerHTML = '';

  list.appendChild(createProductToolbar());

  if (!products || products.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.cssText = `
      text-align: center;
      padding: 60px 20px;
      color: #666;
    `;
    emptyState.innerHTML = `
      <i class="fas fa-box-open" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3; color: #10b981;"></i>
      <p style="font-size: 16px; font-weight: 600; margin: 0;">Nenhum produto cadastrado</p>
      <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.7;">Adicione seu primeiro produto para começar</p>
    `;
    list.appendChild(emptyState);
    return;
  }

  const filteredProducts = filterProductsClient(products);

  if (filteredProducts.length === 0) {
    const noResultsState = document.createElement('div');
    noResultsState.style.cssText = `
      text-align: center;
      padding: 60px 20px;
      color: #666;
    `;
    noResultsState.innerHTML = `
      <i class="fas fa-search" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;"></i>
      <p style="font-size: 16px; font-weight: 600; margin: 0;">Nenhum produto encontrado</p>
      <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.7;">Tente ajustar os filtros de busca</p>
    `;
    list.appendChild(noResultsState);
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  if (productViewMode === 'cards') {
    renderProductsAsCards(list, paginatedProducts);
  } else {
    renderProductsAsList(list, paginatedProducts);
  }

  renderPagination(filteredProducts.length);
}

// ===========================
// MODAL DE CONTROLE DE ESTOQUE
// ===========================
function openStockModal(productId, action) {
  // ✅ Buscar produto atualizado do Firebase em tempo real
  database.ref('products')
    .orderByChild('id')
    .equalTo(Number(productId))
    .once('value', (snapshot) => {
      if (!snapshot.exists()) {
        showToast('Produto não encontrado!', 'error');
        return;
      }

      let product = null;
      let firebaseKey = null;

      snapshot.forEach((childSnapshot) => {
        product = childSnapshot.val();
        firebaseKey = childSnapshot.key;
      });

      if (!product) return;

      const isAdd = action === 'add';
      const title = isAdd ? 'Adicionar ao Estoque' : 'Remover do Estoque';
      const icon = isAdd ? 'fa-plus' : 'fa-minus';
      const color = isAdd ? '#10b981' : '#f59e0b';
      const buttonText = isAdd ? 'Adicionar' : 'Remover';

      const overlay = document.createElement('div');
      overlay.id = 'stockModalOverlay';
      overlay.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:rgba(0,0,0,0.8);
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:99999;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background:#1a1a1a;
        border:2px solid ${color};
        border-radius:16px;
        padding:30px;
        width:90%;
        max-width:400px;
        box-shadow:0 10px 40px rgba(0,0,0,0.8);
      `;

      modal.innerHTML = `
        <h2 style="color:#f1f1f1; font-size:22px; margin:0 0 20px 0;">
          <i class="fas ${icon}" style="color:${color};"></i> ${title}
        </h2>

        <div style="margin-bottom:16px;">
          <label style="display:block; color:#f1f1f1; margin-bottom:8px; font-weight:600;">Produto</label>
          <div style="
            background:#0f0f0f;
            border:1px solid #333;
            border-radius:8px;
            padding:12px;
            color:#aaa;
            font-size:15px;
          ">
            ${escapeHtml(product.name)}
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; color:#f1f1f1; margin-bottom:8px; font-weight:600;">Estoque Atual</label>
          <div style="
            background:#0f0f0f;
            border:1px solid #333;
            border-radius:8px;
            padding:12px;
            color:#10b981;
            font-size:18px;
            font-weight:700;
          ">
            ${product.quantity || 0} unidades
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <label style="display:block; color:#f1f1f1; margin-bottom:8px; font-weight:600;">Quantidade</label>
          <input type="number" id="stockQuantity" value="1" min="1" ${!isAdd ? `max="${product.quantity || 0}"` : ''} style="
            width:100%;
            background:#0f0f0f;
            border:1px solid #333;
            border-radius:8px;
            padding:12px;
            color:#f1f1f1;
            font-size:15px;
            box-sizing:border-box;
          ">
        </div>

        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button id="cancelStockBtn" style="
            background:#1f1f1f;
            border:1px solid #333;
            color:#ef4444;
            border-radius:8px;
            padding:12px 24px;
            cursor:pointer;
            font-size:15px;
            font-weight:600;
          ">
            Cancelar
          </button>
          <button id="confirmStockBtn" style="
            background:${color};
            border:none;
            color:#fff;
            border-radius:8px;
            padding:12px 24px;
            cursor:pointer;
            font-size:15px;
            font-weight:600;
          ">
            ${buttonText}
          </button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // ✅ Função helper para fechar modal com segurança
      const closeModal = () => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };

      document.getElementById('cancelStockBtn').onclick = closeModal;

      document.getElementById('confirmStockBtn').onclick = () => {
        const qty = parseInt(document.getElementById('stockQuantity').value);

        if (!qty || qty <= 0) {
          showToast('Quantidade inválida!', 'error');
          return;
        }

        if (!isAdd && qty > (product.quantity || 0)) {
          showToast('Quantidade maior que o estoque disponível!', 'error');
          return;
        }

        updateStock(firebaseKey, qty, isAdd, product);
        closeModal();
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          closeModal();
        }
      };
    });
}



// ===========================
// ATUALIZAR ESTOQUE NO FIREBASE
// ===========================
async function updateStock(firebaseKey, quantity, isAdd, product) {
  try {
    if (!firebaseKey) {
      showToast('Chave do produto não encontrada!', 'error');
      return;
    }

    const currentStock = product.quantity || 0;
    const newStock = isAdd ? currentStock + quantity : currentStock - quantity;

    if (newStock < 0) {
      showToast('Estoque não pode ser negativo!', 'error');
      return;
    }

    // ✅ Atualizar no Firebase usando a chave correta
    await database.ref(`products/${firebaseKey}`).update({
      quantity: newStock
    });

    const action = isAdd ? 'adicionado ao' : 'removido do';
    showToast(`${quantity} unidade(s) ${action} estoque!`, 'success');

  } catch (err) {
    console.error('Erro ao atualizar estoque:', err);
    showToast('Erro ao atualizar estoque', 'error');
  }
}

// ===========================
// PAGINAÇÃO
// ===========================
function renderPagination(totalFilteredProducts) {
  const totalPages = Math.ceil(totalFilteredProducts / itemsPerPage);
  const paginationContainer = document.getElementById('pagination');

  if (!paginationContainer || totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  paginationContainer.innerHTML = '';
  paginationContainer.style.cssText = `
    display:flex;
    justify-content:center;
    align-items:center;
    gap:8px;
    margin-top:20px;
    padding:16px 0;
  `;

  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.style.cssText = `
    background:#1f1f1f;
    border:1px solid #333;
    color:${currentPage === 1 ? '#555' : '#f1f1f1'};
    border-radius:8px;
    padding:8px 12px;
    cursor:${currentPage === 1 ? 'not-allowed' : 'pointer'};
  `;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderProducts();
    }
  };
  paginationContainer.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.style.cssText = `
      background:${i === currentPage ? '#3b82f6' : '#1f1f1f'};
      border:1px solid ${i === currentPage ? '#3b82f6' : '#333'};
      color:#f1f1f1;
      border-radius:8px;
      padding:8px 12px;
      cursor:pointer;
      min-width:36px;
      font-weight:${i === currentPage ? '600' : '400'};
    `;
    pageBtn.onclick = () => {
      currentPage = i;
      renderProducts();
    };
    paginationContainer.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.style.cssText = `
    background:#1f1f1f;
    border:1px solid #333;
    color:${currentPage === totalPages ? '#555' : '#f1f1f1'};
    border-radius:8px;
    padding:8px 12px;
    cursor:${currentPage === totalPages ? 'not-allowed' : 'pointer'};
  `;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderProducts();
    }
  };
  paginationContainer.appendChild(nextBtn);
}

// ===========================
// EDITAR PRODUTO
// ===========================
function openEditModal(productId) {
  // ✅ Buscar produto atualizado do Firebase
  database.ref('products')
    .orderByChild('id')
    .equalTo(Number(productId))
    .once('value', (snapshot) => {
      if (!snapshot.exists()) {
        showToast('Produto não encontrado!', 'error');
        return;
      }

      let product = null;
      let firebaseKey = null;

      snapshot.forEach((childSnapshot) => {
        product = childSnapshot.val();
        firebaseKey = childSnapshot.key;
      });

      if (!product) return;

      editingProductId = firebaseKey;

      const overlay = document.createElement('div');
      overlay.id = 'editModalOverlay';
      overlay.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:rgba(0,0,0,0.8);
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:99999;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background:#1a1a1a;
        border:2px solid #3b82f6;
        border-radius:16px;
        padding:30px;
        width:90%;
        max-width:500px;
        box-shadow:0 10px 40px rgba(0,0,0,0.8);
      `;

      modal.innerHTML = `
        <h2 style="color:#f1f1f1; font-size:24px; margin:0 0 20px 0;">
          <i class="fas fa-edit" style="color:#3b82f6;"></i> Editar Produto
        </h2>
        
        <div style="margin-bottom:16px;">
          <label style="display:block; color:#f1f1f1; margin-bottom:8px; font-weight:600;">Nome</label>
          <input type="text" id="editName" value="${escapeHtml(product.name)}" style="
            width:100%;
            background:#0f0f0f;
            border:1px solid #333;
            border-radius:8px;
            padding:12px;
            color:#f1f1f1;
            font-size:15px;
            box-sizing:border-box;
          ">
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; color:#f1f1f1; margin-bottom:8px; font-weight:600;">Descrição</label>
          <textarea id="editDesc" rows="3" style="
            width:100%;
            background:#0f0f0f;
            border:1px solid #333;
            border-radius:8px;
            padding:12px;
            color:#f1f1f1;
            font-size:15px;
            box-sizing:border-box;
            font-family:inherit;
            resize:vertical;
          ">${escapeHtml(product.description || '')}</textarea>
        </div>

        <div style="margin-bottom:24px;">
          <label style="display:block; color:#f1f1f1; margin-bottom:8px; font-weight:600;">Preço</label>
          <input type="number" id="editPrice" value="${product.price}" step="0.01" min="0" style="
            width:100%;
            background:#0f0f0f;
            border:1px solid #333;
            border-radius:8px;
            padding:12px;
            color:#f1f1f1;
            font-size:15px;
            box-sizing:border-box;
          ">
        </div>

        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button id="cancelBtn" style="
            background:#1f1f1f;
            border:1px solid #333;
            color:#ef4444;
            border-radius:8px;
            padding:12px 24px;
            cursor:pointer;
            font-size:15px;
            font-weight:600;
          ">
            Cancelar
          </button>
          <button id="saveBtn" style="
            background:#3b82f6;
            border:none;
            color:#fff;
            border-radius:8px;
            padding:12px 24px;
            cursor:pointer;
            font-size:15px;
            font-weight:600;
          ">
            Salvar
          </button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // ✅ Função helper para fechar modal com segurança
      const closeModal = () => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };

      document.getElementById('cancelBtn').onclick = closeModal;

      document.getElementById('saveBtn').onclick = async () => {
        const name = document.getElementById('editName').value.trim();
        const description = document.getElementById('editDesc').value.trim();
        const price = parseFloat(document.getElementById('editPrice').value);

        if (!name || !price || price <= 0) {
          showToast('Preencha todos os campos corretamente!', 'error');
          return;
        }

        try {
          await database.ref(`products/${firebaseKey}`).update({
            name,
            description,
            price
          });

          showToast('Produto atualizado com sucesso!', 'success');
          closeModal();
        } catch (err) {
          console.error('Erro ao atualizar produto:', err);
          showToast('Erro ao atualizar produto', 'error');
        }
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          closeModal();
        }
      };
    });
}



// ===========================
// DELETAR PRODUTO
// ===========================
function deleteProduct(productId) {
  if (!productId) return;

  // ✅ Buscar produto do Firebase primeiro
  database.ref('products')
    .orderByChild('id')
    .equalTo(Number(productId))
    .once('value', (snapshot) => {
      if (!snapshot.exists()) {
        showToast('Produto não encontrado!', 'error');
        return;
      }

      let firebaseKey = null;

      snapshot.forEach((childSnapshot) => {
        firebaseKey = childSnapshot.key;
      });

      if (!firebaseKey) return;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:rgba(0,0,0,0.8);
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:99999;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background:#1a1a1a;
        border:2px solid #ef4444;
        border-radius:16px;
        padding:30px;
        width:90%;
        max-width:400px;
        box-shadow:0 10px 40px rgba(0,0,0,0.8);
      `;

      modal.innerHTML = `
        <h2 style="color:#ef4444; font-size:22px; margin:0 0 16px 0;">
          <i class="fas fa-exclamation-triangle"></i> Confirmar Exclusão
        </h2>
        <p style="color:#f1f1f1; margin:0 0 24px 0; line-height:1.6;">
          Deseja realmente excluir este produto? Esta ação não pode ser desfeita.
        </p>
        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button id="cancelDeleteBtn" style="
            background:#1f1f1f;
            border:1px solid #333;
            color:#f1f1f1;
            border-radius:8px;
            padding:12px 24px;
            cursor:pointer;
            font-size:15px;
            font-weight:600;
          ">
            Cancelar
          </button>
          <button id="confirmDeleteBtn" style="
            background:#ef4444;
            border:none;
            color:#fff;
            border-radius:8px;
            padding:12px 24px;
            cursor:pointer;
            font-size:15px;
            font-weight:600;
          ">
            Excluir
          </button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // ✅ Função helper para fechar modal com segurança
      const closeModal = () => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };

      document.getElementById('cancelDeleteBtn').onclick = closeModal;

      document.getElementById('confirmDeleteBtn').onclick = async () => {
        try {
          await database.ref(`products/${firebaseKey}`).remove();

          products = products.filter(p => p.id !== productId);

          renderProducts();
          populateOSProductSelect();

          showToast('Produto removido com sucesso!', 'success');
          closeModal();
        } catch (err) {
          console.error('Erro ao excluir produto:', err);
          showToast('Erro ao excluir produto', 'error');
        }
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          closeModal();
        }
      };
    });
}




// ===========================
// POPULAR SELECT DA OS
// ===========================
function populateOSProductSelect() {
  const select = document.getElementById('osProductSelect');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione um produto</option>';

  const availableProducts = products.filter(p => (p.quantity || 0) > 0);

  availableProducts.forEach(prod => {
    const opt = document.createElement('option');
    opt.value = prod.id;
    opt.textContent = `${prod.name} - R$ ${prod.price.toFixed(2)} (Estoque: ${prod.quantity})`;
    select.appendChild(opt);
  });
}

// ===========================
// ADICIONAR PRODUTO À OS
// ===========================
document.addEventListener('click', function (e) {
  if (e.target && (e.target.id === 'addProductToOSBtn' || e.target.closest('#addProductToOSBtn'))) {
    abrirModalSelecionarProdutoOS();
  }
});

function abrirModalSelecionarProdutoOS() {
  const modalHtml = `
    <div id="selectProductOSModal" style="
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
    ">
      <div style="
        background: #1f1f1f;
        border: 2px solid #10b981;
        border-radius: 16px;
        width: 100%;
        max-width: 520px;
        max-height: 85vh;
        color: #f5f5f5;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 22px;
          border-bottom: 2px solid #10b981;
          background: #2a2a2a;
          border-radius: 14px 14px 0 0;
          flex-shrink: 0;
        ">
          <h3 style="
            margin: 0;
            font-size: 1.25rem;
            color: #10b981;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
          ">
            <i class="fas fa-search"></i>
            Selecionar Produto
          </h3>
          <button onclick="fecharModalSelecionarProdutoOS()" style="
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            font-size: 1.2rem;
            cursor: pointer;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
          ">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div style="padding: 20px 22px; border-bottom: 1px solid #2a2a2a; flex-shrink: 0; background: #1a1a1a;">
          <div style="position: relative;">
            <input type="text" id="searchProductOSInput" placeholder="Digite para buscar produtos..." style="
              width: 100%;
              padding: 14px 16px 14px 46px;
              background: #0d0d0d;
              border: 2px solid #333;
              border-radius: 10px;
              color: #fff;
              font-size: 0.95rem;
              box-sizing: border-box;
              font-weight: 500;
            " oninput="filtrarProdutosOSModal()">
            <i class="fas fa-search" style="
              position: absolute;
              left: 16px;
              top: 50%;
              transform: translateY(-50%);
              color: #10b981;
              font-size: 16px;
            "></i>
          </div>
        </div>

        <div id="productOSModalList" style="
          flex: 1;
          overflow-y: auto;
          padding: 16px 22px;
          background: #1a1a1a;
        ">
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  renderizarListaProdutosOSModal();
}

function renderizarListaProdutosOSModal(filtro = '') {
  const container = document.getElementById('productOSModalList');
  if (!container) return;

  const filtroLower = filtro.toLowerCase();

  const produtosFiltrados = products.filter(p => {
    const hasStock = (p.quantity || 0) > 0;
    const matchesFilter = p.name.toLowerCase().includes(filtroLower) ||
      (p.description && p.description.toLowerCase().includes(filtroLower));

    return hasStock && matchesFilter;
  });

  if (produtosFiltrados.length === 0) {
    container.innerHTML = `
      <div style="
        padding: 50px 20px;
        text-align: center;
        color: #666;
      ">
        <i class="fas fa-box-open" style="font-size: 3.5rem; margin-bottom: 14px; color: #10b981; opacity: 0.3;"></i>
        <p style="margin: 0; font-size: 14px; font-weight: 500;">Nenhum produto disponível</p>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #555;">
          ${filtro ? 'Nenhum produto com estoque corresponde à busca' : 'Todos os produtos estão sem estoque'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = produtosFiltrados.map(prod => {
    const stockQuantity = prod.quantity || 0;

    return `
    <div style="
      background: linear-gradient(135deg, #0d0d0d 0%, #121212 100%);
      border: 2px solid #2a2a2a;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 10px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    " onmouseover="this.style.background='linear-gradient(135deg, #1a1a1a 0%, #1f1f1f 100%)'; this.style.borderColor='#10b981'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 18px rgba(16, 185, 129, 0.2)'" onmouseout="this.style.background='linear-gradient(135deg, #0d0d0d 0%, #121212 100%)'; this.style.borderColor='#2a2a2a'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
      
      <div style="
        position: absolute;
        top: 0;
        right: 0;
        width: 50px;
        height: 50px;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
        border-radius: 0 0 0 100%;
      "></div>

      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      ">
        <div style="
          width: 7px;
          height: 7px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
          flex-shrink: 0;
        "></div>
        <div style="
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.2px;
        ">
          ${escapeHtml(prod.name)}
        </div>
      </div>

      <div style="
        color: #999;
        font-size: 12px;
        margin-bottom: 10px;
        line-height: 1.4;
        padding-left: 15px;
      ">
        ${escapeHtml(prod.description || 'Sem descrição disponível')}
      </div>

      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-left: 15px;
        gap: 10px;
        flex-wrap: wrap;
      ">
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <div style="
            color: #4ade80;
            font-weight: 800;
            font-size: 17px;
            text-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
          ">
            R$ ${prod.price.toFixed(2)}
          </div>
          <div style="
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 6px;
            padding: 3px 7px;
            color: #10b981;
            font-size: 10px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          ">
            <i class="fas fa-boxes" style="font-size: 9px;"></i>
            Estoque: ${stockQuantity}
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 5px; background: #0d0d0d; border: 2px solid #333; border-radius: 7px; padding: 3px;">
            <button onclick="event.stopPropagation(); alterarQuantidadeModal(${prod.id}, -1)" style="
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.3);
              color: #ef4444;
              width: 26px;
              height: 26px;
              border-radius: 5px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              transition: all 0.2s ease;
            " onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
              <i class="fas fa-minus" style="font-size: 10px;"></i>
            </button>
            
            <input type="number" id="qty_${prod.id}" value="1" min="1" max="${stockQuantity}" style="
              width: 45px;
              background: transparent;
              border: none;
              color: #fff;
              text-align: center;
              font-size: 13px;
              font-weight: 700;
              outline: none;
              cursor: text;
            " onclick="event.stopPropagation(); this.select();" onchange="validarQuantidadeModalOS(${prod.id}, ${stockQuantity})" onblur="validarQuantidadeModalOS(${prod.id}, ${stockQuantity})">
            
            <button onclick="event.stopPropagation(); alterarQuantidadeModal(${prod.id}, 1, ${stockQuantity})" style="
              background: rgba(16, 185, 129, 0.15);
              border: 1px solid rgba(16, 185, 129, 0.3);
              color: #10b981;
              width: 26px;
              height: 26px;
              border-radius: 5px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              transition: all 0.2s ease;
            " onmouseover="this.style.background='rgba(16, 185, 129, 0.25)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.15)'">
              <i class="fas fa-plus" style="font-size: 10px;"></i>
            </button>
          </div>
          
          <button onclick="event.stopPropagation(); selecionarProdutoOSModal(${prod.id})" style="
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            padding: 7px 14px;
            border-radius: 18px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(16, 185, 129, 0.3);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 5px;
          " onmouseover="this.style.background='rgba(16, 185, 129, 0.25)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.15)'; this.style.transform='scale(1)'">
            <i class="fas fa-plus"></i>
            Adicionar
          </button>
        </div>
      </div>

    </div>
  `;
  }).join('');
}

function filtrarProdutosOSModal() {
  const input = document.getElementById('searchProductOSInput');
  if (!input) return;
  renderizarListaProdutosOSModal(input.value);
}

function fecharModalSelecionarProdutoOS() {
  const modal = document.getElementById('selectProductOSModal');
  if (modal) modal.remove();
}

// alterarQuantidadeModal versão simples removida (ver versão melhorada abaixo)

// validarQuantidadeModalOS versão simples removida (ver versão melhorada abaixo)

// selecionarProdutoOSModal versão simples removida (ver versão melhorada abaixo)


// ===========================
// MODAL DE CRIAÇÃO - VALIDAÇÃO E SELEÇÃO
// ===========================
function validarQuantidadeModalOS(prodId, maxStock) {
  const input = document.getElementById(`qty_${prodId}`);
  if (!input) return;

  let valor = parseInt(input.value);

  if (isNaN(valor) || valor < 1) {
    input.value = 1;
  } else if (valor > maxStock) {
    input.value = maxStock;
    showToast(`Quantidade máxima disponível: ${maxStock}`, 'info');
  } else {
    input.value = valor;
  }
}

function alterarQuantidadeModal(productId, delta, maxStock) {
  const input = document.getElementById(`qty_${productId}`);
  if (!input) return;

  let currentValue = parseInt(input.value) || 1;
  let newValue = currentValue + delta;

  if (newValue < 1) newValue = 1;

  if (maxStock && newValue > maxStock) {
    showToast('Quantidade maior que o estoque disponível!', 'error');
    newValue = maxStock;
  }

  input.value = newValue;
}

function selecionarProdutoOSModal(productId) {
  const produto = products.find(p => p.id === productId);
  if (!produto) {
    showToast('Produto não encontrado', 'error');
    return;
  }

  const jaAdicionado = osSelectedProducts.some(p => p.id === productId);
  if (jaAdicionado) {
    showToast('Este produto já foi adicionado à OS', 'error');
    return;
  }

  const qtyInput = document.getElementById(`qty_${productId}`);
  const qty = parseInt(qtyInput?.value) || 1;

  if (qty <= 0) {
    showToast('Quantidade inválida', 'error');
    return;
  }

  const stockAvailable = produto.quantity || 0;
  if (qty > stockAvailable) {
    showToast('Quantidade maior que o estoque disponível!', 'error');
    return;
  }

  osSelectedProducts.push({
    id: produto.id,
    name: produto.name,
    qty: qty,
    price: produto.price
  });

  produto.quantity = (produto.quantity || 0) - qty;
  renderizarListaProdutosOSModal();
  renderOSProducts();
  showToast(`${produto.name} (${qty}x) adicionado com sucesso!`, 'success');
}

// ===========================
// MODAL DE EDIÇÃO - funções duplicadas removidas (ver definições acima)
// ===========================

function abrirModalSelecionarProdutoEditOS() {
  document.body.style.overflow = 'hidden';

  const editModal = document.getElementById('editOSModal');
  if (editModal) editModal.style.display = 'none';

  const modalHtml = `
    <div id="selectProductEditOSModal" class="modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.98);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 12px;
      backdrop-filter: blur(10px);
      z-index: 2147483647;
      overflow: auto;
    ">
      <div class="modal-content" style="
        background: linear-gradient(145deg, #1f1f1f 0%, #1a1a1a 100%);
        border: 2px solid #10b981;
        border-radius: 12px;
        width: 100%;
        max-width: 450px;
        max-height: 85vh;
        color: #f5f5f5;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(16, 185, 129, 0.2);
        display: flex;
        flex-direction: column;
        position: relative;
        margin: auto;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          border-bottom: 2px solid #10b981;
          background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
          border-radius: 10px 10px 0 0;
          flex-shrink: 0;
        ">
          <h3 style="
            margin: 0;
            font-size: 1.15rem;
            color: #10b981;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
            letter-spacing: 0.3px;
          ">
            <i class="fas fa-search" style="font-size: 1rem;"></i>
            Adicionar Produto
          </h3>
          <button onclick="closeProductModal()" style="
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            font-size: 1.15rem;
            cursor: pointer;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.borderColor='#ef4444'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.borderColor='rgba(239, 68, 68, 0.3)'">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div style="padding: 16px 18px; border-bottom: 1px solid #2a2a2a; flex-shrink: 0; background: #1a1a1a;">
          <div style="position: relative;">
            <input type="text" id="searchProductEditOSInput" placeholder="Buscar produtos com estoque..." style="
              width: 100%;
              padding: 12px 14px 12px 42px;
              background: #0d0d0d;
              border: 2px solid #333;
              border-radius: 10px;
              color: #fff;
              font-size: 0.9rem;
              transition: all 0.3s ease;
              box-sizing: border-box;
              font-weight: 500;
            " onfocus="this.style.borderColor='#10b981'; this.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'" onblur="this.style.borderColor='#333'; this.style.boxShadow='none'" oninput="filtrarProdutosEditOSModal()">
            <i class="fas fa-search" style="
              position: absolute;
              left: 14px;
              top: 50%;
              transform: translateY(-50%);
              color: #10b981;
              font-size: 15px;
            "></i>
          </div>
        </div>

        <div id="productEditOSModalList" style="
          flex: 1;
          overflow-y: auto;
          padding: 14px 18px;
          background: #1a1a1a;
          min-height: 200px;
        ">
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  renderizarListaProdutosEditOSModal();
  openProductModal();
}

function openProductModal() {
  const modal = document.getElementById('productModal') || document.getElementById('selectProductEditOSModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeProductModal() {
  const productModal = document.getElementById('productModal');
  const selectModal = document.getElementById('selectProductEditOSModal');

  if (productModal) {
    productModal.classList.remove('active');
  }

  if (selectModal) {
    selectModal.classList.remove('active');

    setTimeout(() => {
      selectModal.remove();
      document.body.style.overflow = '';

      const editModal = document.getElementById('editOSModal');
      if (editModal) editModal.style.display = 'flex';
    }, 300);
  }
}

// ===========================
// RENDER PRODUTOS DA OS
// ===========================
function renderOSProducts() {
  const list = document.getElementById('osProductsList');
  if (!list) return;

  list.innerHTML = '';

  if (osSelectedProducts.length === 0) {
    list.innerHTML = `
      <div style="
        padding: 30px 20px;
        text-align: center;
        color: #666;
      ">
        <i class="fas fa-shopping-basket" style="font-size: 2.5rem; margin-bottom: 10px; color: #10b981; opacity: 0.3;"></i>
        <p style="margin: 0; font-size: 14px;">Nenhum produto adicionado</p>
      </div>
    `;
    updateOSProductTotals();
    return;
  }

  osSelectedProducts.forEach((prod, index) => {
    const item = document.createElement('div');
    item.style.cssText = `
      display:flex;
      justify-content:space-between;
      align-items:center;
      background: #2a2a2a;
      border:2px solid #333;
      border-radius:10px;
      padding:14px 16px;
      margin-bottom:10px;
    `;

    item.innerHTML = `
      <div style="flex: 1;">
        <div style="
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <i class="fas fa-box" style="color: #10b981; font-size: 13px;"></i>
          ${escapeHtml(prod.name)}
        </div>
        <div style="
          display: flex;
          gap: 16px;
          color: #aaa;
          font-size: 13px;
        ">
          <span><strong style="color: #10b981;">Qtd:</strong> ${prod.qty}</span>
          <span><strong style="color: #10b981;">Unit:</strong> R$ ${prod.price.toFixed(2)}</span>
          <span><strong style="color: #4ade80;">Total:</strong> R$ ${(prod.price * prod.qty).toFixed(2)}</span>
        </div>
      </div>
      <button
        data-remove-os-product="${prod.id}"
        style="
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          cursor: pointer;
          font-size: 1rem;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        "
        title="Remover produto"
      >
        <i class="fas fa-trash-alt"></i>
      </button>
    `;

    list.appendChild(item);
  });

  updateOSProductTotals();
}

// ===========================
// REMOVER PRODUTO DA OS
// ===========================
function removeProductFromOS(id) {
  const produtoRemovido = osSelectedProducts.find(p => p.id === id);

  if (produtoRemovido) {
    // Devolver estoque ao remover
    const produto = products.find(p => p.id === id);
    if (produto) {
      produto.quantity = (produto.quantity || 0) + produtoRemovido.qty;
    }

    osSelectedProducts = osSelectedProducts.filter(p => p.id !== id);
    renderOSProducts();
    showToast(`${produtoRemovido.name} removido com sucesso`, 'success');
  }
}

document.addEventListener('click', function (e) {
  const btn = e.target.closest('[data-remove-os-product]');
  if (btn) {
    const productId = parseInt(btn.getAttribute('data-remove-os-product'));
    removeProductFromOS(productId);
  }
});

// ===========================
// CALCULAR TOTAIS + LUCRO
// ===========================
function updateOSProductTotals() {
  const subtotal = osSelectedProducts.reduce((acc, p) => {
    return acc + (Number(p.price) * Number(p.qty));
  }, 0);

  const profitPercent = parseFloat(
    document.getElementById('profitPercent')?.value
  ) || 0;

  const profitValue = subtotal * (profitPercent / 100);
  const totalFinal = subtotal + profitValue;

  const subtotalEl = document.getElementById('productsSubtotal');
  const profitEl = document.getElementById('productsProfitValue');
  const totalEl = document.getElementById('productsTotalWithProfit');

  if (subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
  if (profitEl) profitEl.textContent = `R$ ${profitValue.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `R$ ${totalFinal.toFixed(2)}`;
}

// ===========================
// LISTENER LUCRO (%)
// ===========================
document.addEventListener('input', function (e) {
  if (e.target && e.target.id === 'profitPercent') {
    updateOSProductTotals();
  }
});

// ===========================
// FINALIZAR OS - BAIXA NO ESTOQUE
// ===========================
async function finalizarOS(osId) {
  if (!osId) {
    showToast('ID da OS não fornecido', 'error');
    return;
  }

  const os = allOrders.find(o => o.id === osId);
  if (!os) {
    showToast('Ordem de serviço não encontrada', 'error');
    return;
  }

  // Verifica se já está finalizada
  const statusText = (os.status || os.estado || '').toString().toLowerCase();
  if (/conclu|finaliz/i.test(statusText)) {
    showToast('Esta OS já está finalizada', 'info');
    return;
  }

  const produtosDaOS = Array.isArray(os.products) ? os.products : [];

  if (produtosDaOS.length === 0) {
    showToast('Esta OS não possui produtos cadastrados', 'info');
  }

  try {
    // Apenas atualizar status - estoque já foi descontado ao adicionar os produtos
    await firebase.database().ref('orders/' + osId).update({
      status: 'Finalizada',
      dataFinalizacao: new Date().toISOString()
    });

    showToast('OS finalizada com sucesso!', 'success');

    if (typeof loadOrders === 'function') {
      loadOrders();
    }

  } catch (err) {
    console.error('Erro ao finalizar OS:', err);
    showToast('Erro ao finalizar OS', 'error');
  }
}

// ===========================
// UTILS
// ===========================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');

  const colors = {
    success: '#10b981',
    error: '#B32117',
    info: '#D4C29A'
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    info: 'fa-info-circle'
  };

  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1a1a1a;
    border: 2px solid ${colors[type]};
    color: #F5F5F5;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
    animation: slideInToast 0.3s ease-out;
  `;

  toast.innerHTML = `
    <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 20px;"></i>
    <span style="font-weight: 500; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutToast 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===========================
// VIEW MODE (LIST/CARD)
// ===========================
function toggleView(viewMode) {
  const buttons = document.querySelectorAll('.view-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.view === viewMode) {
      btn.classList.add('active');
    }
  });

  const ordersList = document.getElementById('ordersList');
  if (ordersList) {
    if (viewMode === 'list') {
      ordersList.classList.add('list-view');
    } else {
      ordersList.classList.remove('list-view');
    }
  }

  localStorage.setItem('ordersViewMode', viewMode);
}

// ===========================
// EXTINTORES
// ===========================
document.getElementById('addExtintorBtn')?.addEventListener('click', () => {
  const section = document.getElementById('extintoresSection');
  const items = section.querySelectorAll('.extintor-item');
  const lastIndex = items.length - 1;
  const newIndex = lastIndex + 1;

  const clone = items[0].cloneNode(true);
  clone.dataset.index = newIndex;

  clone.querySelectorAll('input, select').forEach(field => {
    const baseName = field.name.replace(/_\d+$/, '');
    field.name = `${baseName}_${newIndex}`;
    field.value = '';
  });

  section.insertBefore(clone, document.getElementById('addExtintorBtn'));
});

// ===========================
// INICIALIZAÇÃO
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  const savedView = localStorage.getItem('ordersViewMode') || 'card';
  toggleView(savedView);
});
// ========================================
