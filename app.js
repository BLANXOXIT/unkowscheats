// ====== CONFIG ======
// If you have KeyAuth client API credentials and want to use them, set useKeyAuthClient = true
// and fill appName, ownerId, appSecret. If not, the script will use local mock storage.
const useKeyAuthClient = false; // set true if you have client API credentials
const appName = "";    // e.g. "3asba"
const ownerId = "";    // OwnerID from KeyAuth (client API)
const appSecret = "";  // App secret (client API)

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

// licenses array stores objects returned from activation or created locally
let licenses = loadLocal('licenses', [
  // example prefilled license (will show in Products if product matches)
  // { key: 'SAMPLE-KEY-123', product: 'CS2-ESP', status: 'ACTIVE', created: '2026-03-09', author: 'admin' }
]);

// news loaded from news.json (bot updates repo) or fallback
let newsItems = loadLocal('news', [
  { title: 'Welcome', date: new Date().toISOString().split('T')[0], author: 'system', text: 'No news yet.' }
]);

// ====== TAB SWITCHING ======
function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.style.display = 'none');
  const el = qs(tabId);
  if (el) el.style.display = 'block';

  if (tabId === 'news') loadNews();
  if (tabId === 'products') renderProducts();
  if (tabId === 'license') renderMyLicenses();
}

// default open user tab
showTab('user');

// ====== PROFILE HANDLING ======
function renderProfile() {
  qs('usernameDisplay').innerText = profile.username || '—';
  qs('emailDisplay').innerText = profile.email || '—';
  qs('hwidDisplay').innerText = profile.hwid || 'Not Set';
  qs('statusDisplay').innerText = profile.status || 'Inactive';
  qs('referralCode').innerText = profile.referral || '—';

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
  // simple logout: clear profile and licenses from local storage (adjust as needed)
  localStorage.removeItem('profile');
  localStorage.removeItem('licenses');
  alert('Logged out (local). Refresh to reset.');
});

// ====== PRODUCTS RENDERING ======
function renderProducts() {
  const container = qs('productsContainer');
  container.innerHTML = '';
  // Group licenses by product
  const byProduct = {};
  licenses.forEach(l => {
    const p = l.product || 'Unknown';
    if (!byProduct[p]) byProduct[p] = [];
    byProduct[p].push(l);
  });

  // If no licenses, show placeholder
  if (licenses.length === 0) {
    container.innerHTML = '<div class="card">No active products. Redeem a license in the Use Key tab.</div>';
    return;
  }

  Object.keys(byProduct).forEach(productName => {
    const items = byProduct[productName];
    const card = document.createElement('div');
    card.className = 'card';
    const status = items.some(i => i.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE';
    card.innerHTML = `
      <h3>${productName} <small style="color:#0f0">— ${status}</small></h3>
      <p><strong>Licenses:</strong> ${items.length}</p>
      <div id="prod-${productName.replace(/\s+/g,'_')}"></div>
    `;
    container.appendChild(card);

    const listDiv = card.querySelector(`#prod-${productName.replace(/\s+/g,'_')}`);
    items.forEach(i => {
      const row = document.createElement('div');
      row.style.margin = '8px 0';
      row.innerHTML = `
        <div><strong>Key:</strong> ${i.key}</div>
        <div><strong>Status:</strong> ${i.status}</div>
        <div><strong>Activated:</strong> ${i.created || '—'}</div>
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
function openUI(uiLink) {
  window.open(uiLink, '_blank');
}

// ====== LICENSE ACTIVATION ======
qs('licenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = qs('licenseKey').value.trim();
  const product = qs('licenseProduct').value.trim() || 'Unknown';
  const user = profile.username || 'guest';

  if (!key) {
    qs('licenseStatus').innerText = 'Please enter a license key.';
    return;
  }

  qs('licenseStatus').innerText = 'Processing...';

  // If you have KeyAuth client API credentials and enabled, call KeyAuth client endpoint
  if (useKeyAuthClient && appName && ownerId && appSecret) {
    try {
      // Example client API call (adjust to KeyAuth client API docs)
      const url = `https://keyauth.win/api/1.3/?type=activate&name=${encodeURIComponent(appName)}&ownerid=${encodeURIComponent(ownerId)}&secret=${encodeURIComponent(appSecret)}&key=${encodeURIComponent(key)}&user=${encodeURIComponent(user)}`;
      const res = await fetch(url);
      const data = await res.json();

      // Save returned info exactly as KeyAuth responds
      const licenseObj = {
        key,
        product,
        status: data.success ? 'ACTIVE' : 'INVALID',
        created: new Date().toISOString().split('T')[0],
        raw: data
      };
      licenses.unshift(licenseObj);
      saveLocal('licenses', licenses);
      qs('licenseStatus').innerText = data.success ? '✅ License activated: ' + (data.item || '') : '❌ ' + (data.message || 'Activation failed');
      renderMyLicenses();
      renderProducts();
    } catch (err) {
      qs('licenseStatus').innerText = '⚠️ Activation error.';
    }
    return;
  }

  // FALLBACK: local/mock activation (no KeyAuth)
  // This branch stores the user-provided info exactly and marks it ACTIVE
  const licenseObj = {
    key,
    product,
    status: 'ACTIVE',
    created: new Date().toISOString().split('T')[0],
    author: user,
    note: 'Activated locally (no KeyAuth)'
  };
  licenses.unshift(licenseObj);
  saveLocal('licenses', licenses);

  qs('licenseStatus').innerHTML = `✅ License stored locally for <strong>${product}</strong>.`;
  renderMyLicenses();
  renderProducts();
});

// show the list of licenses (exact info user provided + any returned fields)
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
      <div><strong>Key</strong>: ${l.key}</div>
      <div><strong>Product</strong>: ${l.product || '—'}</div>
      <div><strong>Status</strong>: ${l.status || '—'}</div>
      <div><strong>Created</strong>: ${l.created || '—'}</div>
      <div><strong>Author/User</strong>: ${l.author || profile.username || '—'}</div>
      <div style="margin-top:8px;">
        <button onclick="revokeLicense('${l.key}')">Revoke (local)</button>
      </div>
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
    // Try to fetch news.json from repo (bot updates it)
    const res = await fetch('news.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      newsItems = data;
      saveLocal('news', newsItems);
    } else {
      // fallback to local stored news
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
qs('discordLink').href = '#'; // set your real links
qs('twitterLink').href = '#';
qs('copyReferral').addEventListener('click', () => {
  navigator.clipboard.writeText(profile.referral || '').then(() => alert('Referral copied.'));
});

// ====== INITIAL RENDER ======
renderMyLicenses();
renderProducts();
