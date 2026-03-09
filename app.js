// ====== CONFIG ======
const useKeyAuthClient = false; // set true if you have client API credentials
const appName = "3asba";
const ownerId = "88nJMAptR8";
const appSecret = "d816063cfd12a98a960c2d1596da2b9d84862330d2092ba1857d4357d2577844";

// ====== UTILITIES ======
function qs(id) { return document.getElementById(id); }
function saveLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function loadLocal(key, fallback) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : fallback;
}

// ====== INITIAL STATE ======
const profile = loadLocal('profile', {
  username: 'blanco',
  email: 'abdouthegoat06@gmail.com',
  hwid: 'Not Set',
  status: 'Active',
  referral: 'REF-' + Math.random().toString(36).slice(2,9).toUpperCase()
});

let licenses = loadLocal('licenses', []);
let newsItems = loadLocal('news', [{ title: 'Welcome', date: new Date().toISOString().split('T')[0], author: 'system', text: 'No news yet.' }]);

// ====== TAB SWITCHING ======
function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.style.display = 'none');
  const el = qs(tabId);
  if (el) el.style.display = 'block';
  if (tabId === 'news') loadNews();
  if (tabId === 'products') renderProducts();
  if (tabId === 'license') renderMyLicenses();
}
showTab('user');

// ====== PROFILE HANDLING ======
function renderProfile() {
  qs('usernameDisplay').textContent = profile.username || '—';
  qs('emailDisplay').textContent = profile.email || '—';
  qs('hwidDisplay').textContent = profile.hwid || 'Not Set';
  qs('statusDisplay').textContent = profile.status || 'Inactive';
  qs('referralCode').textContent = profile.referral || '—';
  qs('inputUsername').value = profile.username || '';
  qs('inputEmail').value = profile.email || '';
}
renderProfile();

qs('saveProfileBtn').addEventListener('click', () => {
  const u = qs('inputUsername').value.trim();
  const e = qs('inputEmail').value.trim();
  if (u) profile.username = u;
  if (e) profile.email = e;
  saveLocal('profile', profile);
  renderProfile();
  alert('Profile saved.');
});

qs('resetHwidBtn').addEventListener('click', () => {
  profile.hwid = 'Not Set';
  saveLocal('profile', profile);
  renderProfile();
});

qs('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('profile');
  localStorage.removeItem('licenses');
  alert('Logged out (local). Refresh to reset.');
});

// ====== PRODUCTS RENDERING (PRO badge + features) ======
function renderProducts() {
  const container = qs('productsContainer');
  container.innerHTML = '';

  if (licenses.length === 0) {
    container.innerHTML = '<div class="card">No active products. Redeem a license in the Use Key tab.</div>';
    return;
  }

  // Group by product
  const byProduct = {};
  licenses.forEach(l => {
    const p = l.product || 'Unknown';
    if (!byProduct[p]) byProduct[p] = [];
    byProduct[p].push(l);
  });

  Object.keys(byProduct).forEach(productName => {
    const items = byProduct[productName];
    const isPro = items.some(i => (i.tier || '').toUpperCase() === 'PRO');
    const card = document.createElement('div');
    card.className = 'card';
    card.style.border = isPro ? '2px solid #ffd700' : '';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0">${productName}</h3>
        ${isPro ? '<span style="background:#ffd700;color:#000;padding:6px 10px;border-radius:6px;font-weight:700">PRO</span>' : '<span style="color:#0f0">FREE</span>'}
      </div>
      <p><strong>Licenses:</strong> ${items.length}</p>
      <div id="prod-${productName.replace(/\s+/g,'_')}"></div>
    `;
    container.appendChild(card);

    const listDiv = card.querySelector(`#prod-${productName.replace(/\s+/g,'_')}`);
    items.forEach(i => {
      const row = document.createElement('div');
      row.style.margin = '8px 0';
      // show PRO features if tier is PRO
      const featuresHtml = (i.tier && i.tier.toUpperCase() === 'PRO') ? `
        <div style="margin-top:6px;padding:8px;background:linear-gradient(90deg,#111,#222);border-radius:6px;">
          <strong style="color:#ffd700">PRO Features</strong>
          <ul style="margin:6px 0 0 18px;color:#ddd">
            ${(i.features || ['Aimbot (fast)','Wallhack (through walls)','Custom UI']).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>` : '';

      row.innerHTML = `
        <div><strong>Key:</strong> ${i.key}</div>
        <div><strong>Status:</strong> ${i.status}</div>
        <div><strong>Activated:</strong> ${i.created || '—'}</div>
        ${featuresHtml}
        <div style="margin-top:6px;">
          <button onclick="downloadProduct('${productName}')">Download</button>
          ${i.ui ? '<button onclick="openUI(\''+i.ui+'\')">UI</button>' : ''}
        </div>
        <hr/>
      `;
      listDiv.appendChild(row);
    });
  });
}

function downloadProduct(productName) {
  alert('Download for ' + productName + ' would start (implement link).');
}
function openUI(uiLink) { window.open(uiLink, '_blank'); }

