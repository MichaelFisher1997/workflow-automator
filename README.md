# Workflow Automator

CLI tool for installing curated GitHub Actions workflows into repositories.

## Features

- **Curated Workflows**: Pre-configured workflows ready to run
- **Variant Support**: Standard and Nix-based toolchain options
- **Safe Installation**: Never overwrites without explicit confirmation
- **Clear UX**: Shows required secrets and setup requirements

## Installation

```bash
bun install
```

## Usage

### List available workflows

```bash
bun run src/cli.ts list
```

Options:
- `--category <category>` - Filter by category
- `--type <type>` - Filter by type (set|template)
- `--variant <variant>` - Filter by variant
- `--json` - Output as JSON

### Inspect a workflow

```bash
bun run src/cli.ts inspect <workflow-id>
```

Example:
```bash
bun run src/cli.ts inspect opencode/opencode-pr
```

Options:
- `--variant <name>` - Show specific variant (default: standard)
- `--raw` - Show raw workflow YAML

### Install a workflow

```bash
bun run src/cli.ts install <workflow-id>
```

Example:
```bash
# Install standard variant
bun run src/cli.ts install opencode/opencode-pr

# Install Nix variant
bun run src/cli.ts install opencode/opencode-pr --variant nix

# Dry run (see what would be installed)
bun run src/cli.ts install opencode/opencode-pr --dry-run

# Install to specific target
bun run src/cli.ts install opencode/opencode-pr --target /path/to/repo

# Force overwrite existing file
bun run src/cli.ts install opencode/opencode-pr --force
```

Options:
- `--variant <name>` - Install specific variant (default: standard)
- `--force` - Overwrite existing files
- `--dry-run` - Show what would be installed
- `--target <path>` - Target repository path (default: current directory)

## Available Workflows

### Category: `opencode`

| Workflow | Type | Variants | Description |
|----------|------|----------|-------------|
| `opencode/opencode-pr` | set | standard, nix | AI-powered PR code review |
| `opencode/opencode` | set | standard, nix | Slash command handler (/oc) |
| `opencode/opencode-triage` | set | standard | AI issue triage |

## Workflow Structure

Workflows are organized by:
- **Category**: Product/ecosystem grouping (e.g., `opencode`)
- **Type**: `set` (ready-to-run) or `template` (requires edits)
- **Variant**: `standard` or `nix` toolchain

## Requirements

- Bun runtime
- Target repository must have `.github/workflows` directory (created automatically)
- Some workflows require secrets (shown during install)

## Architecture

```
workflows/
  opencode/
    sets/
      opencode.yml              # standard variant
      opencode-nix.yml          # nix variant
      opencode-pr.yml           # standard variant
      opencode-pr-nix.yml       # nix variant
      opencode-triage.yml       # standard variant

src/
  cli.ts                      # CLI entry point
  commands/
    list.ts                   # List command
    inspect.ts                # Inspect command
    install.ts                # Install command
  core/
    registry.ts               # Workflow discovery
  models/
    workflow.ts               # Type definitions
```
