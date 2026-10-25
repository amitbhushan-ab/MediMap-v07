import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()), // Ensure this is hashed before calling if not using Auth provider
    role: v.string(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emailNorm = args.email.toLowerCase().trim();
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), emailNorm))
      .collect();
    if (existing.length > 0) throw new Error("Email already registered");

    const newUserId = await ctx.db.insert("users", {
      name: args.name,
      email: emailNorm,
      password: args.password,
      role: args.role,
      age: args.age,
      gender: args.gender,
      createdAt: new Date().toISOString(),
    });
    
    return { token: newUserId, user: { _id: newUserId, name: args.name, email: emailNorm, role: args.role, age: args.age, gender: args.gender } };
  },
});

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const emailNorm = args.email.toLowerCase().trim();
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), emailNorm))
      .collect();
    
    if (users.length === 0) throw new Error("Invalid credentials");
    
    const user = users[0];
    if (user.password !== args.password) throw new Error("Invalid credentials");
    
    return {
      token: user._id,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    };
  },
});

