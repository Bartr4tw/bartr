import { useState, useEffect, useRef } from "react";

const SKILLS = [
  { icon: "⚽", label: "Soccer" },
  { icon: "🎸", label: "Guitar" },
  { icon: "💻", label: "Coding" },
  { icon: "🍳", label: "Cooking" },
  { icon: "📷", label: "Photography" },
  { icon: "🧘", label: "Yoga" },
  { icon: "🎹", label: "Piano" },
  { icon: "🎤", label: "Singing" },
  { icon: "🖌️", label: "Painting" },
  { icon: "🥐", label: "Baking" },
  { icon: "🎬", label: "Video Editing" },
  { icon: "🇪🇸", label: "Spanish" },
  { icon: "🥋", label: "Martial Arts" },
  { icon: "🪵", label: "Woodworking" },
  { icon: "🎧", label: "DJing" },
  { icon: "🏊", label: "Swimming" },
];

const STORIES = [
  { from: "🎸", fromLabel: "Guitar", to: "📷", toLabel: "Photography", names: "Maya & Sam" },
  { from: "🍳", fromLabel: "Cooking", to: "💻", toLabel: "Web Dev", names: "Priya & Alex" },
  { from: "🏋️", fromLabel: "Training", to: "🎨", toLabel: "Painting", names: "Jordan & Lea" },
];

