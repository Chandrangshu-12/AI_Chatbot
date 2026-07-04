import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import * as localAuth from "@/lib/local-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageCircle, Loader2 } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localAuth.getUser()) navigate({ to: "/chat", replace: true });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        await localAuth.signUp(email, password);
        toast.success("Account created!");
        navigate({ to: "/chat", replace: true });
      } else {
        await localAuth.signInWithPassword(email, password);
        navigate({ to: "/chat", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background via-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 font-semibold">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
          Sarvam Chat
        </Link>
        <Card className="p-6">
          <div className="flex mb-6 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${tab === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >Sign in</button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${tab === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >Sign up</button>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tab === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "signin" ? "Sign in to continue chatting." : "Start chatting in seconds."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={tab === "signin" ? "current-password" : "new-password"} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {tab === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

        </Card>
      </div>
    </div>
  );
}