// API endpoint resolved from shared config
const API_BASE = window.API_BASE_URL || "/api";

// Get current user from localStorage
function getCurrentUser() {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
}

// Check if user is teacher
function checkTeacherAccess() {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = "/";
    return false;
  }

  if (user.role !== "TEACHER") {
    // Redirect to appropriate dashboard based on role
    if (user.role === "STUDENT") {
      window.location.href = "./studentdash.html";
    } else {
      window.location.href = "/";
    }
    return false;
  }

  return true;
}

// Display user name
function displayUserName() {
  const user = getCurrentUser();
  if (user) {
    const userNameEl = document.getElementById("userName");
    if (userNameEl) {
      userNameEl.textContent = `${user.prenom} ${user.nom}`;
    }
  }
}

// Logout function
function logout() {
    localStorage.removeItem("user");
    window.location.href = "/";
}

// Handle section navigation
function initSectionNavigation() {
  const navItems = document.querySelectorAll(".menu-item[data-section]");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const sectionKey = item.getAttribute("data-section");
      showSection(sectionKey);
      if (sectionKey === "presentations") {
        fetchAndRenderActivePresentations();
      }
      if (sectionKey === "students") {
        loadStudents();
      }
    });
  });
}

// Debounce function to limit the rate at which a function gets called
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Load all students from the database
async function loadStudents() {
  try {
    const response = await fetch(`${API_BASE}/students`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const students = await response.json();
    displayStudents(students);
  } catch (error) {
    console.error("Error loading students:", error);
    showErrorState("students-section", "Erreur lors du chargement des étudiants");
  }
}

// Display students in the UI
function displayStudents(students) {
  const studentListContainer = document.getElementById("studentList");
  const searchInput = document.getElementById("studentSearch");

  if (!studentListContainer || !searchInput) return;

  const renderList = (filteredStudents) => {
    studentListContainer.innerHTML = ""; // Clear previous list
    if (filteredStudents.length === 0) {
      studentListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🧑‍🎓</div>
          <h3>Aucun étudiant ne correspond à votre recherche</h3>
          <p>Essayez un autre terme de recherche.</p>
        </div>
      `;
      return;
    }

    filteredStudents.forEach((student) => {
      const studentItem = document.createElement("div");
      studentItem.className = "student-item";
      studentItem.dataset.id = student.id;
      studentItem.innerHTML = `
        <div class="student-details">
          <span class="student-name">${escapeHtml(student.prenom)} ${escapeHtml(student.nom)}</span>
        </div>
        <div class="student-actions">
          <button class="btn btn-secondary btn-small change-group-btn">Change group</button>
          <button class="btn btn-danger btn-small reset-password-btn">Reset password</button>
        </div>
        <div class="student-reset-confirm" style="display: none;">
            <p>Are you sure?</p>
            <button class="btn btn-success btn-small confirm-reset-btn">Yes</button>
            <button class="btn btn-secondary btn-small cancel-reset-btn">No</button>
        </div>
      `;
      studentListContainer.appendChild(studentItem);
    });
  };

  // Initial render
  renderList(students);

  // Search functionality
  const handleSearch = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredStudents = students.filter(student => 
      student.nom.toLowerCase().includes(searchTerm) ||
      student.prenom.toLowerCase().includes(searchTerm)
    );
    renderList(filteredStudents);
  };

  searchInput.addEventListener("keyup", debounce(handleSearch, 300));
}


// Load all groups from database
async function loadGroups() {
  try {
    const response = await fetch(`${API_BASE}/groups/all-group`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.groups && data.groups.length > 0) {
      displayGroups(data.groups);
    } else {
      showEmptyGroupsState();
    }
  } catch (error) {
    console.error("Error loading groups:", error);
    showErrorState("overview-section", "Erreur lors du chargement des groupes");
  }
}

// Display groups in the UI
function displayGroups(groups) {
  const groupsSection = document.getElementById("overview-section");

  // Replace empty state with groups list
  groupsSection.innerHTML = `
    <div class="section-header">
      <h2>Les Groupes</h2>
      <p class="section-subtitle">Liste de tous les groupes (${groups.length})</p>
    </div>
    <div class="groups-grid" id="groupsGrid"></div>
  `;

  const groupsGrid = document.getElementById("groupsGrid");

  groups.forEach((group) => {
    const groupCard = createGroupCard(group);
    groupsGrid.appendChild(groupCard);
  });
}

// Create a group card element
function createGroupCard(group) {
  const card = document.createElement("div");
  card.className = "group-card";

  const createdDate = new Date(group.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  card.innerHTML = `
    <div class="group-card-header">
      <h3 class="group-name">${escapeHtml(group.name || "Groupe sans nom")}</h3>
      <span class="group-badge">${group.memberCount || 0} membre${
    group.memberCount !== 1 ? "s" : ""
  }</span>
    </div>
    <div class="group-card-body">
      <p class="group-description">${escapeHtml(
        group.description || "Aucune description"
      )}</p>
      <div class="group-meta">
        <span class="meta-item">📅 Créé le ${createdDate}</span>
      </div>
    </div>
    <div class="group-card-footer">
      <a href="/pages/group-detail.html?groupId=${group.id}" 
         class="btn-link group-open-link"
         data-group-id="${group.id}">
        Voir les détails →
      </a>
    </div>
  `;

  // optional: also stash in localStorage for fallback
  const openLink = card.querySelector(".group-open-link");
  openLink.addEventListener("click", () => {
    localStorage.setItem("currentGroupId", group.id);
  });

  return card;
}


// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// View group details
function viewGroupDetails(groupId) {
  window.location.href = `./group-detail.html?id=${groupId}`;
}

// Show empty state for groups
function showEmptyGroupsState() {
  const groupsSection = document.getElementById("overview-section");
  groupsSection.innerHTML = `
    <div class="section-header">
      <h2>Les Groupes</h2>
      <p class="section-subtitle">Liste de tous les groupes</p>
    </div>
    <div class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>Aucun groupe pour le moment</h3>
      <p>Les groupes créés apparaîtront ici</p>
    </div>
  `;
}

// Show error state
function showErrorState(sectionId, message) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.innerHTML = `
      <div class="section-header">
        <h2>📊 Les Groupes</h2>
        <p class="section-subtitle">Liste de tous les groupes</p>
      </div>
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Erreur</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Réessayer</button>
      </div>
    `;
  }
}

// Load dashboard stats (placeholder)
function loadDashboardStats() {
  // These will be populated with real data from backend later
  const totalGroupsEl = document.getElementById("totalGroups");
  const totalPresentationsEl = document.getElementById("totalPresentations");
  const activePresentationsEl = document.getElementById("activePresentations");
  const avgRatingEl = document.getElementById("avgRating");

  if (totalGroupsEl) totalGroupsEl.textContent = "0";
  if (totalPresentationsEl) totalPresentationsEl.textContent = "0";
  if (activePresentationsEl) activePresentationsEl.textContent = "0";
  if (avgRatingEl) avgRatingEl.textContent = "0.0";
}

// Disable all presentations
async function disableAllPresentations() {
  if (
    !confirm("Êtes-vous sûr de vouloir désactiver toutes les présentations ?")
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/presentations/disable-all`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Erreur lors de la désactivation des présentations"
      );
    }

    showAlert("Toutes les présentations ont été désactivées.", "success");
    fetchAndRenderActivePresentations();
  } catch (error) {
    showAlert(`Erreur: ${error.message}`, "error");
  }
}

