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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setHasProfile(!!data);
    setProfile(data);
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
      setSession(session);
      if (session) await checkProfile(session.user.id);
    });
  }, []);

  const AppRoute = () => {
    if (loading) return null;
    if (!session) return <Auth />;
    if (!hasProfile) return <Onboarding user={session.user} onComplete={() => checkProfile(session.user.id)} />;
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
