import { useState } from "react";
import { supabase } from "./supabase.js";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (mode === "signup") {
      if (!fullName) { setError("Please enter your name."); return; }
      if (password !== confirmPassword) { setError("Passwords don't match."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }

    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) setError(error.message);
      else setMessage("Check your email for a confirmation link!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/app"; 
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b14",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "20px",
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
        {/* Header */}
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
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "28px 32px 32px" }}>
          {/* Toggle */}
          <div style={{
            display: "flex", background: "rgba(255,255,255,0.03)",
            borderRadius: 12, padding: 4, marginBottom: 24,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setMessage(""); }} style={{
                flex: 1, padding: "8px",
                background: mode === m ? "rgba(234,179,8,0.1)" : "transparent",
                border: mode === m ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
                borderRadius: 9, color: mode === m ? "#eab308" : "#6b7280",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              }}>
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Full name — signup only */}
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>FULL NAME</div>
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
                  transition: "border-color 0.2s",
                }}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>EMAIL</div>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, color: "#f9fafb", fontSize: 14,
                transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: mode === "signup" ? 14 : 24 }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>PASSWORD</div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => mode === "login" && e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, color: "#f9fafb", fontSize: 14,
                transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Confirm password — signup only */}
          {mode === "signup" && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>CONFIRM PASSWORD</div>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "#f9fafb", fontSize: 14,
                  transition: "border-color 0.2s",
                }}
              />
            </div>
          )}

          {/* Error / Message */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#f87171",
            }}>{error}</div>
          )}
          {message && (
            <div style={{
              background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#eab308",
            }}>{message}</div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "14px",
            background: "#eab308", border: "none", borderRadius: 12,
            color: "#080b14", fontSize: 14, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
          }}>
            {loading ? "Loading..." : mode === "login" ? "Log in" : "Create account"}
          </button>

          {/* Terms — signup only */}
          {mode === "signup" && (
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#4b5563", lineHeight: 1.6 }}>
              By signing up you agree to our terms of service and privacy policy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
