import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import * as localAuth from "@/lib/local-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = localAuth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => <Outlet />,
});
