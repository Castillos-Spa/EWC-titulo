import React, { useState } from 'react';

interface ChangePasswordModalProps {
  onSubmit: (currentPassword: string, newPassword: string) => void;
  onCancel: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onSubmit, onCancel }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    onSubmit(currentPassword, password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg" onSubmit={handleSubmit}>
        <h2 className="mb-4 text-xl font-bold">Cambia tu contraseña</h2>
        <p className="mb-4 text-sm text-gray-600">Por seguridad, debes establecer una nueva contraseña para continuar.</p>
        <input
          type="password"
          placeholder="Contraseña temporal actual"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 mb-2 border rounded-lg"
          required
        />
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 mb-2 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Confirmar nueva contraseña"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full px-3 py-2 mb-2 border rounded-lg"
        />
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <div className="flex justify-end pt-4 space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg">Guardar</button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordModal;
