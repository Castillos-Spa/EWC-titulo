import { useContext } from 'react';
import { TourContext } from './tourContextStore';

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour debe usarse dentro de TourProvider');
  return ctx;
}
