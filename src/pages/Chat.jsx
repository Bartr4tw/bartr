import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const C = {
  cream: "#FAF6EE", warmWhite: "#FDFAF4",
  sand: "#F5EFE0", sandDark: "#EDE3CC",
  clay: "#C07A52", clayDeep: "#9B5C38",
  terracotta: "#D4714A",
  bark: "#4A3728", barkLight: "#7A5C47",
};

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(searchParams.get("prefillMessage") || "");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const matchEnsured = useRef(false);

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

    // Ensure a match record exists between these two users so the
    // conversation appears in both users' Matches tab. Uses the same
    // user_a < user_b dedup convention as the swipe match logic.
    // Only runs once per chat session; silently ignores if already exists.
    if (!matchEnsured.current) {
      matchEnsured.current = true;
      const user_a = currentUser.id < userId ? currentUser.id : userId;
      const user_b = currentUser.id < userId ? userId : currentUser.id;
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/matches`, {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify({ user_a, user_b }),
      });
    }

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
      background: C.cream, fontFamily: "'DM Sans', sans-serif", color: C.bark,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(74,55,40,0.15); border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{
        flexShrink: 0, height: 64,
        background: C.warmWhite,
        borderBottom: `1px solid ${C.sandDark}`,
        display: "flex", alignItems: "center", gap: 16, padding: "0 20px",
      }}>
        <button
          onClick={() => navigate("/app")}
          style={{
            background: "transparent", border: "none",
            color: C.barkLight, fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center",
            padding: "0 8px", minWidth: 44, minHeight: 44,
          }}
        >‹</button>

        <div
          onClick={() => navigate(`/profile/${userId}`)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            flex: 1, cursor: "pointer", minHeight: 44,
          }}
        >
          {otherProfile?.avatar_url ? (
            <img src={otherProfile.avatar_url} style={{
              width: 40, height: 40, borderRadius: "50%", objectFit: "cover",
              border: `2px solid ${C.sandDark}`, flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: C.sand, border: `2px solid ${C.sandDark}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Fraunces', serif", fontWeight: 600,
              fontSize: 15, color: C.terracotta, flexShrink: 0,
            }}>{avatarInitials}</div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontWeight: 600,
              fontSize: 18, color: C.bark,
            }}>
              {otherProfile?.full_name || "Loading..."}
            </div>
            {otherProfile && (
              <div style={{ fontSize: 11, color: C.barkLight, marginTop: 1 }}>
                {otherProfile.offering_icon} {otherProfile.offering} · {otherProfile.location}
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: C.barkLight, paddingRight: 4 }}>
            View profile ›
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 16px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {loading ? (
          <div style={{ textAlign: "center", color: C.barkLight, marginTop: 40, fontSize: 13 }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
            <div style={{
              fontFamily: "'Fraunces', serif", fontSize: 20,
              fontWeight: 600, color: C.bark, marginBottom: 6,
            }}>
              You matched with {otherProfile?.full_name?.split(" ")[0] || "them"}
            </div>
            <div style={{ fontSize: 13, color: C.barkLight }}>
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
                    background: isMine ? C.terracotta : C.warmWhite,
                    color: isMine ? C.cream : C.bark,
                    border: isMine ? "none" : `1px solid ${C.sandDark}`,
                    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "10px 14px",
                    fontSize: 14, lineHeight: 1.5, fontWeight: 400,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: C.barkLight, paddingLeft: 4, paddingRight: 4 }}>
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
        background: C.warmWhite,
        borderTop: `1px solid ${C.sandDark}`,
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
            background: C.sand,
            border: `1px solid ${C.sandDark}`,
            borderRadius: 20, padding: "10px 16px",
            color: C.bark, fontSize: 14,
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
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: input.trim() ? C.terracotta : C.sandDark,
            border: "none", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s", fontSize: 16,
            color: input.trim() ? C.cream : C.barkLight,
          }}
        >➤</button>
      </div>
    </div>
  );
}
