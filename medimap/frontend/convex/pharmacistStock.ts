import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getStock = query({
  args: { pharmacistId: v.string() },
  handler: async (ctx, args) => {
    const pId = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!pId) return { stock: [] };
    
    const stock = await ctx.db
      .query("prices")
      .filter((q) => q.eq(q.field("pharmacistId"), pId))
      .collect();
      
    // Calculate stats
    const totalItems = stock.length;
    const lowStock = stock.filter(s => (s.units || 0) <= (s.minStock || 10) && (s.units || 0) > 0);
    const outOfStock = stock.filter(s => (s.units || 0) === 0);
    const totalValue = stock.reduce((sum, s) => sum + ((s.sellingPrice || s.price || 0) * (s.units || 0)), 0);
    
    return { stock, totalItems, lowStock, outOfStock, totalValue };
  },
});

export const addStock = mutation({
  args: {
    pharmacistId: v.string(),
    medicineName: v.string(),
    genericName: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    batchNo: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    category: v.optional(v.string()),
    gstRate: v.number(),
    purchasePrice: v.number(),
    sellingPrice: v.number(),
    units: v.number(),
    minStock: v.number(),
    supplierId: v.optional(v.string()),
    supplierName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pId = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!pId) throw new Error("Invalid pharmacist ID");

    // Also look up a medicineId if we can find one matching the name
    const medicines = await ctx.db
      .query("medicines")
      .filter(q => q.eq(q.field("name"), args.medicineName))
      .collect();
      
    const medicineId = medicines.length > 0 ? medicines[0]._id : undefined;
    
    return await ctx.db.insert("prices", {
      pharmacistId: pId,
      medicineId: medicineId,
      medicineName: args.medicineName,
      genericName: args.genericName,
      manufacturer: args.manufacturer,
      batchNo: args.batchNo,
      expiryDate: args.expiryDate,
      category: args.category,
      gstRate: args.gstRate,
      purchasePrice: args.purchasePrice,
      sellingPrice: args.sellingPrice,
      price: args.sellingPrice, // Map sellingPrice to price
      units: args.units,
      minStock: args.minStock,
      supplierId: args.supplierId,
      supplierName: args.supplierName,
      inStock: args.units > 0,
      lastUpdated: new Date().toISOString(),
    });
  },
});

export const updateStock = mutation({
  args: {
    id: v.id("prices"),
    pharmacistId: v.string(),
    medicineName: v.string(),
    genericName: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    batchNo: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    category: v.optional(v.string()),
    gstRate: v.number(),
    purchasePrice: v.number(),
    sellingPrice: v.number(),
    units: v.number(),
    minStock: v.number(),
    supplierId: v.optional(v.string()),
    supplierName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      medicineName: args.medicineName,
      genericName: args.genericName,
      manufacturer: args.manufacturer,
      batchNo: args.batchNo,
      expiryDate: args.expiryDate,
      category: args.category,
      gstRate: args.gstRate,
      purchasePrice: args.purchasePrice,
      sellingPrice: args.sellingPrice,
      price: args.sellingPrice,
      units: args.units,
      minStock: args.minStock,
      supplierId: args.supplierId,
      supplierName: args.supplierName,
      inStock: args.units > 0,
      lastUpdated: new Date().toISOString(),
    });
  },
});

export const deleteStock = mutation({
  args: { id: v.id("prices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const debugDB = query({
  args: {},
  handler: async (ctx) => {
    const pharmacists = await ctx.db.query("pharmacists").collect();
    const prices = await ctx.db.query("prices").collect();
    return { pharmacists, pricesCount: prices.length };
  }
});
