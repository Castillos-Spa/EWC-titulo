import { createContext } from 'react';

export interface TourStep { path: string; title: string; description: string; target?: string; }
export interface TourStateShape { active: boolean; index: number; completed: boolean; }
export interface TourContextValue {
  steps: TourStep[];
  active: boolean;
  index: number;
  completed: boolean;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  restartTour: () => void;
  resumeTour: () => void;
}

export const TourContext = createContext<TourContextValue | undefined>(undefined);
