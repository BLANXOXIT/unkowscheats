document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('loginUsername');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError') || null;
  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const emailDisplay = document.getElementById('emailDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!loginBtn) {
    console.error('loginBtn not found. Check element id in HTML.');
    return;
  }

  loginBtn.addEventListener('click', () => {
    try {
      const u = usernameInput && usernameInput.value.trim();
      const e = emailInput && emailInput.value.trim();
      const p = passwordInput && passwordInput.value.trim();

      if (!u || !e || !p) {
        if (loginError) loginError.textContent = 'Fill all fields';
        else alert('Fill all fields');
        return;
      }

      // Save profile locally
      const profile = { username: u, email: e, status: 'Active' };
      localStorage.setItem('profile', JSON.stringify(profile));

      // Show dashboard
      if (loginScreen) loginScreen.classList.add('hidden');
      if (dashboard) dashboard.classList.remove('hidden');

      if (usernameDisplay) usernameDisplay.textContent = u;
      if (emailDisplay) emailDisplay.textContent = e;

      console.log('Login successful for', u);
    } catch (err) {
      console.error('Login handler error', err);
      if (loginError) loginError.textContent = 'Unexpected error';
    }
  });

  // Logout safety
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('profile');
      if (dashboard) dashboard.classList.add('hidden');
      if (loginScreen) loginScreen.classList.remove('hidden');
    });
  }
});
