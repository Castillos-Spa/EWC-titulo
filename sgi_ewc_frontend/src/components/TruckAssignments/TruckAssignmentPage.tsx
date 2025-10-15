import React, { useMemo, useState } from 'react';
import { TruckAssignmentProvider } from './TruckAssignmentContext';
import TruckKpis from './TruckKpis';
import TruckAssignmentCards from './TruckAssignmentCards';
import { RouteProvider } from '../TransportRoutes/RouteContext';

const TruckAssignmentPage: React.FC = () => {
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0,10);
  });
  const refDay = useMemo(() => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d;
  }, [date]);
  return (
    <RouteProvider>
      <TruckAssignmentProvider>
        <div className="space-y-4">
          <TruckKpis date={date} onDateChange={setDate} />
          <TruckAssignmentCards refDay={refDay} />
        </div>
      </TruckAssignmentProvider>
    </RouteProvider>
  );
};

export default TruckAssignmentPage;