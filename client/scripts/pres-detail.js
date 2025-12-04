// client/scripts/pres-detail.js
const API_URL = window.API_BASE_URL || "/api";
let currentPresentation = null;

// Get presentation ID from URL
function getPresentationIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Get user from localStorage
function getCurrentUser() {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
}

// Load and display group members
async function loadGroupMembers(groupId) {
  try {
    const response = await fetch(`${API_URL}/groups/members/${groupId}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des membres');
    }
    const data = await response.json();
    displayMembers(data.members);
  } catch (error) {
    console.error('Error loading members:', error);
    // Optionally show error in membersList
    const membersListEl = document.getElementById('membersList');
    membersListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Erreur de chargement</h3></div>';
  }
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

// Display presentation details based on user type and permissions
function displayPresentationDetails(
  presentation,
  group,
  userType,
  permissions,
  hasRated
) {
  document.getElementById("loadingMessage").style.display = "none";
  document.getElementById("presentationDetails").style.display = "block";

  // Title and description
  document.getElementById("presTitle").textContent =
    presentation.title || "Sans titre";
  document.getElementById("presDescription").textContent =
    presentation.description || "Aucune description disponible";

  // Show/hide edit button based on permissions
  const editDescBtn = document.getElementById("editDescriptionBtn");
  if (permissions.canEditDescription) {
    editDescBtn.style.display = "inline-block";
  } else {
    editDescBtn.style.display = "none";
  }

  // Status
  const statusBtn = document.getElementById("statusToggle");
  const isActive = Boolean(presentation.active);
  if (statusBtn) {
    const statusLabel = isActive ? "Active" : "Inactive";
    statusBtn.textContent = statusLabel;
    statusBtn.className = `status-toggle ${isActive ? "active" : "inactive"}`;
    statusBtn.setAttribute("aria-pressed", String(isActive));
    if (userType === "teacher") {
      statusBtn.disabled = false;
      statusBtn.title = isActive
        ? "Cliquer pour rendre la présentation inactive"
        : "Cliquer pour activer la présentation";
    } else {
      statusBtn.disabled = true;
      statusBtn.title = statusLabel;
    }
  }

  // Info cards
  document.getElementById("groupName").textContent =
    (group && group.name) || "—";
  const uploadedAt = presentation.uploaded_at
    ? new Date(presentation.uploaded_at)
    : null;
  document.getElementById("uploadDate").textContent = uploadedAt
    ? uploadedAt.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const pointsEl = document.getElementById("points");
  if (pointsEl) {
    const pointsCard = pointsEl.closest(".info-card");
    if (userType === "student_not_in_group") {
      if (pointsCard) pointsCard.style.display = "none";
    } else {
      if (pointsCard) pointsCard.style.display = "";
      pointsEl.textContent =
        presentation.point !== undefined && presentation.point !== null
          ? `${presentation.point} / 20`
          : "Non évalué";
    }
  }

  document.getElementById("fileName").textContent =
    presentation.name_file || "—";

  // Control group info visibility on small screens for group members
  const rightSection = document.querySelector(".right-section");
  if (rightSection) {
    rightSection.classList.toggle(
      "hide-on-narrow",
      userType === "student_in_group"
    );
  }

  // Feedback section - show based on user type
  const feedbackSection = document.querySelector(".feedback-section");
  const feedbackEl = document.getElementById("feedbackContent");

  if (userType === "teacher" || userType === "student_in_group") {
    feedbackSection.style.display = "block";
    if (presentation.feedback) {
      feedbackEl.textContent = presentation.feedback;
      feedbackEl.classList.remove("empty");
    } else {
      feedbackEl.textContent = "Aucun feedback pour le moment";
      feedbackEl.classList.add("empty");
    }
  } else {
    feedbackSection.style.display = "none";
  }

  // Teacher grading section - only for teachers
  const teacherGradingSection = document.getElementById(
    "teacherGradingSection"
  );
  if (userType === "teacher") {
    teacherGradingSection.style.display = "block";
  } else {
    teacherGradingSection.style.display = "none";
  }

  // Rating section - only for students not in group
  const ratingSection = document.getElementById("ratingSection");
  if (userType === "student_not_in_group") {
    ratingSection.style.display = "block";
    // Show message if already rated but keep form visible
    const ratingMessageEl = document.getElementById("ratingMessage");
    if (hasRated) {
      ratingMessageEl.className = "rating-message info";
      ratingMessageEl.textContent = "Vous pouvez mettre à jour votre note.";
      ratingMessageEl.style.display = "block";
    } else {
      ratingMessageEl.textContent = "";
      ratingMessageEl.style.display = "none";
    }
  } else {
    ratingSection.style.display = "none";
  }
}

// Load presentation details
async function loadPresentationDetails() {
  const presentationId = getPresentationIdFromUrl();
  const user = getCurrentUser();

  if (!presentationId) {
    return showError("ID de présentation manquant");
  }
  if (!user) {
    window.location.href = "/";
    return;
  }

  const url = `${API_URL}/presentations/details/${encodeURIComponent(
    presentationId
  )}?userId=${encodeURIComponent(user.id)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let serverMsg = "";
      try {
        const maybeJson = await response.json();
        serverMsg = maybeJson?.message || maybeJson?.error || "";
      } catch {
        try {
          serverMsg = await response.text();
        } catch {}
      }
      const msg = serverMsg
        ? `${response.status} ${response.statusText} — ${serverMsg}`
        : `${response.status} ${response.statusText}`;
      throw new Error(msg);
    }

    const data = await response.json();
    currentPresentation = data.presentation;

    // Pass new parameters to display function
    displayPresentationDetails(
      data.presentation,
      data.group,
      data.userType,
      data.permissions,
      data.hasRated
    );

    // Fetch and display group members
    if (data.group && data.group.id) {
      loadGroupMembers(data.group.id);
    }

    // Show/hide sections based on permissions
    const uploadSection = document.getElementById("uploadSection");
    const downloadSection = document.getElementById("downloadSection");
    const viewOnlyNote = document.getElementById("viewOnlyNote");
    const statusBtn = document.getElementById("statusToggle");

    // Always show download section if file exists
    if (downloadSection && data.presentation.path_file) {
      downloadSection.style.display = "block";
    }

    if (statusBtn) {
      statusBtn.disabled = data.userType !== "teacher";
    }

    if (data.permissions.canUpload) {
      // User can upload - show upload form
      if (uploadSection) uploadSection.style.display = "block";
      if (viewOnlyNote) viewOnlyNote.style.display = "none";
    } else {
      // User cannot upload - hide upload form, show note if not teacher
      if (uploadSection) uploadSection.style.display = "none";
      if (data.userType !== "teacher") {
        if (viewOnlyNote) viewOnlyNote.style.display = "block";
      } else {
        if (viewOnlyNote) viewOnlyNote.style.display = "none";
      }
    }
  } catch (err) {
    console.error("loadPresentationDetails failed:", err);
    showError(err.message || "Erreur lors du chargement");
  }
}

// Submit rating (for students not in group)
async function submitRating(event) {
  event.preventDefault();

  const ratingInput = document.getElementById("ratingInput");
  const ratingMessage = document.getElementById("ratingMessage");
  const rating = parseFloat(ratingInput.value);

  // Validate rating
  if (rating < 0 || rating > 20) {
    ratingMessage.className = "rating-message error";
    ratingMessage.textContent = "La note doit être entre 0 et 20";
    return;
  }

  if (!currentPresentation) {
    ratingMessage.className = "rating-message error";
    ratingMessage.textContent = "Aucune présentation chargée";
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/";
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/presentations/${currentPresentation.id}/rate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          rating: rating,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      ratingMessage.className = "rating-message success";
      ratingMessage.textContent =
        result.message || "Note soumise avec succès! ✅";

      // Reset form and reload details after 2 seconds
      setTimeout(() => {
        ratingInput.value = "";
        ratingMessage.style.display = "none";
        loadPresentationDetails();
      }, 2000);
    } else {
      ratingMessage.className = "rating-message error";
      ratingMessage.textContent =
        result.error || "Erreur lors de la soumission de la note";
    }
  } catch (err) {
    console.error("Rating submission error:", err);
    ratingMessage.className = "rating-message error";
    ratingMessage.textContent = "Impossible de soumettre la note";
  }
}