// ====== LICENSE ACTIVATION (stores tier + features exactly) ======
qs('licenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = qs('licenseKey').value.trim();
  const product = qs('licenseProduct').value.trim() || 'Unknown';
  let tier = qs('licenseTier').value || 'FREE';
  const user = profile.username || 'guest';

  if (!key) {
    qs('licenseStatus').textContent = 'Please enter a license key.';
    return;
  }

  qs('licenseStatus').textContent = 'Processing...';

  // Auto-detect PRO if key contains 'PRO' (optional convenience)
  if (/PRO/i.test(key)) tier = 'PRO';

  // If KeyAuth client API is enabled, call it and use returned data
  if (useKeyAuthClient && appName && ownerId && appSecret) {
    try {
      const url = `https://keyauth.win/api/1.3/?type=activate&name=${encodeURIComponent(appName)}&ownerid=${encodeURIComponent(ownerId)}&secret=${encodeURIComponent(appSecret)}&key=${encodeURIComponent(key)}&user=${encodeURIComponent(user)}`;
      const res = await fetch(url);
      const data = await res.json();

      const licenseObj = {
        key,
        product,
        tier,
        status: data.success ? 'ACTIVE' : 'INVALID',
        created: new Date().toISOString().split('T')[0],
        author: user,
        raw: data,
        features: data.success && data.item && data.item.features ? data.item.features : (tier === 'PRO' ? ['Aimbot (fast)','Wallhack (through walls)','Custom UI'] : [])
      };
      licenses.unshift(licenseObj);
      saveLocal('licenses', licenses);
      qs('licenseStatus').textContent = data.success ? '✅ License activated: ' + (data.item || '') : '❌ ' + (data.message || 'Activation failed');
      renderMyLicenses();
      renderProducts();
    } catch (err) {
      qs('licenseStatus').textContent = '⚠️ Activation error.';
    }
    return;
  }

  // FALLBACK: local activation (no KeyAuth)
  const licenseObj = {
    key,
    product,
    tier,
    status: 'ACTIVE',
    created: new Date().toISOString().split('T')[0],
    author: user,
    note: 'Activated locally (no KeyAuth)',
    features: tier === 'PRO' ? ['Aimbot (fast)','Wallhack (through walls)','Custom UI'] : ['Basic features']
  };
  licenses.unshift(licenseObj);
  saveLocal('licenses', licenses);

  qs('licenseStatus').innerHTML = `✅ License stored locally for <strong>${product}</strong> (${tier}).`;
  renderMyLicenses();
  renderProducts();
});

// ====== RENDER MY LICENSES (shows tier + features) ======
function renderMyLicenses() {
  const container = qs('myLicenses');
  container.innerHTML = '';
  if (licenses.length === 0) {
    container.innerHTML = '<div>No licenses yet.</div>';
    return;
  }
  licenses.forEach(l => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><strong>${l.product || '—'}</strong></div>
        <div>${(l.tier === 'PRO') ? '<span style="background:#ffd700;color:#000;padding:6px 10px;border-radius:6px;font-weight:700">PRO</span>' : '<span style="color:#0f0">FREE</span>'}</div>
      </div>
      <div><strong>Key</strong>: ${l.key}</div>
      <div><strong>Status</strong>: ${l.status || '—'}</div>
      <div><strong>Created</strong>: ${l.created || '—'}</div>
      <div><strong>Author/User</strong>: ${l.author || profile.username || '—'}</div>
      <div style="margin-top:8px;">
        <button onclick="revokeLicense('${l.key}')">Revoke (local)</button>
      </div>
      ${l.features ? `<div style="margin-top:8px;"><strong>Features</strong><ul style="margin:6px 0 0 18px;color:#ddd">${l.features.map(f => `<li>${f}</li>`).join('')}</ul></div>` : ''}
      ${l.raw ? `<pre style="margin-top:8px; white-space:pre-wrap; max-height:120px; overflow:auto;">${JSON.stringify(l.raw, null, 2)}</pre>` : ''}
    `;
    container.appendChild(div);
  });
}

function revokeLicense(key) {
  if (!confirm('Revoke license locally?')) return;
  licenses = licenses.filter(l => l.key !== key);
  saveLocal('licenses', licenses);
  renderMyLicenses();
  renderProducts();
}

// ====== NEWS LOADING ======
async function loadNews() {
  const container = qs('newsContainer');
  container.innerHTML = 'Loading news...';
  try {
    const res = await fetch('news.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      newsItems = data;
      saveLocal('news', newsItems);
    } else {
      newsItems = loadLocal('news', newsItems);
    }
  } catch (err) {
    newsItems = loadLocal('news', newsItems);
  }

  container.innerHTML = '';
  newsItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p><em>${item.date} — ${item.author}</em></p>
      <p>${item.text}</p>
    `;
    container.appendChild(card);
  });
}

// ====== SOCIAL & REFERRAL ======
qs('discordLink').href = '#';
qs('twitterLink').href = '#';
qs('copyReferral').addEventListener('click', () => {
  navigator.clipboard.writeText(profile.referral || '').then(() => alert('Referral copied.'));
});

// ====== INITIAL RENDER ======
renderMyLicenses();
renderProducts();
