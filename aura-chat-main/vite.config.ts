import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Standalone Vite config for TanStack Start.
// Works with a plain `npm run dev` / `npm run build` / `npm run preview`,
// and deploys anywhere Nitro's "node-server" preset runs (any Node host, a VM, Docker, etc).
export default defineConfig(({ mode, command }) => {
  // Expose VITE_-prefixed env vars to import.meta.env (matches Vite's own default
  // behavior; kept explicit here since some code also reads process.env directly for SSR).
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define: envDefine,
    resolve: {
      alias: {
        "@": `${process.cwd()}/src`,
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    server: {
      host: true,
      port: 8080,
    },
    preview: {
      host: true,
      port: 8080,
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      viteReact(),
      // Only needed at build time — produces the deployable server output.
      // "node-server" runs anywhere Node runs (VM, Docker, most PaaS hosts).
      // Swap the preset if you're deploying to Cloudflare/Vercel/Netlify/etc.
      ...(command === "build" ? [nitro({ preset: "node-server" })] : []),
    ],
  };
});
