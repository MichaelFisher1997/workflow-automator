import { cyberpunkTheme } from '../theme/cyberpunk.js';

export interface TerminalInfo {
  width: number;
  height: number;
  supportsTrueColor: boolean;
  isValid: boolean;
}

export function checkTerminal(): TerminalInfo {
  const width = process.stdout.columns || 80;
  const height = process.stdout.rows || 24;
  
  const colorTerm = process.env.COLORTERM;
  const term = process.env.TERM;
  
  const supportsTrueColor = 
    colorTerm === 'truecolor' ||
    colorTerm === '24bit' ||
    (term?.includes('256color') ?? false) ||
    (term?.includes('truecolor') ?? false);
  
  const isValid = 
    width >= cyberpunkTheme.layout.minWidth &&
    height >= cyberpunkTheme.layout.minHeight;
  
  return {
    width,
    height,
    supportsTrueColor,
    isValid,
  };
}

export function formatDimensions(width: number, height: number): string {
  return `${width}x${height}`;
}
