import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { NEIGHBORHOODS, SKILLS } from "../lib/skillsData.js";
import SkillPicker from "../components/SkillPicker.jsx";

const C = {
  cream: "#FAF6EE", warmWhite: "#FDFAF4",
  sand: "#F5EFE0", sandDark: "#EDE3CC",
  clay: "#C07A52", clayDeep: "#9B5C38",
  terracotta: "#D4714A",
  bark: "#4A3728", barkLight: "#7A5C47",
};

const inputStyle = {
  width: "100%", padding: "12px 16px",
  background: C.sand, border: `1px solid ${C.sandDark}`,
  borderRadius: 12, color: C.bark, fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A5C47' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center",
};

const labelStyle = {
  fontSize: 11, color: C.barkLight, marginBottom: 6,
  letterSpacing: 0.5, fontWeight: 500, display: "block",
  textTransform: "uppercase",
};

export default function EditProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [bio, setBio] = useState("");
  const [offering, setOffering] = useState(null);
  const [seeking, setSeeking] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/auth"; return; }
      setCurrentUser(session.user);
      setSessionToken(session.access_token);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=*`,
        { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` } }
      );
      const rows = await res.json();
      const p = rows[0];
      if (p) {
        setFullName(p.full_name || "");
        setNeighborhood(p.location || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatar_url || null);
        setAvatarPreview(p.avatar_url || null);
        const offeringSkill = SKILLS.find((s) => s.label === p.offering) || { icon: "✨", label: p.offering };
        setOffering(p.offering ? offeringSkill : null);
        setSeeking(p.seeking ? p.seeking.split(",").map((s) => s.trim()).filter(Boolean) : []);
      }
      setLoading(false);
    });
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const toggleSeeking = (label) => {
    setSeeking((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleSave = async () => {
    if (!fullName.trim()) { setError("Please enter your name."); return; }
    if (!neighborhood) { setError("Please select your neighborhood."); return; }
    if (!offering) { setError("Please select what you can offer."); return; }
    if (seeking.length === 0) { setError("Please select at least one thing you want to learn."); return; }

    setSaving(true);
    setError("");

    let finalAvatarUrl = avatarUrl;
    if (avatarFile) {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession?.access_token) {
        setError("Session expired. Please refresh the page and try again.");
        setSaving(false);
        return;
      }
      const ext = avatarFile.name.split(".").pop().toLowerCase();
      const path = `${currentUser.id}.${ext}`;
      const uploadRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/avatars/${path}`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${freshSession.access_token}`,
            "Content-Type": avatarFile.type,
            "x-upsert": "true",
          },
          body: avatarFile,
        }
      );
      if (!uploadRes.ok) {
        const msg = await uploadRes.text().catch(() => uploadRes.status);
        setError(`Photo upload failed: ${msg}`);
        setSaving(false);
        return;
      }
      finalAvatarUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`;
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`,
      {
        method: "PATCH",
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${sessionToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          location: neighborhood,
          bio: bio.trim(),
          offering: offering.label,
          offering_icon: offering.icon,
          seeking: seeking.join(","),
          avatar_url: finalAvatarUrl,
        }),
      }
    );

    if (!res.ok) {
      setError(`Save failed (${res.status}). Please try again.`);
      setSaving(false);
      return;
    }

    window.location.href = "/app";
  };

  if (loading) {
    return (
      <div style={{
        height: "100vh", background: C.cream,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: C.barkLight, fontFamily: "'DM Sans', sans-serif",
      }}>Loading...</div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.cream,
      fontFamily: "'DM Sans', sans-serif", color: C.bark,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${C.barkLight}; opacity: 0.5; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${C.terracotta} !important; }
        select option { background: ${C.warmWhite}; color: ${C.bark}; }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        height: 64, padding: "0 20px",
        background: C.warmWhite,
        borderBottom: `1px solid ${C.sandDark}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={() => navigate("/app")} style={{
          background: "transparent", border: "none",
          color: C.barkLight, fontSize: 20, cursor: "pointer",
          padding: "0 8px", minWidth: 44, minHeight: 44,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>‹</button>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark }}>
          Edit Profile
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          background: C.terracotta, border: "none", borderRadius: 100,
          padding: "8px 18px", color: C.cream,
          fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif",
          minHeight: 44,
        }}>{saving ? "Saving..." : "Save"}</button>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Photo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div style={{ position: "relative" }}>
            {avatarPreview ? (
              <img src={avatarPreview} style={{
                width: 96, height: 96, borderRadius: "50%", objectFit: "cover",
                border: `2px solid ${C.sandDark}`,
              }} />
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: C.sand, border: `2px solid ${C.sandDark}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Fraunces', serif", fontWeight: 600,
                fontSize: 30, color: C.terracotta,
              }}>
                {fullName ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
              </div>
            )}
            <label style={{
              position: "absolute", bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: "50%",
              background: C.terracotta, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, border: `2px solid ${C.cream}`,
            }}>
              📷
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </label>
          </div>
          <div style={{ fontSize: 12, color: C.barkLight, marginTop: 10 }}>
            {avatarFile ? "Photo ready to save" : "Tap 📷 to add a photo"}
          </div>
        </div>

        {/* Basic Info */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark, marginBottom: 20 }}>
            About you
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Your name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Neighborhood</label>
            <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
              style={{ ...selectStyle, color: neighborhood ? C.bark : C.barkLight }}>
              <option value="" disabled>Select your neighborhood</option>
              {Object.entries(NEIGHBORHOODS).map(([borough, hoods]) => (
                <optgroup key={borough} label={`— ${borough} —`}>
                  {hoods.map((hood) => (
                    <option key={hood} value={hood}>{hood}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Bio <span style={{ color: C.sandDark }}>(optional)</span></label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder="Tell people a bit about yourself..."
              style={{ ...inputStyle, resize: "none" }} />
          </div>
        </div>

        {/* Offering */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark, marginBottom: 6 }}>
            What you offer
          </div>
          <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 16 }}>Pick one skill or hobby you'd love to share.</div>
          <SkillPicker mode="single" skills={SKILLS} value={offering} onChange={setOffering} />
        </div>

        {/* Seeking */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark, marginBottom: 6 }}>
            What you want to learn
          </div>
          <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 16 }}>Select one or more skills you're curious about.</div>
          <SkillPicker mode="multi" skills={SKILLS} value={seeking} onChange={toggleSeeking} exclude={offering?.label} />
          {seeking.length > 0 && (
            <div style={{ fontSize: 12, color: C.clay, marginTop: 12 }}>
              {seeking.length} selected: {seeking.join(", ")}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: "rgba(212,113,74,0.08)", border: `1px solid rgba(212,113,74,0.25)`,
            borderRadius: 12, padding: "12px 16px",
            color: C.terracotta, fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", padding: "14px", background: C.terracotta,
          border: "none", borderRadius: 100, color: C.cream,
          fontSize: 15, fontWeight: 500,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
          fontFamily: "'DM Sans', sans-serif", minHeight: 44,
        }}>{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}
