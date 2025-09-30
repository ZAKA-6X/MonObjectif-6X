const supabase = require('../configuration/supabase.js');

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

    // Check reset_password (plain text for now)
    if (password !== user.reset_password) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    // Return user with role (without passwords)
    return res.json({ 
      success: true, 
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email || null,
        role: user.role
      }
    });

  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
}

module.exports = { checkUser };