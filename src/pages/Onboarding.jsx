import { useState } from "react";
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

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || "");
  const [neighborhood, setNeighborhood] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [offering, setOffering] = useState(null);
  const [seeking, setSeeking] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [swapPreference, setSwapPreference] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const clearError = (field) => setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const toggleSeeking = (label) => {
    setSeeking((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
    clearError("seeking");
  };

  const handleComplete = async () => {
    const errs = {};
    if (!offering) errs.offering = "This field is required";
    if (seeking.length === 0) errs.seeking = "This field is required";
    if (swapPreference.length === 0) errs.swapPreference = "Please select at least one option";
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setLoading(true);
    setFieldErrors({});

    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session?.access_token}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        id: user.id,
        full_name: fullName,
        location: neighborhood,
        bio,
        age: age !== "" ? parseInt(age, 10) : null,
        gender: gender || null,
        offering: offering.label,
        offering_icon: offering.icon,
        seeking: seeking.join(","),
        availability,
        swap_preference: swapPreference,
      })
    });

    if (!response.ok) {
      setFieldErrors({ save: `HTTP ${response.status}` });
      setLoading(false);
    } else {
      onComplete();
    }
  };

  const totalSteps = 3;

  const inputStyle = {
    width: "100%", padding: "12px 16px",
    background: C.sand, border: `1px solid ${C.sandDark}`,
    borderRadius: 12, color: C.bark, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  };

  const labelStyle = {
    fontSize: 11, color: C.barkLight, marginBottom: 6,
    letterSpacing: 0.5, fontWeight: 500, display: "block",
    textTransform: "uppercase",
  };

  const primaryBtn = {
    padding: "13px", background: C.terracotta,
    border: "none", borderRadius: 100, color: C.cream,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", minHeight: 44,
  };

  const ghostBtn = {
    padding: "13px", background: "transparent",
    border: `1.5px solid ${C.sandDark}`, borderRadius: 100,
    color: C.barkLight, fontSize: 14, fontWeight: 500, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", minHeight: 44,
  };

  const fieldError = (field) => fieldErrors[field] ? (
    <div style={{ fontSize: 12, color: C.barkLight, marginTop: 6 }}>{fieldErrors[field]}</div>
  ) : null;

  return (
    <div style={{
      minHeight: "100vh", background: C.cream,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "24px 16px 40px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${C.barkLight}; opacity: 0.5; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${C.terracotta} !important; }
        select option { background: ${C.warmWhite}; color: ${C.bark}; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, color: C.clayDeep, marginBottom: 4, letterSpacing: -0.5 }}>
            Bartr<span style={{ color: C.terracotta }}>.</span>
          </div>
          <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 16 }}>
            Step {step} of {totalSteps}: {step === 1 ? "About you" : step === 2 ? "What you offer" : "What you want to learn"}
          </div>
          <div style={{ height: 3, background: C.sandDark, borderRadius: 2 }}>
            <div style={{
              height: "100%", borderRadius: 2, background: C.terracotta,
              width: `${(step / totalSteps) * 100}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>

        <div style={{
          background: C.warmWhite, border: `1.5px solid ${C.sandDark}`,
          borderRadius: 24, padding: "24px 20px",
          boxShadow: "0 4px 20px rgba(74,55,40,0.08)",
        }}>

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: C.bark, marginBottom: 6 }}>
                Tell us about yourself
              </div>
              <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 24, lineHeight: 1.5 }}>
                This helps people know who they're trading with.
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Your name</label>
                <input type="text" placeholder="Your name" value={fullName}
                  onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
                  style={{
                    ...inputStyle,
                    border: `1px solid ${fieldErrors.fullName ? C.terracotta : C.sandDark}`,
                  }} />
                {fieldError("fullName")}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Your neighborhood</label>
                <select value={neighborhood}
                  onChange={(e) => { setNeighborhood(e.target.value); clearError("neighborhood"); }}
                  style={{
                    ...inputStyle,
                    color: neighborhood ? C.bark : C.barkLight,
                    cursor: "pointer", appearance: "none",
                    border: `1px solid ${fieldErrors.neighborhood ? C.terracotta : C.sandDark}`,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A5C47' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center",
                  }}>
                  <option value="" disabled>Select your neighborhood</option>
                  {Object.entries(NEIGHBORHOODS).map(([borough, hoods]) => (
                    <optgroup key={borough} label={borough}>
                      {hoods.map((hood) => (
                        <option key={hood} value={hood}>{hood}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {fieldError("neighborhood")}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Age</label>
                <input type="number" min={18} max={99} placeholder="e.g. 28"
                  value={age}
                  onChange={(e) => { setAge(e.target.value); clearError("age"); }}
                  style={{
                    ...inputStyle,
                    border: `1px solid ${fieldErrors.age ? C.terracotta : C.sandDark}`,
                  }} />
                {fieldError("age")}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Gender</label>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 8,
                  padding: fieldErrors.gender ? 6 : 0,
                  border: fieldErrors.gender ? `1.5px solid ${C.terracotta}` : "1.5px solid transparent",
                  borderRadius: 12, transition: "border 0.15s",
                }}>
                  {["Man", "Woman", "Non-binary", "Prefer not to say"].map((opt) => {
                    const active = gender === opt;
                    return (
                      <button key={opt} type="button"
                        onClick={() => { setGender(active ? "" : opt); clearError("gender"); }}
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
                {fieldError("gender")}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Short bio <span style={{ color: C.sandDark }}>(optional)</span></label>
                <textarea placeholder="Tell people a bit about yourself..." value={bio}
                  onChange={(e) => setBio(e.target.value)} rows={3}
                  style={{ ...inputStyle, resize: "none" }} />
              </div>

              <button
                onClick={() => {
                  const errs = {};
                  if (!fullName.trim()) errs.fullName = "This field is required";
                  if (!neighborhood) errs.neighborhood = "This field is required";
                  const ageNum = parseInt(age, 10);
                  if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
                    errs.age = "Please enter a valid age between 18 and 99";
                  }
                  if (!gender) errs.gender = "Please select a gender";
                  if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
                  setFieldErrors({});
                  setStep(2);
                }}
                style={{ ...primaryBtn, width: "100%" }}
              >Continue →</button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: C.bark, marginBottom: 6 }}>
                What can you offer?
              </div>
              <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 24, lineHeight: 1.5 }}>
                Pick the skill or hobby you'd love to share with someone.
              </div>

              <div style={{ marginBottom: 24 }}>
                <SkillPicker mode="single" skills={SKILLS} value={offering}
                  onChange={(v) => { setOffering(v); clearError("offering"); }} />
              </div>

              {fieldErrors.offering && (
                <div style={{ fontSize: 12, color: C.barkLight, marginBottom: 12 }}>{fieldErrors.offering}</div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setFieldErrors({}); setStep(1); }} style={{ ...ghostBtn, flex: 1 }}>← Back</button>
                <button
                  onClick={() => {
                    if (!offering) { setFieldErrors({ offering: "This field is required" }); return; }
                    setFieldErrors({});
                    setStep(3);
                  }}
                  style={{ ...primaryBtn, flex: 2 }}
                >Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: C.bark, marginBottom: 6 }}>
                What do you want to learn?
              </div>
              <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 24, lineHeight: 1.5 }}>
                Pick one or more skills or hobbies you're curious about.
              </div>

              <div style={{
                marginBottom: 8,
                border: fieldErrors.seeking ? `1.5px solid ${C.terracotta}` : "1.5px solid transparent",
                borderRadius: 14, padding: fieldErrors.seeking ? 6 : 0,
                transition: "border 0.15s",
              }}>
                <SkillPicker mode="multi" skills={SKILLS} value={seeking}
                  onChange={toggleSeeking} exclude={offering?.label} />
              </div>

              {fieldError("seeking")}

              {seeking.length > 0 && (
                <div style={{ fontSize: 12, color: C.clay, marginBottom: 12 }}>
                  {seeking.length} selected: {seeking.join(", ")}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>When are you free? <span style={{ color: C.sandDark }}>(optional)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Mornings", "Evenings", "Weekdays", "Weekends"].map((opt) => {
                    const active = availability.includes(opt);
                    return (
                      <button key={opt} type="button"
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

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>How do you prefer to meet?</label>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 8,
                  padding: fieldErrors.swapPreference ? 6 : 0,
                  border: fieldErrors.swapPreference ? `1.5px solid ${C.terracotta}` : "1.5px solid transparent",
                  borderRadius: 12, transition: "border 0.15s",
                }}>
                  {["In person", "Virtual"].map((opt) => {
                    const active = swapPreference.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => {
                          setSwapPreference((prev) =>
                            prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                          );
                          clearError("swapPreference");
                        }}
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
                {fieldError("swapPreference")}
              </div>

              {fieldErrors.save && (
                <div style={{ fontSize: 12, color: C.barkLight, marginBottom: 12 }}>{fieldErrors.save}</div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setFieldErrors({}); setStep(2); }} style={{ ...ghostBtn, flex: 1 }}>← Back</button>
                <button onClick={handleComplete} disabled={loading} style={{
                  ...primaryBtn, flex: 2,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? "Saving..." : "Let's go →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
