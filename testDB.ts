const _importMetaEnv = {};
(globalThis as any).import = { meta: { env: _importMetaEnv } };

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://nzlqolllmruntddyommw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'fake_key'; // We might get error if fake key is used but we'll try just connecting

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles:", error ? error.message : "Success");
}
run();
