export const cyberpunkTheme = {
  colors: {
    bg: '#0a0a0f',
    surface: '#1a1a2e',
    border: '#00f5ff',
    primary: '#00f5ff',
    secondary: '#ff00ff',
    tertiary: '#ffea00',
    success: '#00ff88',
    warning: '#ffea00',
    error: '#ff0044',
    info: '#00f5ff',
    text: '#e0e0e0',
    muted: '#6c757d',
    bright: '#ffffff',
  },
  borders: {
    style: 'double',
  },
  animations: {
    fadeDuration: 50,
    spinnerInterval: 80,
  },
  layout: {
    minWidth: 80,
    minHeight: 24,
    sidebarMinWidth: 35,
    sidebarDefaultRatio: 0.35,
  },
} as const;

export type Theme = typeof cyberpunkTheme;
