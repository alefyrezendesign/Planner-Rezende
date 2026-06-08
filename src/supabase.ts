import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nzlqolllmruntddyommw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56bHFvbGxsbXJ1bnRkZHlvbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTc4NzYsImV4cCI6MjA5NTAzMzg3Nn0.Df6WAf_VsUrelmoWf2AFNPjuDbrLp72oAIA8CkKLZzg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
