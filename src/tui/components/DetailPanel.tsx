import React from 'react';
import { Box, Text } from 'ink';
import type { VariantRow } from '../../models/workflow.js';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

interface DetailPanelProps {
  row: VariantRow | null;
  detailWidth: number;
  selectedCount: number;
  batchMessage: string | null;
}

export function DetailPanel({ row, detailWidth, selectedCount, batchMessage }: DetailPanelProps) {
  if (!row) {
    return (
      <Box
        width={detailWidth}
        borderStyle="single"
        borderColor={cyberpunkTheme.colors.border}
        padding={2}
        alignItems="center"
        justifyContent="center"
      >
        <Text color={cyberpunkTheme.colors.muted}>Select a variant row to inspect</Text>
      </Box>
    );
  }

  return (
    <Box
      width={detailWidth}
      flexDirection="column"
      borderStyle="single"
      borderColor={cyberpunkTheme.colors.border}
      padding={1}
    >
      <Box borderStyle="single" borderColor={cyberpunkTheme.colors.primary} padding={1} flexDirection="column">
        <Text bold color={cyberpunkTheme.colors.primary}>{row.workflow.metadata.name}</Text>
        <Text color={cyberpunkTheme.colors.muted}>{row.workflow.metadata.description || 'No description available'}</Text>

        <Box marginTop={1}>
          <Text color={cyberpunkTheme.colors.text}>
            Category: {row.categoryId}  Workflow: {row.workflowType}  Class:{' '}
            <Text color={row.workflow.type === 'template' ? cyberpunkTheme.colors.warning : cyberpunkTheme.colors.success}>
              {row.workflow.type}
            </Text>
            {'  '}Variant:{' '}
            <Text color={cyberpunkTheme.colors.info}>{row.variant.name}</Text>
          </Text>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text color={cyberpunkTheme.colors.text}>Available variants:</Text>
          <Box paddingLeft={2} flexDirection="column">
            {row.workflow.variants.map((variant) => (
              <Text
                key={variant.name}
                color={variant.name === row.variant.name ? cyberpunkTheme.colors.primary : cyberpunkTheme.colors.muted}
                bold={variant.name === row.variant.name}
              >
                {variant.name === row.variant.name ? '●' : '○'} {variant.name}
              </Text>
            ))}
          </Box>
        </Box>

        {row.workflow.metadata.secrets.length > 0 ? (
          <Box marginTop={1} flexDirection="column">
            <Text color={cyberpunkTheme.colors.warning}>Required secrets:</Text>
            <Box paddingLeft={2} flexDirection="column">
              {row.workflow.metadata.secrets.map((secret) => (
                <Text key={secret.name} color={cyberpunkTheme.colors.warning}>• {secret.name}</Text>
              ))}
            </Box>
          </Box>
        ) : null}

        <Box marginTop={1}>
          <Text color={cyberpunkTheme.colors.text}>
            Selected for batch: <Text color={cyberpunkTheme.colors.success}>{selectedCount}</Text>
          </Text>
        </Box>

        {batchMessage ? (
          <Box marginTop={1}>
            <Text color={cyberpunkTheme.colors.secondary}>{batchMessage}</Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
