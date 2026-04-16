import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const authHeaders = {
  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

function transformProfile(row) {
  return {
    id: row.id,
    name: row.full_name,
    location: row.location,
    avatar: row.full_name
      ? row.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : "?",
    offering: row.offering,
    offeringIcon: row.offering_icon,
    offeringDesc: row.bio,
    seeking: row.seeking ? row.seeking.split(",").map((s) => s.trim()).filter(Boolean) : [],
    seekingIcons: [],
    tags: [],
  };
}

const TABS = [
  { label: "Discover", icon: "⚡" },
  { label: "Matches", icon: "↔" },
  { label: "Profile", icon: "◉" },
];

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

function SwipeCard({ profile, yourProfile, onSwipe, isMobile }) {
  const [drag, setDrag] = useState({ x: 0, dragging: false, startX: 0 });

  const handleMouseDown = (e) => setDrag({ x: 0, dragging: true, startX: e.clientX });
  const handleMouseMove = (e) => { if (!drag.dragging) return; setDrag(d => ({ ...d, x: e.clientX - d.startX })); };
  const handleMouseUp = () => {
    if (!drag.dragging) return;
    if (drag.x > 100) onSwipe("right");
    else if (drag.x < -100) onSwipe("left");
    setDrag({ x: 0, dragging: false, startX: 0 });
  };
  const handleTouchStart = (e) => setDrag({ x: 0, dragging: true, startX: e.touches[0].clientX });
  const handleTouchMove = (e) => { if (!drag.dragging) return; setDrag(d => ({ ...d, x: e.touches[0].clientX - d.startX })); };
  const handleTouchEnd = () => {
    if (!drag.dragging) return;
    if (drag.x > 80) onSwipe("right");
    else if (drag.x < -80) onSwipe("left");
    setDrag({ x: 0, dragging: false, startX: 0 });
  };

  const rotation = isMobile ? drag.x * 0.05 : 0;
  const connectOpacity = Math.min(1, drag.x / 80);
  const skipOpacity = Math.min(1, -drag.x / 80);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: "100%", height: "100%",
        cursor: drag.dragging ? "grabbing" : "grab",
        transform: `translateX(${drag.x}px) rotate(${rotation}deg)`,
        transition: drag.dragging ? "none" : "transform 0.35s cubic-bezier(.34,1.56,.64,1)",
        userSelect: "none", touchAction: "none",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", top: 24, left: 24, zIndex: 20,
        border: "3px solid #eab308", borderRadius: 8, padding: "4px 14px",
        color: "#eab308", fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
        fontSize: 18, letterSpacing: 2, opacity: connectOpacity,
        transform: "rotate(-15deg)", pointerEvents: "none",
      }}>CONNECT</div>
      <div style={{
        position: "absolute", top: 24, right: 24, zIndex: 20,
        border: "3px solid #6b7280", borderRadius: 8, padding: "4px 14px",
        color: "#6b7280", fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
        fontSize: 18, letterSpacing: 2, opacity: skipOpacity,
        transform: "rotate(15deg)", pointerEvents: "none",
      }}>SKIP</div>

      <div style={{
        background: "#0f1623", borderRadius: 24, height: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        overflow: "hidden",
      }}>
        {/* Left panel */}
        <div style={{
          background: "linear-gradient(160deg, #111827, #1a2235)",
          padding: "32px 28px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          borderRight: isMobile ? "none" : "1px solid rgba(234,179,8,0.08)",
          borderBottom: isMobile ? "1px solid rgba(234,179,8,0.08)" : "none",
          flex: isMobile ? "none" : "0 0 280px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 160, height: 160, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(234,179,8,0.07), transparent 70%)",
            pointerEvents: "none",
          }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%",
                background: "rgba(234,179,8,0.1)",
                border: "2px solid rgba(234,179,8,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
                fontSize: 22, color: "#eab308", flexShrink: 0,
              }}>{profile.avatar}</div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#f9fafb" }}>
                  {profile.name}{profile.age ? `, ${profile.age}` : ""}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📍 {profile.location}</div>
              </div>
            </div>
            {profile.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
                {profile.tags.map(t => (
                  <span key={t} style={{
                    background: "rgba(234,179,8,0.08)",
                    border: "1px solid rgba(234,179,8,0.15)",
                    borderRadius: 20, padding: "3px 10px",
                    fontSize: 11, color: "#9ca3af", fontWeight: 600,
                  }}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4b5563", marginBottom: 10, fontWeight: 700 }}>WANTS TO LEARN</div>
            <div style={{ display: "flex", gap: 8 }}>
              {profile.seeking.map((s, i) => {
                const isMatch = yourProfile.seeking.includes(s);
                return (
                  <div key={s} style={{
                    flex: 1, borderRadius: 12, padding: "12px 6px", textAlign: "center",
                    background: isMatch ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.03)",
                    border: isMatch ? "1px solid rgba(234,179,8,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    {profile.seekingIcons?.[i] && <div style={{ fontSize: 20 }}>{profile.seekingIcons[i]}</div>}
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{s}</div>
                    {isMatch && <div style={{ fontSize: 9, color: "#eab308", marginTop: 3, fontWeight: 600 }}>You offer!</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          padding: "32px 28px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          flex: 1, overflow: "hidden",
        }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4b5563", marginBottom: 14, fontWeight: 700 }}>OFFERING</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.15)",
              borderRadius: 16, padding: "18px 20px", marginBottom: 20,
            }}>
              <span style={{ fontSize: 36 }}>{profile.offeringIcon}</span>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#f9fafb" }}>
                  {profile.offering}
                </div>
                {profile.offeringLevel && (
                  <span style={{
                    background: "rgba(234,179,8,0.1)", borderRadius: 20,
                    padding: "3px 12px", fontSize: 12, color: "#eab308", fontWeight: 600,
                  }}>{profile.offeringLevel}</span>
                )}
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.8 }}>{profile.offeringDesc}</p>
          </div>

          {!isMobile && (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "20px",
              textAlign: "center", marginTop: 20,
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🎬</div>
              <div style={{ fontSize: 12, color: "#4b5563" }}>Skill video coming soon</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ profile, yourProfile }) {
  return (
    <div style={{
      background: "#0f1623", borderRadius: 16, padding: "16px",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: "50%",
        background: "rgba(234,179,8,0.1)",
        border: "1px solid rgba(234,179,8,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
        fontSize: 15, color: "#eab308", flexShrink: 0,
      }}>{profile.avatar}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: "#f9fafb", fontSize: 16 }}>
          {profile.name}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
          {profile.offeringIcon} {profile.offering} <span style={{ color: "#eab308" }}>↔</span> {yourProfile.offeringIcon} {yourProfile.offering}
        </div>
      </div>
      <button
        onClick={() => window.location.href = `/chat/${profile.id}`}
        style={{
          background: "rgba(234,179,8,0.1)",
          border: "1px solid rgba(234,179,8,0.2)",
          borderRadius: 20, padding: "7px 16px",
          color: "#eab308", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Message</button>
    </div>
  );
}

export default function BartrApp({ profile }) {
  const YOUR_PROFILE = {
    name: profile?.full_name || "You",
    offering: profile?.offering || "",
    offeringIcon: profile?.offering_icon || "📊",
    seeking: profile?.seeking ? profile.seeking.split(",") : [],
    seekingIcons: [],
  };
  const [activeTab, setActiveTab] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [seenCount, setSeenCount] = useState(0);
  const [matches, setMatches] = useState([]);
  const [showMatch, setShowMatch] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  // Fetch profiles excluding anyone already swiped on or matched with
  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/swipes?swiper_id=eq.${profile.id}&select=swiped_id`, { headers: authHeaders }).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matches?user_a=eq.${profile.id}&select=user_b`, { headers: authHeaders }).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matches?user_b=eq.${profile.id}&select=user_a`, { headers: authHeaders }).then((r) => r.json()),
    ])
      .then(async ([swipes, matchesAsA, matchesAsB]) => {
        const swipedIds = (Array.isArray(swipes) ? swipes : []).map((s) => s.swiped_id);
        const matchedIds = [
          ...(Array.isArray(matchesAsA) ? matchesAsA : []).map((m) => m.user_b),
          ...(Array.isArray(matchesAsB) ? matchesAsB : []).map((m) => m.user_a),
        ];
        const excludeIds = [...new Set([...swipedIds, ...matchedIds])];

        let url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=neq.${profile.id}&select=*`;
        if (excludeIds.length > 0) {
          url += `&id=not.in.(${excludeIds.join(",")})`;
        }
        const rows = await fetch(url, { headers: authHeaders }).then((r) => r.json());
        setProfiles((rows || []).map(transformProfile));
        setProfilesLoading(false);
      })
      .catch(() => setProfilesLoading(false));
  }, [profile?.id]);

  // Load persisted matches from DB
  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matches?user_a=eq.${profile.id}&select=*`, { headers: authHeaders }).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matches?user_b=eq.${profile.id}&select=*`, { headers: authHeaders }).then((r) => r.json()),
    ]).then(async ([asA, asB]) => {
      const matchRows = [
        ...(Array.isArray(asA) ? asA : []),
        ...(Array.isArray(asB) ? asB : []),
      ];
      if (!matchRows.length) return;
      const otherIds = matchRows.map((m) =>
        m.user_a === profile.id ? m.user_b : m.user_a
      );
      const profileRows = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=in.(${otherIds.join(",")})&select=*`,
        { headers: authHeaders }
      ).then((r) => r.json());
      setMatches((Array.isArray(profileRows) ? profileRows : []).map(transformProfile));
    });
  }, [profile?.id]);

  const width = useWindowWidth();
  const isMobile = width < 768;
  const HEADER_HEIGHT = 64;

  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSwipe = async (direction) => {
    const current = profiles[0];
    if (!current) return;

    // Update UI immediately
    setLastAction(direction);
    setSeenCount((c) => c + 1);
    setProfiles((p) => p.slice(1));
    setTimeout(() => setLastAction(null), 400);

    // Record swipe in DB (keepalive ensures it completes even if page navigates away)
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/swipes`, {
      method: "POST",
      keepalive: true,
      headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ swiper_id: profile.id, swiped_id: current.id, direction }),
    });

    if (direction === "right") {
      // Check if other user already swiped right on current user
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/swipes?swiper_id=eq.${current.id}&swiped_id=eq.${profile.id}&direction=eq.right`,
        { headers: authHeaders }
      );
      const rows = await res.json();

      if (Array.isArray(rows) && rows.length > 0) {
        // Mutual match — save to matches table
        const user_a = profile.id < current.id ? profile.id : current.id;
        const user_b = profile.id < current.id ? current.id : profile.id;
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matches`, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ user_a, user_b }),
        });
        setMatches((m) => [current, ...m]);
        setShowMatch(current);
        setTimeout(() => setShowMatch(null), 2400);
      }
    }
  };

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      background: "#080b14",
      fontFamily: "'DM Sans', sans-serif",
      color: "#f3f4f6",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes matchPop { from { opacity:0; transform:translate(-50%,-50%) scale(0.8); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Header */}
      <div style={{
        height: HEADER_HEIGHT, flexShrink: 0,
        padding: isMobile ? "0 20px" : "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(8,11,20,0.95)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: "#f9fafb" }}>
              Bartr<span style={{ color: "#eab308" }}>.</span>
            </div>
          </a>
          {!isMobile && (
            <div style={{ display: "flex" }}>
              {TABS.filter(tab => tab.label !== "Profile").map((tab, i) => (
                <button key={tab.label} onClick={() => setActiveTab(i)} style={{
                  padding: "0 18px", height: HEADER_HEIGHT,
                  background: "transparent", border: "none",
                  borderBottom: activeTab === i ? "2px solid #eab308" : "2px solid transparent",
                  color: activeTab === i ? "#eab308" : "#6b7280",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {tab.icon} {tab.label}
                  {tab.label === "Matches" && matches.length > 0 && (
                    <span style={{
                      background: "#eab308", borderRadius: "50%", width: 17, height: 17,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: "#080b14", fontWeight: 800,
                    }}>{matches.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setActiveTab(2)} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: activeTab === 2 ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.04)",
          border: activeTab === 2 ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24, padding: "6px 14px",
          color: activeTab === 2 ? "#eab308" : "#9ca3af",
          fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
        }}>
          ◉ Profile
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* DISCOVER */}
        {activeTab === 0 && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Main card area */}
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: isMobile ? "20px 16px 100px" : "32px 40px",
              overflow: "hidden",
            }}>
              {profiles.length > 0 ? (
                <>
                  <div style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: isMobile ? 400 : 760,
                    height: isMobile ? 460 : "calc(100vh - 200px)",
                    marginBottom: 24,
                  }}>
                    {profiles[1] && (
                      <div style={{
                        position: "absolute", inset: 0, top: 10,
                        transform: "scale(0.97)", opacity: 0.35,
                        pointerEvents: "none", background: "#0f1623",
                        borderRadius: 24, border: "1px solid rgba(255,255,255,0.04)",
                      }} />
                    )}
                    <div style={{ position: "absolute", inset: 0 }}>
                      <SwipeCard profile={profiles[0]} yourProfile={YOUR_PROFILE} onSwipe={handleSwipe} isMobile={isMobile} />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
                    <button onClick={() => handleSwipe("left")} style={{
                      width: 58, height: 58, borderRadius: "50%",
                      background: lastAction === "left" ? "rgba(107,114,128,0.2)" : "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(107,114,128,0.25)",
                      fontSize: 22, cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280",
                    }}>✕</button>
                    <button onClick={() => handleSwipe("right")} style={{
                      width: 68, height: 68, borderRadius: "50%",
                      background: lastAction === "right" ? "rgba(234,179,8,0.2)" : "rgba(234,179,8,0.08)",
                      border: "2px solid rgba(234,179,8,0.4)",
                      fontSize: 26, cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 0 24px rgba(234,179,8,0.15)",
                    }}>⚡</button>
                    <button style={{
                      width: 58, height: 58, borderRadius: "50%",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      fontSize: 20, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>⭐</button>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "#374151", letterSpacing: 0.5 }}>
                    SWIPE OR TAP · ✕ SKIP · ⚡ CONNECT
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>{profilesLoading ? "⏳" : "✨"}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
                    {profilesLoading ? "Finding skill traders..." : "You've seen everyone"}
                  </div>
                  <div style={{ color: "#4b5563", fontSize: 14 }}>
                    {profilesLoading ? "" : "Check back soon for new skill traders"}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            {!isMobile && (
              <div style={{
                width: 260, flexShrink: 0,
                borderLeft: "1px solid rgba(255,255,255,0.04)",
                padding: "28px 20px",
                overflowY: "auto",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                <div style={{
                  background: "#0f1623", borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
                }}>
                  <div style={{
                    background: "linear-gradient(135deg, #111827, #1a2235)",
                    padding: "16px", borderBottom: "1px solid rgba(234,179,8,0.08)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "rgba(234,179,8,0.1)",
                        border: "2px solid rgba(234,179,8,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
                        fontSize: 16, color: "#eab308",
                      }}>N</div>
                      <div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>{YOUR_PROFILE.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>New York, NY</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px" }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#4b5563", marginBottom: 8, fontWeight: 700 }}>YOU OFFER</div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "rgba(234,179,8,0.06)",
                      border: "1px solid rgba(234,179,8,0.15)",
                      borderRadius: 10, padding: "9px 12px",
                    }}>
                      <span style={{ fontSize: 18 }}>{YOUR_PROFILE.offeringIcon}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>{YOUR_PROFILE.offering}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: "#0f1623", borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "14px", display: "flex", justifyContent: "space-around",
                }}>
                  {[["Left", profiles.length], ["Matched", matches.length]].map(([label, val]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#eab308" }}>{val}</div>
                      <div style={{ fontSize: 10, color: "#4b5563" }}>{label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>

                {matches.length > 0 && (
                  <div style={{
                    background: "#0f1623", borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.06)", padding: "14px",
                  }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#4b5563", marginBottom: 10, fontWeight: 700 }}>MATCHES</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {matches.slice(0, 5).map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "rgba(234,179,8,0.1)",
                            border: "1px solid rgba(234,179,8,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
                            fontSize: 11, color: "#eab308",
                          }}>{m.avatar}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#f9fafb" }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: "#6b7280" }}>{m.offeringIcon} {m.offering}</div>
                          </div>
                          <button style={{
                            background: "transparent", border: "none",
                            color: "#eab308", fontSize: 10, cursor: "pointer", fontWeight: 600,
                          }}>Chat</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MATCHES */}
        {activeTab === 1 && (
          <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px 100px" : "40px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              {matches.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 80 }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>⚡</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>No matches yet</div>
                  <div style={{ color: "#4b5563", fontSize: 13 }}>Start discovering skill partners</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 16, letterSpacing: 0.5 }}>
                    {matches.length} MUTUAL MATCH{matches.length !== 1 ? "ES" : ""}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {matches.map(m => <MatchCard key={m.id} profile={m} yourProfile={YOUR_PROFILE} />)}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 2 && (
          <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px 100px" : "40px" }}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <div style={{ background: "#0f1623", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{
                  background: "linear-gradient(135deg, #111827, #1a2235)",
                  padding: "28px 24px", borderBottom: "1px solid rgba(234,179,8,0.08)",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(234,179,8,0.06), transparent 70%)",
                  }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "rgba(234,179,8,0.1)", border: "2px solid rgba(234,179,8,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Cormorant Garamond', serif", fontWeight: 800, fontSize: 24, color: "#eab308",
                    }}>N</div>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#f9fafb" }}>{YOUR_PROFILE.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📍 New York, NY</div>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
                        background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)",
                        borderRadius: 20, padding: "3px 12px",
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#eab308", animation: "pulse 2s infinite" }} />
                        <span style={{ fontSize: 10, color: "#eab308", fontWeight: 600 }}>ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4b5563", marginBottom: 10, fontWeight: 700 }}>I OFFER</div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)",
                      borderRadius: 14, padding: "14px 16px",
                    }}>
                      <span style={{ fontSize: 30 }}>{YOUR_PROFILE.offeringIcon}</span>
                      <div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>{YOUR_PROFILE.offering}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Mid-level · Available weekends</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4b5563", marginBottom: 10, fontWeight: 700 }}>I WANT TO LEARN</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {YOUR_PROFILE.seeking.map((s, i) => (
                        <div key={s} style={{
                          flex: 1, background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 12, padding: "12px 8px", textAlign: "center",
                        }}>
                          <div style={{ fontSize: 22 }}>{YOUR_PROFILE.seekingIcons[i]}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{s}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{
                    paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)",
                    display: "flex", justifyContent: "space-between",
                  }}>
                    {[["Matches", matches.length], ["Seen", seenCount], ["Skills", 1]].map(([label, val]) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#eab308" }}>{val}</div>
                        <div style={{ fontSize: 11, color: "#4b5563", letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => navigate("/profile/edit")} style={{
                width: "100%", marginTop: 12,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "14px",
                color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Edit Profile</button>
              <button onClick={handleSignOut} style={{
                width: "100%", marginTop: 8,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 14, padding: "14px",
                color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Sign Out</button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom tabs */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(8,11,20,0.95)", backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", padding: "8px 0 16px", zIndex: 40,
        }}>
          {TABS.map((tab, i) => (
            <button key={tab.label} onClick={() => setActiveTab(i)} style={{
              flex: 1, padding: "8px 0", background: "transparent", border: "none",
              color: activeTab === i ? "#eab308" : "#4b5563",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Match overlay */}
      {showMatch && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(8,11,20,0.85)",
          backdropFilter: "blur(8px)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#0f1623", border: "1px solid rgba(234,179,8,0.3)",
            borderRadius: 28, padding: "44px 48px", textAlign: "center",
            boxShadow: "0 0 100px rgba(234,179,8,0.15), 0 24px 64px rgba(0,0,0,0.8)",
            animation: "matchPop 0.4s cubic-bezier(.34,1.56,.64,1)",
            maxWidth: 320, margin: "0 20px",
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 800, color: "#eab308", marginBottom: 8 }}>
              Skill Match!
            </div>
            <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20, lineHeight: 1.6 }}>
              You and <strong style={{ color: "#f9fafb" }}>{showMatch.name}</strong> can trade skills
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)",
              borderRadius: 14, padding: "14px 20px", fontSize: 13, color: "#9ca3af",
            }}>
              <span>{showMatch.offeringIcon} {showMatch.offering}</span>
              <span style={{ color: "#eab308", fontSize: 16 }}>↔</span>
              <span>{YOUR_PROFILE.offeringIcon} {YOUR_PROFILE.offering}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
