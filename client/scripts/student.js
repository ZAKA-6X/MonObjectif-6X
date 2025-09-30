// studentdash.js (updated)

let currentUser = null;

/* -------------------- Config -------------------- */
const API_BASE = '/api';            // ✅ same-origin API base
const PAGES_BASE = '/pages';        // adjust if your pages live elsewhere

/* -------------------- Helpers -------------------- */
function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, m => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]
  ));
}
function fmtDate(iso) {
  try {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return '—'; }
}
function presLink(id) {
  return `${PAGES_BASE}/pres-detail.html?id=${encodeURIComponent(id)}`;
}

/* -------------------- Initialize -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  fetchPresentations();
});

/* -------------------- Auth / User -------------------- */
function loadUser() {
  const userData = localStorage.getItem('user');
  if (userData) {
    currentUser = JSON.parse(userData);
    const role = String(currentUser.role || '').toUpperCase();
    if (role !== 'STUDENT') {
      alert('Accès non autorisé');
      window.location.href = `${PAGES_BASE}/login.html`;
      return;
    }
    document.getElementById('userName').textContent = currentUser.nom || 'Utilisateur';
  } else {
    window.location.href = `${PAGES_BASE}/login.html`;
  }
}

/* -------------------- Tabs -------------------- */
function switchTab(tabName, ev) {
  if (ev && ev.preventDefault) ev.preventDefault();

  document.querySelectorAll('.navbar-menu li').forEach(li => li.classList.remove('active'));
  if (ev && ev.currentTarget) ev.currentTarget.classList.add('active');

  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');

  if (tabName === 'presentations') fetchPresentations();
  else if (tabName === 'my-group') fetchMyGroup();
  else if (tabName === 'my-presentations') fetchMyPresentations();
}

/* -------------------- Click handler (optional) -------------------- */
function viewPresentationDetails(presentationId) {
  if (!presentationId) return;
  window.location.href = presLink(presentationId);
}

/* -------------------- Renderers -------------------- */
function renderCards(list, getStatusBadge) {
  return list.map(p => `
    <a class="card" href="${presLink(p.id)}" style="display:block; text-decoration:none; color:inherit;">
      <div class="card-title">${escapeHtml(p.title || 'Sans titre')}</div>
      <div class="card-description">${escapeHtml(p.description || 'Pas de description')}</div>
      <div style="margin-top:1rem;">
        ${getStatusBadge(p)}
        ${p.point !== undefined && p.point !== null ? `<span class="points">${escapeHtml(p.point)} pts</span>` : ''}
      </div>
      <div class="card-meta">
        <span>📄 ${escapeHtml(p.name_file || '—')}</span>
        <span>📅 ${fmtDate(p.uploaded_at)}</span>
      </div>
    </a>
  `).join('');
}

/* -------------------- API: All active presentations -------------------- */
async function fetchPresentations() {
  const container = document.getElementById('presentationsList');
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';

  try {
    const res = await fetch(`${API_BASE}/presentations/active`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<div class="empty-state">📭<br>Aucune présentation active</div>';
      return;
    }

    container.innerHTML = renderCards(data, () =>
      `<span class="badge badge-success">✓ Active</span>`
    );
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<div class="empty-state">❌ Erreur de chargement</div>';
  }
}

/* -------------------- API: My group info -------------------- */
async function fetchMyGroup() {
  const container = document.getElementById('groupInfo');
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';

  try {
    const res = await fetch(`${API_BASE}/groups/my-group/${encodeURIComponent(currentUser.id)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (!data || !data.group) {
      container.innerHTML = '<div class="empty-state">👥<br>Vous n\'êtes dans aucun groupe</div>';
      return;
    }

    container.innerHTML = `
      <div class="group-info">
        <div class="group-name">${escapeHtml(data.group.name)}</div>
        <div>Créé le ${fmtDate(data.group.created_at)}</div>
        <div style="margin-top: 2rem; font-size: 1.2rem; font-weight: 600;">
          👥 Membres (${(data.members || []).length})
        </div>
        <div class="members-list">
          ${(data.members || []).map(m => `
            <div class="member-card">
              <div class="member-name">${escapeHtml(m.nom)} ${escapeHtml(m.prenom)}</div>
              <div class="member-email">${escapeHtml(m.role || '')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<div class="empty-state">❌ Erreur de chargement</div>';
  }
}

/* -------------------- API: My group's presentations -------------------- */
async function fetchMyPresentations() {
  const container = document.getElementById('myPresentationsList');
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';

  try {
    const res = await fetch(`${API_BASE}/presentations/my-group/${encodeURIComponent(currentUser.id)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<div class="empty-state">📁<br>Aucune présentation dans votre groupe</div>';
      return;
    }

    container.innerHTML = renderCards(data, (p) =>
      `<span class="badge ${p.active ? 'badge-success' : 'badge-warning'}">
         ${p.active ? '✓ Active' : '⏸ Inactive'}
       </span>`
      + (p.feedback
          ? `<div style="margin-top:1rem; padding:1rem; background:#fff3cd; border-radius:8px;">
               <strong>Feedback:</strong> ${escapeHtml(p.feedback)}
             </div>`
          : '')
    );
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<div class="empty-state">❌ Erreur de chargement</div>';
  }
}

/* -------------------- Logout -------------------- */
function logout() {
  localStorage.removeItem('user');
  window.location.href = `${PAGES_BASE}/login.html`;
}

/* -------------------- (Optional) Legacy display helper -------------------- */
function displayPresentations(presentations, containerId) {
  const container = document.getElementById(containerId);
  if (!presentations || presentations.length === 0) {
    container.innerHTML = '<p class="no-data">Aucune présentation disponible</p>';
    return;
  }
  container.innerHTML = renderCards(presentations, (p) =>
    `<span class="badge ${p.active ? 'badge-success' : 'badge-inactive'}">
       ${p.active ? 'Active' : 'Inactive'}
     </span>`
  );
}