// Submit teacher grading (points and feedback)
async function submitTeacherGrading(event) {
  event.preventDefault();

  const noteInput = document.getElementById("teacherNoteInput");
  const feedbackInput = document.getElementById("teacherFeedbackInput");
  const messageEl = document.getElementById("teacherGradingMessage");

  const note = parseFloat(noteInput.value);
  const feedback = feedbackInput.value.trim();

  // Validate note
  if (note < 0 || note > 20) {
    messageEl.className = "teacher-grading-message error";
    messageEl.textContent = "La note doit être entre 0 et 20";
    return;
  }

  if (!feedback) {
    messageEl.className = "teacher-grading-message error";
    messageEl.textContent = "Le feedback est requis";
    return;
  }

  if (!currentPresentation) {
    messageEl.className = "teacher-grading-message error";
    messageEl.textContent = "Aucune présentation chargée";
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  try {
    // First update the rating (points)
    const ratingResponse = await fetch(
      `${API_URL}/presentations/${currentPresentation.id}/rate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          rating: note,
        }),
      }
    );

    if (!ratingResponse.ok) {
      const ratingResult = await ratingResponse.json();
      throw new Error(
        ratingResult.error || "Erreur lors de la mise à jour de la note"
      );
    }

    // Then update the feedback
    const feedbackResponse = await fetch(
      `${API_URL}/presentations/${currentPresentation.id}/feedback`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          feedback: feedback,
        }),
      }
    );

    if (!feedbackResponse.ok) {
      const feedbackResult = await feedbackResponse.json();
      throw new Error(
        feedbackResult.error || "Erreur lors de la mise à jour du feedback"
      );
    }

    messageEl.className = "teacher-grading-message success";
    messageEl.textContent = "Évaluation enregistrée avec succès! ✅";

    // Reset form and reload details after 2 seconds
    setTimeout(() => {
      noteInput.value = "";
      feedbackInput.value = "";
      messageEl.style.display = "none";
      loadPresentationDetails();
    }, 2000);
  } catch (err) {
    console.error("Teacher grading error:", err);
    messageEl.className = "teacher-grading-message error";
    messageEl.textContent = err.message || "Erreur lors de l'enregistrement";
  }
}

// Add these functions before the DOMContentLoaded event

function toggleDescriptionEdit() {
  document.getElementById("descriptionDisplay").style.display = "none";
  document.getElementById("descriptionEditForm").style.display = "block";

  // Pre-fill textarea with current description
  const currentDesc = currentPresentation.description || "";
  document.getElementById("descriptionTextarea").value = currentDesc;
}

function cancelDescriptionEdit() {
  document.getElementById("descriptionDisplay").style.display = "block";
  document.getElementById("descriptionEditForm").style.display = "none";
  document.getElementById("descriptionMessage").textContent = "";
}

async function saveDescription() {
  const textarea = document.getElementById("descriptionTextarea");
  const message = document.getElementById("descriptionMessage");
  const newDescription = textarea.value.trim();

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/presentations/${currentPresentation.id}/description`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          description: newDescription,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      message.style.color = "green";
      message.textContent = "Description mise à jour avec succès! ✅";

      // Update current presentation and UI
      currentPresentation.description = newDescription;
      document.getElementById("presDescription").textContent =
        newDescription || "Aucune description disponible";

      setTimeout(() => {
        cancelDescriptionEdit();
      }, 1500);
    } else {
      message.style.color = "red";
      message.textContent = result.error || "Erreur lors de la mise à jour";
    }
  } catch (err) {
    console.error("Update description error:", err);
    message.style.color = "red";
    message.textContent = "Impossible de mettre à jour la description";
  }
}

async function downloadPresentation() {
  if (!currentPresentation || !currentPresentation.path_file) {
    showAlert("There is nothing to download", 'info');
    return;
  }

  try {
    const user = getCurrentUser();
    const downloadUrl = `${API_URL}/presentations/${currentPresentation.id}/download?userId=${user.id}`;

    // Fetch the file first to check if it exists
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      // If file not found or error, alert user
      showAlert("There is nothing to download", 'info');
      return;
    }

    // Get blob from response
    const blob = await response.blob();

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = currentPresentation.name_file || "presentation.pptx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download error:", err);
    showAlert("Erreur lors du téléchargement", 'error');
  }
}

