import React from 'react';
import { Box, Text } from 'ink';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

interface ConfirmModalProps {
  selectedCount: number;
  dryRun: boolean;
  force: boolean;
}

export function ConfirmModal({ selectedCount, dryRun, force }: ConfirmModalProps) {
  return (
    <Box
      position="absolute"
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
    >
      <Box borderStyle="double" borderColor={cyberpunkTheme.colors.secondary} padding={1} flexDirection="column" width={52}>
        <Text bold color={cyberpunkTheme.colors.secondary}>Batch Install Confirmation</Text>
        <Text color={cyberpunkTheme.colors.text}>Items selected: {selectedCount}</Text>
        <Box marginTop={1} flexDirection="column">
          <Text color={dryRun ? cyberpunkTheme.colors.primary : cyberpunkTheme.colors.muted}>
            [{dryRun ? 'x' : ' '}] [D] Dry-run
          </Text>
          <Text color={force ? cyberpunkTheme.colors.warning : cyberpunkTheme.colors.muted}>
            [{force ? 'x' : ' '}] [F] Force overwrite
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text color={cyberpunkTheme.colors.success}>[Enter] Confirm install</Text>
          <Text color={cyberpunkTheme.colors.muted}>[Esc] Cancel</Text>
        </Box>
      </Box>
    </Box>
  );
}
