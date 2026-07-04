import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.SARVAM_API_KEY;
        if (!key) return new Response("Missing SARVAM_API_KEY", { status: 500 });

        const inbound = await request.formData();
        const file = inbound.get("file");
        if (!(file instanceof Blob)) return new Response("file required", { status: 400 });

        const fd = new FormData();
        fd.append("file", file, (file as File).name || "audio.webm");
        fd.append("model", "saaras:v3");

        const res = await fetch("https://api.sarvam.ai/speech-to-text-translate", {
          method: "POST",
          headers: { "api-subscription-key": key },
          body: fd,
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("Sarvam STT error", res.status, text);
          return new Response(`STT failed: ${text}`, { status: res.status });
        }
        const data = await res.json();
        return Response.json({ transcript: data.transcript ?? "" });
      },
    },
  },
});