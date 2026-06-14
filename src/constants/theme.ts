import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#FFFFFF',
    background: '#0A0A0A',
    backgroundElement: '#1A1A1A',
    backgroundSelected: '#252525',
    textSecondary: '#9CA3AF',
    accent: '#22C55E',
    accentMuted: '#16A34A33',
    border: '#2A2A2A',
    danger: '#EF4444',
    warning: '#F59E0B',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0A0A0A',
    backgroundElement: '#1A1A1A',
    backgroundSelected: '#252525',
    textSecondary: '#9CA3AF',
    accent: '#22C55E',
    accentMuted: '#16A34A33',
    border: '#2A2A2A',
    danger: '#EF4444',
    warning: '#F59E0B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
