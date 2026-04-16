import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // Get current session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/auth"; return; }
      setCurrentUser(session.user);
      setSessionToken(session.access_token);
    });
  }, []);

  // Fetch other user's profile
  useEffect(() => {
    if (!userId || !sessionToken) return;
    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
      {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${sessionToken}`,
        },
      }
    )
      .then((r) => r.json())
      .then((rows) => setOtherProfile(rows[0] || null));
  }, [userId, sessionToken]);

  // Fetch existing messages
  useEffect(() => {
    if (!currentUser || !userId || !sessionToken) return;
    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/messages?sender_id=in.(${currentUser.id},${userId})&receiver_id=in.(${currentUser.id},${userId})&order=created_at.asc`,
      {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${sessionToken}`,
        },
      }
    )
      .then((r) => r.json())
      .then((rows) => {
        setMessages(rows || []);
        setLoading(false);
      });
  }, [currentUser, userId, sessionToken]);

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel(`chat:${currentUser.id}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          if (payload.new.sender_id === userId) {
            setMessages((m) => [...m, payload.new]);
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [currentUser, userId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUser) return;
    const content = input.trim();
    setInput("");

    const optimistic = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: userId,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        sender_id: currentUser.id,
        receiver_id: userId,
        content,
      }),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const avatarInitials = otherProfile?.full_name
    ? otherProfile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#080b14", fontFamily: "'DM Sans', sans-serif", color: "#f3f4f6",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{
        flexShrink: 0, height: 64,
        background: "rgba(8,11,20,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 16, padding: "0 20px",
      }}>
        <button
          onClick={() => navigate("/app")}
          style={{
            background: "transparent", border: "none",
            color: "#9ca3af", fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", padding: 4,
          }}
        >‹</button>

        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(234,179,8,0.1)", border: "2px solid rgba(234,179,8,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
          fontSize: 15, color: "#eab308", flexShrink: 0,
        }}>{avatarInitials}</div>

        <div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
            fontSize: 18, color: "#f9fafb",
          }}>
            {otherProfile?.full_name || "Loading..."}
          </div>
          {otherProfile && (
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
              {otherProfile.offering_icon} {otherProfile.offering} · {otherProfile.location}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 16px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#4b5563", marginTop: 40, fontSize: 13 }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 20,
              fontWeight: 700, color: "#f9fafb", marginBottom: 6,
            }}>
              You matched with {otherProfile?.full_name?.split(" ")[0] || "them"}
            </div>
            <div style={{ fontSize: 13, color: "#4b5563" }}>
              Say hi and start planning your skill swap
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUser?.id;
            return (
              <div key={msg.id} style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
              }}>
                <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 3 }}>
                  <div style={{
                    background: isMine ? "#eab308" : "#0f1623",
                    color: isMine ? "#080b14" : "#f3f4f6",
                    border: isMine ? "none" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "10px 14px",
                    fontSize: 14, lineHeight: 1.5, fontWeight: isMine ? 500 : 400,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: "#4b5563", paddingLeft: 4, paddingRight: 4 }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0,
        padding: "12px 16px",
        background: "rgba(8,11,20,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "flex-end", gap: 10,
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          style={{
            flex: 1,
            background: "#0f1623",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "10px 16px",
            color: "#f3f4f6", fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            resize: "none", lineHeight: 1.5,
            maxHeight: 120, overflowY: "auto",
          }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: input.trim() ? "#eab308" : "rgba(234,179,8,0.15)",
            border: "none", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s", fontSize: 16,
          }}
        >➤</button>
      </div>
    </div>
  );
}
