const _importMetaEnv = {};
(globalThis as any).import = { meta: { env: _importMetaEnv } };
import { supabase } from './src/supabase';

async function run() {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("Logged in user:", session?.user?.email);
  const { data: tasks, error } = await supabase.from('tasks').select('*');
  if (error) {
    console.error("Fetch error:", error);
    return;
  }
  console.log("Found", tasks?.length, "tasks");
  tasks?.forEach(t => {
    if (t.subtasks && !Array.isArray(t.subtasks)) {
      console.log("CORRUPTED SUBTASKS on task", t.title, ":", typeof t.subtasks, t.subtasks);
    }
  });
}
run();
