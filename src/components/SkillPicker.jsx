import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const authHeaders = {
  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

// Module-level cache so multiple SkillPicker instances on the same page
// share one fetch instead of each making their own request.
let _cache = null;
let _pending = null;

function loadCustomSkills() {
  if (_cache !== null) return Promise.resolve(_cache);
  if (_pending) return _pending;
  _pending = fetch(
    `${SUPABASE_URL}/rest/v1/custom_skills?select=label,icon&order=created_at.asc`,
    { headers: authHeaders }
  )
    .then((r) => r.json())
    .then((rows) => {
      _cache = Array.isArray(rows) ? rows : [];
      _pending = null;
      return _cache;
    })
    .catch(() => {
      _pending = null;
      _cache = [];
      return [];
    });
  return _pending;
}

function invalidateCache() {
  _cache = null;
  _pending = null;
}

/**
 * Reusable skill picker with search, shared custom skills, and duplicate detection.
 *
 * Props:
 *   mode      - "single" | "multi"
 *   skills    - base SKILLS array [{ icon, label }]
 *   value     - single: skill object | null   multi: string[] of labels
 *   onChange  - single: (skillObj) => void    multi: (label) => void  (toggles)
 *   exclude   - label string to hide (e.g. hide offering from seeking list)
 */
export default function SkillPicker({ mode, skills, value, onChange, exclude }) {
  const [search, setSearch] = useState("");
  const [dbSkills, setDbSkills] = useState([]);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "duplicate"|"error", text }
  const [highlightLabel, setHighlightLabel] = useState(null);
  const gridRef = useRef(null);
  const noticeTimer = useRef(null);

  useEffect(() => {
    loadCustomSkills().then(setDbSkills);
  }, []);

  const allSkills = [...skills, ...dbSkills];

  const trimmed = search.trim();
  const filtered = allSkills
    .filter((s) => s.label !== exclude)
    .filter((s) => !trimmed || s.label.toLowerCase().includes(trimmed.toLowerCase()));

  // Exact case-insensitive match against the full list (not just filtered)
  const exactMatch = allSkills.find(
    (s) => s.label.toLowerCase() === trimmed.toLowerCase()
  );
  const showAddCustom = trimmed.length > 0 && !exactMatch;

  const isSelected = (skill) =>
    mode === "single"
      ? value?.label === skill.label
      : (value || []).includes(skill.label);

  const handleSelect = (skill) => {
    if (mode === "single") onChange(skill);
    else onChange(skill.label);
  };

  const showNotice = (type, text) => {
    clearTimeout(noticeTimer.current);
    setNotice({ type, text });
    noticeTimer.current = setTimeout(() => {
      setNotice(null);
      setHighlightLabel(null);
    }, 3000);
  };

  const handleAddCustom = async () => {
    // Re-check for case-insensitive duplicate (handles race between typing and DB update)
    const existing = allSkills.find(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setSearch("");
      setHighlightLabel(existing.label);
      showNotice("duplicate", `"${existing.label}" is already available — highlighted below.`);
      // Scroll the grid so the highlighted tile is visible
      setTimeout(() => {
        gridRef.current?.querySelector("[data-highlight='true']")?.scrollIntoView({
          behavior: "smooth", block: "nearest",
        });
      }, 50);
      return;
    }

    setAdding(true);
    const newSkill = { icon: "✨", label: trimmed };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/custom_skills`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(newSkill),
    });

    if (res.ok) {
      invalidateCache();
      const updated = [...dbSkills, newSkill];
      setDbSkills(updated);
      _cache = updated;
      if (mode === "single") onChange(newSkill);
      else onChange(trimmed);
      setSearch("");
    } else if (res.status === 409) {
      // Unique constraint violation — someone else added it between our check and insert
      invalidateCache();
      const fresh = await loadCustomSkills();
      setDbSkills(fresh);
      const justAdded = fresh.find((s) => s.label.toLowerCase() === trimmed.toLowerCase());
      if (justAdded) {
        setSearch("");
        setHighlightLabel(justAdded.label);
        showNotice("duplicate", `"${justAdded.label}" was just added by someone else — highlighted below.`);
      }
    } else {
      showNotice("error", "Something went wrong. Please try again.");
    }

    setAdding(false);
  };

  return (
    <div>
      {/* Search / add input */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, pointerEvents: "none",
        }}>🔍</span>
        <input
          type="text"
          placeholder="Search skills or type a custom one..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setNotice(null); }}
          style={{
            width: "100%", padding: "10px 16px 10px 38px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, color: "#f9fafb", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </div>

      {/* Duplicate / error notice */}
      {notice && (
        <div style={{
          marginBottom: 10, padding: "9px 14px", borderRadius: 10, fontSize: 12,
          background: notice.type === "duplicate"
            ? "rgba(234,179,8,0.08)" : "rgba(239,68,68,0.08)",
          border: notice.type === "duplicate"
            ? "1px solid rgba(234,179,8,0.25)" : "1px solid rgba(239,68,68,0.2)",
          color: notice.type === "duplicate" ? "#eab308" : "#f87171",
        }}>
          {notice.text}
        </div>
      )}

      {/* "Add custom" prompt */}
      {showAddCustom && (
        <button
          onClick={handleAddCustom}
          disabled={adding}
          style={{
            width: "100%", marginBottom: 10,
            padding: "10px 16px",
            background: "rgba(234,179,8,0.06)",
            border: "1px dashed rgba(234,179,8,0.3)",
            borderRadius: 12, cursor: adding ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 10,
            color: "#eab308", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            opacity: adding ? 0.6 : 1,
          }}
        >
          <span style={{ fontSize: 18 }}>✨</span>
          {adding ? "Adding..." : `Add "${trimmed}" as a custom skill`}
        </button>
      )}

      {/* Skills grid */}
      <div
        ref={gridRef}
        style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10, maxHeight: 320, overflowY: "auto",
        }}
      >
        {filtered.map((skill) => {
          const selected = isSelected(skill);
          const highlighted = highlightLabel === skill.label;
          return (
            <button
              key={skill.label}
              data-highlight={highlighted || undefined}
              onClick={() => handleSelect(skill)}
              style={{
                padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                background: highlighted
                  ? "rgba(234,179,8,0.18)"
                  : selected
                  ? "rgba(234,179,8,0.12)"
                  : "rgba(255,255,255,0.03)",
                border: highlighted
                  ? "2px solid rgba(234,179,8,0.7)"
                  : selected
                  ? "1px solid rgba(234,179,8,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 24 }}>{skill.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3,
                color: highlighted || selected ? "#eab308" : "#9ca3af",
              }}>{skill.label}</span>
            </button>
          );
        })}

        {filtered.length === 0 && !showAddCustom && (
          <div style={{
            gridColumn: "1 / -1", textAlign: "center",
            padding: "24px 0", color: "#4b5563", fontSize: 13,
          }}>
            No skills found
          </div>
        )}
      </div>
    </div>
  );
}
