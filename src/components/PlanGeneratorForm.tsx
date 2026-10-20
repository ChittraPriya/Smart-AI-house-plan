import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, Home, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export interface PlanFormData {
  plotLength: number;
  plotBreadth: number;
  facingDirection: string;
  budgetRange: string;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  kitchenType: string;
  architecturalStyle: string;
  additionalPreferences: string[];
}

interface PlanGeneratorFormProps {
  initialData?: Partial<PlanFormData>;
  onGenerate: (data: PlanFormData) => Promise<void>;
  isGenerating: boolean;
}

const CHECKLIST_STEPS = [
  'Analyzing plot size & direction',
  'Optimizing space & ventilation',
  'Adding natural light & Vastu orientation',
  'Designing 2D floor plan',
  'Creating 3D interactive model',
  'Calculating estimated cost',
];

export const PlanGeneratorForm: React.FC<PlanGeneratorFormProps> = ({
  initialData,
  onGenerate,
  isGenerating,
}) => {
  const [formData, setFormData] = useState<PlanFormData>({
    plotLength: initialData?.plotLength || 40,
    plotBreadth: initialData?.plotBreadth || 30,
    facingDirection: initialData?.facingDirection || 'East',
    budgetRange: initialData?.budgetRange || '₹ 20 Lakhs - ₹ 40 Lakhs',
    floors: initialData?.floors || 2,
    bedrooms: initialData?.bedrooms || 3,
    bathrooms: initialData?.bathrooms || 2,
    kitchenType: initialData?.kitchenType || 'Modular Kitchen',
    architecturalStyle: initialData?.architecturalStyle || 'Modern Contemporary',
    additionalPreferences: initialData?.additionalPreferences || [
      'Living Room',
      'Dining Room',
      'Pooja Room',
      'Car Parking',
      'Balcony',
    ],
  });

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setActiveStepIndex(0);
      setProgressPercent(10);
      interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 95) return prev;
          const next = prev + Math.floor(Math.random() * 12) + 6;
          const step = Math.min(
            CHECKLIST_STEPS.length - 1,
            Math.floor((next / 100) * CHECKLIST_STEPS.length)
          );
          setActiveStepIndex(step);
          return Math.min(96, next);
        });
      }, 350);
    } else {
      setProgressPercent(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const togglePreference = (pref: string) => {
    setFormData((prev) => {
      const exists = prev.additionalPreferences.includes(pref);
      return {
        ...prev,
        additionalPreferences: exists
          ? prev.additionalPreferences.filter((p) => p !== pref)
          : [...prev.additionalPreferences, pref],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const plotArea = formData.plotLength * formData.plotBreadth;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/90 p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>Design Your Home</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Tell us about your plot and preferences. Our AI will create the optimal 2D and 3D architectural plan for you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plot Details Group */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-amber-600" />
                <span>Plot Details</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Plot Length (ft)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="15"
                      max="300"
                      value={formData.plotLength}
                      onChange={(e) =>
                        setFormData({ ...formData, plotLength: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-stone-400">
                      ft
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Plot Breadth (ft)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="15"
                      max="300"
                      value={formData.plotBreadth}
                      onChange={(e) =>
                        setFormData({ ...formData, plotBreadth: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-stone-400">
                      ft
                    </span>
                  </div>
                </div>
              </div>

              {/* Total plot area calculation tag */}
              <div className="mt-2.5 flex items-center justify-between text-xs px-3 py-1.5 bg-amber-50/80 text-amber-900 rounded-lg border border-amber-200/60 font-mono">
                <span>Calculated Plot Area:</span>
                <span className="font-bold">{plotArea.toLocaleString()} sq ft</span>
              </div>
            </div>

            {/* Facing Direction & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-stone-500" />
                  <span>Facing Direction</span>
                </label>
                <select
                  value={formData.facingDirection}
                  onChange={(e) => setFormData({ ...formData, facingDirection: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                >
                  <option value="East">East (Auspicious / Morning Sun)</option>
                  <option value="North">North (Kubera / Wealth)</option>
                  <option value="North-East">North-East (Ishanya / Divine)</option>
                  <option value="West">West (Varuna / Sunset)</option>
                  <option value="South">South (Yama / Energy)</option>
                  <option value="North-West">North-West (Vayu / Breeze)</option>
                  <option value="South-East">South-East (Agni / Fire)</option>
                  <option value="South-West">South-West (Nirruthi / Earth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Budget Range
                </label>
                <select
                  value={formData.budgetRange}
                  onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                >
                  <option value="₹ 15 Lakhs - ₹ 25 Lakhs">₹ 15 Lakhs - ₹ 25 Lakhs (Affordable)</option>
                  <option value="₹ 20 Lakhs - ₹ 40 Lakhs">₹ 20 Lakhs - ₹ 40 Lakhs (Standard)</option>
                  <option value="₹ 40 Lakhs - ₹ 60 Lakhs">₹ 40 Lakhs - ₹ 60 Lakhs (Premium)</option>
                  <option value="₹ 60 Lakhs - ₹ 1 Crore">₹ 60 Lakhs - ₹ 1 Crore (Luxury)</option>
                  <option value="₹ 1 Crore - ₹ 2 Crore">₹ 1 Crore - ₹ 2 Crore (Estate Villa)</option>
                  <option value="₹ 2 Crore+">₹ 2 Crore+ (Ultra Luxury)</option>
                </select>
              </div>
            </div>

            {/* House Configuration */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>House Configuration</span>
              </h3>

              {/* Floors selection */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Number of Floors
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[1, 2, 3].map((floorNum) => (
                    <button
                      key={floorNum}
                      type="button"
                      onClick={() => setFormData({ ...formData, floors: floorNum })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        formData.floors === floorNum
                          ? 'bg-stone-900 text-amber-300 border-stone-900 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {floorNum} {floorNum === 1 ? 'Floor' : 'Floors'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Bedrooms
                  </label>
                  <select
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  >
                    <option value={1}>1 BHK (Compact)</option>
                    <option value={2}>2 BHK (Standard)</option>
                    <option value={3}>3 BHK (Family Suite)</option>
                    <option value={4}>4 BHK (Spacious Luxury)</option>
                    <option value={5}>5 BHK (Grand Villa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Bathrooms
                  </label>
                  <select
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  >
                    <option value={1}>1 Bathroom</option>
                    <option value={2}>2 Bathrooms</option>
                    <option value={3}>3 Bathrooms</option>
                    <option value={4}>4+ Bathrooms</option>
                  </select>
                </div>
              </div>

              {/* Kitchen Type & Architectural Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Kitchen Type
                  </label>
                  <select
                    value={formData.kitchenType}
                    onChange={(e) => setFormData({ ...formData, kitchenType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  >
                    <option value="Modular Kitchen">Modular Kitchen (Modern)</option>
                    <option value="Open Concept">Open Concept Kitchen</option>
                    <option value="Traditional Closed">Traditional Closed Kitchen</option>
                    <option value="Island Kitchen">Island Kitchen with Breakfast Bar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Aesthetic Style
                  </label>
                  <select
                    value={formData.architecturalStyle}
                    onChange={(e) =>
                      setFormData({ ...formData, architecturalStyle: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  >
                    <option value="Modern Contemporary">Modern Contemporary</option>
                    <option value="Minimalist Luxury">Minimalist Luxury</option>
                    <option value="Traditional Vastu Villa">Traditional Vastu Villa</option>
                    <option value="Tropical Modern">Tropical Modern (Biophilic)</option>
                    <option value="Classic Elegance">Classic Elegance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Preferences Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-2.5">
                Additional Preferences & Spaces
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Living Room',
                  'Dining Room',
                  'Pooja Room',
                  'Car Parking',
                  'Balcony',
                  'Garden',
                  'Home Office',
                  'Terrace Gazebo',
                  'Vastu Compliant',
                ].map((pref) => {
                  const isChecked = formData.additionalPreferences.includes(pref);
                  return (
                    <label
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-semibold'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>{pref}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>AI Designing Your Home Plan...</span>
                </>
              ) : (
                <>
                  <span>Generate Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* AI Generator Live Status Panel (Right) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-stone-900 to-stone-950 text-stone-100 rounded-2xl border border-stone-800 p-6 md:p-8 shadow-xl flex flex-col justify-between min-h-[540px]">
          <div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center mb-4">
              <Home className="w-6 h-6 text-amber-400" />
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight mb-1">
              {isGenerating ? 'AI is Designing for You...' : 'Smart Architectural Engine'}
            </h3>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed">
              HomeAI generates precise 2D blueprints, calculates structural load tolerances, checks Vastu alignments, and creates interactive 3D spatial models in seconds.
            </p>

            {/* Checklist items */}
            <div className="space-y-3.5">
              {CHECKLIST_STEPS.map((step, idx) => {
                const isDone = isGenerating ? idx <= activeStepIndex : true;
                const isCurrent = isGenerating && idx === activeStepIndex;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 text-xs transition-all ${
                      isDone
                        ? 'text-stone-200 font-medium'
                        : 'text-stone-500 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        isDone
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-stone-800 text-stone-400'
                      } ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-900 animate-pulse' : ''}`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Animated Circular Progress Meter */}
          <div className="mt-8 pt-6 border-t border-stone-800/80 flex flex-col items-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-stone-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-amber-400 transition-all duration-300 ease-out"
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-mono text-white">
                  {progressPercent}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-400">
                  {isGenerating ? 'Synthesizing' : 'Ready'}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-400 mt-4 text-center italic">
              {isGenerating
                ? 'Generating your dream house blueprint...'
                : 'Configure specifications and click Generate Plan.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
