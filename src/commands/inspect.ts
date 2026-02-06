import type { WorkflowRegistry } from '../core/registry.js';
import type { Workflow } from '../models/workflow.js';
import chalk from 'chalk';
import { readFile } from 'node:fs/promises';

interface InspectOptions {
  variant?: string;
  raw?: boolean;
}

export async function inspectCommand(
  registry: WorkflowRegistry, 
  workflowId: string, 
  options: InspectOptions
): Promise<void> {
  const workflow = registry.getWorkflow(workflowId);
  
  if (!workflow) {
    console.error(chalk.red(`Workflow '${workflowId}' not found.`));
    process.exit(1);
  }

  if (options.raw) {
    // Print raw workflow content
    const variant = options.variant 
      ? workflow.variants.find(v => v.name === options.variant)
      : workflow.variants.find(v => v.name === 'standard') || workflow.variants[0];
    
    if (!variant) {
      console.error(chalk.red(`Variant '${options.variant || 'standard'}' not found.`));
      process.exit(1);
    }

    const content = await readFile(variant.filepath, 'utf-8');
    console.log(content);
    return;
  }

  // Print formatted info
  console.log(chalk.bold.blue('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.blue('║') + ' ' + chalk.bold.white(workflow.metadata.name).padEnd(56) + chalk.bold.blue('║'));
  console.log(chalk.bold.blue('╚════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.bold('ID: ') + workflow.id);
  console.log(chalk.bold('Category: ') + workflow.category.id);
  console.log(chalk.bold('Type: ') + (workflow.type === 'set' 
    ? chalk.green('set ✓ ready-to-run')
    : chalk.yellow('template ⚠ requires edits')));
  
  console.log(chalk.bold('\nDescription:'));
  console.log('  ' + (workflow.metadata.description || 'No description available'));

  console.log(chalk.bold('\nVariants:'));
  for (const variant of workflow.variants) {
    const isSelected = variant.name === (options.variant || 'standard');
    const prefix = isSelected ? chalk.green('→ ') : '  ';
    const name = variant.name === 'nix' 
      ? chalk.cyan(variant.name) 
      : chalk.green(variant.name);
    console.log(`${prefix}${name}: ${variant.description}`);
  }

  console.log(chalk.bold('\nTriggers:'));
  if (workflow.metadata.triggers.length > 0) {
    for (const trigger of workflow.metadata.triggers) {
      console.log(`  • ${trigger.event}${trigger.types ? ` (${trigger.types.join(', ')})` : ''}`);
    }
  } else {
    console.log(chalk.gray('  No triggers specified'));
  }

  console.log(chalk.bold('\nRequired Secrets:'));
  if (workflow.metadata.secrets.length > 0) {
    for (const secret of workflow.metadata.secrets) {
      const status = secret.required 
        ? chalk.red('(required)') 
        : chalk.gray('(optional)');
      console.log(`  • ${chalk.yellow(secret.name)} ${status}`);
      console.log(`    ${secret.description}`);
    }
    console.log(chalk.gray(`\n  → Set at: Settings → Secrets and variables → Actions`));
  } else {
    console.log(chalk.green('  None required'));
  }

  if (workflow.metadata.inputs.length > 0) {
    console.log(chalk.bold('\nConfiguration Inputs:'));
    for (const input of workflow.metadata.inputs) {
      const defaultStr = input.default ? chalk.gray(` [default: ${input.default}]`) : '';
      const requiredStr = input.required ? chalk.red(' (required)') : '';
      console.log(`  • ${input.name}${requiredStr}${defaultStr}`);
      console.log(`    ${input.description}`);
    }
  }

  console.log(chalk.bold('\nSetup Time: ') + workflow.metadata.estimatedSetupTime);
  console.log();
}
