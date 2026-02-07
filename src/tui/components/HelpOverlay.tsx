import React from 'react';
import { Box, Text, useInput } from 'ink';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

interface HelpOverlayProps {
  onClose: () => void;
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  useInput((input, key) => {
    if (key.escape || input === '?' || input === 'q') {
      onClose();
    }
  });

  const shortcuts = [
    { key: '↑/↓ or j/k', desc: 'Navigate workflows' },
    { key: '←/→ or h/l', desc: 'Switch category' },
    { key: '1-9', desc: 'Jump to workflow #' },
    { key: 'Tab', desc: 'Switch variant' },
    { key: 'Enter', desc: 'Install workflow' },
    { key: '?', desc: 'Toggle this help' },
    { key: 'q', desc: 'Quit' },
  ];

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        borderStyle="double"
        borderColor={cyberpunkTheme.colors.primary}
        padding={2}
        flexDirection="column"
        width={50}
      >
        <Text bold color={cyberpunkTheme.colors.primary}>
          ⌨️  Keyboard Shortcuts
        </Text>
        <Box marginY={1} flexDirection="column">
          {shortcuts.map(({ key, desc }) => (
            <Box key={key} marginY={0}>
              <Box width={15}>
                <Text color={cyberpunkTheme.colors.secondary}>{key}</Text>
              </Box>
              <Text color={cyberpunkTheme.colors.text}>{desc}</Text>
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color={cyberpunkTheme.colors.muted}>
            Press [?] or [Esc] to close
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
