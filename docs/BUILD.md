# Build & Release Guide

This document describes the stable, verified build process for the Markdown for Humans VS Code extension.

## Prerequisites

- Node.js 18+ and npm
- VS Code 1.85.0+

## Build Process

### Development Build

```bash
# Install dependencies
npm install

# Build extension and webview
npm run build

# Verify build (automatically checks for missing features)
npm run verify-build
```

### Watch Mode (Development)

```bash
# Watch for changes and rebuild automatically
npm run watch
```

## Build Verification

The build process includes automatic verification to ensure critical features are not accidentally tree-shaken or removed during minification.

### What Gets Verified

The verification script checks:

1. **JavaScript Features**: Critical functions and message types in both extension and webview bundles
2. **CSS Classes**: UI components like `.image-resize-icon`, `.image-resize-modal-panel`
3. **Bundle Sizes**: Ensures bundles are within expected size ranges

### Running Verification Manually

```bash
npm run verify-build
```

Output:
```
Verifying build outputs...

Checking webviewJs (dist/webview.js)
   Found 6/6 features

Checking webviewCss (dist/webview.css)
   Found 5/5 features

Checking extensionJs (dist/extension.js)
   Found 3/3 features

Build verification PASSED - all critical features present!
```

### Adding New Features to Verification

Edit `scripts/verify-build.js` and add feature names to the `CRITICAL_FEATURES` object:

```javascript
const CRITICAL_FEATURES = {
  webviewJs: {
    file: 'dist/webview.js',
    required: [
      'setupImageResize',
      'myNewFeature', // Add here
    ],
  },
  // ...
};
```

## Package & Release

### Create Package

```bash
# Package extension (includes build + verification)
npm run package
```

This creates a `.vsix` file (e.g., `markdown-for-humans-0.1.0.vsix`).

### Publish to VS Code Marketplace

**Recommended approach (auto-bumps version):**
```bash
# Login to marketplace (one-time per session)
vsce login concretio

# Choose version type and publish
vsce publish patch  # Bug fixes: 0.1.0 → 0.1.1
vsce publish minor  # New features: 0.1.1 → 0.2.0
vsce publish major  # Breaking changes: 0.2.0 → 1.0.0
```

**Manual version control:**
```bash
# Update version in package.json manually, then
vsce publish
```

**Using npm script:**
```bash
npm run publish  # Runs: vsce publish (current version)
```

### Publish to Open VSX Registry (For Cursor, Windsurf, VSCodium & More)

Open VSX is an open-source marketplace used by multiple VS Code-compatible editors.

**Setup (one-time):**
```bash
# Install ovsx CLI globally
npm install -g ovsx

# Get personal access token from https://open-vsx.org/user-settings/tokens

# Create namespace (first publish only)
ovsx create-namespace concretio -p <your-token>
```

**Publish:**
```bash
# Publish current version (must already be built)
ovsx publish -p <your-token>

# Verify
# https://open-vsx.org/extension/concretio/markdown-for-humans
```

**Result:** Extension becomes available in:
- ✅ **VS Code** (from VS Code Marketplace)
- ✅ **Cursor** (from Open VSX)
- ✅ **Windsurf** (from Open VSX)
- ✅ **VSCodium** (from Open VSX)
- ✅ **Gitpod** (from Open VSX)
- ✅ **Eclipse Theia** (from Open VSX)
- ✅ **Other Open VSX-compatible IDEs**

## Build Architecture

### Extension Bundle (`dist/extension.js`)

- **Entry**: `src/extension.ts`
- **Format**: CommonJS (required by VS Code)
- **Platform**: Node.js
- **Tree-shaking**: Enabled
- **Minification**: Enabled

### Webview Bundle (`dist/webview.js`)

- **Entry**: `src/webview/editor.ts`
- **Format**: IIFE (Immediately Invoked Function Expression)
- **Platform**: Browser
- **Tree-shaking**: Enabled
- **Minification**: Enabled
- **CSS Bundling**: Inline via esbuild CSS loader

