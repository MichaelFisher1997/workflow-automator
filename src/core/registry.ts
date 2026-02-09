import type {
  Category,
  SecretRequirement,
  Toolchain,
  Workflow,
  WorkflowType,
} from '../models/workflow.js';
import { parse as parseYaml } from 'yaml';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible locations for workflows directory
// When bundled, __dirname might resolve differently
function findWorkflowsRoot(): string {
  // For development/build environment
  const devPath = join(__dirname, '..', '..', 'workflows');
  // For global npm/bun installs (when bundled into dist/)
  const globalPath = join(__dirname, '..', '..', '..', 'workflows');
  // For when running from package root
  const rootPath = join(process.cwd(), 'workflows');
  
  // Try each path and return the first that exists
  for (const path of [devPath, globalPath, rootPath]) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  // Default to dev path if none found (will fail gracefully later)
  return devPath;
}

const WORKFLOWS_ROOT = findWorkflowsRoot();

export interface ParsedMetadata {
  id?: string;
  category?: string;
  type?: WorkflowType;
  name?: string;
  description?: string;
  secrets?: SecretRequirement[];
  triggers?: string[];
  variants?: Array<{ name: string; description: string }>;
  targetPath?: string;
}

export class WorkflowRegistry {
  private workflows: Map<string, Workflow> = new Map();
  private categories: Map<string, Category> = new Map();
  private workflowsRoot: string;

  constructor(workflowsRoot?: string) {
    this.workflowsRoot = workflowsRoot ?? WORKFLOWS_ROOT;
  }

  async load(): Promise<void> {
    this.workflows.clear();
    this.categories.clear();

    const categories = await this.discoverCategories();
    for (const category of categories) {
      this.categories.set(category.id, category);
      const workflows = await this.discoverWorkflows(category);
      for (const workflow of workflows) {
        this.workflows.set(workflow.id, workflow);
      }
    }
  }

  private async discoverCategories(): Promise<Category[]> {
    const categories: Category[] = [];
    try {
      const entries = await readdir(this.workflowsRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        categories.push({
          id: entry.name,
          name: this.formatCategoryName(entry.name),
          description: '',
          path: join(this.workflowsRoot, entry.name),
        });
      }
    } catch {
      // Directory doesn't exist or can't be read, return empty categories
    }
    return categories;
  }

  private async discoverWorkflows(category: Category): Promise<Workflow[]> {
    const workflows = new Map<string, Workflow>();

    await this.discoverNewHierarchy(category, workflows);
    await this.discoverLegacyHierarchy(category, workflows);

    return Array.from(workflows.values()).sort((a, b) =>
      a.workflowType.localeCompare(b.workflowType),
    );
  }

