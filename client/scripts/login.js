// client/scripts/login.js
const loginForm = document.getElementById('loginForm');
const nomInput = document.getElementById('nom');
const passwordInput = document.getElementById('password');
const passwordRow = passwordInput.closest('.input-row');
const resetFields = document.getElementById('resetFields');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitBtn = loginForm.querySelector('button[type="submit"]');
const metaRow = loginForm.querySelector('.meta');

let pendingResetUser = null;

const showMessage = (text, color) => {
  showAlert(text, color === 'green' ? 'success' : color === 'red' ? 'error' : 'info');
};

const clearMessage = () => {};

const enterResetMode = (user) => {
  pendingResetUser = user;
  nomInput.disabled = true;
  passwordInput.disabled = true;
  if (passwordRow) passwordRow.style.display = 'none';
  if (metaRow) metaRow.style.display = 'none';
  submitBtn.textContent = 'Définir le mot de passe';
  resetFields.style.display = 'block';
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
  newPasswordInput.focus();
};

const exitResetMode = () => {
  pendingResetUser = null;
  nomInput.disabled = false;
  passwordInput.disabled = false;
  if (passwordRow) passwordRow.style.display = '';
  if (metaRow) metaRow.style.display = '';
  submitBtn.textContent = 'Se connecter';
  resetFields.style.display = 'none';
  passwordInput.value = '';
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
};

const redirectByRole = (user) => {
  const role = String(user.role || '').toUpperCase();
  setTimeout(() => {
    if (role === 'STUDENT') {
      window.location.assign('/pages/studentdash.html');
    } else if (role === 'TEACHER') {
      window.location.assign('/pages/teacherdash.html');
    } else if (role === 'ADMIN') {
      window.location.assign('/pages/admindash.html');
    } else {
      window.location.assign('/pages/studentdash.html');
    }
  }, 600);
};

exitResetMode();

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nom = nomInput.value.trim();
  const password = passwordInput.value;

  submitBtn.disabled = true;
  clearMessage();

  try {
    if (pendingResetUser) {
      const newPassword = newPasswordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      if (newPassword.length < 4) {
        showMessage('Le nouveau mot de passe doit contenir au moins 4 caractères.', 'red');
        submitBtn.disabled = false;
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage('Les mots de passe ne correspondent pas.', 'red');
        submitBtn.disabled = false;
        return;
      }

      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingResetUser.id, newPassword })
      });

      const out = await res.json().catch(() => ({}));

      if (!res.ok) {
        showMessage(out?.message || out?.error || 'Impossible de mettre à jour le mot de passe.', 'red');
        submitBtn.disabled = false;
        return;
      }

      exitResetMode();
      showMessage('Mot de passe mis à jour. Connexion en cours...', 'green');
      localStorage.setItem('user', JSON.stringify(out.user));
      redirectByRole(out.user);
      return;
    }

    if (!nom || !password) {
      showMessage('Veuillez remplir le nom et le mot de passe.', 'red');
      submitBtn.disabled = false;
      return;
    }

    showMessage('Connexion en cours...');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, password })
    });

    let out = {};
    try { out = await res.json(); } catch (_) {}

    if (!res.ok) {
      showMessage(out?.message || out?.error || 'Erreur de connexion.', 'red');
      return;
    }

    if (!out || !out.user) {
      showMessage('Réponse invalide du serveur.', 'red');
      return;
    }

    if (out.requirePasswordReset) {
      enterResetMode(out.user);
      showMessage('Veuillez définir un nouveau mot de passe (minimum 4 caractères).');
      submitBtn.disabled = false;
      return;
    }

    showMessage('Connexion réussie. Redirection...', 'green');
    localStorage.setItem('user', JSON.stringify(out.user));
    redirectByRole(out.user);
  } catch (err) {
    showMessage("Impossible de joindre le serveur. Vérifie que l'API est accessible sur la même origine (/api).", 'red');
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});
