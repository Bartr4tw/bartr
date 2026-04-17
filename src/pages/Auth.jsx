import { useState } from "react";
import { supabase } from "../lib/supabase.js";

const C = {
  cream: "#FAF6EE", warmWhite: "#FDFAF4",
  sand: "#F5EFE0", sandDark: "#EDE3CC",
  clay: "#C07A52", clayDeep: "#9B5C38",
  terracotta: "#D4714A",
  bark: "#4A3728", barkLight: "#7A5C47",
};


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
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage("Check your email for a password reset link!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/app";
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px",
    background: C.sand,
    border: `1px solid ${C.sandDark}`,
    borderRadius: 12, color: C.bark, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
    outline: "none",
  };

  const labelStyle = {
    fontSize: 11, color: C.barkLight, marginBottom: 6,
    letterSpacing: 0.5, fontWeight: 500, display: "block",
    textTransform: "uppercase",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.cream,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: ${C.barkLight}; opacity: 0.5; }
        input:focus { border-color: ${C.terracotta} !important; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 420,
        background: C.warmWhite,
        border: `1.5px solid ${C.sandDark}`,
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 8px 32px rgba(74,55,40,0.1)",
      }}>
        {/* Header */}
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
          <div style={{ fontSize: 13, color: C.barkLight }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "28px 32px 32px" }}>
          {/* Toggle */}
          {mode !== "forgot" && (
            <div style={{
              display: "flex", background: C.sand,
              borderRadius: 100, padding: 4, marginBottom: 24,
              border: `1px solid ${C.sandDark}`,
            }}>
              {["login", "signup"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setMessage(""); }} style={{
                  flex: 1, padding: "8px",
                  background: mode === m ? C.warmWhite : "transparent",
                  border: mode === m ? `1px solid ${C.sandDark}` : "1px solid transparent",
                  borderRadius: 100, color: mode === m ? C.bark : C.barkLight,
                  fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          {/* Full name */}
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full name</label>
              <input type="text" placeholder="Your name" value={fullName}
                onChange={e => setFullName(e.target.value)} style={inputStyle} />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>

          {/* Password */}
          {mode !== "forgot" && (
            <div style={{ marginBottom: mode === "signup" ? 14 : 8 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => mode === "login" && e.key === "Enter" && handleSubmit()}
                style={inputStyle} />
            </div>
          )}

          {/* Forgot link */}
          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                style={{
                  background: "none", border: "none", padding: 0,
                  color: C.barkLight, fontSize: 12, cursor: "pointer",
                  textDecoration: "underline", fontFamily: "'DM Sans', sans-serif",
                }}>Forgot password?</button>
            </div>
          )}

          {/* Forgot description */}
          {mode === "forgot" && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: C.barkLight, lineHeight: 1.6 }}>
                Enter your email and we'll send you a link to reset your password.
              </div>
            </div>
          )}

          {/* Confirm password */}
          {mode === "signup" && (
            <div style={{ marginBottom: 24, marginTop: 14 }}>
              <label style={labelStyle}>Confirm password</label>
              <input type="password" placeholder="••••••••" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={inputStyle} />
            </div>
          )}

          {/* Error / Message */}
          {error && (
            <div style={{
              background: "rgba(212,113,74,0.08)", border: `1px solid rgba(212,113,74,0.25)`,
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: C.terracotta,
            }}>{error}</div>
          )}
          {message && (
            <div style={{
              background: "rgba(122,140,92,0.1)", border: `1px solid rgba(122,140,92,0.3)`,
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, color: "#5a6e3a",
            }}>{message}</div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "13px",
            background: C.terracotta, border: "none", borderRadius: 100,
            color: C.cream, fontSize: 14, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {loading ? "Loading..." : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>

          {/* Back to login */}
          {mode === "forgot" && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                style={{
                  background: "none", border: "none", padding: 0,
                  color: C.barkLight, fontSize: 13, cursor: "pointer",
                  textDecoration: "underline", fontFamily: "'DM Sans', sans-serif",
                }}>Back to log in</button>
            </div>
          )}

          {/* Terms */}
          {mode === "signup" && (
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.barkLight, lineHeight: 1.6 }}>
              By signing up you agree to our terms of service and privacy policy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
