import { createFileRoute, Outlet, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as localAuth from "@/lib/local-auth";
import * as chatStore from "@/lib/local-chat-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Plus, LogOut, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
});

type Thread = chatStore.Thread;

function ChatLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;
  const [email, setEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const user = localAuth.getUser();
    setEmail(user?.email ?? "");
    setUserId(user?.id ?? "");
  }, []);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["threads", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Thread[]> => chatStore.listThreads(userId),
  });

  // Auto-create or select thread when at /chat root
  useEffect(() => {
    if (activeId || isLoading) return;
    if (threads.length > 0) {
      navigate({ to: "/chat/$threadId", params: { threadId: threads[0].id }, replace: true });
    }
  }, [activeId, isLoading, threads, navigate]);

  const newThread = async () => {
    setCreating(true);
    try {
      if (!userId) return;
      const thread = await chatStore.createThread(userId, "New chat");
      await qc.invalidateQueries({ queryKey: ["threads", userId] });
      navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create thread");
    } finally {
      setCreating(false);
    }
  };

  const deleteThread = async (id: string) => {
    try {
      await chatStore.deleteThread(id);
    } catch (e) {
      return toast.error(e instanceof Error ? e.message : "Failed to delete thread");
    }
    await qc.invalidateQueries({ queryKey: ["threads", userId] });
    if (activeId === id) navigate({ to: "/chat" });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await localAuth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r bg-card/40">
        <div className="flex items-center gap-2 p-4 border-b">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <MessageCircle className="h-4 w-4" />
          </div>
          <span className="font-semibold">Sarvam Chat</span>
        </div>
        <div className="p-3">
          <Button onClick={newThread} disabled={creating} className="w-full justify-start" size="sm">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            New chat
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-2">
            {threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-1 rounded-md px-1 ${
                  activeId === t.id ? "bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex-1 truncate px-2 py-2 text-sm"
                >
                  {t.title || "New chat"}
                </Link>
                <button
                  onClick={() => deleteThread(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                  aria-label="Delete thread"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {threads.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground px-3 py-4">No conversations yet.</p>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-3 space-y-2">
          <div className="text-xs text-muted-foreground truncate px-1">{email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center justify-between p-3 border-b">
          <span className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Sarvam Chat
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={newThread}><Plus className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}