import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.SARVAM_API_KEY;
        if (!key) return new Response("Missing SARVAM_API_KEY", { status: 500 });

        const { text, language = "en-IN", speaker = "anushka" } = (await request.json()) as {
          text: string;
          language?: string;
          speaker?: string;
        };
        if (!text) return new Response("text required", { status: 400 });

        const chunk = text.slice(0, 1500);

        const res = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": key,
          },
          body: JSON.stringify({
            text: chunk,
            target_language_code: language,
            speaker,
            model: "bulbul:v2",
            enable_preprocessing: true,
            pace: 1,
            speech_sample_rate: 22050,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Sarvam TTS error", res.status, errText);
          return new Response(`TTS failed: ${errText}`, { status: res.status });
        }

        const data = await res.json();
        // Sarvam returns { audios: [base64...] }
        const b64 = Array.isArray(data.audios) ? data.audios.join("") : "";
        if (!b64) return new Response("No audio", { status: 500 });

        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        return new Response(bytes, {
          headers: { "Content-Type": "audio/wav" },
        });
      },
    },
  },
});