import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify the caller's JWT to get their user ID
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userError } = await anonClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const uid = user.id;

  // Use service role client — bypasses RLS for all deletes
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Delete all user data in parallel
  await Promise.all([
    admin.from("messages").delete().eq("sender_id", uid),
    admin.from("messages").delete().eq("receiver_id", uid),
    admin.from("swipes").delete().eq("swiper_id", uid),
    admin.from("swipes").delete().eq("swiped_id", uid),
    admin.from("matches").delete().eq("user_a", uid),
    admin.from("matches").delete().eq("user_b", uid),
    admin.from("trade_requests").delete().eq("user_id", uid),
  ]);

  // Delete profile row after related data is gone
  await admin.from("profiles").delete().eq("id", uid);

  // Delete the auth user last
  const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
