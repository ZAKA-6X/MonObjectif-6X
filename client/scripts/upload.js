// upload.js
const API_BASE = window.API_BASE_URL || "/api";

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("pptFile");
  const msg = document.getElementById("message");

  if (!fileInput.files || !fileInput.files[0]) {
    msg.style.color = "red";
    msg.textContent = "Veuillez choisir un fichier PPT/PPTX.";
    return;
  }

  const file = fileInput.files[0];
  // (Optional) quick client-side guard
  const allowed = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'];
  if (!allowed.includes(file.type) && !/\.(ppt|pptx|pdf)$/i.test(file.name)) {
    msg.style.color = "red";
    msg.textContent = "Format invalide. Choisissez un .ppt, .pptx ou .pdf.";
    return;
  }

  const formData = new FormData();
  formData.append("pptFile", file);

  msg.style.color = "";
  msg.textContent = "Téléversement en cours...";

  try {
    // ✅ use configured API base
    const response = await fetch(`${API_BASE}/upload-ppt`, {
      method: "POST",
      body: formData
    });

    let result = {};
    try { result = await response.json(); } catch {}

    if (response.ok) {
      msg.style.color = "green";
      msg.textContent = (result.message || "Téléversé.") + (result.publicUrl ? ` → ${result.publicUrl}` : "");
      // reset form
      e.target.reset();
    } else {
      msg.style.color = "red";
      msg.textContent = result.message || result.error || "Échec du téléversement.";
    }
  } catch (err) {
    console.error(err);
    msg.style.color = "red";
    msg.textContent = "Impossible de joindre le serveur.";
  }
});