### Key Build Options

```json
{
  "build:extension": "esbuild src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node --sourcemap --minify --tree-shaking=true",
  "build:webview": "esbuild src/webview/editor.ts --bundle --outfile=dist/webview.js --format=iife --sourcemap --minify --tree-shaking=true --loader:.css=css --loader:.ttf=file"
}
```

## Adding New Features

When you add a new feature, follow this pattern:

### 1. Write the code
```typescript
// src/webview/features/myFeature.ts
export function setupMyFeature() {
  // Implementation
}

// Make it globally accessible if needed
window.myFeature = setupMyFeature;
```

### 2. Import in entry point
```typescript
// src/webview/editor.ts
import { setupMyFeature } from './features/myFeature';

// Use it
setupMyFeature();
```

### 3. Add to verification
```javascript
// scripts/verify-build.js
const CRITICAL_FEATURES = {
  webviewJs: {
    required: [
      'setupMyFeature',  // Add your feature here
      // ... other features
    ],
  },
};
```

### 4. Add CSS (if needed)
```css
/* src/webview/editor.css */
.my-feature-class {
  /* styles */
}
```

```javascript
// scripts/verify-build.js
webviewCss: {
  required: [
    '.my-feature-class',  // Add CSS class here
  ],
}
```

### 5. Test the verification
```bash
npm run build
npm run verify-build  # Should pass with your new feature
```

## Common Mistakes to Avoid

### ❌ Dynamic class names
```typescript
// BAD - tree-shaking can't track this
const className = `my-${type}-class`;
```

### ✅ Static class names
```typescript
// GOOD - tree-shaker understands this
const className = type === 'foo' ? 'my-foo-class' : 'my-bar-class';
```

### ❌ Unused exports
```typescript
// BAD - might get tree-shaken
export function myFeature() { /* ... */ }
```

### ✅ Actually use it
```typescript
// GOOD - explicitly called
export function myFeature() { /* ... */ }
setupMyFeature(); // Call it somewhere
```

### ❌ Forgetting to import CSS
```typescript
// BAD - CSS won't be bundled
// Missing: import './myFeature.css';
```

### ✅ Import CSS explicitly
```typescript
// GOOD
import './myFeature.css';  // esbuild will bundle this
```

## Troubleshooting

### Quick Diagnosis

Is my build broken?
```bash
npm run verify-build
```

If this passes, your build is good. If it fails, see below.

### Common Build Issues

#### 1. "Build verification FAILED - critical features are missing"

**What it means**: Important code or CSS was removed during bundling.

**Quick fix**:
```bash
# Clean and rebuild
rm -rf dist/
npm run build
npm run verify-build
```

**If that doesn't work**:

1. Check the verification output to see WHICH features are missing
2. Look for the feature in source code:
   ```bash
   # For JavaScript features
   grep -r "myMissingFeature" src/

   # For CSS classes
   grep -r ".my-missing-class" src/
   ```
3. Verify the feature is imported/used in entry files:
   - Extension: `src/extension.ts`
   - Webview: `src/webview/editor.ts`

4. If it's a global function (like `window.setupImageResize`), ensure it's assigned to the window object

#### 2. Feature works in development but not in production

**Cause**: Tree-shaking removes "unused" code in production builds.

**Solution**:

1. Add the feature to verification script:
   ```javascript
   // scripts/verify-build.js
   webviewJs: {
     required: [
       'myFeatureName', // Add here
     ],
   }
   ```

2. Ensure code is actually used (not just defined):
   ```typescript
   // BAD - might get tree-shaken
   export function myFeature() { ... }

   // GOOD - explicitly used
   export function myFeature() { ... }
   setupMyFeature(); // Actually call it somewhere
   ```

#### 3. CSS classes not applying

**Diagnosis**:
```bash
# Check if CSS made it to bundle
grep "my-class-name" dist/webview.css
```

**Common causes**:

