import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "@/server/db";
import { UserModel } from "@/server/models";
import bcrypt from "bcryptjs";

export const Route = createFileRoute("/api/auth/signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await connectToDatabase();
          const { email, password } = await request.json();

          if (!email || !password) {
            return new Response("Email and password are required", { status: 400 });
          }

          if (password.length < 6) {
            return new Response("Password must be at least 6 characters", { status: 400 });
          }

          const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
          if (existingUser) {
            return new Response("An account with this email already exists.", { status: 400 });
          }

          const hashedPassword = await bcrypt.hash(password, 10);
          const user = await UserModel.create({
            email: email.toLowerCase(),
            password: hashedPassword,
          });

          return Response.json({
            id: user._id.toString(),
            email: user.email,
          });
        } catch (error: any) {
          console.error("Signup error:", error);
          return new Response(error.message || "Failed to sign up", { status: 500 });
        }
      },
    },
  },
});
