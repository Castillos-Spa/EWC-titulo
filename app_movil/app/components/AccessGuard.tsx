import React from 'react';
import { View, Text } from 'react-native';
import { useThemeStore } from '@/app/stores/themeStore';

type Props = {
  allowed: boolean;
  children: React.ReactNode;
  message?: string;
};

export function AccessGuard({ allowed, children, message }: Props) {
  const { getColors } = useThemeStore();
  const colors = getColors();
  if (allowed) return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.textSecondary, paddingHorizontal: 24, textAlign: 'center' }}>
        {message ?? 'No tienes acceso a esta sección.'}
      </Text>
    </View>
  );
}
export default AccessGuard;
