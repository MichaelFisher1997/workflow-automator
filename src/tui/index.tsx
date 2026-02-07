import React, { useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { DetailPanel } from './components/DetailPanel.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { TooSmallPopup } from './components/TooSmallPopup.js';
import { Spinner } from './components/Spinner.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';
import { useWorkflows } from './hooks/useWorkflows.js';
import { useNavigation } from './hooks/useNavigation.js';
import { checkTerminal } from './utils/terminal-check.js';
import { cyberpunkTheme } from './theme/cyberpunk.js';

function App() {
  const { exit } = useApp();
  const [hasBypassedSizeCheck, setHasBypassedSizeCheck] = useState(false);
  
  const { width, height, sidebarWidth, isValid } = useTerminalSize();
  const { workflows, categories, selectedCategory, isLoading, error, setCategory } = useWorkflows();
  
  const handleInstall = () => {
    // Installation handled in DetailPanel
  };
  
  const handleQuit = () => {
    exit();
  };
  
  const {
    selectedIndex,
    selectedVariant,
    isHelpOpen,
    selectedWorkflow,
    nextVariant,
    prevVariant,
    toggleHelp,
    closeHelp,
  } = useNavigation({
    workflows,
    onInstall: handleInstall,
    onQuit: handleQuit,
  });

  const detailWidth = width - sidebarWidth - 3; // Account for borders

  // Handle category switching with arrow keys
  useInput((input, key) => {
    if (isHelpOpen) return;
    
    if (key.leftArrow) {
      const currentIndex = categories.indexOf(selectedCategory);
      const newIndex = (currentIndex - 1 + categories.length) % categories.length;
      const newCategory = categories[newIndex];
      if (newCategory) setCategory(newCategory);
    } else if (key.rightArrow) {
      const currentIndex = categories.indexOf(selectedCategory);
      const newIndex = (currentIndex + 1) % categories.length;
      const newCategory = categories[newIndex];
      if (newCategory) setCategory(newCategory);
    }
  });

  // Show terminal size warning
  if (!isValid && !hasBypassedSizeCheck) {
    return (
      <TooSmallPopup
        width={width}
        height={height}
        onContinue={() => setHasBypassedSizeCheck(true)}
      />
    );
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
      <Box height={height} alignItems="center" justifyContent="center" flexDirection="column">
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
        workflowCount={workflows.length}
      />
      
      <Box flexDirection="row" flexGrow={1}>
        <Sidebar
          workflows={workflows}
          selectedIndex={selectedIndex}
          sidebarWidth={sidebarWidth}
        />
        
        <DetailPanel
          workflow={selectedWorkflow}
          selectedVariant={selectedVariant}
          detailWidth={detailWidth}
          onVariantChange={nextVariant}
          onInstall={handleInstall}
        />
      </Box>
      
      <Box
        height={1}
        borderStyle="single"
        borderColor={cyberpunkTheme.colors.border}
        paddingX={1}
      >
        <Text color={cyberpunkTheme.colors.muted}>
          [←/→] Category  [↑/↓] Navigate  [Tab] Variant  [Enter] Install  [?] Help  [Q] Quit
        </Text>
      </Box>
      
      {isHelpOpen && <HelpOverlay onClose={closeHelp} />}
    </Box>
  );
}

render(<App />);
