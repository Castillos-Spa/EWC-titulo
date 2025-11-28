import { useContext } from 'react';
import CleaningContext from '../context/CleaningContext';

export function useCleaning() {
  const ctx = useContext(CleaningContext);
  if (!ctx) throw new Error('useCleaning debe usarse dentro de CleaningProvider');
  return ctx;
}

export default useCleaning;