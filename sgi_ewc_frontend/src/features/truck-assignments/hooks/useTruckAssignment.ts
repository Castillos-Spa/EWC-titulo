import { useContext } from 'react';
import TruckAssignmentContext from '../context/TruckAssignmentContext';

export const useTruckAssignment = () => {
	const ctx = useContext(TruckAssignmentContext);
	if (!ctx) throw new Error('useTruckAssignment debe usarse dentro de TruckAssignmentProvider');
	return ctx;
};

export default useTruckAssignment;