import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getAuthHeaders } from "../lib/supabase.js";
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
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [availability, setAvailability] = useState([]);
  const [swapPreference, setSwapPreference] = useState([]);
  const [offering, setOffering] = useState(null);
  const [seeking, setSeeking] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Trade request state
  const [activeTradeRequest, setActiveTradeRequest] = useState(null);
  const [trFormOpen, setTrFormOpen] = useState(false);
  const [trOffering, setTrOffering] = useState(null);
  const [trOfferingQty, setTrOfferingQty] = useState("1");
  const [trOfferingUnit, setTrOfferingUnit] = useState("session");
  const [trWanting, setTrWanting] = useState(null);
  const [trWantingQty, setTrWantingQty] = useState("1");
  const [trWantingUnit, setTrWantingUnit] = useState("session");
  const [trNote, setTrNote] = useState("");
  const [trSaving, setTrSaving] = useState(false);
  const [trError, setTrError] = useState("");

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
        setAge(p.age != null ? String(p.age) : "");
        setGender(p.gender || "");
        setInstagramHandle(p.instagram_handle || "");
        setLinkedinUrl(p.linkedin_url || "");
        setAvailability(Array.isArray(p.availability) ? p.availability : []);
        setSwapPreference(Array.isArray(p.swap_preference) ? p.swap_preference : []);
        setAvatarUrl(p.avatar_url || null);
        setAvatarPreview(p.avatar_url || null);
        const offeringSkill = SKILLS.find((s) => s.label === p.offering) || { icon: "✨", label: p.offering };
        setOffering(p.offering ? offeringSkill : null);
        setSeeking(p.seeking ? p.seeking.split(",").map((s) => s.trim()).filter(Boolean) : []);
      }
      // Fetch active trade request
      const trRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/trade_requests?user_id=eq.${session.user.id}&status=eq.open&limit=1`,
        { headers: await getAuthHeaders() }
      );
      const trRows = await trRes.json();
      if (Array.isArray(trRows) && trRows[0]) {
        const tr = trRows[0];
        setActiveTradeRequest(tr);
        setTrOffering({ icon: tr.offering_icon, label: tr.offering_skill });
        setTrOfferingQty(String(tr.offering_qty));
        setTrOfferingUnit(tr.offering_unit);
        setTrWanting({ icon: tr.wanting_icon, label: tr.wanting_skill });
        setTrWantingQty(String(tr.wanting_qty));
        setTrWantingUnit(tr.wanting_unit);
        setTrNote(tr.note || "");
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

  const handleTradeRequestSave = async () => {
    if (!trOffering) { setTrError("Please select the skill you're offering."); return; }
    if (!trWanting) { setTrError("Please select the skill you want."); return; }
    setTrError("");
    setTrSaving(true);
    const headers = await getAuthHeaders();
    const body = {
      user_id: currentUser.id,
      offering_skill: trOffering.label,
      offering_icon: trOffering.icon,
      offering_qty: parseInt(trOfferingQty, 10) || 1,
      offering_unit: trOfferingUnit,
      wanting_skill: trWanting.label,
      wanting_icon: trWanting.icon,
      wanting_qty: parseInt(trWantingQty, 10) || 1,
      wanting_unit: trWantingUnit,
      note: trNote.trim() || null,
      status: "open",
    };
    if (activeTradeRequest) {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/trade_requests?id=eq.${activeTradeRequest.id}`,
        { method: "PATCH", headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(body) }
      );
      setActiveTradeRequest({ ...activeTradeRequest, ...body });
    } else {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/trade_requests`,
        { method: "POST", headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(body) }
      );
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]) setActiveTradeRequest(rows[0]);
    }
    setTrFormOpen(false);
    setTrSaving(false);
  };

  const handleTradeRequestRemove = async () => {
    if (!activeTradeRequest) return;
    const headers = await getAuthHeaders();
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/trade_requests?id=eq.${activeTradeRequest.id}`,
      { method: "PATCH", headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ status: "closed" }) }
    );
    setActiveTradeRequest(null);
    setTrOffering(null);
    setTrOfferingQty("1");
    setTrOfferingUnit("session");
    setTrWanting(null);
    setTrWantingQty("1");
    setTrWantingUnit("session");
    setTrNote("");
    setTrFormOpen(false);
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
          age: age !== "" ? parseInt(age, 10) : null,
          gender: gender || null,
          instagram_handle: instagramHandle.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          availability: availability,
          swap_preference: swapPreference,
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
            <label style={labelStyle}>Your name <span style={{ color: C.terracotta }}>*</span></label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Neighborhood <span style={{ color: C.terracotta }}>*</span></label>
            <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
              style={{ ...selectStyle, color: neighborhood ? C.bark : C.barkLight }}>
              <option value="" disabled>Select your neighborhood</option>
              {Object.entries(NEIGHBORHOODS).map(([borough, hoods]) => (
                <optgroup key={borough} label={borough}>
                  {hoods.map((hood) => (
                    <option key={hood} value={hood}>{hood}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Age <span style={{ color: C.terracotta }}>*</span></label>
            <input
              type="number" min={13} max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Gender <span style={{ color: C.terracotta }}>*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Man", "Woman", "Non-binary", "Prefer not to say"].map((opt) => {
                const active = gender === opt;
                return (
                  <button key={opt} type="button"
                    onClick={() => setGender(active ? "" : opt)}
                    style={{
                      padding: "9px 16px", minHeight: 44, borderRadius: 100,
                      border: active ? `1.5px solid ${C.terracotta}` : `1.5px solid ${C.sandDark}`,
                      background: active ? "#FDF0EA" : C.sand,
                      color: active ? C.clayDeep : C.bark,
                      fontSize: 13, fontWeight: active ? 500 : 400,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >{opt}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Instagram <span style={{ color: C.sandDark }}>(optional)</span></label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@yourhandle"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>LinkedIn <span style={{ color: C.sandDark }}>(optional)</span></label>
            <input
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="linkedin.com/in/yourname"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Bio <span style={{ color: C.sandDark }}>(optional)</span></label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder="Tell people a bit about yourself..."
              style={{ ...inputStyle, resize: "none" }} />
          </div>
        </div>

        {/* Availability & Swap Preference */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark, marginBottom: 20 }}>
            Availability & preferences
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>When are you free? <span style={{ color: C.sandDark }}>(optional)</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Mornings", "Evenings", "Weekdays", "Weekends"].map((opt) => {
                const active = availability.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAvailability((prev) =>
                      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                    )}
                    style={{
                      padding: "9px 16px", minHeight: 40, borderRadius: 100,
                      border: active ? `1.5px solid ${C.terracotta}` : `1px solid ${C.sandDark}`,
                      background: active ? "rgba(212,113,74,0.1)" : C.sand,
                      color: active ? C.terracotta : C.barkLight,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >{opt}</button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>How do you prefer to meet? <span style={{ color: C.terracotta }}>*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["In person", "Virtual"].map((opt) => {
                const active = swapPreference.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSwapPreference((prev) =>
                      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                    )}
                    style={{
                      padding: "9px 16px", minHeight: 40, borderRadius: 100,
                      border: active ? `1.5px solid ${C.terracotta}` : `1px solid ${C.sandDark}`,
                      background: active ? "rgba(212,113,74,0.1)" : C.sand,
                      color: active ? C.terracotta : C.barkLight,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >{opt}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Offering */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark, marginBottom: 6 }}>
            What you offer <span style={{ color: C.terracotta, fontFamily: "'DM Sans', sans-serif", fontSize: 16 }}>*</span>
          </div>
          <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 16 }}>Pick one skill or hobby you'd love to share.</div>
          <SkillPicker mode="single" skills={SKILLS} value={offering} onChange={setOffering} />
        </div>

        {/* Seeking */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark, marginBottom: 6 }}>
            What you want to learn <span style={{ color: C.terracotta, fontFamily: "'DM Sans', sans-serif", fontSize: 16 }}>*</span>
          </div>
          <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 16 }}>Select one or more skills you're curious about.</div>
          <SkillPicker mode="multi" skills={SKILLS} value={seeking} onChange={toggleSeeking} exclude={offering?.label} />
          {seeking.length > 0 && (
            <div style={{ fontSize: 12, color: C.clay, marginTop: 12 }}>
              {seeking.length} selected: {seeking.join(", ")}
            </div>
          )}
        </div>

        {/* Trade Request */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark, marginBottom: 6 }}>
            Trade Request
          </div>
          <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 16 }}>
            Post one active offer, e.g. "1 haircut for 2 piano lessons."
          </div>

          {activeTradeRequest && !trFormOpen ? (
            // Preview card
            <div style={{
              background: "#FDF6EE", border: `1.5px solid ${C.clay}`,
              borderRadius: 14, padding: "16px 18px", marginBottom: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.barkLight, letterSpacing: 0.5, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>
                    Open Trade Request
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22 }}>{activeTradeRequest.offering_icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.bark }}>{activeTradeRequest.offering_skill}</div>
                      <div style={{ fontSize: 11, color: C.barkLight }}>{activeTradeRequest.offering_qty} {activeTradeRequest.offering_unit}</div>
                    </div>
                    <div style={{ fontSize: 18, color: C.clay, fontWeight: 600, padding: "0 4px" }}>⇄</div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22 }}>{activeTradeRequest.wanting_icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.bark }}>{activeTradeRequest.wanting_skill}</div>
                      <div style={{ fontSize: 11, color: C.barkLight }}>{activeTradeRequest.wanting_qty} {activeTradeRequest.wanting_unit}</div>
                    </div>
                  </div>
                  {activeTradeRequest.note && (
                    <div style={{ fontSize: 12, color: C.barkLight, fontStyle: "italic", marginTop: 10 }}>
                      {activeTradeRequest.note}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                  onClick={() => { setTrFormOpen(true); }}
                  style={{
                    flex: 1, padding: "9px", minHeight: 40, borderRadius: 100,
                    background: C.sand, border: `1px solid ${C.sandDark}`,
                    color: C.barkLight, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >Edit</button>
                <button
                  onClick={handleTradeRequestRemove}
                  style={{
                    flex: 1, padding: "9px", minHeight: 40, borderRadius: 100,
                    background: "rgba(212,113,74,0.07)", border: `1px solid rgba(212,113,74,0.25)`,
                    color: C.terracotta, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >Remove</button>
              </div>
            </div>
          ) : !trFormOpen ? (
            // Create button
            <button
              onClick={() => setTrFormOpen(true)}
              style={{
                width: "100%", padding: "13px", minHeight: 44,
                background: "rgba(192,122,82,0.07)", border: `1.5px dashed ${C.clay}`,
                borderRadius: 14, color: C.clay, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >+ Create trade request</button>
          ) : null}

          {trFormOpen && (
            <div style={{
              background: C.warmWhite, border: `1.5px solid ${C.sandDark}`,
              borderRadius: 14, padding: "18px",
            }}>
              {/* Offering skill */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>You offer</label>
                <SkillPicker mode="single" skills={SKILLS} value={trOffering} onChange={setTrOffering} />
              </div>

              {/* Offering qty + unit */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>How many?</label>
                  <input
                    type="number" min={1} max={10}
                    value={trOfferingQty}
                    onChange={(e) => setTrOfferingQty(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "flex", gap: 6, paddingBottom: 2 }}>
                  {["session", "hour"].map((u) => (
                    <button key={u} type="button"
                      onClick={() => setTrOfferingUnit(u)}
                      style={{
                        padding: "10px 14px", minHeight: 44, borderRadius: 100,
                        border: trOfferingUnit === u ? `1.5px solid ${C.terracotta}` : `1px solid ${C.sandDark}`,
                        background: trOfferingUnit === u ? "rgba(212,113,74,0.1)" : C.sand,
                        color: trOfferingUnit === u ? C.terracotta : C.barkLight,
                        fontSize: 13, fontWeight: trOfferingUnit === u ? 600 : 400,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      }}
                    >{u}</button>
                  ))}
                </div>
              </div>

              {/* Wanting skill */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>In exchange for</label>
                <SkillPicker mode="single" skills={SKILLS} value={trWanting} onChange={setTrWanting} exclude={trOffering?.label} />
              </div>

              {/* Wanting qty + unit */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>How many?</label>
                  <input
                    type="number" min={1} max={10}
                    value={trWantingQty}
                    onChange={(e) => setTrWantingQty(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "flex", gap: 6, paddingBottom: 2 }}>
                  {["session", "hour"].map((u) => (
                    <button key={u} type="button"
                      onClick={() => setTrWantingUnit(u)}
                      style={{
                        padding: "10px 14px", minHeight: 44, borderRadius: 100,
                        border: trWantingUnit === u ? `1.5px solid ${C.terracotta}` : `1px solid ${C.sandDark}`,
                        background: trWantingUnit === u ? "rgba(212,113,74,0.1)" : C.sand,
                        color: trWantingUnit === u ? C.terracotta : C.barkLight,
                        fontSize: 13, fontWeight: trWantingUnit === u ? 600 : 400,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      }}
                    >{u}</button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Note <span style={{ color: C.sandDark }}>(optional)</span></label>
                <input
                  type="text"
                  value={trNote}
                  onChange={(e) => setTrNote(e.target.value)}
                  placeholder="Any location or preference notes? (optional)"
                  style={inputStyle}
                />
              </div>

              {trError && (
                <div style={{
                  background: "rgba(212,113,74,0.08)", border: `1px solid rgba(212,113,74,0.25)`,
                  borderRadius: 10, padding: "10px 14px", marginBottom: 12,
                  fontSize: 13, color: C.terracotta,
                }}>{trError}</div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setTrFormOpen(false); setTrError(""); }}
                  style={{
                    flex: 1, padding: "12px", minHeight: 44, borderRadius: 100,
                    background: "transparent", border: `1px solid ${C.sandDark}`,
                    color: C.barkLight, fontSize: 13, fontWeight: 500, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >Cancel</button>
                <button
                  onClick={handleTradeRequestSave}
                  disabled={trSaving}
                  style={{
                    flex: 2, padding: "12px", minHeight: 44, borderRadius: 100,
                    background: C.terracotta, border: "none",
                    color: C.cream, fontSize: 13, fontWeight: 500,
                    cursor: trSaving ? "not-allowed" : "pointer",
                    opacity: trSaving ? 0.7 : 1,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >{trSaving ? "Saving..." : activeTradeRequest ? "Update request" : "Post request"}</button>
              </div>
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
