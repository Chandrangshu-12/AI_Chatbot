import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "@/server/db";
import { MessageModel, ThreadModel } from "@/server/models";

export const Route = createFileRoute("/api/messages")({
  server: {
    handlers: {
      // GET /api/messages?threadId=...
      GET: async ({ request }) => {
        try {
          await connectToDatabase();
          const url = new URL(request.url);
          const threadId = url.searchParams.get("threadId");
          if (!threadId) {
            return new Response("Missing threadId", { status: 400 });
          }

          const messages = await MessageModel.find({ threadId }).sort({ createdAt: 1 });
          const mappedMessages = messages.map((m) => ({
            id: m._id,
            thread_id: m.threadId,
            role: m.role,
            content: m.content,
            created_at: m.createdAt.toISOString(),
          }));

          return Response.json(mappedMessages);
        } catch (error: any) {
          console.error("List messages error:", error);
          return new Response(error.message || "Failed to list messages", { status: 500 });
        }
      },

      // POST /api/messages
      POST: async ({ request }) => {
        try {
          await connectToDatabase();
          const { id, threadId, role, content } = await request.json();
          if (!id || !threadId || !role || !content) {
            return new Response("Missing required fields", { status: 400 });
          }

          const message = await MessageModel.create({
            _id: id,
            threadId,
            role,
            content,
            createdAt: new Date(),
          });

          // Update the parent thread's updatedAt field
          await ThreadModel.findByIdAndUpdate(threadId, {
            $set: { updatedAt: new Date() },
          });

          return Response.json({
            id: message._id,
            thread_id: message.threadId,
            role: message.role,
            content: message.content,
            created_at: message.createdAt.toISOString(),
          });
        } catch (error: any) {
          console.error("Create message error:", error);
          return new Response(error.message || "Failed to create message", { status: 500 });
        }
      },
    },
  },
});
