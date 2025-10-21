const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

// Create Supabase client with service role for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client for user operations (will use JWT tokens)
const supabaseUser = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey);

module.exports = {
  supabase,
  supabaseUser,
  supabaseUrl,
  supabaseServiceKey
};
