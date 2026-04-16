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
  const [offering, setOffering] = useState(null);
  const [seeking, setSeeking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSeeking = (label) => {
    setSeeking(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  };

  const handleComplete = async () => {
    if (!offering) { setError("Please select what you can offer."); return; }
    if (seeking.length === 0) { setError("Please select at least one thing you want to learn."); return; }
    setLoading(true);
    setError("");

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
        offering: offering.label,
        offering_icon: offering.icon,
        seeking: seeking.join(","),
      })
    });

    const err = response.ok ? null : { message: `HTTP ${response.status}` };
    if (err) { setError(err.message); setLoading(false); }
    else onComplete();
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
    fontFamily: "'DM Sans', sans-serif",
  };

  const ghostBtn = {
    padding: "13px", background: "transparent",
    border: `1.5px solid ${C.sandDark}`, borderRadius: 100,
    color: C.barkLight, fontSize: 14, fontWeight: 500, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.cream,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "20px",
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
            bartr<span style={{ color: C.terracotta }}>.</span>
          </div>
          <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 16 }}>
            Step {step} of {totalSteps} — {step === 1 ? "About you" : step === 2 ? "What you offer" : "What you want to learn"}
          </div>
          {/* Progress bar */}
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
          borderRadius: 24, padding: "32px",
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
                  onChange={e => setFullName(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Your neighborhood</label>
                <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} style={{
                  ...inputStyle,
                  color: neighborhood ? C.bark : C.barkLight,
                  cursor: "pointer", appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A5C47' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center",
                }}>
                  <option value="" disabled>Select your neighborhood</option>
                  {Object.entries(NEIGHBORHOODS).map(([borough, hoods]) => (
                    <optgroup key={borough} label={`— ${borough} —`}>
                      {hoods.map(hood => (
                        <option key={hood} value={hood}>{hood}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Short bio <span style={{ color: C.sandDark }}>(optional)</span></label>
                <textarea placeholder="Tell people a bit about yourself..." value={bio}
                  onChange={e => setBio(e.target.value)} rows={3}
                  style={{ ...inputStyle, resize: "none" }} />
              </div>

              <button onClick={() => {
                if (!fullName) { setError("Please enter your name."); return; }
                if (!neighborhood) { setError("Please select your neighborhood."); return; }
                setError(""); setStep(2);
              }} style={{ ...primaryBtn, width: "100%" }}>Continue →</button>
              {error && <div style={{ color: C.terracotta, fontSize: 13, marginTop: 10 }}>{error}</div>}
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
                <SkillPicker mode="single" skills={SKILLS} value={offering} onChange={setOffering} />
              </div>

              {error && <div style={{ color: C.terracotta, fontSize: 13, marginBottom: 12 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setError(""); setStep(1); }} style={{ ...ghostBtn, flex: 1 }}>← Back</button>
                <button onClick={() => {
                  if (!offering) { setError("Pick something you can offer."); return; }
                  setError(""); setStep(3);
                }} style={{ ...primaryBtn, flex: 2 }}>Continue →</button>
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

              <div style={{ marginBottom: 16 }}>
                <SkillPicker mode="multi" skills={SKILLS} value={seeking}
                  onChange={toggleSeeking} exclude={offering?.label} />
              </div>

              {seeking.length > 0 && (
                <div style={{ fontSize: 12, color: C.clay, marginBottom: 12 }}>
                  {seeking.length} selected: {seeking.join(", ")}
                </div>
              )}

              {error && <div style={{ color: C.terracotta, fontSize: 13, marginBottom: 12 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setError(""); setStep(2); }} style={{ ...ghostBtn, flex: 1 }}>← Back</button>
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
