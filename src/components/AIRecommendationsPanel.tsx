import React from 'react';
import { HousePlanData } from '../../server';
import { Wind, Sun, Maximize, CircleDollarSign, CheckCircle, ShieldCheck, Sparkles, Building, Compass } from 'lucide-react';

interface AIRecommendationsPanelProps {
  plan: HousePlanData;
}

export const AIRecommendationsPanel: React.FC<AIRecommendationsPanelProps> = ({ plan }) => {
  const { recommendations, costBreakdown, estimatedCost } = plan;

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-sm h-full overflow-y-auto">
      {/* Title */}
      <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-stone-900 text-base">AI Architectural Insights</h3>
      </div>

      {/* AI Recommendation Cards */}
      <div className="space-y-3">
        {/* Best Ventilation */}
        <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-white rounded-xl border border-emerald-100/80 transition-all hover:shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 mt-0.5">
              <Wind className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900">
                  {recommendations?.ventilation?.title || 'Optimal Cross Ventilation'}
                </h4>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                  {recommendations?.ventilation?.score || 94}% Flow
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                {recommendations?.ventilation?.description ||
                  'North-South window alignment ensures continuous natural draft and decreases cooling needs.'}
              </p>
            </div>
          </div>
        </div>

        {/* Natural Lighting */}
        <div className="p-3.5 bg-gradient-to-br from-amber-50/70 to-white rounded-xl border border-amber-100/80 transition-all hover:shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 mt-0.5">
              <Sun className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900">
                  {recommendations?.naturalLighting?.title || 'Natural Daylighting'}
                </h4>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                  {recommendations?.naturalLighting?.score || 92}% Light
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                {recommendations?.naturalLighting?.description ||
                  'Large windows in living and bedrooms maximize early sun hours without solar heat build-up.'}
              </p>
            </div>
          </div>
        </div>

        {/* Space Utilization */}
        <div className="p-3.5 bg-gradient-to-br from-blue-50/70 to-white rounded-xl border border-blue-100/80 transition-all hover:shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700 mt-0.5">
              <Maximize className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900">
                  {recommendations?.spaceUtilization?.title || 'Space Efficiency'}
                </h4>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                  {plan.usableAreaPercentage || 84}% Usable
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                {recommendations?.spaceUtilization?.description ||
                  'Minimal dead corridor circulation with ergonomic furniture zoning throughout.'}
              </p>
            </div>
          </div>
        </div>

        {/* Vastu Shastra */}
        <div className="p-3.5 bg-gradient-to-br from-purple-50/70 to-white rounded-xl border border-purple-100/80 transition-all hover:shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-700 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900">
                  {recommendations?.vastuCompliance?.title || 'Vastu Alignment'}
                </h4>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-full">
                  {recommendations?.vastuCompliance?.score || 94}% Pure
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                {recommendations?.vastuCompliance?.description ||
                  'Harmonious elemental alignment: Kitchen in SE, Master Suite in SW, Entrance oriented to positive energy.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Estimation Breakdown */}
      <div className="mt-1 p-4 bg-stone-900 text-stone-100 rounded-xl border border-stone-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-stone-300 text-xs font-medium">
            <CircleDollarSign className="w-4 h-4 text-amber-400" />
            <span>Estimated Construction Cost</span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">Turnkey</span>
        </div>
        <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
          ₹ {estimatedCost.toLocaleString()}
        </div>
        <div className="text-[11px] text-stone-400 mt-0.5">
          Approx. ₹ {Math.round(estimatedCost / (plan.totalBuiltUpAreaSqFt || 1000)).toLocaleString()} / sq ft built-up
        </div>

        {/* Breakdown bar */}
        <div className="mt-3 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-stone-300">
            <span>Structure & Civil Works (45%)</span>
            <span className="font-mono">₹ {(costBreakdown?.structureAndMasonry || Math.round(estimatedCost * 0.45)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>Flooring & Tiling (15%)</span>
            <span className="font-mono">₹ {(costBreakdown?.flooringAndTiling || Math.round(estimatedCost * 0.15)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>Electrical & Plumbing (13%)</span>
            <span className="font-mono">₹ {(costBreakdown?.electricalAndPlumbing || Math.round(estimatedCost * 0.13)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>Finishing & Painting (13%)</span>
            <span className="font-mono">₹ {(costBreakdown?.paintingAndFinishing || Math.round(estimatedCost * 0.13)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>Modular Kitchen & Woodwork (14%)</span>
            <span className="font-mono">₹ {(costBreakdown?.interiorsAndKitchen || Math.round(estimatedCost * 0.14)).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Project Details Table */}
      <div className="mt-1 pt-3 border-t border-stone-200">
        <h4 className="text-xs font-bold text-stone-900 mb-2.5 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-stone-600" />
          <span>Project Specifications</span>
        </h4>
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <div>
            <span className="text-stone-500 block text-[10px]">Plot Size</span>
            <span className="font-semibold text-stone-800">
              {plan.plotLength} ft × {plan.plotBreadth} ft ({plan.totalPlotAreaSqFt} sq ft)
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px]">Built-up Area</span>
            <span className="font-semibold text-stone-800">{plan.totalBuiltUpAreaSqFt} sq ft</span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px]">Configuration</span>
            <span className="font-semibold text-stone-800">
              {plan.bedrooms} BHK ({plan.floors} {plan.floors === 1 ? 'Floor' : 'Floors'})
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px]">Facing Direction</span>
            <span className="font-semibold text-stone-800 flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-600" />
              {plan.facingDirection} Facing
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px]">Kitchen Design</span>
            <span className="font-semibold text-stone-800">{plan.kitchenType}</span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px]">Style</span>
            <span className="font-semibold text-stone-800">{plan.architecturalStyle}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
