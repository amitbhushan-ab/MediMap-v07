import { mutation } from "./_generated/server";

const medicines = [
  { name: "Paracetamol 500mg", category: "Analgesic" },
  { name: "Amoxicillin 250mg", category: "Antibiotic" },
  { name: "Metformin 500mg", category: "Antidiabetic" },
  { name: "Cetirizine 10mg", category: "Antihistamine" },
  { name: "Azithromycin 500mg", category: "Antibiotic" },
  { name: "Omeprazole 20mg", category: "Antacid" },
  { name: "Atorvastatin 10mg", category: "Cardiology" },
  { name: "Aspirin 75mg", category: "Cardiology" },
  { name: "Pantoprazole 40mg", category: "Gastroenterology" },
  { name: "Levothyroxine 50mcg", category: "Thyroid" },
];

const pharmacies = [
  {
    pharmacist: "Rahul Sharma",
    pharmacyName: "South Extension Medicos",
    address: "E-18, South Extension Part I, New Delhi - 110049",
    contact: "9810011111",
    license: "DL20260001",
    location: { lat: 28.5682, lng: 77.2205 },
  },
  {
    pharmacist: "Amit Gupta",
    pharmacyName: "Green Park Medicos",
    address: "24, Green Park Main Market, New Delhi - 110016",
    contact: "9810011112",
    license: "DL20260002",
    location: { lat: 28.5590, lng: 77.2063 },
  },
  {
    pharmacist: "Neha Verma",
    pharmacyName: "Saket Care Pharmacy",
    address: "Shop 14, Saket District Centre, New Delhi - 110017",
    contact: "9810011113",
    license: "DL20260003",
    location: { lat: 28.5245, lng: 77.2066 },
  },
  {
    pharmacist: "Karan Mehta",
    pharmacyName: "Malviya Nagar Pharmacy",
    address: "Old Market, Malviya Nagar, New Delhi - 110017",
    contact: "9810011114",
    license: "DL20260004",
    location: { lat: 28.5355, lng: 77.2102 },
  },
  {
    pharmacist: "Priya Singh",
    pharmacyName: "GK Wellness Pharmacy",
    address: "M Block Market, Greater Kailash I, New Delhi - 110048",
    contact: "9810011115",
    license: "DL20260005",
    location: { lat: 28.5483, lng: 77.2408 },
  },
  {
    pharmacist: "Rohit Arora",
    pharmacyName: "Defence Colony Medicos",
    address: "Defence Colony Main Market, New Delhi - 110024",
    contact: "9810011116",
    license: "DL20260006",
    location: { lat: 28.5716, lng: 77.2324 },
  },
  {
    pharmacist: "Simran Kaur",
    pharmacyName: "Hauz Khas Pharmacy",
    address: "Aurobindo Marg, Hauz Khas, New Delhi - 110016",
    contact: "9810011117",
    license: "DL20260007",
    location: { lat: 28.5494, lng: 77.2001 },
  },
  {
    pharmacist: "Vikas Jain",
    pharmacyName: "Vasant Kunj Medicos",
    address: "Sector D Market, Vasant Kunj, New Delhi - 110070",
    contact: "9810011118",
    license: "DL20260008",
    location: { lat: 28.5264, lng: 77.1541 },
  },
  {
    pharmacist: "Anjali Kapoor",
    pharmacyName: "Sheikh Sarai Pharmacy",
    address: "Pocket K, Sheikh Sarai Phase II, New Delhi - 110017",
    contact: "9810011119",
    license: "DL20260009",
    location: { lat: 28.5338, lng: 77.2218 },
  },
  {
    pharmacist: "Saurabh Bansal",
    pharmacyName: "Yusuf Sarai Medicos",
    address: "Yusuf Sarai Market, New Delhi - 110016",
    contact: "9810011120",
    license: "DL20260010",
    location: { lat: 28.5608, lng: 77.2077 },
  },
];

const basePrices: Record<string, number> = {
  "Paracetamol 500mg": 28,
  "Amoxicillin 250mg": 92,
  "Metformin 500mg": 56,
  "Cetirizine 10mg": 35,
  "Azithromycin 500mg": 180,
  "Omeprazole 20mg": 68,
  "Atorvastatin 10mg": 145,
  "Aspirin 75mg": 25,
  "Pantoprazole 40mg": 75,
  "Levothyroxine 50mcg": 125,
};

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const medicineIds = [];

    for (const medicine of medicines) {
      const id = await ctx.db.insert("medicines", {
        name: medicine.name,
        category: medicine.category,
      });

      medicineIds.push({
        id,
        name: medicine.name,
      });
    }

    const pharmacyIds = [];

    for (const pharmacy of pharmacies) {
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

    const variations = [0, 3, -2, 5, 7, -4, 2, 6];

    for (const medicine of medicineIds) {
      for (let i = 0; i < pharmacyIds.length; i++) {
        await ctx.db.insert("prices", {
          medicineId: medicine.id,
          pharmacistId: pharmacyIds[i],
          price: basePrices[medicine.name] + variations[i],
          inStock: Math.random() > 0.2,
        });
      }
    }

    return {
      success: true,
      medicines: medicineIds.length,
      pharmacies: pharmacyIds.length,
      prices: medicineIds.length * pharmacyIds.length,
    };
  },
});