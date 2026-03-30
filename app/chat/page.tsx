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
import PageEnter from "@/components/PageEnter";

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

const WAYPOINT_GREETING = "Hi! I'm Waypoint, how may I help you today?";

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
  const messagesWrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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
    if (typeof window === "undefined") return;
    if (!mobileThreadsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileThreadsOpen]);

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

      requestAnimationFrame(() => {
        inputRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
      });
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

    requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
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
    const currentThreadId = activeThreadId;
    const currentThreadTitle = activeThread?.title ?? "New chat";

    if (!text || isTyping || !currentThreadId) return;

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData.user?.id ?? null;
    const userCreatedAtIso = new Date().toISOString();

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

    requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    if (currentThreadTitle === "New chat") {
      const nextTitle = makeTitleFromMessage(text);
      await updateThread(currentThreadId, { title: nextTitle });
    } else {
      await updateThread(currentThreadId, {});
    }

    async function saveMessage(
      role: "assistant" | "user",
      content: string,
      createdAt: string
    ) {
      if (!currentUserId) return false;

      try {
        const { error } = await supabase.from("messages").insert({
          user_id: currentUserId,
          thread_id: currentThreadId,
          role,
          content,
          created_at: createdAt,
        });

        return !error;
      } catch {
        return false;
      }
    }

    let didSaveUserMessage = false;

    async function saveUserMessageIfNeeded() {
      if (didSaveUserMessage) return;
      didSaveUserMessage = await saveMessage("user", text, userCreatedAtIso);
    }

    let fullText = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          threadId: currentThreadId,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No stream");

      await saveUserMessageIfNeeded();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let pendingText = "";
      let flushTimer: ReturnType<typeof setInterval> | null = null;

      function flushToMessage() {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === nextAssistantId ? { ...m, text: fullText } : m
          )
        );
      }

      function startFlush() {
        if (flushTimer) return;

        flushTimer = setInterval(() => {
          if (!pendingText) {
            if (flushTimer) {
              clearInterval(flushTimer);
              flushTimer = null;
            }
            return;
          }

          const match = pendingText.match(/^\S+\s*|^\s+/);
          const piece = match?.[0] ?? pendingText;

          pendingText = pendingText.slice(piece.length);
          fullText += piece;
          flushToMessage();
        }, 35);
      }

      function finishFlush() {
        if (flushTimer) {
          clearInterval(flushTimer);
          flushTimer = null;
        }

        if (pendingText) {
          fullText += pendingText;
          pendingText = "";
          flushToMessage();
        }
      }

      let streamDone = false;

      while (!streamDone) {
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
            pendingText += String(token);
            startFlush();
          }

          if (doneFlag) {
            streamDone = true;
            break;
          }
        }
      }

      finishFlush();

      await saveMessage("assistant", fullText || "…", new Date().toISOString());
    } catch {
      const fallback = "Something went wrong.\nWant to try sending that again?";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === nextAssistantId ? { ...m, text: fallback } : m
        )
      );

      await saveUserMessageIfNeeded();
      await saveMessage("assistant", fallback, new Date().toISOString());
    } finally {
      setIsTyping(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  const threadListClass = uiPrefs.compactThreads ? "space-y-2" : "space-y-3";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_24%),var(--background)] px-4 pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-24 h-56 w-56 rounded-full bg-emerald-400/12 blur-3xl dark:bg-emerald-400/8" />
        <div className="absolute right-[-4rem] top-32 h-72 w-72 rounded-full bg-sky-300/16 blur-3xl dark:bg-sky-400/8" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl dark:bg-teal-400/6" />
      </div>

      <Nav current="chat" />
      <PageEnter>
        <div className="relative mx-auto mt-6 max-w-6xl">
          <Header
            title="Waypoint"
            subtitle="A calmer space to talk things through"
          />

          <div className="mt-6 flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileThreadsOpen((v) => !v)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-foreground/10 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur transition hover:bg-white dark:border-white/8 dark:bg-[#272c34]/90 dark:hover:bg-[#2f3540]"
            >
              {mobileThreadsOpen ? "Hide chats" : "Show chats"}
            </button>

            <button
              type="button"
              onClick={createNewThread}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              New chat
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
            {mobileThreadsOpen ? (
              <button
                type="button"
                aria-label="Close chats panel"
                onClick={() => setMobileThreadsOpen(false)}
                className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[1px] lg:hidden"
              />
            ) : null}

            <aside
              className={[
                "fixed inset-y-0 left-0 z-40 w-[88vw] max-w-[340px] transform transition duration-300 lg:static lg:w-auto lg:max-w-none",
                mobileThreadsOpen ? "translate-x-0" : "-translate-x-full",
                "lg:translate-x-0",
              ].join(" ")}
            >
              <div className="h-full p-0 lg:p-0">
                <Card className="relative h-[100dvh] overflow-hidden border-emerald-100/80 bg-white/92 p-0 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-[#272c34]/96 dark:shadow-[0_18px_52px_rgba(0,0,0,0.22)] lg:h-auto lg:bg-white/82 lg:dark:bg-[#272c34]/90">
                  <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

                  <div className="flex h-[calc(100dvh-0.375rem)] flex-col p-4 lg:h-auto">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          Your chats
                        </h2>
                        <p className="text-sm text-foreground/62">
                          Keep conversations organized.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={createNewThread}
                        className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        New
                      </button>
                    </div>

                    <div className={`${threadListClass} min-h-0 flex-1 overflow-y-auto pr-1`}>
                      {sortThreads(threads).map((thread) => {
                        const isActive = thread.id === activeThreadId;
                        const isRenaming = thread.id === renamingThreadId;

                        return (
                          <div
                            key={thread.id}
                            className={[
                              "rounded-2xl border p-3 transition",
                              isActive
                                ? "border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-400/22 dark:bg-emerald-500/12"
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
                                  <div className="mt-2 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
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

                              <div className="flex shrink-0 flex-row flex-wrap gap-2 lg:flex-col">
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
              </div>
            </aside>

            <section className="min-w-0">
              <Card className="relative flex min-h-[70dvh] flex-col overflow-hidden border-emerald-100/80 bg-white/82 p-0 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-[#272c34]/90 dark:shadow-[0_18px_52px_rgba(0,0,0,0.22)] lg:min-h-[72dvh]">
                <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

                <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-black/6 pb-4 dark:border-white/8">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                          Active conversation
                        </span>
                      </div>

                      <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {activeThread?.title ?? "New chat"}
                      </h2>
                      <p className="text-sm text-foreground/62">
                        A private place to talk things through
                      </p>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-black/6 bg-white/70 p-3 shadow-sm dark:border-white/8 dark:bg-[#222831]/60 sm:p-4">
                    <div
                      ref={messagesWrapRef}
                      className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
                    >
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${
                            m.role === "assistant" ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={[
                              "max-w-[92%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[88%]",
                              m.role === "assistant"
                                ? "border border-black/6 bg-white text-slate-900 dark:border-white/8 dark:bg-[#313743] dark:text-slate-100"
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
                  </div>

                  <div className="mt-5 border-t border-black/6 pt-4 dark:border-white/8">
                    <div className="rounded-[1.5rem] border border-black/6 bg-white/72 p-3 shadow-sm dark:border-white/8 dark:bg-[#222831]/60 pb-safe">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <textarea
                          ref={inputRef}
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
                          disabled={isTyping}
                          placeholder={
                            isTyping
                              ? "Waypoint is typing…"
                              : "Type what’s on your mind…"
                          }
                          className="min-h-[120px] w-full resize-none rounded-[1.25rem] border border-foreground/10 bg-background px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#21262d] sm:min-h-[96px] sm:text-sm"
                        />

                        <button
                          type="button"
                          onClick={send}
                          disabled={isTyping || !input.trim()}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-end"
                        >
                          Send
                        </button>
                      </div>
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
      </PageEnter>

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