import { ai } from "./shared";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "Missing GEMINI_API_KEY environment variable." });
      return;
    }

    const { message, history, profile } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    let profileContext = "";
    if (profile) {
      profileContext = `The user has specified a soil profile:\n- Soil Type: ${profile.soilType}\n- Target Crop: ${profile.cropType}\n- NPK Levels: N=${profile.nLevel}ppm, P=${profile.pLevel}ppm, K=${profile.kLevel}ppm\n- Soil pH: ${profile.phLevel}\n- Moisture: ${profile.moistureLevel}\n- Organic Matter: ${profile.organicMatter}\n- Farm Area: ${profile.farmArea} ${profile.areaUnit}\n- Climate/Region: ${profile.climateRegion}`;
    }

    const systemInstruction = `You are an expert AI Agronomist and Fertilizer Advisor. Your task is to assist the user (farmer, gardener, or agricultural student) with follow-up questions, pest control, fertilizer sources, mixing methods, leaf symptoms, or crop-specific farming tips. Always keep your answers practical, action-oriented, clear, and science-backed. Keep responses concise but helpful, utilizing clean Markdown for formatting. ${profileContext ? "\nUse the following user soil profile for highly context-aware advice:\n" + profileContext : ""}`;

    const formattedHistory = (history || []).map((msg: any) => {
      const role = msg.sender === "user" ? "user" : "assistant";
      return `${role === "user" ? "Farmer" : "AI Agronomist"}: ${msg.text}`;
    }).join("\n");

    const fullPrompt = `${formattedHistory ? `${formattedHistory}\n\n` : ""}Farmer: ${message}\n\nAI Agronomist:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
      },
    });

    const text = (response as any).text ?? (response as any).output_text ?? "";
    res.status(200).json({ text });
  } catch (error) {
    console.error("Error in AI Agronomist Chat:", error);
    res.status(500).json({ error: "Failed to communicate with AI Agronomist." });
  }
}
