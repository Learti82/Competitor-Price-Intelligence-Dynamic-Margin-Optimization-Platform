"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "ai";
  content: string;
}

const STARTERS = [
  "Pse duhet të ngre çmimin e Coca-Cola?",
  "Cilat produkte kanë marzhë nën 5%?",
  "Si po sillen konkurrentët këtë javë?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-gray-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      // If the API key is missing the route returns a [Mock AI Response] prefix
      if (data.reply?.startsWith("[Mock AI Response]")) setDemoNotice(true);
      const aiMsg: Message = {
        role: "ai",
        content: data.reply ?? data.error ?? "Gabim i panjohur.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Gabim në lidhje me serverin." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <Header
        title="Asistenti AI i Çmimeve"
        subtitle="Pyet PriceSync AI rreth strategjisë suaj"
      />

      <div className="flex flex-col flex-1 overflow-hidden p-6">
        {demoNotice && (
          <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-300">
            Vendos ANTHROPIC_API_KEY në .env për t&apos;u aktivizuar. Për tani po kthejm përgjigje demo.
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
                PS
              </div>
              <div>
                <p className="text-white font-semibold text-lg">PriceSync AI</p>
                <p className="text-gray-400 text-sm mt-1">
                  Pyet çdo gjë rreth çmimeve, marzheve dhe konkurrentëve
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-300 hover:border-blue-500/50 hover:text-white transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white flex-shrink-0 mt-0.5">
                  PS
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-900 text-gray-200 rounded-bl-sm border border-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white flex-shrink-0">
                PS
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-bl-sm px-4">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          className="flex gap-3 mt-auto"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Shkruaj mesazhin tënd..."
            className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Send className="h-4 w-4" />
            Dërgo
          </Button>
        </form>
      </div>
    </div>
  );
}
