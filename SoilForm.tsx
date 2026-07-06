import React, { useState } from 'react';
import { SoilProfile, SoilType, CropType } from '../types';
import { Sprout, HelpCircle, Compass, Layers, Sliders, RefreshCw } from 'lucide-react';

interface SoilFormProps {
  onSubmit: (profile: SoilProfile) => void;
  isLoading: boolean;
  selectedProfile?: SoilProfile | null;
}

const cropOptions: { value: CropType; label: string; icon: string; typicalNpk: string }[] = [
  { value: 'rice', label: 'Rice (Paddy)', icon: '🌾', typicalNpk: 'High Nitrogen, Moderate Phosphorus' },
  { value: 'wheat', label: 'Wheat', icon: '🍞', typicalNpk: 'Moderate Nitrogen, Moderate Phosphorus' },
  { value: 'corn', label: 'Corn / Maize', icon: '🌽', typicalNpk: 'Very High Nitrogen & Potassium' },
  { value: 'cotton', label: 'Cotton', icon: '☁️', typicalNpk: 'High Nitrogen, High Potassium' },
  { value: 'sugarcane', label: 'Sugarcane', icon: '🎋', typicalNpk: 'High Nitrogen, Very High Potassium' },
  { value: 'vegetables', label: 'Vegetables (Tomato, Potato, etc.)', icon: '🍅', typicalNpk: 'Balanced NPK, High Organic Matter' },
  { value: 'fruits', label: 'Fruits (Citrus, Mango, etc.)', icon: '🍊', typicalNpk: 'Moderate Nitrogen, High Potassium' },
  { value: 'pulses', label: 'Pulses (Beans, Lentils)', icon: '🌱', typicalNpk: 'Low Nitrogen (Nitrogen-Fixing), Moderate P' },
  { value: 'tea_coffee', label: 'Tea & Coffee', icon: '☕', typicalNpk: 'High Nitrogen, Acidic Soil Preferred' },
];

const soilOptions: { value: SoilType; label: string; description: string }[] = [
  { value: 'loamy', label: 'Loamy Soil', description: 'Optimal balance of sand, silt, and clay. Retains moisture and nutrients well.' },
  { value: 'clay', label: 'Clay Soil', description: 'Fine-grained, heavy soil. Highly compact, rich in nutrients but poorly draining.' },
  { value: 'sandy', label: 'Sandy Soil', description: 'Coarse-grained. Drains extremely rapidly, low nutrient retention capacity.' },
  { value: 'silt', label: 'Silt Soil', description: 'Smooth, medium-grained. Retains moisture well, highly fertile but easily compacted.' },
  { value: 'peaty', label: 'Peaty Soil', description: 'Spongy, dark soil. High in organic matter, highly acidic, excels in moisture.' },
  { value: 'saline', label: 'Saline Soil', description: 'High soluble salt content. Restricts water absorption, requires careful amendments.' },
];

const presets: { label: string; profile: SoilProfile; description: string }[] = [
  {
    label: "Low-Nitrogen Sandy Maize Plot",
    description: "Depleted sandy soil in a tropical region needing immediate nitrogen and potassium boost.",
    profile: {
      soilType: 'sandy',
      cropType: 'corn',
      nLevel: 15,
      pLevel: 22,
      kLevel: 80,
      phLevel: 6.2,
      moistureLevel: 'low',
      organicMatter: 'low',
      farmArea: 2,
      areaUnit: 'acres',
      climateRegion: 'Tropical Sub-humid'
    }
  },
  {
    label: "Optimal Paddy Field",
    description: "Well-balanced loamy clay soil preparing for wet season rice cultivation.",
    profile: {
      soilType: 'loamy',
      cropType: 'rice',
      nLevel: 90,
      pLevel: 35,
      kLevel: 180,
      phLevel: 6.5,
      moistureLevel: 'high',
      organicMatter: 'high',
      farmArea: 5,
      areaUnit: 'acres',
      climateRegion: 'Tropical Monsoon'
    }
  },
  {
    label: "Acidic Clay Fruit Orchard",
    description: "Highly acidic, tight clay soil limiting phosphorus and potassium uptake.",
    profile: {
      soilType: 'clay',
      cropType: 'fruits',
      nLevel: 55,
      pLevel: 12,
      kLevel: 110,
      phLevel: 5.2,
      moistureLevel: 'moderate',
      organicMatter: 'medium',
      farmArea: 1.5,
      areaUnit: 'acres',
      climateRegion: 'Temperate Maritime'
    }
  }
];

