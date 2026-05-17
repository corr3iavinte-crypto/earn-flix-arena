import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { chatAI } from "@/lib/chat.functions";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Olá! 👋 Sou a assistente da Netflilms. Como posso ajudar? Pergunte sobre planos VIP, depósitos, saques ou ganhos." },
  ]);
  const ask = useServerFn(chatAI);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const m = useMutation({
    mutationFn: (history: Msg[]) => ask({ data: { messages: history } }),
    onSuccess: (r) => setMessages((prev) => [...prev, { role: "assistant", content: r.reply }]),
    onError: (e: any) => setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${e?.message ?? "Erro"}` }]),
  });

  const send = () => {
    const text = input.trim();
    if (!text || m.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    m.mutate(next);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir chat"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-700 text-white shadow-elegant hover:scale-110 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[10px] font-black">AI</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center sm:justify-center bg-black/40 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-card shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-gradient-to-br from-primary to-purple-700 p-4 text-white">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white/20 p-1.5"><Sparkles className="h-4 w-4" /></div>
                <div>
                  <div className="text-sm font-bold">Assistente Netflilms</div>
                  <div className="text-[10px] opacity-80">IA · sempre online</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg bg-white/15 p-1.5"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {m.isPending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3 py-2 text-sm">A pensar…</div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Escreva a sua pergunta…"
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={send}
                  disabled={m.isPending || !input.trim()}
                  className="rounded-xl bg-primary px-4 text-primary-foreground disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
