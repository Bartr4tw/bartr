import { useState, useRef, useEffect } from "react";

const PROFILES = [
  {
    id: 1,
    name: "Maya Chen",
    age: 28,
    location: "Brooklyn, NY",
    avatar: "MC",
    offering: "Guitar Lessons",
    offeringIcon: "🎸",
    offeringLevel: "Advanced",
    offeringDesc: "10 years playing, can teach acoustic & electric. Fingerpicking, chord theory, songwriting.",
    seeking: ["Cooking", "Photography", "Language"],
    seekingIcons: ["🍳", "📷", "🗣️"],
    tags: ["Creative", "Patient", "Flexible Hours"],
  },
  {
    id: 2,
    name: "Jordan Reyes",
    age: 33,
    location: "Manhattan, NY",
    avatar: "JR",
    offering: "Personal Training",
    offeringIcon: "🏋️",
    offeringLevel: "Certified",
    offeringDesc: "NASM certified, 6 years experience. Strength, HIIT, mobility. Custom programming.",
    seeking: ["Photography", "Web Dev", "Cooking"],
    seekingIcons: ["📷", "💻", "🍳"],
    tags: ["Morning Person", "Results-Driven", "Outdoors"],
  },
  {
    id: 3,
    name: "Priya Sharma",
    age: 26,
    location: "Astoria, NY",
    avatar: "PS",
    offering: "Indian Cooking",
    offeringIcon: "🍛",
    offeringLevel: "Expert",
    offeringDesc: "Authentic regional Indian cuisine. Spice blending, vegetarian & non-veg, meal prep.",
    seeking: ["Yoga", "Guitar", "Photography"],
    seekingIcons: ["🧘", "🎸", "📷"],
    tags: ["Foodie", "Weekends", "Cultural Exchange"],
  },
  {
    id: 4,
    name: "Sam Torres",
    age: 30,
    location: "Williamsburg, NY",
    avatar: "ST",
    offering: "Photography",
    offeringIcon: "📷",
    offeringLevel: "Professional",
    offeringDesc: "Street, portrait, events. Lightroom editing, composition, lighting on a budget.",
    seeking: ["Music", "Fitness", "Language"],
    seekingIcons: ["🎵", "🏋️", "🗣️"],
    tags: ["Portfolio Building", "Film & Digital", "Evenings OK"],
  },
  {
    id: 5,
    name: "Alex Kim",
    age: 24,
    location: "LIC, NY",
    avatar: "AK",
    offering: "Web Development",
    offeringIcon: "💻",
    offeringLevel: "Mid-level",
    offeringDesc: "React, Node, design basics. Can help build your project or teach fundamentals.",
    seeking: ["Cooking", "Music", "Fitness"],
    seekingIcons: ["🍳", "🎵", "🏋️"],
    tags: ["Remote Friendly", "Project-Based", "Coffee Chats"],
  },
];

const YOUR_PROFILE = {
  name: "Neal",
  offering: "Data Analysis",
  offeringIcon: "📊",
  seeking: ["Cooking", "Guitar", "Photography"],
  seekingIcons: ["🍳", "🎸", "📷"],
};

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

