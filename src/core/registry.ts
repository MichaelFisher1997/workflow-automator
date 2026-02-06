import type { Workflow, WorkflowType, Toolchain, WorkflowMetadata, SecretRequirement, InputParameter, Trigger } from '../models/workflow.js';
import { parse as parseYaml } from 'yaml';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKFLOWS_ROOT = join(__dirname, '..', '..', 'workflows');

interface ParsedMetadata {
  id: string;
  category: string;
  type: WorkflowType;
  name: string;
  description: string;
  secrets: SecretRequirement[];
  inputs: InputParameter[];
  triggers: string[];
  variants: Array<{ name: string; description: string }>;
}

export class WorkflowRegistry {
  private workflows: Map<string, Workflow> = new Map();
  private categories: Map<string, { id: string; name: string; description: string; path: string }> = new Map();

  async load(): Promise<void> {
    const categories = await this.discoverCategories();
    
    for (const category of categories) {
      this.categories.set(category.id, category);
      const workflows = await this.discoverWorkflows(category);
      
      for (const workflow of workflows) {
        this.workflows.set(workflow.id, workflow);
      }
    }
  }

  private async discoverCategories(): Promise<Array<{ id: string; name: string; description: string; path: string }>> {
    const categories: Array<{ id: string; name: string; description: string; path: string }> = [];
    
    try {
      const entries = await readdir(WORKFLOWS_ROOT, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          categories.push({
            id: entry.name,
            name: this.formatCategoryName(entry.name),
            description: '', // Could be loaded from a category.yaml file
            path: join(WORKFLOWS_ROOT, entry.name)
          });
        }
      }
    } catch (error) {
      console.error('Failed to discover categories:', error);
    }
    