  private async discoverNewHierarchy(category: Category, workflows: Map<string, Workflow>): Promise<void> {
    const entries = await readdir(category.path, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'sets' || entry.name === 'templates') continue;

      const workflowType = entry.name;
      const workflowPath = join(category.path, workflowType);
      const files = await this.safeReadDir(workflowPath);
      if (!files) continue;

      const yamlFiles = files.filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
      if (yamlFiles.length === 0) continue;

      const grouped = this.groupByBaseName(yamlFiles);
      for (const [baseName, variants] of grouped) {
        const workflow = await this.parseWorkflow({
          category,
          workflowType,
          type: 'set',
          baseName,
          files: variants,
          rootPath: workflowPath,
        });
        if (workflow) {
          workflows.set(workflow.id, workflow);
        }
      }
    }
  }

  private async discoverLegacyHierarchy(category: Category, workflows: Map<string, Workflow>): Promise<void> {
    const typeDirs: Array<{ dir: string; type: WorkflowType }> = [
      { dir: 'sets', type: 'set' },
      { dir: 'templates', type: 'template' },
    ];

    for (const { dir, type } of typeDirs) {
      const typePath = join(category.path, dir);
      const files = await this.safeReadDir(typePath);
      if (!files) continue;

      const yamlFiles = files.filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
      const grouped = this.groupByBaseName(yamlFiles);

      for (const [baseName, variants] of grouped) {
        const workflowType = this.deriveWorkflowType(baseName, category.id);
        const workflowId = `${category.id}/${workflowType}`;
        if (workflows.has(workflowId)) {
          continue;
        }

        const workflow = await this.parseWorkflow({
          category,
          workflowType,
          type,
          baseName,
          files: variants,
          rootPath: typePath,
        });
        if (workflow) {
          workflows.set(workflow.id, workflow);
        }
      }
    }
  }

  private async parseWorkflow(args: {
    category: Category;
    workflowType: string;
    type: WorkflowType;
    baseName: string;
    files: Array<{ file: string; variantName: string }>;
    rootPath: string;
  }): Promise<Workflow | null> {
    const standardEntry = args.files.find((entry) => entry.variantName === 'standard');
    const metadataEntry = standardEntry ?? args.files[0];
    if (!metadataEntry) return null;

    const metadataFile = metadataEntry.file;

    const content = await readFile(join(args.rootPath, metadataFile), 'utf-8');
    const metadata = this.extractMetadata(content, metadataFile);

    const resolvedType: WorkflowType = metadata.type ?? args.type;

    const variants = args.files
      .map((entry) => {
        const file = entry.file;
        const variantName = entry.variantName;
        const isNix = variantName === 'nix';
        const variantMeta = metadata.variants?.find((variant) => variant.name === variantName);
        return {
          name: variantName,
          filename: file,
          filepath: join(args.rootPath, file),
          installRelativePath: metadata.targetPath,
          toolchain: (isNix ? 'nix' : 'standard') as Toolchain,
          description:
            variantMeta?.description ??
            (isNix ? 'Uses Nix for reproducible environment' : 'Uses standard GitHub Actions'),
        };
      })
      .sort((a, b) => {
        const weight = this.variantSortWeight(a.name) - this.variantSortWeight(b.name);
        return weight !== 0 ? weight : a.name.localeCompare(b.name);
      });

    const workflowId = `${args.category.id}/${args.workflowType}`;

    return {
      id: workflowId,
      category: args.category,
      workflowType: args.workflowType,
      type: resolvedType,
      variants,
      metadata: {
        name: metadata.name ?? this.formatCategoryName(args.workflowType),
        description: metadata.description ?? '',
        secrets: metadata.secrets ?? [],
        inputs: [],
        triggers: (metadata.triggers ?? []).map((event) => ({ event })),
        estimatedSetupTime: '0 minutes',
      },
    };
  }

  private extractMetadata(content: string, filename: string): ParsedMetadata {
    const match = content.match(/^# ---\n([\s\S]*?)\n# ---/);
    if (!match) {
      return this.extractInlineMetadata(content, filename);
    }

    const yamlBlock = match[1] ?? '';
    const yamlContent = yamlBlock.replace(/^#\s?/gm, '');
    try {
      return (parseYaml(yamlContent) as ParsedMetadata) ?? {};
    } catch {
      return this.extractInlineMetadata(content, filename);
    }
  }

  private extractInlineMetadata(content: string, filename: string): ParsedMetadata {
    const idMatch = content.match(/# id:\s*(.+)/);
    const categoryMatch = content.match(/# category:\s*(.+)/);
    const typeMatch = content.match(/# type:\s*(.+)/);
    const nameMatch = content.match(/# name:\s*(.+)/);
    const descriptionMatch = content.match(/# description:\s*(.+)/);
    const triggerMatch = content.match(/# triggers:\s*\[([^\]]+)]/);
    const targetPathMatch = content.match(/# targetPath:\s*(.+)/);

    const variants: Array<{ name: string; description: string }> = [];
    const variantsBlock = content.match(/# variants:[\s\S]*?(?=\n# [a-z]|\n\n|$)/i);
    if (variantsBlock) {
      const regex = /#\s+- name:\s*(\S+)[\s\S]*?#\s+description:\s*(.+)/g;
      for (const item of variantsBlock[0].matchAll(regex)) {
        const name = item[1];
        const description = item[2];
        if (!name || !description) continue;
        variants.push({ name, description: description.trim() });
      }
    }

    const secrets: SecretRequirement[] = [];
    const secretsBlock = content.match(/# secrets:[\s\S]*?(?=\n# [a-z]|\n\n|$)/i);
    if (secretsBlock) {
      const regex = /#\s+- name:\s*(\S+)[\s\S]*?#\s+description:\s*(.+)/g;
      for (const item of secretsBlock[0].matchAll(regex)) {
        const name = item[1];
        const description = item[2];
        if (!name || !description) continue;
        secrets.push({ name, description: description.trim(), required: true });
      }
    }

    return {
      id: idMatch?.[1]?.trim(),
      category: categoryMatch?.[1]?.trim(),
      type: (typeMatch?.[1]?.trim() as WorkflowType | undefined) ?? 'set',
      name: nameMatch?.[1]?.trim() ?? filename.replace(/\.ya?ml$/, ''),
      description: descriptionMatch?.[1]?.trim(),
      secrets,
      triggers: triggerMatch?.[1]?.split(',').map((entry) => entry.trim()) ?? [],
      targetPath: targetPathMatch?.[1]?.trim(),
      variants,
    };
  }

  private groupByBaseName(files: string[]): Map<string, Array<{ file: string; variantName: string }>> {
    const groups = new Map<string, Array<{ file: string; variantName: string }>>();
    const names = new Set(files.map((file) => file.replace(/\.ya?ml$/, '')));

    for (const file of files) {
      const name = file.replace(/\.ya?ml$/, '');
      const dashIndex = name.lastIndexOf('-');

      let baseName = name;
      let variantName = 'standard';

      if (dashIndex > 0) {
        const candidateBase = name.slice(0, dashIndex);
        const candidateVariant = name.slice(dashIndex + 1);
        if (names.has(candidateBase) && candidateVariant.length > 0) {
          baseName = candidateBase;
          variantName = candidateVariant;
        }
      }

      if (!groups.has(baseName)) groups.set(baseName, []);
      groups.get(baseName)?.push({ file, variantName });
    }

    return groups;
  }

  private variantSortWeight(name: string): number {
    if (name === 'standard') return 0;
    if (name === 'nix') return 99;
    return 10;
  }

  private deriveWorkflowType(baseName: string, categoryId: string): string {
    if (baseName === categoryId) return categoryId;
    if (baseName.startsWith(`${categoryId}-`)) {
      return baseName.slice(categoryId.length + 1);
    }
    return baseName;
  }

  private formatCategoryName(id: string): string {
    return id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async safeReadDir(path: string): Promise<string[] | null> {
    try {
      return await readdir(path);
    } catch {
      return null;
    }
  }

  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getCategories(): Category[] {
    return Array.from(this.categories.values());
  }

  filterWorkflows(options: { category?: string; type?: WorkflowType; variant?: string }): Workflow[] {
    return this.getWorkflows().filter((workflow) => {
      if (options.category && workflow.category.id !== options.category) return false;
      if (options.type && workflow.type !== options.type) return false;
      if (options.variant && !workflow.variants.some((variant) => variant.name === options.variant)) return false;
      return true;
    });
  }
}
