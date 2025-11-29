const supabase = require('../configuration/supabase.js');
const supabaseAdmin = require('../configuration/supabaseAdmin.js');
const bcrypt = require('bcrypt');

async function checkUser(req, res) {
  try {
    const { nom, password } = req.body;

    if (!nom || !password) {
      return res.status(400).json({ message: 'Nom et mot de passe requis.' });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('nom', nom)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const baseUser = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };

    // If user already set a password, check bcrypt
    if (user.password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Identifiants incorrects.' });
      }
      return res.json({ success: true, user: baseUser });
    }

    // First connexion: password column empty, fall back to reset_password
    if (user.reset_password && password === user.reset_password) {
      return res.json({
        success: true,
        requirePasswordReset: true,
        user: baseUser,
      });
    }

    return res.status(401).json({ message: 'Identifiants incorrects.' });

  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
}

async function setPassword(req, res) {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'Paramètres manquants.' });
    }

    if (newPassword.length < 4) {
      return res
        .status(400)
        .json({ message: 'Le mot de passe doit contenir au moins 4 caractères.' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password: hashed, reset_password: null })
      .eq('id', userId);

    if (updateError) {
      console.error('setPassword update error:', updateError);
      return res.status(500).json({ message: updateError.message || "Erreur lors de la mise à jour" });
    }

    const baseUser = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };

    return res.json({ success: true, user: baseUser });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
}

async function getAllStudents(req, res) {
  try {
    const { data: students, error } = await supabase
      .from('users')
      .select('id, nom, prenom')
      .eq('role', 'STUDENT');

    if (error) {
      console.error('Supabase error in getAllStudents:', error);
      return res.status(500).json({ message: 'Erreur Supabase', error: error.message });
    }

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
}

async function resetStudentPassword(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('users')
      .update({ password: null, reset_password: '123' })
      .eq('id', id);

    if (error) {
      console.error('resetStudentPassword error:', error);
      return res.status(500).json({ message: error.message || 'Erreur lors de la réinitialisation' });
    }

    return res.status(200).json({ success: true, message: 'Mot de passe réinitialisé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
}

async function changeStudentGroup(req, res) {
  try {
    const { studentId } = req.params;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required.' });
    }

    // Enforce single group per student by replacing existing membership
    const { error: deleteError } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('user_id', studentId);

    if (deleteError) {
      console.error('changeStudentGroup delete error:', deleteError);
      return res.status(500).json({ message: 'Error updating group (delete step)', db_error: deleteError.message });
    }

    const { error: insertError } = await supabaseAdmin
      .from('group_members')
      .insert([{ user_id: studentId, group_id: groupId }]);

    if (insertError) {
      console.error('changeStudentGroup insert error:', insertError);
      return res.status(500).json({ message: 'Error updating group (insert step)', db_error: insertError.message });
    }

    return res.status(200).json({ success: true, message: 'Group changed successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { checkUser, setPassword, getAllStudents, resetStudentPassword, changeStudentGroup };
