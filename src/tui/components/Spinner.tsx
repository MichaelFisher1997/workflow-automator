import React, { useState, useEffect } from 'react';
import { Text } from 'ink';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface SpinnerProps {
  text?: string;
}

export function Spinner({ text = 'Loading...' }: SpinnerProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % spinnerFrames.length);
    }, cyberpunkTheme.animations.spinnerInterval);

    return () => clearInterval(timer);
  }, []);

  return (
    <Text color={cyberpunkTheme.colors.primary}>
      {spinnerFrames[frame]} {text}
    </Text>
  );
}
