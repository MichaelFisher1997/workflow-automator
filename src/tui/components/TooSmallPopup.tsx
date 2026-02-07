import React from 'react';
import { Box, Text } from 'ink';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

interface TooSmallPopupProps {
  width: number;
  height: number;
  onContinue: () => void;
}

export function TooSmallPopup({ width, height, onContinue }: TooSmallPopupProps) {
  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height={height}
    >
      <Box
        borderStyle="double"
        borderColor={cyberpunkTheme.colors.warning}
        padding={2}
        flexDirection="column"
      >
        <Text bold color={cyberpunkTheme.colors.warning}>
          ⚠️  Terminal Too Small
        </Text>
        <Box marginY={1}>
          <Text color={cyberpunkTheme.colors.text}>
            Current: {width}x{height}    Required: {cyberpunkTheme.layout.minWidth}x{cyberpunkTheme.layout.minHeight}
          </Text>
        </Box>
        <Text color={cyberpunkTheme.colors.muted}>
          Please resize your terminal window
        </Text>
        <Text color={cyberpunkTheme.colors.muted}>
          and press Enter to continue.
        </Text>
        <Box marginTop={1}>
          <Text color={cyberpunkTheme.colors.info}>
            Recommended: iTerm2, Kitty, Alacritty
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={cyberpunkTheme.colors.secondary}>
            [Enter] Continue anyway
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
