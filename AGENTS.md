# Agent Guidelines for ActionFlow

This document provides guidelines for AI agents working on this repository.

## Build/Development Commands

```bash
# Install dependencies
bun install

# Run the TUI application
bun run src/tui/index.tsx

# Build for distribution
bun build src/tui/index.tsx --outdir=dist --target=bun

# Run tests (when they exist)
bun test

# Run a single test file
bun test src/core/registry.test.ts

# Run tests with pattern matching
bun test --grep "registry"
```

## Code Style Guidelines

### Language & Runtime
- **Runtime**: Bun (not Node.js)
- **Language**: TypeScript with strict mode enabled
- **Module System**: ES modules (`"type": "module"` in package.json)
- **Target**: ESNext with Bundler module resolution

### Import Patterns
- Always use `.js` extensions for imports, even for TypeScript files:
  ```typescript
  import { WorkflowRegistry } from '../core/registry.js';
  import type { Workflow } from '../models/workflow.js';
  ```
- Prefer `node:` prefix for built-in modules:
  ```typescript
  import { readdir, readFile } from 'node:fs/promises';
  import { join, dirname } from 'node:path';
  ```
- Use `type` imports for type-only imports to avoid runtime overhead

### TypeScript Configuration
- Strict mode is enabled with additional strict flags:
  - `noUncheckedIndexedAccess: true` - Check array/object access
  - `noImplicitOverride: true` - Require `override` keyword
  - `noFallthroughCasesInSwitch: true` - Exhaustive switch cases
- `noEmit: true` - TypeScript is for type-checking only, Bun handles transpilation
- `allowImportingTsExtensions: true` - Required for Bun's bundler

### Naming Conventions
- **Files**: kebab-case (e.g., `use-navigation.ts`, `confirm-modal.tsx`)
- **Components**: PascalCase (e.g., `ConfirmModal`, `DetailPanel`)
- **Hooks**: camelCase prefixed with `use` (e.g., `useNavigation`, `useWorkflows`)
- **Types/Interfaces**: PascalCase (e.g., `Workflow`, `VariantRow`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Enums**: Use TypeScript `type` aliases instead of enum keyword:
  ```typescript
  export type WorkflowType = 'set' | 'template';
  export type Toolchain = 'nix' | 'standard';
  ```

### Code Organization
```
src/
├── core/           # Business logic (registry, discovery)
├── models/         # Type definitions and interfaces
├── tui/            # Terminal UI components
│   ├── components/ # React/Ink components
│   ├── hooks/      # Custom React hooks
│   ├── theme/      # Theme/styling constants
│   └── utils/      # TUI-specific utilities
└── utils/          # Shared utilities

workflows/
├── <category>/
│   └── <workflow-type>/
│       └── *.yml   # Workflow files with variants
```

### Error Handling
- Use explicit error handling with typed errors:
  ```typescript
  try {
    const content = await readFile(path, 'utf-8');
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  ```
- Return result objects instead of throwing for expected failures
- Always narrow unknown errors to Error type before accessing properties

### React/Ink Patterns
- Use functional components with hooks
- Props interfaces named `{ComponentName}Props`
- Use `useMemo` for expensive computations to prevent jitter
- Use `useEffect` with cleanup for async operations
- Keep state updates minimal to avoid render loops

### Workflow File Structure
Workflow YAML files include metadata in comments:
```yaml
# ---
# id: category/workflow-type
# category: category-name
# type: set | template
# name: Display Name
# description: What this workflow does
# targetPath: .github/workflows/filename.yml
# variants:
#   - name: standard
#     description: Uses standard GitHub Actions
# ---
```

### Key Principles
1. **No Node.js APIs** - Use Bun's APIs (Bun.file, Bun.$, etc.)
2. **Type Safety First** - Leverage strict TypeScript; avoid `any`
3. **Immutable State** - Use spread operators, avoid mutation
4. **Functional Style** - Prefer pure functions, minimize side effects
5. **File Extensions** - Always include `.js` in imports (Bun requirement)

### Testing (When Adding)
- Use `bun:test` for testing (Jest-compatible API)
- Place test files next to source files: `registry.ts` → `registry.test.ts`
- Use descriptive test names that explain the behavior

### Dependencies
- **Allowed**: `ink`, `react`, `yaml`, Bun built-ins
- **Avoid**: Express, Jest, Vitest, any Node.js-specific libraries
- **Theme**: Use colors from `cyberpunk.ts` theme file for consistency

### CLI Behavior
- Keyboard-driven (no mouse support)
- Support vim-style navigation (j/k, h/l)
- Support both arrow keys and letter shortcuts
- Always show help with `?` key
- Confirm destructive actions (overwrite, batch install)
