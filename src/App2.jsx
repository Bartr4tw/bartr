import { useState, useRef, useEffect } from "react";

const PROFILES = [
  {
    id: 1,
    name: "Maya Chen",
    age: 28,
    location: "Brooklyn, NY",
    avatar: "MC",
    color: "#1a2235",
    accent: "#eab308",
    offering: "Guitar Lessons",
    offeringIcon: "🎸",
    offeringLevel: "Advanced",
    offeringDesc: "10 years playing, can teach acoustic & electric. Fingerpicking, chord theory, songwriting.",
    seeking: ["Cooking", "Photography", "Language"],
    seekingIcons: ["🍳", "📷", "🗣️"],
    tags: ["Creative", "Patient", "Flexible Hours"],
    matches: 14,
  },
  {
    id: 2,
    name: "Jordan Reyes",
    age: 33,
    location: "Manhattan, NY",
    avatar: "JR",
    color: "#1a2235",
    accent: "#eab308",
    offering: "Personal Training",
    offeringIcon: "🏋️",
    offeringLevel: "Certified",
    offeringDesc: "NASM certified, 6 years experience. Strength, HIIT, mobility. Custom programming.",
    seeking: ["Photography", "Web Dev", "Cooking"],
    seekingIcons: ["📷", "💻", "🍳"],
    tags: ["Morning Person", "Results-Driven", "Outdoors"],
    matches: 22,
  },
  {
    id: 3,
    name: "Priya Sharma",
    age: 26,
    location: "Astoria, NY",
    avatar: "PS",
    color: "#1a2235",
    accent: "#eab308",
    offering: "Indian Cooking",
    offeringIcon: "🍛",
    offeringLevel: "Expert",
    offeringDesc: "Authentic regional Indian cuisine. Spice blending, vegetarian & non-veg, meal prep.",
    seeking: ["Yoga", "Guitar", "Photography"],
    seekingIcons: ["🧘", "🎸", "📷"],
    tags: ["Foodie", "Weekends", "Cultural Exchange"],
    matches: 9,
  },
  {
    id: 4,
    name: "Sam Torres",
    age: 30,
    location: "Williamsburg, NY",
    avatar: "ST",
    color: "#1a2235",
    accent: "#eab308",
    offering: "Photography",
    offeringIcon: "📷",
    offeringLevel: "Professional",
    offeringDesc: "Street, portrait, events. Lightroom editing, composition, lighting on a budget.",
    seeking: ["Music", "Fitness", "Language"],
    seekingIcons: ["🎵", "🏋️", "🗣️"],
    tags: ["Portfolio Building", "Film & Digital", "Evenings OK"],
    matches: 31,
  },
  {
    id: 5,
    name: "Alex Kim",
    age: 24,
    location: "LIC, NY",
    avatar: "AK",
    color: "#1a2235",
    accent: "#eab308",
    offering: "Web Development",
    offeringIcon: "💻",
    offeringLevel: "Mid-level",
    offeringDesc: "React, Node, design basics. Can help build your project or teach fundamentals.",
    seeking: ["Cooking", "Music", "Fitness"],
    seekingIcons: ["🍳", "🎵", "🏋️"],
    tags: ["Remote Friendly", "Project-Based", "Coffee Chats"],
    matches: 7,
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

function SwipeCard({ profile, onSwipe, isTop }) {
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

  const rotation = drag.x * 0.07;
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
        position: "absolute", width: "100%", maxWidth: 360,
        cursor: drag.dragging ? "grabbing" : "grab",
        transform: `translateX(${drag.x}px) rotate(${rotation}deg)`,
        transition: drag.dragging ? "none" : "transform 0.35s cubic-bezier(.34,1.56,.64,1)",
        userSelect: "none", touchAction: "none",
        zIndex: isTop ? 10 : 5,
      }}
    >
      {/* Stamps */}
      <div style={{
        position: "absolute", top: 28, left: 20, zIndex: 20,
        border: "3px solid #eab308", borderRadius: 8, padding: "4px 14px",
        color: "#eab308", fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
        fontSize: 20, letterSpacing: 2, opacity: connectOpacity,
        transform: "rotate(-15deg)", pointerEvents: "none",
      }}>CONNECT</div>
      <div style={{
        position: "absolute", top: 28, right: 20, zIndex: 20,
        border: "3px solid #6b7280", borderRadius: 8, padding: "4px 14px",
        color: "#6b7280", fontFamily: "'Cormorant Garamond', serif", fontWeight: 800,
        fontSize: 20, letterSpacing: 2, opacity: skipOpacity,
        transform: "rotate(15deg)", pointerEvents: "none",
      }}>SKIP</div>

      <div style={{
        background: "#0f1623",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
      }}>
        {/* Card Header */}
        <div style={{
          background: "linear-gradient(135deg, #111827, #1a2235)",
          padding: "28px 24px 20px",
          borderBottom: "1px solid rgba(234,179,8,0.1)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 120, height: 120, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(234,179,8,0.08), transparent 70%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: "rgba(234,179,8,0.1)",
              border: "2px solid rgba(234,179,8,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
              fontSize: 20, color: "#eab308", flexShrink: 0,
            }}>{profile.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#f9fafb" }}>
                {profile.name}, {profile.age}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📍 {profile.location}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {profile.tags.map(t => (
                  <span key={t} style={{
                    background: "rgba(234,179,8,0.08)",
                    border: "1px solid rgba(234,179,8,0.15)",
                    borderRadius: 20, padding: "2px 10px",
                    fontSize: 10, color: "#9ca3af", fontWeight: 600,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Offering */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4b5563", marginBottom: 10, fontWeight: 700 }}>OFFERING</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(234,179,8,0.06)",
            border: "1px solid rgba(234,179,8,0.15)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 12,
          }}>
            <span style={{ fontSize: 30 }}>{profile.offeringIcon}</span>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 700, color: "#f9fafb" }}>
                {profile.offering}
              </div>
              <span style={{
                background: "rgba(234,179,8,0.1)", borderRadius: 20,
                padding: "2px 10px", fontSize: 11, color: "#eab308", fontWeight: 600,
              }}>{profile.offeringLevel}</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.65, margin: 0 }}>{profile.offeringDesc}</p>
        </div>

        {/* Seeking */}
        <div style={{ padding: "16px 24px 24px" }}>
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
                  <div style={{ fontSize: 20 }}>{profile.seekingIcons[i]}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{s}</div>
                  {isMatch && <div style={{ fontSize: 9, color: "#eab308", marginTop: 2, fontWeight: 600 }}>You offer!</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ profile }) {
  return (
    <div style={{
      background: "#0f1623",
      borderRadius: 16, padding: "16px",
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b14",
      display: "flex", flexDirection: "column", alignItems: "center",
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
        width: "100%", maxWidth: 420,
        padding: "20px 24px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            Bartr<span style={{ color: "#eab308" }}>.</span>
          </div>
          <div style={{ fontSize: 10, color: "#4b5563", marginTop: 1, letterSpacing: 0.5 }}>Teach what you know.</div>
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

      {/* Tabs */}
      <div style={{
        width: "100%", maxWidth: 420,
        display: "flex", padding: "0 24px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        {TABS.map((tab, i) => (
          <button key={tab.label} onClick={() => setActiveTab(i)} style={{
            flex: 1, padding: "12px 0",
            background: "transparent", border: "none",
            borderBottom: activeTab === i ? "2px solid #eab308" : "2px solid transparent",
            color: activeTab === i ? "#eab308" : "#4b5563",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s", letterSpacing: 0.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
            {tab.label === "Matches" && matches.length > 0 && (
              <span style={{
                background: "#eab308", borderRadius: "50%",
                width: 17, height: 17,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "#080b14", fontWeight: 800,
              }}>{matches.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ width: "100%", maxWidth: 420, flex: 1, padding: "16px 24px 100px" }}>

        {/* DISCOVER */}
        {activeTab === 0 && (
          <div>
            {profiles.length > 0 ? (
              <>
                {/* Stack */}
                <div style={{ position: "relative", height: 510, marginBottom: 28 }}>
                  {profiles[1] && (
                    <div style={{
                      position: "absolute", width: "100%", maxWidth: 360,
                      top: 10, left: "50%", transform: "translateX(-50%) scale(0.95)",
                      opacity: 0.4, pointerEvents: "none",
                    }}>
                      <div style={{
                        background: "#0f1623", borderRadius: 24, height: 80,
                        border: "1px solid rgba(255,255,255,0.04)",
                      }} />
                    </div>
                  )}
                  <div style={{ position: "absolute", width: "100%", left: "50%", transform: "translateX(-50%)" }}>
                    <SwipeCard profile={profiles[0]} onSwipe={handleSwipe} isTop={true} />
                  </div>
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
                    fontSize: 20, cursor: "pointer", transition: "all 0.2s",
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
        )}

        {/* MATCHES */}
        {activeTab === 1 && (
          <div>
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
          <div>
            <div style={{
              background: "#0f1623",
              borderRadius: 20, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {/* Profile header */}
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
                {/* Offering */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2.5, color: "#4b5563", marginBottom: 10, fontWeight: 700 }}>I OFFER</div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "rgba(234,179,8,0.06)",
                    border: "1px solid rgba(234,179,8,0.2)",
                    borderRadius: 14, padding: "14px 16px",
                  }}>
                    <span style={{ fontSize: 30 }}>{YOUR_PROFILE.offeringIcon}</span>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>
                        {YOUR_PROFILE.offering}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Mid-level · Available weekends</div>
                    </div>
                  </div>
                </div>

                {/* Seeking */}
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

                {/* Stats */}
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

            {/* Edit button */}
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
            maxWidth: 320,
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