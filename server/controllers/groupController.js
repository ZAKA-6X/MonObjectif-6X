const supabase = require('../configuration/supabase.js');

// Get user's group with members
const getMyGroup = async (req, res) => {
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
const getAllGroups = async (req, res) => {
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
    res.status(500).json({ message: 'Erreur lors de la récupération des groupes', error: a.message });
  }
};

// Get group by ID
const getGroupById = async (req, res) => {
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
const getGroupMembers = async (req, res) => {
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

const downloadGroupsNotPassed = async (req, res) => {
  try {
    // 1. Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('group')
      .select('id, name');

    if (groupsError) throw groupsError;

    // 2. Get all presentations that have a point
    const { data: presentationsWithPoints, error: presError } = await supabase
      .from('presentations')
      .select('group_id')
      .not('point', 'is', null);

    if (presError) throw presError;

    const passedGroupIds = new Set(presentationsWithPoints.map(p => p.group_id));

    // 3. Filter out groups that have passed
    const notPassedGroups = groups.filter(g => !passedGroupIds.has(g.id));

    // 4. For each not-passed group, get its members
    const groupsWithMembers = await Promise.all(
      notPassedGroups.map(async (group) => {
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('users(nom, prenom)')
          .eq('group_id', group.id);

        if (membersError) {
          console.error('Error fetching members for group', group.id, membersError);
          return { ...group, members: [] };
        }

        return { ...group, members: members.map(m => m.users) };
      })
    );

    // 5. Generate Excel file
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Groupes non passés');

    worksheet.columns = [
      { header: 'Groupe', key: 'name', width: 30 },
      { header: 'Membres', key: 'members', width: 50 },
    ];

    groupsWithMembers.forEach(group => {
      worksheet.addRow({
        name: group.name,
        members: group.members.map(m => `${m.prenom} ${m.nom}`).join(', '),
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'groupes-non-passes.xlsx'
    );

    await workbook.xlsx.write(res);
    res.status(200).end();

  } catch (error) {
    console.error('Error downloading groups not passed:', error);
    res.status(500).json({ message: 'Erreur lors du téléchargement du fichier', error: error.message });
  }
};

module.exports = {
  getMyGroup,
  getAllGroups,
  getGroupById,
  getGroupMembers,
  downloadGroupsNotPassed,
};