import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const emailNorm = args.email.toLowerCase().trim();
    const pharmacists = await ctx.db
      .query("pharmacists")
      .filter((q) => q.eq(q.field("email"), emailNorm))
      .collect();
    
    if (pharmacists.length === 0) {
      throw new Error("Invalid credentials");
    }
    
    const pharmacist = pharmacists[0];
    if (pharmacist.password !== args.password) {
      throw new Error("Invalid credentials");
    }
    
    return {
      token: pharmacist._id, // Using ID as token for this mock setup
      pharmacist: {
        _id: pharmacist._id,
        name: pharmacist.name,
        pharmacyName: pharmacist.pharmacyName,
        email: pharmacist.email,
        isPremium: true // mock premium for demo
      }
    };
  },
});

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    phone: v.string(),
    address: v.string(),
    gstin: v.optional(v.string()),
    licenseNo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emailNorm = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("pharmacists")
      .filter((q) => q.eq(q.field("email"), emailNorm))
      .collect();
      
    if (existing.length > 0) throw new Error("Email already registered");
    
    const id = await ctx.db.insert("pharmacists", {
      name: args.name,
      email: emailNorm,
      password: args.password,
      contact: args.phone,
      pharmacyName: args.name,
      address: args.address,
      licenseNumber: args.licenseNo || "pending",
      status: "approved",
      location: { lat: 28.4089, lng: 77.3178 }, // Mock location
      createdAt: new Date().toISOString(),
    });
    
      return {
      token: id,
      pharmacist: { _id: id, name: args.name, pharmacyName: args.name, email: emailNorm, isPremium: true }
    };
  },
});

export const updateProfile = mutation({
  args: {
    pharmacistId: v.string(),
    name: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    isOpen: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("pharmacists", args.pharmacistId);
    if (!id) throw new Error("Invalid pharmacist ID");
    
    await ctx.db.patch(id, {
      name: args.name,
      ownerName: args.ownerName,
      contact: args.phone,
      address: args.address,
      isOpen: args.isOpen,
    });
    
    const updated = await ctx.db.get(id);
    return {
      pharmacist: {
        _id: updated._id,
        name: updated.name,
        pharmacyName: updated.pharmacyName,
        email: updated.email,
        phone: updated.contact,
        address: updated.address,
        ownerName: updated.ownerName,
        isOpen: updated.isOpen,
        isPremium: true
      }
    };
  }
});
