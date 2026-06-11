// VARIÁVEIS GLOBAIS
// ===========================
let products = [];
let osSelectedProducts = [];
let currentPage = 1;
let editingProductId = null;

// ===========================
// CARREGAR PRODUTOS DO FIREBASE
// ===========================
function loadProducts() {
  firebase.database().ref('products').on('value', snapshot => {
    products = [];

    snapshot.forEach(child => {
      products.push(child.val());
    });

    // ORDENAR POR NOME (A-Z)
    products.sort((a, b) => a.name.localeCompare(b.name));

    renderProducts();
    populateOSProductSelect();
  });
}

// ===========================
// RENDERIZAR LISTA DE PRODUTOS COM ESTOQUE
// ===========================
// ============================================
// VARIÁVEIS GLOBAIS PARA FILTROS E VISUALIZAÇÃO
// ============================================

let productViewMode = 'cards';
let productSearchQuery = '';
let filtersVisible = false;
let productFilters = {
  priceMin: '',
  priceMax: '',
  quantityMin: '',
  quantityMax: '',
  status: 'all'
};

// ============================================
// FUNÇÃO PARA ALTERNAR VISIBILIDADE DOS FILTROS
// ============================================

function toggleFiltersVisibility() {
  filtersVisible = !filtersVisible;
  const filtersRow = document.getElementById('filtersRow');
  const toggleIcon = document.getElementById('toggleFiltersIcon');

  if (filtersRow && toggleIcon) {
    if (filtersVisible) {
      filtersRow.style.display = 'grid';
      toggleIcon.className = 'fas fa-chevron-up';
    } else {
      filtersRow.style.display = 'none';
      toggleIcon.className = 'fas fa-chevron-down';
    }
  }
}

// ============================================
// FUNÇÃO PARA APLICAR BUSCA
// ============================================

function applyProductSearch() {
  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) {
    productSearchQuery = searchInput.value.toLowerCase().trim();
  }
  currentPage = 1;
  renderProducts();
}

// ============================================
// FUNÇÃO PARA APLICAR FILTROS
// ============================================

function applyProductFilters() {
  const priceMinInput = document.getElementById('filterPriceMin');
  const priceMaxInput = document.getElementById('filterPriceMax');
  const qtyMinInput = document.getElementById('filterQtyMin');
  const qtyMaxInput = document.getElementById('filterQtyMax');
  const statusSelect = document.getElementById('filterStatus');

  productFilters.priceMin = priceMinInput ? priceMinInput.value : '';
  productFilters.priceMax = priceMaxInput ? priceMaxInput.value : '';
  productFilters.quantityMin = qtyMinInput ? qtyMinInput.value : '';
  productFilters.quantityMax = qtyMaxInput ? qtyMaxInput.value : '';
  productFilters.status = statusSelect ? statusSelect.value : 'all';

  currentPage = 1;
  renderProducts();
  showToast('Filtros aplicados!', 'success');
}

// ============================================
// FUNÇÃO PARA LIMPAR FILTROS
// ============================================

function clearProductFilters() {
  productSearchQuery = '';
  productFilters = {
    priceMin: '',
    priceMax: '',
    quantityMin: '',
    quantityMax: '',
    status: 'all'
  };

  const searchInput = document.getElementById('productSearchInput');
  const priceMinInput = document.getElementById('filterPriceMin');
  const priceMaxInput = document.getElementById('filterPriceMax');
  const qtyMinInput = document.getElementById('filterQtyMin');
  const qtyMaxInput = document.getElementById('filterQtyMax');
  const statusSelect = document.getElementById('filterStatus');

  if (searchInput) searchInput.value = '';
  if (priceMinInput) priceMinInput.value = '';
  if (priceMaxInput) priceMaxInput.value = '';
  if (qtyMinInput) qtyMinInput.value = '';
  if (qtyMaxInput) qtyMaxInput.value = '';
  if (statusSelect) statusSelect.value = 'all';

  currentPage = 1;
  renderProducts();
  showToast('Filtros limpos!', 'success');
}

// ============================================
// FUNÇÃO PARA FILTRAR PRODUTOS
// ============================================

function filterProductsClient(productsArray) {
  return productsArray.filter(prod => {
    if (productSearchQuery) {
      const nameMatch = prod.name.toLowerCase().includes(productSearchQuery);
      const descMatch = (prod.description || '').toLowerCase().includes(productSearchQuery);
      if (!nameMatch && !descMatch) return false;
    }

    if (productFilters.priceMin !== '') {
      const minPrice = parseFloat(productFilters.priceMin);
      if (prod.price < minPrice) return false;
    }

    if (productFilters.priceMax !== '') {
      const maxPrice = parseFloat(productFilters.priceMax);
      if (prod.price > maxPrice) return false;
    }

    if (productFilters.quantityMin !== '') {
      const minQty = parseInt(productFilters.quantityMin);
      if ((prod.quantity || 0) < minQty) return false;
    }

    if (productFilters.quantityMax !== '') {
      const maxQty = parseInt(productFilters.quantityMax);
      if ((prod.quantity || 0) > maxQty) return false;
    }

    if (productFilters.status !== 'all') {
      const qty = prod.quantity || 0;
      if (productFilters.status === 'out-of-stock' && qty !== 0) return false;
      if (productFilters.status === 'low-stock' && (qty === 0 || qty > 5)) return false;
      if (productFilters.status === 'in-stock' && qty <= 5) return false;
    }

    return true;
  });
}

