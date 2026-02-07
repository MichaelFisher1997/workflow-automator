import { useState, useCallback, useEffect } from 'react';
import { useInput } from 'ink';
import type { Workflow } from '../../models/workflow.js';

interface NavigationState {
  selectedIndex: number;
  selectedVariant: string;
  isHelpOpen: boolean;
}

interface UseNavigationReturn extends NavigationState {
  // Actions
  moveUp: () => void;
  moveDown: () => void;
  selectWorkflow: (index: number) => void;
  nextVariant: () => void;
  prevVariant: () => void;
  toggleHelp: () => void;
  closeHelp: () => void;
  
  // Computed
  selectedWorkflow: Workflow | null;
}

interface UseNavigationOptions {
  workflows: Workflow[];
  onInstall?: (workflow: Workflow, variant: string) => void;
  onQuit?: () => void;
}

export function useNavigation({ 
  workflows, 
  onInstall, 
  onQuit 
}: UseNavigationOptions): UseNavigationReturn {
  const [state, setState] = useState<NavigationState>({
    selectedIndex: 0,
    selectedVariant: 'standard',
    isHelpOpen: false,
  });

  const moveUp = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIndex: Math.max(0, prev.selectedIndex - 1),
    }));
  }, []);

  const moveDown = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIndex: Math.min(workflows.length - 1, prev.selectedIndex + 1),
    }));
  }, [workflows.length]);

  const selectWorkflow = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      selectedIndex: Math.max(0, Math.min(workflows.length - 1, index)),
    }));
  }, [workflows.length]);

  const nextVariant = useCallback(() => {
    const workflow = workflows[state.selectedIndex];
    if (!workflow) return;
    
    const variants = workflow.variants.map(v => v.name);
    const currentIndex = variants.indexOf(state.selectedVariant);
    const nextIndex = (currentIndex + 1) % variants.length;
    const nextVariantName = variants[nextIndex];
    if (!nextVariantName) return;
    
    setState(prev => ({
      ...prev,
      selectedVariant: nextVariantName,
    }));
  }, [workflows, state.selectedIndex, state.selectedVariant]);

  const prevVariant = useCallback(() => {
    const workflow = workflows[state.selectedIndex];
    if (!workflow) return;
    
    const variants = workflow.variants.map(v => v.name);
    const currentIndex = variants.indexOf(state.selectedVariant);
    const prevIndex = (currentIndex - 1 + variants.length) % variants.length;
    const prevVariantName = variants[prevIndex];
    if (!prevVariantName) return;
    
    setState(prev => ({
      ...prev,
      selectedVariant: prevVariantName,
    }));
  }, [workflows, state.selectedIndex, state.selectedVariant]);

  const toggleHelp = useCallback(() => {
    setState(prev => ({
      ...prev,
      isHelpOpen: !prev.isHelpOpen,
    }));
  }, []);

  const closeHelp = useCallback(() => {
    setState(prev => ({
      ...prev,
      isHelpOpen: false,
    }));
  }, []);

  // Reset variant when workflow changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      selectedVariant: 'standard',
    }));
  }, [state.selectedIndex]);

  // Keyboard input handling
  useInput((input, key) => {
    if (state.isHelpOpen) {
      if (key.escape || input === '?' || input === 'q') {
        closeHelp();
      }
      return;
    }

    // Navigation
    if (key.upArrow || input === 'k') {
      moveUp();
    } else if (key.downArrow || input === 'j') {
      moveDown();
    } else if (input >= '1' && input <= '9') {
      const index = parseInt(input) - 1;
      if (index < workflows.length) {
        selectWorkflow(index);
      }
    }

    // Variant switching
    else if (key.tab) {
      if (key.shift) {
        prevVariant();
      } else {
        nextVariant();
      }
    }

    // Actions
    else if (key.return) {
      const workflow = workflows[state.selectedIndex];
      if (workflow && onInstall) {
        onInstall(workflow, state.selectedVariant);
      }
    } else if (input === '?') {
      toggleHelp();
    } else if (input === 'q' || (key.ctrl && input === 'c')) {
      if (onQuit) {
        onQuit();
      }
    }
  });

  const selectedWorkflow = workflows[state.selectedIndex] || null;

  return {
    ...state,
    selectedWorkflow,
    moveUp,
    moveDown,
    selectWorkflow,
    nextVariant,
    prevVariant,
    toggleHelp,
    closeHelp,
  };
}
