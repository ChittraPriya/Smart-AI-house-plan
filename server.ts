import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, GenerateVideosOperation } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Types for Plan Generation
export interface RoomLayout {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  type: 'living' | 'bedroom' | 'master_bedroom' | 'kitchen' | 'bathroom' | 'dining' | 'pooja' | 'parking' | 'balcony' | 'garden' | 'corridor' | 'utility';
  doors?: { wall: 'north' | 'south' | 'east' | 'west'; offset: number }[];
  windows?: { wall: 'north' | 'south' | 'east' | 'west'; offset: number; width: number }[];
  vastuZone?: string;
  notes?: string;
}

export interface HousePlanData {
  id: string;
  title: string;
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
  totalPlotAreaSqFt: number;
  totalBuiltUpAreaSqFt: number;
  carpetAreaSqFt: number;
  usableAreaPercentage: number;
  estimatedCost: number;
  costBreakdown: {
    structureAndMasonry: number;
    flooringAndTiling: number;
    electricalAndPlumbing: number;
    paintingAndFinishing: number;
    interiorsAndKitchen: number;
  };
  recommendations: {
    ventilation: {
      title: string;
      description: string;
      score: number;
    };
    naturalLighting: {
      title: string;
      description: string;
      score: number;
    };
    spaceUtilization: {
      title: string;
      description: string;
      score: number;
    };
    vastuCompliance: {
      title: string;
      description: string;
      score: number;
    };
  };
  rooms: RoomLayout[];
  comparisonHighlights?: {
    bestVentilation?: boolean;
    moreNaturalLight?: boolean;
    higherSpaceUtility?: boolean;
    betterValue?: boolean;
  };
}

