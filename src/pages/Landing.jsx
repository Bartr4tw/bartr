import { useState, useEffect, useRef } from "react";

const SKILLS = [
  { icon: "🎸", label: "Guitar" },
  { icon: "🍳", label: "Cooking" },
  { icon: "📷", label: "Photography" },
  { icon: "🏋️", label: "Fitness" },
  { icon: "💻", label: "Coding" },
  { icon: "🎨", label: "Painting" },
  { icon: "🗣️", label: "Spanish" },
  { icon: "🎹", label: "Piano" },
  { icon: "🧘", label: "Yoga" },
  { icon: "🎭", label: "Acting" },
  { icon: "📊", label: "Data" },
  { icon: "🍞", label: "Baking" },
  { icon: "🎬", label: "Film" },
  { icon: "🏄", label: "Surfing" },
  { icon: "✍️", label: "Writing" },
  { icon: "🎯", label: "Archery" },
];

const STORIES = [
  { from: "🎸", fromLabel: "Guitar", to: "📷", toLabel: "Photography", names: "Maya & Sam" },
  { from: "🍳", fromLabel: "Cooking", to: "💻", toLabel: "Web Dev", names: "Priya & Alex" },
  { from: "🏋️", fromLabel: "Training", to: "🎨", toLabel: "Painting", names: "Jordan & Lea" },
];

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
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 40, padding: "10px 18px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "all 0.5s cubic-bezier(.34,1.56,.64,1)",
      cursor: "default",
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function StoryCard({ story, delay }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      background: "#111827",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: "28px 24px",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(30px)",
      transition: `all 0.6s cubic-bezier(.34,1.56,.64,1) ${delay}ms`,
      textAlign: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(234,179,8,0.12)",
          border: "1px solid rgba(234,179,8,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>{story.from}</div>
        <div style={{ color: "#eab308", fontSize: 18 }}>↔</div>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(234,179,8,0.12)",
          border: "1px solid rgba(234,179,8,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>{story.to}</div>
      </div>
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>{story.names}</div>
      <div style={{ fontSize: 15, color: "#f3f4f6", fontWeight: 600 }}>
        {story.fromLabel} <span style={{ color: "#eab308" }}>for</span> {story.toLabel}
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
    { icon: "🎬", title: "Show your skill", desc: "Upload a short video of you doing what you do best. No credentials needed — just show up." },
    { icon: "🔍", title: "Discover others", desc: "Swipe through people whose skills light you up. Cooking, music, fitness, code — it's all here." },
    { icon: "⚡", title: "Connect & trade", desc: "When two people want what the other has, it's a match. Reach out and set up your first session." },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b14",
      color: "#f3f4f6",
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
	h1, h2, h3, p { color: inherit; }
        ::selection { background: #eab30840; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -3%); }
          30% { transform: translate(3%, 2%); }
          50% { transform: translate(-1%, 4%); }
          70% { transform: translate(2%, -2%); }
          90% { transform: translate(-3%, 1%); }
        }
        .grain::after {
          content: '';
          position: fixed;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.15;
          animation: grain 8s steps(10) infinite;
          pointer-events: none;
          z-index: 1000;
        }
        .pill-hover:hover {
          background: rgba(234,179,8,0.1) !important;
          border-color: rgba(234,179,8,0.3) !important;
          transform: translateY(-2px);
          transition: all 0.2s !important;
        }
      `}</style>

      <div className="grain" />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(8,11,20,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
          Bartr<span style={{ color: "#eab308" }}>.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#how" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none", fontWeight: 500 }}>How it works</a>
          <a href="#mission" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none", fontWeight: 500 }}>Mission</a>
          <a href="/app" style={{ textDecoration: "none" }}>
            <button style={{
              background: "transparent",
              border: "1px solid rgba(234,179,8,0.4)",
              borderRadius: 24, padding: "8px 20px", fontSize: 13, fontWeight: 600,
              color: "#eab308", cursor: "pointer", marginRight: 8,
            }}>Try the app</button>
          </a>
          <a href="/auth" style={{ textDecoration: "none" }}>
            <button style={{
              background: "#eab308", border: "none", borderRadius: 24,
              padding: "8px 20px", fontSize: 13, fontWeight: 600,
              color: "#080b14", cursor: "pointer",
            }}>Request invite</button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", width: 600, height: 600,
          background: "radial-gradient(circle, rgba(234,179,8,0.06) 0%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%, -60%)",
          pointerEvents: "none",
        }} />

        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.8s cubic-bezier(.34,1.56,.64,1)",
          textAlign: "center", maxWidth: 720, position: "relative",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.2)",
            borderRadius: 40, padding: "6px 16px", marginBottom: 32,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#eab308", animation: "float 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, color: "#eab308", fontWeight: 600, letterSpacing: 1 }}>COMING SOON · NEW YORK</span>
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(52px, 10vw, 96px)",
            fontWeight: 800, lineHeight: 0.95,
            letterSpacing: -2, marginBottom: 28,
            color: "#f9fafb",
          }}>
            Teach what<br />
            you know.<br />
            <span style={{ color: "#eab308" }}>Learn what<br />you don't.</span>
          </h1>

          <p style={{
            fontSize: 18, color: "#9ca3af", lineHeight: 1.7,
            maxWidth: 520, margin: "0 auto 48px",
            opacity: heroVisible ? 1 : 0,
            transition: "opacity 0.8s ease 0.3s",
          }}>
            Bartr connects people who have skills to share with people hungry to learn them.
            No money. No algorithms. Just humans teaching humans.
          </p>

          <div style={{
            display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
            marginBottom: 64,
            opacity: heroVisible ? 1 : 0,
            transition: "opacity 0.8s ease 0.5s",
          }}>
            <a href="/auth" style={{ textDecoration: "none" }}>
              <button style={{
                background: "#eab308", border: "none",
                borderRadius: 40, padding: "14px 32px",
                fontSize: 15, fontWeight: 700, color: "#080b14",
                cursor: "pointer", letterSpacing: 0.3,
              }}>
                Request an invite →
              </button>
            </a>
            <a href="/app" style={{ textDecoration: "none" }}>
              <button style={{
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)",
                borderRadius: 40, padding: "14px 32px",
                fontSize: 15, fontWeight: 600, color: "#eab308",
                cursor: "pointer", letterSpacing: 0.3,
              }}>
                ⚡ Try the app
              </button>
            </a>
          </div>

          <div style={{
            display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center",
            maxWidth: 580, margin: "0 auto",
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
      <section id="how" style={{ padding: "100px 24px", maxWidth: 900, margin: "0 auto" }}>
        <div ref={howRef} style={{
          opacity: howInView ? 1 : 0,
          transform: howInView ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.7s ease",
        }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#eab308", fontWeight: 700, marginBottom: 16 }}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, lineHeight: 1.1 }}>
              Three steps to your<br />next skill
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                background: "#0f1623",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: "32px 28px",
                position: "relative", overflow: "hidden",
                opacity: howInView ? 1 : 0,
                transform: howInView ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease ${i * 120}ms`,
              }}>
                <div style={{
                  position: "absolute", top: -20, right: -10,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 120, fontWeight: 800, color: "rgba(234,179,8,0.04)",
                  lineHeight: 1, pointerEvents: "none",
                }}>{i + 1}</div>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{step.icon}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Match stories */}
      <section style={{ padding: "60px 24px 100px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#eab308", fontWeight: 700, marginBottom: 14 }}>REAL TRADES</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700 }}>
            Skills find each other
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {STORIES.map((s, i) => <StoryCard key={i} story={s} delay={i * 120} />)}
        </div>
      </section>

      {/* Manifesto */}
      <section id="mission" style={{
        padding: "100px 24px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div ref={manifestoRef} style={{
          maxWidth: 680, margin: "0 auto", textAlign: "center",
          opacity: manifestoInView ? 1 : 0,
          transform: manifestoInView ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#eab308", fontWeight: 700, marginBottom: 24 }}>WHY BARTR EXISTS</div>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(24px, 4vw, 38px)",
            fontWeight: 600, lineHeight: 1.4, color: "#f9fafb",
          }}>
            "In a world questioning what humans are capable of, we believe the answer is{" "}
            <em style={{ color: "#eab308" }}>everything</em>. Skills aren't dying.
            They're waiting to be shared."
          </p>
          <div style={{ width: 40, height: 2, background: "#eab308", margin: "36px auto" }} />
          <p style={{ fontSize: 15, color: "#9ca3af", lineHeight: 1.8 }}>
            Bartr is built on the belief that every person has something worth teaching,
            and something worth learning. We're not replacing human skill — we're celebrating it.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(40px, 7vw, 72px)",
          fontWeight: 800, lineHeight: 1, marginBottom: 24, letterSpacing: -1,
        }}>
          What will you<br />
          <span style={{ color: "#eab308" }}>teach next?</span>
        </h2>
        <p style={{ fontSize: 16, color: "#9ca3af", marginBottom: 40 }}>
          Invite-only. New York City. Have an invite code? You're in.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/auth" style={{ textDecoration: "none" }}>
            <button style={{
              background: "#eab308", border: "none",
              borderRadius: 40, padding: "14px 36px",
              fontSize: 15, fontWeight: 700, color: "#080b14", cursor: "pointer",
            }}>Request an invite →</button>
          </a>
          <a href="/app" style={{ textDecoration: "none" }}>
            <button style={{
              background: "transparent",
              border: "1px solid rgba(234,179,8,0.3)",
              borderRadius: 40, padding: "14px 28px",
              fontSize: 14, fontWeight: 600, color: "#eab308", cursor: "pointer",
            }}>⚡ Try the app</button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "32px 40px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 800 }}>
          Bartr<span style={{ color: "#eab308" }}>.</span>
        </div>
        <div style={{ fontSize: 12, color: "#4b5563" }}>Teach what you know. Learn what you don't.</div>
      </footer>
    </div>
  );
}
