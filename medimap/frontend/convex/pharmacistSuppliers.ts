import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSuppliers = query({
  args: { pharmacistId: v.string() },
  handler: async (ctx, args) => {
    const pId = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!pId) return [];

    return await ctx.db
      .query("suppliers")
      .filter((q) => q.eq(q.field("pharmacistId"), pId))
      .collect();
  },
});

export const addSupplier = mutation({
  args: {
    pharmacistId: v.string(),
    name: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    gstin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pId = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!pId) throw new Error("Invalid pharmacist ID");

    const id = await ctx.db.insert("suppliers", {
      pharmacistId: pId,
      name: args.name,
      contactPerson: args.contactPerson,
      phone: args.phone,
      email: args.email,
      address: args.address,
      gstin: args.gstin,
      orders: [],
      createdAt: new Date().toISOString(),
    });
    
    return { success: true, supplierId: id };
  },
});
