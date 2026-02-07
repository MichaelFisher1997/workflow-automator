import { useState, useEffect, useCallback } from 'react';
import { WorkflowRegistry } from '../../core/registry.js';
import type { Workflow } from '../../models/workflow.js';

interface UseWorkflowsReturn {
  workflows: Workflow[];
  categories: string[];
  selectedCategory: string;
  isLoading: boolean;
  error: string | null;
  setCategory: (category: string) => void;
  refresh: () => void;
}

export function useWorkflows(): UseWorkflowsReturn {
  const [registry] = useState(() => new WorkflowRegistry());
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await registry.load();
      
      const allWorkflows = registry.getWorkflows();
      const allCategories = registry.getCategories().map(c => c.id);
      
      setWorkflows(allWorkflows);
      setCategories(allCategories);
      
      // Select first category by default
      if (allCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(allCategories[0] ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  }, [registry, selectedCategory]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const setCategory = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const refresh = useCallback(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Filter workflows by selected category
  const filteredWorkflows = workflows.filter(w => w.category.id === selectedCategory);

  return {
    workflows: filteredWorkflows,
    categories,
    selectedCategory,
    isLoading,
    error,
    setCategory,
    refresh,
  };
}
