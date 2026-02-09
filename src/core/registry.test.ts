import { describe, expect, test, beforeEach } from 'bun:test';
import { WorkflowRegistry } from '../core/registry.js';
import type { Workflow, WorkflowType } from '../models/workflow.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_ROOT = join(__dirname, '..', 'test', 'fixtures');

describe('WorkflowRegistry', () => {
  let registry: WorkflowRegistry;

  beforeEach(() => {
    // Create registry with test fixtures
    registry = new WorkflowRegistry(FIXTURES_ROOT);
  });

  describe('load()', () => {
    test('should load all workflows from fixtures', async () => {
      await registry.load();
      const workflows = registry.getWorkflows();
      expect(workflows.length).toBeGreaterThan(0);
    });

    test('should load all categories', async () => {
      await registry.load();
      const categories = registry.getCategories();
      expect(categories.length).toBe(2);
      
      const categoryIds = categories.map(c => c.id).sort();
      expect(categoryIds).toEqual(['second-category', 'test-category']);
    });

    test('should parse category names correctly', async () => {
      await registry.load();
      const categories = registry.getCategories();
      
      const testCategory = categories.find(c => c.id === 'test-category');
      expect(testCategory?.name).toBe('Test Category');
      
      const secondCategory = categories.find(c => c.id === 'second-category');
      expect(secondCategory?.name).toBe('Second Category');
    });
  });

  describe('discoverWorkflows()', () => {
    test('should discover workflows with multiple variants', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/simple-workflow');
      
      expect(workflow).toBeDefined();
      expect(workflow?.workflowType).toBe('simple-workflow');
      expect(workflow?.variants.length).toBe(2);
      
      const variantNames = workflow?.variants.map(v => v.name).sort();
      expect(variantNames).toEqual(['nix', 'standard']);
    });

    test('should parse metadata correctly', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/simple-workflow');
      
      expect(workflow?.metadata.name).toBe('Simple Test Workflow');
      expect(workflow?.metadata.description).toBe('A simple test workflow for unit testing');
      expect(workflow?.type).toBe('set');
    });

    test('should parse secrets from metadata', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/simple-workflow');
      
      expect(workflow?.metadata.secrets.length).toBe(1);
      expect(workflow?.metadata.secrets[0]?.name).toBe('TEST_SECRET');
      expect(workflow?.metadata.secrets[0]?.description).toBe('A test secret');
      expect(workflow?.metadata.secrets[0]?.required).toBeUndefined();
    });

    test('should parse triggers from metadata', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/simple-workflow');
      
      expect(workflow?.metadata.triggers.length).toBe(2);
      const triggerEvents = workflow?.metadata.triggers.map(t => t.event);
      expect(triggerEvents).toContain('push');
      expect(triggerEvents).toContain('pull_request');
    });

    test('should handle workflows with inline metadata', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('second-category/some-workflow');
      
      expect(workflow).toBeDefined();
      expect(workflow?.metadata.name).toBe('Some Workflow');
      expect(workflow?.type).toBe('set');
    });

    test('should parse multiple secrets', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/another-workflow');
      
      expect(workflow?.metadata.secrets.length).toBe(2);
      const secretNames = workflow?.metadata.secrets.map(s => s.name);
      expect(secretNames).toContain('API_KEY');
      expect(secretNames).toContain('TOKEN');
    });
  });

  describe('getWorkflow()', () => {
    test('should return undefined for non-existent workflow', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('non-existent/workflow');
      expect(workflow).toBeUndefined();
    });

    test('should return correct workflow by id', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/simple-workflow');
      
      expect(workflow).toBeDefined();
      expect(workflow?.id).toBe('test-category/simple-workflow');
    });
  });

  describe('filterWorkflows()', () => {
    test('should filter by category', async () => {
      await registry.load();
      const filtered = registry.filterWorkflows({ category: 'test-category' });
      
      expect(filtered.length).toBe(2);
      expect(filtered.every(w => w.category.id === 'test-category')).toBe(true);
    });

    test('should filter by type', async () => {
      await registry.load();
      const setWorkflows = registry.filterWorkflows({ type: 'set' as WorkflowType });
      const templateWorkflows = registry.filterWorkflows({ type: 'template' as WorkflowType });
      
      expect(setWorkflows.length).toBeGreaterThan(0);
      expect(templateWorkflows.length).toBeGreaterThan(0);
      expect(setWorkflows.every(w => w.type === 'set')).toBe(true);
      expect(templateWorkflows.every(w => w.type === 'template')).toBe(true);
    });

    test('should filter by variant', async () => {
      await registry.load();
      const nixWorkflows = registry.filterWorkflows({ variant: 'nix' });
      
      expect(nixWorkflows.length).toBeGreaterThan(0);
      expect(nixWorkflows.every(w => w.variants.some(v => v.name === 'nix'))).toBe(true);
    });

    test('should combine multiple filters', async () => {
      await registry.load();
      const filtered = registry.filterWorkflows({ 
        category: 'test-category', 
        type: 'set' as WorkflowType 
      });
      
      expect(filtered.every(w => w.category.id === 'test-category' && w.type === 'set')).toBe(true);
    });

    test('should return all workflows when no filters applied', async () => {
      await registry.load();
      const all = registry.filterWorkflows({});
      const getAll = registry.getWorkflows();
      
      expect(all.length).toBe(getAll.length);
    });
  });

  describe('variant handling', () => {
    test('should sort variants with standard first', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/simple-workflow');
      
      expect(workflow?.variants[0]?.name).toBe('standard');
    });

    test('should set correct toolchain for variants', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/simple-workflow');
      
      const standardVariant = workflow?.variants.find(v => v.name === 'standard');
      const nixVariant = workflow?.variants.find(v => v.name === 'nix');
      
      expect(standardVariant?.toolchain).toBe('standard');
      expect(nixVariant?.toolchain).toBe('nix');
    });

    test('should include correct file paths for variants', async () => {
      await registry.load();
      const workflow = registry.getWorkflow('test-category/simple-workflow');
      
      const standardVariant = workflow?.variants.find(v => v.name === 'standard');
      expect(standardVariant?.filepath).toContain('simple-workflow.yml');
      expect(standardVariant?.filename).toBe('simple-workflow.yml');
    });
  });

  describe('edge cases', () => {
    test('should handle empty workflows directory', async () => {
      const emptyRegistry = new WorkflowRegistry(join(__dirname, '..', 'test', 'fixtures', 'non-existent'));
      await emptyRegistry.load();
      
      expect(emptyRegistry.getWorkflows()).toEqual([]);
      expect(emptyRegistry.getCategories()).toEqual([]);
    });

    test('should deduplicate workflows by id', async () => {
      await registry.load();
      const workflows = registry.getWorkflows();
      const ids = workflows.map(w => w.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });
  });
});
