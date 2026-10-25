import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()), // Hashed password
    role: v.string(), // e.g., 'patient', 'admin'
    medipoints: v.optional(v.number()),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  }),

  pharmacists: defineTable({
    name: v.string(),
    contact: v.string(),
    email: v.optional(v.string()),
    password: v.string(),
    pharmacyName: v.string(),
    address: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    licenseNumber: v.string(),
    status: v.string(), // e.g., 'approved', 'pending'
    isListed: v.optional(v.boolean()),
    isSuspended: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    isOpen: v.optional(v.boolean()),
    createdAt: v.optional(v.string()),
  }),

  medicines: defineTable({
    name: v.string(),
    brand: v.optional(v.string()),
    genericName: v.optional(v.string()),
    category: v.optional(v.string()),
    requiresPrescription: v.optional(v.boolean()),
    manufacturer: v.optional(v.string()),
    dosage: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  }),

  prices: defineTable({
    medicineId: v.optional(v.id("medicines")), // Optional for manually added stock
    pharmacistId: v.id("pharmacists"),
    price: v.number(), // Same as sellingPrice
    inStock: v.boolean(),
    lastUpdated: v.optional(v.string()),
    
    // Pharmacist Dashboard Stock fields
    medicineName: v.optional(v.string()),
    genericName: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    batchNo: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    category: v.optional(v.string()),
    gstRate: v.optional(v.number()),
    purchasePrice: v.optional(v.number()),
    sellingPrice: v.optional(v.number()), // Mirrors price
    units: v.optional(v.number()),
    minStock: v.optional(v.number()),
    supplierId: v.optional(v.string()),
    supplierName: v.optional(v.string()),
  }),

  priceRequests: defineTable({
    patientId: v.optional(v.string()), // Can be linked to users later
    medicineName: v.string(),
    quantity: v.number(),
    prescriptionUrl: v.optional(v.string()),
    status: v.string(), // 'pending', 'responded'
    createdAt: v.optional(v.string()),
  }),

  bills: defineTable({
    pharmacistId: v.id("pharmacists"),
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
    subtotal: v.optional(v.number()),
    discount: v.optional(v.number()),
    grandTotal: v.number(),
    paymentMode: v.optional(v.string()),
    couponCode: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  }),

  customers: defineTable({
    pharmacistId: v.id("pharmacists"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    age: v.optional(v.string()),
    notes: v.optional(v.string()),
    medicines: v.optional(v.array(
      v.object({
        medicineName: v.string(),
        quantity: v.number(),
        frequency: v.string(),
        typicalDate: v.string(),
      })
    )),
    createdAt: v.optional(v.string()),
  }),

  suppliers: defineTable({
    pharmacistId: v.id("pharmacists"),
    name: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    gstin: v.optional(v.string()),
    orders: v.optional(v.array(v.any())),
    createdAt: v.optional(v.string()),
  }),

  submissions: defineTable({
    medicineName: v.string(),
    price: v.number(),
    pharmacyId: v.optional(v.id("pharmacists")),
    pharmacyNameSnapshot: v.optional(v.string()),
    isNewPharmacy: v.optional(v.boolean()),
    newPharmacyData: v.optional(
      v.object({
        name: v.string(),
        address: v.string(),
      })
    ),
    billImage: v.optional(
      v.object({
        url: v.string(),
      })
    ),
    personalNote: v.optional(v.string()),
    status: v.string(), // 'pending', 'approved', 'rejected'
    submittedBy: v.optional(v.object({
      userId: v.optional(v.id("users")),
      userName: v.optional(v.string()),
    })),
    createdAt: v.optional(v.string()),
  }),

  adminMessages: defineTable({
    type: v.string(), // 'info', 'alert', 'feature', 'promo' OR 'direct'
    target: v.optional(v.string()), // 'all', 'customers', 'pharmacists', 'premium'
    pharmacistId: v.optional(v.id("pharmacists")), // for direct messages
    title: v.optional(v.string()),
    message: v.string(),
    createdAt: v.optional(v.string()),
  }),

  coupons: defineTable({
    code: v.string(),
    discount: v.string(),
    validDays: v.string(),
    forAnyUser: v.optional(v.boolean()),
    isUsed: v.optional(v.boolean()),
    isAdminCoupon: v.optional(v.boolean()),
    expiresAt: v.string(),
    createdAt: v.optional(v.string()),
  }),
});
