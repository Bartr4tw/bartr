import { createClient } from "@supabase/supabase-js"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Returns headers with the current user's session JWT so RLS auth.uid() works.
// Falls back to anon key if no session (e.g. pre-login public reads).
export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
  };
}
