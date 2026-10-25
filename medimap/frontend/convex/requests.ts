import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getRequests = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let requestsQuery = ctx.db.query("priceRequests");
    
    if (args.status) {
      requestsQuery = requestsQuery.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    return await requestsQuery.collect();
  },
});

export const createRequest = mutation({
  args: {
    patientId: v.optional(v.string()),
    medicineName: v.string(),
    quantity: v.number(),
    prescriptionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newRequestId = await ctx.db.insert("priceRequests", {
      patientId: args.patientId,
      medicineName: args.medicineName,
      quantity: args.quantity,
      prescriptionUrl: args.prescriptionUrl,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return newRequestId;
  },
});
