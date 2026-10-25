import { action } from "./_generated/server";
import { v } from "convex/values";

export const getGenericRecommendation = action({
  args: { medicineName: v.string() },
  handler: async (ctx, args) => {
    // This is a placeholder for AI recommendations.
    // In Convex, you can use fetch() to call external AI APIs like OpenAI, Gemini, etc.
    try {
      // Example implementation (mocked):
      // const response = await fetch("https://api.openai.com/v1/chat/completions", { ... });
      
      return {
        recommendations: [
          `Generic equivalent for ${args.medicineName} 1`,
          `Generic equivalent for ${args.medicineName} 2`
        ]
      };
    } catch (error) {
      console.error("Error fetching recommendation", error);
      return { recommendations: [] };
    }
  },
});
