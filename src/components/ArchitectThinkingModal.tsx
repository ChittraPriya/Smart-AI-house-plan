import React, { useState } from 'react';
import { HousePlanData } from '../../server';
import { BrainCircuit, Sparkles, Send, X, ShieldAlert, CheckCircle, Lightbulb, Compass } from 'lucide-react';

interface ArchitectThinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: HousePlanData;
}

const SAMPLE_QUESTIONS = [
  'How to configure load-bearing columns and footings for future 3rd floor expansion?',
  'Deep Vastu Shastra audit: Harmonic elemental balance of Agni (Kitchen), Nirruthi (Master), and Ishanya (Pooja)',
  'Passive solar and aerodynamic cross-draft design to minimize air conditioning electricity by 50%',
  'Material comparison & cost trade-off: AAC Lightweight Blocks vs Red Clay Bricks vs Monolithic Concrete',
];

export const ArchitectThinkingModal: React.FC<ArchitectThinkingModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('gemini-4-argon (ThinkingLevel.HIGH)');

  if (!isOpen) return null;

  const handleAsk = async (qText?: string) => {
    const finalQuestion = qText || question;
    if (!finalQuestion.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/architect-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: finalQuestion,
          planContext: {
            plotLength: plan.plotLength,
            plotBreadth: plan.plotBreadth,
            facingDirection: plan.facingDirection,
            floors: plan.floors,
            bedrooms: plan.bedrooms,
            architecturalStyle: plan.architecturalStyle,
            estimatedCost: plan.estimatedCost,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thinking analysis failed');
      }

      setResponse(data.answer);
      if (data.modelUsed) {
        setModelUsed(
          data.modelUsed === 'gemini-4-argon'
            ? 'gemini-4-argon (ThinkingLevel.HIGH)'
            : 'gemini-3.8-flash (Detailed Structural Mode)'
        );
      }
    } catch (err: unknown) {
      console.error('Architect thinking error:', err);
      setResponse(
        err instanceof Error
          ? `Analysis note: ${err.message}`
          : 'High-thinking architectural analysis failed to complete.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl p-6 md:p-8 my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold rounded-md mb-1">
              <span>{modelUsed}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              High-Thinking Architectural & Structural Consultation
            </h2>
          </div>
        </div>

        {/* Context Strip */}
        <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-stone-300 mb-5 gap-2">
          <span>Plot: {plan.plotLength}' × {plan.plotBreadth}' ({plan.facingDirection} Facing)</span>
          <span>{plan.floors} Floors • {plan.bedrooms} BHK</span>
          <span className="text-amber-400 font-bold">Est: ₹ {plan.estimatedCost.toLocaleString()}</span>
        </div>

        {/* Query Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-stone-300 mb-1.5">
            Ask a Complex Structural, Civil, or Vastu Shastra Question
          </label>
          <div className="relative">
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans pr-24"
              placeholder="E.g. Column grid alignment for future vertical expansion..."
            />
            <button
              onClick={() => handleAsk()}
              disabled={isLoading || !question.trim()}
              className="absolute right-2.5 bottom-3 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Analyze</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sample Prompt Chips */}
        <div className="mb-5">
          <span className="text-[11px] text-stone-400 block mb-1.5">Preset Expert Queries:</span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUESTIONS.map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => {
                  setQuestion(sq);
                  handleAsk(sq);
                }}
                className="text-[10px] bg-stone-800/80 hover:bg-stone-750 text-stone-300 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-stone-750 text-left transition-all"
              >
                💡 {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Response Area */}
        <div className="flex-1 overflow-y-auto bg-stone-950 rounded-2xl border border-stone-800 p-5 text-xs text-stone-200 leading-relaxed font-sans min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="font-bold text-amber-300 text-sm">Thinking Mode Active (Level: HIGH)...</span>
              <p className="text-[11px] text-stone-400 max-w-sm mt-1">
                Evaluating structural deflection, beam moments, wind pressure dynamics, and Vastu directional matrix.
              </p>
            </div>
          ) : response ? (
            <div className="whitespace-pre-wrap space-y-3 font-sans">
              {response}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
              <p>Select a preset question above or ask any architectural query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
