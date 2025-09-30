const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE   // ⚠️ clé secrète, jamais côté client
);

module.exports = supabaseAdmin;
