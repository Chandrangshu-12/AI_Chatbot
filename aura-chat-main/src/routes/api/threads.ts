import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "@/server/db";
import { ThreadModel, MessageModel } from "@/server/models";

export const Route = createFileRoute("/api/threads")({
  server: {
    handlers: {
      // GET /api/threads?userId=...
      GET: async ({ request }) => {
        try {
          await connectToDatabase();
          const url = new URL(request.url);
          const userId = url.searchParams.get("userId");
          if (!userId) {
            return new Response("Missing userId", { status: 400 });
          }

          const threads = await ThreadModel.find({ userId }).sort({ updatedAt: -1 });
          const mappedThreads = threads.map((t) => ({
            id: t._id,
            title: t.title,
            updated_at: t.updatedAt.toISOString(),
          }));

          return Response.json(mappedThreads);
        } catch (error: any) {
          console.error("List threads error:", error);
          return new Response(error.message || "Failed to list threads", { status: 500 });
        }
      },

      // POST /api/threads
      POST: async ({ request }) => {
        try {
          await connectToDatabase();
          const { id, userId, title } = await request.json();
          if (!id || !userId) {
            return new Response("Missing id or userId", { status: 400 });
          }

          const thread = await ThreadModel.create({
            _id: id,
            userId,
            title: title || "New chat",
            updatedAt: new Date(),
          });

          return Response.json({
            id: thread._id,
            title: thread.title,
            updated_at: thread.updatedAt.toISOString(),
          });
        } catch (error: any) {
          console.error("Create thread error:", error);
          return new Response(error.message || "Failed to create thread", { status: 500 });
        }
      },

      // PATCH /api/threads (Update title or updatedAt)
      PATCH: async ({ request }) => {
        try {
          await connectToDatabase();
          const { id, title, touch } = await request.json();
          if (!id) {
            return new Response("Missing id", { status: 400 });
          }

          const updateData: any = {};
          if (title !== undefined) updateData.title = title;
          if (touch) updateData.updatedAt = new Date();

          const thread = await ThreadModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
          );

          if (!thread) {
            return new Response("Thread not found", { status: 404 });
          }

          return Response.json({
            id: thread._id,
            title: thread.title,
            updated_at: thread.updatedAt.toISOString(),
          });
        } catch (error: any) {
          console.error("Update thread error:", error);
          return new Response(error.message || "Failed to update thread", { status: 500 });
        }
      },

      // DELETE /api/threads?id=...
      DELETE: async ({ request }) => {
        try {
          await connectToDatabase();
          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) {
            return new Response("Missing id", { status: 400 });
          }

          await ThreadModel.deleteOne({ _id: id });
          await MessageModel.deleteMany({ threadId: id });

          return Response.json({ success: true });
        } catch (error: any) {
          console.error("Delete thread error:", error);
          return new Response(error.message || "Failed to delete thread", { status: 500 });
        }
      },
    },
  },
});