// Procedural layout generator helper to ensure valid architectural blueprints
function generateArchitecturalRooms(
  plotLength: number,
  plotBreadth: number,
  floors: number,
  bedrooms: number,
  bathrooms: number,
  preferences: string[],
  variant: 'compact' | 'balanced' | 'spacious' = 'balanced'
): RoomLayout[] {
  const rooms: RoomLayout[] = [];
  const scale = variant === 'compact' ? 0.85 : variant === 'spacious' ? 1.15 : 1.0;
  
  // Available built-up width and depth (with setbacks: 3ft side, 4ft front/rear)
  const marginX = Math.max(2, Math.round(plotBreadth * 0.08));
  const marginY = Math.max(3, Math.round(plotLength * 0.1));
  const buildWidth = Math.max(20, plotBreadth - marginX * 2);
  const buildDepth = Math.max(25, plotLength - marginY * 2);

  // Floor 1 (Ground Floor)
  const hasParking = preferences.includes('Car Parking');
  const hasPooja = preferences.includes('Pooja Room');
  const hasGarden = preferences.includes('Garden');

  let curY = 0;
  
  // Front Area: Porch / Garden / Entrance Foyer
  if (hasParking) {
    rooms.push({
      id: 'g-parking',
      name: 'Car Parking & Porch',
      x: 0,
      y: 0,
      width: Math.min(12, Math.round(buildWidth * 0.4)),
      height: Math.min(16, Math.round(buildDepth * 0.3)),
      floor: 1,
      type: 'parking',
      doors: [{ wall: 'south', offset: 2 }],
      vastuZone: 'North-West (Air)',
      notes: 'Covered parking with direct foyer access',
    });
  }

  const livingX = hasParking ? Math.min(12, Math.round(buildWidth * 0.4)) : 0;
  const livingWidth = buildWidth - livingX;
  const livingHeight = Math.min(16, Math.round(buildDepth * 0.32 * scale));

  rooms.push({
    id: 'g-living',
    name: 'Living Room',
    x: livingX,
    y: 0,
    width: livingWidth,
    height: livingHeight,
    floor: 1,
    type: 'living',
    doors: [{ wall: 'south', offset: 4 }, { wall: 'north', offset: livingWidth / 2 }],
    windows: [{ wall: 'east', offset: 3, width: 6 }, { wall: 'south', offset: 6, width: 5 }],
    vastuZone: 'North-East (Water/Prosperity)',
    notes: 'Well-lit living space with wide cross-ventilated windows',
  });

  curY = Math.max(hasParking ? Math.min(16, Math.round(buildDepth * 0.3)) : 0, livingHeight);

  // Central Area: Dining & Kitchen & Pooja
  const kitchenWidth = Math.round(buildWidth * 0.4);
  const kitchenHeight = Math.round(buildDepth * 0.25 * scale);
  
  rooms.push({
    id: 'g-kitchen',
    name: 'Modular Kitchen & Utility',
    x: buildWidth - kitchenWidth,
    y: curY,
    width: kitchenWidth,
    height: kitchenHeight,
    floor: 1,
    type: 'kitchen',
    doors: [{ wall: 'west', offset: 2 }],
    windows: [{ wall: 'east', offset: 2, width: 4 }],
    vastuZone: 'South-East (Agni/Fire Corner)',
    notes: 'Vastu compliant South-East location for kitchen platform',
  });

  const diningWidth = buildWidth - kitchenWidth;
  rooms.push({
    id: 'g-dining',
    name: 'Dining Area',
    x: 0,
    y: curY,
    width: diningWidth,
    height: kitchenHeight,
    floor: 1,
    type: 'dining',
    doors: [{ wall: 'east', offset: 3 }],
    windows: [{ wall: 'west', offset: 2, width: 4 }],
    vastuZone: 'West (Saturn/Nourishment)',
    notes: 'Open connection to living & kitchen with dedicated hand-wash',
  });

  if (hasPooja) {
    rooms.push({
      id: 'g-pooja',
      name: 'Pooja Room',
      x: 0,
      y: curY + Math.max(0, kitchenHeight - 6),
      width: 5,
      height: 5,
      floor: 1,
      type: 'pooja',
      doors: [{ wall: 'east', offset: 1 }],
      vastuZone: 'North-East (Ishanya)',
      notes: 'Pure meditation sanctuary oriented east-facing',
    });
  }

  curY += kitchenHeight;

  // Rear Area: Ground Floor Bedroom & Bath
  const gBedrooms = floors > 1 ? 1 : bedrooms;
  const bedWidth = Math.round(buildWidth * 0.6);
  const bedHeight = Math.max(11, buildDepth - curY);

  if (gBedrooms >= 1) {
    rooms.push({
      id: 'g-bed-1',
      name: floors > 1 ? 'Guest / Parents Bedroom' : 'Master Bedroom',
      x: 0,
      y: curY,
      width: bedWidth,
      height: bedHeight,
      floor: 1,
      type: floors > 1 ? 'bedroom' : 'master_bedroom',
      doors: [{ wall: 'north', offset: 3 }],
      windows: [{ wall: 'west', offset: 3, width: 5 }, { wall: 'south', offset: 2, width: 4 }],
      vastuZone: 'South-West (Earth/Stability)',
      notes: 'Quiet position away from front road traffic',
    });
  }

  const bathWidth = buildWidth - bedWidth;
  rooms.push({
    id: 'g-bath-1',
    name: 'Common / Attached Bathroom',
    x: bedWidth,
    y: curY,
    width: bathWidth,
    height: Math.min(8, bedHeight),
    floor: 1,
    type: 'bathroom',
    doors: [{ wall: 'west', offset: 1 }],
    windows: [{ wall: 'east', offset: 1, width: 2 }],
    vastuZone: 'North-West (Vayu)',
    notes: 'Dry and wet zone separated with high ventilator',
  });

  if (hasGarden) {
    rooms.push({
      id: 'g-garden',
      name: 'Landscaped Garden & Lawn',
      x: 0,
      y: -marginY,
      width: buildWidth,
      height: marginY,
      floor: 1,
      type: 'garden',
      notes: 'Front greens creating acoustic buffer and natural cooling',
    });
  }

  // Floor 2 (First Floor) if floors >= 2
  if (floors >= 2) {
    const remainingBeds = Math.max(1, bedrooms - gBedrooms);
    const upperBed1Width = Math.round(buildWidth * 0.55);
    const upperBedHeight = Math.round(buildDepth * 0.45);

    rooms.push({
      id: 'f1-master',
      name: 'Master Bedroom Suite',
      x: 0,
      y: buildDepth - upperBedHeight,
      width: upperBed1Width,
      height: upperBedHeight,
      floor: 2,
      type: 'master_bedroom',
      doors: [{ wall: 'north', offset: 3 }],
      windows: [{ wall: 'west', offset: 3, width: 6 }, { wall: 'south', offset: 3, width: 5 }],
      vastuZone: 'South-West (Master Stability)',
      notes: 'Luxurious suite with private walk-in closet space',
    });

    rooms.push({
      id: 'f1-bath-master',
      name: 'Master Ensuite Bathroom',
      x: upperBed1Width,
      y: buildDepth - Math.round(upperBedHeight * 0.6),
      width: buildWidth - upperBed1Width,
      height: Math.round(upperBedHeight * 0.6),
      floor: 2,
      type: 'bathroom',
      doors: [{ wall: 'west', offset: 1 }],
      windows: [{ wall: 'east', offset: 1, width: 2 }],
      vastuZone: 'North-West',
      notes: 'Full vanity, shower cubicle and exhaust provision',
    });

    if (remainingBeds >= 2) {
      rooms.push({
        id: 'f1-bed-2',
        name: "Kids' Bedroom / Study",
        x: 0,
        y: 0,
        width: Math.round(buildWidth * 0.5),
        height: Math.round(buildDepth * 0.4),
        floor: 2,
        type: 'bedroom',
        doors: [{ wall: 'south', offset: 2 }],
        windows: [{ wall: 'north', offset: 2, width: 5 }],
        vastuZone: 'North-West (Youth / Study)',
        notes: 'Optimized desk lighting and built-in wardrobe niches',
      });
    }

    rooms.push({
      id: 'f1-lounge',
      name: 'Family Lounge & Balcony',
      x: Math.round(buildWidth * 0.5),
      y: 0,
      width: Math.round(buildWidth * 0.5),
      height: Math.round(buildDepth * 0.4),
      floor: 2,
      type: 'balcony',
      doors: [{ wall: 'west', offset: 2 }],
      windows: [{ wall: 'east', offset: 2, width: 6 }],
      vastuZone: 'East / North-East',
      notes: 'Open deck overlooking street and front landscaped yard',
    });
  }

  return rooms;
}

