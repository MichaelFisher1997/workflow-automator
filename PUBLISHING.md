# ActionFlow NPM Publishing Plan

**Package:** `@openstaticfish/actionflow`  
**Version:** 0.1.0  
**License:** MIT  

## Overview

This document outlines the complete plan to rename `workflow-automator` to `actionflow` and publish it as `@openstaticfish/actionflow` on npm.

---

## Prerequisites

1. **GitHub Organization Setup**
   - Create or verify access to `openstaticfish` organization on GitHub
   - Ensure you have owner/admin permissions

2. **NPM Organization Setup**
   - Create `@openstaticfish` scope on npm (if not exists)
   - Run: `npm login` to authenticate

3. **Repository Move**
   - Rename repository from `workflow-automator` to `actionflow`
   - Transfer to `openstaticfish/actionflow`
   - Update all local remotes

---

## Step-by-Step Publishing Process

### 1. Repository Renaming & Transfer

```bash
# Update local repository name references
git remote rename origin old-origin
git remote add origin https://github.com/openstaticfish/actionflow.git

# Push to new location
git push -u origin main
```

### 2. Package.json Updates

Update `package.json` with new package identity:

```json
{
  "name": "@openstaticfish/actionflow",
  "version": "0.1.0",
  "description": "A terminal UI tool for managing and installing GitHub Actions workflow templates",
  "license": "MIT",
  "author": "Your Name <email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/openstaticfish/actionflow.git"
  },
  "homepage": "https://github.com/openstaticfish/actionflow#readme",
  "bugs": {
    "url": "https://github.com/openstaticfish/actionflow/issues"
  },
  "keywords": [
    "github-actions",
    "workflow",
    "cli",
    "terminal",
    "tui",
    "automation",
    "ci-cd",
    "templates"
  ],
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "bin": {
    "actionflow": "./dist/index.js",
    "af": "./dist/index.js"
  },
  "files": [
    "dist",
    "workflows",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "bun": ">=1.0.0"
  },
  "scripts": {
    "start": "bun run src/tui/index.tsx",
    "build": "bun build src/tui/index.tsx --outdir=dist --target=bun",
    "build:types": "tsc --declaration --emitDeclarationOnly --outDir dist",
    "prepublishOnly": "bun run build && bun run build:types",
    "test": "bun test"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "dependencies": {
    "ink": "^5.0.0",
    "react": "^18.2.0",
    "yaml": "^2.4.0"
  }
}
```

### 3. Create LICENSE File

Create `LICENSE`:

```
MIT License

Copyright (c) 2026 OpenStaticFish

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 4. Create .npmignore

Create `.npmignore` to exclude development files:

```
# Source files (we publish compiled dist/)
src/

# Development
node_modules/
.github/
CLAUDE.md
AGENTS.md
.env
.env.local

# Build artifacts
dist/**/*.test.js
dist/**/*.test.d.ts
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/
.nyc_output/

# OS
.DS_Store
Thumbs.db
```

### 5. Update TypeScript Configuration

Ensure `tsconfig.json` supports declaration generation:

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "allowImportingTsExtensions": true,
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 6. Update Source Code References

Search and replace in source files:
- `workflow-automator` → `actionflow`
- Update any hardcoded references to old package name

### 7. Build and Test

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun test

# Verify build output
ls -la dist/
```

### 8. Verify Package Contents

```bash
# Check what will be published
npm pack --dry-run
```

Expected output should include:
- `dist/index.js`
- `dist/index.d.ts` (if types are generated)
- `workflows/` directory
- `README.md`
- `LICENSE`
- `package.json`

### 9. Update README

Update `README.md` with:
- New package name: `@openstaticfish/actionflow`
- New install command: `bun install -g @openstaticfish/actionflow`
- Updated badges and links
- New binary names: `actionflow` or `af`

### 10. Publish to NPM

```bash
# Login to npm (if not already)
npm login

# For scoped packages, you may need to set access
npm publish --access public
```

---

## Post-Publish Checklist

- [ ] Verify package is live: `npm view @openstaticfish/actionflow`
- [ ] Test installation: `bun install -g @openstaticfish/actionflow`
- [ ] Test CLI: `actionflow --help` or `af --help`
- [ ] Update GitHub repo description
- [ ] Create GitHub release with v0.1.0 tag
- [ ] Update any documentation sites

---

## Future Updates

To publish updates:

```bash
# Update version
npm version patch  # or minor, major

# Publish (prepublishOnly runs build automatically)
npm publish
```

---

## Troubleshooting

### Common Issues

1. **"You do not have permission"** - Ensure you're logged in and have access to `@openstaticfish` scope
2. **"Package name is too similar"** - Try a different name or contact npm
3. **Build fails** - Check Bun is installed: `bun --version`
4. **Types not generated** - Ensure `tsconfig.json` has `