// Reset student password
async function resetStudentPassword(studentId) {
  try {
    const response = await fetch(`${API_BASE}/students/${studentId}/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la réinitialisation du mot de passe');
    }

    showAlert('Mot de passe réinitialisé avec succès à "123".', 'success');
  } catch (error) {
    showAlert(`Erreur: ${error.message}`, 'error');
  }
}

// Initialize dashboard
function initDashboard() {
  // Check teacher access
  if (!checkTeacherAccess()) {
    return;
  }

  // Display user name
  displayUserName();

  // Initialize section navigation
  initSectionNavigation();

  // Load groups data
  loadGroups();

  // Load dashboard stats
  loadDashboardStats();

  const disableAllBtn = document.getElementById("disableAllBtn");
  if (disableAllBtn) {
    disableAllBtn.addEventListener("click", disableAllPresentations);
  }

  // Event listener for student actions
  const studentListContainer = document.getElementById("studentList");
  if (studentListContainer) {
    studentListContainer.addEventListener("click", (e) => {
      const target = e.target;
      const studentItem = target.closest(".student-item");
      if (!studentItem) return;

      const actionsDiv = studentItem.querySelector(".student-actions");
      const confirmDiv = studentItem.querySelector(".student-reset-confirm");

      if (target.classList.contains("reset-password-btn")) {
        actionsDiv.style.display = "none";
        confirmDiv.style.display = "flex";
      }

      if (target.classList.contains("cancel-reset-btn")) {
        actionsDiv.style.display = "flex";
        confirmDiv.style.display = "none";
      }

      if (target.classList.contains("confirm-reset-btn")) {
        const studentId = studentItem.dataset.id;
        resetStudentPassword(studentId).then(() => {
            actionsDiv.style.display = "flex";
            confirmDiv.style.display = "none";
        });
      }

      if (target.classList.contains("change-group-btn")) {
        const studentId = studentItem.dataset.id;
        openChangeGroupModal(studentId);
      }
    });
  }

  console.log("Teacher dashboard initialized");
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initDashboard);

document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refreshActivePresBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", fetchAndRenderActivePresentations);
  }
});

async function fetchAndRenderActivePresentations() {
  const container = document.getElementById("activePresentationsList");
  if (!container) return;

  // loading state
  container.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div>
    <h3>Chargement…</h3><p>Récupération des présentations actives</p></div>`;

  try {
    // 👇 use your existing endpoint for “active” presentations
    const res = await fetch(`${API_BASE}/presentations/active`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch active presentations");
    const items = await res.json(); // expect an array of presentations

    if (!items || items.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div>
        <h3>Aucune présentation active</h3><p>Revenez plus tard ou actualisez.</p></div>`;
      return;
    }

    container.innerHTML = items
      .map((p) => {
        // expected fields: p.id, p.title, p.status, p.group_name (or p.group?.name), p.updated_at, p.scheduled_at
        const groupName = p.group_name || (p.group && p.group.name) || "Groupe";
        const when = p.scheduled_at
          ? new Date(p.scheduled_at).toLocaleString()
          : p.updated_at
          ? new Date(p.updated_at).toLocaleString()
          : "";

        return `
        <div class="card">
          <h3>${p.title}</h3>
          <div class="meta">Groupe&nbsp;: <strong>${groupName}</strong></div>
          <div class="meta">Statut&nbsp;: <strong>${
            p.status || "Active"
          }</strong></div>
          ${when ? `<div class="meta">Quand&nbsp;: ${when}</div>` : ""}
          <div class="actions">
            <a class="btn btn-primary" href="/pages/pres-detail.html?id=${
              p.id
            }">Ouvrir</a>
          </div>
        </div>
      `;
      })
      .join("");

    // Add event listeners for feedback buttons
    document.querySelectorAll(".feedback-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const presentationId = e.target.getAttribute("data-id");
        openFeedbackModal(presentationId);
      });
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div>
      <h3>Erreur</h3><p>Impossible de charger les présentations actives.</p></div>`;
  }
}

// Feedback modal logic
let currentPresentationId = null;
let currentStudentId = null;

function openChangeGroupModal(studentId) {
  currentStudentId = studentId;
  const modal = document.getElementById("changeGroupModal");
  const select = document.getElementById("groupSelect");
  select.innerHTML = '<option>Chargement...</option>';

  // Fetch groups
  fetch(`${API_BASE}/groups/all-group`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch groups');
      return res.json();
    })
    .then(data => {
      select.innerHTML = '';
      if (data.groups && data.groups.length > 0) {
        data.groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group.id;
          option.textContent = group.name;
          select.appendChild(option);
        });
      } else {
        select.innerHTML = '<option>Aucun groupe disponible</option>';
      }
    })
    .catch(err => {
      console.error(err);
      select.innerHTML = '<option>Erreur de chargement</option>';
    });

  if (modal) {
    modal.classList.add("open");
  }
}