export default function SoilForm({ onSubmit, isLoading, selectedProfile }: SoilFormProps) {
  const [soilType, setSoilType] = useState<SoilType>('loamy');
  const [cropType, setCropType] = useState<CropType>('corn');
  const [nLevel, setNLevel] = useState<number>(45);
  const [pLevel, setPLevel] = useState<number>(20);
  const [kLevel, setKLevel] = useState<number>(120);
  const [phLevel, setPhLevel] = useState<number>(6.5);
  const [moistureLevel, setMoistureLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [organicMatter, setOrganicMatter] = useState<'low' | 'medium' | 'high'>('medium');
  const [farmArea, setFarmArea] = useState<number>(1);
  const [areaUnit, setAreaUnit] = useState<'acres' | 'hectares' | 'sq_meters'>('acres');
  const [climateRegion, setClimateRegion] = useState<string>('Tropical');

  const applyPreset = (preset: SoilProfile) => {
    setSoilType(preset.soilType);
    setCropType(preset.cropType);
    setNLevel(preset.nLevel);
    setPLevel(preset.pLevel);
    setKLevel(preset.kLevel);
    setPhLevel(preset.phLevel);
    setMoistureLevel(preset.moistureLevel);
    setOrganicMatter(preset.organicMatter);
    setFarmArea(preset.farmArea);
    setAreaUnit(preset.areaUnit);
    setClimateRegion(preset.climateRegion);
  };

  React.useEffect(() => {
    if (selectedProfile) {
      applyPreset(selectedProfile);
    }
  }, [selectedProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
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
    });
  };

  // Get color for pH indicator
  const getPhColor = (ph: number) => {
    if (ph < 5.5) return 'bg-red-500 text-white'; // Acidic
    if (ph < 6.0) return 'bg-orange-400 text-gray-900'; // Moderately acidic
    if (ph <= 7.2) return 'bg-emerald-500 text-white'; // Optimal Neutral
    if (ph < 8.0) return 'bg-blue-400 text-white'; // Slightly Alkaline
    return 'bg-purple-600 text-white'; // Strongly Alkaline
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden" id="soil-form-container">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center text-slate-100">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-base tracking-tight text-slate-100">Soil & Crop Profiler</h2>
        </div>
        <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">
          Agent Engine v2.5
        </span>
      </div>

      <div className="p-6">
        {/* Quick Presets Bar */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Load Quick Presets for Analysis
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset.profile)}
                className="text-left p-3.5 rounded-2xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
                  <span>{preset.label}</span>
                  <RefreshCw className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Crop and Soil selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                Target Crop
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" title="The crop you are aiming to fertilize" />
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value as CropType)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all cursor-pointer"
              >
                {cropOptions.map((crop) => (
                  <option key={crop.value} value={crop.value}>
                    {crop.icon} {crop.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-400 mt-2 pl-1 italic font-mono">
                💡 Typical Needs: {cropOptions.find(c => c.value === cropType)?.typicalNpk}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                Soil Type
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" title="Physical classification of your soil texture" />
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all cursor-pointer"
              >
                {soilOptions.map((soil) => (
                  <option key={soil.value} value={soil.value}>
                    🪵 {soil.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-2 pl-1 line-clamp-1 leading-relaxed">
                {soilOptions.find(s => s.value === soilType)?.description}
              </p>
            </div>
          </div>

          {/* Section 2: Farm Area & Climate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Plot/Farm Area Size
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={farmArea}
                onChange={(e) => setFarmArea(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Area Unit
              </label>
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value as 'acres' | 'hectares' | 'sq_meters')}
                className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
                <option value="sq_meters">Sq. Meters (㎡)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Climate / Region
              </label>
              <input
                type="text"
                value={climateRegion}
                onChange={(e) => setClimateRegion(e.target.value)}
                placeholder="e.g., Tropical Monsoon"
                className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Section 3: Nutrient Test Sliders */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Soil Macronutrients (N-P-K) & pH levels
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl">
              {/* Nitrogen */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Nitrogen (N)
                  </span>
                  <span className="font-mono font-bold text-blue-400 bg-blue-950/60 border border-blue-900/30 px-2 py-0.5 rounded-full">
                    {nLevel} ppm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={nLevel}
                  onChange={(e) => setNLevel(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Deficient (&lt;50)</span>
                  <span>Optimal (50-150)</span>
                  <span>High (&gt;150)</span>
                </div>
              </div>

              {/* Phosphorus */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    Phosphorus (P)
                  </span>
                  <span className="font-mono font-bold text-red-400 bg-red-950/60 border border-red-900/30 px-2 py-0.5 rounded-full">
                    {pLevel} ppm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pLevel}
                  onChange={(e) => setPLevel(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Deficient (&lt;15)</span>
                  <span>Optimal (15-50)</span>
                  <span>High (&gt;50)</span>
                </div>
              </div>

              {/* Potassium */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Potassium (K)
                  </span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-900/30 px-2 py-0.5 rounded-full">
                    {kLevel} ppm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={kLevel}
                  onChange={(e) => setKLevel(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Deficient (&lt;100)</span>
                  <span>Optimal (100-250)</span>
                  <span>High (&gt;250)</span>
                </div>
              </div>

              {/* pH Level */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Soil pH
                  </span>
                  <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs text-slate-100 ${
                    phLevel < 5.5 ? 'bg-red-500/30' : phLevel < 6.0 ? 'bg-orange-500/30' : phLevel <= 7.2 ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/20' : phLevel < 8.0 ? 'bg-blue-500/30' : 'bg-purple-600/30'
                  }`}>
                    {phLevel.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="9.0"
                  step="0.1"
                  value={phLevel}
                  onChange={(e) => setPhLevel(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Acidic (&lt;5.5)</span>
                  <span>Neutral (6.0-7.2)</span>
                  <span>Alkaline (&gt;7.5)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Moisture and Organic matter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Soil Moisture Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'moderate', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMoistureLevel(level)}
                    className={`py-2.5 rounded-xl text-xs font-semibold capitalize border cursor-pointer transition-all ${
                      moistureLevel === level
                        ? 'bg-emerald-600 text-slate-950 border-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    💧 {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Organic Matter content
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setOrganicMatter(level)}
                    className={`py-2.5 rounded-xl text-xs font-semibold capitalize border cursor-pointer transition-all ${
                      organicMatter === level
                        ? 'bg-emerald-600 text-slate-950 border-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    🍂 {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 rounded-xl text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
              isLoading
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 hover:translate-y-[-1px] hover:shadow-emerald-500/20 active:translate-y-0'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AgriSense Engine running diagnostic...
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                Generate AI Fertilizer Recommendation
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
