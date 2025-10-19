import React, { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<any>; // Devuelve una promesa para saber si falló
  onCancel: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Modal] Iniciando handleSubmit...');
    setValidationError('');
    setApiError(null);

    if (password.length < 6) {
      console.log('[Modal] Error de validación: contraseña corta.');
      setValidationError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      console.log('[Modal] Error de validación: contraseñas no coinciden.');
      setValidationError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    console.log('[Modal] Llamando a onSubmit...');
    try {
      await onSubmit(currentPassword, password);
      console.log('[Modal] onSubmit tuvo éxito. Mostrando pantalla de éxito.');
      setIsSuccess(true);
    } catch (error) {
      const message = error.message || 'Ocurrió un error inesperado.';
      console.error('[Modal] onSubmit falló:', message);
      setApiError(message);
    } finally {
      console.log('[Modal] Finalizando isLoading.');
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    console.log('[Modal] Usuario hizo clic en "Continuar al Login". Llamando a onCancel para cerrar y redirigir.');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-md p-6 text-gray-900 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
        {isSuccess ? (
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="w-16 h-16 mb-4 text-green-500" />
            <h2 className="mb-2 text-xl font-bold">¡Contraseña Actualizada!</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Tu contraseña ha sido cambiada con éxito. Ahora serás redirigido para iniciar sesión.
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Continuar al Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="mb-2 text-xl font-bold">Cambia tu contraseña</h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Por seguridad, debes establecer una nueva contraseña para continuar.</p>
            <input
              type="password"
              placeholder="Contraseña temporal actual"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
            {(validationError || apiError) && <div className="mb-2 text-sm text-red-600">{validationError || apiError}</div>}
            <div className="flex justify-end pt-4 space-x-3">
              <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={isLoading} className="flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
