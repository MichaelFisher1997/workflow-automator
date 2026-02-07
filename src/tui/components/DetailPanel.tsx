import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { readFile } from 'node:fs/promises';
import type { VariantRow } from '../../models/workflow.js';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

interface DetailPanelProps {
  row: VariantRow | null;
  detailWidth: number;
  selectedCount: number;
  batchMessage: string | null;
}

export function DetailPanel({ row, detailWidth, selectedCount, batchMessage }: DetailPanelProps) {
  const [previewLines, setPreviewLines] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    async function loadPreview() {
      if (!row) {
        setPreviewLines([]);
        return;
      }

      try {
        const content = await readFile(row.variant.filepath, 'utf-8');
        const lines = content.split('\n').slice(0, 12);
        if (active) {
          setPreviewLines(lines);
        }
      } catch {
        if (active) {
          setPreviewLines(['(preview unavailable)']);
        }
      }
    }

    void loadPreview();
    return () => {
      active = false;
    };
  }, [row]);

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

        <Box marginTop={1}>
          <Text color={cyberpunkTheme.colors.text}>
            Install path:{' '}
            <Text color={cyberpunkTheme.colors.info}>{row.variant.installRelativePath ?? `.github/workflows/${row.variant.filename}`}</Text>
          </Text>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text color={cyberpunkTheme.colors.text}>Preview:</Text>
          <Box borderStyle="single" borderColor={cyberpunkTheme.colors.border} paddingX={1} flexDirection="column">
            {previewLines.map((line, index) => (
              <Text key={`${index}-${line}`} color={cyberpunkTheme.colors.muted}>
                {line === '' ? ' ' : line}
              </Text>
            ))}
            <Text color={cyberpunkTheme.colors.muted}>...</Text>
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
