const supabase = require('../configuration/supabaseAdmin.js');

// Get all active presentations
exports.getActivePresentations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('active', true)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// Get user's group presentations
exports.getMyGroupPresentations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's group
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.json([]);
    }

    // Get group's presentations
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('group_id', membership.group_id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
};