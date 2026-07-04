// Browser-only chat storage — no database, no server persistence.
// Threads and messages live in localStorage, scoped per user id.
// Clearing browser data (or using a different browser/device) loses history.

export type Thread = { id: string; title: string; updated_at: string };
export type Message = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export async function listThreads(userId: string): Promise<Thread[]> {
  const res = await fetch(`/api/threads?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to list threads");
  }
  return res.json();
}

export async function createThread(userId: string, title = "New chat"): Promise<Thread> {
  const threadId = crypto.randomUUID();
  const res = await fetch("/api/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: threadId, userId, title }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create thread");
  }
  return res.json();
}

export async function updateThreadTitle(id: string, title: string): Promise<void> {
  const res = await fetch("/api/threads", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, title }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update thread title");
  }
}

export async function touchThread(id: string): Promise<void> {
  const res = await fetch("/api/threads", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, touch: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to touch thread");
  }
}

export async function deleteThread(id: string): Promise<void> {
  const res = await fetch(`/api/threads?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to delete thread");
  }
}

export async function listMessages(threadId: string): Promise<Message[]> {
  const res = await fetch(`/api/messages?threadId=${encodeURIComponent(threadId)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to list messages");
  }
  return res.json();
}

export async function addMessage(
  threadId: string,
  role: Message["role"],
  content: string,
): Promise<Message> {
  const messageId = crypto.randomUUID();
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: messageId, threadId, role, content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to add message");
  }
  return res.json();
}
