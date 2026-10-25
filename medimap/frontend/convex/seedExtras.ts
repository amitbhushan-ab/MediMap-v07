import { mutation } from "./_generated/server";

const mockCustomers = [
  { name: "Rahul Sharma", phone: "9876543210", email: "rahul@example.com", address: "123 Main St, Delhi", age: "45" },
  { name: "Priya Singh", phone: "9876543211", email: "priya@example.com", address: "456 Park Ave, Delhi", age: "32" },
  { name: "Amit Kumar", phone: "9876543212", email: "amit@example.com", address: "789 Lake View, Delhi", age: "55" },
  { name: "Sneha Reddy", phone: "9876543213", email: "sneha@example.com", address: "Block B, Vasant Kunj, Delhi", age: "28" },
  { name: "Vikram Malhotra", phone: "9876543214", email: "vikram@example.com", address: "Sector 14, Dwarka, Delhi", age: "62" },
];

const mockSuppliers = [
  { name: "PharmaDistributors Inc", contactPerson: "Ravi Verma", phone: "9988776655", email: "sales@pharmadist.com", address: "Okhla Phase 1", gstin: "07AABCU9603R1ZX" },
  { name: "MediSupply Wholesale", contactPerson: "Sanjay Gupta", phone: "9988776644", email: "orders@medisupply.com", address: "Karol Bagh", gstin: "07BBDCU9603R1ZY" },
  { name: "Apex Health Logistics", contactPerson: "Neha Sharma", phone: "9988776633", email: "info@apexhealth.com", address: "Patparganj Industrial Area", gstin: "07CCDCU9603R1ZZ" },
];

export const seedCustomersAndSuppliers = mutation({
  args: {},
  handler: async (ctx) => {
    const pharmacists = await ctx.db.query("pharmacists").collect();
    let customersAdded = 0;
    let suppliersAdded = 0;

    for (const pharmacist of pharmacists) {
      for (const c of mockCustomers) {
        await ctx.db.insert("customers", {
          pharmacistId: pharmacist._id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          age: c.age,
          createdAt: new Date().toISOString(),
          medicines: [
             { medicineName: "Paracetamol 500mg", quantity: 2, frequency: "monthly", typicalDate: "05" }
          ]
        });
        customersAdded++;
      }

      for (const s of mockSuppliers) {
        await ctx.db.insert("suppliers", {
          pharmacistId: pharmacist._id,
          name: s.name,
          contactPerson: s.contactPerson,
          phone: s.phone,
          email: s.email,
          address: s.address,
          gstin: s.gstin,
          createdAt: new Date().toISOString(),
          orders: []
        });
        suppliersAdded++;
      }
    }

    return `Added ${customersAdded} customers and ${suppliersAdded} suppliers!`;
  }
});
