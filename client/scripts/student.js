// studentdash.js (updated)

let currentUser = null;
let currentUserGroupId = null;

/* -------------------- Config -------------------- */
const API_BASE = window.API_BASE_URL || '/api';            // ✅ resolves API base per environment
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

// Helper to get initials from name
function getInitials(nom, prenom) {
  const n = (nom || '').trim();
  const p = (prenom || '').trim();
  if (n && p) return (n[0] + p[0]).toUpperCase();
  if (n) return n[0].toUpperCase();
  if (p) return p[0].toUpperCase();
  return '?';
}

/* -------------------- Initialize -------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  loadUser();
  await fetchUserGroupId();
  fetchPresentations();
  checkIfMod();
});

/* -------------------- Auth / User -------------------- */
function loadUser() {
  const userData = localStorage.getItem('user');
  if (userData) {
    currentUser = JSON.parse(userData);
    const role = String(currentUser.role || '').toUpperCase();
    if (role !== 'STUDENT') {
      showAlert('Accès non autorisé', 'error');
      window.location.href = `${PAGES_BASE}/login.html`;
      return;
    }
    document.getElementById('userName').textContent = currentUser.nom || 'Utilisateur';
  } else {
    window.location.href = `${PAGES_BASE}/login.html`;
  }
}

async function fetchUserGroupId() {
  if (!currentUser || !currentUser.id) {
    currentUserGroupId = null;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/groups/my-group/${encodeURIComponent(currentUser.id)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    currentUserGroupId = data?.group?.id || null;
  } catch (error) {
    console.error('Unable to resolve user group:', error);
    currentUserGroupId = null;
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
function renderCards(list, getStatusBadge, options = {}) {
  const { highlightOwn = true } = options;
  return list.map(p => {
    // Get group name from various possible properties
    const groupName = p.group?.name || p.group_name || p.groupName || p.name || 'Non assigné';
    const rawPresentationGroupId =
      p.group_id ?? p.group?.id ?? p.groupId ?? null;
    const presentationGroupId =
      rawPresentationGroupId !== undefined && rawPresentationGroupId !== null
        ? String(rawPresentationGroupId)
        : null;
    const userGroupId =
      currentUserGroupId !== undefined && currentUserGroupId !== null
        ? String(currentUserGroupId)
        : null;
    const isUserGroup =
      highlightOwn &&
      userGroupId &&
      presentationGroupId === userGroupId;

    const cardClass = `card${isUserGroup ? ' card-my-group' : ''}`;
    const ownBadge = isUserGroup
      ? '<span class="card-tag card-tag-own">Votre groupe</span>'
      : '';

    return `
    <a class="${cardClass}" href="${presLink(p.id)}" style="display:block; text-decoration:none; color:inherit;">
      <div class="card-content">
        ${ownBadge}
        <div class="card-title">${escapeHtml(p.title || 'Sans titre')}</div>
        
        <div class="card-info-row">
          <span class="info-label">Groupe:</span>
          <span class="info-value">${escapeHtml(groupName)}</span>
        </div>
        

        
        <div class="card-info-row">
          <span class="card-date">📅 ${fmtDate(p.uploaded_at)}</span>
          ${getStatusBadge(p)}
        </div>
      </div>
    </a>
  `;
  }).join('');
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
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔭</div><div class="empty-state-title">Aucune présentation active</div><p class="empty-state-text">Les présentations apparaîtront ici une fois disponibles</p></div>';
      return;
    }

    container.innerHTML = renderCards(data, (p) =>
      `<span class="badge ${p.active ? 'badge-active' : 'badge-pending'}">
         ${p.active ? '✓ Active' : '⏸ Inactive'}
       </span>`
    );
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Erreur de chargement</div></div>';
  }
}

/* -------------------- API: My group info -------------------- */
async function fetchMyGroup() {
  const container = document.getElementById('groupInfo');
  const headerElement = document.getElementById('groupTabHeader');
  
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';

  try {
    const res = await fetch(`${API_BASE}/groups/my-group/${encodeURIComponent(currentUser.id)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    const previousGroupId = currentUserGroupId;
    currentUserGroupId = data?.group?.id || null;
    if (previousGroupId !== currentUserGroupId) {
      fetchPresentations();
    }

    if (!data || !data.group) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">Vous n\'êtes dans aucun groupe</div><p class="empty-state-text">Rejoignez ou créez un groupe pour collaborer</p></div>';
      return;
    }

    // Update tab header with group name
    if (headerElement) {
      headerElement.innerHTML = `
        <h2>
          ${escapeHtml(data.group.name)}
        </h2>
        <p class="tab-subtitle">Gérez votre groupe et collaborez avec vos membres</p>

      `;
    }

    // Render members in grid
    const membersCount = (data.members || []).length;
    container.innerHTML = `
      <div class="group-info">
        <div class="members-section">
          <div class="members-title">
            Membres du groupe (${membersCount})
          </div>
          <div class="members-grid">
            ${(data.members || []).map(m => {
              const initials = getInitials(m.nom, m.prenom);
              const isLeader = m.is_leader || m.role === 'leader';
              return `
                <div class="member-card">
                  <div class="member-header">
                    <div class="member-avatar">${initials}</div>
                    <div class="member-details">
                      <div class="member-name">${escapeHtml(m.nom)} ${escapeHtml(m.prenom)}</div>
                    </div>
                  </div>
                  ${isLeader ? '<div class="member-badge">Chef de groupe</div>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Erreur de chargement</div></div>';
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
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-title">Aucune présentation dans votre groupe</div><p class="empty-state-text">Les présentations de votre groupe apparaîtront ici</p></div>';
      return;
    }

    container.innerHTML = renderCards(data, (p) =>
      `<span class="badge ${p.active ? 'badge-active' : 'badge-pending'}">
         ${p.active ? '✓ Active' : '⏸ Inactive'}
       </span>`
    );
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Erreur de chargement</div></div>';
  }
}

async function checkIfMod() {
    if (!currentUser || !currentUser.id) {
        return;
    }

    try {
        // const res = await fetch(`${API_BASE}/mods/${encodeURIComponent(currentUser.id)}`);
        /* if (!res.ok) {
            console.error('Failed to check mod status');
            return;
        } */
        const data = { isMod: true }; // await res.json();
        if (data.isMod) {
            const nonPasseBtn = document.getElementById('nonPasseBtn');
            if (nonPasseBtn) {
                nonPasseBtn.style.display = 'block';
                nonPasseBtn.addEventListener('click', downloadNonPasse);
            }
        }
    } catch (error) {
        console.error('Error checking mod status:', error);
    }
}

async function downloadNonPasse() {
  const button = document.getElementById("nonPasseBtn");
  const originalText = button.querySelector('.text').textContent;
  const resetButtonState = () => {
    if (button) {
      button.disabled = false;
      button.querySelector('.text').textContent = originalText;
       button.classList.remove('loading');
    }
  };

  if (button) {
    button.disabled = true;
    button.querySelector('.text').textContent = "Téléchargement...";
    button.classList.add('loading');
  }

  try {
    const response = await fetch(`${API_BASE}/groups/not-passed/download`);
    if (!response.ok) {
      if (response.status === 404) {
        showAlert("Aucun groupe non passé à télécharger.", "info");
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groupes-non-passes.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showAlert("Le fichier des groupes non passés a été téléchargé.", "success");
  } catch (error) {
    console.error('Error downloading groups not passed:', error);
    showAlert('Erreur lors du téléchargement du fichier.', 'error');
  } finally {
    resetButtonState();
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
    `<span class="badge ${p.active ? 'badge-active' : 'badge-pending'}">
       ${p.active ? 'Active' : 'Inactive'}
     </span>`
  );
}
