import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { cyberpunkTheme } from '../theme/cyberpunk.js';
import { installWorkflow } from '../utils/install-workflow.js';
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
  const [installResult, setInstallResult] = useState<{ success: boolean; message: string; details?: { targetFile: string; created: boolean; overwritten: boolean } } | null>(null);
  const [force, setForce] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Handle keyboard shortcuts for options
  useInput((input) => {
    if (installResult || isInstalling) return;
    
    if (input === 'd') {
      setDryRun(prev => !prev);
    } else if (input === 'f') {
      setForce(prev => !prev);
    }
  });

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
    const variant = workflow.variants.find(v => v.name === selectedVariant);
    if (!variant) return;

    setIsInstalling(true);
    setInstallResult(null);

    try {
      const result = await installWorkflow(workflow, variant, {
        force,
        dryRun,
        targetPath: '.',
      });

      setInstallResult({
        success: result.success,
        message: result.message,
        details: result.details,
      });

      if (result.success && !dryRun) {
        onInstall();
      }
    } catch (error) {
      setInstallResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsInstalling(false);
    }
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

        <Box marginY={1} flexDirection="column">
          <Text bold color={cyberpunkTheme.colors.text}>Variants:</Text>
          <Box marginLeft={2} flexDirection="column">
            {workflow.variants.map(v => (
              <Box key={v.name} flexDirection="column">
                <Text 
                  color={v.name === selectedVariant ? cyberpunkTheme.colors.primary : cyberpunkTheme.colors.muted}
                  bold={v.name === selectedVariant}
                  wrap="wrap"
                >
                  {v.name === selectedVariant ? '●' : '○'} {v.name}
                </Text>
                <Text 
                  color={cyberpunkTheme.colors.muted}
                  wrap="wrap"
                >
                  {'  '}{v.description}
                </Text>
              </Box>
            ))}
          </Box>
          {workflow.variants.length > 1 && (
            <Box marginTop={1}>
              <Text color={cyberpunkTheme.colors.secondary}>
                [Tab] Switch variant
              </Text>
            </Box>
          )}
        </Box>

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
            <Box flexDirection="column">
              <Text color={installResult.success ? cyberpunkTheme.colors.success : cyberpunkTheme.colors.error}>
                {installResult.success ? '✓' : '✗'} {installResult.message}
              </Text>
              {installResult.details && (
                <Box marginTop={1} flexDirection="column">
                  <Text color={cyberpunkTheme.colors.muted}>
                    → {installResult.details.targetFile}
                  </Text>
                  {installResult.details.created && (
                    <Text color={cyberpunkTheme.colors.info}>
                      ✓ Created .github/workflows/
                    </Text>
                  )}
                  {installResult.details.overwritten && (
                    <Text color={cyberpunkTheme.colors.warning}>
                      ⚠ Overwritten existing file
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text color={cyberpunkTheme.colors.secondary}>
                  [Enter] Install ({selectedVariant})
                </Text>
              </Box>
              <Box flexDirection="row">
                <Text color={dryRun ? cyberpunkTheme.colors.primary : cyberpunkTheme.colors.muted}>
                  [{dryRun ? '✓' : ' '}] [D] Dry-run
                </Text>
                <Box marginLeft={2}>
                  <Text color={force ? cyberpunkTheme.colors.warning : cyberpunkTheme.colors.muted}>
                    [{force ? '✓' : ' '}] [F] Force overwrite
                  </Text>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
