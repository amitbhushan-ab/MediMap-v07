import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ════════ STATS ════════
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const submissions = await ctx.db.query("submissions").filter(q => q.eq(q.field("status"), "pending")).collect();
    const pharmacists = await ctx.db.query("pharmacists").filter(q => q.eq(q.field("isListed"), true)).collect();
    const premiumPharmacists = await ctx.db.query("pharmacists").filter(q => q.eq(q.field("isPremium"), true)).collect();
    const newPharmacy = submissions.filter(s => s.isNewPharmacy).length;

    return {
      pending: submissions.length,
      pharmacists: pharmacists.length,
      premiumPharmacists: premiumPharmacists.length,
      newPharmacy,
    };
  }
});

// ════════ SUBMISSIONS ════════
export const getSubmissions = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    let q = ctx.db.query("submissions");
    if (args.status === "pending") {
      q = q.filter(q => q.eq(q.field("status"), "pending"));
    }
    const submissions = await q.collect();
    
    // Attach display details for pharmacists
    const enriched = await Promise.all(submissions.map(async (sub) => {
      let displayPharmacy = null;
      if (sub.pharmacyId) {
        displayPharmacy = await ctx.db.get(sub.pharmacyId);
      }
      return { ...sub, _id: sub._id, displayPharmacy };
    }));
    
    return enriched;
  }
});

export const updateSubmission = mutation({
  args: { id: v.id("submissions"), action: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error("Submission not found");

    if (args.action === "approve") {
      await ctx.db.patch(args.id, { status: "approved" });
      
      // Optionally award points to user
      if (sub.submittedBy?.userId) {
        const user = await ctx.db.get(sub.submittedBy.userId);
        if (user) {
          await ctx.db.patch(sub.submittedBy.userId, { medipoints: (user.medipoints || 0) + 20 });
        }
      }
    } else {
      await ctx.db.patch(args.id, { status: "rejected" });
    }
    return { success: true };
  }
});

// ════════ PHARMACISTS ════════
export const getPharmacists = query({
  args: { search: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let pharmacists = await ctx.db.query("pharmacists").collect();
    
    if (args.search) {
      const s = args.search.toLowerCase();
      pharmacists = pharmacists.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.pharmacyName.toLowerCase().includes(s) ||
        p.contact.includes(s)
      );
    }
    
    if (args.status === "listed") {
      pharmacists = pharmacists.filter(p => p.isListed);
    } else if (args.status === "suspended") {
      pharmacists = pharmacists.filter(p => p.isSuspended);
    } else if (args.status === "premium") {
      pharmacists = pharmacists.filter(p => p.isPremium);
    }
    
    return pharmacists;
  }
});

export const updatePharmacist = mutation({
  args: { 
    id: v.id("pharmacists"), 
    isListed: v.optional(v.boolean()),
    isSuspended: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  }
});

// ════════ USERS ════════
export const getUsers = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("users").collect();
    if (args.search) {
      const s = args.search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(s) || 
        u.email.toLowerCase().includes(s)
      );
    }
    return users;
  }
});

export const updateUser = mutation({
  args: { id: v.id("users"), medipoints: v.optional(v.number()), password: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  }
});

// ════════ MESSAGES & BROADCASTS ════════
export const getAdminMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("adminMessages").order("desc").collect();
  }
});

export const sendMessageToPharmacist = mutation({
  args: { pharmacistId: v.id("pharmacists"), message: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("adminMessages", {
      type: "direct",
      pharmacistId: args.pharmacistId,
      message: args.message,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  }
});

export const broadcastMessage = mutation({
  args: { 
    target: v.string(), 
    message: v.string(), 
    title: v.optional(v.string()),
    type: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("adminMessages", {
      type: args.type || "info",
      target: args.target,
      title: args.title,
      message: args.message,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  }
});

// ════════ COUPONS ════════
export const getCoupons = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("coupons").collect();
  }
});

export const createCoupon = mutation({
  args: {
    code: v.string(),
    discount: v.string(),
    validDays: v.string(),
    forAnyUser: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const expiresAt = new Date(Date.now() + parseInt(args.validDays) * 86400000).toISOString();
    
    await ctx.db.insert("coupons", {
      code: args.code,
      discount: args.discount,
      validDays: args.validDays,
      forAnyUser: args.forAnyUser,
      isAdminCoupon: true,
      expiresAt: expiresAt,
      createdAt: new Date().toISOString()
    });
    return { success: true, code: args.code };
  }
});

export const deleteCoupon = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  }
});