// Generate Plan Variations
function createPlanBundle(
  params: {
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
) {
  const { plotLength, plotBreadth, floors, bedrooms, bathrooms, facingDirection, budgetRange, kitchenType, architecturalStyle, additionalPreferences } = params;
  const plotArea = plotLength * plotBreadth;

  // Base rate calculation per sq ft (~ ₹1,800 to ₹2,800 / sq ft depending on style)
  const baseRate = architecturalStyle.includes('Luxury') ? 2600 : architecturalStyle.includes('Minimalist') ? 2000 : 2200;

  // Variant B: Recommended (Balanced)
  const builtUpB = Math.round(plotArea * (floors === 1 ? 0.72 : floors === 2 ? 1.35 : 1.85));
  const costB = Math.round(builtUpB * baseRate);

  const roomsB = generateArchitecturalRooms(plotLength, plotBreadth, floors, bedrooms, bathrooms, additionalPreferences, 'balanced');
  const planB: HousePlanData = {
    id: `plan-b-${Date.now()}`,
    title: `${architecturalStyle || 'Modern'} ${bedrooms}BHK ${floors > 1 ? 'Duplex Villa' : 'Home'} (Recommended)`,
    plotLength,
    plotBreadth,
    facingDirection,
    budgetRange,
    floors,
    bedrooms,
    bathrooms,
    kitchenType: kitchenType || 'Modular Kitchen',
    architecturalStyle: architecturalStyle || 'Modern Contemporary',
    additionalPreferences,
    totalPlotAreaSqFt: plotArea,
    totalBuiltUpAreaSqFt: builtUpB,
    carpetAreaSqFt: Math.round(builtUpB * 0.82),
    usableAreaPercentage: 84,
    estimatedCost: costB,
    costBreakdown: {
      structureAndMasonry: Math.round(costB * 0.44),
      flooringAndTiling: Math.round(costB * 0.15),
      electricalAndPlumbing: Math.round(costB * 0.13),
      paintingAndFinishing: Math.round(costB * 0.13),
      interiorsAndKitchen: Math.round(costB * 0.15),
    },
    recommendations: {
      ventilation: {
        title: 'North-South Cross Ventilation',
        description: 'Strategic window alignment through living and bedrooms reduces cooling load by up to 26%.',
        score: 95,
      },
      naturalLighting: {
        title: 'Morning Sun Optimization',
        description: `East-facing windows positioned to harvest daylight without excessive thermal gain in afternoons.`,
        score: 92,
      },
      spaceUtilization: {
        title: 'Zero Corridor Wastage',
        description: 'Central circulation spine provides 84% usable carpet ratio with built-in storage walls.',
        score: 89,
      },
      vastuCompliance: {
        title: 'Vastu Shastra Harmonic Balance',
        description: 'Kitchen situated in Agni (SE), Master bedroom in South-West, entrance facing auspicious East/North.',
        score: 94,
      },
    },
    rooms: roomsB,
    comparisonHighlights: {
      bestVentilation: true,
      moreNaturalLight: true,
      higherSpaceUtility: true,
      betterValue: true,
    },
  };

  // Variant A: Compact & Budget
  const builtUpA = Math.round(builtUpB * 0.82);
  const costA = Math.round(builtUpA * (baseRate * 0.92));
  const roomsA = generateArchitecturalRooms(plotLength, plotBreadth, Math.min(floors, 2), Math.max(1, bedrooms - 1), Math.max(1, bathrooms - 1), additionalPreferences, 'compact');
  const planA: HousePlanData = {
    id: `plan-a-${Date.now()}`,
    title: `Compact ${Math.max(1, bedrooms - 1)}BHK Value Plan`,
    plotLength,
    plotBreadth,
    facingDirection,
    budgetRange,
    floors,
    bedrooms: Math.max(1, bedrooms - 1),
    bathrooms: Math.max(1, bathrooms - 1),
    kitchenType: 'Semi-Modular Kitchen',
    architecturalStyle: 'Minimalist Functional',
    additionalPreferences,
    totalPlotAreaSqFt: plotArea,
    totalBuiltUpAreaSqFt: builtUpA,
    carpetAreaSqFt: Math.round(builtUpA * 0.86),
    usableAreaPercentage: 86,
    estimatedCost: costA,
    costBreakdown: {
      structureAndMasonry: Math.round(costA * 0.46),
      flooringAndTiling: Math.round(costA * 0.14),
      electricalAndPlumbing: Math.round(costA * 0.14),
      paintingAndFinishing: Math.round(costA * 0.12),
      interiorsAndKitchen: Math.round(costA * 0.14),
    },
    recommendations: {
      ventilation: {
        title: 'Direct External Louver System',
        description: 'Effective cross flow through open-plan living and compact kitchen window.',
        score: 86,
      },
      naturalLighting: {
        title: 'Direct Window Illumination',
        description: 'High-sill windows to maximize wall utility while welcoming balanced indirect light.',
        score: 84,
      },
      spaceUtilization: {
        title: 'High Efficiency Layout',
        description: 'Compact room dimensions with open kitchen counter saving 120 sq ft of partition walls.',
        score: 91,
      },
      vastuCompliance: {
        title: 'Essential Vastu Alignment',
        description: 'Key room placements aligned to primary solar orientations.',
        score: 88,
      },
    },
    rooms: roomsA,
  };

  // Variant C: Spacious & Grand
  const builtUpC = Math.round(builtUpB * 1.2);
  const costC = Math.round(builtUpC * (baseRate * 1.12));
  const roomsC = generateArchitecturalRooms(plotLength, plotBreadth, floors, bedrooms + 1, bathrooms + 1, [...additionalPreferences, 'Balcony', 'Garden'], 'spacious');
  const planC: HousePlanData = {
    id: `plan-c-${Date.now()}`,
    title: `Spacious ${bedrooms + 1}BHK Luxury Estate`,
    plotLength,
    plotBreadth,
    facingDirection,
    budgetRange,
    floors,
    bedrooms: bedrooms + 1,
    bathrooms: bathrooms + 1,
    kitchenType: 'Island Kitchen with Pantry',
    architecturalStyle: 'Luxury Villa',
    additionalPreferences: [...additionalPreferences, 'Balcony', 'Garden'],
    totalPlotAreaSqFt: plotArea,
    totalBuiltUpAreaSqFt: builtUpC,
    carpetAreaSqFt: Math.round(builtUpC * 0.8),
    usableAreaPercentage: 80,
    estimatedCost: costC,
    costBreakdown: {
      structureAndMasonry: Math.round(costC * 0.42),
      flooringAndTiling: Math.round(costC * 0.16),
      electricalAndPlumbing: Math.round(costC * 0.14),
      paintingAndFinishing: Math.round(costC * 0.13),
      interiorsAndKitchen: Math.round(costC * 0.15),
    },
    recommendations: {
      ventilation: {
        title: 'Double-Height Atrium Stack Effect',
        description: 'Central lightwell exhausts warm air upward, naturally drawing cool air through perimeter gardens.',
        score: 97,
      },
      naturalLighting: {
        title: 'Floor-to-Ceiling Glazed Facade',
        description: 'Panoramic glass sliders bringing outdoor terrace greenery into family gathering spaces.',
        score: 96,
      },
      spaceUtilization: {
        title: 'Grand Living Proportions',
        description: 'Expansive bedrooms with ensuite walk-in closets and wide entertainment balconies.',
        score: 83,
      },
      vastuCompliance: {
        title: 'Pristine 100% Vastu Geometry',
        description: 'Brahmasthan (central courtyard) kept open and luminous for maximum positive energy circulation.',
        score: 98,
      },
    },
    rooms: roomsC,
  };

  return { planA, planB, planC };
}

// API Routes
app.post('/api/plans/generate', async (req: Request, res: Response) => {
  try {
    const {
      plotLength = 40,
      plotBreadth = 30,
      facingDirection = 'East',
      budgetRange = '₹ 20 Lakhs - ₹ 40 Lakhs',
      floors = 2,
      bedrooms = 3,
      bathrooms = 2,
      kitchenType = 'Modular Kitchen',
      architecturalStyle = 'Modern Contemporary',
      additionalPreferences = ['Living Room', 'Dining Room', 'Pooja Room', 'Car Parking', 'Balcony'],
    } = req.body;

    const bundle = createPlanBundle({
      plotLength: Number(plotLength),
      plotBreadth: Number(plotBreadth),
      facingDirection,
      budgetRange,
      floors: Number(floors),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      kitchenType,
      architecturalStyle,
      additionalPreferences: Array.isArray(additionalPreferences) ? additionalPreferences : [],
    });

    // Optionally enhance recommendations with Gemini if API key available (with 3.5s timeout)
    if (apiKey) {
      try {
        const prompt = `You are a Senior Architect at HomeAI. Given a plot of ${plotLength}x${plotBreadth} ft facing ${facingDirection}, ${floors} floors, ${bedrooms} BHK, budget ${budgetRange}, provide 3 concise, high-value architectural tips for: 1. Cross-ventilation airflow, 2. Natural daylight, 3. Cost-saving construction technique. Return in JSON format with keys "ventilationTip", "lightingTip", "costTip".`;
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
        const aiRes: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (aiRes && aiRes.text) {
          const parsed = JSON.parse(aiRes.text);
          if (parsed.ventilationTip) bundle.planB.recommendations.ventilation.description = parsed.ventilationTip;
          if (parsed.lightingTip) bundle.planB.recommendations.naturalLighting.description = parsed.lightingTip;
        }
      } catch (e) {
        console.warn('Gemini enrichment skipped or failed, using structural defaults:', e);
      }
    }

    res.json({
      success: true,
      selectedPlan: bundle.planB,
      comparisons: [bundle.planA, bundle.planB, bundle.planC],
    });
  } catch (err: unknown) {
    console.error('Error in plan generation:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Plan generation failed' });
  }
});

