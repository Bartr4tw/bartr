import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabase.js";
import Landing from "./pages/Landing.jsx";
import BartrApp from "./pages/BartrApp.jsx";
import Auth from "./pages/Auth.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import "./index.css";

function Root() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState(null);

  const checkProfile = async (userId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );
      const rows = await res.json();
      const row = rows[0] || null;
      setHasProfile(!!row);
      setProfile(row);
    } catch {
      setHasProfile(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        if (session) await checkProfile(session.user.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await checkProfile(session.user.id);
        setSession(session);
      } else {
        setSession(null);
        setHasProfile(false);
        setProfile(null);
      }
    });
  }, []);

  const AppRoute = () => {
    if (!session) return <Auth />;
    if (!hasProfile) return <Onboarding user={session.user} onComplete={() => { setHasProfile(true); checkProfile(session.user.id); }} />;
    return <BartrApp profile={profile} />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppRoute />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
