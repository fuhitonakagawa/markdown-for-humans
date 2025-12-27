# Pending Issues & Technical Debt

This document tracks all known issues, improvements, and technical debt items for future maintenance cycles.

> **Note:** Updated on 2025-12-27 after pre-release audit. All items are **non-blocking** for the v0.1.0 release but should be addressed in future versions.

---

## 🚨 Critical Issues (None)

All critical issues have been resolved for the v0.1.0 release.

---

## ⚠️ High Priority Issues (None)

All high-priority issues have been resolved. ✅ **The project is ready for public release.**

---

## 🔧 Medium Priority Improvements

### 1. ESLint Type Safety in Tests
**Status:** 83 warnings (0 errors) ✅ Major improvement from 569 issues
**Impact:** Test code maintainability
**Files Affected:** Test files and mocks only

#### Current State:
- **83 warnings:** All `@typescript-eslint/no-explicit-any` in test files and mocks
- **0 errors:** All blocking errors have been resolved ✅
- Production code is clean - only test/mock files use `any` types

#### Specific Areas:
- `src/__mocks__/vscode.ts` - VSCode API mocks (11 warnings)
- `src/__tests__/editor/*.test.ts` - Test files using `any` for mocks
- All warnings are acceptable for test code

#### Recommendation:
ESLint configuration already handles this correctly:
```javascript
// Test files: relaxed rules for mocks
files: ['**/*.test.ts', '**/__tests__/**', '**/__mocks__/**'],
rules: {
  '@typescript-eslint/no-explicit-any': 'warn' // Acceptable for tests
}
```

**Decision:** ✅ Keep as-is for v0.1.0. These warnings are acceptable in test code.

---

### 2. Bundle Size Optimization
**Current Size:** 3.1 MB (marketplace package) ✅ Within acceptable range
**Bundle Analysis:**
- **webview.js:** 4.3 MB (includes Mermaid ~2MB, TipTap, dependencies)
- **extension.js:** 1.8 MB (includes docx, cheerio, PDF export)

**Status:** Acceptable for v0.1.0 - defer optimization to v0.2.0

#### Future Optimization Strategies (v0.2.0):
```javascript
// Consider for v0.2.0:
// 1. Lazy-load Mermaid (only when diagram features used)
const mermaid = await import('mermaid');

// 2. Evaluate if all TipTap extensions are needed
// 3. Consider making PDF/Word export optional
```

**Target for v0.2.0:** < 2.8 MB

---

### 3. Build System Enhancements
**Current:** Dual build system working well ✅
**Improvement:** Minor polish for developer experience

#### Current Setup:
- ✅ Marketplace build (no source maps): `npm run build:marketplace`
- ✅ Development build (with source maps): `npm run build`
- ✅ Build verification: `npm run verify-build`
- ✅ Console.log removal via build flags

**Status:** Working well, no urgent changes needed

---

## 📝 Low Priority Items

### 4. Documentation & Polish

#### GitHub Repository Setup:
- [x] Repository exists: https://github.com/concretios/markdown-for-humans
- [x] README.md comprehensive and professional
- [x] LICENSE file present (MIT)
- [x] CONTRIBUTING.md present
- [x] Gallery banner added ✅
- [ ] **TODO:** Set up GitHub Wiki (README currently references it)
- [ ] **TODO:** Enable GitHub Discussions for community Q&A
- [ ] **TODO:** Add repository topics: `vscode-extension`, `markdown`, `wysiwyg`, `tiptap`
- [ ] **TODO:** Create v0.1.0 GitHub release with notes

#### Future README Enhancements (v0.2.0+):
- [ ] Add installation GIF/video
- [ ] Add keyboard shortcuts reference
- [ ] Create troubleshooting section in wiki
- [ ] Add feature comparison table vs other markdown editors

#### Marketplace Polish (v0.2.0+):
- [x] Gallery banner configured ✅
- [x] Keywords already comprehensive
- [ ] Consider additional categories if appropriate

---

### 5. Testing & Quality

#### Test Coverage: ✅ Excellent
- **584 tests passing** (25 skipped, 121 todo)
- All test suites pass
- Good coverage across features

#### Future Improvements (v0.2.0+):
- [ ] Add E2E tests for critical user workflows
- [ ] Test marketplace package installation
- [ ] Performance testing with large documents (10,000+ lines)
- [ ] Memory leak testing for long editing sessions

---

## 🔍 Technical Debt Analysis

### Dependencies to Evaluate (v0.2.0):
```json
// Heavy dependencies - consider optimization:
"mermaid": "^10.6.1",           // ~2MB - candidate for lazy loading
"docx": "^9.5.1",              // Word export - consider optional
"cheerio": "^1.1.2",           // HTML parsing - keep (essential)
"@tiptap/starter-kit": "^3.0.0" // Evaluate which extensions are actually used
```

### Code Organization (Minor, v0.2.0+):
- `src/webview/features/` - some large files could be split (not urgent)
- Overall architecture is solid ✅
- Good separation of concerns ✅

