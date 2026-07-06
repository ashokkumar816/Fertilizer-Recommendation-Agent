export type SoilType = 'clay' | 'loamy' | 'sandy' | 'silt' | 'peaty' | 'saline';

export type CropType = 
  | 'rice' 
  | 'wheat' 
  | 'corn' 
  | 'cotton' 
  | 'sugarcane' 
  | 'vegetables' 
  | 'fruits' 
  | 'pulses' 
  | 'tea_coffee';

export interface SoilProfile {
  soilType: SoilType;
  cropType: CropType;
  nLevel: number; // Nitrogen in ppm or mg/kg (optimal ~50-150)
  pLevel: number; // Phosphorus in ppm (optimal ~15-50)
  kLevel: number; // Potassium in ppm (optimal ~100-250)
  phLevel: number; // 0-14
  moistureLevel: 'low' | 'moderate' | 'high';
  organicMatter: 'low' | 'medium' | 'high';
  farmArea: number;
  areaUnit: 'acres' | 'hectares' | 'sq_meters';
  climateRegion: string; // e.g., Tropical, Temperate, Arid
}

export interface FertilizerItem {
  name: string;
  type: 'organic' | 'chemical';
  dosage: string; // e.g., "50 kg/acre"
  timing: string; // e.g., "At planting / Basal"
  purpose: string; // e.g., "Boosts root development"
}

export interface ScheduleStage {
  stage: string; // e.g., "Land Preparation", "Sowing", "Vegetative", "Flowering"
  timing: string; // e.g., "Day 0", "Day 25"
  instructions: string;
}

export interface FertilizerRecommendation {
  soilAnalysis: string;
  npkStatus: {
    n: 'deficient' | 'optimal' | 'excess';
    p: 'deficient' | 'optimal' | 'excess';
    k: 'deficient' | 'optimal' | 'excess';
  };
  recommendedFertilizers: FertilizerItem[];
  applicationSchedule: ScheduleStage[];
  soilAmendments: string; // pH corrections, gypsum, lime, organic additions
  wateringAndTillageTips: string[];
  sustainabilityRating: number; // 1-5 rating on environmental impact of advice
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface SavedRecord {
  id: string;
  title: string;
  timestamp: string;
  profile: SoilProfile;
  recommendation: FertilizerRecommendation;
}
