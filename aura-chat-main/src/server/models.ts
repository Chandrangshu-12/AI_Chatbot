import mongoose, { Schema } from "mongoose";

// User Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

// Thread Schema - using string _id for UUIDs
const ThreadSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  title: { type: String, default: "New chat" },
  updatedAt: { type: Date, default: Date.now },
});

export const ThreadModel = mongoose.models.Thread || mongoose.model("Thread", ThreadSchema);

// Message Schema - using string _id for UUIDs
const MessageSchema = new Schema({
  _id: { type: String, required: true },
  threadId: { type: String, required: true },
  role: { type: String, required: true, enum: ["user", "assistant", "system"] },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const MessageModel = mongoose.models.Message || mongoose.model("Message", MessageSchema);
