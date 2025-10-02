import React, { useState, useEffect } from 'react';
import { X, Fuel, Gauge, DollarSign, Save } from 'lucide-react';
import { createFuelLog, type CreateFuelLogPayload, type VehicleWithFuelHistory } from '../../utils/fuelApi';
import { useAuth } from '../../contexts/AuthContext';
import { getVehiculosFromTaller } from '../../utils/tallerApi';

interface FuelLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehiclesForDriver: VehicleWithFuelHistory[]; // Vehículos para el conductor (puede ser solo 1)
}

type VehicleOption = { id: number; patente: string; marca: string; modelo: string };

const FuelLogFormModal: React.FC<FuelLogFormModalProps> = ({ isOpen, onClose, onSuccess, vehiclesForDriver }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<CreateFuelLogPayload>>({
    date: new Date().toISOString().split('T')[0], // Default to today
  });
  const [vehicleList, setVehicleList] = useState<VehicleOption[]>(
    (vehiclesForDriver || []).map(v => ({ id: v.id, patente: v.patente, marca: v.marca, modelo: v.modelo }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isManager = user?.roleAssignments?.some(ra => ra.role === 'Admin' || (ra.area === 'Transporte' && ra.role === 'Supervisor'));

    async function fetchAllVehicles() {
      if (isOpen && isManager) {
        try {
          // Los managers necesitan la lista completa de vehículos
          const allVehicles = await getVehiculosFromTaller();
          setVehicleList(allVehicles.map(v => ({ id: v.id, patente: v.patente, marca: v.marca, modelo: v.modelo })));
        } catch (e) {
          console.error("Failed to fetch all vehicles for modal", e);
          setError("No se pudo cargar la lista completa de vehículos.");
        }
      } else {
        setVehicleList((vehiclesForDriver || []).map(v => ({ id: v.id, patente: v.patente, marca: v.marca, modelo: v.modelo })));
      }
    }

    fetchAllVehicles();

    // Si solo hay un vehículo (caso del conductor), pre-seleccionarlo.
    if (vehiclesForDriver.length === 1 && !isManager) {
      setFormData(prev => ({ ...prev, vehiculoId: vehiclesForDriver[0].id }));
    }

    // Reset form on open
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
    }

  }, [isOpen, user, vehiclesForDriver]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.vehiculoId || !formData.date || !formData.liters || !formData.odometer) {
      setError('Por favor, complete todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateFuelLogPayload = {
        vehiculoId: Number(formData.vehiculoId),
        date: new Date(formData.date).toISOString(),
        liters: Number(formData.liters),
        odometer: Number(formData.odometer),
        cost: formData.cost ? Number(formData.cost) : undefined,
      };

      await createFuelLog(payload);
      onSuccess(); // Llama a la función para refrescar datos y cerrar.
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar el registro. Intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Registrar Carga de Combustible</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/40 dark:text-red-300">{error}</div>}

          <div>
            <label htmlFor="vehiculoId" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Vehículo</label>
            <select id="vehiculoId" name="vehiculoId" value={formData.vehiculoId || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
              <option value="" disabled>Seleccione un vehículo</option>
              {vehicleList.map(v => (
                <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Carga</label>
              <input id="date" name="date" type="date" value={formData.date || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" />
            </div>
            <div>
              <label htmlFor="liters" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Litros</label>
              <div className="relative">
                <Fuel className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
                <input id="liters" name="liters" type="number" step="0.01" placeholder="50.5" value={formData.liters || ''} onChange={handleChange} required className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="odometer" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Odómetro (km)</label>
              <div className="relative">
                <Gauge className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
                <input id="odometer" name="odometer" type="number" placeholder="123456" value={formData.odometer || ''} onChange={handleChange} required className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
            </div>
            <div>
              <label htmlFor="cost" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Costo Total (Opcional)</label>
              <div className="relative">
                <DollarSign className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
                <input id="cost" name="cost" type="number" step="0.01" placeholder="45000" value={formData.cost || ''} onChange={handleChange} className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelLogFormModal;