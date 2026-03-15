"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ConfirmModal from "@/components/ConfirmModal";
import { createClient } from "@/lib/supabase/browser";
import { DEFAULT_UI_PREFS, loadUiPrefs, type UiPrefs } from "../settings/uiPrefs";

type Msg = {
  id: string;
  role: "assistant" | "user";
  text: string;
  createdAt?: number;
};

type Thread = {
  id: string;
  title: string;
  pinned: boolean;
  created_at?: string;
  updated_at?: string;
};

const STORAGE_THREADS_KEY = "waypoint_threads_v1";
const STORAGE_ACTIVE_THREAD_KEY = "waypoint_active_thread_v1";

const WAYPOINT_GREETING =
  "Hi! I'm Waypoint, how may I help you today?";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildStarterMessage(): Msg {
  return {
    id: `starter-${uid()}`,
    role: "assistant",
    text: WAYPOINT_GREETING,
    createdAt: Date.now(),
  };
}

function makeTitleFromMessage(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
}

function sortThreads(list: Thread[]) {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return bTime - aTime;
  });
}

export default function ChatPage() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedRef = useRef(false);

  const [uiPrefs, setUiPrefs] = useState<UiPrefs>(DEFAULT_UI_PREFS);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([buildStarterMessage()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUiPrefs(loadUiPrefs());
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
    async function boot() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      const { data: dbThreads } = await supabase
        .from("chat_threads")
        .select("id, title, pinned, created_at, updated_at")
        .eq("user_id", userData.user.id)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      let nextThreads: Thread[] =
        dbThreads?.map((t) => ({
          id: String(t.id),
          title: String(t.title ?? "New chat"),
          pinned: Boolean(t.pinned),
          created_at: String(t.created_at ?? ""),
          updated_at: String(t.updated_at ?? ""),
        })) ?? [];

      if (nextThreads.length === 0) {
        const starterThread = await createThreadInSupabase("New chat", true);
        if (starterThread) {
          nextThreads = [starterThread];
        }
      }

      const savedActive =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_ACTIVE_THREAD_KEY)
          : null;

      const fallbackActive = nextThreads[0]?.id ?? null;
      const initialActive =
        savedActive && nextThreads.some((t) => t.id === savedActive)
          ? savedActive
          : fallbackActive;

      setThreads(sortThreads(nextThreads));
      setActiveThreadId(initialActive);

      if (initialActive) {
        await loadMessagesForThread(initialActive);
      }

      hasLoadedRef.current = true;
    }

    boot();
  }, []);

  useEffect(() => {
    if (!activeThreadId || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_ACTIVE_THREAD_KEY, activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    const node = endRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, isTyping]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  async function createThreadInSupabase(
    title = "New chat",
    insertGreeting = true
  ): Promise<Thread | null> {
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const now = new Date().toISOString();

      const { data: inserted, error } = await supabase
        .from("chat_threads")
        .insert({
          user_id: userData.user.id,
          title,
          pinned: false,
          created_at: now,
          updated_at: now,
        })
        .select("id, title, pinned, created_at, updated_at")
        .single();

      if (error || !inserted) return null;

      const thread: Thread = {
        id: String(inserted.id),
        title: String(inserted.title ?? title),
        pinned: Boolean(inserted.pinned),
        created_at: String(inserted.created_at ?? now),
        updated_at: String(inserted.updated_at ?? now),
      };

      if (insertGreeting) {
        await supabase.from("messages").insert({
          user_id: userData.user.id,
          thread_id: thread.id,
          role: "assistant",
          content: WAYPOINT_GREETING,
          created_at: now,
        });
      }

      return thread;
    } catch {
      return null;
    }
  }

  async function loadMessagesForThread(threadId: string) {
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("user_id", userData.user.id)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error || !data || data.length === 0) {
        setMessages([buildStarterMessage()]);
        return;
      }

      setMessages(
        data.map((row) => ({
          id: String(row.id),
          role: row.role as "assistant" | "user",
          text: String(row.content ?? ""),
          createdAt: row.created_at
            ? new Date(String(row.created_at)).getTime()
            : undefined,
        }))
      );
    } catch {
      setMessages([buildStarterMessage()]);
    }
  }

  async function createNewThread() {
    const created = await createThreadInSupabase("New chat", true);
    if (!created) return;

    setThreads((prev) => sortThreads([created, ...prev]));
    setActiveThreadId(created.id);
    setMessages([buildStarterMessage()]);
    setMobileThreadsOpen(false);
  }

  async function switchThread(threadId: string) {
    if (threadId === activeThreadId) return;
    setActiveThreadId(threadId);
    setMobileThreadsOpen(false);
    await loadMessagesForThread(threadId);
  }

  async function updateThread(
    threadId: string,
    patch: Partial<Pick<Thread, "title" | "pinned">>
  ) {
    setThreads((prev) =>
      sortThreads(
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                ...patch,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      )
    );

    try {
      const supabase = createClient();
      await supabase
        .from("chat_threads")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId);
    } catch {}
  }

  async function startRename(thread: Thread) {
    setRenamingThreadId(thread.id);
    setRenameValue(thread.title);
  }

  async function saveRename(threadId: string) {
    const next = renameValue.trim();
    if (!next) {
      setRenamingThreadId(null);
      setRenameValue("");
      return;
    }

    await updateThread(threadId, { title: next });
    setRenamingThreadId(null);
    setRenameValue("");
  }

  async function deleteThread(thread: Thread) {
    setThreadToDelete(thread);
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteThread() {
    if (!threadToDelete) return;

    const deletingId = threadToDelete.id;
    const remaining = threads.filter((t) => t.id !== deletingId);

    setThreads(sortThreads(remaining));
    setShowDeleteConfirm(false);
    setThreadToDelete(null);

    try {
      const supabase = createClient();
      await supabase.from("messages").delete().eq("thread_id", deletingId);
      await supabase.from("chat_threads").delete().eq("id", deletingId);
    } catch {}

    if (activeThreadId === deletingId) {
      const nextId = remaining[0]?.id ?? null;

      if (nextId) {
        setActiveThreadId(nextId);
        await loadMessagesForThread(nextId);
      } else {
        const created = await createThreadInSupabase("New chat", true);
        if (created) {
          setThreads([created]);
          setActiveThreadId(created.id);
          setMessages([buildStarterMessage()]);
        } else {
          setActiveThreadId(null);
          setMessages([buildStarterMessage()]);
        }
      }
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || isTyping || !activeThreadId) return;

    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const userMsg: Msg = {
      id: uid(),
      role: "user",
      text,
      createdAt: Date.now(),
    };

    const nextAssistantId = uid();

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: nextAssistantId,
        role: "assistant",
        text: "",
        createdAt: Date.now(),
      },
    ]);
    setAssistantId(nextAssistantId);
    setIsTyping(true);
    setInput("");

    if (activeThread?.title === "New chat") {
      const nextTitle = makeTitleFromMessage(text);
      await updateThread(activeThreadId, { title: nextTitle });
    } else {
      await updateThread(activeThreadId, {});
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("messages").insert({
          user_id: userData.user.id,
          thread_id: activeThreadId,
          role: "user",
          content: text,
          created_at: nowIso,
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
        body: JSON.stringify({
          message: text,
          threadId: activeThreadId,
        }),
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
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));

          if (!dataLine) continue;

          const jsonStr = dataLine.replace(/^data:\s*/, "");
          let payload: unknown = null;

          try {
            payload = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          const token = (payload as { token?: string })?.token;
          const doneFlag = (payload as { done?: boolean })?.done;

          if (token) {
            fullText += String(token);

            if (!sawFirstToken) {
              sawFirstToken = true;
              setIsTyping(false);
            }

            setMessages((prev) =>
              prev.map((m) =>
                m.id === nextAssistantId ? { ...m, text: fullText } : m
              )
            );
          }

          if (doneFlag) break;
        }
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from("messages").insert({
            user_id: userData.user.id,
            thread_id: activeThreadId,
            role: "assistant",
            content: fullText || "…",
            created_at: new Date().toISOString(),
          });
        }
      } catch {}
    } catch {
      const fallback =
        "Something went wrong.\nWant to try sending that again?";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === nextAssistantId ? { ...m, text: fallback } : m
        )
      );

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from("messages").insert({
            user_id: userData.user.id,
            thread_id: activeThreadId,
            role: "assistant",
            content: fallback,
            created_at: new Date().toISOString(),
          });
        }
      } catch {}
    } finally {
      setIsTyping(false);
    }
  }

  const threadListClass = uiPrefs.compactThreads ? "space-y-2" : "space-y-3";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_28%),var(--background)] px-4 pb-10">
      <Nav current="chat" />

      <div className="mx-auto mt-6 max-w-6xl">
        <Header
          title="Waypoint"
          subtitle="A calmer space to talk things through"
        />

        <div className="mt-6 flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileThreadsOpen((v) => !v)}
            className="rounded-full border border-foreground/10 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur dark:border-white/8 dark:bg-[#272c34]/90"
          >
            {mobileThreadsOpen ? "Hide chats" : "Show chats"}
          </button>

          <button
            type="button"
            onClick={createNewThread}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            New chat
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${mobileThreadsOpen ? "block" : "hidden"} lg:block`}>
            <Card>
              <div className="rounded-3xl border border-black/6 bg-white/82 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/92 dark:shadow-[0_16px_44px_rgba(0,0,0,0.22)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Your chats</h2>
                    <p className="text-sm text-foreground/65">
                      Pin the important ones.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={createNewThread}
                    className="rounded-full bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    New
                  </button>
                </div>

                <div className={threadListClass}>
                  {sortThreads(threads).map((thread) => {
                    const isActive = thread.id === activeThreadId;
                    const isRenaming = thread.id === renamingThreadId;

                    return (
                      <div
                        key={thread.id}
                        className={[
                          "rounded-2xl border p-3 transition",
                          isActive
                            ? "border-emerald-300 bg-emerald-100/75 shadow-sm dark:border-emerald-400/18 dark:bg-emerald-500/12"
                            : "border-black/6 bg-foreground/[0.03] hover:bg-foreground/[0.05] dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => switchThread(thread.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              {thread.pinned && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800 dark:bg-amber-500/16 dark:text-amber-200">
                                  Pinned
                                </span>
                              )}
                            </div>

                            {isRenaming ? (
                              <input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => saveRename(thread.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveRename(thread.id);
                                  if (e.key === "Escape") {
                                    setRenamingThreadId(null);
                                    setRenameValue("");
                                  }
                                }}
                                autoFocus
                                className="mt-2 w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 dark:border-white/10 dark:bg-[#21262d]"
                              />
                            ) : (
                              <div className="mt-2 truncate text-sm font-semibold">
                                {thread.title}
                              </div>
                            )}

                            <div className="mt-1 text-xs text-foreground/55">
                              {thread.updated_at
                                ? new Date(thread.updated_at).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Just now"}
                            </div>
                          </button>

                          <div className="flex shrink-0 flex-col gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateThread(thread.id, {
                                  pinned: !thread.pinned,
                                })
                              }
                              className="rounded-full border border-foreground/10 px-2.5 py-1 text-xs font-medium transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
                            >
                              {thread.pinned ? "Unpin" : "Pin"}
                            </button>

                            <button
                              type="button"
                              onClick={() => startRename(thread)}
                              className="rounded-full border border-foreground/10 px-2.5 py-1 text-xs font-medium transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
                            >
                              Rename
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteThread(thread)}
                              className="rounded-full border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-400/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {threads.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-foreground/15 p-4 text-sm text-foreground/60">
                      No chats yet. Start one when you’re ready.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </aside>

          <section>
            <Card>
              <div className="rounded-3xl border border-black/6 bg-white/82 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/92 dark:shadow-[0_16px_44px_rgba(0,0,0,0.22)]">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-black/6 pb-4 dark:border-white/8">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">
                      {activeThread?.title ?? "New chat"}
                    </h2>
                    <p className="text-sm text-foreground/65">
                      A private place to talk things through
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={createNewThread}
                    className="hidden rounded-full border border-foreground/10 px-4 py-2 text-sm font-medium transition hover:bg-foreground/5 lg:inline-flex dark:border-white/10 dark:hover:bg-white/6"
                  >
                    New thread
                  </button>
                </div>

                <div className="space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.role === "assistant" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={[
                          "max-w-[88%] rounded-3xl px-4 py-3 shadow-sm",
                          m.role === "assistant"
                            ? "bg-white text-slate-900 dark:bg-[#313743] dark:text-slate-100"
                            : "bg-emerald-100 text-emerald-950 dark:bg-emerald-500/16 dark:text-emerald-100",
                        ].join(" ")}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
                            {m.role === "assistant" ? "Waypoint" : "You"}
                          </span>

                          {uiPrefs.showTimestamps && m.createdAt && (
                            <span className="text-xs text-foreground/45">
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}

                          {isTyping && m.id === assistantId && (
                            <span className="text-xs text-foreground/45">
                              • • •
                            </span>
                          )}
                        </div>

                        <div className="whitespace-pre-wrap text-sm leading-6">
                          {m.text}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div ref={endRef} />
                </div>

                <div className="mt-5 border-t border-black/6 pt-4 dark:border-white/8">
                  <div className="flex gap-3">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          uiPrefs.enterToSend &&
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !isTyping
                        ) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={3}
                      placeholder={
                        isTyping
                          ? "Waypoint is typing…"
                          : "Type what’s on your mind…"
                      }
                      disabled={isTyping}
                      className="min-h-[88px] flex-1 resize-none rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-300 disabled:opacity-60 dark:border-white/10 dark:bg-[#21262d]"
                    />

                    <button
                      type="button"
                      onClick={send}
                      disabled={isTyping || !input.trim()}
                      className="self-end rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-foreground/50">
                    Press Enter to send, Shift + Enter for a new line.
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </div>

        <Footer />
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete this chat thread?"
        description="This will permanently remove the thread and all messages inside it."
        confirmLabel="Delete thread"
        cancelLabel="Cancel"
        onCancel={() => {
          setShowDeleteConfirm(false);
          setThreadToDelete(null);
        }}
        onConfirm={() => {
          void confirmDeleteThread();
        }}
      />
    </main>
  );
}