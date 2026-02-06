import type { WorkflowRegistry } from '../core/registry.js';
import chalk from 'chalk';
import Table from 'cli-table3';

interface ListOptions {
  category?: string;
  type?: string;
  variant?: string;
  json?: boolean;
}

export async function listCommand(registry: WorkflowRegistry, options: ListOptions): Promise<void> {
  const workflows = registry.filterWorkflows({
    category: options.category,
    type: options.type as any,
    variant: options.variant
  });

  if (workflows.length === 0) {
    console.log(chalk.yellow('No workflows found matching the criteria.'));
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(workflows, null, 2));
    return;
  }

  // Create table
  const table = new Table({
    head: [
      chalk.bold('Category'),
      chalk.bold('Type'),
      chalk.bold('Workflow'),
      chalk.bold('Variants')
    ],
    colWidths: [15, 10, 30, 25]
  });

  for (const workflow of workflows) {
    const variantNames = workflow.variants.map(v => 
      v.name === 'nix' ? chalk.cyan('nix') : chalk.green('standard')
    ).join(', ');

    table.push([
      chalk.blue(workflow.category.id),
      workflow.type === 'set' 
        ? chalk.green('set') 
        : chalk.yellow('template'),
      workflow.metadata.name,
      variantNames
    ]);
  }

  console.log(table.toString());
  console.log(chalk.gray(`\nTotal: ${workflows.length} workflow(s)`));
}
