// API endpoint - uses same origin as frontend
const API_BASE = "/api";

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
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    localStorage.removeItem("user");
    window.location.href = "/";
  }
}

// Handle section navigation
function initSectionNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".content-section");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      // Remove active class from all nav items and sections
      navItems.forEach((nav) => nav.classList.remove("active"));
      sections.forEach((section) => section.classList.remove("active"));

      // Add active class to clicked nav item
      item.classList.add("active");

      // Show corresponding section
      const sectionId = item.getAttribute("data-section") + "-section";
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.classList.add("active");
      }
    });
  });
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
      <h2>📊 Les Groupes</h2>
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
      <button class="btn-link" onclick="viewGroupDetails('${group.id}')">
        Voir les détails →
      </button>
    </div>
  `;

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
      <h2>📊 Les Groupes</h2>
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

  console.log("Teacher dashboard initialized");
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initDashboard);

document.addEventListener("DOMContentLoaded", () => {
  // when user clicks "Présentations" in sidebar, load list
  const navPres = document.querySelector(
    '.nav-item[data-section="presentations"]'
  );
  if (navPres) {
    navPres.addEventListener("click", () => {
      showSection("presentations"); // assumes you already have this helper
      fetchAndRenderActivePresentations(); // <-- new
    });
  }

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
    const res = await fetch("/api/presentations/active", {
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

function openFeedbackModal(presentationId) {
  currentPresentationId = presentationId;
  const modal = document.getElementById("feedbackModal");
  const textarea = document.getElementById("feedbackText");
  textarea.value = "";
  modal.style.display = "block";
}

function closeFeedbackModal() {
  const modal = document.getElementById("feedbackModal");
  modal.style.display = "none";
  currentPresentationId = null;
}

// Handle feedback form submission
document.addEventListener("DOMContentLoaded", () => {
  const feedbackForm = document.getElementById("feedbackForm");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedbackText = document.getElementById("feedbackText").value.trim();
      if (!feedbackText) {
        alert("Veuillez entrer un feedback.");
        return;
      }
      if (!currentPresentationId) {
        alert("Aucune présentation sélectionnée.");
        return;
      }
      const user = getCurrentUser();
      if (!user) {
        alert("Utilisateur non authentifié.");
        return;
      }

      try {
        const response = await fetch(
          `/api/presentations/${currentPresentationId}/feedback`,
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

        alert("Feedback ajouté avec succès.");
        closeFeedbackModal();
        // Optionally refresh the presentations list or update UI
        fetchAndRenderActivePresentations();
      } catch (error) {
        alert(`Erreur: ${error.message}`);
      }
    });
  }
});

function showSection(key) {
  document
    .querySelectorAll(".content-section")
    .forEach((s) => s.classList.remove("active"));
  const el = document.getElementById(`${key}-section`);
  if (el) el.classList.add("active");

  document
    .querySelectorAll(".sidebar .nav-item")
    .forEach((a) => a.classList.remove("active"));
  const nav = document.querySelector(
    `.sidebar .nav-item[data-section="${key}"]`
  );
  if (nav) nav.classList.add("active");
}
