const express = require('express');
const multer = require('multer');
const path = require('path');
const supabase = require('../configuration/supabaseAdmin.js');

const router = express.Router();

// mémoire (pas d'écriture disque)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ok = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ].includes(file.mimetype);
    if (!ok) return cb(new Error('Seuls les fichiers PPT/PPTX sont autorisés.'));
    cb(null, true);
  }
});

// POST /api/upload-ppt
router.post('/upload-ppt', upload.single('pptFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });

    const { title, description, group_id, presentation_id } = req.body;

    const original = req.file.originalname;
    const ext = path.extname(original).toLowerCase();
    const base = path.basename(original, ext).replace(/[^\w\-]+/g, '-').toLowerCase();
    const timestamp = Date.now();
    const storagePath = `presentations/${base}-${timestamp}${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('presentation-ppts')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(400).json({ message: 'Échec upload Supabase', error: error.message });
    }

    const { data: pub } = supabase.storage.from('presentation-ppts').getPublicUrl(storagePath);
    const publicUrl = pub?.publicUrl || null;

    // UPDATE if presentation_id exists, INSERT otherwise
    if (presentation_id) {
      const { data: dbData, error: dbError } = await supabase
        .from('presentations')
        .update({
          name_file: original,
          path_file: storagePath,
          uploaded_at: new Date().toISOString()
        })
        .eq('id', presentation_id)
        .select();

      if (dbError) {
        return res.status(500).json({ message: 'Erreur mise à jour DB', error: dbError.message });
      }

      return res.json({
        message: 'Fichier mis à jour ✅',
        path: storagePath,
        publicUrl,
        presentation: dbData[0]
      });
    } else {
      // Original INSERT logic
      const { data: dbData, error: dbError } = await supabase
        .from('presentations')
        .insert([{
          title: title || original,
          description: description || null,
          name_file: original,
          path_file: storagePath,
          group_id: group_id || null,
          point: 0,
          feedback: null
        }])
        .select();

      if (dbError) {
        return res.status(500).json({ message: 'Erreur insertion DB', error: dbError.message });
      }

      return res.json({
        message: 'Upload réussi ✅',
        path: storagePath,
        publicUrl,
        presentation: dbData[0]
      });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;