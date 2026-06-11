document.querySelectorAll('.nav-item-mobile').forEach(item => {
  item.addEventListener('click', () => {
    const section = item.dataset.section;
    navigateToSection(section);

    document.querySelectorAll('.nav-item-mobile').forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
  });
});

// Navigation - Desktop
document.querySelectorAll('.nav-item-desktop').forEach(item => {
  item.addEventListener('click', () => {
    const section = item.dataset.section;
    navigateToSection(section);

    document.querySelectorAll('.nav-item-desktop').forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
  });
});

function navigateToSection(section) {

  document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));

  const el = document.getElementById(section + 'Section');
  if (el) {
    el.classList.add('active');
  }

  if (section === 'overview') loadDashboard();
  else if (section === 'companies') loadCompanies();
  else if (section === 'inspections') loadInspections();
  else if (section === 'orders') loadOrders();
  else if (section === 'calendar') initCalendar();
  else if (section === 'config') loadConfig();
}


// Load Dashboard
