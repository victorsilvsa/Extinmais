function loadConfig() {
  document.getElementById('profileName').value = currentUser.nome;
  document.getElementById('profileCNPJ').value = currentUser.cnpj;
  document.getElementById('profileUsername').value = currentUser.username;
  loadLogo();
}

// Profile Form
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('profileName').value;
  const cnpj = document.getElementById('profileCNPJ').value;
  await database.ref(`users/${currentUser.id}`).update({ nome });
  await database.ref(`users/${currentUser.id}`).update({ cnpj });

  currentUser.nome = nome;

  const initial = nome.charAt(0).toUpperCase();
  document.getElementById('userAvatarMobile').textContent = initial;
  document.getElementById('userNameMobile').textContent = nome;
  document.getElementById('userAvatarDesktop').textContent = initial;
  document.getElementById('userNameDesktop').textContent = nome;

  showToast('Perfil atualizado com sucesso!');
});

// Password Form
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const currentPassword = formData.get('current_password');
  const newPassword = formData.get('new_password');
  const confirmPassword = formData.get('confirm_password');

  if (currentPassword !== currentUser.password) {
    showToast('Senha atual incorreta', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('As senhas não coincidem', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showToast('A senha deve ter no mínimo 6 caracteres', 'error');
    return;
  }

  await database.ref(`users/${currentUser.id}`).update({ password: newPassword });

  currentUser.password = newPassword;

  showToast('Senha alterada com sucesso!');
  e.target.reset();
});
/* ============================================================
   ARQUIVAR MÊS (Apenas Inspeções e Ordens)
   ============================================================ */
document.getElementById('archiveMonthBtn')?.addEventListener('click', async () => {
  const button = document.getElementById('archiveMonthBtn');
  if (!confirm('Deseja arquivar as inspeções e ordens? Isso limpará os registros atuais após o download do backup.')) return;

  button.disabled = true;
  button.innerHTML = '<span class="loading"></span> Arquivando...';

  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Buscamos apenas o que será arquivado
    const [inspectionsSnap, ordersSnap] = await Promise.all([
      database.ref('inspections').once('value'),
      database.ref('orders').once('value')
    ]);

    const backup = {
      version: '1.3', // Versão atualizada
      type: 'inspections_orders_only',
      exportDate: now.toISOString(),
      month,
      year,
      user: { nome: currentUser?.nome || '', cnpj: currentUser?.cnpj || '' },
      inspections: inspectionsSnap.val() || {},
      orders: ordersSnap.val() || {}
    };

    // Verifica se há algo para arquivar
    if (!inspectionsSnap.exists() && !ordersSnap.exists()) {
      showToast('Não há inspeções ou ordens para arquivar.', 'warning');
      return;
    }

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arquivamento_${year}_${String(month).padStart(2, '0')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // ZERAR APENAS AS TABELAS DE MOVIMENTAÇÃO
    await Promise.all([
      database.ref('inspections').set(null),
      database.ref('orders').set(null)
    ]);

    showToast('Sucesso! Inspeções e Ordens arquivadas e limpas.');

    // Atualiza as listas
    loadDashboard();
    loadInspections();
    if (typeof loadOrders === 'function') loadOrders();

  } catch (err) {
    console.error('Erro ao arquivar:', err);
    showToast('Erro ao criar arquivamento', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-download"></i> Arquivar';
  }
});

/* ============================================================
   RESTAURAR (Apenas Inspeções e Ordens)
   ============================================================ */
document.getElementById('restoreFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!confirm('Deseja restaurar este backup? As inspeções e ordens contidas no arquivo serão adicionadas ao sistema.')) {
    e.target.value = '';
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target.result);

        const updates = {};
        let countInsp = 0;
        let countOrders = 0;

        // 1. Restaurar Inspeções (se houver no arquivo)
        if (backup.inspections) {
          for (let key in backup.inspections) {
            updates[`inspections/${key}`] = backup.inspections[key];
            countInsp++;
          }
        }

        // 2. Restaurar Ordens (se houver no arquivo)
        if (backup.orders) {
          for (let key in backup.orders) {
            updates[`orders/${key}`] = backup.orders[key];
            countOrders++;
          }
        }

        if (countInsp === 0 && countOrders === 0) {
          showToast('Nenhum dado encontrado no arquivo.', 'warning');
          return;
        }

        // Executa a restauração
        await database.ref().update(updates);

        showToast(`Restaurado: ${countInsp} Inspeções e ${countOrders} Ordens.`);

        // Atualizar interface
        loadDashboard();
        loadInspections();
        if (typeof loadOrders === 'function') loadOrders();

      } catch (parseError) {
        console.error('Erro no Parse:', parseError);
        showToast('Arquivo de backup inválido ou corrompido.', 'error');
      }
    };
    reader.readAsText(file);
  } catch (error) {
    showToast('Erro ao restaurar dados', 'error');
  } finally {
    e.target.value = '';
  }
});

// Initialize
