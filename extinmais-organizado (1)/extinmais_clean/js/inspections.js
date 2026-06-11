document.querySelectorAll('.inspection-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const section = tab.dataset.section;

    document.querySelectorAll('.inspection-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    document.querySelectorAll('.inspection-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('section-' + section).classList.add('active');
  });
});

// Conditional Sections
document.getElementById('hasBombas').addEventListener('change', (e) => {
  document.getElementById('bombasSection').classList.toggle('visible', e.target.checked);
});

document.getElementById('hasBombaJockey').addEventListener('change', (e) => {
  document.getElementById('bombaJockeySection').classList.toggle('visible', e.target.checked);
});

document.getElementById('hasHidrantes').addEventListener('change', (e) => {
  document.getElementById('hidrantesSection').classList.toggle('visible', e.target.checked);
});

document.getElementById('hasAlarme').addEventListener('change', (e) => {
  document.getElementById('alarmeSection').classList.toggle('visible', e.target.checked);
});

document.getElementById('hasExtintores').addEventListener('change', (e) => {
  document.getElementById('extintoresSection').classList.toggle('visible', e.target.checked);
});

document.getElementById('hasSinalizacao').addEventListener('change', (e) => {
  document.getElementById('sinalizacaoSection').classList.toggle('visible', e.target.checked);
});

let sinalizacoes = [];

const sinalizacaoLabels = {
  'sinal_saida': 'Saída',
  'sinal_cam_direita': 'Caminhamento → Direita',
  'sinal_cam_esquerda': 'Caminhamento → Esquerda',
  'sinal_esc_up_direita': 'Escada ↑ Direita',
  'sinal_esc_up_esquerda': 'Escada ↑ Esquerda',
  'sinal_esc_down_direita': 'Escada ↓ Direita',
  'sinal_esc_down_esquerda': 'Escada ↓ Esquerda',
  'sinal_hidrante': 'Hidrante',
  'sinal_acion_bomba': 'Acionamento de Bomba',
  'sinal_acion_alarme': 'Acionamento de Alarme',
  'sinal_central_alarme': 'Central de Alarme',
  'sinal_bomba_incendio': 'Bomba de Incêndio',
  'placa_lotacao': 'Placa de Lotação (Nº Pessoas)',
  'placa_m1': 'Placa M1',
  'placa_extintor': 'Extintor',
  'placa_ilum_emerg': 'Iluminação de Emergência',
  'placa_sinal_emerg': 'Sinalização de Emergência',
  'placa_alarme': 'Alarme de Incêndio',
  'placa_hidrante_espec': 'Hidrante (Específico)'
};

function addSinalizacao() {
  const selectValue = document.getElementById("novaSinalizacao").value.trim();
  const customValue = document.getElementById("sinalizacaoCustom").value.trim();
  const qtd = document.getElementById("qtdSinalizacao").value;

  const valor = customValue || selectValue;

  if (!valor) {
    alert("Selecione uma sinalização ou digite uma personalizada!");
    return;
  }

  const nome = sinalizacaoLabels[valor] || valor;

  const existe = sinalizacoes.findIndex(s => s.valor === valor);
  if (existe >= 0) {
    sinalizacoes[existe].qtd += parseInt(qtd);
  } else {
    sinalizacoes.push({ valor, nome, qtd: parseInt(qtd) });
  }

  renderLista();
  atualizarInput();

  document.getElementById("novaSinalizacao").value = "";
  document.getElementById("sinalizacaoCustom").value = "";
  document.getElementById("qtdSinalizacao").value = 1;
}

function removerSinalizacao(index) {
  sinalizacoes.splice(index, 1);
  renderLista();
  atualizarInput();
}

function renderLista() {
  const lista = document.getElementById("listaSinalizacoes");
  lista.innerHTML = "";

  sinalizacoes.forEach((item, index) => {
    lista.innerHTML += `
      <li class="sinalizacao-item">
        <span class="sinalizacao-text">
          ${item.nome} (Qtd: ${item.qtd})
        </span>
        <button type="button"
          onclick="removerSinalizacao(${index})"
          class="btn-remover">
          <i class="fas fa-trash"></i>
        </button>
      </li>
    `;
  });
}

function atualizarInput() {
  document.getElementById("sinalizacoesInput").value = JSON.stringify(sinalizacoes);
}

function carregarSinalizacoes(data) {
  if (data && data.sinalizacoes) {
    try {
      sinalizacoes = JSON.parse(data.sinalizacoes);
      renderLista();
    } catch (e) {
      console.error("Erro ao carregar sinalizações:", e);
    }
  }
}

document.getElementById("novaSinalizacao").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    addSinalizacao();
  }
});

const checkbox = document.getElementById('hasSinalizacao');
const section = document.getElementById('sinalizacaoSection');

if (checkbox) {
  checkbox.addEventListener('change', (e) => {
    section.classList.toggle('visible', e.target.checked);

    if (!e.target.checked) {
      sinalizacoes = [];
      renderLista();
      atualizarInput();
    }
  });
}



// ============================================ // PDF GENERATORS - Um para cada tipo de inspeção // ============================================ // 1. PDF COMPLETO function generateCompletePDF(data) { const isMobile = window.innerWidth <= 768; let html = ''; if (isMobile) {
