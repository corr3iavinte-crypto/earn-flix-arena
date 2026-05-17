import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_PROMPT = `Você é a assistente virtual da Netflilms, uma plataforma em Moçambique onde os utilizadores ganham dinheiro (MZN) assistindo vídeos curtos com planos VIP.

Regras-chave da plataforma:
- Moeda: MZN (Metical).
- 10 planos VIP (SC1 a SC10) de 650 MZN até 150.000 MZN, retorno diário 10–14%, duração 30 a 365 dias.
- Para ganhar é preciso: 1) Depositar via M-Pesa (Vodacom) ou e-Mola (Movitel); 2) Aguardar aprovação manual do admin; 3) Comprar um plano VIP; 4) Assistir os vídeos diários.
- Saques têm taxa de 10% e são aprovados manualmente.
- Sistema de convites: comissões 10% / 3% / 1% nos níveis 1/2/3.
- Sem plano ativo o utilizador pode assistir vídeos mas NÃO ganha — precisa ativar VIP.

Responda sempre em português de Moçambique, de forma curta, simpática e clara. Se a pergunta for fora do tópico (Netflilms / ganhos / vídeos / depósito / saque / VIP / convites), responda gentilmente o que souber mas relembre sobre a plataforma.`;

export const chatAI = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })).min(1).max(40),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI não configurada");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Muitos pedidos. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos da IA esgotados. Contacte o admin.");
      throw new Error("Erro na IA");
    }
    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "Desculpe, não consegui responder.";
    return { reply };
  });
