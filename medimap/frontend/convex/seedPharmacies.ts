import { mutation } from "./_generated/server";

const southDelhiPharmacies = [
  { pharmacist: "Sanjay", pharmacyName: "Lajpat Nagar Medicos", address: "Central Market, Lajpat Nagar II", contact: "9810022201", license: "DLSD001", location: { lat: 28.5677, lng: 77.2433 } },
  { pharmacist: "Ritu", pharmacyName: "Kalkaji Pharmacy", address: "Main Market, Kalkaji", contact: "9810022202", license: "DLSD002", location: { lat: 28.5398, lng: 77.2571 } },
  { pharmacist: "Arvind", pharmacyName: "Okhla Care Chemists", address: "Okhla Phase 1", contact: "9810022203", license: "DLSD003", location: { lat: 28.5262, lng: 77.2755 } },
  { pharmacist: "Sunita", pharmacyName: "Chittaranjan Park Pharma", address: "Market 1, CR Park", contact: "9810022204", license: "DLSD004", location: { lat: 28.5404, lng: 77.2483 } },
  { pharmacist: "Manish", pharmacyName: "Alaknanda Medicos", address: "Alaknanda Market", contact: "9810022205", license: "DLSD005", location: { lat: 28.5284, lng: 77.2492 } },
  { pharmacist: "Jyoti", pharmacyName: "Govindpuri Chemist", address: "Main Road, Govindpuri", contact: "9810022206", license: "DLSD006", location: { lat: 28.5269, lng: 77.2655 } },
  { pharmacist: "Pramod", pharmacyName: "East of Kailash Medicos", address: "Kailash Colony Market", contact: "9810022207", license: "DLSD007", location: { lat: 28.5535, lng: 77.2415 } },
  { pharmacist: "Deepak", pharmacyName: "Munirka Chemists", address: "Munirka Village", contact: "9810022208", license: "DLSD008", location: { lat: 28.5562, lng: 77.1732 } },
  { pharmacist: "Rekha", pharmacyName: "RK Puram Pharmacy", address: "Sector 1, RK Puram", contact: "9810022209", license: "DLSD009", location: { lat: 28.5660, lng: 77.1767 } },
  { pharmacist: "Vinay", pharmacyName: "Vasant Vihar Medicos", address: "Basant Lok Market, Vasant Vihar", contact: "9810022210", license: "DLSD010", location: { lat: 28.5583, lng: 77.1633 } },
  { pharmacist: "Neha", pharmacyName: "Chhatarpur Pharma", address: "Main Road, Chhatarpur", contact: "9810022211", license: "DLSD011", location: { lat: 28.4986, lng: 77.1788 } },
  { pharmacist: "Kapil", pharmacyName: "Safdarjung Enclave Medicos", address: "B6 Market, Safdarjung Enclave", contact: "9810022212", license: "DLSD012", location: { lat: 28.5614, lng: 77.1993 } },
  { pharmacist: "Pooja", pharmacyName: "Moti Bagh Pharmacy", address: "South Moti Bagh", contact: "9810022213", license: "DLSD013", location: { lat: 28.5830, lng: 77.1725 } },
  { pharmacist: "Tarun", pharmacyName: "Sarojini Nagar Chemist", address: "Sarojini Nagar Market", contact: "9810022214", license: "DLSD014", location: { lat: 28.5768, lng: 77.1963 } },
  { pharmacist: "Anil", pharmacyName: "INA Market Pharma", address: "INA Market", contact: "9810022215", license: "DLSD015", location: { lat: 28.5750, lng: 77.2084 } },
  { pharmacist: "Suman", pharmacyName: "Lado Sarai Medicos", address: "Lado Sarai", contact: "9810022216", license: "DLSD016", location: { lat: 28.5242, lng: 77.1932 } },
  { pharmacist: "Rakesh", pharmacyName: "Mehrauli Chemists", address: "Main Bazaar, Mehrauli", contact: "9810022217", license: "DLSD017", location: { lat: 28.5195, lng: 77.1812 } },
];

export const seedSouthDelhi = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Get all existing medicines so we can assign prices
    const medicines = await ctx.db.query("medicines").collect();
    
    // 2. Add South Delhi Pharmacies
    const pharmacyIds = [];
    for (const pharmacy of southDelhiPharmacies) {
      const id = await ctx.db.insert("pharmacists", {
        name: pharmacy.pharmacist,
        pharmacyName: pharmacy.pharmacyName,
        address: pharmacy.address,
        contact: pharmacy.contact,
        password: "password123",
        licenseNumber: pharmacy.license,
        location: pharmacy.location,
        status: "approved",
      });
      pharmacyIds.push(id);
    }

    // 3. Add prices for all existing medicines to these new pharmacies
    const variations = [0, 3, -2, 5, 7, -4, 2, 6, -1, 4, -3, 8, -5, 1, 9, -6, 10]; // Random price variations
    
    // Base prices fallback map (same as the previous one)
    const basePrices: Record<string, number> = {
      "Paracetamol 500mg": 28, "Amoxicillin 250mg": 92, "Metformin 500mg": 56,
      "Cetirizine 10mg": 35, "Azithromycin 500mg": 180, "Omeprazole 20mg": 68,
      "Atorvastatin 10mg": 145, "Aspirin 75mg": 25, "Pantoprazole 40mg": 75,
      "Levothyroxine 50mcg": 125,
    };

    let pricesAdded = 0;
    for (const medicine of medicines) {
      const basePrice = basePrices[medicine.name] || 50;
      for (let i = 0; i < pharmacyIds.length; i++) {
        await ctx.db.insert("prices", {
          medicineId: medicine._id,
          pharmacistId: pharmacyIds[i],
          price: basePrice + (variations[i % variations.length]),
          inStock: Math.random() > 0.15, // 85% chance of being in stock
        });
        pricesAdded++;
      }
    }

    return {
      success: true,
      message: `Added ${pharmacyIds.length} South Delhi pharmacies and generated ${pricesAdded} prices!`,
    };
  },
});