function SwipeCard({ profile, onSwipe, isTop, isMobile }) {
  const [drag, setDrag] = useState({ x: 0, dragging: false, startX: 0 });
  const cardRef = useRef(null);

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

  const rotation = drag.x * 0.05;
  const connectOpacity = Math.min(1, drag.x / 80);
  const skipOpacity = Math.min(1, -drag.x / 80);

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "absolute",
        width: "100%",
        cursor: drag.dragging ? "grabbing" : "grab",
        transform: `translateX(${drag.x}px) rotate(${rotation}deg)`,
        transition: drag.dragging ? "none" : "transform 0.35s cubic-bezier(.34,1.56,.64,1)",
        userSelect: "none", touchAction: "none",
        zIndex: isTop ? 10 : 5,
      }}
    >
      {/* Stamps */}
      <div style={{
        position: "absolute", top: 24, left: 20, zIndex: 20,
        border: "3px solid #eab308", borderRadius: 8, padding: "4px 14px",
        color: "#eab308", fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
        fontSize: 18, letterSpacing: 2, opacity: connectOpacity,
        transform: "rotate(-15deg)", pointerEvents: "none",
      }}>CONNECT</div>
      <div style={{
        position: "absolute", top: 24, right: 20, zIndex: 20,
        border: "3px solid #6b7280", borderRadius: 8, padding: "4px 14px",
        color: "#6b7280", fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
        fontSize: 18, letterSpacing: 2, opacity: skipOpacity,
        transform: "rotate(15deg)", pointerEvents: "none",
      }}>SKIP</div>

      <div style={{
        background: "#0f1623",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        display: isMobile ? "block" : "grid",
        gridTemplateColumns: isMobile ? "none" : "1fr 1fr",
      }}>
        {/* Left / Top section */}
        <div style={{
          background: "linear-gradient(135deg, #111827, #1a2235)",
          padding: "28px 24px 20px",
          borderRight: isMobile ? "none" : "1px solid rgba(234,179,8,0.08)",
          borderBottom: isMobile ? "1px solid rgba(234,179,8,0.08)" : "none",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 120, height: 120, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(234,179,8,0.08), transparent 70%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(234,179,8,0.1)",
              border: "2px solid rgba(234,179,8,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
              fontSize: 20, color: "#eab308", flexShrink: 0,
            }}>{profile.avatar}</div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#f9fafb" }}>
                {profile.name}, {profile.age}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📍 {profile.location}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {profile.tags.map(t => (
              <span key={t} style={{
                background: "rgba(234,179,8,0.08)",
                border: "1px solid rgba(234,179,8,0.15)",
                borderRadius: 20, padding: "3px 10px",
                fontSize: 11, color: "#9ca3af", fontWeight: 600,
              }}>{t}</span>
            ))}
          </div>
          {/* Seeking - shown in left col on desktop */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4b5563", marginBottom: 10, fontWeight: 700 }}>WANTS TO LEARN</div>
            <div style={{ display: "flex", gap: 8 }}>
              {profile.seeking.map((s, i) => {
                const isMatch = YOUR_PROFILE.seeking.includes(s);
                return (
                  <div key={s} style={{
                    flex: 1, borderRadius: 12, padding: "10px 6px", textAlign: "center",
                    background: isMatch ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.03)",
                    border: isMatch ? "1px solid rgba(234,179,8,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: 18 }}>{profile.seekingIcons[i]}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{s}</div>
                    {isMatch && <div style={{ fontSize: 9, color: "#eab308", marginTop: 2, fontWeight: 600 }}>You offer!</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right / Bottom section */}
        <div style={{ padding: "24px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4b5563", marginBottom: 10, fontWeight: 700 }}>OFFERING</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(234,179,8,0.06)",
            border: "1px solid rgba(234,179,8,0.15)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 14,
          }}>
            <span style={{ fontSize: 28 }}>{profile.offeringIcon}</span>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>
                {profile.offering}
              </div>
              <span style={{
                background: "rgba(234,179,8,0.1)", borderRadius: 20,
                padding: "2px 10px", fontSize: 11, color: "#eab308", fontWeight: 600,
              }}>{profile.offeringLevel}</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7, marginBottom: 0 }}>{profile.offeringDesc}</p>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ profile }) {
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
          {profile.offeringIcon} {profile.offering} <span style={{ color: "#eab308" }}>↔</span> {YOUR_PROFILE.offeringIcon} {YOUR_PROFILE.offering}
        </div>
      </div>
      <button style={{
        background: "rgba(234,179,8,0.1)",
        border: "1px solid rgba(234,179,8,0.2)",
        borderRadius: 20, padding: "7px 16px",
        color: "#eab308", fontSize: 12, fontWeight: 600, cursor: "pointer",
      }}>Message</button>
    </div>
  );
}

