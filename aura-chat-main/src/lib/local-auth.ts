// Simple browser-only "auth" — no server, no database.
//
// IMPORTANT: this is NOT secure. Accounts and passwords are stored in plain
// text in the browser's localStorage. Anyone with access to this browser (or
// its devtools) can read every stored password. This exists purely so the
// app has a working login screen without needing a backend. Don't use real
// passwords, and don't ship this as-is if real users/data are involved.

export type LocalUser = { id: string; email: string };

const SESSION_KEY = "local_auth_session";
const EVENT_NAME = "local-auth-change";

function emit() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export async function signUp(email: string, password: string): Promise<LocalUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to sign up");
  }
  const session = (await res.json()) as LocalUser;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emit();
  return session;
}

export async function signInWithPassword(email: string, password: string): Promise<LocalUser> {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to sign in");
  }
  const session = (await res.json()) as LocalUser;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emit();
  return session;
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
  emit();
}

/** Subscribe to sign-in/sign-out events (same tab + other tabs). Returns an unsubscribe function. */
export function onAuthStateChange(callback: (user: LocalUser | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback(getUser());
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
