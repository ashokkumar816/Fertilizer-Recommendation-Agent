import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();dotenv.config({ path: ".env.local", override: true });
const app = express();
const PORT = Number(process.env.PORT || 5500);

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Fertilizer Recommendation Endpoint
app.post("/api/recommend", async (req, res) => {
  try {
    const profile = req.body.profile;
    if (!profile) {
      return res.status(400).json({ error: "Soil profile data is required" });
    }

    const {
      soilType,
      cropType,
      nLevel,
      pLevel,
      kLevel,
      phLevel,
      moistureLevel,
      organicMatter,
      farmArea,
      areaUnit,
      climateRegion
    } = profile;

    const systemPrompt = `You are a highly experienced agricultural scientist, agronomist, and soil doctor. Your goal is to analyze the provided soil test parameters and crop requirements, then deliver a precise, custom fertilizer recommendation and schedule that optimizes yield, keeps costs low, and respects ecological sustainability.`;

    const userPrompt = `Please analyze the following soil test profile and target crop:
- Target Crop: ${cropType}
- Soil Type: ${soilType}
- Nitrogen (N) Level: ${nLevel} ppm
- Phosphorus (P) Level: ${pLevel} ppm
- Potassium (K) Level: ${kLevel} ppm
- Soil pH: ${phLevel}
- Moisture Level: ${moistureLevel}
- Organic Matter: ${organicMatter}
- Farm/Plot Area: ${farmArea} ${areaUnit}
- Climate Region: ${climateRegion}

Formulate a response detailing:
1. soilAnalysis: A professional assessment of what these nutrient levels, pH, and soil type mean for growing the target crop.
2. npkStatus: Determine if each macronutrient (N, P, K) is "deficient", "optimal", or "excess" based on typical requirements for ${cropType}.
3. recommendedFertilizers: Specific commercial or organic fertilizer suggestions (e.g. Urea, DAP, Compost, Manure) with exact quantities needed to cover the area (${farmArea} ${areaUnit}) and timing of application.
4. applicationSchedule: Stage-by-stage instructions (e.g., land prep, sowing, vegetative growth, flowering/fruiting).
5. soilAmendments: Essential steps to correct pH or physical soil structure (e.g., adding lime if pH is too acidic, sulfur/gypsum if alkaline, or compost to sandy/clay soils).
6. wateringAndTillageTips: 3 practical tips for watering, tillage, or crop rotation optimized for this crop and soil.
7. sustainabilityRating: An ecological rating (1 to 5) on how sustainable the suggested mix is, with organic composts and precision inorganic dosing yielding a higher rating.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            soilAnalysis: { 
              type: Type.STRING,
              description: "Agronomic summary of the soil and potential limitations for this crop."
            },
            npkStatus: {
              type: Type.OBJECT,
              properties: {
                n: { type: Type.STRING, description: "Must be 'deficient', 'optimal', or 'excess'" },
                p: { type: Type.STRING, description: "Must be 'deficient', 'optimal', or 'excess'" },
                k: { type: Type.STRING, description: "Must be 'deficient', 'optimal', or 'excess'" }
              },
              required: ["n", "p", "k"]
            },
            recommendedFertilizers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Fertilizer name (e.g., Urea, Compost, DAP)" },
                  type: { type: Type.STRING, description: "Must be 'organic' or 'chemical'" },
                  dosage: { type: Type.STRING, description: "Exact recommended dosage (e.g. 50 kg for the total plot size of " + farmArea + " " + areaUnit + ")" },
                  timing: { type: Type.STRING, description: "When to apply (e.g., At transplanting, 3 weeks after sowing)" },
                  purpose: { type: Type.STRING, description: "How this helps the crop (e.g., supplies starter phosphorus for roots)" }
                },
                required: ["name", "type", "dosage", "timing", "purpose"]
              }
            },
            applicationSchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stage: { type: Type.STRING, description: "Growth stage (e.g., Seedling, Tillering)" },
                  timing: { type: Type.STRING, description: "Timing timeline (e.g., Day 15, After first weeding)" },
                  instructions: { type: Type.STRING, description: "Specific steps to take during this phase" }
                },
                required: ["stage", "timing", "instructions"]
              }
            },
            soilAmendments: { 
              type: Type.STRING, 
              description: "pH amendment suggestions (lime/dolomite, sulfur, gypsum) or organic booster directions." 
            },
            wateringAndTillageTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly three highly relevant agricultural best practices for this soil-crop combination."
            },
            sustainabilityRating: { 
              type: Type.INTEGER, 
              description: "Rating from 1 (poor/high-runoff) to 5 (excellent organic/regenerative practice)." 
            }
          },
          required: [
            "soilAnalysis", 
            "npkStatus", 
            "recommendedFertilizers", 
            "applicationSchedule", 
            "soilAmendments", 
            "wateringAndTillageTips", 
            "sustainabilityRating"
          ]
        }
      }
    });

    const recommendationData = JSON.parse(response.text || "{}");
    res.json(recommendationData);
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({ error: "Failed to generate fertilizer recommendations. Please verify your API key." });
  }
});

// AI Agronomist Chat Companion Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, profile } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let profileContext = "";
    if (profile) {
      profileContext = `The user has specified a soil profile:
- Soil Type: ${profile.soilType}
- Target Crop: ${profile.cropType}
- NPK Levels: N=${profile.nLevel}ppm, P=${profile.pLevel}ppm, K=${profile.kLevel}ppm
- Soil pH: ${profile.phLevel}
- Moisture: ${profile.moistureLevel}
- Organic Matter: ${profile.organicMatter}
- Farm Area: ${profile.farmArea} ${profile.areaUnit}
- Climate/Region: ${profile.climateRegion}`;
    }

    const systemInstruction = `You are an expert AI Agronomist and Fertilizer Advisor. Your task is to assist the user (farmer, gardener, or agricultural student) with follow-up questions, pest control, fertilizer sources, mixing methods, leaf symptoms, or crop-specific farming tips.
Always keep your answers practical, action-oriented, clear, and science-backed. Keep responses concise but helpful, utilizing clean Markdown for formatting.
${profileContext ? "\nUse the following user soil profile for highly context-aware advice:\n" + profileContext : ""}`;

    // Create chat session with history
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
      },
    });

    // Populate history (Gemini SDK uses { role: "user" | "model", parts: [{ text: "..." }] })
    // Let's send messages in a single chat send message or rebuild content history.
    // To support history accurately in standard chat:
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // If we want to use the standard Gemini SDK chat session, we can set pre-existing history:
    // Standard chat configuration doesn't directly support injecting history array inside chats.create with @google/genai, 
    // but we can pass history inside configuration or just use sendMessage.
    // Wait, the safest and cleanest way with the @google/genai SDK is to create the chat and then send the message, 
    // or let the backend do a single generateContent call with the context and chat history concatenated.
    // Let's concatenate the chat history directly into a clean prompt format for generateContent to ensure full context and flawless history.
    let fullPrompt = "Here is our discussion history so far:\n\n";
    (history || []).forEach((msg: any) => {
      const senderName = msg.sender === "user" ? "Farmer" : "AI Agronomist";
      fullPrompt += `${senderName}: ${msg.text}\n\n`;
    });
    fullPrompt += `Farmer (New Question): ${message}\n\nAI Agronomist (Provide a clear, helpful response):`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Error in AI Agronomist Chat:", error);
    res.status(500).json({ error: "Failed to communicate with AI Agronomist." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
