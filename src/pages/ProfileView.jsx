import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, getAuthHeaders } from "../lib/supabase.js";
import { SKILLS } from "../lib/skillsData.js";

const C = {
  cream: "#FAF6EE", warmWhite: "#FDFAF4",
  sand: "#F5EFE0", sandDark: "#EDE3CC",
  clay: "#C07A52", clayDeep: "#9B5C38",
  terracotta: "#D4714A",
  bark: "#4A3728", barkLight: "#7A5C47",
};

function formatMemberSince(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfileView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tradeRequest, setTradeRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/auth"; return; }
      setIsSelf(session.user.id === userId);
      const headers = await getAuthHeaders();
      const [profileRes, tradeRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, { headers }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/trade_requests?user_id=eq.${userId}&status=eq.open&limit=1`, { headers }),
      ]);
      const rows = await profileRes.json();
      if (!Array.isArray(rows) || !rows[0]) {
        setNotFound(true);
      } else {
        setProfile(rows[0]);
      }
      const trRows = await tradeRes.json();
      if (Array.isArray(trRows) && trRows[0]) setTradeRequest(trRows[0]);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div style={{
        height: "100vh", background: C.cream,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", color: C.barkLight,
      }}>Loading...</div>
    );
  }

  if (notFound) {
    return (
      <div style={{
        height: "100vh", background: C.cream,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", color: C.barkLight, gap: 12,
      }}>
        <div style={{ fontSize: 36 }}>🤷</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark }}>
          Profile not found
        </div>
        <button onClick={() => navigate(-1)} style={{
          marginTop: 8, padding: "10px 24px", borderRadius: 100,
          background: C.terracotta, border: "none", color: C.cream,
          fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Go back</button>
      </div>
    );
  }

  const seekingLabels = profile.seeking
    ? profile.seeking.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const firstName = profile.full_name?.split(" ")[0] || "them";

  const availability = Array.isArray(profile.availability) ? profile.availability : [];
  const swapPreference = Array.isArray(profile.swap_preference) ? profile.swap_preference : [];

  return (
    <div style={{
      minHeight: "100vh", background: C.cream,
      fontFamily: "'DM Sans', sans-serif", color: C.bark,
      paddingBottom: 100,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        height: 56, padding: "0 16px",
        background: C.warmWhite,
        borderBottom: `1px solid ${C.sandDark}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent", border: "none",
            color: C.barkLight, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            padding: "0 4px", minHeight: 44, minWidth: 60,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >‹ Back</button>

        <div style={{
          fontFamily: "'Fraunces', serif", fontSize: 18,
          fontWeight: 600, color: C.bark,
          position: "absolute", left: "50%", transform: "translateX(-50%)",
        }}>Profile</div>

        {isSelf ? (
          <div style={{ minWidth: 60 }} />
        ) : (
          <button style={{
            background: "transparent", border: "none",
            color: C.barkLight, fontSize: 13, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", minHeight: 44,
          }}>Report</button>
        )}
      </div>

      {/* Photo area */}
      <div style={{ position: "relative", height: 260, background: C.sandDark, overflow: "hidden" }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #DDD0B4 0%, #C8B89A 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Fraunces', serif", fontWeight: 600,
            fontSize: 72, color: C.barkLight,
          }}>{initials}</div>
        )}

        {/* Dark gradient overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 140,
          background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
        }} />

        {/* Name / age / location */}
        <div style={{
          position: "absolute", bottom: 16, left: 16, right: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Fraunces', serif", fontWeight: 600,
              fontSize: 26, color: "#fff", lineHeight: 1.1,
            }}>
              {profile.full_name}{profile.age ? `, ${profile.age}` : ""}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            {profile.location}
            {{"Woman": "She/her", "Man": "He/him", "Non-binary": "They/them"}[profile.gender] && (
              <span style={{ marginLeft: 6, color: "rgba(255,255,255,0.65)" }}>
                · {{"Woman": "She/her", "Man": "He/him", "Non-binary": "They/them"}[profile.gender]}
              </span>
            )}
            {profile.created_at && (
              <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.55)" }}>
                · Joined {formatMemberSince(profile.created_at)}
              </span>
            )}
          </div>
        </div>

        {/* Swaps completed pill */}
        {(profile.swaps_completed || 0) > 0 && (
          <div style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            borderRadius: 100, padding: "5px 12px",
            fontSize: 12, color: "#fff", fontWeight: 600,
          }}>
            {profile.swaps_completed} swaps done
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>

        {/* Social links */}
        {(profile.instagram_handle || profile.linkedin_url) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {profile.instagram_handle && (
              <button
                onClick={() => window.open(`https://instagram.com/${profile.instagram_handle.replace(/^@/, "")}`, "_blank")}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", minHeight: 40, borderRadius: 100,
                  background: "rgba(212,113,74,0.08)", border: `1px solid rgba(212,113,74,0.25)`,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: C.terracotta,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>ig</div>
                <span style={{ fontSize: 13, color: C.terracotta, fontWeight: 500 }}>
                  {profile.instagram_handle.startsWith("@") ? profile.instagram_handle : `@${profile.instagram_handle}`}
                </span>
              </button>
            )}
            {profile.linkedin_url && (
              <button
                onClick={() => window.open(
                  profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`,
                  "_blank"
                )}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", minHeight: 40, borderRadius: 100,
                  background: "rgba(10,102,194,0.07)", border: `1px solid rgba(10,102,194,0.2)`,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: "#0A66C2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>in</div>
                <span style={{ fontSize: 13, color: "#0A66C2", fontWeight: 500 }}>LinkedIn</span>
              </button>
            )}
          </div>
        )}

        {/* Offering */}
        <div style={{
          background: C.sand, border: `1px solid ${C.sandDark}`,
          borderRadius: 14, padding: "18px 20px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{profile.offering_icon}</span>
            <span style={{
              fontFamily: "'Fraunces', serif", fontWeight: 600,
              fontSize: 20, color: C.bark,
            }}>{profile.offering}</span>
          </div>
          {profile.bio && (
            <p style={{ fontSize: 14, color: C.barkLight, lineHeight: 1.6, margin: 0 }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Trade Request */}
        {tradeRequest && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: C.barkLight, letterSpacing: 0.5, fontWeight: 600, textTransform: "uppercase" }}>
                Open Trade Request
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5a9e6f" }} />
                <span style={{ fontSize: 10, color: "#5a9e6f", fontWeight: 600 }}>Accepting responses</span>
              </div>
            </div>
            <div style={{
              background: "#FDF6EE", border: `1.5px solid ${C.clay}`,
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: tradeRequest.note ? 10 : 14 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: C.barkLight, marginBottom: 4 }}>{firstName} offers</div>
                  <div style={{ fontSize: 26 }}>{tradeRequest.offering_icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.bark, marginTop: 3 }}>{tradeRequest.offering_skill}</div>
                  <div style={{ fontSize: 12, color: C.barkLight }}>{tradeRequest.offering_qty} {tradeRequest.offering_unit}</div>
                </div>
                <div style={{ fontSize: 22, color: C.clay, fontWeight: 700, flexShrink: 0 }}>⇄</div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: C.barkLight, marginBottom: 4 }}>{firstName} wants</div>
                  <div style={{ fontSize: 26 }}>{tradeRequest.wanting_icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.bark, marginTop: 3 }}>{tradeRequest.wanting_skill}</div>
                  <div style={{ fontSize: 12, color: C.barkLight }}>{tradeRequest.wanting_qty} {tradeRequest.wanting_unit}</div>
                </div>
              </div>
              {tradeRequest.note && (
                <div style={{ fontSize: 13, color: C.barkLight, fontStyle: "italic", marginBottom: 14 }}>
                  {tradeRequest.note}
                </div>
              )}
              {!isSelf && (
                <button
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Hey! I saw your trade request - I can help with ${tradeRequest.wanting_skill}. Would you be open to swapping for ${tradeRequest.offering_skill}?`
                    );
                    navigate(`/chat/${userId}?prefillMessage=${msg}`);
                  }}
                  style={{
                    width: "100%", padding: "10px", minHeight: 44,
                    background: C.terracotta, border: "none", borderRadius: 100,
                    color: C.cream, fontSize: 14, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}
                >Respond →</button>
              )}
            </div>
          </div>
        )}

        {/* Wants to learn */}
        {seekingLabels.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, color: C.barkLight, letterSpacing: 0.5,
              fontWeight: 600, marginBottom: 12, textTransform: "uppercase",
            }}>Wants to learn</div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
            }}>
              {seekingLabels.map((label) => {
                const skill = SKILLS.find((s) => s.label === label);
                return (
                  <div key={label} style={{
                    padding: "10px 8px", borderRadius: 12,
                    background: C.sand, border: `1px solid ${C.sandDark}`,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  }}>
                    <span style={{ fontSize: 22 }}>{skill?.icon ?? "✨"}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, textAlign: "center",
                      lineHeight: 1.3, color: C.barkLight,
                    }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Availability */}
        {availability.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, color: C.barkLight, letterSpacing: 0.5,
              fontWeight: 600, marginBottom: 10, textTransform: "uppercase",
            }}>Available</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {availability.map((opt) => (
                <div key={opt} style={{
                  padding: "7px 14px", borderRadius: 100,
                  background: C.sand, border: `1px solid ${C.sandDark}`,
                  fontSize: 13, color: C.barkLight,
                }}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {/* Swap preference */}
        {swapPreference.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, color: C.barkLight, letterSpacing: 0.5,
              fontWeight: 600, marginBottom: 10, textTransform: "uppercase",
            }}>Prefers</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {swapPreference.map((opt) => (
                <div key={opt} style={{
                  padding: "7px 14px", borderRadius: 100,
                  background: C.sand, border: `1px solid ${C.sandDark}`,
                  fontSize: 13, color: C.barkLight,
                }}>{opt}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: C.warmWhite,
        borderTop: `1px solid ${C.sandDark}`,
        padding: "12px 16px",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
        display: "flex", gap: 10,
      }}>
        {isSelf ? (
          <>
            <button
              onClick={() => navigate("/profile/edit")}
              style={{
                flex: 1, padding: "14px", minHeight: 50,
                background: C.terracotta, border: "none", borderRadius: 100,
                color: C.cream, fontSize: 15, fontWeight: 500,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >Edit Profile</button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              style={{
                flex: 1, padding: "14px", minHeight: 50,
                background: "transparent", border: `1.5px solid ${C.sandDark}`,
                borderRadius: 100, color: C.barkLight, fontSize: 15, fontWeight: 500,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >Sign Out</button>
          </>
        ) : (
          <>
            <button style={{
              width: 50, height: 50, borderRadius: 14, flexShrink: 0,
              background: C.sand, border: `1px solid ${C.sandDark}`,
              cursor: "pointer", fontSize: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>📌</button>
            <button
              onClick={() => navigate(`/chat/${userId}`)}
              style={{
                flex: 1, padding: "14px", minHeight: 50,
                background: C.terracotta, border: "none", borderRadius: 100,
                color: C.cream, fontSize: 15, fontWeight: 500,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >Message {firstName}</button>
          </>
        )}
      </div>
    </div>
  );
}