export default function BartrApp() {
  const [activeTab, setActiveTab] = useState(0);
  const [profiles, setProfiles] = useState(PROFILES);
  const [matches, setMatches] = useState([]);
  const [showMatch, setShowMatch] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const width = useWindowWidth();
  const isMobile = width < 768;

  const handleSwipe = (direction) => {
    const current = profiles[0];
    if (direction === "right") {
      setMatches(m => [current, ...m]);
      setShowMatch(current);
      setTimeout(() => setShowMatch(null), 2400);
    }
    setLastAction(direction);
    setProfiles(p => p.slice(1));
    setTimeout(() => setLastAction(null), 400);
  };

  const cardHeight = isMobile ? 480 : 320;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b14",
      fontFamily: "'DM Sans', sans-serif",
      color: "#f3f4f6",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes matchPop { from { opacity:0; transform:translate(-50%,-50%) scale(0.8); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Header */}
      <div style={{
        width: "100%",
        padding: isMobile ? "16px 20px 12px" : "20px 40px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(8,11,20,0.9)",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 32 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: "#f9fafb" }}>
              Bartr<span style={{ color: "#eab308" }}>.</span>
            </div>
          </a>
          {!isMobile && (
            <div style={{ display: "flex", gap: 4 }}>
              {TABS.map((tab, i) => (
                <button key={tab.label} onClick={() => setActiveTab(i)} style={{
                  padding: "8px 16px", background: "transparent",
                  border: "none",
                  borderBottom: activeTab === i ? "2px solid #eab308" : "2px solid transparent",
                  color: activeTab === i ? "#eab308" : "#6b7280",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                  {tab.icon} {tab.label}
                  {tab.label === "Matches" && matches.length > 0 && (
                    <span style={{
                      marginLeft: 6, background: "#eab308", borderRadius: "50%",
                      width: 17, height: 17,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: "#080b14", fontWeight: 800,
                    }}>{matches.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.2)",
          borderRadius: 24, padding: "6px 14px",
        }}>
          <span style={{ fontSize: 14 }}>{YOUR_PROFILE.offeringIcon}</span>
          <span style={{ fontSize: 12, color: "#eab308", fontWeight: 600 }}>{YOUR_PROFILE.offering}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: isMobile ? "100%" : 1100,
        margin: "0 auto",
        padding: isMobile ? "16px 16px 100px" : "40px 40px 60px",
      }}>

        {/* DISCOVER */}
        {activeTab === 0 && (
          <div style={{
            display: isMobile ? "block" : "grid",
            gridTemplateColumns: isMobile ? "none" : "1fr 360px",
            gap: 40,
            alignItems: "start",
          }}>
            {/* Card stack */}
            <div>
              {profiles.length > 0 ? (
                <>
                  <div style={{ position: "relative", height: cardHeight, marginBottom: 28 }}>
                    {profiles[1] && (
                      <div style={{
                        position: "absolute", width: "100%",
                        top: 10, left: "50%", transform: "translateX(-50%) scale(0.97)",
                        opacity: 0.4, pointerEvents: "none",
                      }}>
                        <div style={{
                          background: "#0f1623", borderRadius: 24, height: 80,
                          border: "1px solid rgba(255,255,255,0.04)",
                        }} />
                      </div>
                    )}
                    <SwipeCard profile={profiles[0]} onSwipe={handleSwipe} isTop={true} isMobile={isMobile} />
                  </div>

                  {/* Buttons */}
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
                      boxShadow: "0 0 20px rgba(234,179,8,0.15)",
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
                <div style={{ textAlign: "center", paddingTop: 80 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
                    You've seen everyone
                  </div>
                  <div style={{ color: "#4b5563", fontSize: 14 }}>Check back soon for new skill traders</div>
                </div>
              )}
            </div>

            {/* Sidebar — desktop only */}
            {!isMobile && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Your profile card */}
                <div style={{
                  background: "#0f1623", borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    background: "linear-gradient(135deg, #111827, #1a2235)",
                    padding: "20px",
                    borderBottom: "1px solid rgba(234,179,8,0.08)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "rgba(234,179,8,0.1)",
                        border: "2px solid rgba(234,179,8,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
                        fontSize: 18, color: "#eab308",
                      }}>N</div>
                      <div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>{YOUR_PROFILE.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>New York, NY</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "16px" }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#4b5563", marginBottom: 8, fontWeight: 700 }}>YOU OFFER</div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "rgba(234,179,8,0.06)",
                      border: "1px solid rgba(234,179,8,0.15)",
                      borderRadius: 12, padding: "10px 12px",
                    }}>
                      <span style={{ fontSize: 22 }}>{YOUR_PROFILE.offeringIcon}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>{YOUR_PROFILE.offering}</span>
                    </div>
                  </div>
                </div>

                {/* Recent matches */}
                {matches.length > 0 && (
                  <div style={{
                    background: "#0f1623", borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.06)",
                    padding: "16px",
                  }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#4b5563", marginBottom: 12, fontWeight: 700 }}>RECENT MATCHES</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {matches.slice(0, 3).map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "rgba(234,179,8,0.1)",
                            border: "1px solid rgba(234,179,8,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
                            fontSize: 12, color: "#eab308",
                          }}>{m.avatar}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{m.offeringIcon} {m.offering}</div>
                          </div>
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
          <div style={{ maxWidth: isMobile ? "100%" : 600, margin: "0 auto" }}>
            {matches.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>⚡</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                  No matches yet
                </div>
                <div style={{ color: "#4b5563", fontSize: 13 }}>Start discovering skill partners</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 16, letterSpacing: 0.5 }}>
                  {matches.length} MUTUAL MATCH{matches.length !== 1 ? "ES" : ""}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {matches.map(m => <MatchCard key={m.id} profile={m} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 2 && (
          <div style={{ maxWidth: isMobile ? "100%" : 600, margin: "0 auto" }}>
            <div style={{
              background: "#0f1623", borderRadius: 20, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                background: "linear-gradient(135deg, #111827, #1a2235)",
                padding: "28px 24px",
                borderBottom: "1px solid rgba(234,179,8,0.08)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -40, right: -40,
                  width: 160, height: 160, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(234,179,8,0.06), transparent 70%)",
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "rgba(234,179,8,0.1)",
                    border: "2px solid rgba(234,179,8,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
                    fontSize: 24, color: "#eab308",
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
                  {[["Matches", matches.length], ["Seen", PROFILES.length - profiles.length], ["Skills", 1]].map(([label, val]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#eab308" }}>{val}</div>
                      <div style={{ fontSize: 11, color: "#4b5563", letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button style={{
              width: "100%", marginTop: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "14px",
              color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Edit Profile</button>
          </div>
        )}
      </div>

      {/* Mobile bottom tabs */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(8,11,20,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", padding: "8px 0 16px",
          zIndex: 40,
        }}>
          {TABS.map((tab, i) => (
            <button key={tab.label} onClick={() => setActiveTab(i)} style={{
              flex: 1, padding: "8px 0",
              background: "transparent", border: "none",
              color: activeTab === i ? "#eab308" : "#4b5563",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
              {tab.label === "Matches" && matches.length > 0 && (
                <span style={{
                  position: "absolute", top: 6,
                  background: "#eab308", borderRadius: "50%",
                  width: 16, height: 16,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#080b14", fontWeight: 800,
                }}>{matches.length}</span>
              )}
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
            background: "#0f1623",
            border: "1px solid rgba(234,179,8,0.3)",
            borderRadius: 28, padding: "44px 48px", textAlign: "center",
            boxShadow: "0 0 100px rgba(234,179,8,0.15), 0 24px 64px rgba(0,0,0,0.8)",
            animation: "matchPop 0.4s cubic-bezier(.34,1.56,.64,1)",
            maxWidth: 320, margin: "0 20px",
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32, fontWeight: 800, color: "#eab308", marginBottom: 8,
            }}>Skill Match!</div>
            <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20, lineHeight: 1.6 }}>
              You and <strong style={{ color: "#f9fafb" }}>{showMatch.name}</strong> can trade skills
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              background: "rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.15)",
              borderRadius: 14, padding: "14px 20px",
              fontSize: 13, color: "#9ca3af",
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