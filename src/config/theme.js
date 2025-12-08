// Jertz Theme Configuration
// Based on logo: Red (#E21F26) and Purple (#7B2D8E) gradient

export const COLORS = {
  // Primary Brand Colors
  primary: '#E21F26',      // Jertz Red
  secondary: '#7B2D8E',    // Jertz Purple
  accent: '#D91F68',       // Middle gradient tone
  
  // Backgrounds
  background: '#0A0A0A',   // Deep Black
  surface: '#1A1A1A',      // Card/Surface
  surfaceLight: '#2A2A2A', // Lighter surface
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#707070',
  
  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Ranking
  gold: '#FFD700',
  silver: '#C0C0C0',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

export const GRADIENTS = {
  primary: ['#E21F26', '#7B2D8E'],       // Red to Purple
  secondary: ['#7B2D8E', '#D91F68'],     // Purple to Pink
  primaryReverse: ['#7B2D8E', '#E21F26'], // Purple to Red
  dark: ['#0A0A0A', '#1A1A1A'],
  accent: ['#D91F68', '#7B2D8E'],
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 20,
  },
};
