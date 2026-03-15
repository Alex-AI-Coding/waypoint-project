"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ConfirmModal from "@/components/ConfirmModal";
import { createClient } from "@/lib/supabase/browser";

type Msg = {
  id: string;
  role: "assistant" | "user";
  text: string;
  createdAt: number;
};

type ChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatThreadTitle(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(ts: number) {
  return new Date(ts).toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatThreadDate(ts: number) {
  return new Date(ts).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function sameDay(a: number, b: number) {
  const ad = new Date(a);
  const bd = new Date(b);

  return (
    ad.getFullYear() === bd.getFullYear() &&
    ad.getMonth() === bd.getMonth() &&
    ad.getDate() === bd.getDate()
  );
}

async function fetchThreads(): Promise<ChatThread[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userData.user.id)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    title: (row.title as string) || "New chat",
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }));
}

async function fetchMessages(threadId: string): Promise<Msg[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    role: row.role as "assistant" | "user",
    text: row.content as string,
    createdAt: new Date(row.created_at as string).getTime(),
  }));
}

async function createThreadInDb(title = "New chat"): Promise<ChatThread | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      user_id: userData.user.id,
      title,
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    title: data.title as string,
    createdAt: new Date(data.created_at as string).getTime(),
    updatedAt: new Date(data.updated_at as string).getTime(),
  };
}

