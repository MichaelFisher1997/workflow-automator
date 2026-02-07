import React from 'react';
import { Box, Text } from 'ink';
import type { VariantRow, Workflow } from '../../models/workflow.js';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

interface SidebarProps {
  workflows: Workflow[];
  rows: VariantRow[];
  selectedRowId: string | null;
  selectedRowIds: Set<string>;
  sidebarWidth: number;
}

export function Sidebar({ workflows, rows, selectedRowId, selectedRowIds, sidebarWidth }: SidebarProps) {
  return (
    <Box
      width={sidebarWidth}
      flexDirection="column"
      borderStyle="single"
      borderColor={cyberpunkTheme.colors.border}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color={cyberpunkTheme.colors.primary}>
          🌲 Tree ({rows.length} variants)
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        {workflows.map((workflow) => (
          <Box key={workflow.id} flexDirection="column" marginBottom={1}>
            <Text color={cyberpunkTheme.colors.info}>
              ▾ {workflow.workflowType}{' '}
              <Text color={workflow.type === 'template' ? cyberpunkTheme.colors.warning : cyberpunkTheme.colors.success}>
                ({workflow.type})
              </Text>
            </Text>
            <Box flexDirection="column" paddingLeft={2}>
              {workflow.variants.map((variant) => {
                const rowId = `${workflow.id}:${variant.name}`;
                const isCursor = selectedRowId === rowId;
                const isChecked = selectedRowIds.has(rowId);
                return (
                  <Box key={rowId}>
                    <Text color={isChecked ? cyberpunkTheme.colors.success : cyberpunkTheme.colors.muted}>
                      [{isChecked ? 'x' : ' '}]
                    </Text>
                    <Text color={isCursor ? cyberpunkTheme.colors.bright : cyberpunkTheme.colors.text} bold={isCursor}>
                      {' '}
                      {variant.name}
                    </Text>
                    {isCursor ? <Text color={cyberpunkTheme.colors.secondary}> ←</Text> : null}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>

      <Text color={cyberpunkTheme.colors.muted}>{selectedRowIds.size} selected</Text>
    </Box>
  );
}
