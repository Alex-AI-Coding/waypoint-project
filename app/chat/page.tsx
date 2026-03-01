"use client";

import { useEffect, useRef, useState } from "react";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/browser";
import ConfirmModal from "@/components/ConfirmModal";

type Msg = {
  id: string;
  role: "assistant" | "user";
  text: string;
  createdAt?: number;
};

const STORAGE_KEY = "waypoint_chat_v1";

const STARTER_MESSAGE: Msg = {
  id: "starter",
  role: "assistant",
  text: "Hi — I’m Waypoint. What’s on your mind today?",
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function fetchSavedMessages(): Promise<Msg[] | null> {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error || !data || data.length === 0) return null;

    return data.map((row) => ({
      id: row.id,
      role: row.role as "user" | "assistant",
      text: row.content,
      createdAt: new Date(row.created_at).getTime(),
    }));
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([STARTER_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [assistantId, setAssistantId] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const saved = await fetchSavedMessages();
        if (saved && saved.length > 0) {
          setMessages(saved);
          return;
        }

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Msg[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } finally {
        hasLoadedRef.current = true;
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const container = endRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, isTyping]);

  /* ===============================
     STREAMING SEND FUNCTION (SSE)
  =============================== */

  async function send() {
    const text = input.trim();
    if (!text || isTyping) return;

    const supabase = createClient();

    const userMsg: Msg = {
      id: uid(),
      role: "user",
      text,
      createdAt: Date.now(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Create empty assistant message and typing indicator target
    const newAssistantId = uid();
    setAssistantId(newAssistantId);
    setIsTyping(true);

    setMessages((prev) => [
      ...prev,
      {
        id: newAssistantId,
        role: "assistant",
        text: "",
        createdAt: Date.now(),
      },
    ]);

    // Save user message (best effort)
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("messages").insert({
          user_id: userData.user.id,
          role: "user",
          content: text,
        });
      }
    } catch {}

    let fullText = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Buffer for SSE parsing (chunks may split events)
      let buffer = "";
      let sawFirstToken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? ""; // keep incomplete tail in buffer

        for (const part of parts) {
          // Find the "data:" line (ignore others)
          const dataLine = part
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));

          if (!dataLine) continue;

          const jsonStr = dataLine.replace(/^data:\s*/, "");

          let payload: any = null;
          try {
            payload = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (payload?.token) {
            fullText += String(payload.token);

            if (!sawFirstToken) {
              sawFirstToken = true;
              // Stop pulsing dots once we begin receiving text
              setIsTyping(false);
            }

            // Update assistant message live
            setMessages((prev) =>
              prev.map((m) =>
                m.id === newAssistantId ? { ...m, text: fullText } : m
              )
            );
          }

          if (payload?.done) {
            // We're finished streaming
            break;
          }
        }
      }

      // Save final assistant message (best effort)
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from("messages").insert({
            user_id: userData.user.id,
            role: "assistant",
            content: fullText || "…",
          });
        }
      } catch {}
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newAssistantId
            ? {
                ...m,
                text: "Something went wrong. Want to try sending that again?",
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  }

  async function clearChat() {
    const starter = [STARTER_MESSAGE];
    setMessages(starter);
    setInput("");
    setIsTyping(false);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(starter));

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (userData.user) {
        await supabase.from("messages").delete().eq("user_id", userData.user.id);
      }
    } catch {}
  }

  return (
    <main className="min-h-screen bg-green-50 flex justify-center p-6">
      <div className="w-full max-w-3xl flex flex-col animate-fade-in">
        <Nav current="chat" />
        <div className="h-3" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Header
              title="Waypoint"
              subtitle="Supportive chat • Not medical advice"
            />
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="rounded-xl border border-green-300 px-4 py-2 text-sm text-green-700 hover:text-green-900 hover:bg-green-100/60 transition focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            Clear
          </button>
        </div>

        <div className="border border-green-100 rounded-2xl">
          <Card>
            <div className="space-y-6">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "flex justify-end"
                      : "flex items-end gap-2"
                  }
                >
                  {m.role === "assistant" && (
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-green-700 text-white text-xs font-semibold flex items-center justify-center">
                      W
                    </div>
                  )}

                  <div
                    className={
                      (m.role === "user"
                        ? "max-w-[85%] rounded-2xl bg-green-800 px-4 py-3 text-sm text-white"
                        : "max-w-[85%] rounded-2xl bg-green-100 px-4 py-3 text-sm text-green-900") +
                      " animate-message-in"
                    }
                  >
                    <div className="flex items-center gap-2">
                      {/* Typing dots only for the current assistant bubble */}
                      {isTyping && m.id === assistantId && (
                        <>
                          <div className="h-2 w-2 rounded-full bg-green-700 animate-pulse"></div>
                          <div className="h-2 w-2 rounded-full bg-green-700 animate-pulse"></div>
                          <div className="h-2 w-2 rounded-full bg-green-700 animate-pulse"></div>
                        </>
                      )}
                      <div>{m.text}</div>
                    </div>

                    {m.createdAt && (
                      <div className="mt-1 text-[10px] opacity-60">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div ref={endRef} />
            </div>
          </Card>
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={input}
            disabled={isTyping}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isTyping) send();
            }}
            className="flex-1 rounded-xl border border-green-300 bg-white px-4 py-3 text-sm text-green-900 placeholder:text-green-700/60 focus:outline-none focus:ring-2 focus:ring-green-200 transition-shadow duration-200 focus:shadow-md disabled:opacity-60"
            placeholder={isTyping ? "Waypoint is typing…" : "Type your message…"}
          />

          <button
            disabled={isTyping}
            onClick={send}
            className="rounded-xl bg-green-700 px-5 py-3 text-sm text-white hover:bg-green-600 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        <Footer />
      </div>

      <ConfirmModal
        open={showClearConfirm}
        title="Clear conversation?"
        description="This will permanently remove all messages in this chat."
        confirmLabel="Clear"
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setShowClearConfirm(false);
          clearChat();
        }}
      />
    </main>
  );
}