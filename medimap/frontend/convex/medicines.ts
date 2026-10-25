import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const allMedicines = await ctx.db.query("medicines").collect();
    if (!args.query) return [];
    
    // 1. Find matching medicine
    let matchingMed = allMedicines.find((med) => 
      med.name.toLowerCase().includes(args.query.toLowerCase()) || 
      args.query.toLowerCase().includes(med.name.toLowerCase().split(' ')[0])
    );
    
    // 2. Find all prices for this medicine
    let prices = [];
    if (matchingMed) {
      prices = await ctx.db
        .query("prices")
        .filter((q) => q.eq(q.field("medicineId"), matchingMed._id))
        .collect();
    }

    // 3. Join with pharmacies
    let results = [];
    let minPrice = Infinity;

    for (const price of prices) {
      const pharmacy = await ctx.db.get(price.pharmacistId);
      if (pharmacy) {
        if (price.inStock && price.price < minPrice) minPrice = price.price;
        
        results.push({
          _id: price._id,
          pharmacy: pharmacy,
          medicine: matchingMed,
          price: price.price,
          inStock: price.inStock,
          isCheapest: false,
        });
      }
    }

    // MOCK FALLBACK for Demo
    if (results.length === 0) {
      const pharmacies = await ctx.db.query("pharmacists").collect();
      const nearbyPharmacies = pharmacies.slice(0, 4);
      
      matchingMed = {
        _id: "mock_med_id",
        name: args.query.charAt(0).toUpperCase() + args.query.slice(1) + " (Scanned)",
        genericName: "Generic Equivalent",
        category: "General",
        dosage: "Standard",
        manufacturer: "Various",
        requiresPrescription: false
      };

      nearbyPharmacies.forEach((pharmacy, idx) => {
        const mockPrice = 15 + Math.floor(Math.random() * 50);
        const inStock = idx !== 2;
        if (inStock && mockPrice < minPrice) minPrice = mockPrice;
        
        results.push({
          _id: "mock_price_" + idx,
          pharmacy: pharmacy,
          medicine: matchingMed,
          price: mockPrice,
          inStock: inStock,
          isCheapest: false,
        });
      });
    }

    // 4. Mark cheapest
    return results.map(r => ({
      ...r,
      isCheapest: r.price === minPrice && r.inStock
    }));
  },
});

export const getMedicines = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("medicines").collect();
  },
});

export const addMedicine = mutation({
  args: {
    name: v.string(),
    genericName: v.string(),
    category: v.string(),
    manufacturer: v.string(),
    dosage: v.string(),
    requiresPrescription: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("medicines", {
      ...args,
    });
  },
});