// Show error message
function showError(message) {
  document.getElementById("loadingMessage").style.display = "none";
  const errorEl = document.getElementById("errorMessage");
  errorEl.textContent = message;
  errorEl.style.display = "block";
}

// Toggle active status of presentation (teacher only)
async function toggleActive() {
  if (!currentPresentation) {
    showAlert("Aucune présentation chargée", 'warning');
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/";
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/presentations/${currentPresentation.id}/toggle-active`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      showAlert(result.message || "Statut actif basculé avec succès!", 'success');
      // Reload details to update UI
      loadPresentationDetails();
    } else {
      showAlert(result.error || "Erreur lors du basculement du statut actif", 'error');
    }
  } catch (err) {
    console.error("Toggle active error:", err);
    showAlert("Erreur lors du basculement du statut actif", 'error');
  }
}

// Upload presentation file
async function uploadPresentation() {
  const fileInput = document.getElementById("pptFile");
  const msg = document.getElementById("uploadMessage");

  if (!fileInput.files || !fileInput.files[0]) {
    msg.style.color = "red";
    msg.textContent = "Veuillez choisir un fichier PPT/PPTX.";
    return;
  }

  const file = fileInput.files[0];

  // Validate file type
  const allowed = [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/pdf", // Allow PDF files
  ];

  if (!allowed.includes(file.type) && !/\.(ppt|pptx|pdf)$/i.test(file.name)) {
    msg.style.color = "red";
    msg.textContent = "Format invalide. Choisissez un .ppt, .pptx ou .pdf.";
    return;
  }

  if (!currentPresentation) {
    msg.style.color = "red";
    msg.textContent = "Aucune présentation chargée.";
    return;
  }

  const formData = new FormData();
  formData.append("pptFile", file);
  formData.append("title", currentPresentation.title);
  formData.append("description", currentPresentation.description || "");
  formData.append("group_id", currentPresentation.group_id);
  formData.append("presentation_id", currentPresentation.id);

  msg.style.color = "";
  msg.textContent = "Téléversement en cours...";

  try {
    const response = await fetch(`${API_URL}/upload-ppt`, {
      method: "POST",
      body: formData,
    });

    let result = {};
    try {
      result = await response.json();
    } catch {}

    if (response.ok) {
      msg.style.color = "green";
      msg.textContent = result.message || "Fichier téléversé avec succès ✅";

      // Refresh presentation details
      setTimeout(() => {
        loadPresentationDetails();
        document.getElementById("uploadForm").reset();
        msg.textContent = "";
      }, 2000);
    } else {
      msg.style.color = "red";
      msg.textContent =
        result.message || result.error || "Échec du téléversement.";
    }
  } catch (err) {
    console.error(err);
    msg.style.color = "red";
    msg.textContent = "Impossible de joindre le serveur.";
  }
}

// Go back
function goBack() {
  window.history.back();
}

// Logout
function logout() {
  localStorage.removeItem("user");
  window.location.href = "/";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadPresentationDetails();

  // Handle upload form
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await uploadPresentation();
    });
  }

  // Handle rating form
  const ratingForm = document.getElementById("ratingForm");
  if (ratingForm) {
    ratingForm.addEventListener("submit", submitRating);
  }

  // Handle teacher grading form
  const teacherGradingForm = document.getElementById("teacherGradingForm");
  if (teacherGradingForm) {
    teacherGradingForm.addEventListener("submit", submitTeacherGrading);
  }
});
