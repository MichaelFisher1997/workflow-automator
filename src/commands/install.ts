import type { WorkflowRegistry } from '../core/registry.js';
import chalk from 'chalk';
import { readFile, mkdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { constants } from 'node:fs';

interface InstallOptions {
  variant?: string;
  force?: boolean;
  dryRun?: boolean;
  target?: string;
}

export async function installCommand(
  registry: WorkflowRegistry,
  workflowId: string,
  options: InstallOptions
): Promise<void> {
  const workflow = registry.getWorkflow(workflowId);

  if (!workflow) {
    console.error(chalk.red(`Error: Workflow '${workflowId}' not found.`));
    console.log(chalk.gray('\nAvailable workflows:'));
    const allWorkflows = registry.getWorkflows();
    for (const w of allWorkflows) {
      console.log(chalk.gray(`  • ${w.id}`));
    }
    process.exit(1);
  }

  // Select variant
  const variantName = options.variant || 'standard';
  const variant = workflow.variants.find(v => v.name === variantName);

  if (!variant) {
    console.error(chalk.red(`Error: Variant '${variantName}' not found for workflow '${workflowId}'.`));
    console.log(chalk.gray('\nAvailable variants:'));
    for (const v of workflow.variants) {
      console.log(chalk.gray(`  • ${v.name}`));
    }
    process.exit(1);
  }

  // Determine target path
  const targetDir = resolve(options.target || '.', '.github/workflows');
  const targetFile = join(targetDir, variant.filename);

  // Check if file already exists
  let exists = false;
  try {
    await access(targetFile, constants.F_OK);
    exists = true;
  } catch {
    // File doesn't exist
  }

  if (exists && !options.force) {
    console.error(chalk.red(`\nError: File already exists: ${targetFile}`));
    console.log(chalk.yellow('\nUse --force to overwrite, or remove the file first.'));
    process.exit(1);
  }

  // Read workflow content
  const content = await readFile(variant.filepath, 'utf-8');

  if (options.dryRun) {
    console.log(chalk.blue('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.blue('║') + ' ' + chalk.bold.white('DRY RUN').padEnd(56) + chalk.blue('║'));
    console.log(chalk.blue('╚════════════════════════════════════════════════════════════╝\n'));
    console.log(chalk.bold('Would perform the following actions:\n'));
    console.log(chalk.green('  ✓') + ` Create directory: ${targetDir}`);
    console.log(chalk.green('  ✓') + ` Write file: ${targetFile}`);
    
    if (exists) {
      console.log(chalk.yellow('  ⚠') + ' Overwrite existing file (with --force)');
    }
    
    console.log(chalk.bold('\nWorkflow details:'));
    console.log(`  • Name: ${workflow.metadata.name}`);
    console.log(`  • Type: ${workflow.type}`);
    console.log(`  • Variant: ${variant.name}`);
    
    if (workflow.metadata.secrets.length > 0) {
      console.log(chalk.bold('\nRequired secrets:'));
      for (const secret of workflow.metadata.secrets) {
        console.log(`  • ${secret.name}`);
      }
    }
    
    console.log(chalk.gray('\nNo changes were made.\n'));
    return;
  }

  // Perform installation
  try {
    // Create directory if needed
    await mkdir(targetDir, { recursive: true });

    // Write file
    const targetPath = Bun.file(targetFile);
    await Bun.write(targetPath, content);

    // Success output
    console.log(chalk.green('\n✓ Successfully installed workflow\n'));
    console.log(chalk.bold('Workflow: ') + workflow.metadata.name);
    console.log(chalk.bold('Type: ') + (workflow.type === 'set' 
      ? chalk.green('set (ready-to-run)') 
      : chalk.yellow('template (requires edits)')));
    console.log(chalk.bold('Variant: ') + (variant.name === 'nix' 
      ? chalk.cyan('nix') 
      : chalk.green('standard')));
    console.log(chalk.bold('Location: ') + targetFile);

    if (workflow.metadata.secrets.length > 0) {
      console.log(chalk.bold('\n⚠️  Required secrets:'));
      for (const secret of workflow.metadata.secrets) {
        console.log(`   • ${chalk.yellow(secret.name)} - ${secret.description}`);
      }
      console.log(chalk.gray('\n   Configure at: Settings → Secrets and variables → Actions'));
    }

    if (workflow.type === 'template') {
      console.log(chalk.yellow('\n⚠️  This is a template workflow.'));
      console.log(chalk.yellow('   You must edit the file before it will run successfully.'));
    }

    console.log(chalk.green('\n✓ Installation complete!\n'));

  } catch (error) {
    console.error(chalk.red(`\n✗ Installation failed: ${error}\n`));
    process.exit(1);
  }
}
