# 🗺️ MediMap — Healthcare Price Transparency Platform

Find the most affordable medicines at pharmacies near you. Compare prices, check availability, and save money on every prescription.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (optional — app runs with mock data without it)

### 1. Clone / unzip the project
```bash
cd medimap
```

### 2. Install all dependencies
```bash
# Install root dev tools
npm install

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

### 3. Configure environment (optional)
```bash
cp backend/.env.example backend/.env
# Edit backend/.env to add your MONGO_URI and OPENAI_API_KEY
```

### 4. Run both servers
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 — Backend (port 5000)
npm run dev:backend

# Terminal 2 — Frontend (port 3000)
npm run dev:frontend
```

### 5. Open the app
- Frontend: http://localhost:3000
- API: http://localhost:5000/api/health

---

## 🔑 Environment Variables

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/medimap   # optional
OPENAI_API_KEY=sk-...                          # optional, for AI recommendations
```

**The app works without MongoDB or OpenAI** — it uses built-in mock data.

---

## 📱 Features

| Feature | Status |
|---------|--------|
| Medicine search with price comparison | ✅ |
| Nearby pharmacy listing with distance | ✅ |
| Best price highlighting | ✅ |
| Interactive Leaflet map with price markers | ✅ |
| Pharmacy detail page | ✅ |
| Price history chart (Recharts) | ✅ |
| Generic medicine AI recommendations | ✅ |
| Crowdsourced price submission | ✅ |
| Barcode scan (UI placeholder) | ✅ |
| Prescription upload (UI placeholder) | ✅ |
| Mobile responsive design | ✅ |
| MongoDB integration | ✅ |
| Mock data fallback (no DB needed) | ✅ |

---

## 🏗️ Project Structure

```
medimap/
├── backend/
│   ├── server.js           # Express entry point
│   ├── routes/
│   │   ├── medicines.js    # Search & list medicines
│   │   ├── pharmacies.js   # Pharmacy CRUD
│   │   ├── prices.js       # Price submission
│   │   └── ai.js           # Generic recommendations
│   ├── models/
│   │   ├── Medicine.js
│   │   ├── Pharmacy.js
│   │   ├── Price.js
│   │   └── UserSubmission.js
│   ├── data/
│   │   └── seed.js         # Mock data + DB seeder
│   └── .env.example
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── ResultsPage.jsx
        │   ├── MapViewPage.jsx
        │   ├── PharmacyDetailPage.jsx
        │   └── SubmitPricePage.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── SearchBar.jsx
        │   ├── PharmacyCard.jsx
        │   ├── GenericRecommendation.jsx
        │   └── ui/LoadingCards.jsx
        └── services/
            └── api.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/medicines` | List all medicines |
| GET | `/api/medicines/search?q=paracetamol` | Search medicine + prices |
| GET | `/api/pharmacies` | List all pharmacies |
| GET | `/api/pharmacies/:id` | Get pharmacy details |
| POST | `/api/prices/submit` | Submit price update |
| POST | `/api/ai/recommend` | Get generic alternatives |

### Sample Search Request
```
GET /api/medicines/search?q=paracetamol&lat=12.9716&lng=77.6101
```

### Sample Price Submit
```json
POST /api/prices/submit
{
  "medicineName": "Paracetamol 500mg",
  "pharmacyName": "Apollo Pharmacy",
  "price": 18.50,
  "inStock": true
}
```

---

## 🎨 Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Map**: React-Leaflet (OpenStreetMap)
- **Charts**: Recharts
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **AI**: OpenAI GPT-3.5 (optional)
- **HTTP**: Axios

---

Built with ❤️ for the hackathon demo.