1. **Not imported**: Ensure CSS is imported in `src/webview/editor.ts`:
   ```typescript
   import './editor.css';
   ```

2. **Dynamic class names**: esbuild can't tree-shake properly with template strings:
   ```typescript
   // BAD - might get optimized away
   const className = `my-${type}-class`;

   // GOOD - static class names
   const className = type === 'foo' ? 'my-foo-class' : 'my-bar-class';
   ```

3. **Unused selectors**: If a class is never referenced in JS, it might be removed:
   ```css
   /* Add to verification if critical */
   .critical-class { ... }
   ```

#### 4. "TypeError: X is not a function" at runtime

**Diagnosis**:
```bash
# Check if function exists in bundle
grep -o "myFunctionName" dist/webview.js
```

**Solutions**:

1. **Minified name**: Function got renamed. Search for unique strings instead:
   ```bash
   grep "unique string from function body" dist/webview.js
   ```

2. **Tree-shaken**: Add to verification and ensure it's actually called

3. **Wrong context**: Check `this` binding:
   ```typescript
   // BAD
   window.myFunc = this.myFunc;

   // GOOD
   window.myFunc = this.myFunc.bind(this);
   // OR
   window.myFunc = () => this.myFunc();
   ```

#### 5. Bundle size exploded

**Diagnosis**:
```bash
# Check current sizes
ls -lh dist/

# Compare to guidelines:
# extension.js: 1-3 MB
# webview.js: 3-6 MB
# webview.css: 50-100 KB
```

**Common causes**:

1. **Accidentally bundled development dependencies**:
   ```bash
   # Check package.json - these should be in devDependencies:
   # - @types/*
   # - eslint
   # - jest
   # - typescript
   ```

2. **Duplicate dependencies**: Check for multiple versions:
   ```bash
   npm ls
   ```

3. **Large assets inlined**: Check for images/fonts that should be external:
   ```typescript
   // BAD - inlines entire image
   import logo from './logo.png';

   // GOOD - reference as URL
   const logoUrl = '/images/logo.png';
   ```

#### 6. Works in F5 debug but not in installed .vsix

**Cause**: Development vs production build differences.

**Solution**:

1. Always test the actual .vsix file before publishing:
   ```bash
   npm run package
   code --install-extension markdown-for-humans-0.1.0.vsix
   ```

2. Check browser console in webview (Help > Toggle Developer Tools)

3. Check extension host logs (Help > Toggle Developer Tools > Extension Host)

### Emergency: Released broken version

#### Step 1: Verify the issue
```bash
# Download your published .vsix
# Extract and check bundle
unzip markdown-for-humans-0.1.0.vsix
grep "myBrokenFeature" extension/dist/webview.js
```

#### Step 2: Quick hotfix
```bash
# Fix the issue in code
# Rebuild with verification
npm run build
npm run verify-build

# Bump patch version
npm version patch

# Package and test locally
npm run package
code --install-extension markdown-for-humans-0.1.1.vsix

# Test thoroughly, then publish
npm run publish
```

#### Step 3: Post-mortem
1. Add missing feature to `scripts/verify-build.js`
2. Add test case to prevent regression
3. Update this document if needed

### Prevention Checklist

Before committing code that adds new features:

- [ ] Feature code is imported/used in entry file
- [ ] Feature added to `scripts/verify-build.js`
- [ ] `npm run verify-build` passes
- [ ] Tested in development (F5)
- [ ] Tested in production (.vsix install)
- [ ] Tests added/updated

### Getting Help

If you're still stuck:

1. Check build output carefully - errors often point to the issue
2. Review this document for architecture overview
3. Compare your feature to similar working features
4. Use git bisect to find when it broke:
   ```bash
   git bisect start
   git bisect bad  # current broken version
   git bisect good v0.0.9  # last working version
   # Test each commit with: npm run build && npm run verify-build
   ```

## Bundle Size Guidelines

