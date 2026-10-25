# MediMap 🏥 

> **Making Healthcare Affordable for Every Indian 🇮🇳**

MediMap is a next-generation healthcare platform designed to bridge the gap between patients, local pharmacies, and affordable medicines. By leveraging real-time inventory tracking, AI-powered prescription scanning, and geolocation, MediMap ensures you always find the cheapest medicines closest to you.

---

## ✨ Key Features

### 👤 For Users (Patients)
- **🔍 Smart Medicine Search:** Find medicines instantly by generic or brand name.
- **📍 Real-Time Geolocation:** View pharmacies near you sorted by distance and price.
- **📄 AI Prescription Scanner:** 100% offline Tesseract OCR automatically extracts medicine names directly from your uploaded prescription.
- **🗣️ Voice & AI Chatbot:** Talk directly to our smart AI assistant for generic alternatives or quick healthcare queries.
- **🏆 MediPoints Rewards:** Earn points by submitting prescription prices and redeem them for exclusive coupons!

### 🏥 For Pharmacists
- **📦 Live Stock Management:** Easily update medicine stock and pricing through a beautifully designed dashboard.
- **🔔 Real-Time Requests:** Receive and respond to user queries for out-of-stock medicines instantly.
- **🧾 Bill Generation:** Effortlessly generate and track digital bills for customers.

### 🛡️ For Super Admins
- **📊 Analytics Dashboard:** A bird's-eye view of all platform metrics (pending pharmacies, listed stores, user stats).
- **📢 Broadcast System:** Send platform-wide announcements to all registered pharmacists.
- **🎟️ Coupon Management:** Create and distribute discount coupons for users to redeem with their MediPoints.

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + Vanilla CSS (Glassmorphism, Aurora UI)
- **Backend & Database:** [Convex](https://convex.dev/) (Serverless Database & Functions)
- **AI & OCR:** Tesseract.js (Offline Browser OCR)
- **Maps:** Leaflet (React-Leaflet)

---

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/amitbhushan-ab/MediMap-V6.git
cd MediMap-V6
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Convex Backend
```bash
npx convex dev
```
*(This will prompt you to log into Convex and automatically sync the backend schema & functions)*

### 4. Seed the Database (Optional but Recommended)
Open a new terminal and run:
```bash
npx convex run seedAll:seedEverything
```
*(This populates the app with mock medicines, pharmacies, and prices for testing)*

### 5. Start the Vite Frontend Server
```bash
npm run dev
```

Your app will now be running on `http://localhost:5173`!

---

## 🎨 Design Philosophy
MediMap was built with a **Premium UI/UX** approach. We utilized heavy glassmorphism, fluid micro-animations, and dynamic aurora background gradients to make the healthcare experience feel modern, calm, and trustworthy.

*Built with ❤️ for the Hackathon Submission!*