// Color tokens
const C = {
  sand: "#F5EFE0",
  sandDark: "#EDE3CC",
  clay: "#C07A52",
  clayDeep: "#9B5C38",
  terracotta: "#D4714A",
  bark: "#4A3728",
  barkLight: "#7A5C47",
  moss: "#7A8C5C",
  cream: "#FAF6EE",
  warmWhite: "#FDFAF4",
};

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function AnimatedSkillPill({ icon, label, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: C.warmWhite,
      border: `1.5px solid ${C.sandDark}`,
      borderRadius: 100, padding: "8px 16px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "all 0.5s cubic-bezier(.34,1.56,.64,1)",
      cursor: "default",
      whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(74,55,40,0.06)",
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, color: C.bark, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function StoryCard({ story, delay }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      background: C.warmWhite,
      border: `1.5px solid ${C.sandDark}`,
      borderRadius: 20, padding: "28px 24px",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(30px)",
      transition: `all 0.6s cubic-bezier(.34,1.56,.64,1) ${delay}ms`,
      textAlign: "center",
      boxShadow: "0 4px 16px rgba(74,55,40,0.07)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: C.sand, border: `1.5px solid ${C.sandDark}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>{story.from}</div>
        <div style={{ color: C.terracotta, fontSize: 18 }}>↔</div>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: C.sand, border: `1.5px solid ${C.sandDark}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>{story.to}</div>
      </div>
      <div style={{ fontSize: 13, color: C.barkLight, marginBottom: 6 }}>{story.names}</div>
      <div style={{ fontSize: 15, color: C.bark, fontWeight: 600 }}>
        {story.fromLabel} <span style={{ color: C.terracotta }}>for</span> {story.toLabel}
      </div>
    </div>
  );
}

export default function BartrLanding() {
  const [heroVisible, setHeroVisible] = useState(false);
  const [howRef, howInView] = useInView();
  const [manifestoRef, manifestoInView] = useInView();

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  const steps = [
    { icon: "✏️", title: "List your skill", desc: "Tell us what you're great at — cooking, coding, calligraphy, whatever it is. There's someone out there who wants to learn it." },
    { icon: "👆", title: "Swipe to match", desc: "Browse skills you want to learn. Swipe right when something sparks your interest. We'll let you know when it's mutual." },
    { icon: "🤝", title: "Make the swap", desc: "Set up a session, exchange knowledge, and grow together. No money involved — just two people leveling each other up." },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: C.cream,
      color: C.bark,
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        h1, h2, h3, p { color: inherit; }
        ::selection { background: rgba(192,122,82,0.2); }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .pill-hover:hover > div {
          background: ${C.sand} !important;
          border-color: ${C.clay} !important;
          transform: translateY(-2px);
        }
        .step-card-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .step-card-hover:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 32px rgba(74,55,40,0.09) !important;
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "20px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: C.warmWhite,
        borderBottom: `1px solid ${C.sandDark}`,
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, letterSpacing: -0.5, color: C.clayDeep }}>
          bartr<span style={{ color: C.terracotta }}>.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#how" style={{ fontSize: 13, color: C.barkLight, textDecoration: "none", fontWeight: 500 }}>How it works</a>
          <a href="#mission" style={{ fontSize: 13, color: C.barkLight, textDecoration: "none", fontWeight: 500 }}>Mission</a>
          <a href="/auth" style={{ textDecoration: "none" }}>
            <button style={{
              background: C.clay, border: "none",
              borderRadius: 100, padding: "8px 20px",
              fontSize: 13, fontWeight: 500, color: C.cream,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>Get started</button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "center",
        padding: "100px 64px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Blobs */}
        <div style={{
          position: "absolute", width: 520, height: 520,
          background: C.terracotta, opacity: 0.1,
          top: -150, right: -100,
          borderRadius: "60% 40% 70% 30%/50% 60% 40% 50%",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 260, height: 260,
          background: C.moss, opacity: 0.1,
          bottom: -60, left: -50,
          borderRadius: "40% 60% 30% 70%/60% 40% 60% 40%",
          pointerEvents: "none",
        }} />

        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.8s cubic-bezier(.34,1.56,.64,1)",
          maxWidth: 760, position: "relative",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.sand, border: `1px solid ${C.sandDark}`,
            borderRadius: 100, padding: "6px 16px", marginBottom: 32,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.moss, animation: "float 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, color: C.barkLight, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>Invite-only · New York</span>
          </div>

          {/* Staggered headline */}
          <h1 style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 28 }}>
            <span style={{
              display: "block",
              fontFamily: "'Fraunces', serif",
              fontWeight: 600, letterSpacing: -2, lineHeight: 1.08,
              fontSize: "clamp(48px, 8vw, 88px)",
              color: C.bark,
            }}>
              Teach what you know.
            </span>
            <span style={{
              display: "block",
              fontFamily: "'Fraunces', serif",
              fontWeight: 600, letterSpacing: -2, lineHeight: 1.08,
              fontSize: "clamp(48px, 8vw, 88px)",
              color: C.terracotta, fontStyle: "italic",
              marginLeft: "2.6ch",
            }}>
              Learn what you don't.
            </span>
          </h1>

          <p style={{
            fontSize: 18, color: C.barkLight, lineHeight: 1.7,
            maxWidth: 480, marginBottom: 40,
            opacity: heroVisible ? 1 : 0,
            transition: "opacity 0.8s ease 0.3s",
          }}>
            Bartr connects people who have skills to share with people hungry to learn them.
            No money. No algorithms. Just humans teaching humans.
          </p>

          {/* CTA */}
          <div style={{
            opacity: heroVisible ? 1 : 0,
            transition: "opacity 0.8s ease 0.5s",
            marginBottom: 64,
          }}>
            <a href="/auth" style={{ textDecoration: "none" }}>
              <button style={{
                background: C.terracotta, border: "none",
                borderRadius: 100, padding: "14px 36px",
                fontSize: 15, fontWeight: 500, color: C.cream,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>
                Get started →
              </button>
            </a>
          </div>

          {/* Skill pills */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 10,
            maxWidth: 580,
          }}>
            {SKILLS.map((s, i) => (
              <div key={s.label} className="pill-hover">
                <AnimatedSkillPill icon={s.icon} label={s.label} delay={600 + i * 60} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "100px 64px", maxWidth: 1000, margin: "0 auto" }}>
        <div ref={howRef} style={{
          opacity: howInView ? 1 : 0,
          transform: howInView ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.7s ease",
        }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: C.clay, fontWeight: 500, marginBottom: 12, textTransform: "uppercase" }}>How it works</div>
            <h2 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 600,
              lineHeight: 1.15, color: C.bark, letterSpacing: -0.5,
            }}>
              Three steps to your{" "}
              <em style={{ color: C.terracotta, fontStyle: "italic" }}>first swap</em>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {steps.map((step, i) => (
              <div key={i} className="step-card-hover" style={{
                background: C.warmWhite,
                border: `1.5px solid ${C.sandDark}`,
                borderRadius: 20, padding: "32px 28px",
                boxShadow: "0 4px 16px rgba(74,55,40,0.06)",
                opacity: howInView ? 1 : 0,
                transform: howInView ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease ${i * 120}ms`,
              }}>
                <div style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 52, fontWeight: 600, color: C.sandDark,
                  lineHeight: 1, marginBottom: 16,
                }}>0{i + 1}</div>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{step.icon}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, marginBottom: 10, color: C.bark }}>{step.title}</div>
                <div style={{ fontSize: 14, color: C.barkLight, lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Match stories */}
      <section style={{ padding: "40px 64px 100px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.clay, fontWeight: 500, marginBottom: 12, textTransform: "uppercase" }}>Real trades</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 600, color: C.bark, letterSpacing: -0.5 }}>
            Skills find each other
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {STORIES.map((s, i) => <StoryCard key={i} story={s} delay={i * 120} />)}
        </div>
      </section>

      {/* Manifesto */}
      <section id="mission" style={{
        padding: "100px 64px",
        background: C.sand,
        borderTop: `1px solid ${C.sandDark}`,
        borderBottom: `1px solid ${C.sandDark}`,
      }}>
        <div ref={manifestoRef} style={{
          maxWidth: 680,
          opacity: manifestoInView ? 1 : 0,
          transform: manifestoInView ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: C.clay, fontWeight: 500, marginBottom: 24, textTransform: "uppercase" }}>Why Bartr exists</div>
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(22px, 3.5vw, 34px)",
            fontWeight: 600, lineHeight: 1.4, color: C.bark,
            marginBottom: 32,
          }}>
            "In a world questioning what humans are capable of, we believe the answer is{" "}
            <em style={{ color: C.terracotta, fontStyle: "italic" }}>everything</em>. Skills aren't dying.
            They're waiting to be shared."
          </p>
          <div style={{ width: 40, height: 2, background: C.clay, marginBottom: 32 }} />
          <p style={{ fontSize: 15, color: C.barkLight, lineHeight: 1.8, maxWidth: 520 }}>
            Bartr is built on the belief that every person has something worth teaching,
            and something worth learning. We're not replacing human skill — we're celebrating it.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "64px 40px" }}>
        <div style={{
          background: C.clay,
          borderRadius: 28, padding: "64px 56px",
          position: "relative", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40,
        }}>
          {/* Blobs */}
          <div style={{
            position: "absolute", width: 320, height: 320,
            background: C.clayDeep, opacity: 0.3,
            top: -110, right: -60,
            borderRadius: "60% 40% 70% 30%/50% 60% 40% 50%",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", width: 200, height: 200,
            background: C.clayDeep, opacity: 0.3,
            bottom: -80, left: 220,
            borderRadius: "40% 60% 30% 70%/60% 40% 60% 40%",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 600, lineHeight: 1.15, marginBottom: 16,
              letterSpacing: -0.5, color: C.cream,
            }}>
              Ready to make your{" "}
              <em style={{ fontStyle: "italic", opacity: 0.85 }}>first swap?</em>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(250,246,238,0.72)", lineHeight: 1.6, maxWidth: 400 }}>
              Invite-only. New York City. Have an invite code? You're in.
            </p>
          </div>
          <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
            <a href="/auth" style={{ textDecoration: "none" }}>
              <button style={{
                background: C.cream, border: "none",
                borderRadius: 100, padding: "14px 32px",
                fontSize: 15, fontWeight: 500, color: C.clayDeep,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "nowrap",
              }}>Get started →</button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "28px 48px",
        borderTop: `1px solid ${C.sandDark}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: C.clayDeep }}>
          bartr<span style={{ color: C.terracotta }}>.</span>
        </div>
        <div style={{ fontSize: 12, color: C.barkLight }}>Teach what you know. Learn what you don't.</div>
      </footer>
    </div>
  );
}
