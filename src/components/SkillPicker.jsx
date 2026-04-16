import { useState } from "react";

/**
 * Reusable skill picker with search + custom skill support.
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

  // Derive any custom skills from the current value so they appear in the grid
  const customSkills =
    mode === "multi"
      ? (value || [])
          .filter((label) => !skills.find((s) => s.label === label))
          .map((label) => ({ icon: "✨", label }))
      : value && !skills.find((s) => s.label === value.label)
      ? [value]
      : [];

  const allSkills = [...skills, ...customSkills];

  const trimmed = search.trim();
  const filtered = allSkills
    .filter((s) => s.label !== exclude)
    .filter((s) => !trimmed || s.label.toLowerCase().includes(trimmed.toLowerCase()));

  const exactMatch = allSkills.some(
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

  const handleAddCustom = () => {
    const customSkill = { icon: "✨", label: trimmed };
    if (mode === "single") onChange(customSkill);
    else onChange(trimmed);
    setSearch("");
  };

  return (
    <div>
      {/* Search / add input */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, pointerEvents: "none",
        }}>🔍</span>
        <input
          type="text"
          placeholder="Search skills or type a custom one..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 16px 10px 38px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, color: "#f9fafb", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </div>

      {/* "Add custom" prompt */}
      {showAddCustom && (
        <button
          onClick={handleAddCustom}
          style={{
            width: "100%", marginBottom: 12,
            padding: "10px 16px",
            background: "rgba(234,179,8,0.06)",
            border: "1px dashed rgba(234,179,8,0.3)",
            borderRadius: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
            color: "#eab308", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span style={{ fontSize: 18 }}>✨</span>
          Add &ldquo;{trimmed}&rdquo; as a custom skill
        </button>
      )}

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
                background: selected ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.03)",
                border: selected ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 24 }}>{skill.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: selected ? "#eab308" : "#9ca3af",
                textAlign: "center", lineHeight: 1.3,
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
