import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const C = {
  cream: "#FAF6EE", warmWhite: "#FDFAF4",
  sand: "#F5EFE0", sandDark: "#EDE3CC",
  clay: "#C07A52", clayDeep: "#9B5C38",
  terracotta: "#D4714A",
  bark: "#4A3728", barkLight: "#7A5C47",
};


const TERMS = `Terms of Service

Last updated: May 8, 2025

Welcome to Bartr. By creating an account, you agree to these Terms of Service. Please read them carefully.

1. What Bartr Is
Bartr is a skill and hobby trading platform that connects people who want to teach something with people who want to learn. Bartr facilitates introductions between users — what happens after that connection is made is solely between the individuals involved.

2. Eligibility
You must be at least 18 years old to use Bartr. By signing up, you confirm that you are 18 or older.

3. Your Account
You are responsible for keeping your account credentials secure. You agree to provide accurate information on your profile, including the skills you claim to offer. Bartr does not verify the qualifications, certifications, or experience level of any user.

4. User Conduct
You agree not to use Bartr to harass, threaten, or harm other users. You agree not to post false, misleading, or fraudulent information on your profile. You agree not to use the platform for any commercial solicitation or for any purpose other than genuine skill trading.

5. In-Person Meetups
Bartr may facilitate connections between users who choose to meet in person. Bartr is not responsible for what happens during or after those meetups. You agree to exercise your own judgment and take appropriate precautions when meeting another user in person. Bartr strongly recommends meeting in public places for initial exchanges.

6. Skill Quality and Trade Outcomes
Bartr does not guarantee the quality, accuracy, or outcome of any skill exchange. If a trade does not go as expected — including no-shows, poor instruction, or unmet expectations — Bartr is not liable. Disputes are between the users involved.

7. Content You Post
By uploading a photo or writing a bio, you grant Bartr a non-exclusive license to display that content within the platform. You retain ownership of your content. Do not post content that is offensive, explicit, or belongs to someone else.

8. Limitation of Liability
To the fullest extent permitted by law, Bartr and its founders, employees, and affiliates are not liable for any damages arising from your use of the platform, including but not limited to: personal injury or harm resulting from in-person meetups, failed or unsatisfactory skill exchanges, loss of data, or unauthorized access to your account.

9. Termination
Bartr reserves the right to suspend or terminate any account that violates these terms, at its sole discretion, without prior notice.

10. Changes to These Terms
We may update these terms from time to time. Continued use of Bartr after changes are posted constitutes acceptance of the updated terms.

11. Governing Law
These terms are governed by the laws of the State of New York, without regard to conflict of law principles.

12. Contact
Questions? Reach us at bartropen4biz@gmail.com.`;

