import { useState, useEffect, useCallback } from 'react';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

interface TerminalSize {
  width: number;
  height: number;
  sidebarWidth: number;
  isValid: boolean;
}

export function useTerminalSize(): TerminalSize {
  const calculateSidebarWidth = (totalWidth: number): number => {
    const ratio = cyberpunkTheme.layout.sidebarDefaultRatio;
    const calculated = Math.floor(totalWidth * ratio);
    return Math.max(calculated, cyberpunkTheme.layout.sidebarMinWidth);
  };

  const [size, setSize] = useState<TerminalSize>(() => {
    const width = process.stdout.columns || 80;
    const height = process.stdout.rows || 24;
    const sidebarWidth = calculateSidebarWidth(width);
    const isValid = width >= cyberpunkTheme.layout.minWidth && 
                    height >= cyberpunkTheme.layout.minHeight;
    return { width, height, sidebarWidth, isValid };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = process.stdout.columns || 80;
      const height = process.stdout.rows || 24;
      const sidebarWidth = calculateSidebarWidth(width);
      const isValid = width >= cyberpunkTheme.layout.minWidth && 
                      height >= cyberpunkTheme.layout.minHeight;
      setSize({ width, height, sidebarWidth, isValid });
    };

    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  return size;
}
