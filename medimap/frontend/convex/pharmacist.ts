import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBills = query({
  args: { pharmacistId: v.id("pharmacists") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bills")
      .filter((q) => q.eq(q.field("pharmacistId"), args.pharmacistId))
      .collect();
  },
});

export const addBill = mutation({
  args: {
    pharmacistId: v.id("pharmacists"),
    patientName: v.optional(v.string()),
    items: v.array(
      v.object({
        medicineName: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    totalAmount: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const newBillId = await ctx.db.insert("bills", {
      pharmacistId: args.pharmacistId,
      patientName: args.patientName,
      items: args.items,
      totalAmount: args.totalAmount,
      date: args.date,
    });
    return newBillId;
  },
});