function closeChangeGroupModal() {
  const modal = document.getElementById("changeGroupModal");
  if (modal) {
    modal.classList.remove("open");
  }
  currentStudentId = null;
}

// Handle feedback form submission
document.addEventListener("DOMContentLoaded", () => {
  const feedbackForm = document.getElementById("feedbackForm");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedbackText = document.getElementById("feedbackText").value.trim();
      if (!feedbackText) {
        showAlert("Veuillez entrer un feedback.", 'warning');
        return;
      }
      if (!currentPresentationId) {
        showAlert("Aucune présentation sélectionnée.", 'warning');
        return;
      }
      const user = getCurrentUser();
      if (!user) {
        showAlert("Utilisateur non authentifié.", 'error');
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/presentations/${currentPresentationId}/feedback`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              feedback: feedbackText,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de l'ajout du feedback"
          );
        }

        showAlert("Feedback ajouté avec succès.", 'success');
        closeFeedbackModal();
        // Optionally refresh the presentations list or update UI
        fetchAndRenderActivePresentations();
      } catch (error) {
        showAlert(`Erreur: ${error.message}`, 'error');
      }
    });
  }

  const changeGroupForm = document.getElementById('changeGroupForm');
  if (changeGroupForm) {
    changeGroupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const groupId = document.getElementById('groupSelect').value;
      if (!currentStudentId || !groupId) {
        showAlert('Veuillez sélectionner un groupe.', 'warning');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/students/${currentStudentId}/group`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erreur lors du changement de groupe");
        }

        showAlert('Groupe modifié avec succès.', 'success');
        closeChangeGroupModal();
        loadStudents(); // Refresh student list to show new group if needed
      } catch (error) {
        showAlert(`Erreur: ${error.message}`, 'error');
      }
    });
  }
});


function showSection(key) {
  document
    .querySelectorAll('[data-dashboard="section"]')
    .forEach((s) => s.classList.remove("active"));
  const el = document.getElementById(`${key}-section`);
  if (el) el.classList.add("active");

  document
    .querySelectorAll(".menu-item[data-section]")
    .forEach((a) => a.classList.remove("active"));
  const nav = document.querySelector(
    `.menu-item[data-section="${key}"]`
  );
  if (nav) nav.classList.add("active");
}
