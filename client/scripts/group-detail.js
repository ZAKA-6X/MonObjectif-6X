// API endpoint - uses same origin as frontend
const API_BASE = '/api';

// Get current user from localStorage
function getCurrentUser() {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}

// Check if user is teacher
function checkTeacherAccess() {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = '/';
    return false;
  }

  if (user.role !== 'TEACHER') {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'STUDENT') {
      window.location.href = './studentdash.html';
    } else {
      window.location.href = '/';
    }
    return false;
  }

  return true;
}

// Display user name
function displayUserName() {
  const user = getCurrentUser();
  if (user) {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = `${user.prenom} ${user.nom}`;
    }
  }
}

// Logout function
function logout() {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
  }
}

// Go back to teacher dashboard
function goBack() {
  window.location.href = './teacherdash.html';
}

// Get group ID from URL parameters
function getGroupIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// Load group details and members
async function loadGroupDetails() {
  const groupId = getGroupIdFromUrl();
  console.log('Group ID from URL:', groupId);
  if (!groupId) {
    alert('ID du groupe manquant');
    goBack();
    return;
  }

  try {
    // Get group info
    const groupResponse = await fetch(`${API_BASE}/groups/group/${groupId}`);
    console.log('Group info response status:', groupResponse.status);
    if (!groupResponse.ok) {
      throw new Error('Erreur lors de la récupération des informations du groupe');
    }
    const groupData = await groupResponse.json();
    console.log('Group info data:', groupData);

    displayGroupInfo(groupData.group);

    // Get group members
    const membersResponse = await fetch(`${API_BASE}/groups/members/${groupId}`);
    console.log('Group members response status:', membersResponse.status);
    if (!membersResponse.ok) {
      throw new Error('Erreur lors de la récupération des membres');
    }
    const membersData = await membersResponse.json();
    console.log('Group members data:', membersData);

    displayMembers(membersData.members);

    // Get group presentations
    const presentationsResponse = await fetch(`${API_BASE}/presentations/group/${groupId}`);
    if (!presentationsResponse.ok) {
      throw new Error('Erreur lors de la récupération des présentations');
    }
    const presentationsData = await presentationsResponse.json();

    displayGroupPresentations(presentationsData);

    // Show the sections after data is loaded
    const groupInfoSection = document.getElementById('group-info-section');
    const membersSection = document.getElementById('members-section');
    const presentationsSection = document.getElementById('presentations-section');
    if (groupInfoSection) groupInfoSection.classList.add('active');
    if (membersSection) membersSection.classList.add('active');
    if (presentationsSection) presentationsSection.classList.add('active');

  } catch (error) {
    console.error('Error loading group details:', error);
    alert('Erreur lors du chargement des détails du groupe');
  }
}

// Display group presentations
function displayGroupPresentations(presentations) {
  const presentationsListEl = document.getElementById('presentationsList');

  if (!presentations || presentations.length === 0) {
    presentationsListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>Aucune présentation</h3></div>';
    return;
  }

  presentationsListEl.innerHTML = presentations.map(pres => `
    <div class="card">
      <h3>${pres.title}</h3>
      <div class="meta">Note: ${pres.point || 'N/A'}</div>
      <div class="meta">Statut: ${pres.active ? 'Active' : 'Inactive'}</div>
      <div class="actions">
        <button class="btn btn-small" onclick="viewPresentation('${pres.id}')">Voir détails</button>
      </div>
    </div>
  `).join('');
}

// Display group information
function displayGroupInfo(group) {
  const groupInfoEl = document.getElementById('groupInfo');
  const groupTitleEl = document.getElementById('groupTitle');

  groupTitleEl.textContent = `Groupe: ${group.name}`;

  groupInfoEl.innerHTML = `
    <div class="info-item">
      <strong>Nom:</strong> ${group.name}
    </div>
    <div class="info-item">
      <strong>Créé le:</strong> ${new Date(group.created_at).toLocaleDateString('fr-FR')}
    </div>
  `;
}

// Display members
function displayMembers(members) {
  const membersListEl = document.getElementById('membersList');

  if (!members || members.length === 0) {
    membersListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><h3>Aucun membre</h3></div>';
    return;
  }

  membersListEl.innerHTML = members.map(member => `
    <div class="member-card">
      <div class="member-header">
        <h3>${member.prenom} ${member.nom}</h3>
        <span class="member-role">${member.role}</span>
      </div>
    </div>
  `).join('');
}

// View presentation details
function viewPresentation(presentationId) {
  window.location.href = `./pres-detail.html?id=${presentationId}`;
}

let currentGroupId = null;

// View presentation details
function viewPresentation(presentationId) {
  window.location.href = `./pres-detail.html?id=${presentationId}`;
}

// Load group details and members
async function loadGroupDetails() {
  const groupId = getGroupIdFromUrl();
  currentGroupId = groupId;
  console.log('Group ID from URL:', groupId);
  if (!groupId) {
    alert('ID du groupe manquant');
    goBack();
    return;
  }

  try {
    // Get group info
    const groupResponse = await fetch(`${API_BASE}/groups/group/${groupId}`);
    console.log('Group info response status:', groupResponse.status);
    if (!groupResponse.ok) {
      throw new Error('Erreur lors de la récupération des informations du groupe');
    }
    const groupData = await groupResponse.json();
    console.log('Group info data:', groupData);

    displayGroupInfo(groupData.group);

    // Get group members
    const membersResponse = await fetch(`${API_BASE}/groups/members/${groupId}`);
    console.log('Group members response status:', membersResponse.status);
    if (!membersResponse.ok) {
      throw new Error('Erreur lors de la récupération des membres');
    }
    const membersData = await membersResponse.json();
    console.log('Group members data:', membersData);

    displayMembers(membersData.members);

    // Get group presentations
    const presentationsResponse = await fetch(`${API_BASE}/presentations/group/${groupId}`);
    if (!presentationsResponse.ok) {
      throw new Error('Erreur lors de la récupération des présentations');
    }
    const presentationsData = await presentationsResponse.json();

    displayGroupPresentations(presentationsData);

    // Show the sections after data is loaded
    const groupInfoSection = document.getElementById('group-info-section');
    const membersSection = document.getElementById('members-section');
    const presentationsSection = document.getElementById('presentations-section');
    if (groupInfoSection) groupInfoSection.classList.add('active');
    if (membersSection) membersSection.classList.add('active');
    if (presentationsSection) presentationsSection.classList.add('active');

  } catch (error) {
    console.error('Error loading group details:', error);
    alert('Erreur lors du chargement des détails du groupe');
  }
}

// Display group presentations
function displayGroupPresentations(presentations) {
  const presentationsListEl = document.getElementById('presentationsList');

  if (!presentations || presentations.length === 0) {
    presentationsListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>Aucune présentation</h3></div>';
    return;
  }

  presentationsListEl.innerHTML = presentations.map(pres => `
    <div class="card">
      <h3>${pres.title}</h3>
      <div class="meta">Note: ${pres.point || 'N/A'}</div>
      <div class="meta">Statut: ${pres.active ? 'Active' : 'Inactive'}</div>
      <div class="actions">
        <button class="btn btn-small" onclick="viewPresentation('${pres.id}')">Voir détails</button>
      </div>
    </div>
  `).join('');
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  if (!checkTeacherAccess()) return;

  displayUserName();

  // Add event listener shit push for add presentation button
  const addBtn = document.getElementById('addPresentationBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (currentGroupId) {
        createPresentation(currentGroupId);
      }
    });
  }

  loadGroupDetails();
});
