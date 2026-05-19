import { useState } from "react";
import { CATEGORIES } from "../lib/skillsData.js";

/**
 * Reusable skill picker with category tabs and search.
 *
 * Props:
 *   mode      - "single" | "multi"
 *   skills    - base SKILLS array [{ icon, label, category }]
 *   value     - single: skill object | null   multi: string[] of labels
 *   onChange  - single: (skillObj) => void    multi: (label) => void  (toggles)
 *   exclude   - label string to hide (e.g. hide offering from seeking list)
 */
export default function SkillPicker({ mode, skills, value, onChange, exclude }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const trimmed = search.trim();

  const filtered = skills
    .filter((s) => s.label !== exclude)
    .filter((s) => {
      if (trimmed) return s.label.toLowerCase().includes(trimmed.toLowerCase());
      if (activeCategory === "All") return true;
      return s.category === activeCategory;
    });

  const isSelected = (skill) =>
    mode === "single"
      ? value?.label === skill.label
      : (value || []).includes(skill.label);

  const handleSelect = (skill) => {
    if (mode === "single") onChange(skill);
    else onChange(skill.label);
  };

  return (
    <div>
      {/* Category tabs */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", marginBottom: 10,
        paddingBottom: 2,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSearch(""); }}
            style={{
              flexShrink: 0,
              padding: "8px 12px",
              minHeight: 36,
              borderRadius: 20,
              border: activeCategory === cat && !trimmed
                ? "1px solid rgba(234,179,8,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              background: activeCategory === cat && !trimmed
                ? "rgba(234,179,8,0.12)"
                : "rgba(255,255,255,0.03)",
              color: activeCategory === cat && !trimmed ? "#eab308" : "#6b7280",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
          >{cat}</button>
        ))}
      </div>

      {/* Search input */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, pointerEvents: "none",
        }}>🔍</span>
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "12px 16px 12px 38px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, color: "#f9fafb", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", minHeight: 44,
          }}
        />
      </div>

      {/* Skills grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10, maxHeight: 320, overflowY: "auto",
      }}>
        {filtered.map((skill) => {
          const selected = isSelected(skill);
          return (
            <button
              key={skill.label}
              onClick={() => handleSelect(skill)}
              style={{
                padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                background: selected
                  ? "rgba(234,179,8,0.12)"
                  : "rgba(255,255,255,0.03)",
                border: selected
                  ? "1px solid rgba(234,179,8,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 24 }}>{skill.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3,
                color: selected ? "#eab308" : "#9ca3af",
              }}>{skill.label}</span>
            </button>
          );
        })}

        {filtered.length === 0 && (
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