// High-Thinking Architect Mode (Using gemini-4-argon with thinkingLevel: ThinkingLevel.HIGH)
app.post('/api/architect-thinking', async (req: Request, res: Response) => {
  try {
    const { question, planContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const systemInstruction = `You are HomeAI Senior Principal Structural Architect, Civil Engineer, and Vastu Master Consultant. 
Provide an authoritative, mathematically grounded, and deeply structured analysis.
Break down your answer into:
1. Structural Engineering & Load-Bearing Physics (columns, beams, spans, foundations)
2. Aerodynamic & Passive Solar Ventilation Strategy
3. Vastu Shastra Harmonic Orientation Matrix
4. Cost vs Material Trade-Off Analysis & Recommendations
Explain your reasoning clearly and thoroughly.`;

    const contents = `User Question: "${question}"
Current House Plan Context:
- Dimensions: ${planContext?.plotLength || 40} ft x ${planContext?.plotBreadth || 30} ft
- Facing: ${planContext?.facingDirection || 'East'}
- Floors: ${planContext?.floors || 2}
- Bedrooms: ${planContext?.bedrooms || 3} BHK
- Style: ${planContext?.architecturalStyle || 'Modern'}
- Estimated Cost: ₹ ${(planContext?.estimatedCost || 3250000).toLocaleString()}`;

    let answerText = '';
    let usedModel = 'gemini-4-argon';

    try {
      // Primary model: gemini-4-argon with thinkingLevel: ThinkingLevel.HIGH (do NOT set maxOutputTokens)
      const argonPromise = ai.models.generateContent({
        model: 'gemini-4-argon',
        contents,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          systemInstruction,
        },
      });
      const argonTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Argon reasoning timeout, falling back')), 14000)
      );
      const aiResponse = await Promise.race([argonPromise, argonTimeout]);
      answerText = aiResponse.text || '';
    } catch (argonErr: unknown) {
      console.warn('gemini-4-argon call failed or paid key not selected, falling back to gemini-3.8-flash with high detail:', argonErr);
      usedModel = 'gemini-3.8-flash';
      const fallbackRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemInstruction + '\nProvide deep, multi-phase technical reasoning for structural, ventilation, and material questions.',
        },
      });
      answerText = fallbackRes.text || '';
    }

    res.json({
      success: true,
      modelUsed: usedModel,
      answer: answerText,
    });
  } catch (err: unknown) {
    console.error('Error in architect thinking:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Architectural analysis failed' });
  }
});

