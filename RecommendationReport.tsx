import React, { useState } from 'react';
import { FertilizerRecommendation, SoilProfile, SavedRecord } from '../types';
import { 
  CheckCircle, 
  AlertTriangle, 
  Droplets, 
  Info, 
  Bookmark, 
  Scale, 
  Leaf, 
  Star, 
  HelpCircle, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface RecommendationReportProps {
  recommendation: FertilizerRecommendation;
  profile: SoilProfile;
  onSaveRecord: (title: string) => void;
  isSaved: boolean;
}

export default function RecommendationReport({ 
  recommendation, 
  profile, 
  onSaveRecord,
  isSaved
}: RecommendationReportProps) {
  const [saveTitle, setSaveTitle] = useState('');
  const [scaleArea, setScaleArea] = useState<number>(profile.farmArea);
  const [showSaveBox, setShowSaveBox] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    onSaveRecord(saveTitle);
    setShowSaveBox(false);
    setSaveTitle('');
  };

  // Helper to parse fertilizer dose and dynamically scale it based on current slider value
  const getScaledDosage = (dosageStr: string) => {
    if (scaleArea === profile.farmArea) return dosageStr;
    
    // Look for numbers followed by common units (kg, bags, tons, lbs, g)
    const numRegex = /(\d+(?:\.\d+)?)\s*(kg|bags|bag|tons|ton|lbs|lb|g|grams)/i;
    const match = dosageStr.match(numRegex);
    if (match) {
      const originalAmount = parseFloat(match[1]);
      const unit = match[2];
      const scaledAmount = ((originalAmount / profile.farmArea) * scaleArea).toFixed(1);
      // Replace the original with the scaled amount
      return dosageStr.replace(numRegex, `${scaledAmount} ${unit}`);
    }
    return `${dosageStr} (Proportional scale for ${scaleArea} ${profile.areaUnit})`;
  };

  const getStatusColor = (status: 'deficient' | 'optimal' | 'excess') => {
    switch (status) {
      case 'deficient': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'optimal': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'excess': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const getStatusLabel = (status: 'deficient' | 'optimal' | 'excess') => {
    switch (status) {
      case 'deficient': return '⚠️ Deficient';
      case 'optimal': return '✅ Optimal';
      case 'excess': return '📈 Excess';
    }
  };

  return (
    <div className="space-y-6" id="recommendation-report">
      {/* Overview Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-0 top-0 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6 relative z-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/20 px-3 py-1 rounded-full">
              AI Recommendation Ready
            </span>
            <h2 className="text-3xl font-light mt-3 tracking-tight">Fertilizer Blueprint</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Custom-tailored crop nutrition schedule for growing <strong className="text-emerald-400 capitalize font-semibold">{profile.cropType}</strong> in <strong className="text-emerald-400 capitalize font-semibold">{profile.soilType} soil</strong> ({profile.farmArea} {profile.areaUnit}).
            </p>
          </div>

          <div className="flex gap-2">
            {!isSaved ? (
              <button
                onClick={() => setShowSaveBox(!showSaveBox)}
                className="bg-slate-950 hover:bg-slate-800 text-slate-100 hover:text-emerald-400 text-xs font-semibold py-2 px-4 rounded-full border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Save Report to Logs
              </button>
            ) : (
              <span className="bg-emerald-500/25 text-emerald-400 text-xs font-semibold py-2 px-4 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Saved to Logs
              </span>
            )}
          </div>
        </div>

        {/* Inline Save Popup */}
        {showSaveBox && (
          <form onSubmit={handleSave} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 my-4 space-y-3 relative z-20">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Save soil profile with a description</h4>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g., Front Yard Barley, High Acidic Clay Log"
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Confirm Save
              </button>
            </div>
          </form>
        )}

        {/* NPK Quick Indicator Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800 relative z-10">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Soil pH balance</span>
            <span className="text-2xl font-light text-slate-100 block mt-1 font-mono">{profile.phLevel.toFixed(1)}</span>
            <span className="text-[11px] text-emerald-400 block mt-1.5 font-medium">
              {profile.phLevel < 6.0 ? 'Acidic - Lime needed' : profile.phLevel > 7.5 ? 'Alkaline - Gypsum needed' : 'Optimal pH range'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Nitrogen (N)</span>
            <span className="text-2xl font-light text-slate-100 block mt-1 font-mono">{profile.nLevel} ppm</span>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-2 border ${
              profile.nLevel < 50 ? 'bg-red-500/20 text-red-400 border-red-500/30' : profile.nLevel > 150 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {profile.nLevel < 50 ? 'Deficient' : profile.nLevel > 150 ? 'Excess' : 'Optimal'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Phosphorus (P)</span>
            <span className="text-2xl font-light text-slate-100 block mt-1 font-mono">{profile.pLevel} ppm</span>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-2 border ${
              profile.pLevel < 15 ? 'bg-red-500/20 text-red-400 border-red-500/30' : profile.pLevel > 50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {profile.pLevel < 15 ? 'Deficient' : profile.pLevel > 50 ? 'Excess' : 'Optimal'}
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Potassium (K)</span>
            <span className="text-2xl font-light text-slate-100 block mt-1 font-mono">{profile.kLevel} ppm</span>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-2 border ${
              profile.kLevel < 100 ? 'bg-red-500/20 text-red-400 border-red-500/30' : profile.kLevel > 250 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {profile.kLevel < 100 ? 'Deficient' : profile.kLevel > 250 ? 'Excess' : 'Optimal'}
            </span>
          </div>
        </div>
      </div>

      {/* Soil Analysis & Eco Rating side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 rounded-3xl p-6 border border-slate-800">
          <h3 className="font-bold text-slate-100 text-sm mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            Agronomic Soil Diagnosis
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {recommendation.soilAnalysis}
          </p>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm mb-2 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              Sustainability Rating
            </h3>
            <div className="flex gap-1.5 my-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= recommendation.sustainabilityRating
                      ? 'text-emerald-400 fill-emerald-400'
                      : 'text-slate-800'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {recommendation.sustainabilityRating >= 4 
                ? 'Excellent plan! This includes high-quality organic supplements, reducing synthetic runoff risks, maintaining pH stability, and conserving soil microbial health.'
                : 'This recommendation focuses heavily on quick mineral correction. We suggest introducing organic matter or cover crops to improve carbon balance over time.'}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 mt-4 border-t border-slate-800 pt-3 font-mono">
            Eco Score: {recommendation.sustainabilityRating}/5
          </div>
        </div>
      </div>

      {/* Fertilizer Dose Scaler Calculator Tool */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400 animate-pulse" />
              Interactive Fertilizer Quantity Scaler
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              AI formulated the dosages for a plot size of <strong>{profile.farmArea} {profile.areaUnit}</strong>. Use the slider below to scale the dosage for your actual target plot size instantly!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-center shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Scaled Plot Area</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {scaleArea} {profile.areaUnit}
              </span>
            </div>
          </div>
        </div>

        {/* Scaling slider */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-xs text-slate-500 font-mono">0.1</span>
          <input
            type="range"
            min="0.1"
            max={Math.max(15, profile.farmArea * 3)}
            step="0.1"
            value={scaleArea}
            onChange={(e) => setScaleArea(parseFloat(e.target.value) || 1)}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-xs text-slate-500 font-mono">{(profile.farmArea * 3).toFixed(0)}</span>
          
          {scaleArea !== profile.farmArea && (
            <button
              onClick={() => setScaleArea(profile.farmArea)}
              className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1 rounded-full transition-all cursor-pointer font-mono"
            >
              Reset to Base
            </button>
          )}
        </div>
      </div>

      {/* Recommended Fertilizers */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
        <h3 className="font-bold text-slate-100 text-sm mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Recommended Nutrients & Fertilizers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendation.recommendedFertilizers.map((fert, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:border-slate-700 bg-slate-950/40 border-slate-800`}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-slate-100 text-sm">{fert.name}</h4>
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    fert.type === 'organic'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {fert.type}
                  </span>
                </div>
                
                {/* Dynamically Scaled Dose Display */}
                <div className="mt-3.5 flex items-center gap-1.5 bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 w-full">
                  <span className="text-slate-500 text-xs font-medium">Amt Needed:</span>
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    {getScaledDosage(fert.dosage)}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  <strong className="text-slate-300">Purpose:</strong> {fert.purpose}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Apply: {fert.timing}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Soil Amendments Section */}
      {recommendation.soilAmendments && (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800/80">
          <h3 className="font-bold text-slate-100 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            pH & Physical Amendments
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
            {recommendation.soilAmendments}
          </p>
        </div>
      )}

      {/* Chronological Application Schedule */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
        <h3 className="font-bold text-slate-100 text-sm mb-6 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Chronological Crop Growth & Fertilizer Schedule
        </h3>

        <div className="relative pl-6 border-l border-slate-800 space-y-6">
          {recommendation.applicationSchedule.map((stage, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-slate-900 border-2 border-emerald-500 group-hover:scale-110 transition-transform flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  {stage.timing}
                </span>
                <h4 className="font-bold text-slate-200 text-sm mt-2">{stage.stage}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {stage.instructions}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Practical Agronomic Tips */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
        <h3 className="font-bold text-slate-100 text-sm mb-3.5 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-emerald-400" />
          Watering, Tillage & Management Tips
        </h3>
        <ul className="space-y-3">
          {recommendation.wateringAndTillageTips.map((tip, idx) => (
            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
              <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
