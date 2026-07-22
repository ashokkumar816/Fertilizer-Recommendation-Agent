import { ai } from "./shared";
import { Type } from "@google/genai";

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

    const profile = req.body?.profile;
    if (!profile) {
      res.status(400).json({ error: "Soil profile data is required" });
      return;
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
      climateRegion,
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
              description: "Agronomic summary of the soil and potential limitations for this crop.",
            },
            npkStatus: {
              type: Type.OBJECT,
              properties: {
                n: { type: Type.STRING, description: "Must be 'deficient', 'optimal', or 'excess'" },
                p: { type: Type.STRING, description: "Must be 'deficient', 'optimal', or 'excess'" },
                k: { type: Type.STRING, description: "Must be 'deficient', 'optimal', or 'excess'" },
              },
              required: ["n", "p", "k"],
            },
            recommendedFertilizers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Fertilizer name (e.g., Urea, Compost, DAP)" },
                  type: { type: Type.STRING, description: "Must be 'organic' or 'chemical'" },
                  dosage: {
                    type: Type.STRING,
                    description: "Exact recommended dosage (e.g. 50 kg for the total plot size of " + farmArea + " " + areaUnit + ")",
                  },
                  timing: { type: Type.STRING, description: "When to apply (e.g., At transplanting, 3 weeks after sowing)" },
                  purpose: { type: Type.STRING, description: "How this helps the crop (e.g., supplies starter phosphorus for roots)" },
                },
                required: ["name", "type", "dosage", "timing", "purpose"],
              },
            },
            applicationSchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stage: { type: Type.STRING, description: "Growth stage (e.g., Seedling, Tillering)" },
                  timing: { type: Type.STRING, description: "Timing timeline (e.g., Day 15, After first weeding)" },
                  instructions: { type: Type.STRING, description: "Specific steps to take during this phase" },
                },
                required: ["stage", "timing", "instructions"],
              },
            },
            soilAmendments: {
              type: Type.STRING,
              description: "pH amendment suggestions (lime/dolomite, sulfur, gypsum) or organic booster directions.",
            },
            wateringAndTillageTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly three highly relevant agricultural best practices for this soil-crop combination.",
            },
            sustainabilityRating: {
              type: Type.INTEGER,
              description: "Rating from 1 (poor/high-runoff) to 5 (excellent organic/regenerative practice).",
            },
          },
          required: [
            "soilAnalysis",
            "npkStatus",
            "recommendedFertilizers",
            "applicationSchedule",
            "soilAmendments",
            "wateringAndTillageTips",
            "sustainabilityRating",
          ],
        },
      },
    });

    const rawText = (response as any).text ?? (response as any).output_text ?? "";
    const recommendationData = rawText ? JSON.parse(rawText) : {};

    res.status(200).json(recommendationData);
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({ error: "Failed to generate fertilizer recommendations. Please verify your API configuration." });
  }
}