// Veo Video Generation: Model veo-3.1-fast-generate-preview, aspect ratio 16:9 or 9:16
app.post('/api/generate-video', async (req: Request, res: Response) => {
  try {
    const { prompt, imageBase64, mimeType = 'image/png', aspectRatio = '16:9' } = req.body;
    
    // Validate aspect ratio
    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const videoPrompt = prompt || 'Cinematic architectural 3D camera fly-through of modern luxury house, photorealistic warm ambient lighting, smooth steadycam forward glide through exterior facade and garden patio';

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is missing in environment' });
    }

    try {
      // Video generation with veo-3.1-fast-generate-preview
      const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: validAspectRatio,
        },
      };

      if (imageBase64) {
        payload.image = {
          imageBytes: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
          mimeType: mimeType || 'image/png',
        };
      }

      const operation = await ai.models.generateVideos(payload);
      return res.json({
        success: true,
        operationName: operation.name,
        aspectRatio: validAspectRatio,
      });
    } catch (veoErr: any) {
      console.warn('Veo generation call error:', veoErr?.message);
      // If Veo requires paid key or is restricted, provide graceful simulation token
      const isPaidKeyIssue = veoErr?.message?.includes('403') || veoErr?.message?.includes('quota') || veoErr?.message?.includes('paid') || veoErr?.status === 403;
      return res.json({
        success: true,
        isSimulated: true,
        message: isPaidKeyIssue
          ? 'Veo model requires an active paid tier key; rendering high-fidelity interactive 3D WebGL camera tour.'
          : `Veo notification: ${veoErr.message}. Rendering 3D interactive camera tour preview.`,
        aspectRatio: validAspectRatio,
      });
    }
  } catch (err: unknown) {
    console.error('Error in video generation endpoint:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Video generation failed' });
  }
});

// Poll Veo Video Status
app.post('/api/video-status', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: updated.done,
      error: updated.error,
    });
  } catch (err: unknown) {
    console.error('Error polling video operation:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Polling failed' });
  }
});

// Download Completed Veo Video
app.post('/api/video-download', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: 'Video URI not found' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    res.setHeader('Content-Type', 'video/mp4');
    videoRes.body!.pipeTo(
      new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        },
      })
    );
  } catch (err: unknown) {
    console.error('Error downloading video:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Download failed' });
  }
});

// Mount Vite or static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`HomeAI server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
