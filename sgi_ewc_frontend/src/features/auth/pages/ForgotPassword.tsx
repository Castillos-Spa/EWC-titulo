import React from 'react';
import UnderMaintenance from '../../../app/pages/UnderMaintenance';

const ForgotPassword: React.FC = () => {
  return (
    <UnderMaintenance
      title="Módulo en mantenimiento"
      description="La recuperación de contraseña estará disponible pronto. Mientras tanto, contacta a soporte TI si necesitas ayuda."
      backHref="/login"
    />
  );
};

export default ForgotPassword;
