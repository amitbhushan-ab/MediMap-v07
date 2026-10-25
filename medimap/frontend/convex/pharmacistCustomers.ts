import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCustomers = query({
  args: { pharmacistId: v.string() },
  handler: async (ctx, args) => {
    const pId = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!pId) return [];

    return await ctx.db
      .query("customers")
      .filter((q) => q.eq(q.field("pharmacistId"), pId))
      .collect();
  },
});

export const addCustomer = mutation({
  args: {
    pharmacistId: v.string(),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    age: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pId = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!pId) throw new Error("Invalid pharmacist ID");

    const id = await ctx.db.insert("customers", {
      pharmacistId: pId,
      name: args.name,
      phone: args.phone,
      email: args.email,
      address: args.address,
      age: args.age,
      notes: args.notes,
      medicines: [],
      createdAt: new Date().toISOString(),
    });
    
    return { success: true, customerId: id };
  },
});

export const deleteCustomer = mutation({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("customers", args.customerId);
    if (id) await ctx.db.delete(id);
    return { success: true };
  }
});

export const updateMedicines = mutation({
  args: { customerId: v.string(), medicines: v.any() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("customers", args.customerId);
    if (id) await ctx.db.patch(id, { medicines: args.medicines });
    return { success: true };
  }
});
