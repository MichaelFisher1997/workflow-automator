#!/usr/bin/env bun

import { Command } from 'commander';
import { WorkflowRegistry } from './core/registry.js';
import { listCommand } from './commands/list.js';
import { inspectCommand } from './commands/inspect.js';
import { installCommand } from './commands/install.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('workflow-automator')
  .description('CLI tool for installing GitHub Actions workflows')
  .version('1.0.0');

// Global middleware to load registry
program.hook('preAction', async (thisCommand) => {
  const registry = new WorkflowRegistry();
  await registry.load();
  thisCommand.setOptionValue('registry', registry);
});

// List command
program
  .command('list')
  .description('List available workflows')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --type <type>', 'Filter by type (set|template)')
  .option('-v, --variant <variant>', 'Filter by variant')
  .option('--json', 'Output as JSON')
  .action(async (options, command) => {
    const registry = command.optsWithGlobals().registry as WorkflowRegistry;
    await listCommand(registry, options);
  });

// Inspect command
program
  .command('inspect')
  .description('Show details about a workflow')
  .argument('<workflow-id>', 'Workflow ID (e.g., opencode/opencode-pr)')
  .option('-v, --variant <name>', 'Show specific variant', 'standard')
  .option('-r, --raw', 'Show raw workflow YAML')
  .action(async (workflowId: string, options, command) => {
    const registry = command.optsWithGlobals().registry as WorkflowRegistry;
    await inspectCommand(registry, workflowId, options);
  });

// Install command
program
  .command('install')
  .description('Install a workflow to the target repository')
  .argument('<workflow-id>', 'Workflow ID (e.g., opencode/opencode-pr)')
  .option('-v, --variant <name>', 'Install specific variant', 'standard')
  .option('-f, --force', 'Overwrite existing files')
  .option('-d, --dry-run', 'Show what would be installed without making changes')
  .option('-t, --target <path>', 'Target repository path', '.')
  .action(async (workflowId: string, options, command) => {
    const registry = command.optsWithGlobals().registry as WorkflowRegistry;
    await installCommand(registry, workflowId, {
      variant: options.variant,
      force: options.force,
      dryRun: options.dryRun,
      target: options.target
    });
  });

// Handle errors gracefully
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof Error) {
    if (error.message === 'commander.help') {
      process.exit(0);
    } else if (error.message === 'commander.version') {
      process.exit(0);
    } else if (error.message === 'commander.helpDisplayed') {
      process.exit(0);
    } else if (error.message === 'commander.missingArgument') {
      console.error(chalk.red('Error: Missing required argument'));
      process.exit(1);
    } else if (error.message === 'commander.unknownOption') {
      console.error(chalk.red('Error: Unknown option'));
      process.exit(1);
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }
  throw error;
}
