import React, { useState, useEffect, useRef } from 'react';
import { SoilProfile, FertilizerRecommendation, SavedRecord, ChatMessage } from './types';
import SoilForm from './SoilForm';
import RecommendationReport from './RecommendationReport';
import { 
  Sprout, 
  Bookmark, 
  Send, 
  Trash2, 
  Database, 
  Compass, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  Bot, 
  User, 
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  Globe,
  RefreshCcw
} from 'lucide-react';

export default function App() {
  // Application State
  const [currentProfile, setCurrentProfile] = useState<SoilProfile | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<FertilizerRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Saved logs state
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([]);
  const [selectedProfileForForm, setSelectedProfileForForm] = useState<SoilProfile | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hello, Farmer! I am your AI Agronomist companion. Once you generate a soil prescription, I can answer complex follow-up questions, describe organic pest control strategies, suggest local fertilizer alternatives, or guide your watering cycles. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Load saved records from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agrisense_saved_records');
      if (saved) {
        setSavedRecords(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to read localStorage:", e);
    }
  }, []);

  // Save records to localStorage whenever state changes
  const saveToLocalStorage = (records: SavedRecord[]) => {
    try {
      localStorage.setItem('agrisense_saved_records', JSON.stringify(records));
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
    }
  };

  // Scroll chat to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Handle Generating Fertilizer Recommendation
  const handleGenerateRecommendation = async (profile: SoilProfile) => {
    setIsLoading(true);
    setError(null);
    setCurrentProfile(profile);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const serverMessage = errorPayload?.error || errorPayload?.message || 'Server returned error status. Check API configuration.';
        throw new Error(serverMessage);
      }

      const data = await response.json();
      setCurrentRecommendation(data);
      
      // Auto-inject a context message to the chat indicating report generation
      const systemNote: ChatMessage = {
        id: `system-note-${Date.now()}`,
        sender: 'agent',
        text: `🌱 I have successfully analyzed your ${profile.soilType} soil sample for growing ${profile.cropType}! The custom Fertilizer Blueprint is ready on your dashboard. Ask me anything about this recommendation or crop management below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, systemNote]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze soil profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save record to persistent log list
  const handleSaveRecord = (title: string) => {
    if (!currentProfile || !currentRecommendation) return;

    const newRecord: SavedRecord = {
      id: `record-${Date.now()}`,
      title: title,
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      profile: currentProfile,
      recommendation: currentRecommendation
    };

    const updated = [newRecord, ...savedRecords];
    setSavedRecords(updated);
    saveToLocalStorage(updated);
  };

  // Delete persistent log record
  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRecords.filter(r => r.id !== id);
    setSavedRecords(updated);
    saveToLocalStorage(updated);
  };

  // Restore/Load a saved record back into the viewport
  const handleLoadRecord = (record: SavedRecord) => {
    setCurrentProfile(record.profile);
    setCurrentRecommendation(record.recommendation);
    setSelectedProfileForForm(record.profile);
    
    // Add a chat notice
    setChatMessages(prev => [
      ...prev,
      {
        id: `system-restore-${Date.now()}`,
        sender: 'agent',
        text: `📂 Loaded saved soil prescription "${record.title}" into active monitoring dashboard.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Check if current loaded report is already saved
  const isCurrentReportSaved = () => {
    if (!currentProfile || !currentRecommendation) return false;
    // Check if there is an exact match in logs
    return savedRecords.some(r => 
      r.profile.nLevel === currentProfile.nLevel &&
      r.profile.pLevel === currentProfile.pLevel &&
      r.profile.kLevel === currentProfile.kLevel &&
      r.profile.cropType === currentProfile.cropType &&
      r.profile.soilType === currentProfile.soilType
    );
  };

  // Handle Sending Chat Messages to the AI Agronomist Companion
  const handleSendChat = async (messageText: string) => {
    if (!messageText.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Re-map messages to pass as simplified history to the backend endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          history: chatMessages.slice(-10), // Pass last 10 messages for context
          profile: currentProfile // Pass current soil profile context if loaded
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'agent',
        text: data.text || "I was unable to process that specific inquiry. Please ask another agronomy question.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'agent',
          text: "⚠️ Apologies, I could not connect to the Agronomist server. Please verify your internet connection or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Quick inquiry chips for chat
  const chatPromptChips = [
    { label: "🍂 Best organic N sources", text: "What are the best organic fertilizer sources to replenish low Soil Nitrogen?" },
    { label: "🚰 Drip irrigation frequency", text: "What watering frequency and drip irrigation system should I use for my crop profile?" },
    { label: "🔬 Fix acidic soil pH", text: "How do I amend highly acidic soil pH naturally, and what are the application intervals?" },
    { label: "🐛 Natural pest control", text: "What organic pest management practices are recommended for this crop?" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[45rem] h-[45rem] rounded-full bg-emerald-500/5 blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[35rem] h-[35rem] rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Main Header Bento Card */}
        <header className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4">
            <div className="bg-emerald-950 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-center shadow-inner shadow-emerald-900/40">
              <Sprout className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-light tracking-tight text-slate-100">AgriSense <span className="font-bold text-emerald-400">AI</span></h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Precise Crop Nutrition
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                State-of-the-art agronomy AI providing high-precision fertilizer prescription models, pH buffering calculus, and crop diagnostics.
              </p>
            </div>
          </div>

          {/* Telemetry Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full md:w-auto text-xs font-mono">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Telemetry</span>
                <span className="text-slate-300">Live Active</span>
              </div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Model Engine</span>
                <span className="text-slate-300">3.5 Flash</span>
              </div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 col-span-2 md:col-span-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Database</span>
                <span className="text-slate-300">Soil Doctor v2</span>
              </div>
            </div>
          </div>
        </header>

        {/* Outer Grid Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (form, presets, logs) - Span 5 */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            
            {/* The primary input form */}
            <SoilForm 
              onSubmit={handleGenerateRecommendation} 
              isLoading={isLoading} 
              selectedProfile={selectedProfileForForm}
            />

            {/* Persistent Telemetry Logs History Bento Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="saved-records-container">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-slate-200">Prescription Archive & Logs</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                  {savedRecords.length} Saved Plans
                </span>
              </div>

              {savedRecords.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800/50 p-4">
                  <Bookmark className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No soil logs archived in this environment yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Generate a recommendation and click "Save Report" to persist locally.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[295px] overflow-y-auto pr-1">
                  {savedRecords.map((record) => {
                    const isSelected = currentProfile && 
                      currentProfile.nLevel === record.profile.nLevel &&
                      currentProfile.pLevel === record.profile.pLevel &&
                      currentProfile.cropType === record.profile.cropType;

                    return (
                      <div
                        key={record.id}
                        onClick={() => handleLoadRecord(record)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                          isSelected 
                            ? 'bg-emerald-950/30 border-emerald-500/40 shadow-inner' 
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                              {record.title}
                            </h4>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                            <span className="capitalize text-slate-400">{record.profile.cropType}</span>
                            <span>•</span>
                            <span className="capitalize">{record.profile.soilType}</span>
                            <span>•</span>
                            <span>{record.profile.farmArea} {record.profile.areaUnit === 'acres' ? 'Ac' : record.profile.areaUnit === 'hectares' ? 'Ha' : '㎡'}</span>
                          </div>
                          <span className="block text-[9px] text-slate-600 font-mono mt-1">
                            {record.timestamp}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleDeleteRecord(record.id, e)}
                          className="p-1.5 rounded-xl hover:bg-slate-800/80 text-slate-500 hover:text-red-400 transition-all cursor-pointer opacity-80 group-hover:opacity-100 ml-2"
                          title="Delete archived report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (diagnostic display, chatbot) - Span 7 */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            
            {/* Live Recommendation Output */}
            <div className="min-h-[400px]">
              {isLoading ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
                  {/* Glowing backdrop circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl animate-pulse"></div>
                  
                  {/* Scanner Graphic */}
                  <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center mb-6 relative shadow-inner">
                    <Sprout className="w-8 h-8 text-emerald-400 animate-bounce" />
                    <div className="absolute -inset-1 rounded-full border-2 border-dashed border-emerald-500/20 animate-spin"></div>
                  </div>

                  <h3 className="text-lg font-light tracking-wide text-slate-100">Prescription Engine Booting</h3>
                  <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
                    AgriSense AI is synthesizing chemical and organic compound values, modeling agricultural kinetics, and formulating optimized crop schedules...
                  </p>

                  {/* Simulated loading ticks */}
                  <div className="w-full max-w-xs space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 font-mono text-left text-[10px] text-slate-500">
                    <div className="flex justify-between">
                      <span className="text-emerald-500">▶ INITIALIZING MODEL</span>
                      <span className="text-emerald-400 font-bold">OK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-500">▶ READING SOIL MACRONUTRIENTS</span>
                      <span className="text-emerald-400 font-bold">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 animate-pulse">▶ MODELING NITROGEN KINETICS</span>
                      <span className="text-emerald-400 animate-pulse">CALC</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>pH Buffer Calculus Engine active</span>
                      <span>v2.5</span>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-slate-900 border border-red-900/30 rounded-3xl p-8 shadow-xl text-center flex flex-col items-center justify-center min-h-[460px]">
                  <div className="bg-red-950/60 p-4 rounded-full border border-red-500/30 text-red-400 mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-red-400">Diagnostic Calculation Failed</h3>
                  <p className="text-xs text-slate-400 max-w-md mt-2">
                    {error}
                  </p>
                  <button
                    onClick={() => handleGenerateRecommendation(currentProfile!)}
                    className="mt-6 bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-xl text-xs transition-colors font-semibold border border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Retry Diagnostic
                  </button>
                </div>
              ) : currentRecommendation && currentProfile ? (
                <RecommendationReport 
                  recommendation={currentRecommendation} 
                  profile={currentProfile}
                  onSaveRecord={handleSaveRecord}
                  isSaved={isCurrentReportSaved()}
                />
              ) : (
                /* Sleek Initial Placeholder Bento Box */
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl min-h-[460px] flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div>
                    <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-3 py-1 rounded-full font-mono uppercase tracking-wider inline-block">
                      Awaiting Diagnostic Input
                    </span>
                    
                    <h3 className="text-3xl font-light tracking-tight mt-4 text-slate-100">
                      Real-time Soil Telemetry <br />
                      <span className="font-semibold text-emerald-400">Prescription Matrix</span>
                    </h3>
                    
                    <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
                      This diagnostic block will render your custom crop-nutrition blueprints, ecological rating index, fertilizer quantity scalers, and growth timelines.
                    </p>
                  </div>

                  {/* Grid tips inside placeholder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Compass className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-semibold text-xs text-slate-200">How to begin</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Input custom nitrogen, phosphorus, and potassium levels from a soil test kit, or select one of our pre-built agricultural presets.
                      </p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-semibold text-xs text-slate-200">Scale on-the-fly</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Adjust target plot boundaries dynamically. The diagnostic module recalculates chemical and organic weight profiles automatically.
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/80 pt-4">
                    <span>AGRI-SENSE PREDICTION SYSTEMS v2.5</span>
                    <span>ONLINE ● STATUS READY</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Agronomist Interactive Chat Widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between" id="chat-container">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-200">AI Agronomist Chat Companion</h3>
                      <p className="text-[10px] text-slate-500">Context-Aware Advisory Service</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>

                {/* Suggestions / Prompt Chips */}
                <div className="mb-4">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-2">Suggested Agronomy Inquiries</span>
                  <div className="flex flex-wrap gap-2">
                    {chatPromptChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChat(chip.text)}
                        className="bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 px-3 py-1.5 rounded-full text-[10px] text-slate-300 font-medium cursor-pointer transition-all flex items-center gap-1 shrink-0"
                      >
                        {chip.label}
                        <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Message Scroll Window */}
                <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-4 h-[280px] overflow-y-auto space-y-3 mb-4 scrollbar-thin">
                  {chatMessages.map((msg) => {
                    const isBot = msg.sender === 'agent';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex gap-2 max-w-[85%] ${
                          isBot ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                        }`}
                      >
                        {/* Sender Icon */}
                        <div className={`w-6.5 h-6.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                          isBot 
                            ? 'bg-emerald-950 border-emerald-500/30 text-emerald-400' 
                            : 'bg-slate-900 border-slate-700 text-slate-200'
                        }`}>
                          {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>

                        {/* Speech Bubble */}
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed font-sans whitespace-pre-line ${
                          isBot 
                            ? 'bg-slate-900 border border-slate-850 text-slate-300 rounded-tl-none' 
                            : 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none'
                        }`}>
                          {msg.text}
                          <span className={`block text-[9px] mt-1 ${isBot ? 'text-slate-500' : 'text-slate-900/60'} font-mono`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Loading placeholder */}
                  {isChatLoading && (
                    <div className="flex gap-2 max-w-[80%] mr-auto text-left">
                      <div className="w-6.5 h-6.5 rounded-lg border bg-emerald-950 border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl rounded-tl-none text-xs text-slate-500 font-mono animate-pulse">
                        AgriSense expert consulting...
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>
              </div>

              {/* Chat Input Bar */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat(chatInput);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={currentProfile ? "Ask about custom NPK, organic pest options, tillage..." : "Type custom crop advice or agricultural query..."}
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className={`px-4 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                    !chatInput.trim() || isChatLoading
                      ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold hover:shadow-lg hover:shadow-emerald-500/20'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
