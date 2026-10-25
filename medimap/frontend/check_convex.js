import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { api } from "./convex/_generated/api.js";

const env = readFileSync(".env.local", "utf-8");
const url = env.split("\n").find(l => l.startsWith("VITE_CONVEX_URL")).split("=")[1].trim();

const client = new ConvexHttpClient(url);

async function run() {
  try {
    const auth = await client.mutation(api.pharmacistAuth.login, { email: "apollo@medimap.com", password: "Apollo@123" });
    const stock = await client.query(api.pharmacistStock.getStock, { pharmacistId: auth.pharmacist._id });
    console.log("Stock Count:", stock.stock.length);
    console.log("First item:", stock.stock[0]);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
