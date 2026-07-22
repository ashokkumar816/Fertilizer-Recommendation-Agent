import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cors from "cors";

// ─── LOAD ENV FIRST ───
dotenv.config({ path: ".env.local" });

const app = express();
const PORT = Number(process.env.PORT || 5500);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ─── INIT GROQ (OpenAI-compatible) ───
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ FATAL: No GROQ_API_KEY in .env.local");
  console.error("   Get one free at: https://console.groq.com/keys");
  process.exit(1);
}

console.log(`🔑 Groq API Key loaded: ${GROQ_API_KEY.slice(0, 10)}...`);

// Groq uses OpenAI-compatible endpoint
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.3-70b-versatile"; // Fast, capable, free tier eligible

// ─── HEALTH CHECK ───
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", port: PORT, provider: "groq", model: MODEL });
});

// ─── RECOMMENDATION ───
app.post("/api/recommend", async (req, res) => {
  try {
    const profile = req.body.profile;
    if (!profile) return res.status(400).json({ error: "Profile required" });

    const { soilType, cropType, nLevel, pLevel, kLevel, phLevel, moistureLevel, organicMatter, farmArea, areaUnit, climateRegion } = profile;

    const systemPrompt = `You are an expert agricultural scientist. Analyze soil profiles and return ONLY valid JSON. No markdown, no code blocks, no extra text.`;

    const userPrompt = `Analyze this soil profile and return EXACTLY this JSON structure:
{
  "soilAnalysis": "detailed professional assessment",
  "npkStatus": { "n": "deficient|optimal|excess", "p": "deficient|optimal|excess", "k": "deficient|optimal|excess" },
  "recommendedFertilizers": [{ "name": "string", "type": "organic|chemical", "dosage": "string", "timing": "string", "purpose": "string" }],
  "applicationSchedule": [{ "stage": "string", "timing": "string", "instructions": "string" }],
  "soilAmendments": "string",
  "wateringAndTillageTips": ["tip1", "tip2", "tip3"],
  "sustainabilityRating": 3
}

Soil Profile:
- Crop: ${cropType}
- Soil: ${soilType}
- N: ${nLevel} ppm, P: ${pLevel} ppm, K: ${kLevel} ppm
- pH: ${phLevel}
- Moisture: ${moistureLevel}
- Organic Matter: ${organicMatter}
- Area: ${farmArea} ${areaUnit}
- Climate: ${climateRegion}`;

    console.log("🌱 Calling Groq API...");

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Groq API ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from Groq");
    }

    // Clean up any markdown wrappers
    let clean = content.trim();
    if (clean.startsWith("```json")) clean = clean.slice(7).trim();
    if (clean.startsWith("```")) clean = clean.slice(3).trim();
    if (clean.endsWith("```")) clean = clean.slice(0, -3).trim();

    const recommendationData = JSON.parse(clean);
    console.log("✅ Recommendation generated");
    res.json(recommendationData);

  } catch (err: any) {
    console.error("❌ RECOMMEND ERROR:", err.message);
    res.status(500).json({ 
      error: "Failed to generate recommendations.", 
      details: err.message 
    });
  }
});

// ─── CHAT ───
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, profile } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    let context = "";
    if (profile) {
      context = `User soil profile: ${profile.soilType}, ${profile.cropType}, N=${profile.nLevel}, P=${profile.pLevel}, K=${profile.kLevel}, pH=${profile.phLevel}. `;
    }

    const messages = [
      { 
        role: "system", 
        content: `You are an expert AI Agronomist. ${context}Be concise, practical, science-backed. Use Markdown formatting.` 
      }
    ];

    // Add history
    if (history?.length) {
      history.slice(-6).forEach((m: any) => {
        messages.push({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text
        });
      });
    }

    messages.push({ role: "user", content: message });

    console.log("💬 Calling Groq API for chat...");

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Groq API ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't process that.";

    console.log("✅ Chat response generated");
    res.json({ text: reply });

  } catch (err: any) {
    console.error("❌ CHAT ERROR:", err.message);
    res.status(500).json({ 
      error: "Failed to communicate with AI Agronomist.", 
      details: err.message 
    });
  }
});

// ─── SERVE FRONTEND ───
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🤖 Provider: Groq (${MODEL})`);
    console.log(`🧪 Health: http://localhost:${PORT}/api/health`);
  });
}

startServer();