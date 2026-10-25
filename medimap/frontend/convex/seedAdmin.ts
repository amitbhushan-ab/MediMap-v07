import { mutation } from "./_generated/server";

export const seedAllAdminData = mutation({
  args: {},
  handler: async (ctx) => {
    let pharmacists = await ctx.db.query("pharmacists").collect();
    if (pharmacists.length === 0) return "Please run seedAll:seedEverything first.";

    let users = await ctx.db.query("users").collect();
    if (users.length === 0) {
      const user1 = await ctx.db.insert("users", { name: "Ankit Sharma", email: "ankit@example.com", password: "password", role: "patient", medipoints: 50, createdAt: new Date().toISOString() });
      const user2 = await ctx.db.insert("users", { name: "Priya Das", email: "priya@example.com", password: "password", role: "patient", medipoints: 120, createdAt: new Date().toISOString() });
      users = [await ctx.db.get(user1), await ctx.db.get(user2)] as any;
    }

    // Set some pharmacists to be listed/premium
    for (let i = 0; i < pharmacists.length; i++) {
      const p = pharmacists[i];
      await ctx.db.patch(p._id, {
        isListed: true,
        isPremium: i % 3 === 0,
        isSuspended: false,
      });
    }

    // Insert mock submissions
    const mockSubmissions = [
      {
        medicineName: "Augmentin 625 Duo Tablet",
        price: 201.50,
        pharmacyId: pharmacists[0]._id,
        status: "pending",
        submittedBy: { userId: users[0]._id, userName: users[0].name },
        personalNote: "I found this price at their shop today.",
        createdAt: new Date().toISOString(),
      },
      {
        medicineName: "Dolo 650 Tablet",
        price: 30,
        pharmacyNameSnapshot: "New Life Medicos",
        isNewPharmacy: true,
        newPharmacyData: { name: "New Life Medicos", address: "Sector 14, Gurgaon" },
        status: "pending",
        submittedBy: { userId: users[1]._id, userName: users[1].name },
        billImage: { url: "https://via.placeholder.com/300?text=Mock+Bill" },
        createdAt: new Date().toISOString(),
      },
      {
        medicineName: "Shelcal 500 Tablet",
        price: 110,
        pharmacyId: pharmacists[1]._id,
        status: "approved",
        submittedBy: { userId: users[0]._id, userName: users[0].name },
        createdAt: new Date().toISOString(),
      }
    ];

    for (const sub of mockSubmissions) {
      await ctx.db.insert("submissions", sub);
    }

    // Insert mock admin message
    await ctx.db.insert("adminMessages", {
      type: "broadcast",
      target: "all_pharmacists",
      message: "System maintenance scheduled for midnight.",
      createdAt: new Date().toISOString(),
    });

    return `Admin mock data seeded!`;
  }
});