// ============================================
// FUNÇÃO PARA CRIAR BARRA DE FERRAMENTAS
// ============================================

function createProductToolbar() {
  const toolbar = document.createElement('div');
  toolbar.style.cssText = `
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `;

  const topRow = document.createElement('div');
  topRow.style.cssText = `
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  `;

  // BARRA DE BUSCA COM BOTÃO
  const searchContainer = document.createElement('div');
  searchContainer.style.cssText = `
    flex: 1;
    min-width: 250px;
    display: flex;
    gap: 8px;
  `;

  const searchInputWrapper = document.createElement('div');
  searchInputWrapper.style.cssText = `
    flex: 1;
    position: relative;
  `;
  searchInputWrapper.innerHTML = `
    <input 
      type="text" 
      id="productSearchInput" 
      placeholder="Buscar por nome ou descrição..."
      style="
        width: 100%;
        padding: 12px 40px 12px 45px;
        background: #0d0d0d;
        border: 2px solid #333;
        border-radius: 10px;
        color: #fff;
        font-size: 14px;
        transition: all 0.3s ease;
        box-sizing: border-box;
      "
      onfocus="this.style.borderColor='#10b981'; this.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
      onblur="this.style.borderColor='#333'; this.style.boxShadow='none'"
    />
    <i class="fas fa-search" style="
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #10b981;
      font-size: 14px;
    "></i>
  `;

  // BOTÃO DE BUSCAR
  const searchButton = document.createElement('button');
  searchButton.innerHTML = '<i class="fas fa-search"></i><span style="margin-left: 8px;">Buscar</span>';
  searchButton.style.cssText = `
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    border-radius: 10px;
    padding: 12px 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    white-space: nowrap;
  `;
  searchButton.onmouseover = function () {
    this.style.background = 'rgba(16, 185, 129, 0.25)';
  };
  searchButton.onmouseout = function () {
    this.style.background = 'rgba(16, 185, 129, 0.15)';
  };
  searchButton.onclick = applyProductSearch;

  searchContainer.appendChild(searchInputWrapper);
  searchContainer.appendChild(searchButton);

  // Adicionar Enter para buscar
  setTimeout(() => {
    const input = document.getElementById('productSearchInput');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyProductSearch();
        }
      });
    }
  }, 100);

  const toggleFiltersBtn = document.createElement('button');
  toggleFiltersBtn.innerHTML = '<i id="toggleFiltersIcon" class="fas fa-chevron-down"></i><span style="margin-left: 8px;">Filtros</span>';
  toggleFiltersBtn.style.cssText = `
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    border-radius: 10px;
    padding: 12px 18px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    white-space: nowrap;
  `;
  toggleFiltersBtn.onmouseover = function () {
    this.style.background = 'rgba(59, 130, 246, 0.2)';
  };
  toggleFiltersBtn.onmouseout = function () {
    this.style.background = 'rgba(59, 130, 246, 0.1)';
  };
  toggleFiltersBtn.onclick = toggleFiltersVisibility;

  const viewButtonsContainer = document.createElement('div');
  viewButtonsContainer.style.cssText = `
    display: flex;
    gap: 8px;
    background: #0d0d0d;
    padding: 4px;
    border-radius: 10px;
    border: 1px solid #333;
  `;

  const cardsBtn = document.createElement('button');
  cardsBtn.id = 'viewCardsBtn';
  cardsBtn.innerHTML = '<i class="fas fa-th-large"></i><span style="margin-left: 6px;">Cards</span>';
  cardsBtn.style.cssText = `
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid #10b981;
    color: #10b981;
    border-radius: 8px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
  `;
  cardsBtn.onclick = () => toggleProductView('cards');

  const listBtn = document.createElement('button');
  listBtn.id = 'viewListBtn';
  listBtn.innerHTML = '<i class="fas fa-list"></i><span style="margin-left: 6px;">Lista</span>';
  listBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    color: #999;
    border-radius: 8px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
  `;
  listBtn.onclick = () => toggleProductView('list');

  viewButtonsContainer.appendChild(cardsBtn);
  viewButtonsContainer.appendChild(listBtn);

  topRow.appendChild(searchContainer);
  topRow.appendChild(toggleFiltersBtn);
  topRow.appendChild(viewButtonsContainer);

  const filtersRow = document.createElement('div');
  filtersRow.id = 'filtersRow';
  filtersRow.style.cssText = `
    display: none;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    align-items: end;
    padding-top: 8px;
    border-top: 1px solid #2a2a2a;
  `;

  const priceMinContainer = document.createElement('div');
  priceMinContainer.innerHTML = `
    <label style="color: #999; font-size: 12px; display: block; margin-bottom: 6px; font-weight: 600;">
      <i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>Preço Mínimo
    </label>
    <input 
      type="number" 
      id="filterPriceMin" 
      placeholder="0.00"
      step="0.01"
      style="
        width: 100%;
        padding: 10px 12px;
        background: #0d0d0d;
        border: 1px solid #333;
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        box-sizing: border-box;
      "
    />
  `;

  const priceMaxContainer = document.createElement('div');
  priceMaxContainer.innerHTML = `
    <label style="color: #999; font-size: 12px; display: block; margin-bottom: 6px; font-weight: 600;">
      <i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>Preço Máximo
    </label>
    <input 
      type="number" 
      id="filterPriceMax" 
      placeholder="999.99"
      step="0.01"
      style="
        width: 100%;
        padding: 10px 12px;
        background: #0d0d0d;
        border: 1px solid #333;
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        box-sizing: border-box;
      "
    />
  `;

  const qtyMinContainer = document.createElement('div');
  qtyMinContainer.innerHTML = `
    <label style="color: #999; font-size: 12px; display: block; margin-bottom: 6px; font-weight: 600;">
      <i class="fas fa-boxes" style="margin-right: 4px;"></i>Qtd Mínima
    </label>
    <input 
      type="number" 
      id="filterQtyMin" 
      placeholder="0"
      style="
        width: 100%;
        padding: 10px 12px;
        background: #0d0d0d;
        border: 1px solid #333;
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        box-sizing: border-box;
      "
    />
  `;

  const qtyMaxContainer = document.createElement('div');
  qtyMaxContainer.innerHTML = `
    <label style="color: #999; font-size: 12px; display: block; margin-bottom: 6px; font-weight: 600;">
      <i class="fas fa-boxes" style="margin-right: 4px;"></i>Qtd Máxima
    </label>
    <input 
      type="number" 
      id="filterQtyMax" 
      placeholder="999"
      style="
        width: 100%;
        padding: 10px 12px;
        background: #0d0d0d;
        border: 1px solid #333;
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        box-sizing: border-box;
      "
    />
  `;

  const statusContainer = document.createElement('div');
  statusContainer.innerHTML = `
    <label style="color: #999; font-size: 12px; display: block; margin-bottom: 6px; font-weight: 600;">
      <i class="fas fa-filter" style="margin-right: 4px;"></i>Status
    </label>
    <select 
      id="filterStatus"
      style="
        width: 100%;
        padding: 10px 12px;
        background: #0d0d0d;
        border: 1px solid #333;
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
        box-sizing: border-box;
      "
    >
      <option value="all">Todos</option>
      <option value="in-stock">Em Estoque</option>
      <option value="low-stock">Estoque Baixo</option>
      <option value="out-of-stock">Sem Estoque</option>
    </select>
  `;

  const filterActionsContainer = document.createElement('div');
  filterActionsContainer.style.cssText = `
    display: flex;
    gap: 8px;
    align-items: end;
  `;

  const applyFiltersBtn = document.createElement('button');
  applyFiltersBtn.innerHTML = '<i class="fas fa-check"></i>';
  applyFiltersBtn.title = 'Aplicar filtros';
  applyFiltersBtn.style.cssText = `
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    border-radius: 8px;
    padding: 10px 14px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  `;
  applyFiltersBtn.onmouseover = function () {
    this.style.background = 'rgba(16, 185, 129, 0.25)';
  };
  applyFiltersBtn.onmouseout = function () {
    this.style.background = 'rgba(16, 185, 129, 0.15)';
  };
  applyFiltersBtn.onclick = applyProductFilters;

  const clearFiltersBtn = document.createElement('button');
  clearFiltersBtn.innerHTML = '<i class="fas fa-times"></i>';
  clearFiltersBtn.title = 'Limpar filtros';
  clearFiltersBtn.style.cssText = `
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    border-radius: 8px;
    padding: 10px 14px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  `;
  clearFiltersBtn.onmouseover = function () {
    this.style.background = 'rgba(239, 68, 68, 0.2)';
  };
  clearFiltersBtn.onmouseout = function () {
    this.style.background = 'rgba(239, 68, 68, 0.1)';
  };
  clearFiltersBtn.onclick = clearProductFilters;

  filterActionsContainer.appendChild(applyFiltersBtn);
  filterActionsContainer.appendChild(clearFiltersBtn);

  filtersRow.appendChild(priceMinContainer);
  filtersRow.appendChild(priceMaxContainer);
  filtersRow.appendChild(qtyMinContainer);
  filtersRow.appendChild(qtyMaxContainer);
  filtersRow.appendChild(statusContainer);
  filtersRow.appendChild(filterActionsContainer);

  toolbar.appendChild(topRow);
  toolbar.appendChild(filtersRow);

  setTimeout(() => {
    updateViewButtons();
  }, 0);

  return toolbar;
}

// ============================================