export default function ChatPage() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement | null>(null);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
        return;
      }

      setLoadingThreads(true);

      const savedThreads = await fetchThreads();

      if (savedThreads.length > 0) {
        setThreads(savedThreads);
        setActiveThreadId(savedThreads[0].id);
      } else {
        const firstThread = await createThreadInDb();
        if (firstThread) {
          setThreads([firstThread]);
          setActiveThreadId(firstThread.id);
        }
      }

      setLoadingThreads(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!activeThreadId) return;

    (async () => {
      setLoadingMessages(true);
      const rows = await fetchMessages(activeThreadId);
      setMessages(rows);
      setLoadingMessages(false);
    })();
  }, [activeThreadId]);

  useEffect(() => {
    const container = endRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages, isTyping, activeThreadId]);

  async function createNewChat() {
    const newThread = await createThreadInDb();
    if (!newThread) return;

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setAssistantId(null);
  }

  async function send() {
    const text = input.trim();
    if (!text || !activeThreadId || isTyping) return;

    const supabase = createClient();
    const now = Date.now();

    const userMsg: Msg = {
      id: uid(),
      role: "user",
      text,
      createdAt: now,
    };

    const newAssistantId = uid();

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: newAssistantId,
        role: "assistant",
        text: "",
        createdAt: now,
      },
    ]);

    setInput("");
    setAssistantId(newAssistantId);
    setIsTyping(true);

    const nextTitle =
      activeThread?.title === "New chat"
        ? formatThreadTitle(text)
        : activeThread?.title || "New chat";

    setThreads((prev) =>
      prev
        .map((thread) =>
          thread.id === activeThreadId
            ? {
                ...thread,
                title: nextTitle,
                updatedAt: now,
              }
            : thread
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (userData.user) {
        await supabase.from("chat_threads").update({
          title: nextTitle,
          updated_at: new Date(now).toISOString(),
        }).eq("id", activeThreadId);

        await supabase.from("messages").insert({
          user_id: userData.user.id,
          thread_id: activeThreadId,
          role: "user",
          content: text,
        });
      }
    } catch {}

    let fullText = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawFirstToken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataLine = part
            .split("\n")
            .map((line) => line.trim())
            .find((line) => line.startsWith("data:"));

          if (!dataLine) continue;

          const jsonStr = dataLine.replace(/^data:\s*/, "");
          let payload: unknown;

          try {
            payload = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (
            typeof payload === "object" &&
            payload !== null &&
            "token" in payload &&
            typeof payload.token === "string"
          ) {
            fullText += payload.token;

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
        }
      }

      if (!fullText.trim()) {
        fullText = "Something went wrong.\nWant to try sending that again?";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === newAssistantId ? { ...m, text: fullText } : m
          )
        );
      }

      try {
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user) {
          await supabase.from("messages").insert({
            user_id: userData.user.id,
            thread_id: activeThreadId,
            role: "assistant",
            content: fullText,
          });

          await supabase.from("chat_threads").update({
            updated_at: new Date().toISOString(),
          }).eq("id", activeThreadId);
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

  async function clearCurrentThread() {
    if (!activeThreadId) return;

    const supabase = createClient();

    try {
      await supabase.from("messages").delete().eq("thread_id", activeThreadId);
      await supabase.from("chat_threads").update({
        title: "New chat",
        updated_at: new Date().toISOString(),
      }).eq("id", activeThreadId);
    } catch {}

    setMessages([]);
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThreadId
          ? {
              ...thread,
              title: "New chat",
              updatedAt: Date.now(),
            }
          : thread
      )
    );
    setInput("");
    setIsTyping(false);
    setAssistantId(null);
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6">
        <Header title="Chat" subtitle="Supportive chat • Not medical advice" />

        <div className="mt-4">
          <Nav current="chat" />
        </div>

        <div className="mt-6 grid flex-1 gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-foreground/10 bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
                Chats
              </h2>

              <button
                type="button"
                onClick={createNewChat}
                className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
              >
                New chat
              </button>
            </div>

            <div className="mt-3 max-h-[64vh] space-y-2 overflow-y-auto pr-1">
              {loadingThreads ? (
                <div className="rounded-2xl border border-foreground/10 bg-foreground/5 px-3 py-3 text-sm text-foreground/70">
                  Loading chats...
                </div>
              ) : (
                threads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  const latestPreview =
                    isActive && messages.length > 0
                      ? messages[messages.length - 1]?.text
                      : "Open chat";

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => {
                        setActiveThreadId(thread.id);
                        setInput("");
                      }}
                      className={[
                        "w-full rounded-2xl border px-3 py-3 text-left transition",
                        isActive
                          ? "border-green-400/50 bg-green-100/70 dark:bg-green-900/20"
                          : "border-foreground/10 bg-foreground/5 hover:bg-foreground/8",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {thread.title}
                          </div>
                          <div className="mt-1 truncate text-xs text-foreground/60">
                            {latestPreview || "No messages yet"}
                          </div>
                        </div>

                        <span className="shrink-0 text-[11px] text-foreground/50">
                          {formatThreadDate(thread.updatedAt)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <Card>
            <div className="flex h-full min-h-[70vh] flex-col rounded-3xl border border-foreground/10 bg-card shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {activeThread?.title ?? "Chat"}
                  </h2>
                  <p className="text-sm text-foreground/65">
                    Messages are grouped by date.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="rounded-xl border border-green-300 px-4 py-2 text-sm text-green-700 transition hover:bg-green-100/60 hover:text-green-900 dark:border-green-700 dark:text-green-200 dark:hover:bg-white/10"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loadingMessages ? (
                  <div className="text-sm text-foreground/70">Loading messages...</div>
                ) : (
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-4 text-sm text-foreground/70">
                        Start a new conversation in this thread.
                      </div>
                    ) : (
                      messages.map((m, index) => {
                        const previous = messages[index - 1];
                        const showDateDivider =
                          !previous || !sameDay(previous.createdAt, m.createdAt);

                        return (
                          <div key={m.id}>
                            {showDateDivider ? (
                              <div className="mb-4 flex items-center gap-3">
                                <div className="h-px flex-1 bg-foreground/10" />
                                <span className="text-xs font-medium text-foreground/55">
                                  {formatDateLabel(m.createdAt)}
                                </span>
                                <div className="h-px flex-1 bg-foreground/10" />
                              </div>
                            ) : null}

                            <div
                              className={[
                                "flex",
                                m.role === "user" ? "justify-end" : "justify-start",
                              ].join(" ")}
                            >
                              <div
                                className={[
                                  "max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm",
                                  m.role === "user"
                                    ? "border-green-400/30 bg-green-600 text-white"
                                    : "border-foreground/10 bg-white/70 text-card-foreground dark:bg-white/5",
                                ].join(" ")}
                              >
                                <div className="mb-1 flex items-center gap-2 text-xs">
                                  <span className="font-semibold">
                                    {m.role === "assistant" ? "Waypoint" : "You"}
                                  </span>

                                  <span className="text-foreground/60">
                                    {formatTime(m.createdAt)}
                                  </span>

                                  {isTyping &&
                                  m.id === assistantId &&
                                  m.role === "assistant" ? (
                                    <span className="ml-1 inline-flex gap-1">
                                      <span>•</span>
                                      <span>•</span>
                                      <span>•</span>
                                    </span>
                                  ) : null}
                                </div>

                                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                  {m.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div ref={endRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-foreground/10 px-4 py-4">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isTyping) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={2}
                    className="min-h-[56px] flex-1 resize-none rounded-2xl border border-green-300 bg-background px-4 py-3 text-sm text-foreground placeholder:opacity-60 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-green-200 focus:shadow-md disabled:opacity-60 dark:border-green-700/60"
                    placeholder={isTyping ? "Waypoint is typing…" : "Type your message…"}
                    disabled={isTyping || !activeThreadId}
                  />

                  <button
                    type="button"
                    onClick={send}
                    disabled={isTyping || !input.trim() || !activeThreadId}
                    className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="pt-8">
          <Footer />
        </div>
      </main>

      <ConfirmModal
        open={showClearConfirm}
        title="Clear this chat?"
        description="This will remove only the messages inside the current thread."
        confirmLabel="Clear chat"
        cancelLabel="Cancel"
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setShowClearConfirm(false);
          clearCurrentThread();
        }}
      />
    </>
  );
}