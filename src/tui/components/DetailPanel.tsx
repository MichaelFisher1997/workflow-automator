import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { cyberpunkTheme } from '../theme/cyberpunk.js';
import type { Workflow } from '../../models/workflow.js';

interface DetailPanelProps {
  workflow: Workflow | null;
  selectedVariant: string;
  detailWidth: number;
  onVariantChange: () => void;
  onInstall: () => void;
}

export function DetailPanel({ 
  workflow, 
  selectedVariant, 
  detailWidth,
  onVariantChange,
  onInstall 
}: DetailPanelProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!workflow) {
    return (
      <Box
        width={detailWidth}
        borderStyle="single"
        borderColor={cyberpunkTheme.colors.border}
        padding={2}
        alignItems="center"
        justifyContent="center"
      >
        <Text color={cyberpunkTheme.colors.muted}>
          Select a workflow to view details
        </Text>
      </Box>
    );
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    setInstallResult(null);
    
    // Simulate install - replace with actual install logic
    setTimeout(() => {
      setIsInstalling(false);
      setInstallResult({ 
        success: true, 
        message: `Installed ${workflow.metadata.name} (${selectedVariant})` 
      });
      onInstall();
    }, 1000);
  };

  const variant = workflow.variants.find(v => v.name === selectedVariant);

  return (
    <Box
      width={detailWidth}
      flexDirection="column"
      borderStyle="single"
      borderColor={cyberpunkTheme.colors.border}
      padding={1}
    >
      <Box borderStyle="single" borderColor={cyberpunkTheme.colors.primary} padding={1} flexDirection="column">
        <Text bold color={cyberpunkTheme.colors.primary}>
          {workflow.metadata.name}
        </Text>
        
        <Box marginY={1}>
          <Text color={cyberpunkTheme.colors.muted}>
            {workflow.metadata.description || 'No description available'}
          </Text>
        </Box>
        
        <Box marginY={1}>
          <Text color={cyberpunkTheme.colors.text}>
            Type: <Text color={cyberpunkTheme.colors.success}>set ✓ ready-to-run</Text>
          </Text>
          <Text color={cyberpunkTheme.colors.text}>
            Category: {workflow.category.id}
          </Text>
        </Box>

        {workflow.variants.length > 1 && (
          <Box marginY={1} flexDirection="column">
            <Text bold color={cyberpunkTheme.colors.text}>Variants:</Text>
            <Box marginLeft={2} flexDirection="column">
              {workflow.variants.map(v => (
                <Box key={v.name}>
                  <Text color={v.name === selectedVariant ? cyberpunkTheme.colors.primary : cyberpunkTheme.colors.muted}>
                    {v.name === selectedVariant ? '●' : '○'} {v.name} - {v.description}
                  </Text>
                </Box>
              ))}
            </Box>
            <Box marginTop={1}>
              <Text color={cyberpunkTheme.colors.muted}>
                [Tab] Switch variant
              </Text>
            </Box>
          </Box>
        )}

        {workflow.metadata.secrets.length > 0 && (
          <Box marginY={1} flexDirection="column">
            <Text bold color={cyberpunkTheme.colors.warning}></Text>
            <Box marginLeft={2} flexDirection="column">
              {workflow.metadata.secrets.map(secret => (
                <Box key={secret.name}>
                  <Text color={cyberpunkTheme.colors.warning}>
                    • {secret.name}
                  </Text>
                  <Text color={cyberpunkTheme.colors.muted}>
                    {'  '}{secret.description}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {workflow.metadata.triggers.length > 0 && (
          <Box marginY={1}>
            <Text color={cyberpunkTheme.colors.text}>
              Triggers: {workflow.metadata.triggers.map(t => t.event).join(', ')}
            </Text>
          </Box>
        )}

        <Box marginTop={2} flexDirection="column">
          {isInstalling ? (
            <Text color={cyberpunkTheme.colors.primary}>
              Installing...
            </Text>
          ) : installResult ? (
            <Text color={installResult.success ? cyberpunkTheme.colors.success : cyberpunkTheme.colors.error}>
              {installResult.success ? '✓' : '✗'} {installResult.message}
            </Text>
          ) : (
            <Box>
              <Text color={cyberpunkTheme.colors.secondary}>
                [Enter] Install ({selectedVariant})
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
