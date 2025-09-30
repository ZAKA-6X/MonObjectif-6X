const supabase = require('../configuration/supabase.js');

// Get user's group with members
exports.getMyGroup = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's group membership
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.json({ group: null, members: [] });
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('group')
      .select('*')
      .eq('id', membership.group_id)
      .single();

    if (groupError) throw groupError;

    // Get all members of the group
    const { data: memberIds, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', membership.group_id);

    if (membersError) throw membersError;

    // Get user details for each member (only select existing columns)
    const userIds = memberIds.map(m => m.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, nom, prenom, role')
      .in('id', userIds);

    if (usersError) throw usersError;

    res.json({ group, members: users || [] });
  } catch (error) {
    console.error('Group fetch error:', error);
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// Get all groups for teacher with member count
exports.getAllGroups = async (req, res) => {
  try {
    // Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('group')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupsError) throw groupsError;

    // Get member counts for each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const { count, error: countError } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        if (countError) {
          console.error('Error counting members:', countError);
          return { ...group, memberCount: 0 };
        }

        return { ...group, memberCount: count || 0 };
      })
    );

    res.json({ groups: groupsWithMembers });
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des groupes', error: error.message });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const { data: group, error: groupError } = await supabase
      .from('group')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return res.status(404).json({ message: 'Groupe non trouvé' });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du groupe', error: error.message });
  }
};

// Get group members by group ID
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get all members of the group
    const { data: memberIds, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (membersError) throw membersError;

    if (!memberIds || memberIds.length === 0) {
      return res.json({ members: [] });
    }

    // Get user details for each member
    const userIds = memberIds.map(m => m.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, nom, prenom, role')
      .in('id', userIds);

    if (usersError) throw usersError;

    res.json({ members: users || [] });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des membres', error: error.message });
  }
};
