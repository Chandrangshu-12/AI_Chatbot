import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: () => (
    <div className="flex-1 grid place-items-center text-center p-6">
      <div>
        <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Select a chat or create a new one to get started.</p>
      </div>
    </div>
  ),
});