import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as chatStore from "@/lib/local-chat-store";
import { getUser } from "@/lib/local-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Send, Volume2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThread,
});

type Msg = chatStore.Message;

function ChatThread() {
  const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async (): Promise<Msg[]> => chatStore.listMessages(threadId),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const user = getUser();
      if (!user) throw new Error("Not signed in");

      // Save user message locally
      const userMsg = await chatStore.addMessage(threadId, "user", text);

      // Update title if first message
      if (messages.length === 0) {
        await chatStore.updateThreadTitle(threadId, text.slice(0, 60));
        qc.invalidateQueries({ queryKey: ["threads", user.id] });
      }

      // Build history to send
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { reply } = await res.json();

      await chatStore.addMessage(threadId, "assistant", reply);
    },
    onMutate: () => {
      // Optimistic UI handled by refetch after
    },
    onSuccess: () => {
      const user = getUser();
      qc.invalidateQueries({ queryKey: ["messages", threadId] });
      if (user) qc.invalidateQueries({ queryKey: ["threads", user.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send"),
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate(text);
    // Optimistic insert (will be replaced on refetch)
    qc.setQueryData<Msg[]>(["messages", threadId], (old = []) => [
      ...old,
      { id: `tmp-${Date.now()}`, thread_id: threadId, role: "user", content: text, created_at: new Date().toISOString() },
    ]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1000) {
          toast.error("Recording too short");
          return;
        }
        setTranscribing(true);
        try {
          const fd = new FormData();
          const ext = mime.includes("webm") ? "webm" : "mp4";
          fd.append("file", blob, `rec.${ext}`);
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          if (!res.ok) throw new Error(await res.text());
          const { transcript } = await res.json();
          setInput((v) => (v ? v + " " : "") + transcript);
          textareaRef.current?.focus();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  };

  const speak = async (id: string, text: string) => {
    try {
      setSpeakingId(id);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const buf = await res.arrayBuffer();
      const audio = new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" })));
      audio.onended = () => setSpeakingId(null);
      await audio.play();
    } catch (e) {
      setSpeakingId(null);
      toast.error(e instanceof Error ? e.message : "TTS failed");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground pt-20">
              <p className="text-lg font-medium text-foreground">How can I help you today?</p>
              <p className="text-sm mt-1">Type below or tap the mic to speak.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "user" ? (
                <div className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 max-w-[80%] whitespace-pre-wrap">
                  {m.content}
                </div>
              ) : (
                <div className="group">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  <button
                    onClick={() => speak(m.id, m.content)}
                    disabled={speakingId !== null}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition"
                  >
                    {speakingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />}
                    Speak
                  </button>
                </div>
              )}
            </div>
          ))}
          {sendMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto w-full p-4">
          <div className="relative flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm">
            <Button
              type="button"
              size="icon"
              variant={recording ? "destructive" : "ghost"}
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              aria-label={recording ? "Stop recording" : "Start recording"}
            >
              {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={recording ? "Listening…" : "Message Sarvam Chat…"}
              rows={1}
              className="flex-1 min-h-[40px] max-h-40 resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Voice powered by Sarvam AI · Replies powered by Groq
          </p>
        </div>
      </div>
    </div>
  );
}