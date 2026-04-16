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

  const checkProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    setHasProfile(!!data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await checkProfile(session.user.id);
      setLoading(false);
    });
    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) await checkProfile(session.user.id);
    });
  }, []);

  if (loading) return <div style={{color:"white",padding:20}}>Loading...</div>;

  const AppRoute = () => {
    if (!session) return <Auth />;
    if (!hasProfile) return <Onboarding user={session.user} onComplete={() => setHasProfile(true)} />;
    return <BartrApp />;
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
