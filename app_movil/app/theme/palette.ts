export type BrandPalette = {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  border?: string;
};

// Single source of truth for brand colors. Reads EXPO_PUBLIC_* if provided.
export function getBrandPalette(): BrandPalette {
  const env = (process.env || {}) as Record<string, string | undefined>;
  const pick = (key: string, fallback: string) => {
    const v = env[key];
    return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : fallback;
  };
  return {
    // Defaults aligned with Tailwind blue-600/purple-600/teal-500 and alerts
    primary: pick('EXPO_PUBLIC_BRAND_PRIMARY', '#2563EB'),
    secondary: pick('EXPO_PUBLIC_BRAND_SECONDARY', '#7C3AED'),
    accent: pick('EXPO_PUBLIC_BRAND_ACCENT', '#06B6D4'),
    success: pick('EXPO_PUBLIC_BRAND_SUCCESS', '#16A34A'),
    warning: pick('EXPO_PUBLIC_BRAND_WARNING', '#F59E0B'),
    error: pick('EXPO_PUBLIC_BRAND_ERROR', '#DC2626'),
    border: pick('EXPO_PUBLIC_BRAND_BORDER', '#E2E8F0'),
  };
}
