import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { installWorkflow } from './install-workflow.js';
import type { Workflow, WorkflowVariant } from '../../models/workflow.js';
import { mkdtemp, writeFile, readFile, access, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { constants } from 'node:fs';

async function expectFileNotToExist(filePath: string): Promise<void> {
  let fileExists = false;
  try {
    await access(filePath, constants.F_OK);
    fileExists = true;
  } catch {
    // Expected - file should not exist
  }
  expect(fileExists).toBe(false);
}

describe('installWorkflow', () => {
  let tempDir: string;
  let sourceDir: string;
  let mockWorkflow: Workflow;
  let mockVariant: WorkflowVariant;

  beforeEach(async () => {
    // Create temporary directories for testing
    tempDir = await mkdtemp(join(tmpdir(), 'actionflow-test-'));
    sourceDir = await mkdtemp(join(tmpdir(), 'actionflow-source-'));

    // Create a test workflow file
    const workflowContent = `name: Test Workflow
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`;
    await writeFile(join(sourceDir, 'test-workflow.yml'), workflowContent);

    mockVariant = {
      name: 'standard',
      filename: 'test-workflow.yml',
      filepath: join(sourceDir, 'test-workflow.yml'),
      toolchain: 'standard',
      description: 'Test variant',
      installRelativePath: '.github/workflows/test-workflow.yml',
    };

    mockWorkflow = {
      id: 'test/test-workflow',
      category: {
        id: 'test',
        name: 'Test',
        description: '',
        path: '/test',
      },
      workflowType: 'test-workflow',
      type: 'set',
      variants: [mockVariant],
      metadata: {
        name: 'Test Workflow',
        description: 'A test workflow',
        secrets: [],
        inputs: [],
        triggers: [],
        estimatedSetupTime: '0 minutes',
      },
    };
  });

  afterEach(async () => {
    // Cleanup temporary directories
    try {
      await rm(tempDir, { recursive: true });
      await rm(sourceDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('basic installation', () => {
    test('should install workflow successfully', async () => {
      const result = await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully installed');
      expect(result.details?.created).toBe(true);
      expect(result.details?.overwritten).toBe(false);

      // Verify file was created
      const targetFile = join(tempDir, '.github', 'workflows', 'test-workflow.yml');
      await access(targetFile, constants.F_OK);
      
      // Verify content
      const content = await readFile(targetFile, 'utf-8');
      expect(content).toContain('name: Test Workflow');
    });

    test('should use default path when installRelativePath not provided', async () => {
      const variantWithoutPath: WorkflowVariant = {
        ...mockVariant,
        installRelativePath: undefined,
      };

      const result = await installWorkflow(mockWorkflow, variantWithoutPath, {
        targetPath: tempDir,
      });

      expect(result.success).toBe(true);
      
      // Verify file was created at default path
      const targetFile = join(tempDir, '.github', 'workflows', 'test-workflow.yml');
      await access(targetFile, constants.F_OK);
    });
  });

  describe('overwrite behavior', () => {
    test('should fail when file exists without force flag', async () => {
      // First install
      await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
      });

      // Second install should fail
      const result = await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });

    test('should overwrite when force flag is true', async () => {
      // First install
      await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
      });

      // Modify the source file
      const modifiedContent = `name: Modified Workflow
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
`;
      await writeFile(join(sourceDir, 'test-workflow.yml'), modifiedContent);

      // Second install with force
      const result = await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
        force: true,
      });

      expect(result.success).toBe(true);
      expect(result.details?.overwritten).toBe(true);
      expect(result.details?.created).toBe(false);

      // Verify content was updated
      const targetFile = join(tempDir, '.github', 'workflows', 'test-workflow.yml');
      const content = await readFile(targetFile, 'utf-8');
      expect(content).toContain('name: Modified Workflow');
    });
  });

  describe('dry-run mode', () => {
    test('should not create file in dry-run mode', async () => {
      const result = await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Would install');
      expect(result.details?.created).toBe(true);

      // Verify file was NOT created
      const targetFile = join(tempDir, '.github', 'workflows', 'test-workflow.yml');
      await expectFileNotToExist(targetFile);
    });

    test('should report overwrite in dry-run mode when file exists', async () => {
      // First install
      await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
      });

      // Dry run install
      const result = await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
        dryRun: true,
        force: true,
      });

      expect(result.success).toBe(true);
      expect(result.details?.overwritten).toBe(true);
      expect(result.details?.created).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should handle missing source file', async () => {
      const variantWithBadPath: WorkflowVariant = {
        ...mockVariant,
        filepath: '/non-existent/file.yml',
      };

      const result = await installWorkflow(mockWorkflow, variantWithBadPath, {
        targetPath: tempDir,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    test('should handle invalid target path', async () => {
      const result = await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: '/non-existent-directory/subdir',
      });

      // This may succeed or fail depending on permissions, so just check we get a result
      expect(result).toBeDefined();
      expect(result.message).toBeTruthy();
    });
  });

  describe('result details', () => {
    test('should include source and target file paths in result', async () => {
      const result = await installWorkflow(mockWorkflow, mockVariant, {
        targetPath: tempDir,
      });

      expect(result.details?.sourceFile).toBe(mockVariant.filepath);
      expect(result.details?.targetFile).toContain('.github/workflows/test-workflow.yml');
    });
  });
});
