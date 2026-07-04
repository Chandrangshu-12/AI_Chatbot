import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mic, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
          Sarvam Chat
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
        </div>
      </header>
      <main className="container mx-auto flex flex-col items-center px-6 pt-20 pb-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Powered by Groq + Sarvam AI
        </div>
        <h1 className="max-w-3xl text-5xl md:text-6xl font-bold tracking-tight text-foreground">
          Your intelligent chat companion, now with a voice.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Talk or type — Sarvam Chat transcribes your voice, holds threaded conversations, and remembers every chat under your account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Start chatting free</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth">I already have an account</Link></Button>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3 text-left w-full max-w-3xl">
          {[
            { icon: MessageCircle, title: "Threaded history", body: "Every conversation saved and searchable in your account." },
            { icon: Mic, title: "Voice input", body: "Tap the mic — Sarvam transcribes speech in Indian languages." },
            { icon: Sparkles, title: "Fast replies", body: "Groq's llama-3.3-70b responds in under a second." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
