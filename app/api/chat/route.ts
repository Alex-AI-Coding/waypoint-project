import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

type Body = {
  message?: string;
};

type TonePref = "calm" | "gentle" | "direct";

const CRISIS_PATTERNS: RegExp[] = [
  /suicide/i,
  /kill myself/i,
  /killing myself/i,
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
  /i am going to die/i,
  /i want to disappear/i,
  /i might do something to myself/i,
  /magpapakamatay/i,
  /gusto ko nang mamatay/i,
  /ayoko nang mabuhay/i,
  /sasaktan ko ang sarili ko/i,
];

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
  /i am struggling/i,
  /burned out/i,
  /pagod na pagod/i,
  /nahihirapan na ako/i,
  /di ko na kaya/i,
  /hindi ko na kaya/i,
];

const MEDICAL_PRESCRIBING_PATTERNS: RegExp[] = [
  /prescribe/i,
  /prescription/i,
  /what medicine should i take/i,
  /what medication should i take/i,
  /what drug should i take/i,
  /what should i take for/i,
  /dosage/i,
  /dose/i,
  /how many mg/i,
  /\b\d+\s?mg\b/i,
  /take twice a day/i,
  /take once a day/i,
  /antidepressant/i,
  /anti[- ]?anxiety medication/i,
  /sleeping pills?/i,
  /painkillers?/i,
  /anong gamot/i,
  /gamot para sa/i,
  /ilang mg/i,
  /pwede bang uminom ng/i,
  /reseta/i,
];

function isCrisisMessage(message: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(message));
}

function isSoftDistress(message: string): boolean {
  return SOFT_DISTRESS_PATTERNS.some((pattern) => pattern.test(message));
}

function isMedicineRequest(message: string): boolean {
  return MEDICAL_PRESCRIBING_PATTERNS.some((pattern) => pattern.test(message));
}

function getPhilippinesCrisisBlock(): string {
  return [
    "If you are in the Philippines and you may act on these thoughts or are in immediate danger, call 911 now.",
    "You can also contact the NCMH Crisis Hotline, available 24/7:",
    "• 1553",
    "• (02) 7-989-8727",
    "• 0917-899-8727",
  ].join("\n");
}

function getSoftSupportPreface(alwaysShowCrisisLink: boolean): string {
  const preface =
    "It sounds like things feel really heavy right now. I’m really glad you shared that with me.";

  if (!alwaysShowCrisisLink) return preface;

  return `${preface}\n\n${getPhilippinesCrisisBlock()}`;
}

function getCrisisResponse(): string {
  return [
    "I’m really sorry that you're feeling this much pain right now.",
    "You do not have to handle this alone.",
    "Please move closer to another person if you can, or call someone you trust and tell them you need help staying safe right now.",
    "",
    getPhilippinesCrisisBlock(),
    "",
    "If you want, send me just one word right now: SAFE, UNSAFE, or ALONE.",
  ].join("\n");
}

function getNoPrescribingResponse(): string {
  return [
    "I can’t prescribe medicine or tell you what dosage to take.",
    "For medication questions, it’s safest to speak with a licensed doctor or pharmacist.",
    "If you want, I can still help in safer ways — for example, by helping you describe your symptoms clearly, list questions for a doctor, or suggest non-medication coping steps.",
  ].join(" ");
}

function buildSystemPrompt(options?: {
  softDistress?: boolean;
  tone?: TonePref;
  supportiveReminders?: boolean;
  alwaysShowCrisisLink?: boolean;
}) {
  const base = [
    "You are Waypoint, a supportive mental health companion chatbot.",
    "You are NOT a medical service.",
    "Do not diagnose.",
    "Do not prescribe.",
    "Do not recommend prescription medicines, dosages, frequencies, or treatment regimens.",
    "If the user asks for medicines or dosages, refuse briefly and suggest consulting a licensed doctor or pharmacist.",
    "Ask one gentle follow-up question unless the user is in crisis.",
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
  }

  if (options?.supportiveReminders) {
    base.push(
      "When appropriate, you may offer small supportive reminders like breathing, grounding, drinking water, pausing, or taking one small next step."
    );
  } else {
    base.push(
      "Do not add extra supportive reminder phrases unless the user directly asks for coping ideas."
    );
  }

  if (options?.alwaysShowCrisisLink) {
    base.push(
      "When a response involves emotional safety concerns, you may include a short Philippines crisis support reminder."
    );
  }

  return base.join(" ");
}

async function ollamaChatStream(
  messages: Array<{ role: string; content: string }>
) {
  const baseUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const message = (body.message ?? "").trim();

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

    if (isMedicineRequest(message)) {
      const stream = sseStreamFromSingleReply(getNoPrescribingResponse());
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

      supportiveReminders = settingsRow?.supportive_reminders ?? true;
      alwaysShowCrisisLink = settingsRow?.always_show_crisis_link ?? true;
    }

    let history: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (user) {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        history = data
          .slice()
          .reverse()
          .map((row) => ({
            role: row.role as "user" | "assistant",
            content: row.content,
          }));
      }
    }

    const system = buildSystemPrompt({
      softDistress,
      tone: tonePref,
      supportiveReminders,
      alwaysShowCrisisLink,
    });

    const userContent =
      softDistress && alwaysShowCrisisLink
        ? `${getSoftSupportPreface(alwaysShowCrisisLink)}\n\nUser message: ${message}`
        : message;

    const ollamaMessages = [
      { role: "system", content: system },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent },
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
              } catch {}
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
      "I couldn’t reach the AI right now. If you want, tell me what you’re feeling and we’ll take it step by step."
    );

    return new Response(stream, {
      headers: sseHeaders(),
    });
  }
}