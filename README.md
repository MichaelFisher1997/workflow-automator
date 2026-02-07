# ActionFlow

Interactive TUI for installing curated GitHub Actions workflows with a cyberpunk aesthetic.

## Features

- 🎨 **Cyberpunk UI**: Neon colors, smooth animations, modern terminal interface
- ⚡ **Fast Navigation**: Vim keys (j/k), arrow keys, number shortcuts
- 🎯 **Two-Panel Layout**: Browse workflows on the left, see details on the right
- 🔒 **Safe Installation**: Never overwrites without confirmation
- 📐 **Terminal Aware**: Warns if terminal is too small, adapts to window size
- 🎹 **Keyboard Driven**: No mouse required

## Installation

```bash
bun install
```

## Usage

Launch the TUI:

```bash
bun run src/tui/index.tsx
# or
./src/tui/index.tsx
```

Or install globally:

```bash
bun install -g @openstaticfish/actionflow
actionflow
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑/↓` or `j/k` | Navigate workflows |
| `←/→` or `h/l` | Switch category |
| `Space` | Select/unselect current variant row |
| `Enter` | Open batch confirmation |
| `D / F` | Toggle dry-run / force in confirmation modal |
| `?` | Toggle help overlay |
| `q` or `Ctrl+C` | Quit |

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ ACTIONFLOW v0.1.0                 Category: [opencode ▼]   │
├──────────────────┬──────────────────────────────────────────────┤
│  🌲 Tree         │  ┌─ Workflow Details ──────────────────────┐│
│  ▾ pr            │  │  🔍 OpenCode AI PR Review               ││
│    [x] standard  │  │                                           ││
│    [ ] nix       │  │  Category: opencode  Type: pr            ││
│  ▾ triage        │  │  Variant: standard                        ││
│                  │  │                                           ││
│                  │  │  ⚠️  Secrets: KIMI_API_KEY              ││
│                  │  │                                           ││
│                  │  │  [Enter] Install (standard)             ││
│                  │  └───────────────────────────────────────────┘│
├──────────────────┴──────────────────────────────────────────────┤
│  [←/→] Category [↑/↓] Navigate [Space] Select [Enter] Batch     │
└─────────────────────────────────────────────────────────────────┘
```

## Available Workflows

### Category: `opencode`

| Workflow | Type | Variants | Description |
|----------|------|----------|-------------|
| `opencode/pr` | set | standard, nix | AI-powered PR code review |
| `opencode/opencode` | set | standard, nix | Slash command handler (/oc) |
| `opencode/triage` | set | standard | AI issue triage |

## Requirements

- Terminal with minimum 80x24 characters
- Truecolor support recommended (iTerm2, Kitty, Alacritty)
- Bun runtime

## Architecture

```
src/
├── tui/                      # TUI application
│   ├── index.tsx             # Entry point
│   ├── components/           # React components
│   │   ├── App.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DetailPanel.tsx
│   │   ├── HelpOverlay.tsx
│   │   ├── TooSmallPopup.tsx
│   │   └── Spinner.tsx
│   ├── hooks/                # Custom hooks
│   │   ├── useTerminalSize.ts
│   │   ├── useWorkflows.ts
│   │   └── useNavigation.ts
│   ├── theme/
│   │   └── cyberpunk.ts      # Color palette
│   └── utils/
│       └── terminal-check.ts
├── core/
│   └── registry.ts           # Workflow discovery
└── models/
    └── workflow.ts           # Type definitions
```

## Theme Customization

Edit `src/tui/theme/cyberpunk.ts` to customize colors:

```typescript
colors: {
  bg: '#0a0a0f',           // Background
  primary: '#00f5ff',      // Cyan accent
  secondary: '#ff00ff',    // Magenta
  success: '#00ff88',      // Green
  warning: '#ffea00',      // Yellow
  error: '#ff0044',        // Red
  // ... more colors
}
```
