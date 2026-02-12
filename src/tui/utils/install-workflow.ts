import { mkdir, access, readFile, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { constants } from 'node:fs';
import type { Workflow, WorkflowVariant } from '../../models/workflow.js';

export interface InstallOptions {
  targetPath?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface InstallResult {
  success: boolean;
  message: string;
  details?: {
    sourceFile: string;
    targetFile: string;
    created: boolean;
    overwritten: boolean;
  };
}

export async function installWorkflow(
  workflow: Workflow,
  variant: WorkflowVariant,
  options: InstallOptions = {}
): Promise<InstallResult> {
  const { targetPath = '.', force = false, dryRun = false } = options;

  try {
    const defaultRelativePath = join('.github', 'workflows', variant.filename);
    const targetRelativePath = variant.installRelativePath ?? defaultRelativePath;
    const targetFile = resolve(targetPath, targetRelativePath);
    const targetDir = resolve(targetFile, '..');

    // Check if file already exists
    let exists = false;
    try {
      await access(targetFile, constants.F_OK);
      exists = true;
    } catch {
      // File doesn't exist
    }

    if (exists && !force && !dryRun) {
      return {
        success: false,
        message: `File already exists: ${targetFile}. Use --force to overwrite.`,
      };
    }

    // Read source file to verify it exists
    const sourceContent = await readFile(variant.filepath, 'utf-8');

    if (dryRun) {
      return {
        success: true,
        message: `Would install ${workflow.metadata.name} (${variant.name}) to ${targetFile}`,
        details: {
          sourceFile: variant.filepath,
          targetFile,
          created: !exists,
          overwritten: exists && force,
        },
      };
    }

    // Create .github/workflows directory if needed
    await mkdir(targetDir, { recursive: true });

    // Copy the workflow file
    await copyFile(variant.filepath, targetFile);

    return {
      success: true,
      message: `Successfully installed ${workflow.metadata.name} (${variant.name})`,
      details: {
        sourceFile: variant.filepath,
        targetFile,
        created: !exists,
        overwritten: exists && force,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Failed to install workflow: ${message}`,
    };
  }
}
