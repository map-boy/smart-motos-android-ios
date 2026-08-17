const Colors = {
  primary: {
    default: '#FFD700',
    light: '#FFE55C',
    dark: '#B39700',
  },
  secondary: {
    default: '#1A1A1A',
    light: '#333333',
    dark: '#000000',
  },
  accent: {
    default: '#FF6B00',
    light: '#FF8A3D',
    dark: '#CC5500',
  },
  success: '#34C759',
  error: {
    default: '#FF3B30',
    light: '#FFDEDE',
  },
  warning: '#FF9500',
  neutral: {
    white: '#FFFFFF',
    light: '#F5F5F5',
    medium: '#999999',
    dark: '#666666',
    lighter: '#E0E0E0',
    lightest: '#FAFAFA',
    black: '#000000',
  },
  transparent: 'transparent',
} as const;

export type ColorType = typeof Colors;
export default Colors;