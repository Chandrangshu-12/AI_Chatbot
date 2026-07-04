import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.GROQ_API_KEY;
        if (!key) return new Response("Missing GROQ_API_KEY", { status: 500 });
        const { messages } = (await request.json()) as { messages: Msg[] };
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }

        const system: Msg = {
          role: "system",
          content:
            "You are Sarvam Chat, a friendly, concise AI assistant. Use markdown when helpful. Keep answers focused.",
        };

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [system, ...messages],
            temperature: 0.7,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Groq error", res.status, text);
          return new Response(`Chat failed: ${text}`, { status: res.status });
        }
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ reply });
      },
    },
  },
});