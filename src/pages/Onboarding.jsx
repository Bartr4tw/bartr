import { useState } from "react";
import { NEIGHBORHOODS, SKILLS } from "../lib/skillsData.js";
import SkillPicker from "../components/SkillPicker.jsx";

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

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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

  return (
    <div style={{
      minHeight: "100vh", background: "#080b14",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #4b5563; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #eab308 !important; }
        select option { background: #0f1623; color: #f9fafb; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 800, color: "#f9fafb", marginBottom: 4 }}>
            Bartr<span style={{ color: "#eab308" }}>.</span>
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Step {step} of {totalSteps} — {step === 1 ? "About you" : step === 2 ? "What you offer" : "What you want to learn"}
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 16 }}>
            <div style={{
              height: "100%", borderRadius: 2, background: "#eab308",
              width: `${(step / totalSteps) * 100}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>

        <div style={{
          background: "#0f1623", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 24, padding: "32px",
        }}>
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#f9fafb", marginBottom: 6 }}>
                Tell us about yourself
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
                This helps people know who they're trading with.
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>YOUR NAME</div>
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, color: "#f9fafb", fontSize: 14,
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>YOUR NEIGHBORHOOD</div>
                <select
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, color: neighborhood ? "#f9fafb" : "#4b5563",
                    fontSize: 14, cursor: "pointer", appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center",
                  }}
                >
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
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>
                  SHORT BIO <span style={{ color: "#374151" }}>(optional)</span>
                </div>
                <textarea
                  placeholder="Tell people a bit about yourself..."
                  value={bio} onChange={e => setBio(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, color: "#f9fafb", fontSize: 14,
                    resize: "none", fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>

              <button onClick={() => {
                if (!fullName) { setError("Please enter your name."); return; }
                if (!neighborhood) { setError("Please select your neighborhood."); return; }
                setError(""); setStep(2);
              }} style={{
                width: "100%", padding: "14px", background: "#eab308",
                border: "none", borderRadius: 12, color: "#080b14",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>Continue →</button>
              {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#f9fafb", marginBottom: 6 }}>
                What can you offer?
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
                Pick the skill or hobby you'd love to share with someone.
              </div>

              <div style={{ marginBottom: 24 }}>
                <SkillPicker
                  mode="single"
                  skills={SKILLS}
                  value={offering}
                  onChange={setOffering}
                />
              </div>

              {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setError(""); setStep(1); }} style={{
                  flex: 1, padding: "14px", background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                  color: "#9ca3af", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>← Back</button>
                <button onClick={() => {
                  if (!offering) { setError("Pick something you can offer."); return; }
                  setError(""); setStep(3);
                }} style={{
                  flex: 2, padding: "14px", background: "#eab308",
                  border: "none", borderRadius: 12, color: "#080b14",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: "#f9fafb", marginBottom: 6 }}>
                What do you want to learn?
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
                Pick one or more skills or hobbies you're curious about.
              </div>

              <div style={{ marginBottom: 16 }}>
                <SkillPicker
                  mode="multi"
                  skills={SKILLS}
                  value={seeking}
                  onChange={toggleSeeking}
                  exclude={offering?.label}
                />
              </div>

              {seeking.length > 0 && (
                <div style={{ fontSize: 12, color: "#eab308", marginBottom: 12 }}>
                  {seeking.length} selected: {seeking.join(", ")}
                </div>
              )}

              {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setError(""); setStep(2); }} style={{
                  flex: 1, padding: "14px", background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                  color: "#9ca3af", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>← Back</button>
                <button onClick={handleComplete} disabled={loading} style={{
                  flex: 2, padding: "14px", background: "#eab308",
                  border: "none", borderRadius: 12, color: "#080b14",
                  fontSize: 14, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? "Saving..." : "Let's go ⚡"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
