function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'leads') || (i === 1 && tab === 'ads'));
  });
  document.getElementById('tab-leads').classList.toggle('active', tab === 'leads');
  document.getElementById('tab-ads').classList.toggle('active', tab === 'ads');

  if (tab === 'ads' && typeof AdsManager !== 'undefined') {
    AdsManager.init();
  }
}
