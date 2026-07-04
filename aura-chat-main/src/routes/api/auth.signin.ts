import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "@/server/db";
import { UserModel } from "@/server/models";
import bcrypt from "bcryptjs";

export const Route = createFileRoute("/api/auth/signin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await connectToDatabase();
          const { email, password } = await request.json();

          if (!email || !password) {
            return new Response("Email and password are required", { status: 400 });
          }

          const user = await UserModel.findOne({ email: email.toLowerCase() });
          if (!user) {
            return new Response("Invalid login credentials", { status: 400 });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return new Response("Invalid login credentials", { status: 400 });
          }

          return Response.json({
            id: user._id.toString(),
            email: user.email,
          });
        } catch (error: any) {
          console.error("Signin error:", error);
          return new Response(error.message || "Failed to sign in", { status: 500 });
        }
      },
    },
  },
});
