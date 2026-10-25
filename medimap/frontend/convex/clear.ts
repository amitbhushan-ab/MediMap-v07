import { mutation } from "./_generated/server";

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear Medicines
    const meds = await ctx.db.query("medicines").collect();
    for (const m of meds) {
      await ctx.db.delete(m._id);
    }
    
    // Clear Pharmacists
    const pharms = await ctx.db.query("pharmacists").collect();
    for (const p of pharms) {
      await ctx.db.delete(p._id);
    }

    // Clear Prices
    const prices = await ctx.db.query("prices").collect();
    for (const p of prices) {
      await ctx.db.delete(p._id);
    }

    return "Cleared database!";
  },
});
