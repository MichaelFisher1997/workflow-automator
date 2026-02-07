// Workflow data models

export type WorkflowType = 'set' | 'template';
export type Toolchain = 'nix' | 'standard';

export interface SecretRequirement {
  name: string;
  description: string;
  required: boolean;
  documentationUrl?: string;
}

export interface InputParameter {
  name: string;
  description: string;
  default?: string;
  required: boolean;
}

export interface Trigger {
  event: string;
  types?: string[];
}

export interface WorkflowVariant {
  name: string;
  filename: string;
  filepath: string;
  installRelativePath?: string;
  toolchain: Toolchain;
  description: string;
}

export interface WorkflowMetadata {
  name: string;
  description: string;
  secrets: SecretRequirement[];
  inputs: InputParameter[];
  triggers: Trigger[];
  estimatedSetupTime: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface Workflow {
  id: string;
  category: Category;
  workflowType: string;
  type: WorkflowType;
  variants: WorkflowVariant[];
  metadata: WorkflowMetadata;
}

export interface VariantRow {
  id: string;
  categoryId: string;
  workflowType: string;
  workflow: Workflow;
  variant: WorkflowVariant;
}

// Template-specific configuration (for future use)
export interface EditField {
  path: string;
  description: string;
  example: string;
}

export interface ValidationRule {
  field: string;
  rule: string;
  message: string;
}

export interface TemplateConfig {
  requiredEdits: EditField[];
  suggestedEdits: EditField[];
  validationRules: ValidationRule[];
}
