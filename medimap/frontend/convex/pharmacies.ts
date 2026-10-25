import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPharmacies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pharmacists").collect();
  },
});

export const getPharmacyById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    try {
      const normalizedId = ctx.db.normalizeId("pharmacists", args.id);
      if (!normalizedId) return null;
      return await ctx.db.get(normalizedId);
    } catch (e) {
      return null;
    }
  },
});
