import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { NEIGHBORHOODS, SKILLS } from "../lib/skillsData.js";
import SkillPicker from "../components/SkillPicker.jsx";

const selectStyle = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, fontSize: 14, cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center",
};

const inputStyle = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, color: "#f9fafb", fontSize: 14,
};

const labelStyle = {
  fontSize: 11, color: "#6b7280", marginBottom: 6,
  letterSpacing: 0.5, fontWeight: 600, display: "block",
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

    // Upload new photo if one was selected
    let finalAvatarUrl = avatarUrl;
    if (avatarFile) {
      // Get a fresh session token — ensures storage gets the user's JWT, not the anon key
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
      // Cache-bust so the browser shows the new photo immediately
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
        height: "100vh", background: "#080b14",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#4b5563", fontFamily: "'DM Sans', sans-serif",
      }}>Loading...</div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#080b14",
      fontFamily: "'DM Sans', sans-serif", color: "#f3f4f6",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #4b5563; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #eab308 !important; }
        select option { background: #0f1623; color: #f9fafb; }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        height: 64, padding: "0 20px",
        background: "rgba(8,11,20,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => navigate("/app")}
          style={{
            background: "transparent", border: "none",
            color: "#9ca3af", fontSize: 20, cursor: "pointer", padding: 4,
          }}
        >‹</button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#f9fafb" }}>
          Edit Profile
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "#eab308", border: "none", borderRadius: 20,
            padding: "8px 18px", color: "#080b14",
            fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >{saving ? "Saving..." : "Save"}</button>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Photo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div style={{ position: "relative" }}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                style={{
                  width: 96, height: 96, borderRadius: "50%", objectFit: "cover",
                  border: "2px solid rgba(234,179,8,0.35)",
                }}
              />
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "rgba(234,179,8,0.1)", border: "2px solid rgba(234,179,8,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
                fontSize: 30, color: "#eab308",
              }}>
                {fullName ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
              </div>
            )}
            <label style={{
              position: "absolute", bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: "50%",
              background: "#eab308", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, border: "2px solid #080b14",
            }}>
              📷
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </label>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>
            {avatarFile ? "Photo ready to save" : "Tap 📷 to add a photo"}
          </div>
        </div>

        {/* Basic Info */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#f9fafb", marginBottom: 20 }}>
            About you
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>YOUR NAME</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>NEIGHBORHOOD</label>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              style={{ ...selectStyle, color: neighborhood ? "#f9fafb" : "#4b5563" }}
            >
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
            <label style={labelStyle}>BIO <span style={{ color: "#374151" }}>(optional)</span></label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell people a bit about yourself..."
              style={{
                ...inputStyle,
                resize: "none", fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
        </div>

        {/* Offering */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#f9fafb", marginBottom: 6 }}>
            What you offer
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Pick one skill or hobby you'd love to share.</div>
          <SkillPicker
            mode="single"
            skills={SKILLS}
            value={offering}
            onChange={setOffering}
          />
        </div>

        {/* Seeking */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#f9fafb", marginBottom: 6 }}>
            What you want to learn
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Select one or more skills you're curious about.</div>
          <SkillPicker
            mode="multi"
            skills={SKILLS}
            value={seeking}
            onChange={toggleSeeking}
            exclude={offering?.label}
          />
          {seeking.length > 0 && (
            <div style={{ fontSize: 12, color: "#eab308", marginTop: 12 }}>
              {seeking.length} selected: {seeking.join(", ")}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12, padding: "12px 16px",
            color: "#f87171", fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "16px", background: "#eab308",
            border: "none", borderRadius: 14, color: "#080b14",
            fontSize: 15, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}
