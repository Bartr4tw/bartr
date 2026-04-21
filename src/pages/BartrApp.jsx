import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../lib/supabase.js";
import { SKILLS, CATEGORIES, getBorough } from "../lib/skillsData.js";

const C = {
  cream: "#FAF6EE", warmWhite: "#FDFAF4",
  sand: "#F5EFE0", sandDark: "#EDE3CC",
  clay: "#C07A52", clayDeep: "#9B5C38",
  terracotta: "#D4714A",
  bark: "#4A3728", barkLight: "#7A5C47",
  moss: "#7A8C5C",
};

function transformProfile(row) {
  const seekingLabels = row.seeking ? row.seeking.split(",").map((s) => s.trim()).filter(Boolean) : [];
  return {
    id: row.id,
    name: row.full_name,
    location: row.location,
    bio: row.bio,
    age: row.age || null,
    avatar: row.full_name
      ? row.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : "?",
    avatarUrl: row.avatar_url || null,
    offering: row.offering,
    offeringIcon: row.offering_icon,
    offeringDesc: row.bio,
    seeking: seekingLabels,
    seekingIcons: seekingLabels.map((s) => SKILLS.find((sk) => sk.label === s)?.icon || "✨"),
    instagramHandle: row.instagram_handle || null,
    linkedinUrl: row.linkedin_url || null,
    availability: Array.isArray(row.availability) ? row.availability : [],
    swapPreference: Array.isArray(row.swap_preference) ? row.swap_preference : [],
    swapsCompleted: row.swaps_completed || 0,
    gender: row.gender || null,
    tradeRequest: null,
  };
}

async function enrichWithTradeRequests(profiles) {
  if (!profiles.length) return profiles;
  const ids = profiles.map((p) => p.id).join(",");
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/trade_requests?user_id=in.(${ids})&status=eq.open`,
    { headers }
  );
  const rows = await res.json();
  if (!Array.isArray(rows)) return profiles;
  const byUserId = {};
  rows.forEach((r) => { byUserId[r.user_id] = r; });
  return profiles.map((p) => ({ ...p, tradeRequest: byUserId[p.id] || null }));
}

const PRONOUN_MAP = { Woman: "She/her", Man: "He/him", "Non-binary": "They/them" };

const DEFAULT_FILTERS = {
  gender_preference: [], age_min: 18, age_max: 60,
  boroughs: [], swap_preference: [], skill_categories: [],
};

function isFiltersActive(f) {
  return (
    f.gender_preference.length > 0 ||
    f.age_min > 18 || f.age_max < 60 ||
    f.boroughs.length > 0 ||
    f.swap_preference.length > 0 ||
    f.skill_categories.length > 0
  );
}

function applyFiltersToProfiles(pool, f) {
  return pool.filter((p) => {
    if (f.gender_preference.length > 0) {
      if (!p.gender || !f.gender_preference.includes(p.gender)) return false;
    }
    if (f.age_min > 18 || f.age_max < 60) {
      if (p.age != null && (p.age < f.age_min || p.age > f.age_max)) return false;
    }
    if (f.boroughs.length > 0) {
      const profileBorough = getBorough(p.location);
      if (!profileBorough || !f.boroughs.includes(profileBorough)) return false;
    }
    if (f.swap_preference.length > 0) {
      if (!Array.isArray(p.swapPreference) || !p.swapPreference.some((sp) => f.swap_preference.includes(sp))) return false;
    }
    if (f.skill_categories.length > 0) {
      const skill = SKILLS.find((s) => s.label === p.offering);
      if (!skill || !f.skill_categories.includes(skill.category)) return false;
    }
    return true;
  });
}

function Avatar({ url, initials, size, fontSize, border }) {
  const shared = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
  };
  if (url) return (
    <img src={url} style={{
      ...shared, objectFit: "cover",
      border: border ?? `2px solid ${C.sandDark}`,
    }} />
  );
  return (
    <div style={{
      ...shared,
      background: C.sand,
      border: border ?? `2px solid ${C.sandDark}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Fraunces', serif", fontWeight: 600,
      fontSize, color: C.terracotta,
    }}>{initials}</div>
  );
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

