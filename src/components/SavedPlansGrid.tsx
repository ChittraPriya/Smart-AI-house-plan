import React from 'react';
import { HousePlanData } from '../../server';
import { Building, Trash2, ArrowUpRight, Calendar, Compass, Layers, CheckCircle } from 'lucide-react';

interface SavedPlansGridProps {
  plans: HousePlanData[];
  onSelectPlan: (plan: HousePlanData) => void;
  onDeletePlan?: (planId: string) => void;
  onOpenGenerator: () => void;
}

// Curated architectural preview images for saved cards
const ARCHITECTURAL_THUMBNAILS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=700&q=80',
];

export const SavedPlansGrid: React.FC<SavedPlansGridProps> = ({
  plans,
  onSelectPlan,
  onDeletePlan,
  onOpenGenerator,
}) => {
  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
            Saved House Plans
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Manage your saved house plans, explore versions, and continue editing anytime.
          </p>
        </div>

        <button
          onClick={onOpenGenerator}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Create New Plan</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      {plans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <Building className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No saved plans yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-6">
            Generate your first smart architectural house plan, customize rooms, and click "Save Plan" to store it in your account.
          </p>
          <button
            onClick={onOpenGenerator}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl shadow-sm"
          >
            Start Designing Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const thumbnail = ARCHITECTURAL_THUMBNAILS[index % ARCHITECTURAL_THUMBNAILS.length];

            return (
              <div
                key={plan.id}
                className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                    <img
                      src={thumbnail}
                      alt={plan.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-stone-900/80 backdrop-blur-md text-amber-300 text-[10px] font-mono font-bold rounded-lg border border-stone-700">
                      {plan.bedrooms} BHK • {plan.floors} {plan.floors === 1 ? 'Floor' : 'Floors'}
                    </div>

                    {/* Cost pill */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-amber-500 text-stone-950 text-xs font-mono font-bold rounded-lg shadow">
                      ₹ {plan.estimatedCost.toLocaleString()}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-stone-900 text-base mb-1.5 group-hover:text-amber-700 transition-colors">
                      {plan.title}
                    </h3>

                    {/* Quick Specs */}
                    <p className="text-xs font-mono text-stone-600 flex items-center gap-1.5 mb-3">
                      <span>
                        {plan.plotLength} ft × {plan.plotBreadth} ft
                      </span>
                      <span>•</span>
                      <span>{plan.floors} {plan.floors === 1 ? 'Floor' : 'Floors'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Compass className="w-3 h-3 text-amber-600" />
                        {plan.facingDirection}
                      </span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] py-2.5 border-t border-stone-100">
                      <div>
                        <span className="text-stone-400 block">Built-up Area</span>
                        <span className="font-semibold text-stone-800">
                          {plan.totalBuiltUpAreaSqFt.toLocaleString()} sq ft
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Style</span>
                        <span className="font-semibold text-stone-800 truncate block">
                          {plan.architecturalStyle}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl transition-all text-center"
                  >
                    View Plan
                  </button>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    Edit
                  </button>

                  {onDeletePlan && (
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