    return categories;
  }

  private async discoverWorkflows(category: { id: string; path: string }): Promise<Workflow[]> {
    const workflows: Workflow[] = [];
    const typeDirs = ['sets', 'templates'];
    
    for (const type of typeDirs) {
      const typePath = join(category.path, type);
      
      try {
        const files = await readdir(typePath);
        const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
        
        // Group files by base name (e.g., opencode.yml and opencode-nix.yml)
        const groups = this.groupByBaseName(yamlFiles);
        
        for (const [baseName, files] of groups) {
          const workflow = await this.parseWorkflow(category, type as WorkflowType, baseName, files, typePath);
          if (workflow) {
            workflows.push(workflow);
          }
        }
      } catch (error) {
        // Directory might not exist
      }
    }
    
    return workflows;
  }

  private groupByBaseName(files: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    
    for (const file of files) {
      // Extract base name (e.g., "opencode-nix.yml" -> "opencode")
      const match = file.match(/^(.+?)(?:-nix)?\.ya?ml$/);
      if (match) {
        const baseName = match[1];
        if (!groups.has(baseName)) {
          groups.set(baseName, []);
        }
        groups.get(baseName)!.push(file);
      }
    }
    
    return groups;
  }

  private async parseWorkflow(
    category: { id: string; name: string; description: string; path: string },
    typeDir: string,
    baseName: string,
    files: string[],
    typePath: string
  ): Promise<Workflow | null> {
    // Determine workflow type from directory name
    const type: WorkflowType = typeDir === 'sets' ? 'set' : 'template';
    
    // Find the non-nix file first (for metadata extraction)
    const nonNixFile = files.find(f => !f.includes('-nix')) || files[0];
    const content = await readFile(join(typePath, nonNixFile), 'utf-8');
    const metadata = this.extractMetadata(content, nonNixFile);
    
    if (!metadata) {
      return null;
    }

    // Build variants
    const variants = files.map(file => {
      const isNix = file.includes('-nix');
      const variantName = isNix ? 'nix' : 'standard';
      const variantMeta = metadata.variants.find(v => v.name === variantName);
      
      return {
        name: variantName,
        filename: file,
        filepath: join(typePath, file),
        toolchain: isNix ? 'nix' as Toolchain : 'standard' as Toolchain,
        description: variantMeta?.description || (isNix ? 'Uses Nix for reproducible environment' : 'Uses standard GitHub Actions')
      };
    });

    // Use the base name for the ID (without -nix suffix)
    const workflowId = `${category.id}/${baseName}`;

    return {
      id: workflowId,
      category,
      type,
      variants,
      metadata: {
        name: metadata.name?.replace(/ \(Nix\)$/, '') || baseName,
        description: metadata.description?.replace(/ using Nix$/, '') || '',
        secrets: metadata.secrets || [],
        inputs: metadata.inputs || [],
        triggers: (metadata.triggers || []).map(t => ({ event: t })),
        estimatedSetupTime: '0 minutes'
      }
    };
  }

  private extractMetadata(content: string, filename: string): ParsedMetadata | null {
    // Look for YAML frontmatter
    const match = content.match(/^# ---\n([\s\S]*?)\n# ---/);
    if (!match) {
      // Try to extract from inline comments
      return this.extractInlineMetadata(content, filename);
    }

    const yamlContent = match[1].replace(/^# /gm, '').replace(/^#/gm, '');
    
    try {
      const parsed = parseYaml(yamlContent) as ParsedMetadata;
      return parsed;
    } catch (error) {
      console.error(`Failed to parse metadata from ${filename}:`, error);
      return null;
    }
  }

  private extractInlineMetadata(content: string, filename: string): ParsedMetadata | null {
    // Extract metadata from inline comments
    const idMatch = content.match(/# id:\s*(.+)/);
    const categoryMatch = content.match(/# category:\s*(.+)/);
    const typeMatch = content.match(/# type:\s*(.+)/);
    const nameMatch = content.match(/# name:\s*(.+)/);
    const descMatch = content.match(/# description:\s*(.+)/);

    if (!idMatch) return null;

    // Extract secrets
    const secrets: SecretRequirement[] = [];
    const secretsMatch = content.match(/# secrets:[\s\S]*?(?=\n# [a-z]|\n\n|$)/);
    if (secretsMatch) {
      const secretMatches = secretsMatch[0].matchAll(/#\s+- name:\s*(\S+)[\s\S]*?#\s+description:\s*(.+)/g);
      for (const m of secretMatches) {
        secrets.push({
          name: m[1],
          description: m[2].trim(),
          required: true
        });
      }
    }

    // Extract triggers
    const triggers: string[] = [];
    const triggersMatch = content.match(/# triggers:\s*\[([^\]]+)\]/);
    if (triggersMatch) {
      triggers.push(...triggersMatch[1].split(',').map(t => t.trim()));
    }

    // Extract variants
    const variants: Array<{ name: string; description: string }> = [];
    const variantsMatch = content.match(/# variants:[\s\S]*?(?=\n# [a-z]|\n\n|$)/);
    if (variantsMatch) {
      const variantMatches = variantsMatch[0].matchAll(/#\s+- name:\s*(\S+)[\s\S]*?#\s+description:\s*(.+)/g);
      for (const m of variantMatches) {
        variants.push({
          name: m[1],
          description: m[2].trim()
        });
      }
    }

    return {
      id: idMatch[1].trim(),
      category: categoryMatch?.[1].trim() || '',
      type: (typeMatch?.[1].trim() as WorkflowType) || 'set',
      name: nameMatch?.[1].trim() || filename.replace('.yml', ''),
      description: descMatch?.[1].trim() || '',
      secrets,
      inputs: [],
      triggers,
      variants
    };
  }

  private formatCategoryName(id: string): string {
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getCategories(): Array<{ id: string; name: string; description: string; path: string }> {
    return Array.from(this.categories.values());
  }

  filterWorkflows(options: {
    category?: string;
    type?: WorkflowType;
    variant?: string;
  }): Workflow[] {
    return this.getWorkflows().filter(w => {
      if (options.category && w.category.id !== options.category) return false;
      if (options.type && w.type !== options.type) return false;
      if (options.variant && !w.variants.some(v => v.name === options.variant)) return false;
      return true;
    });
  }
}
