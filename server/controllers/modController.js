const { supabase } = require('../configuration/supabase');

const isMod = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const { data, error } = await supabase
            .from('mods')
            .select('user_id')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // PostgREST error for "Not a single row was returned"
                return res.status(200).json({ isMod: false });
            }
            throw error;
        }

        if (data) {
            res.status(200).json({ isMod: true });
        } else {
            res.status(200).json({ isMod: false });
        }
    } catch (error) {
        console.error('Error checking mod status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    isMod,
};
