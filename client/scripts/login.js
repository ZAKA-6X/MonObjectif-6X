// login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nom = document.getElementById('nom').value.trim();
  const password = document.getElementById('password').value;

  const msg = document.getElementById('message');
  const submitBtn = document.querySelector('#loginForm button[type="submit"]');

  // Basic validation
  if (!nom || !password) {
    msg.style.color = 'red';
    msg.textContent = 'Veuillez remplir le nom et le mot de passe.';
    return;
  }

  submitBtn.disabled = true;
  msg.style.color = '';
  msg.textContent = 'Connexion en cours...';

  try {
    // ✅ same-origin — no hardcoded http://localhost:5000
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // If your API uses cookies/sessions add: credentials: 'include',
      body: JSON.stringify({ nom, password })
    });

    // Try to parse JSON safely
    let out = {};
    try { out = await res.json(); } catch (_) {}

    if (!res.ok) {
      const errMsg = out?.message || out?.error || 'Erreur de connexion.';
      msg.style.color = 'red';
      msg.textContent = errMsg;
      return;
    }

    if (!out || !out.user) {
      msg.style.color = 'red';
      msg.textContent = 'Réponse invalide du serveur.';
      return;
    }

    msg.style.color = 'green';
    msg.textContent = 'Connexion réussie. Redirection...';

    // Store user info
    localStorage.setItem('user', JSON.stringify(out.user));

    // Normalize role and redirect
    const role = String(out.user.role || '').toUpperCase();
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
  } catch (err) {
    // Network/CORS/offline server
    msg.style.color = 'red';
    msg.textContent = "Impossible de joindre le serveur. Vérifie que l'API est accessible sur la même origine (/api).";
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});
