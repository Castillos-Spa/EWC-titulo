import React from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { Toaster } from 'sonner';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        {/* Toaster global para notificaciones */}
        <Toaster position="top-right" richColors closeButton expand={false} />
      </AuthProvider>
    </LanguageProvider>
  );
};
