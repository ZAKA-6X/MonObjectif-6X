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

// ✅ NEW: Get presentations by groupId (used by group-detail.js)
exports.getPresentationsByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;

    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('group_id', groupId)
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

// Create an empty active presentation for a group with auto-incremented title
exports.addAutoPresentation = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) return res.status(400).json({ message: 'groupId manquant' });

    // Count existing presentations in the group to compute next number
    const { count, error: countError } = await supabase
      .from('presentations')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);
    if (countError) throw countError;

    const next = (count ?? 0) + 1;
    const title = `Présentation ${next}`;

    const { data, error: insertError } = await supabase
      .from('presentations')
      .insert([{
        title,
        description: null,
        name_file: null,
        path_file: null,
        group_id: groupId,
        feedback: null,
        active: true,
        point: null,          // REAL can stay null
        // uploaded_at default now()
      }])
      .select('*')
      .single();

    if (insertError) throw insertError;
    return res.status(201).json(data);
  } catch (error) {
    console.error('addAutoPresentation error:', error);
    return res.status(500).json({ message: 'Erreur lors de la création automatique', error: error.message });
  }
};
