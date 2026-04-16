import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { NEIGHBORHOODS, SKILLS } from "../lib/skillsData.js";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [bio, setBio] = useState("");
  const [offering, setOffering] = useState(null);
  const [seeking, setSeeking] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/auth"; return; }
      setCurrentUser(session.user);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=*`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );
      const rows = await res.json();
      const p = rows[0];
      if (p) {
        setFullName(p.full_name || "");
        setNeighborhood(p.location || "");
        setBio(p.bio || "");
        const offeringSkill = SKILLS.find((s) => s.label === p.offering) || null;
        setOffering(offeringSkill);
        setSeeking(p.seeking ? p.seeking.split(",").map((s) => s.trim()).filter(Boolean) : []);
      }
      setLoading(false);
    });
  }, []);

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

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          location: neighborhood,
          bio: bio.trim(),
          offering: offering.label,
          offering_icon: offering.icon,
          seeking: seeking.join(","),
        }),
      }
    );

    if (!res.ok) {
      setError(`Save failed (${res.status}). Please try again.`);
      setSaving(false);
      return;
    }

    // Full reload so main.jsx re-fetches the updated profile via checkProfile
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
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10, maxHeight: 320, overflowY: "auto",
          }}>
            {SKILLS.map((skill) => (
              <button key={skill.label} onClick={() => setOffering(skill)} style={{
                padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                background: offering?.label === skill.label ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.03)",
                border: offering?.label === skill.label ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 24 }}>{skill.icon}</span>
                <span style={{ fontSize: 11, color: offering?.label === skill.label ? "#eab308" : "#9ca3af", fontWeight: 600 }}>{skill.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seeking */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#f9fafb", marginBottom: 6 }}>
            What you want to learn
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Select one or more skills you're curious about.</div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10, maxHeight: 320, overflowY: "auto",
          }}>
            {SKILLS.filter((s) => s.label !== offering?.label).map((skill) => (
              <button key={skill.label} onClick={() => toggleSeeking(skill.label)} style={{
                padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                background: seeking.includes(skill.label) ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.03)",
                border: seeking.includes(skill.label) ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 24 }}>{skill.icon}</span>
                <span style={{ fontSize: 11, color: seeking.includes(skill.label) ? "#eab308" : "#9ca3af", fontWeight: 600 }}>{skill.label}</span>
              </button>
            ))}
          </div>
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
