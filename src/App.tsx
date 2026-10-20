import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from './firebase';
import { HousePlanData } from '../server';
import {
  savePlanToFirestore,
  fetchUserPlans,
  deletePlanFromFirestore,
  subscribeToUserPlans,
} from './services/planService';
import { exportPlanToPDF } from './utils/pdfExport';
import { FloorPlan2D } from './components/FloorPlan2D';
import { HouseVisualization3D } from './components/HouseVisualization3D';
import { AIRecommendationsPanel } from './components/AIRecommendationsPanel';
import { PlanGeneratorForm, PlanFormData } from './components/PlanGeneratorForm';
import { PlanComparisonModal } from './components/PlanComparisonModal';
import { SavedPlansGrid } from './components/SavedPlansGrid';
import { VeoVideoModal } from './components/VeoVideoModal';
import { ArchitectThinkingModal } from './components/ArchitectThinkingModal';
import {
  Home,
  Sparkles,
  Download,
  BookmarkCheck,
  SplitSquareVertical,
  Video,
  BrainCircuit,
  LogIn,
  LogOut,
  Layers,
  Eye,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CircleDollarSign,
  Maximize2,
  Menu,
  X,
} from 'lucide-react';

export default function App() {
  // Navigation tabs: 'home' | 'generate' | 'studio' | 'saved'
  const [activeTab, setActiveTab] = useState<'home' | 'generate' | 'studio' | 'saved'>('home');
  // Studio sub-view: '2d' | '3d'
  const [studioView, setStudioView] = useState<'2d' | '3d'>('2d');
  const [activeFloor, setActiveFloor] = useState<number>(1);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // House Plans State
  const [currentPlan, setCurrentPlan] = useState<HousePlanData | null>(null);
  const [comparisonPlans, setComparisonPlans] = useState<HousePlanData[]>([]);
  const [savedPlans, setSavedPlans] = useState<HousePlanData[]>([]);

  // Generation loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Modals state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isVeoOpen, setIsVeoOpen] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initial Boot: Listen to Firebase Auth and load initial plan
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Subscribe to user saved plans in Firestore
        const unsubscribeFirestore = subscribeToUserPlans(currentUser.uid, (plans) => {
          setSavedPlans(plans);
        });
        return () => unsubscribeFirestore();
      }
    });

    // Generate initial showcase plan so user sees instant high-fidelity plan
    generateDefaultPlan();

    return () => unsubscribeAuth();
  }, []);

  const generateDefaultPlan = async () => {
    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plotLength: 40,
          plotBreadth: 30,
          facingDirection: 'East',
          budgetRange: '₹ 20 Lakhs - ₹ 40 Lakhs',
          floors: 2,
          bedrooms: 3,
          bathrooms: 2,
          kitchenType: 'Modular Kitchen',
          architecturalStyle: 'Modern Contemporary',
          additionalPreferences: ['Living Room', 'Dining Room', 'Pooja Room', 'Car Parking', 'Balcony'],
        }),
      });
      const data = await res.json();
      if (data.selectedPlan) {
        setCurrentPlan(data.selectedPlan);
        setComparisonPlans(data.comparisons || [data.selectedPlan]);
      }
    } catch (e) {
      console.error('Failed to generate initial plan:', e);
    }
  };

  const handleGeneratePlan = async (formData: PlanFormData) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');

      if (data.selectedPlan) {
        setCurrentPlan(data.selectedPlan);
        setComparisonPlans(data.comparisons || [data.selectedPlan]);
        setActiveTab('studio');
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#C5A059', '#1A1D20', '#10B981'],
        });
      }
    } catch (err: unknown) {
      console.error('Generation failed:', err);
      alert(err instanceof Error ? err.message : 'Plan generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!currentPlan) return;
    if (!user) {
      try {
        await loginWithGoogle();
      } catch (err) {
        return;
      }
    }

    try {
      await savePlanToFirestore(currentPlan);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });
      setSaveSuccessNotice('Plan securely saved to your HomeAI cloud account!');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err: unknown) {
      console.error('Save failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to save plan');
    }
  };

  const handleExportPDF = () => {
    if (!currentPlan) return;
    exportPlanToPDF(currentPlan);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved plan?')) return;
    try {
      await deletePlanFromFirestore(planId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans selection:bg-amber-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-900 to-stone-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-400 stroke-current fill-none" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 flex items-center">
                Home<span className="text-amber-600">AI</span>
              </span>
              <span className="hidden sm:block text-[9px] font-mono tracking-wider text-stone-400 uppercase">
                Smart House Architect
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-2xl border border-stone-200/80 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'home'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'generate'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Generate Plan
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'studio'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>House Plan Studio</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'saved'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Saved Plans ({savedPlans.length})
            </button>
          </nav>

          {/* Action CTAs & Auth */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Veo Video Button */}
            <button
              onClick={() => setIsVeoOpen(true)}
              className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-semibold rounded-xl border border-stone-800 shadow-sm transition-all flex items-center gap-1.5"
              title="Generate cinematic walkthrough video with Veo"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Veo Walkthrough</span>
            </button>

            {/* High Thinking Architect Button */}
            {currentPlan && (
              <button
                onClick={() => setIsThinkingOpen(true)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-xl border border-amber-200 transition-all flex items-center gap-1.5"
                title="Deep structural and Vastu thinking analysis (Gemini 4 Argon)"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-amber-600" />
                <span>Thinking Architect</span>
              </button>
            )}

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-amber-500/50 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-300 font-bold text-xs flex items-center justify-center">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={logoutUser}
                  className="p-2 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-2">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-stone-800 rounded-lg hover:bg-stone-100"
            >
              Home
            </button>
            <button
              onClick={() => {
                setActiveTab('generate');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-stone-800 rounded-lg hover:bg-stone-100"
            >
              Generate Plan
            </button>
            <button
              onClick={() => {
                setActiveTab('studio');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-stone-800 rounded-lg hover:bg-stone-100"
            >
              House Plan Studio
            </button>
            <button
              onClick={() => {
                setActiveTab('saved');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-stone-800 rounded-lg hover:bg-stone-100"
            >
              Saved Plans ({savedPlans.length})
            </button>
            <button
              onClick={() => {
                setIsVeoOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-sm font-semibold text-amber-700 rounded-lg hover:bg-amber-50 flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Veo Video Walkthrough</span>
            </button>
            {user ? (
              <button
                onClick={() => {
                  logoutUser();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user.email})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  loginWithGoogle();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Save Success Notice Banner */}
      {saveSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-center text-xs font-semibold shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* 1. HERO TAB */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Section Banner matching showcase */}
            <div className="relative rounded-3xl bg-gradient-to-r from-[#1A1D20] via-stone-900 to-[#2A2E33] text-white p-8 md:p-14 overflow-hidden shadow-2xl border border-stone-800">
              {/* Background architectural image overlay */}
              <div
                className="absolute inset-0 opacity-25 mix-blend-overlay bg-cover bg-center"
                style={{
                  backgroundImage: `url('public/assets/aistudio/HomeAI_Smart_House_Plan_Showcase_2e58ca2c.png')`,
                }}
              />

              <div className="relative z-10 max-w-2xl">
                {/* Script Tagline */}
                <span className="font-serif italic text-amber-300 text-lg md:text-xl tracking-wide block mb-2">
                  Your Dream Home, Our AI Design
                </span>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-4">
                  AI-Powered <br />
                  Smart House{' '}
                  <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                    Plan Generator
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
                  Turn your dream home into a perfect plan. Get intelligent 2D & 3D house designs
                  based on your plot size, budget, preferences, and lifestyle.
                </p>

                {/* 4 Feature Pills from mockup */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-left">
                    <Sparkles className="w-5 h-5 text-amber-400 mb-1.5" />
                    <h4 className="text-xs font-bold text-white">Smart Planning</h4>
                    <p className="text-[10px] text-stone-400">AI optimized layouts</p>
                  </div>

                  <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-left">
                    <Eye className="w-5 h-5 text-amber-400 mb-1.5" />
                    <h4 className="text-xs font-bold text-white">2D & 3D Views</h4>
                    <p className="text-[10px] text-stone-400">Visualize your home</p>
                  </div>

                  <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-left">
                    <CircleDollarSign className="w-5 h-5 text-amber-400 mb-1.5" />
                    <h4 className="text-xs font-bold text-white">Cost Estimation</h4>
                    <p className="text-[10px] text-stone-400">Stay within budget</p>
                  </div>

                  <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-left">
                    <BookmarkCheck className="w-5 h-5 text-amber-400 mb-1.5" />
                    <h4 className="text-xs font-bold text-white">Save & Edit</h4>
                    <p className="text-[10px] text-stone-400">Your plans anytime</p>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="py-3.5 px-8 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-stone-950 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <span>Start Designing</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveTab('studio')}
                    className="py-3.5 px-6 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-xl border border-white/15 backdrop-blur-md transition-all flex items-center gap-2"
                  >
                    <span>Explore Current Plan Studio</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Preview Showcase of the Current Ready Plan */}
            {currentPlan && (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      Featured Architectural Showcase
                    </span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-1">{currentPlan.title}</h2>
                    <p className="text-xs text-stone-500 font-mono mt-0.5">
                      {currentPlan.plotLength} ft × {currentPlan.plotBreadth} ft •{' '}
                      {currentPlan.totalBuiltUpAreaSqFt} sq ft built-up • {currentPlan.facingDirection} Facing
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('studio');
                        setStudioView('2d');
                      }}
                      className="px-4 py-2 bg-stone-900 text-amber-300 font-bold text-xs rounded-xl shadow-sm"
                    >
                      Open 2D Blueprint
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('studio');
                        setStudioView('3d');
                      }}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl"
                    >
                      Interactive 3D Model
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[480px]">
                  <div className="lg:col-span-7 h-full">
                    <FloorPlan2D
                      rooms={currentPlan.rooms}
                      plotLength={currentPlan.plotLength}
                      plotBreadth={currentPlan.plotBreadth}
                      facingDirection={currentPlan.facingDirection}
                      totalFloors={currentPlan.floors}
                      activeFloor={activeFloor}
                      onFloorChange={setActiveFloor}
                    />
                  </div>
                  <div className="lg:col-span-5 h-full">
                    <AIRecommendationsPanel plan={currentPlan} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. GENERATE PLAN TAB */}
        {activeTab === 'generate' && (
          <PlanGeneratorForm
            initialData={currentPlan || undefined}
            onGenerate={handleGeneratePlan}
            isGenerating={isGenerating}
          />
        )}

        {/* 3. STUDIO TAB (matches "Your House Plan is Ready! 🪄") */}
        {activeTab === 'studio' && currentPlan && (
          <div className="space-y-5">
            {/* Studio Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
                    Your House Plan is Ready! 🪄
                  </h2>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                    {currentPlan.bedrooms} BHK
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Here is your AI-generated 2D floor plan, 3D interactive view and smart environmental insights.
                </p>
              </div>

              {/* Action Buttons from showcase top right */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 2D / 3D Switcher */}
                <div className="flex items-center p-1 bg-stone-100 rounded-xl mr-1">
                  <button
                    onClick={() => setStudioView('2d')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      studioView === '2d'
                        ? 'bg-stone-900 text-amber-300 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>2D Floor Plan</span>
                  </button>
                  <button
                    onClick={() => setStudioView('3d')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      studioView === '3d'
                        ? 'bg-stone-900 text-amber-300 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>3D View</span>
                  </button>
                </div>

                {/* Compare Plans */}
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                  title="Compare 3 plan variations"
                >
                  <SplitSquareVertical className="w-3.5 h-3.5 text-stone-600" />
                  <span className="hidden sm:inline">Compare</span>
                </button>

                {/* Veo Video */}
                <button
                  onClick={() => setIsVeoOpen(true)}
                  className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  title="Animate into Veo Video"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Veo Video</span>
                </button>

                {/* High Thinking Architect */}
                <button
                  onClick={() => setIsThinkingOpen(true)}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold rounded-xl border border-purple-200 transition-all flex items-center gap-1.5"
                  title="Deep structural and Vastu thinking analysis"
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">Thinking Mode</span>
                </button>

                {/* Save Plan Button (Pill in Gold from mockup) */}
                <button
                  onClick={handleSavePlan}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Save Plan</span>
                </button>

                {/* Download PDF Button */}
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Split Grid: Left (2D or 3D view), Right (AI Recommendations) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
              {/* Studio Canvas Area (7 Cols) */}
              <div className="lg:col-span-7 h-full flex flex-col">
                {studioView === '2d' ? (
                  <FloorPlan2D
                    rooms={currentPlan.rooms}
                    plotLength={currentPlan.plotLength}
                    plotBreadth={currentPlan.plotBreadth}
                    facingDirection={currentPlan.facingDirection}
                    totalFloors={currentPlan.floors}
                    activeFloor={activeFloor}
                    onFloorChange={setActiveFloor}
                  />
                ) : (
                  <HouseVisualization3D
                    rooms={currentPlan.rooms}
                    plotLength={currentPlan.plotLength}
                    plotBreadth={currentPlan.plotBreadth}
                    floors={currentPlan.floors}
                    architecturalStyle={currentPlan.architecturalStyle}
                    onCaptureSnapshot={(img) => setSnapshotImage(img)}
                    onGenerateWalkthroughVideo={(img) => {
                      setSnapshotImage(img);
                      setIsVeoOpen(true);
                    }}
                  />
                )}
              </div>

              {/* AI Recommendations & Specifications Column (5 Cols) */}
              <div className="lg:col-span-5 h-full">
                <AIRecommendationsPanel plan={currentPlan} />
              </div>
            </div>
          </div>
        )}

        {/* 4. SAVED PLANS TAB */}
        {activeTab === 'saved' && (
          <SavedPlansGrid
            plans={savedPlans.length > 0 ? savedPlans : comparisonPlans}
            onSelectPlan={(p) => {
              setCurrentPlan(p);
              setActiveTab('studio');
            }}
            onDeletePlan={handleDeletePlan}
            onOpenGenerator={() => setActiveTab('generate')}
          />
        )}
      </main>

      {/* Plan Comparison Modal */}
      <PlanComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        plans={comparisonPlans.length > 0 ? comparisonPlans : currentPlan ? [currentPlan] : []}
        selectedPlanId={currentPlan?.id || ''}
        onSelectPlan={(p) => {
          setCurrentPlan(p);
          setActiveTab('studio');
        }}
      />

      {/* Veo Video Walkthrough Modal */}
      <VeoVideoModal
        isOpen={isVeoOpen}
        onClose={() => setIsVeoOpen(false)}
        defaultImage={snapshotImage}
      />

      {/* Architect High-Thinking Consultation Modal */}
      {currentPlan && (
        <ArchitectThinkingModal
          isOpen={isThinkingOpen}
          onClose={() => setIsThinkingOpen(false)}
          plan={currentPlan}
        />
      )}

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">HomeAI</span>
            <span>•</span>
            <span>Build Smart. Design Better. Live Happier.</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Powered by Gemini AI & Veo</span>
            <span>•</span>
            <span>Firestore Persistence</span>
            <span>•</span>
            <span>Three.js 3D Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
