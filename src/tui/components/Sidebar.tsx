import React from 'react';
import { Box, Text } from 'ink';
import { cyberpunkTheme } from '../theme/cyberpunk.js';
import type { Workflow } from '../../models/workflow.js';

interface SidebarProps {
  workflows: Workflow[];
  selectedIndex: number;
  sidebarWidth: number;
}

export function Sidebar({ workflows, selectedIndex, sidebarWidth }: SidebarProps) {
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
          🔍 Workflows ({workflows.length})
        </Text>
      </Box>
      
      <Box flexDirection="column" flexGrow={1}>
        {workflows.map((workflow, index) => {
          const isSelected = index === selectedIndex;
          const hasSecrets = workflow.metadata.secrets.length > 0;
          const variantCount = workflow.variants.length;
          
          return (
            <Box 
              key={workflow.id}
              marginY={0}
              paddingX={1}
            >
              <Box flexDirection="column">
                <Box>
                  <Text color={cyberpunkTheme.colors.muted}>
                    [{index + 1}]
                  </Text>
                  <Text 
                    color={isSelected ? cyberpunkTheme.colors.bright : cyberpunkTheme.colors.text}
                    bold={isSelected}
                  >
                    {' '}{workflow.metadata.name}
                  </Text>
                </Box>
                
                {isSelected && (
                  <Box paddingLeft={4}>
                    <Text color={cyberpunkTheme.colors.success}>
                      set ✓
                    </Text>
                    {variantCount > 1 && (
                      <Text color={cyberpunkTheme.colors.info}>
                        {' '}std 🟢{variantCount > 1 ? ` nix 🔵` : ''}
                      </Text>
                    )}
                    {hasSecrets && (
                      <Text color={cyberpunkTheme.colors.warning}>
                        {' '}⚠️ {workflow.metadata.secrets.length} secret
                      </Text>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
