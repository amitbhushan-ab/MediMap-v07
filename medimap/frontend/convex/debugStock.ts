import { query } from "./_generated/server";
export const checkDB = query(async (ctx) => {
  const pharmacists = await ctx.db.query("pharmacists").collect();
  const prices = await ctx.db.query("prices").collect();
  return { 
    pharmacists: pharmacists.map(p => ({ id: p._id, email: p.email, name: p.name })),
    totalStock: prices.length,
    firstStock: prices[0],
  };
});