const PRIVACY = `Privacy Policy

Last updated: May 8, 2025

This Privacy Policy explains what information Bartr collects, how we use it, and your rights around it.

1. What We Collect
When you create an account and use Bartr, we collect:
- Email address (used for login and account recovery)
- Profile information: name, age, neighborhood, gender, bio, profile photo
- Skills you offer and want to learn
- Availability and swap preferences
- Optional social links: Instagram handle, LinkedIn URL
- Messages you send to other users
- Swipe activity (who you have and have not matched with)

2. How We Use Your Information
We use your information to:
- Show your profile to other users in the Discover feed
- Match you with users who have complementary skills
- Deliver messages between matched users
- Improve and maintain the platform

3. What We Do Not Do
Bartr does not sell your personal information to third parties. Bartr does not run advertising. Bartr does not share your data with third parties except as required to operate the service (e.g., our database provider, Supabase).

4. Profile Visibility
Your profile — including your name, photo, neighborhood, skills, bio, and availability — is visible to other logged-in Bartr users. Your email address is never shown to other users.

5. Messages
Messages are stored in our database and are only accessible to the sender and recipient. Bartr does not read your messages except as required to investigate reported violations of our Terms of Service.

6. Data Retention
If you delete your account, we permanently delete your profile, messages, matches, and swipe history. Your email address is also removed from our authentication system.

7. Security
We use industry-standard security practices to protect your data, including encrypted connections and access controls. No system is perfectly secure, and we cannot guarantee absolute security.

8. Children's Privacy
Bartr is intended for users 18 and older. We do not knowingly collect information from anyone under 18.

9. Your Rights
You may update or delete your account at any time from your profile page. To request a copy of your data or raise a privacy concern, contact us at bartropen4biz@gmail.com.

10. Changes to This Policy
We may update this policy as the platform evolves. We will note the date of the last update at the top of this page.

11. Governing Law
This policy is governed by the laws of the State of New York.

12. Contact
Bartr — bartropen4biz@gmail.com`;

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [legalModal, setLegalModal] = useState(null);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setInviteCode(codeParam);
      setMode("signup");
    }
  }, []);

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (mode === "signup") {
      if (!fullName) { setError("Please enter your name."); return; }
      if (!inviteCode.trim()) { setError("Please enter your invite code."); return; }
      if (password !== confirmPassword) { setError("Passwords don't match."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }

    setLoading(true);

    if (mode === "signup") {
      // Validate invite code
      const codeRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/invite_codes?code=ilike.${encodeURIComponent(inviteCode.trim())}&used=eq.false`,
        { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } }
      );
      const codeRows = await codeRes.json();
      if (!Array.isArray(codeRows) || codeRows.length === 0) {
        setError("That code isn't valid or has already been used.");
        setLoading(false);
        return;
      }
      const matchedCode = codeRows[0].code;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) { setError(error.message); setLoading(false); return; }

      // Mark code as used
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/invite_codes?code=eq.${encodeURIComponent(matchedCode)}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ used: true }),
        }
      );
      setMessage("Check your email for a confirmation link!");
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
              Bartr<span style={{ color: C.terracotta }}>.</span>
            </div>
          </a>
          <div style={{ fontSize: 13, color: C.barkLight }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "24px 24px 28px" }}>
          {/* Toggle */}
          {mode !== "forgot" && (
            <div style={{
              display: "flex", background: C.sand,
              borderRadius: 100, padding: 4, marginBottom: 24,
              border: `1px solid ${C.sandDark}`,
            }}>
              {["login", "signup"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setMessage(""); }} style={{
                  flex: 1, padding: "10px",
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

          {/* Invite code */}
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Invite code</label>
              <input type="text" placeholder="Enter your code" value={inviteCode}
                onChange={e => setInviteCode(e.target.value)} style={inputStyle} />
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
            fontFamily: "'DM Sans', sans-serif", minHeight: 44,
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
              By signing up you agree to our{" "}
              <button onClick={() => setLegalModal("terms")} style={{
                background: "none", border: "none", padding: 0,
                color: C.clay, fontSize: 11, cursor: "pointer",
                textDecoration: "underline", fontFamily: "'DM Sans', sans-serif",
              }}>terms of service</button>
              {" "}and{" "}
              <button onClick={() => setLegalModal("privacy")} style={{
                background: "none", border: "none", padding: 0,
                color: C.clay, fontSize: 11, cursor: "pointer",
                textDecoration: "underline", fontFamily: "'DM Sans', sans-serif",
              }}>privacy policy</button>.
            </div>
          )}
        </div>
      </div>

      {/* Legal modal */}
      {legalModal && (
        <div
          onClick={() => setLegalModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(74,55,40,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px 16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.warmWhite, borderRadius: 20,
              width: "100%", maxWidth: 560,
              maxHeight: "80vh", display: "flex", flexDirection: "column",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 8px 40px rgba(74,55,40,0.18)",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 16px",
              borderBottom: `1px solid ${C.sandDark}`,
            }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: C.bark }}>
                {legalModal === "terms" ? "Terms of Service" : "Privacy Policy"}
              </div>
              <button onClick={() => setLegalModal(null)} style={{
                background: "none", border: "none", fontSize: 20,
                color: C.barkLight, cursor: "pointer", lineHeight: 1,
                minWidth: 32, minHeight: 32,
              }}>×</button>
            </div>
            <div style={{
              overflowY: "auto", padding: "20px 24px 28px",
              fontSize: 13, color: C.bark, lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}>
              {legalModal === "terms" ? TERMS : PRIVACY}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
