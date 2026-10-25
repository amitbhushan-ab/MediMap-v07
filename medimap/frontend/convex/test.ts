import { query } from "./_generated/server";
import { v } from "convex/values";

export const testSearch = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const allMedicines = await ctx.db.query("medicines").collect();
    const matchingMed = allMedicines.find((med) => 
      med.name.toLowerCase().includes(args.query.toLowerCase())
    );
    if (!matchingMed) return [];

    const prices = await ctx.db
      .query("prices")
      .filter((q) => q.eq(q.field("medicineId"), matchingMed._id))
      .collect();

    const results = [];
    for (const price of prices.slice(0, 1)) {
      const pharmacy = await ctx.db.get(price.pharmacistId);
      results.push({
        _id: price._id,
        pharmacy: pharmacy,
      });
    }
    return results;
  },
});

export const debugState = query({
  args: {},
  handler: async (ctx) => {
    const pharmacists = await ctx.db.query("pharmacists").collect();
    const prices = await ctx.db.query("prices").collect();
    
    return pharmacists.map(p => ({
      id: p._id,
      email: p.email,
      name: p.name,
      pricesCount: prices.filter(pr => pr.pharmacistId === p._id).length
    }));
  }
});
