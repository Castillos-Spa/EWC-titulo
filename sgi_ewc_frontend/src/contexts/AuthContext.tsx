import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'transport_supervisor' | 'driver' | 'general_services' | 'it_staff' | 'cleaning' | 'civil_works';
  area: 'water_transport' | 'general_services' | 'it' | 'admin';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  { id: '1', email: 'admin@company.com', name: 'System Administrator', role: 'admin', area: 'admin' },
  { id: '2', email: 'transport@company.com', name: 'Transport Supervisor', role: 'transport_supervisor', area: 'water_transport' },
  { id: '3', email: 'driver1@company.com', name: 'John Driver', role: 'driver', area: 'water_transport' },
  { id: '4', email: 'services@company.com', name: 'Services Manager', role: 'general_services', area: 'general_services' },
  { id: '5', email: 'it@company.com', name: 'IT Support', role: 'it_staff', area: 'it' },
  { id: '6', email: 'cleaning@company.com', name: 'Maria Cleaning', role: 'cleaning', area: 'general_services' },
  { id: '7', email: 'civil@company.com', name: 'Carlos Construction', role: 'civil_works', area: 'general_services' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === 'password123') {
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(foundUser));
      setUser(foundUser);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};