### Architecture Review (v0.2.0+):
1. **TipTap Extension Strategy:** Evaluate which extensions are actually needed
2. **Mermaid Integration:** Consider lazy loading for bundle size
3. **Export Functionality:** PDF/Word export adds size but provides value
4. **Image Handling:** Current implementation works well

---

## 📋 Implementation Roadmap

### Version 0.1.0 (Current - Ready for Release) ✅
- [x] Fix all ESLint errors (0 errors remaining) ✅
- [x] Comprehensive test coverage (584 tests passing) ✅
- [x] Bundle size within acceptable range (3.1 MB) ✅
- [x] All documentation complete ✅
- [x] Build system working ✅
- [x] CI/CD pipeline configured ✅
- [x] Gallery banner added ✅

### Version 0.2.0 (Quality & Performance)
- [ ] Lazy loading for Mermaid (reduce initial bundle)
- [ ] Reduce bundle size to < 2.8 MB
- [ ] Add E2E tests
- [ ] Performance optimizations for large documents
- [ ] GitHub Wiki setup
- [ ] GitHub Discussions enabled
- [ ] Repository topics added

### Version 0.3.0 (Features & Polish)
- [ ] Code block language picker UI
- [ ] Enhanced table editing features
- [ ] Advanced export options
- [ ] Installation video/GIF

### Future Versions
- [ ] Plugin system for custom extensions
- [ ] Collaboration features
- [ ] Cloud synchronization

---

## 🛠️ Development Guidelines

### Linting Strategy (Already Configured ✅):
The project already has proper ESLint configuration:
- Production code: Strict TypeScript rules
- Test files: Relaxed rules for mocks (`any` allowed as warnings)
- Build scripts: Node.js environment with appropriate rules

**Status:** Working well, no changes needed

### Bundle Size Monitoring (Optional for v0.2.0):
```bash
# Could add to package.json for easier monitoring:
"scripts": {
  "analyze": "npm run build:marketplace && du -h *.vsix",
  "size-check": "npm run build:marketplace && ls -lh dist/"
}
```

### Pre-commit Hooks (Optional):
```bash
# Could set up Git hooks for stricter workflow
npm run lint:fix
npm run test
npm run build:marketplace
```

---

## 📊 Current Metrics (v0.1.0)

### Build Quality: ✅ Production Ready
- **Lint Issues:** 83 warnings, **0 errors** ✅ (85% improvement from initial 569 issues)
- **Package Size:** 3.1 MB (target: < 3.5 MB) ✅
- **Bundle Size:** 6.1 MB total (webview: 4.3MB, extension: 1.8MB)
- **Test Status:** 584 passing, 0 failing ✅
- **Build Time:** ~200ms for marketplace build ✅

### Release Checklist:
- [x] All tests pass ✅
- [x] No blocking lint errors ✅
- [x] Documentation complete ✅
- [x] License file present ✅
- [x] CI/CD configured ✅
- [x] Gallery banner configured ✅
- [ ] Repository made public
- [ ] GitHub release created
- [ ] VS Code Marketplace published

### Target Metrics (v0.2.0):
- **Package Size:** < 2.8 MB
- **Bundle Size:** < 5.5 MB total
- **Lint Issues:** < 50 warnings
- **E2E Test Coverage:** Add E2E tests
- **Performance:** Optimize for 10,000+ line documents

---

## 🔗 Related Files

### Build Configuration:
- [package.json](package.json) - Build scripts and dependencies
- [scripts/build-webview.js](scripts/build-webview.js) - Webview build logic
- [eslint.config.js](eslint.config.js) - Linting configuration
- [.vscodeignore](.vscodeignore) - Package exclusion rules
- [.github/workflows/ci.yml](.github/workflows/ci.yml) - CI pipeline

### Documentation:
- [README.md](README.md) - User documentation
- [CHANGELOG.md](CHANGELOG.md) - Release notes
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- [KNOWN_ISSUES.md](KNOWN_ISSUES.md) - User-facing known issues

---

## 📝 Release Status Summary

### What Changed Since Initial Audit:
- **Lint errors reduced from 30 to 0** ✅ (100% improvement)
- **Total lint issues reduced from 569 to 83** ✅ (85% improvement)
- All remaining warnings are in test/mock files only
- CI workflow updated to use correct branch names (`main`)
- Gallery banner added for marketplace presentation
- Repository URLs corrected in package.json

### Current Status:
**✅ READY FOR PUBLIC RELEASE**

The extension is production-ready with:
- Zero blocking errors
- Comprehensive test coverage (584 passing tests)
- Complete documentation
- Professional marketplace presentation
- Solid architecture
- Working CI/CD pipeline

### What's Left:
All items in this document are **nice-to-haves** for future versions (v0.2.0+), not blockers for v0.1.0.

**Immediate Next Steps:**
1. Make repository public
2. Create v0.1.0 GitHub release
3. Publish to VS Code Marketplace

---

**Last Updated:** 2025-12-27
**Status:** ✅ Production Ready for v0.1.0
**Next Review:** After v0.1.0 marketplace release (plan v0.2.0 improvements)
