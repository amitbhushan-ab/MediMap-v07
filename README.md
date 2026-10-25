# 🏥 MediMap: Find Affordable Medicines Nearby

Welcome to **MediMap**, a comprehensive health-tech platform designed to bridge the gap between patients and local pharmacies. 

MediMap allows users to quickly search for medicines, compare prices across nearby pharmacies, and upload prescriptions for automated processing. It also features a dedicated portal for pharmacists to manage their stock and receive price requests from patients.

---

## 🚀 Live Deployments
Check out the live versions of our application:

- 🌐 **Web Application:** [https://medimap-frontend.onrender.com](https://medimap-frontend.onrender.com)
- ⚙️ **API Server:** [https://medimap-backend-ygqj.onrender.com](https://medimap-backend-ygqj.onrender.com)

---

## ✨ Key Features

### For Patients
- **Search & Compare:** Search for prescribed medicines and instantly compare prices across local pharmacies.
- **Smart Prescription Scanner (OCR):** Upload an image of your prescription and let our system automatically extract the required medicines.
- **AI Chatbot:** Built-in AI assistant to help you navigate the app and answer quick health-related queries.
- **Multi-language Support:** Easily toggle between English and Hindi for better accessibility.

### For Pharmacists
- **Real-Time Dashboard:** View incoming price requests from patients and respond with your best offers.
- **Stock Management:** Seamlessly manage inventory and update pricing through an intuitive admin panel.
- **Automated Billing Scanner:** Scan supplier bills using OCR to automatically update stock quantities.

---

## 🛠️ Technology Stack

This project is built using a modern, scalable full-stack architecture:

- **Frontend:** React.js, Vite, Tailwind CSS, Leaflet (Mapping)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Mobile App:** React Native, Expo, NativeWind (Tailwind)
- **AI & OCR:** Tesseract.js for optical character recognition, integrated AI chatbots.

---

## 💻 Local Setup Instructions

Want to run MediMap on your local machine? Follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/amitbhushan-ab/medimap2.git
cd medimap2
```

### 2. Start the Backend Server
```bash
cd medimap/backend
npm install
npm start
```
*(Note: Requires a `.env` file with `MONGO_URI` and `JWT_SECRET`)*

### 3. Start the Web Frontend
Open a new terminal window:
```bash
cd medimap/frontend
npm install
npm run dev
```

### 4. Start the Mobile App
Open a new terminal window:
```bash
cd medimap/mobile
npm install
npm start
```
*Scan the QR code with the Expo Go app on your mobile device to test.*

---
*Built with ❤️ for accessible healthcare.*
