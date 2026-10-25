import { mutation } from "./_generated/server";

const medicinesList = [
  { name:'Paracetamol 500mg', genericName:'Acetaminophen', category:'Analgesic', requiresPrescription:false, manufacturer:'Cipla', dosage:'500mg' },
  { name:'Amoxicillin 250mg', genericName:'Amoxicillin', category:'Antibiotic', requiresPrescription:true, manufacturer:'Sun Pharma', dosage:'250mg' },
  { name:'Metformin 500mg', genericName:'Metformin HCl', category:'Antidiabetic', requiresPrescription:true, manufacturer:'USV Ltd', dosage:'500mg' },
  { name:'Cetirizine 10mg', genericName:'Cetirizine HCl', category:'Antihistamine', requiresPrescription:false, manufacturer:"Dr. Reddy's", dosage:'10mg' },
  { name:'Azithromycin 500mg', genericName:'Azithromycin', category:'Antibiotic', requiresPrescription:true, manufacturer:'Cipla', dosage:'500mg' },
  { name:'Omeprazole 20mg', genericName:'Omeprazole', category:'Antacid', requiresPrescription:false, manufacturer:'Sun Pharma', dosage:'20mg' },
  { name:'Atorvastatin 10mg', genericName:'Atorvastatin', category:'Antilipemic', requiresPrescription:true, manufacturer:'Ranbaxy', dosage:'10mg' },
  { name:'Aspirin 75mg', genericName:'Acetylsalicylic acid', category:'Antiplatelet', requiresPrescription:false, manufacturer:'Bayer', dosage:'75mg' },
  { name:'Pantoprazole 40mg', genericName:'Pantoprazole', category:'Antacid', requiresPrescription:false, manufacturer:'Sun Pharma', dosage:'40mg' },
  { name:'Levothyroxine 50mcg', genericName:'Levothyroxine', category:'Thyroid', requiresPrescription:true, manufacturer:'Abbott', dosage:'50mcg' },
];

const allPharmacies = [
  // 4 Original Faridabad ones
  { pharmacist: "Admin 1", pharmacyName: "Apollo Pharmacy - Sector 16", address: "Sector 16 Market, Faridabad", contact: "9876543210", license: "LIC123", location: { lat: 28.4089, lng: 77.3178 } },
  { pharmacist: "Admin 2", pharmacyName: "MedPlus - NIT Faridabad", address: "NIT Market, Faridabad", contact: "9876543211", license: "LIC124", location: { lat: 28.4120, lng: 77.3210 } },
  { pharmacist: "Admin 3", pharmacyName: "Jan Aushadhi - Sector 9", address: "Sector 9, Faridabad", contact: "9876543212", license: "LIC125", location: { lat: 28.4050, lng: 77.3150 } },
  { pharmacist: "Admin 4", pharmacyName: "Wellness Forever - Old Faridabad", address: "Old Faridabad Market", contact: "9876543213", license: "LIC126", location: { lat: 28.4000, lng: 77.3100 } },
  
  // 17 South Delhi ones
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

export const seedEverything = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Insert Medicines
    const medicineIds = [];
    for (const med of medicinesList) {
      const id = await ctx.db.insert("medicines", { 
        name: med.name, 
        category: med.category,
        genericName: med.genericName,
        requiresPrescription: med.requiresPrescription,
        manufacturer: med.manufacturer,
        dosage: med.dosage
      });
      medicineIds.push({ id, name: med.name });
    }

    // 2. Insert Pharmacies
    const pharmacyIds = [];
    for (const pharmacy of allPharmacies) {
      // If it's Apollo Sector 16, make it the demo user
      const isApollo = pharmacy.pharmacyName.includes("Apollo") && pharmacy.address.includes("Sector 16");
      const id = await ctx.db.insert("pharmacists", {
        name: pharmacy.pharmacist,
        email: isApollo ? "apollo@medimap.com" : undefined,
        password: isApollo ? "Apollo@123" : "password123",
        pharmacyName: pharmacy.pharmacyName,
        address: pharmacy.address,
        contact: pharmacy.contact,
        licenseNumber: pharmacy.license,
        location: pharmacy.location,
        status: "approved",
      });
      pharmacyIds.push(id);
    }

    // 3. Insert Prices (mock stock)
    // 10 medicines * 21 pharmacies = 210 prices
    let pricesAdded = 0;
    for (let i = 0; i < medicineIds.length; i++) {
      for (let j = 0; j < pharmacyIds.length; j++) {
        // Vary price by +/- 15%
        const basePrice = 50 + (i * 12); 
        const variation = (Math.random() * 0.3) - 0.15;
        const mockPrice = Math.round(basePrice * (1 + variation));
        
        // 80% chance to be in stock
        const inStock = Math.random() > 0.2;
        const units = inStock ? Math.floor(Math.random() * 100) + 10 : 0;

        await ctx.db.insert("prices", {
          medicineId: medicineIds[i].id,
          pharmacistId: pharmacyIds[j],
          price: mockPrice,
          inStock: inStock,
          lastUpdated: new Date().toISOString(),
          // Extra stock fields for the dashboard
          medicineName: medicineIds[i].name,
          genericName: medicineIds[i].genericName || "Generic",
          manufacturer: medicineIds[i].manufacturer || "Unknown",
          batchNo: `BATCH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0], // 1 year from now
          category: medicineIds[i].category || "General",
          gstRate: 12,
          purchasePrice: Math.round(mockPrice * 0.7),
          sellingPrice: mockPrice,
          units: units,
          minStock: 10,
        });
        pricesAdded++;
      }
    }

    return `Added ${medicineIds.length} medicines, ${pharmacyIds.length} pharmacies, and ${pricesAdded} prices!`;
  },
});
