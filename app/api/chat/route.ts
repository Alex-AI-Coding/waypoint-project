import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

type Body = {
  message?: string;
  threadId?: string;
};

/* ===============================
   SAFETY LAYER
================================ */

const CRISIS_PATTERNS: RegExp[] = [
  /suicide/i,
  /kill myself/i,
  /end (my )?life/i,
  /self[- ]?harm/i,
  /cut myself/i,
  /hurt myself/i,
  /overdose/i,
  /want to die/i,
  /wanna die/i,
  /wish (i was|i were) dead/i,
  /don't want to live/i,
  /do not want to live/i,
  /tired of living/i,
  /can't keep going/i,
];

function isCrisisMessage(message: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(message));
}

const SOFT_DISTRESS_PATTERNS: RegExp[] = [
  /hopeless/i,
  /empty/i,
  /exhausted/i,
  /overwhelmed/i,
  /worthless/i,
  /i feel like a burden/i,
  /nothing matters/i,
  /i can't handle this/i,
  /i feel lost/i,
  /i'm struggling/i,
];

function isSoftDistress(message: string): boolean {
  return SOFT_DISTRESS_PATTERNS.some((pattern) => pattern.test(message));
}

function getCrisisResponse(): string {
  return `I'm really sorry that you're feeling this much pain right now.
You don't have to handle this alone. If you're in immediate danger or feel like you might act on these thoughts, please contact your local emergency services right now. If you can, consider reaching out to someone you trust — a friend, family member, or someone close to you.

If you're in the Philippines, you can call or text 0966-351-4518 (Globe) or 0908-639-2672 (Smart) to reach the Suicide & Crisis Lifeline. It's free and available 24/7.

If you're outside the Philippines, I can help you look for a crisis support number in your country.

I'm here to listen, but you deserve real-time human support too.`;
}

/* ===============================
   SYSTEM PROMPT
================================ */

type TonePref = "calm" | "gentle" | "direct";

function buildSystemPrompt(options?: {
  softDistress?: boolean;
  tone?: TonePref;
  supportiveReminders?: boolean;
  alwaysShowCrisisLink?: boolean;
}) {
  const base = [
    "You are Waypoint, a supportive mental health companion chatbot.",
    "You are NOT a medical service. Do not diagnose.",
    "Do not prescribe.",
    "Ask one gentle follow-up question.",
    "If the user mentions self-harm or suicide, encourage contacting local emergency services and a trusted person immediately.",
  ];

  if (options?.tone === "direct") {
    base.push("Be concise and structured. Use short paragraphs and clear steps.");
  } else if (options?.tone === "gentle") {
    base.push("Use extra gentle language, more validation, and slower pacing.");
  } else {
    base.push("Be warm, calm, and practical.");
  }

  if (options?.softDistress) {
    base.push(
      "The user appears emotionally distressed. Slow down your tone. Validate their feelings gently. Avoid being overly upbeat. Focus on empathy before offering suggestions."
    );

    if (options?.supportiveReminders === false) {
      base.push(
        "Do not proactively add breathing exercises, grounding tips, coping reminders, or 'one small next step' suggestions unless the user asks for them or they are clearly necessary."
      );
    } else {
      base.push(
        "You may include at most one brief grounding or coping reminder if it naturally fits the response."
      );
    }

    if (options?.alwaysShowCrisisLink) {
      base.push(
        "Include one brief sentence that reminds the user to reach out to local emergency or crisis support if they feel unsafe or think they might act on harmful urges."
      );
    }
  }

  return base.join(" ");
}

/* ===============================
   OLLAMA STREAM
================================ */

async function ollamaChatStream(
  messages: Array<{ role: string; content: string }>
) {
  const baseUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  return res.body;
}

/* ===============================
   SSE HELPERS
================================ */

function sseHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  h.set("Content-Type", "text/event-stream; charset=utf-8");
  h.set("Cache-Control", "no-cache, no-transform");
  h.set("Connection", "keep-alive");
  return h;
}

function sseStreamFromSingleReply(reply: string): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ token: reply })}\n\n`)
      );
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
      );
      controller.close();
    },
  });
}

/* ===============================
   POST
================================ */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const message = (body.message ?? "").trim();
    const threadId = (body.threadId ?? "").trim();
    const cookieResponse = new Response();

    if (!message) {
      const stream = sseStreamFromSingleReply(
        "Tell me a bit more—what’s been going on?"
      );

      return new Response(stream, {
        headers: sseHeaders(cookieResponse.headers),
      });
    }

    if (isCrisisMessage(message)) {
      const stream = sseStreamFromSingleReply(getCrisisResponse());

      return new Response(stream, {
        headers: sseHeaders(cookieResponse.headers),
      });
    }

    const softDistress = isSoftDistress(message);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = req.headers.get("cookie") ?? "";

            return cookieHeader
              .split(";")
              .map((c) => c.trim())
              .filter(Boolean)
              .map((c) => {
                const idx = c.indexOf("=");

                return {
                  name: idx === -1 ? c : c.slice(0, idx),
                  value: idx === -1 ? "" : c.slice(idx + 1),
                };
              });
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieResponse.headers.append(
                "Set-Cookie",
                `${name}=${value}; Path=${options?.path ?? "/"}`
              );
            });
          },
        },
      }
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user ?? null;

    let tonePref: TonePref = "calm";
    let supportiveReminders = true;
    let alwaysShowCrisisLink = true;

    if (user) {
      const { data: settingsRow } = await supabase
        .from("user_settings")
        .select("tone, supportive_reminders, always_show_crisis_link")
        .eq("user_id", user.id)
        .single();

      const t = settingsRow?.tone;
      if (t === "calm" || t === "gentle" || t === "direct") {
        tonePref = t;
      }

      if (typeof settingsRow?.supportive_reminders === "boolean") {
        supportiveReminders = settingsRow.supportive_reminders;
      }

      if (typeof settingsRow?.always_show_crisis_link === "boolean") {
        alwaysShowCrisisLink = settingsRow.always_show_crisis_link;
      }
    }

    let history: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (user) {
      let query = supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (threadId) {
        query = query.eq("thread_id", threadId);
      }

      const { data, error } = await query;

      if (!error && data) {
        history = data
          .slice()
          .reverse()
          .map((row) => ({
            role: row.role as "user" | "assistant",
            content: String(row.content ?? ""),
          }));
      }
    }

    const system = buildSystemPrompt({
      softDistress,
      tone: tonePref,
      supportiveReminders,
      alwaysShowCrisisLink,
    });

    const ollamaMessages = [
      { role: "system", content: system },
      ...history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const ollamaBody = await ollamaChatStream(ollamaMessages);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = ollamaBody.getReader();
        let buffer = "";

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;

              try {
                const json = JSON.parse(line);
                const token = json?.message?.content ?? "";

                if (token) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                  );
                }

                if (json?.done) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
                  );
                  controller.close();
                  return;
                }
              } catch {
                // ignore malformed / partial NDJSON
              }
            }
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(sseStream, {
      headers: sseHeaders(cookieResponse.headers),
    });
  } catch {
    const stream = sseStreamFromSingleReply(
      "I couldn’t reach the AI right now.\nTell me what’s going on, and we’ll take it step by step."
    );

    return new Response(stream, {
      headers: sseHeaders(),
    });
  }
}