"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  text: "Hi — I’m Waypoint.\nWhat’s on your mind today?",
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
      id: row.id as string,
      role: row.role as "user" | "assistant",
      text: row.content as string,
      createdAt: new Date(row.created_at as string).getTime(),
    }));
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const router = useRouter();
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
          if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
        }
      } finally {
        hasLoadedRef.current = true;
      }
    }
    load();
  }, []);

   useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
      }
    })();
  }, [router]);

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
      { id: newAssistantId, role: "assistant", text: "", createdAt: Date.now() },
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No stream");

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
        buffer = parts.pop() ?? "";

        for (const part of parts) {
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
              setIsTyping(false);
            }

            setMessages((prev) =>
              prev.map((m) =>
                m.id === newAssistantId ? { ...m, text: fullText } : m
              )
            );
          }

          if (payload?.done) break;
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
                text: "Something went wrong.\nWant to try sending that again?",
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <Header />
        <div className="mt-4">
          <Nav current="chat" />
        </div>

        <div className="mt-4">
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Chat</h2>

                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="rounded-xl border border-green-300 px-4 py-2 text-sm text-green-700 hover:text-green-900 hover:bg-green-100/60 transition focus:outline-none focus:ring-2 focus:ring-green-200 dark:border-green-700 dark:text-green-200 dark:hover:bg-white/10"
                >
                  Clear
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`animate-message-in rounded-2xl border px-4 py-3 ${
                      m.role === "assistant"
                        ? "border-foreground/10 bg-foreground/5"
                        : "border-green-300 bg-green-50/60 dark:border-green-800 dark:bg-green-900/20"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                      <span className="font-medium">
                        {m.role === "assistant" ? "Waypoint" : "You"}
                      </span>

                      {m.createdAt && (
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}

                      {/* Typing dots only for the current assistant bubble */}
                      {isTyping && m.id === assistantId && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <span className="typing-dot">•</span>
                          <span className="typing-dot">•</span>
                          <span className="typing-dot">•</span>
                        </span>
                      )}
                    </div>

                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {m.text}
                    </div>
                  </div>
                ))}

                <div ref={endRef} />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isTyping) send();
                  }}
                  className="flex-1 rounded-xl border border-green-300 bg-background px-4 py-3 text-sm text-foreground placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-200 transition-shadow duration-200 focus:shadow-md disabled:opacity-60"
                  placeholder={isTyping ? "Waypoint is typing…" : "Type your message…"}
                  disabled={isTyping}
                />

                <button
                  type="button"
                  onClick={send}
                  disabled={isTyping}
                  className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  Send
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Footer />
        </div>
      </div>

      <ConfirmModal
        open={showClearConfirm}
        title="Clear chat?"
        description="This will remove your current chat history from this device (and also delete saved messages for your account, if you’re logged in)."
        confirmLabel="Clear"
        cancelLabel="Cancel"
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setShowClearConfirm(false);
          clearChat();
        }}
      />
    </div>
  );
}