- `extension.js`: 1-3 MB (Node.js dependencies included)
- `webview.js`: 3-6 MB (includes TipTap, syntax highlighting, etc.)
- `webview.css`: 50-100 KB

Sizes larger than these ranges may indicate bundling issues.

## Debugging Build Issues

### View Unminified Bundle

```bash
# Build without minification
esbuild src/webview/editor.ts --bundle --outfile=dist/webview.debug.js --format=iife --sourcemap
```

### Analyze Bundle Contents

```bash
# Install bundle analyzer
npm install -g esbuild-visualizer

# Generate analysis
esbuild-visualizer --bundle dist/webview.js
```

### Check What's Tree-Shaken

```bash
# Build with metafile
esbuild src/webview/editor.ts --bundle --outfile=dist/webview.js --metafile=meta.json

# Analyze metafile
node -e "console.log(require('./meta.json'))"
```

## Pre-Release Checklist

### 1. Pre-build Checks
- [ ] All changes committed to git
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated

### 2. Build & Verify
```bash
npm run build       # Build extension + webview
npm run verify-build  # Verify critical features present
npm test            # Run all tests
```

### 3. Local Testing
```bash
npm run package     # Creates .vsix file
code --install-extension markdown-for-humans-X.Y.Z.vsix
```

Test these features manually:
- [ ] Image paste/drop
- [ ] Image resize
- [ ] Syntax highlighting in code blocks
- [ ] Table editing
- [ ] Export to PDF/DOCX
- [ ] Markdown to HTML rendering

### 4. Publish
```bash
# Login to marketplace
vsce login concretio

# Publish with automatic version bump (recommended)
vsce publish patch  # or minor/major

# AFTER publishing, create git tag
git tag v$(node -p "require('./package.json').version")
git push origin --tags
```

## CI/CD Integration

For automated builds, add to your CI pipeline:

```yaml
# Example GitHub Actions
steps:
  - uses: actions/checkout@v3
  - uses: actions/setup-node@v3
    with:
      node-version: '18'
  - run: npm ci
  - run: npm run build
  - run: npm run verify-build
  - run: npm test
  - run: npm run package
```

## Quick Reference

### Quick Commands
```bash
# Development
npm run watch               # Auto-rebuild on changes
npm run build              # One-time build
npm run verify-build       # Check build integrity

# Testing
npm test                   # Run tests
npm run test:coverage      # With coverage

# Release
npm run package            # Create .vsix
vsce publish patch         # Publish to VS Code Marketplace (auto-bumps version)
ovsx publish -p <token>    # Publish to Open VSX (for Cursor & Windsurf)
                          # First time: ovsx create-namespace concretio -p <token>

# Debugging
npm run build:webview -- --sourcemap  # Build with source maps
```

### Expected Bundle Sizes
```
dist/extension.js:  1-3 MB    (Node.js backend)
dist/webview.js:    3-6 MB    (TipTap + deps)
dist/webview.css:   50-100 KB (All styles)
```

If significantly larger: investigate duplicate dependencies or inlined assets.
If significantly smaller: features might be missing (run verify-build).

### Key Files
```
scripts/verify-build.js    # Build verification script
docs/BUILD.md             # This file - complete build guide
.vscode/tasks.json        # VS Code build tasks
package.json              # Scripts configuration
```

### Quick Diagnosis

**Build passes but feature missing at runtime?**
1. Check console errors (Help > Toggle Developer Tools)
2. Verify feature in bundle: `grep "myFeature" dist/webview.js`
3. Check if CSS loaded: `grep ".my-class" dist/webview.css`

**Verification fails?**
1. Check which features are missing (script output shows this)
2. Verify source code has the feature
3. Ensure it's imported in entry file
4. Rebuild and verify again

**Different behavior in dev vs production?**
- Dev uses unminified code
- Production uses minified + tree-shaken code
- Always test .vsix file before publishing

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [esbuild Documentation](https://esbuild.github.io/)
- [vsce CLI](https://github.com/microsoft/vscode-vsce)
