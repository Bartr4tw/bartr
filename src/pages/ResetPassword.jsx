import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Supabase processes the recovery token from the URL hash automatically.
  // onAuthStateChange fires with PASSWORD_RECOVERY once it's valid.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => { window.location.href = "/app"; }, 2000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080b14",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #4b5563; }
        input:focus { outline: none; border-color: #eab308 !important; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 420,
        background: "#0f1623",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 24, overflow: "hidden",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #111827, #1a2235)",
          padding: "32px 32px 24px",
          borderBottom: "1px solid rgba(234,179,8,0.08)",
          textAlign: "center",
        }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32, fontWeight: 800, color: "#f9fafb", letterSpacing: -0.5,
              marginBottom: 4,
            }}>
              Bartr<span style={{ color: "#eab308" }}>.</span>
            </div>
          </a>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Set a new password</div>
        </div>

        <div style={{ padding: "28px 32px 32px" }}>
          {success ? (
            <div style={{
              background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)",
              borderRadius: 10, padding: "14px 16px",
              fontSize: 14, color: "#eab308", textAlign: "center", lineHeight: 1.6,
            }}>
              Password updated! Redirecting you in...
            </div>
          ) : !ready ? (
            <div style={{ textAlign: "center", color: "#4b5563", fontSize: 14, padding: "20px 0" }}>
              Verifying reset link...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>NEW PASSWORD</div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, color: "#f9fafb", fontSize: 14,
                  }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>CONFIRM PASSWORD</div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  style={{
                    width: "100%", padding: "12px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, color: "#f9fafb", fontSize: 14,
                  }}
                />
              </div>

              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                  fontSize: 13, color: "#f87171",
                }}>{error}</div>
              )}

              <button onClick={handleReset} disabled={loading} style={{
                width: "100%", padding: "14px",
                background: "#eab308", border: "none", borderRadius: 12,
                color: "#080b14", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Saving..." : "Set new password"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
