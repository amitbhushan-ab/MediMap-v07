import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBills = query({
  args: { pharmacistId: v.string() },
  handler: async (ctx, args) => {
    const pId = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!pId) return { bills: [] };

    const bills = await ctx.db
      .query("bills")
      .filter((q) => q.eq(q.field("pharmacistId"), pId))
      .order("desc")
      .collect();

    return { bills };
  },
});

export const createBill = mutation({
  args: {
    pharmacistId: v.string(),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    items: v.array(
      v.object({
        medicineName: v.string(),
        quantity: v.number(),
        price: v.number(),
        total: v.number(),
        stockId: v.optional(v.string())
      })
    ),
    subtotal: v.number(),
    discount: v.number(),
    grandTotal: v.number(),
    paymentMode: v.string(),
    couponCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pId = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!pId) throw new Error("Invalid pharmacist ID");

    // Decrement stock for each item
    for (const item of args.items) {
      if (item.stockId) {
        const stockId = ctx.db.normalizeId("prices", item.stockId);
        if (stockId) {
          const stockDoc = await ctx.db.get(stockId);
          if (stockDoc && stockDoc.units !== undefined) {
            const newUnits = Math.max(0, stockDoc.units - item.quantity);
            await ctx.db.patch(stockId, {
              units: newUnits,
              inStock: newUnits > 0
            });
          }
        }
      }
    }

    const id = await ctx.db.insert("bills", {
      pharmacistId: pId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      customerAddress: args.customerAddress,
      items: args.items,
      subtotal: args.subtotal,
      discount: args.discount,
      grandTotal: args.grandTotal,
      paymentMode: args.paymentMode,
      couponCode: args.couponCode,
      createdAt: new Date().toISOString(),
    });
    
    return { success: true, billId: id };
  },
});

export const deleteBill = mutation({
  args: { billId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("bills", args.billId);
    if (id) await ctx.db.delete(id);
    return { success: true };
  }
});
