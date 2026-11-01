"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How does this app work?",
  "What is gross vs net?",
  "What does Simulate due date do?",
  "Why was my payout flagged?",
];

export default function HelpChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I can explain how Smart Payouts works. Ask me anything, or tap a question below.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
    const openHelp = () => setOpen(true);
    window.addEventListener("open-help", openHelp);
    return () => window.removeEventListener("open-help", openHelp);
  }, []);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong." },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-white shadow-lg"
        >
          Help
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[340px] flex-col rounded-xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-xl bg-black px-4 py-3 text-white">
            <span className="font-semibold">Smart Payouts Help</span>
            <button onClick={() => setOpen(false)} aria-label="Close help">
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <span
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${
                    m.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && <p className="text-gray-500">Thinking...</p>}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border px-3 py-1 text-xs hover:bg-gray-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t p-2"
          >
            <input
              className="flex-1 rounded border p-2 text-sm"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black px-3 text-sm text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}