// Minimal, clean logic: login-only-first, then dashboard
(function(){
  // Elements
  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const usernameInput = document.getElementById('loginUsername');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');

  const usernameDisplay = document.getElementById('usernameDisplay');
  const emailDisplay = document.getElementById('emailDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  const sidebarButtons = document.querySelectorAll('.sidebar nav button');
  const tabs = document.querySelectorAll('.tab');

  const licenseForm = document.getElementById('licenseForm');
  const licenseStatus = document.getElementById('licenseStatus');
  const myLicenses = document.getElementById('myLicenses');
  const productsContainer = document.getElementById('productsContainer');
  const referralCodeEl = document.getElementById('referralCode');
  const copyReferral = document.getElementById('copyReferral');

  // State
  let profile = load('profile', null);
  let licenses = load('licenses', []);

  // Helpers
  function load(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }catch(e){ return fallback } }
  function save(key, val){ localStorage.setItem(key, JSON.stringify(val)) }

  // Centered login: if profile exists, auto-show dashboard
  if(profile && profile.username){
    showDashboard(profile);
  } else {
    showLogin();
  }

  // Login handler
  loginBtn.addEventListener('click', () => {
    loginError.textContent = '';
    const u = usernameInput.value.trim();
    const e = emailInput.value.trim();
    const p = passwordInput.value.trim();
    if(!u || !e || !p){
      loginError.textContent = 'Fill all fields';
      return;
    }
    // Minimal client-side "auth": store profile locally
    profile = { username: u, email: e, status: 'Active', referral: 'REF-' + Math.random().toString(36).slice(2,9).toUpperCase() };
    save('profile', profile);
    showDashboard(profile);
  });

  // Show dashboard
  function showDashboard(profileObj){
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    usernameDisplay.textContent = profileObj.username || '—';
    emailDisplay.textContent = profileObj.email || '—';
    referralCodeEl.textContent = profileObj.referral || '—';
    renderMyLicenses();
    renderProducts();
    // default tab
    openTab('user');
  }

  function showLogin(){
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('profile');
    // keep licenses if you want; remove to reset
    // localStorage.removeItem('licenses');
    profile = null;
    showLogin();
  });

  // Tab switching
  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => openTab(btn.dataset.tab));
  });

  function openTab(id){
    tabs.forEach(t => t.classList.add('hidden'));
    const el = document.getElementById(id);
    if(el) el.classList.remove('hidden');
  }

  // License form (local fallback)
  if(licenseForm){
    licenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const key = document.getElementById('licenseKey').value.trim();
      if(!key){ licenseStatus.textContent = 'Enter a key'; return; }
      const product = 'Unknown';
      const licenseObj = {
        key, product, status: 'ACTIVE', created: new Date().toISOString().split('T')[0], author: (profile && profile.username) || 'guest', tier: /PRO/i.test(key) ? 'PRO' : 'FREE',
        features: /PRO/i.test(key) ? ['Aimbot (fast)','Wallhack','Custom UI'] : ['Basic features']
      };
      licenses.unshift(licenseObj);
      save('licenses', licenses);
      licenseStatus.textContent = `✅ Stored locally (${licenseObj.tier})`;
      renderMyLicenses();
      renderProducts();
      licenseForm.reset();
    });
  }

  // Render functions
  function renderMyLicenses(){
    myLicenses.innerHTML = '';
    if(!licenses || licenses.length === 0){ myLicenses.textContent = 'No licenses yet.'; return; }
    licenses.forEach(l => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${l.product}</strong></div>
          <div>${l.tier === 'PRO' ? '<span style="background:#ffd700;color:#000;padding:6px 10px;border-radius:6px;font-weight:700">PRO</span>' : '<span style="color:#0f0">FREE</span>'}</div>
        </div>
        <div><strong>Key</strong>: ${l.key}</div>
        <div><strong>Status</strong>: ${l.status}</div>
        <div><strong>Created</strong>: ${l.created}</div>
        <div style="margin-top:8px;"><strong>Features</strong><ul>${(l.features||[]).map(f=>`<li>${f}</li>`).join('')}</ul></div>
        <div style="margin-top:8px;"><button class="revoke">Revoke</button></div>
      `;
      card.querySelector('.revoke').addEventListener('click', () => {
        if(!confirm('Revoke license locally?')) return;
        licenses = licenses.filter(x => x.key !== l.key);
        save('licenses', licenses);
        renderMyLicenses();
        renderProducts();
      });
      myLicenses.appendChild(card);
    });
  }

  function renderProducts(){
    productsContainer.innerHTML = '';
    if(!licenses || licenses.length === 0){ productsContainer.innerHTML = '<div class="card">No active products. Redeem a license in Use Key.</div>'; return; }
    const byProduct = {};
    licenses.forEach(l => {
      const p = l.product || 'Unknown';
      byProduct[p] = byProduct[p] || [];
      byProduct[p].push(l);
    });
    Object.keys(byProduct).forEach(prod => {
      const items = byProduct[prod];
      const isPro = items.some(i => i.tier === 'PRO');
      const card = document.createElement('div');
      card.className = 'card';
      card.style.border = isPro ? '2px solid #ffd700' : '';
      card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">${prod}</h3>
        ${isPro ? '<span style="background:#ffd700;color:#000;padding:6px 10px;border-radius:6px;font-weight:700">PRO</span>' : '<span style="color:#0f0">FREE</span>'}
      </div><p><strong>Licenses:</strong> ${items.length}</p><div id="list-${prod.replace(/\s+/g,'_')}" style="margin-top:8px"></div>`;
      productsContainer.appendChild(card);
      const listDiv = card.querySelector(`#list-${prod.replace(/\s+/g,'_')}`);
      items.forEach(i => {
        const row = document.createElement('div');
        row.style.margin = '8px 0';
        row.innerHTML = `<div><strong>Key:</strong> ${i.key}</div><div><strong>Status:</strong> ${i.status}</div><div><strong>Activated:</strong> ${i.created}</div>`;
        if(i.tier === 'PRO'){
          const feat = document.createElement('div');
          feat.style.marginTop = '6px';
          feat.innerHTML = `<strong style="color:#ffd700">PRO Features</strong><ul>${(i.features||[]).map(f=>`<li>${f}</li>`).join('')}</ul>`;
          row.appendChild(feat);
        }
        listDiv.appendChild(row);
      });
    });
  }

  // Referral copy
  if(copyReferral){
    copyReferral.addEventListener('click', () => {
      const code = (profile && profile.referral) || '';
      if(!code) return alert('No referral code');
      navigator.clipboard.writeText(code).then(()=> alert('Referral copied.'));
    });
  }

  // Expose for debugging if needed
  window._app = { renderMyLicenses, renderProducts, openTab };

})();