function SwipeCard({ profile, yourProfile, onSwipe, onTradeRespond, isMobile }) {
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
        border: `3px solid ${C.terracotta}`, borderRadius: 8, padding: "4px 14px",
        color: C.terracotta, fontFamily: "'Fraunces', serif", fontWeight: 600,
        fontSize: 18, letterSpacing: 2, opacity: connectOpacity,
        transform: "rotate(-15deg)", pointerEvents: "none",
      }}>CONNECT</div>
      <div style={{
        position: "absolute", top: 24, right: 24, zIndex: 20,
        border: `3px solid ${C.barkLight}`, borderRadius: 8, padding: "4px 14px",
        color: C.barkLight, fontFamily: "'Fraunces', serif", fontWeight: 600,
        fontSize: 18, letterSpacing: 2, opacity: skipOpacity,
        transform: "rotate(15deg)", pointerEvents: "none",
      }}>SKIP</div>

      {/* Card */}
      <div style={{
        background: C.warmWhite, borderRadius: 20, height: "100%",
        boxShadow: "0 4px 16px rgba(74,55,40,0.07), 0 0 0 1.5px " + C.sandDark,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Photo area ── */}
        <div style={{ height: 200, flexShrink: 0, position: "relative", overflow: "hidden" }}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg, ${C.sand}, ${C.sandDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 80, color: C.terracotta, lineHeight: 1 }}>
                {profile.avatar}
              </span>
            </div>
          )}

          {/* Dark gradient for text legibility */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(30,18,10,0.72) 100%)",
            pointerEvents: "none",
          }} />

          {/* Swaps completed badge — top right, hidden if 0 */}
          {profile.swapsCompleted > 0 && (
            <div style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(30,18,10,0.55)", backdropFilter: "blur(6px)",
              borderRadius: 100, padding: "4px 10px",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
                {profile.swapsCompleted} swaps done
              </span>
            </div>
          )}

          {/* Name / age / location overlay */}
          <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, pointerEvents: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <span style={{
                fontFamily: "'Fraunces', serif", fontWeight: 600,
                fontSize: 22, color: "#fff", lineHeight: 1.1,
              }}>
                {profile.name}{profile.age ? `, ${profile.age}` : ""}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.82)" }}>
              📍 {profile.location}{PRONOUN_MAP[profile.gender] ? ` · ${PRONOUN_MAP[profile.gender]}` : ""}
            </div>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* Social links */}
          {(profile.instagramHandle || profile.linkedinUrl) && (
            <div style={{
              display: "flex", gap: 8, padding: "12px 16px",
              borderBottom: `1px solid ${C.sandDark}`,
            }}>
              {profile.instagramHandle && (
                <a
                  href={`https://instagram.com/${profile.instagramHandle.replace(/^@/, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(212,113,74,0.08)", border: `1px solid rgba(212,113,74,0.25)`,
                    borderRadius: 100, padding: "5px 12px",
                  }}>
                    <span style={{ fontSize: 13 }}>📸</span>
                    <span style={{ fontSize: 12, color: C.terracotta, fontWeight: 500 }}>
                      @{profile.instagramHandle.replace(/^@/, "")}
                    </span>
                  </div>
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl.startsWith("http") ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.2)",
                    borderRadius: 100, padding: "5px 12px",
                  }}>
                    <span style={{ fontSize: 13 }}>💼</span>
                    <span style={{ fontSize: 12, color: "#0a66c2", fontWeight: 500 }}>LinkedIn</span>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Match signal banner */}
          {profile.seeking.includes(yourProfile.offering) && (
            <div style={{
              margin: "12px 16px 0",
              background: `rgba(90,158,111,0.08)`,
              border: `1px solid rgba(90,158,111,0.28)`,
              borderRadius: 12, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 15 }}>⚡</span>
              <span style={{ fontSize: 13, color: "#5a9e6f", fontWeight: 500, lineHeight: 1.4 }}>
                {profile.name.split(" ")[0]} wants to learn {yourProfile.offering}
              </span>
            </div>
          )}

          {/* Offering block */}
          <div style={{
            margin: "12px 16px 0",
            background: C.sand, border: `1px solid ${C.sandDark}`,
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: C.barkLight, fontWeight: 700, marginBottom: 8 }}>OFFERING</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: profile.bio ? 10 : 0 }}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{profile.offeringIcon}</span>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark }}>
                {profile.offering}
              </div>
            </div>
            {profile.bio && (
              <p style={{ fontSize: 13, color: C.barkLight, lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
            )}
          </div>

          {/* Trade Request */}
          {profile.tradeRequest && (
            <div style={{ margin: "12px 16px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: C.barkLight, fontWeight: 700 }}>OPEN TRADE REQUEST</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5a9e6f" }} />
                  <span style={{ fontSize: 10, color: "#5a9e6f", fontWeight: 600 }}>Accepting responses</span>
                </div>
              </div>
              <div style={{
                background: "#FDF6EE", border: `1.5px solid ${C.clay}`,
                borderRadius: 12, padding: "12px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: profile.tradeRequest.note ? 10 : 12 }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: C.barkLight, marginBottom: 4 }}>{profile.name.split(" ")[0]} offers</div>
                    <div style={{ fontSize: 22 }}>{profile.tradeRequest.offering_icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.bark, marginTop: 3 }}>{profile.tradeRequest.offering_skill}</div>
                    <div style={{ fontSize: 11, color: C.barkLight }}>{profile.tradeRequest.offering_qty} {profile.tradeRequest.offering_unit}</div>
                  </div>
                  <div style={{ fontSize: 20, color: C.clay, fontWeight: 700, flexShrink: 0 }}>⇄</div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: C.barkLight, marginBottom: 4 }}>{profile.name.split(" ")[0]} wants</div>
                    <div style={{ fontSize: 22 }}>{profile.tradeRequest.wanting_icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.bark, marginTop: 3 }}>{profile.tradeRequest.wanting_skill}</div>
                    <div style={{ fontSize: 11, color: C.barkLight }}>{profile.tradeRequest.wanting_qty} {profile.tradeRequest.wanting_unit}</div>
                  </div>
                </div>
                {profile.tradeRequest.note && (
                  <div style={{ fontSize: 12, color: C.barkLight, fontStyle: "italic", marginBottom: 10 }}>
                    {profile.tradeRequest.note}
                  </div>
                )}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onTradeRespond(profile.tradeRequest); }}
                  style={{
                    width: "100%", padding: "9px", minHeight: 40,
                    background: C.terracotta, border: "none", borderRadius: 100,
                    color: C.cream, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}
                >Respond →</button>
              </div>
            </div>
          )}

          {/* Availability */}
          {profile.availability?.length > 0 && (
            <div style={{ margin: "12px 16px 0" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: C.barkLight, fontWeight: 700, marginBottom: 8 }}>AVAILABILITY</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {profile.availability.map(a => (
                  <span key={a} style={{
                    background: C.warmWhite, border: `1px solid ${C.sandDark}`,
                    borderRadius: 100, padding: "4px 12px",
                    fontSize: 12, color: C.barkLight, fontWeight: 500,
                  }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Swap preference */}
          {profile.swapPreference?.length > 0 && (
            <div style={{ margin: "12px 16px 0" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: C.barkLight, fontWeight: 700, marginBottom: 8 }}>SWAP PREFERENCE</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {profile.swapPreference.map(p => (
                  <span key={p} style={{
                    background: C.warmWhite, border: `1px solid ${C.sandDark}`,
                    borderRadius: 100, padding: "4px 12px",
                    fontSize: 12, color: C.barkLight, fontWeight: 500,
                  }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Wants to learn — 3-column grid */}
          {profile.seeking.length > 0 && (
            <div style={{ margin: "12px 16px 16px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: C.barkLight, fontWeight: 700, marginBottom: 8 }}>WANTS TO LEARN</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {profile.seeking.map((s, i) => {
                  const isMatch = s === yourProfile.offering;
                  return (
                    <div key={s} style={{
                      borderRadius: 10, padding: "10px 6px", textAlign: "center",
                      background: isMatch ? `rgba(90,158,111,0.10)` : C.warmWhite,
                      border: isMatch ? `1.5px solid rgba(90,158,111,0.35)` : `1px solid ${C.sandDark}`,
                    }}>
                      {profile.seekingIcons?.[i] && (
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{profile.seekingIcons[i]}</div>
                      )}
                      <div style={{ fontSize: 11, color: isMatch ? "#5a9e6f" : C.barkLight, fontWeight: isMatch ? 600 : 400, lineHeight: 1.3 }}>
                        {s}
                      </div>
                      {isMatch && (
                        <div style={{ fontSize: 9, color: "#5a9e6f", marginTop: 3, fontWeight: 700 }}>you offer!</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MatchCard({ profile, yourProfile }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/profile/${profile.id}`)}
      style={{
        background: C.warmWhite, borderRadius: 16, padding: "16px",
        border: `1.5px solid ${C.sandDark}`,
        boxShadow: "0 4px 16px rgba(74,55,40,0.07)",
        display: "flex", alignItems: "center", gap: 14,
        cursor: "pointer",
      }}>
      <Avatar url={profile.avatarUrl} initials={profile.avatar} size={50} fontSize={15} border={`1.5px solid ${C.sandDark}`} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: C.bark, fontSize: 16 }}>
          {profile.name}
        </div>
        <div style={{ fontSize: 12, color: C.barkLight, marginTop: 2 }}>
          {profile.offeringIcon} {profile.offering} <span style={{ color: C.terracotta }}>↔</span> {yourProfile.offeringIcon} {yourProfile.offering}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/chat/${profile.id}`); }}
        style={{
          background: `rgba(212,113,74,0.10)`,
          border: `1px solid rgba(212,113,74,0.25)`,
          borderRadius: 100, padding: "7px 16px",
          color: C.terracotta, fontSize: 12, fontWeight: 500, cursor: "pointer",
          minHeight: 44,
        }}>Message</button>
    </div>
  );
}

export default function BartrApp({ profile, session }) {
  const authHeaders = {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session?.access_token}`,
  };
  const seekingLabels = profile?.seeking ? profile.seeking.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const YOUR_PROFILE = {
    name: profile?.full_name || "You",
    avatar: profile?.full_name
      ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : "?",
    avatarUrl: profile?.avatar_url || null,
    location: profile?.location || "",
    offering: profile?.offering || "",
    offeringIcon: profile?.offering_icon || "📊",
    seeking: seekingLabels,
    seekingIcons: seekingLabels.map((s) => SKILLS.find((sk) => sk.label === s)?.icon || "✨"),
  };
  const [activeTab, setActiveTab] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [showMatch, setShowMatch] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [secondChance, setSecondChance] = useState(false);
  const [secondChanceLoading, setSecondChanceLoading] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState(() => {
    const pf = profile?.filters;
    if (pf && typeof pf === "object") {
      return {
        gender_preference: Array.isArray(pf.gender_preference) ? pf.gender_preference : [],
        age_min: typeof pf.age_min === "number" ? pf.age_min : 18,
        age_max: typeof pf.age_max === "number" ? Math.min(pf.age_max, 60) : 60,
        boroughs: Array.isArray(pf.boroughs) ? pf.boroughs : [],
        swap_preference: Array.isArray(pf.swap_preference) ? pf.swap_preference : [],
        skill_categories: Array.isArray(pf.skill_categories) ? pf.skill_categories : [],
      };
    }
    return { ...DEFAULT_FILTERS };
  });
  const [pendingFilters, setPendingFilters] = useState({ ...DEFAULT_FILTERS });
  const allProfilesRef = useRef([]);
  const sessionSwipedIds = useRef(new Set());

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
        const transformed = (Array.isArray(rows) ? rows : []).map(transformProfile);
        const enriched = await enrichWithTradeRequests(transformed);
        allProfilesRef.current = enriched;
        setProfiles(applyFiltersToProfiles(enriched, filters));
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

  const loadSecondChance = async () => {
    setSecondChanceLoading(true);
    // Fetch IDs the user swiped left on
    const swipesRes = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/swipes?swiper_id=eq.${profile.id}&direction=eq.left&select=swiped_id`,
      { headers: authHeaders }
    ).then((r) => r.json());

    const leftIds = (Array.isArray(swipesRes) ? swipesRes : []).map((s) => s.swiped_id);
    if (!leftIds.length) {
      setSecondChance(true);
      setSecondChanceLoading(false);
      return;
    }

    // Exclude anyone already matched
    const [matchesAsA, matchesAsB] = await Promise.all([
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matches?user_a=eq.${profile.id}&select=user_b`, { headers: authHeaders }).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matches?user_b=eq.${profile.id}&select=user_a`, { headers: authHeaders }).then((r) => r.json()),
    ]);
    const matchedIds = new Set([
      ...(Array.isArray(matchesAsA) ? matchesAsA : []).map((m) => m.user_b),
      ...(Array.isArray(matchesAsB) ? matchesAsB : []).map((m) => m.user_a),
    ]);
    const eligibleIds = leftIds.filter((id) => !matchedIds.has(id));

    if (!eligibleIds.length) {
      setSecondChance(true);
      setSecondChanceLoading(false);
      return;
    }

    const rows = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=in.(${eligibleIds.join(",")})&select=*`,
      { headers: authHeaders }
    ).then((r) => r.json());

    const transformed = (Array.isArray(rows) ? rows : []).map(transformProfile);
    const enriched = await enrichWithTradeRequests(transformed);
    allProfilesRef.current = enriched;
    setProfiles(applyFiltersToProfiles(enriched, filters));
    setSecondChance(true);
    setSecondChanceLoading(false);
  };

  const handleSwipe = async (direction) => {
    const current = profiles[0];
    if (!current) return;

    // Update UI immediately
    sessionSwipedIds.current.add(current.id);
    setLastAction(direction);
    setProfiles((p) => p.slice(1));
    setTimeout(() => setLastAction(null), 400);

    if (secondChance) {
      // Update existing swipe record instead of inserting (unique constraint on swiper+swiped)
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/swipes?swiper_id=eq.${profile.id}&swiped_id=eq.${current.id}`,
        {
          method: "PATCH",
          keepalive: true,
          headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ direction }),
        }
      );
    } else {
      // Record swipe in DB (keepalive ensures it completes even if page navigates away)
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/swipes`, {
        method: "POST",
        keepalive: true,
        headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ swiper_id: profile.id, swiped_id: current.id, direction }),
      });
    }

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

  const handleApplyFilters = async () => {
    setFilters(pendingFilters);
    setFilterSheetOpen(false);
    const pool = allProfilesRef.current.filter((p) => !sessionSwipedIds.current.has(p.id));
    setProfiles(applyFiltersToProfiles(pool, pendingFilters));
    const headers = await getAuthHeaders();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ filters: pendingFilters }),
    });
  };

  const removeFilterTag = async (type, value) => {
    const newFilters = type === "age_range"
      ? { ...filters, age_min: 18, age_max: 60 }
      : { ...filters, [type]: filters[type].filter((v) => v !== value) };
    setFilters(newFilters);
    const pool = allProfilesRef.current.filter((p) => !sessionSwipedIds.current.has(p.id));
    setProfiles(applyFiltersToProfiles(pool, newFilters));
    const headers = await getAuthHeaders();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ filters: newFilters }),
    });
  };

  const filtersActive = isFiltersActive(filters);

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      background: C.cream,
      fontFamily: "'DM Sans', sans-serif",
      color: C.bark,
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes matchPop { from { opacity:0; transform:translate(-50%,-50%) scale(0.8); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .age-slider { -webkit-appearance:none; appearance:none; position:absolute; left:0; top:-7px; width:100%; height:20px; background:transparent; pointer-events:none; outline:none; }
        .age-slider::-webkit-slider-thumb { -webkit-appearance:none; pointer-events:all; width:20px; height:20px; border-radius:50%; background:#D4714A; cursor:pointer; border:2px solid #fff; box-shadow:0 1px 4px rgba(74,55,40,0.2); }
        .age-slider::-moz-range-thumb { pointer-events:all; width:20px; height:20px; border-radius:50%; background:#D4714A; cursor:pointer; border:2px solid #fff; }
      `}</style>

      {/* Header */}
      <div style={{
        height: HEADER_HEIGHT, flexShrink: 0,
        padding: isMobile ? "0 20px" : "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.sandDark}`,
        background: C.warmWhite,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, letterSpacing: -0.5, color: C.bark }}>
              Bartr<span style={{ color: C.terracotta }}>.</span>
            </div>
          </a>
          {!isMobile && (
            <div style={{ display: "flex" }}>
              {TABS.filter(tab => tab.label !== "Profile").map((tab, i) => (
                <button key={tab.label} onClick={() => { setActiveTab(i); if (i === 0) setSecondChance(false); }} style={{
                  padding: "0 18px", height: HEADER_HEIGHT,
                  background: "transparent", border: "none",
                  borderBottom: activeTab === i ? `2px solid ${C.terracotta}` : "2px solid transparent",
                  color: activeTab === i ? C.terracotta : C.barkLight,
                  fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {tab.icon} {tab.label}
                  {tab.label === "Matches" && matches.length > 0 && (
                    <span style={{
                      background: C.terracotta, borderRadius: "50%", width: 17, height: 17,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: C.warmWhite, fontWeight: 700,
                    }}>{matches.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {activeTab === 0 && (
            <button
              onClick={() => {
                setPendingFilters({ ...DEFAULT_FILTERS, ...filters, age_max: Math.min(filters.age_max, 60) });
                setFilterSheetOpen(true);
              }}
              style={{
                position: "relative",
                padding: "6px 14px", minHeight: 36, borderRadius: 100,
                background: filtersActive ? "#FDF0EA" : C.sand,
                border: `1.5px solid ${filtersActive ? C.terracotta : C.sandDark}`,
                color: filtersActive ? C.clayDeep : C.barkLight,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}
            >
              Filters
              {filtersActive && (
                <div style={{
                  position: "absolute", top: -3, right: -3,
                  width: 8, height: 8, borderRadius: "50%",
                  background: C.terracotta, border: `2px solid ${C.warmWhite}`,
                }} />
              )}
            </button>
          )}
          <button onClick={() => navigate(`/profile/${profile.id}`)} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.sand, border: `1px solid ${C.sandDark}`,
            borderRadius: 100, padding: "6px 14px", color: C.barkLight,
            fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
            minHeight: 44,
          }}>◉ Profile</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* DISCOVER */}
        {activeTab === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Active filter tags row */}
            {filtersActive && (
              <div style={{
                flexShrink: 0, display: "flex", gap: 6, alignItems: "center",
                overflowX: "auto", padding: "8px 16px",
                borderBottom: `1px solid ${C.sandDark}`,
                background: C.warmWhite, scrollbarWidth: "none",
              }}>
                {[
                  ...filters.gender_preference.map((g) => ({ label: g, type: "gender_preference", value: g })),
                  ...(filters.age_min > 18 || filters.age_max < 60
                    ? [{ label: `Ages ${filters.age_min}-${filters.age_max}`, type: "age_range", value: null }]
                    : []),
                  ...filters.boroughs.map((b) => ({ label: b, type: "boroughs", value: b })),
                  ...filters.swap_preference.map((s) => ({ label: s, type: "swap_preference", value: s })),
                  ...filters.skill_categories.map((c) => ({ label: c, type: "skill_categories", value: c })),
                ].map((tag, i) => (
                  <div key={i} style={{
                    display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
                    background: "#FDF0EA", border: `1px solid ${C.terracotta}`,
                    borderRadius: 100, padding: "3px 7px",
                    fontSize: 9, color: C.clayDeep, fontWeight: 500,
                  }}>
                    {tag.label}
                    <button
                      onClick={() => removeFilterTag(tag.type, tag.value)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: C.clayDeep, fontSize: 9, padding: 0, lineHeight: 1,
                        display: "flex", alignItems: "center",
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Main content row */}
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
                        pointerEvents: "none", background: C.warmWhite,
                        borderRadius: 24, border: `1.5px solid ${C.sandDark}`,
                      }} />
                    )}
                    <div style={{ position: "absolute", inset: 0 }}>
                      <SwipeCard
                        profile={profiles[0]}
                        yourProfile={YOUR_PROFILE}
                        onSwipe={handleSwipe}
                        isMobile={isMobile}
                        onTradeRespond={(tr) => {
                          const msg = encodeURIComponent(
                            `Hey! I saw your trade request - I can help with ${tr.wanting_skill}. Would you be open to swapping for ${tr.offering_skill}?`
                          );
                          navigate(`/chat/${profiles[0].id}?prefillMessage=${msg}`);
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 48 }}>
                    <button onClick={() => handleSwipe("left")} style={{
                      width: 58, height: 58, borderRadius: "50%",
                      background: lastAction === "left" ? C.sandDark : C.sand,
                      border: `1px solid ${C.sandDark}`,
                      fontSize: 22, cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", color: C.barkLight,
                    }}>✕</button>
                    <button onClick={() => handleSwipe("right")} style={{
                      width: 68, height: 68, borderRadius: "50%",
                      background: lastAction === "right" ? `rgba(212,113,74,0.20)` : `rgba(212,113,74,0.10)`,
                      border: `2px solid rgba(212,113,74,0.45)`,
                      fontSize: 26, cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 0 24px rgba(212,113,74,0.15)",
                    }}>⚡</button>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: C.barkLight, letterSpacing: 0.5 }}>
                    SWIPE OR TAP · ✕ SKIP · ⚡ CONNECT
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", maxWidth: 320 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>
                    {profilesLoading ? "⏳" : secondChance ? "🔁" : "✨"}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 400, color: C.bark, marginBottom: 8 }}>
                    {profilesLoading
                      ? "Finding skill traders..."
                      : secondChance
                      ? "That's everyone you skipped"
                      : "You've seen everyone"}
                  </div>
                  <div style={{ color: C.barkLight, fontSize: 14, marginBottom: 24 }}>
                    {profilesLoading
                      ? ""
                      : secondChance
                      ? "Check back soon for new skill traders"
                      : "Want to give someone a second look?"}
                  </div>
                  {!profilesLoading && !secondChance && (
                    <button
                      onClick={loadSecondChance}
                      disabled={secondChanceLoading}
                      style={{
                        background: C.sand,
                        border: `1.5px solid ${C.sandDark}`,
                        borderRadius: 100, padding: "12px 28px",
                        color: C.bark, fontSize: 14, fontWeight: 500,
                        cursor: secondChanceLoading ? "not-allowed" : "pointer",
                        opacity: secondChanceLoading ? 0.6 : 1,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {secondChanceLoading ? "Loading..." : "Give another look →"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            {!isMobile && (
              <div style={{
                width: 260, flexShrink: 0,
                borderLeft: `1px solid ${C.sandDark}`,
                padding: "28px 20px",
                overflowY: "auto",
                display: "flex", flexDirection: "column", gap: 14,
                background: C.warmWhite,
              }}>
                <div style={{
                  background: C.warmWhite, borderRadius: 18,
                  border: `1.5px solid ${C.sandDark}`,
                  boxShadow: "0 4px 16px rgba(74,55,40,0.07)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    background: C.sand,
                    padding: "16px", borderBottom: `1px solid ${C.sandDark}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar url={YOUR_PROFILE.avatarUrl} initials={YOUR_PROFILE.avatar} size={44} fontSize={16} />
                      <div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: C.bark }}>{YOUR_PROFILE.name}</div>
                        <div style={{ fontSize: 11, color: C.barkLight }}>📍 {YOUR_PROFILE.location}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px" }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: C.barkLight, marginBottom: 8, fontWeight: 700 }}>YOU OFFER</div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: C.sand,
                      border: `1px solid ${C.sandDark}`,
                      borderRadius: 10, padding: "9px 12px",
                    }}>
                      <span style={{ fontSize: 18 }}>{YOUR_PROFILE.offeringIcon}</span>
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 600, color: C.bark }}>{YOUR_PROFILE.offering}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: C.warmWhite, borderRadius: 14,
                  border: `1.5px solid ${C.sandDark}`,
                  boxShadow: "0 4px 16px rgba(74,55,40,0.07)",
                  padding: "14px", display: "flex", justifyContent: "space-around",
                }}>
                  {[["Left", profiles.length], ["Matched", matches.length]].map(([label, val]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 400, color: C.clayDeep }}>{val}</div>
                      <div style={{ fontSize: 10, color: C.barkLight }}>{label.toUpperCase()}</div>
                    </div>
                  ))}
                </div>

                {matches.length > 0 && (
                  <div style={{
                    background: C.warmWhite, borderRadius: 14,
                    border: `1.5px solid ${C.sandDark}`,
                    boxShadow: "0 4px 16px rgba(74,55,40,0.07)",
                    padding: "14px",
                  }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: C.barkLight, marginBottom: 10, fontWeight: 700 }}>MATCHES</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {matches.slice(0, 5).map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar url={m.avatarUrl} initials={m.avatar} size={34} fontSize={11} border={`1.5px solid ${C.sandDark}`} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.bark }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: C.barkLight }}>{m.offeringIcon} {m.offering}</div>
                          </div>
                          <button onClick={() => navigate(`/chat/${m.id}`)} style={{
                            background: "transparent", border: "none",
                            color: C.terracotta, fontSize: 10, cursor: "pointer", fontWeight: 500,
                          }}>Chat</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}

        {/* MATCHES */}
        {activeTab === 1 && (
          <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px 100px" : "40px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              {matches.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 80 }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>⚡</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 400, color: C.bark, marginBottom: 8 }}>No matches yet</div>
                  <div style={{ color: C.barkLight, fontSize: 13 }}>Start discovering skill partners</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: C.barkLight, marginBottom: 16, letterSpacing: 0.5 }}>
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

      </div>

      {/* Mobile bottom tabs */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: C.warmWhite,
          borderTop: `1px solid ${C.sandDark}`,
          display: "flex", padding: "8px 0 16px", zIndex: 40,
        }}>
          {TABS.map((tab, i) => (
            <button key={tab.label} onClick={() => {
              if (i === 2) { navigate(`/profile/${profile.id}`); return; }
              setActiveTab(i);
              if (i === 0) setSecondChance(false);
            }} style={{
              flex: 1, padding: "8px 0", background: "transparent", border: "none",
              color: activeTab === i ? C.terracotta : C.barkLight,
              fontSize: 11, fontWeight: 500, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              minHeight: 44,
            }}>
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter sheet */}
      {filterSheetOpen && (
        <>
          <div onClick={() => setFilterSheetOpen(false)} style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(74,55,40,0.4)",
          }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51,
            background: C.warmWhite, borderRadius: "16px 16px 0 0",
            maxHeight: "85vh", overflowY: "auto",
            boxShadow: "0 -4px 32px rgba(74,55,40,0.16)",
          }}>
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: C.sandDark }} />
            </div>
            {/* Sheet header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px 12px", borderBottom: `1px solid ${C.sandDark}`,
            }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.bark }}>
                Filter people
              </div>
              <button
                onClick={() => setPendingFilters({ ...DEFAULT_FILTERS })}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: C.terracotta, fontSize: 14, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", padding: "4px 0", minHeight: 36,
                }}
              >Clear all</button>
            </div>

            <div style={{ padding: "0 20px 32px" }}>

              {/* Gender */}
              <div style={{ paddingTop: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.bark, marginBottom: 4 }}>Gender</div>
                <div style={{ fontSize: 11, color: C.barkLight, fontStyle: "italic", marginBottom: 10 }}>Select one or more</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Any", "Man", "Woman", "Non-binary", "Prefer not to say"].map((opt) => {
                    const isAny = opt === "Any";
                    const active = isAny
                      ? pendingFilters.gender_preference.length === 0
                      : pendingFilters.gender_preference.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => {
                          if (isAny) {
                            setPendingFilters((f) => ({ ...f, gender_preference: [] }));
                          } else {
                            setPendingFilters((f) => {
                              const cur = f.gender_preference;
                              const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
                              return { ...f, gender_preference: next };
                            });
                          }
                        }}
                        style={{
                          padding: "8px 14px", minHeight: 36, borderRadius: 100,
                          border: active ? `1.5px solid ${C.terracotta}` : `1px solid ${C.sandDark}`,
                          background: active ? "#FDF0EA" : C.sand,
                          color: active ? C.clayDeep : C.barkLight,
                          fontSize: 13, fontWeight: active ? 500 : 400,
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                        }}
                      >{opt}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: C.sandDark, marginBottom: 20 }} />

              {/* Age range */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.bark, marginBottom: 16 }}>Age range</div>
                <div style={{ position: "relative", height: 6, borderRadius: 3, background: C.sandDark, margin: "0 8px 12px" }}>
                  <div style={{
                    position: "absolute", top: 0, bottom: 0, borderRadius: 3, background: C.terracotta,
                    left: `${((pendingFilters.age_min - 18) / 42) * 100}%`,
                    right: `${100 - ((pendingFilters.age_max - 18) / 42) * 100}%`,
                  }} />
                  <input type="range" min={18} max={60} value={pendingFilters.age_min}
                    onChange={(e) => {
                      const v = Math.min(parseInt(e.target.value), pendingFilters.age_max - 1);
                      setPendingFilters((f) => ({ ...f, age_min: v }));
                    }}
                    className="age-slider"
                  />
                  <input type="range" min={18} max={60} value={pendingFilters.age_max}
                    onChange={(e) => {
                      const v = Math.max(parseInt(e.target.value), pendingFilters.age_min + 1);
                      setPendingFilters((f) => ({ ...f, age_max: v }));
                    }}
                    className="age-slider"
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.barkLight }}>
                  <span>{pendingFilters.age_min}</span>
                  <span>{pendingFilters.age_max}{pendingFilters.age_max === 60 ? "+" : ""}</span>
                </div>
              </div>

              <div style={{ height: 1, background: C.sandDark, marginBottom: 20 }} />

              {/* Borough */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.bark, marginBottom: 12 }}>Borough</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Any", "Manhattan", "Brooklyn", "Queens", "Bronx"].map((opt) => {
                    const isAny = opt === "Any";
                    const active = isAny
                      ? pendingFilters.boroughs.length === 0
                      : pendingFilters.boroughs.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => {
                          if (isAny) {
                            setPendingFilters((f) => ({ ...f, boroughs: [] }));
                          } else {
                            setPendingFilters((f) => {
                              const cur = f.boroughs;
                              const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
                              return { ...f, boroughs: next };
                            });
                          }
                        }}
                        style={{
                          padding: "8px 14px", minHeight: 36, borderRadius: 100,
                          border: active ? `1.5px solid ${C.terracotta}` : `1px solid ${C.sandDark}`,
                          background: active ? "#FDF0EA" : C.sand,
                          color: active ? C.clayDeep : C.barkLight,
                          fontSize: 13, fontWeight: active ? 500 : 400,
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                        }}
                      >{opt}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: C.sandDark, marginBottom: 20 }} />

              {/* Swap preference */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.bark, marginBottom: 12 }}>Swap preference</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Any", "In person", "Virtual"].map((opt) => {
                    const isAny = opt === "Any";
                    const active = isAny
                      ? pendingFilters.swap_preference.length === 0
                      : pendingFilters.swap_preference.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => {
                          if (isAny) {
                            setPendingFilters((f) => ({ ...f, swap_preference: [] }));
                          } else {
                            setPendingFilters((f) => {
                              const cur = f.swap_preference;
                              const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
                              return { ...f, swap_preference: next };
                            });
                          }
                        }}
                        style={{
                          padding: "8px 14px", minHeight: 36, borderRadius: 100,
                          border: active ? `1.5px solid ${C.terracotta}` : `1px solid ${C.sandDark}`,
                          background: active ? "#FDF0EA" : C.sand,
                          color: active ? C.clayDeep : C.barkLight,
                          fontSize: 13, fontWeight: active ? 500 : 400,
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                        }}
                      >{opt}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: C.sandDark, marginBottom: 20 }} />

              {/* Skill category */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.bark, marginBottom: 12 }}>Skill category</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Any", ...CATEGORIES.filter((c) => c !== "All")].map((opt) => {
                    const isAny = opt === "Any";
                    const active = isAny
                      ? pendingFilters.skill_categories.length === 0
                      : pendingFilters.skill_categories.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => {
                          if (isAny) {
                            setPendingFilters((f) => ({ ...f, skill_categories: [] }));
                          } else {
                            setPendingFilters((f) => {
                              const cur = f.skill_categories;
                              const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
                              return { ...f, skill_categories: next };
                            });
                          }
                        }}
                        style={{
                          padding: "8px 14px", minHeight: 36, borderRadius: 100,
                          border: active ? `1.5px solid ${C.terracotta}` : `1px solid ${C.sandDark}`,
                          background: active ? "#FDF0EA" : C.sand,
                          color: active ? C.clayDeep : C.barkLight,
                          fontSize: 13, fontWeight: active ? 500 : 400,
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                        }}
                      >{opt}</button>
                    );
                  })}
                </div>
              </div>

              {/* Apply */}
              <button
                onClick={handleApplyFilters}
                style={{
                  width: "100%", padding: "14px", minHeight: 50, borderRadius: 100,
                  background: C.terracotta, border: "none",
                  color: C.cream, fontSize: 15, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >Apply filters</button>
            </div>
          </div>
        </>
      )}

      {/* Match overlay */}
      {showMatch && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(250,246,238,0.88)",
          backdropFilter: "blur(8px)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: C.warmWhite, border: `1.5px solid ${C.sandDark}`,
            borderRadius: 28, padding: "44px 48px", textAlign: "center",
            boxShadow: "0 4px 16px rgba(74,55,40,0.07), 0 24px 64px rgba(74,55,40,0.12)",
            animation: "matchPop 0.4s cubic-bezier(.34,1.56,.64,1)",
            maxWidth: 320, margin: "0 20px",
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, color: C.terracotta, marginBottom: 8 }}>
              Skill Match!
            </div>
            <div style={{ fontSize: 14, color: C.barkLight, marginBottom: 20, lineHeight: 1.6 }}>
              You and <strong style={{ color: C.bark }}>{showMatch.name}</strong> can trade skills
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              background: C.sand, border: `1px solid ${C.sandDark}`,
              borderRadius: 14, padding: "14px 20px", fontSize: 13, color: C.barkLight,
            }}>
              <span>{showMatch.offeringIcon} {showMatch.offering}</span>
              <span style={{ color: C.terracotta, fontSize: 16 }}>↔</span>
              <span>{YOUR_PROFILE.offeringIcon} {YOUR_PROFILE.offering}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
