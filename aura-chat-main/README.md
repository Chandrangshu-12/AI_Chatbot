# Sarvam Chat

A voice-powered AI chat app built with TanStack Start (React 19), Groq (chat), and Sarvam AI
(speech-to-text / text-to-speech).

This version has no backend/database. Login and chat history are stored entirely in the
browser's `localStorage`. There's no Supabase, no Lovable, nothing to configure beyond two API
keys.

> **Not secure, by design.** Accounts and passwords are stored in plain text in the browser.
> Anyone with access to devtools on that browser can read them. This is meant for local/personal
> use or a demo, not for real users or sensitive data. See `src/lib/local-auth.ts` for details.
>
> Data is also per-browser: signing in on a different browser or device, or clearing site data,
> starts you over with no accounts and no chat history.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy the template and fill in your own keys:

```bash
cp .env.example .env
```

| Variable | Where to get it | Required for |
|---|---|---|
| `GROQ_API_KEY` | https://console.groq.com/keys (free) | Chat replies |
| `SARVAM_API_KEY` | https://dashboard.sarvam.ai | Voice input/output |

The app will still load and let you sign in without these, but sending a chat message or using
the mic will fail until they're set.

## 3. Run it

```bash
npm run dev
```

Open the printed local URL (defaults to `http://localhost:8080`).

## 4. Using it

- Click **Sign up**, enter any email + a password (6+ characters) — this creates a local
  account instantly, no email confirmation needed.
- You're immediately signed in and taken to the chat.
- **Sign in** next time with the same email/password.
- Chat threads and messages persist in `localStorage` as long as you don't clear browser data.

## 5. Build & deploy

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

The build outputs to `.output/`, targeting Nitro's `node-server` preset — runs on any plain Node
host (VM, container, most PaaS providers): `node .output/server/index.mjs`.

To target a different platform (Cloudflare, Vercel, Netlify, etc.), change the preset in
`vite.config.ts`:

```ts
nitro({ preset: "node-server" }) // swap for e.g. "cloudflare-module"
```

See the [Nitro presets list](https://nitro.build/deploy) for all supported targets. Note: only
the `GROQ_API_KEY` / `SARVAM_API_KEY` server routes need a Node-capable runtime — auth and chat
storage are pure client-side and work anywhere static assets are served.

## Project structure

- `src/routes/` — TanStack Start file-based routes (pages + API routes under `routes/api/`)
- `src/lib/local-auth.ts` — browser-only "auth" (localStorage, no server)
- `src/lib/local-chat-store.ts` — browser-only chat thread/message storage (localStorage)
- `src/routes/api/chat.ts` — server route that calls Groq for chat replies
- `src/routes/api/stt.ts`, `tts.ts` — server routes that call Sarvam AI for voice
- `src/components/ui/` — shadcn/ui components

## Upgrading to real accounts / persistence later

If you outgrow the local-only setup, swap `src/lib/local-auth.ts` and
`src/lib/local-chat-store.ts` for calls to a real backend (Supabase, your own API, etc.) —
they're the only two files anything else in the app depends on for auth/storage.
