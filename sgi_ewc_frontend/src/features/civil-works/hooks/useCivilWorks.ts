import { useContext } from 'react';
import CivilWorksContext from '../context/CivilWorksContext';

export function useCivilWorks() {
  const ctx = useContext(CivilWorksContext);
  if (!ctx) throw new Error('useCivilWorks debe usarse dentro de CivilWorksProvider');
  return ctx;
}

export default useCivilWorks;
