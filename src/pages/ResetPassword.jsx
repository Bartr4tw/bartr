import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const C = {
  cream: "#FAF6EE", warmWhite: "#FDFAF4",
  sand: "#F5EFE0", sandDark: "#EDE3CC",
  clay: "#C07A52", clayDeep: "#9B5C38",
  terracotta: "#D4714A",
  bark: "#4A3728", barkLight: "#7A5C47",
};

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

  return (
    <div style={{
      minHeight: "100vh", background: C.cream,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: ${C.barkLight}; opacity: 0.5; }
        input:focus { outline: none; border-color: ${C.terracotta} !important; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 420,
        background: C.warmWhite,
        border: `1.5px solid ${C.sandDark}`,
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 8px 32px rgba(74,55,40,0.1)",
      }}>
        <div style={{
          background: C.sand,
          padding: "32px 32px 24px",
          borderBottom: `1px solid ${C.sandDark}`,
          textAlign: "center",
        }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 32, fontWeight: 600, color: C.clayDeep, letterSpacing: -0.5,
              marginBottom: 4,
            }}>
              bartr<span style={{ color: C.terracotta }}>.</span>
            </div>
          </a>
          <div style={{ fontSize: 13, color: C.barkLight }}>Set a new password</div>
        </div>

        <div style={{ padding: "28px 32px 32px" }}>
          {success ? (
            <div style={{
              background: "rgba(122,92,71,0.08)", border: `1px solid rgba(122,92,71,0.2)`,
              borderRadius: 10, padding: "14px 16px",
              fontSize: 14, color: C.clay, textAlign: "center", lineHeight: 1.6,
            }}>
              Password updated! Redirecting you in...
            </div>
          ) : !ready ? (
            <div style={{ textAlign: "center", color: C.barkLight, fontSize: 14, padding: "20px 0" }}>
              Verifying reset link...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>New password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Confirm password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  style={inputStyle}
                />
              </div>

              {error && (
                <div style={{
                  background: "rgba(212,113,74,0.08)", border: `1px solid rgba(212,113,74,0.25)`,
                  borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                  fontSize: 13, color: C.terracotta,
                }}>{error}</div>
              )}

              <button onClick={handleReset} disabled={loading} style={{
                width: "100%", padding: "14px",
                background: C.terracotta, border: "none", borderRadius: 100,
                color: C.cream, fontSize: 14, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                fontFamily: "'DM Sans', sans-serif",
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
