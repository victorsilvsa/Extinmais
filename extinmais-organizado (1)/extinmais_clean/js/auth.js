function loginUser(userData) {
  currentUser = userData;
  localStorage.setItem('currentUserId', userData.id);

  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';

  // Update user info
  const initial = userData.nome.charAt(0).toUpperCase();
  document.getElementById('userAvatarMobile').textContent = initial;
  document.getElementById('userNameMobile').textContent = userData.nome;
  document.getElementById('userRoleMobile').textContent = userData.tipo === 'admin' ? 'Administrador' : 'Técnico';

  document.getElementById('userAvatarDesktop').textContent = initial;
  document.getElementById('userNameDesktop').textContent = userData.nome;
  document.getElementById('userRoleDesktop').textContent = userData.tipo === 'admin' ? 'Administrador' : 'Técnico';

  // Show desktop sidebar on desktop
  if (window.innerWidth >= 1024) {
    document.getElementById('sidebarDesktop').style.display = 'flex';
  }

  loadDashboard();
  loadLogo();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const usersRef = database.ref('users');
  const snapshot = await usersRef.once('value');
  const users = snapshot.val();

  let authenticated = false;
  let userData = null;

  for (let key in users) {
    if (users[key].username === username && users[key].password === password) {
      authenticated = true;
      userData = { id: key, ...users[key] };
      break;
    }
  }

  if (authenticated) {
    loginUser(userData);
    showToast('Login realizado com sucesso!');
  } else {
    showToast('Usuário ou senha incorretos', 'error');
  }
});

// Logout
document.getElementById('logoutBtnMobile').addEventListener('click', logout);
document.getElementById('logoutBtnDesktop').addEventListener('click', logout);

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUserId');

  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginForm').reset();
  showToast('Logout realizado com sucesso!');
}

// Navigation - Mobile
