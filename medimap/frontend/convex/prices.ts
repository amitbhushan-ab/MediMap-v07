import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPrices = query({
  args: { medicineId: v.optional(v.id("medicines")) },
  handler: async (ctx, args) => {
    let pricesQuery = ctx.db.query("prices");
    
    if (args.medicineId) {
      pricesQuery = pricesQuery.filter((q) => q.eq(q.field("medicineId"), args.medicineId));
    }
    
    return await pricesQuery.collect();
  },
});

export const submitPrice = mutation({
  args: {
    medicineId: v.id("medicines"),
    pharmacistId: v.id("pharmacists"),
    price: v.number(),
    inStock: v.boolean(),
  },
  handler: async (ctx, args) => {
    const newPriceId = await ctx.db.insert("prices", {
      medicineId: args.medicineId,
      pharmacistId: args.pharmacistId,
      price: args.price,
      inStock: args.inStock,
      lastUpdated: new Date().toISOString(),
    });
    return newPriceId;
  },
});
