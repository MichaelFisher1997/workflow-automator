import React, { useMemo, useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import type { VariantRow } from '../models/workflow.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { DetailPanel } from './components/DetailPanel.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { TooSmallPopup } from './components/TooSmallPopup.js';
import { Spinner } from './components/Spinner.js';
import { ConfirmModal } from './components/ConfirmModal.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';
import { useWorkflows } from './hooks/useWorkflows.js';
import { useNavigation } from './hooks/useNavigation.js';
import { installWorkflow } from './utils/install-workflow.js';
import { cyberpunkTheme } from './theme/cyberpunk.js';

function App() {
  const { exit } = useApp();
  const [hasBypassedSizeCheck, setHasBypassedSizeCheck] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const { width, height, sidebarWidth, isValid } = useTerminalSize();
  const { workflows, categories, selectedCategory, isLoading, error, setCategory } = useWorkflows();

  const rows = useMemo<VariantRow[]>(() => {
    return workflows.flatMap((workflow) =>
      workflow.variants.map((variant) => ({
        id: `${workflow.id}:${variant.name}`,
        categoryId: workflow.category.id,
        workflowType: workflow.workflowType,
        workflow,
        variant,
      })),
    );
  }, [workflows]);

  const handleQuit = () => exit();

  const nav = useNavigation({
    rows,
    onQuit: handleQuit,
    onConfirm: async (selectedRows, options) => {
      if (selectedRows.length === 0) return;

      let successCount = 0;
      for (const row of selectedRows) {
        const result = await installWorkflow(row.workflow, row.variant, {
          targetPath: '.',
          dryRun: options.dryRun,
          force: options.force,
        });
        if (result.success) successCount += 1;
      }

      setBatchMessage(
        options.dryRun
          ? `Dry-run complete: ${successCount}/${selectedRows.length} ready`
          : `Batch install complete: ${successCount}/${selectedRows.length} succeeded`,
      );
    },
  });

  const detailWidth = width - sidebarWidth - 3;

  useInput((_, key) => {
    if (nav.isHelpOpen || nav.isConfirmOpen) return;
    if (key.leftArrow) {
      const currentIndex = categories.indexOf(selectedCategory);
      const newIndex = (currentIndex - 1 + categories.length) % categories.length;
      const category = categories[newIndex];
      if (category) setCategory(category);
    }
    if (key.rightArrow) {
      const currentIndex = categories.indexOf(selectedCategory);
      const newIndex = (currentIndex + 1) % categories.length;
      const category = categories[newIndex];
      if (category) setCategory(category);
    }
  });

  if (!isValid && !hasBypassedSizeCheck) {
    return <TooSmallPopup width={width} height={height} onContinue={() => setHasBypassedSizeCheck(true)} />;
  }

  if (isLoading) {
    return (
      <Box height={height} alignItems="center" justifyContent="center">
        <Spinner text="Loading workflows..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box height={height} alignItems="center" justifyContent="center">
        <Text color={cyberpunkTheme.colors.error}>Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={height}>
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setCategory}
        workflowCount={rows.length}
      />

      <Box flexDirection="row" flexGrow={1}>
        <Sidebar
          workflows={workflows}
          rows={rows}
          selectedRowId={nav.selectedRow?.id ?? null}
          selectedRowIds={nav.selectedRowIds}
          sidebarWidth={sidebarWidth}
        />

        <DetailPanel
          row={nav.selectedRow}
          detailWidth={detailWidth}
          selectedCount={nav.selectedRows.length}
          batchMessage={batchMessage}
        />
      </Box>

      <Box height={1} borderStyle="single" borderColor={cyberpunkTheme.colors.border} paddingX={1}>
        <Text color={cyberpunkTheme.colors.muted}>
          [←/→] Category  [↑/↓] Navigate  [Space] Select  [Enter] Batch install  [?] Help  [Q] Quit
        </Text>
      </Box>

      {nav.isHelpOpen ? <HelpOverlay onClose={() => nav.setIsHelpOpen(false)} /> : null}
      {nav.isConfirmOpen ? (
        <ConfirmModal selectedCount={nav.selectedRows.length} dryRun={nav.dryRun} force={nav.force} />
      ) : null}
    </Box>
  );
}

render(<App />);
