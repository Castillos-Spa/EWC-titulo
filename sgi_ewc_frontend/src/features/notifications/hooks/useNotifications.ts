import { useContext } from 'react';
import NotificationsContext from '../context/NotificationsContext';

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return ctx;
};

export default useNotifications;