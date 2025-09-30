// upload.js
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
  const allowed = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  if (!allowed.includes(file.type) && !/\.(ppt|pptx)$/i.test(file.name)) {
    msg.style.color = "red";
    msg.textContent = "Format invalide. Choisissez un .ppt ou .pptx.";
    return;
  }

  const formData = new FormData();
  formData.append("pptFile", file);

  msg.style.color = "";
  msg.textContent = "Téléversement en cours...";

  try {
    // ✅ same-origin
    const response = await fetch("/api/upload-ppt", {
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
