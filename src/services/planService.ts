import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { HousePlanData } from '../../server';

export interface SavedPlanRecord {
  id: string;
  userId: string;
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
  totalAreaSqFt: number;
  estimatedCost: number;
  layoutJson: string;
  recommendationsJson: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION_PLANS = 'plans';

export async function savePlanToFirestore(plan: HousePlanData): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in to save plans to your cloud account');
  }

  const path = `${COLLECTION_PLANS}/${plan.id}`;
  const now = new Date().toISOString();

  const record: SavedPlanRecord = {
    id: plan.id,
    userId: user.uid,
    title: plan.title,
    plotLength: plan.plotLength,
    plotBreadth: plan.plotBreadth,
    facingDirection: plan.facingDirection,
    budgetRange: plan.budgetRange,
    floors: plan.floors,
    bedrooms: plan.bedrooms,
    bathrooms: plan.bathrooms,
    kitchenType: plan.kitchenType,
    architecturalStyle: plan.architecturalStyle,
    totalAreaSqFt: plan.totalBuiltUpAreaSqFt,
    estimatedCost: plan.estimatedCost,
    layoutJson: JSON.stringify(plan.rooms),
    recommendationsJson: JSON.stringify(plan.recommendations),
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, COLLECTION_PLANS, plan.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserPlans(): Promise<HousePlanData[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const path = COLLECTION_PLANS;
  try {
    const q = query(collection(db, path), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const plans: HousePlanData[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as SavedPlanRecord;
      try {
        const rooms = JSON.parse(data.layoutJson || '[]');
        const recommendations = JSON.parse(data.recommendationsJson || '{}');
        plans.push({
          id: data.id,
          title: data.title,
          plotLength: data.plotLength,
          plotBreadth: data.plotBreadth,
          facingDirection: data.facingDirection,
          budgetRange: data.budgetRange,
          floors: data.floors,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          kitchenType: data.kitchenType,
          architecturalStyle: data.architecturalStyle,
          additionalPreferences: [],
          totalPlotAreaSqFt: data.plotLength * data.plotBreadth,
          totalBuiltUpAreaSqFt: data.totalAreaSqFt,
          carpetAreaSqFt: Math.round(data.totalAreaSqFt * 0.82),
          usableAreaPercentage: 84,
          estimatedCost: data.estimatedCost,
          costBreakdown: {
            structureAndMasonry: Math.round(data.estimatedCost * 0.45),
            flooringAndTiling: Math.round(data.estimatedCost * 0.15),
            electricalAndPlumbing: Math.round(data.estimatedCost * 0.13),
            paintingAndFinishing: Math.round(data.estimatedCost * 0.13),
            interiorsAndKitchen: Math.round(data.estimatedCost * 0.14),
          },
          recommendations,
          rooms,
        });
      } catch (err) {
        console.error('Failed to parse plan json:', err);
      }
    });

    return plans;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deletePlanFromFirestore(planId: string): Promise<void> {
  const path = `${COLLECTION_PLANS}/${planId}`;
  try {
    await deleteDoc(doc(db, COLLECTION_PLANS, planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserPlans(
  userId: string,
  onPlansUpdated: (plans: HousePlanData[]) => void
) {
  const path = COLLECTION_PLANS;
  const q = query(collection(db, path), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const plans: HousePlanData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SavedPlanRecord;
        try {
          const rooms = JSON.parse(data.layoutJson || '[]');
          const recommendations = JSON.parse(data.recommendationsJson || '{}');
          plans.push({
            id: data.id,
            title: data.title,
            plotLength: data.plotLength,
            plotBreadth: data.plotBreadth,
            facingDirection: data.facingDirection,
            budgetRange: data.budgetRange,
            floors: data.floors,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            kitchenType: data.kitchenType,
            architecturalStyle: data.architecturalStyle,
            additionalPreferences: [],
            totalPlotAreaSqFt: data.plotLength * data.plotBreadth,
            totalBuiltUpAreaSqFt: data.totalAreaSqFt,
            carpetAreaSqFt: Math.round(data.totalAreaSqFt * 0.82),
            usableAreaPercentage: 84,
            estimatedCost: data.estimatedCost,
            costBreakdown: {
              structureAndMasonry: Math.round(data.estimatedCost * 0.45),
              flooringAndTiling: Math.round(data.estimatedCost * 0.15),
              electricalAndPlumbing: Math.round(data.estimatedCost * 0.13),
              paintingAndFinishing: Math.round(data.estimatedCost * 0.13),
              interiorsAndKitchen: Math.round(data.estimatedCost * 0.14),
            },
            recommendations,
            rooms,
          });
        } catch (err) {
          console.error('Failed to parse snapshot record:', err);
        }
      });
      onPlansUpdated(plans);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
