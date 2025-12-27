---
name: Code Quality Debt & Stability Improvements
overview: Deep audit and remediation plan for code quality debt and stability issues. Based on comparison with opus-audit.md (Dec 5, 2025) and current codebase state. Focus on realistic, non-breaking improvements with proper testing.
todos:
  - id: fix-substr-deprecation
    content: Replace all substr() calls with substring() or slice() - 6 instances in mermaid.ts and tests
    status: completed
  - id: add-conditional-logger
    content: NOT NEEDED - Build system already strips console.log via esbuild 'pure' option in scripts/build-webview.js (line 37). Production builds automatically remove console.log/debug/info while keeping console.error/warn.
    status: completed
  - id: fix-mermaid-listener-leak
    content: Add destroy() method to mermaid node view to remove document click listener
    status: completed
  - id: fix-applyEdit-error-handling
    content: Add try/catch and user-facing error messages to applyEdit() in MarkdownEditorProvider
    status: completed
  - id: fix-editor-global-listeners
    content: Store and remove contextmenu, click, keydown listeners when editor is destroyed
    status: completed
  - id: fix-window-drag-listeners
    content: Store and remove window dragover/drop/dragleave listeners in imageDragDrop.ts
    status: completed
  - id: replace-ignoreNextUpdate
    content: Replace boolean ignoreNextUpdate flag with hash-based content deduplication for more reliable sync
    status: completed
  - id: remove-any-types
    content: "Replace any types with proper TypeScript types in BubbleMenuView, dialogs, editor.ts (125 instances → <20). Includes BubbleMenuView audit findings: fix 3 any types, add file header, add JSDoc, remove debug logs"
    status: completed
  - id: add-message-interfaces
    content: Create typed interfaces for webview ↔ extension messages
    status: completed
  - id: document-word-export-limitation
    content: Add user warning and documentation for remote image limitation in Word export
    status: completed
  - id: write-listener-cleanup-tests
    content: Write unit tests to verify listeners are cleaned up on destroy
    status: completed
  - id: write-sync-hash-tests
    content: Write unit tests for hash-based sync deduplication logic
    status: completed
  - id: expand-bubblemenuview-tests
    content: "Expand BubbleMenuView test coverage: setCodeBlockNormalized(), positionBubbleMenu(), createTableMenu(), dropdown interactions, error scenarios"
    status: completed
---

# Code Quality Debt & Stability Improvements Plan

## Executive Summary

This plan addresses code quality debt and stability risks identified in `docs/opus-audit.md` (Dec 5, 2025) and verified against current codebase (Dec 13, 2025). **Updated Dec 13, 2025** with findings from `AUDIT_BubbleMenuView.md` audit.**Focus:** **realistic, testable, non-breaking improvements** that stabilize the codebase without disrupting user workflows.**Key Findings:**

- **Status:** Most issues from opus-audit still present (8 days later)
- **Risk Level:** Medium-High (memory leaks, error handling gaps, type safety)
- **Impact:** Performance degradation over time, silent failures, harder debugging
- **Approach:** Incremental fixes with tests, prioritize high-impact/low-risk items first

**Audit Integration (Dec 13, 2025):**

- **BubbleMenuView.ts audit** completed - findings integrated into Issue 1.1.1
- **Additional issues identified:**
- Missing file-level documentation headers
- Incomplete JSDoc for exported functions
- Development `console.log()` statements in production code
- Test coverage gaps for complex functions (`setCodeBlockNormalized`, `positionBubbleMenu`, `createTableMenu`)
- **Positive findings:** Excellent theme integration, good accessibility, performance meets budgets

---

## Part 1: TypeScript Type Safety

### 1.1 Remove `any` Types (High Priority)

**Current State:**

- Found **125 instances** of `any` across codebase
- Critical files: `BubbleMenuView.ts`, `editor.ts`, `imageEnterSpacing.ts`, dialog files

**Issues:**

#### Issue 1.1.1: BubbleMenuView.ts `editor: any` (Audit: Dec 13, 2025)

**Location:** `src/webview/BubbleMenuView.ts:191, 525, 867`**Current:**

```typescript
export function createFormattingToolbar(editor: any): HTMLElement
export function createTableMenu(editor: any): HTMLElement
const vscodeApi = (window as any).vscode;  // Line 525
```

**Audit Findings:**

- 3 instances of `any` types in BubbleMenuView.ts
- Missing file-level documentation header
- Missing JSDoc for exported functions (`createFormattingToolbar`, `positionBubbleMenu`, `createTableMenu`)
- Development `console.log()` statements (lines 523, 526, 528) should be removed
- Test coverage gaps: `setCodeBlockNormalized()`, `positionBubbleMenu()`, `createTableMenu()` untested

**Fix:**

```typescript
import type { Editor } from '@tiptap/core';

// Add proper VS Code API type
interface VSCodeAPI {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

declare global {
  interface Window {
    vscode?: VSCodeAPI;
  }
}

export function createFormattingToolbar(editor: Editor): HTMLElement
export function createTableMenu(editor: Editor): HTMLElement
const vscodeApi = window.vscode;  // Now properly typed
```

**Additional Fixes Needed:**

1. Add file-level header describing purpose and key exports
2. Add JSDoc to all exported functions
3. Remove development `console.log()` statements (lines 523, 526, 528)
4. Expand test coverage for complex functions

**Risk:** Low - Type-only change, no runtime impact**Test:** Verify toolbar still works, TypeScript compiles without errors**Estimated Time:** 1 hour (types) + 30 minutes (docs) + 5 minutes (logging) = ~1.5 hours

#### Issue 1.1.2: editor.ts `acquireVsCodeApi: any`

**Location:** `src/webview/editor.ts:70`**Current:**

```typescript
declare const acquireVsCodeApi: any;
```

**Fix:**

```typescript
declare const acquireVsCodeApi: () => {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};
```

**Risk:** Low - Type declaration only**Test:** Verify VS Code API still works

#### Issue 1.1.3: Window Global Properties

**Location:** `src/webview/editor.ts:75, 128, 141` and many others**Current:**

```typescript
(window as any).vscode = vscode;
(window as any).resolveImagePath = function...
```

**Fix:** Create proper interface:

```typescript
interface WindowWithMD4H extends Window {
  vscode?: VsCodeApi;
  resolveImagePath?: (path: string) => Promise<string>;
  setupImageResize?: (img: HTMLImageElement, editor?: Editor, api?: VsCodeApi) => void;
  skipResizeWarning?: boolean;
  _workspaceCheckCallbacks?: Map<string, (result: any) => void>;
}
```

**Risk:** Low - Type-only change**Test:** Verify all window property accesses still work

#### Issue 1.1.4: Dialog Functions `editor: any`

**Location:** `src/webview/features/linkDialog.ts:497`, `tableInsert.ts:179`, `imageInsertDialog.ts`**Fix:** Import `Editor` type from TipTap**Risk:** Low**Test:** Verify dialogs still open and work

#### Issue 1.1.5: imageEnterSpacing.ts Type Assertions

**Location:** `src/webview/extensions/imageEnterSpacing.ts:16, 27, 34, 90, etc.`**Current:** Many `as any` casts for ProseMirror internals**Fix:** Import proper ProseMirror types where possible, use `unknown` + type guards for truly opaque types**Risk:** Medium - ProseMirror types are complex**Test:** Verify Enter/Delete around images still works**Note:** Some `any` may be necessary for ProseMirror internals - document why**Implementation Plan:**

1. Start with low-risk files (BubbleMenuView, dialogs)
2. Add proper type imports
3. Run TypeScript compiler - fix errors incrementally
4. Test each file's functionality
5. Document any remaining `any` with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and reason

**Estimated Time:** 4-6 hours (includes BubbleMenuView fixes: types + docs + logging)**Priority:** High (affects maintainability, catches bugs at compile time)---

### 1.2 Add Type Interfaces for Messages

**Current State:** Message types are untyped `{ type: string; [key: string]: unknown }`**Fix:** Create message type definitions:

```typescript
// src/webview/types/messages.ts
export interface WebviewToExtensionMessage {
  type: 'edit' | 'save' | 'ready' | 'outlineUpdated' | 'selectionChange' | 
        'saveImage' | 'handleWorkspaceImage' | 'resolveImageUri' | 'openSourceView' |
        'exportDocument' | 'resizeImage' | 'undoResize' | 'redoResize' | 
        'updateSetting' | 'checkImageInWorkspace' | 'copyLocalImageToWorkspace';
  [key: string]: unknown;
}

export interface ExtensionToWebviewMessage {
  type: 'update' | 'settingsUpdate' | 'imageSaved' | 'imageError' | 
        'imageResized' | 'imageUndoResized' | 'imageRedoResized' |
        'imageUriResolved' | 'insertWorkspaceImage' | 'imageWorkspaceCheck' |
        'localImageCopied' | 'localImageCopyError';
  [key: string]: unknown;
}
```

**Risk:** Low**Test:** Verify message handling still works**Estimated Time:** 1 hour---

## Part 2: Console Logging Cleanup

### 2.1 Current State

**Found:** 141 instances of `console.log/error/warn/debug` across codebase**Categories:**

1. **Debug logs** (should be conditional): ~80 instances

- `[MD4H] Key pressed...`, `*** SAVE SHORTCUT TRIGGERED ***`
- `[MD4H] Editor created successfully`
- `[TabIndentation] Tab key pressed` (many in tabIndentation.ts)
- `[ImageEnterSpacing]` logs (many)

2. **Error logs** (should stay, but improve): ~30 instances

- Legitimate error logging

3. **Warning logs** (should stay): ~20 instances

- Legitimate warnings

4. **Info logs** (should be conditional): ~11 instances

### 2.2 Implementation: Conditional Logger

**Create:** `src/webview/utils/logger.ts`

```typescript
const DEBUG_ENABLED = 
  (window as WindowWithMD4H).__MD4H_DEBUG__ === true ||
  process.env.NODE_ENV === 'development';

export const logger = {
  debug: DEBUG_ENABLED 
    ? (...args: unknown[]) => console.log('[MD4H]', ...args)
    : () => {},
  info: (...args: unknown[]) => console.info('[MD4H]', ...args),
  warn: (...args: unknown[]) => console.warn('[MD4H]', ...args),
  error: (...args: unknown[]) => console.error('[MD4H]', ...args),
};
```

**Migration Strategy:**

1. Replace `console.log('[MD4H] ...') `→ `logger.debug(...)`
2. Replace `console.error('[MD4H] ...') `→ `logger.error(...)` (keep all errors)
3. Replace `console.warn('[MD4H] ...') `→ `logger.warn(...)` (keep all warnings)
4. Remove excessive debug logs in production code paths

**Files to Update:**

- `src/webview/editor.ts` - Remove verbose key press logs, keep errors
- `src/webview/extensions/tabIndentation.ts` - Remove all debug logs (many)
- `src/webview/extensions/imageEnterSpacing.ts` - Remove debug logs, keep warnings
- `src/webview/BubbleMenuView.ts` - Remove debug logs (lines 523, 526, 528), add file header, add JSDoc (lines 523, 526, 528: `console.log('[MD4H] Image button clicked')`, etc.)
- `src/webview/features/imageDragDrop.ts` - Remove debug logs, keep errors

**Risk:** Low - Logging only, no functional changes**Test:**

- Verify no console spam in production
- Verify errors still logged
- Test with `window.__MD4H_DEBUG__ = true` to enable debug mode

**Estimated Time:** 2-3 hours---

## Part 3: Deprecated API Usage

### 3.1 Replace `substr()` with `substring()` or `slice()`

**Current State:** 6 instances found

- `src/webview/extensions/mermaid.ts:16, 17, 18, 171, 191`
- `src/__tests__/webview/mermaid-interaction.test.ts:33`

**Fix:**

```typescript
// Before
hex.substr(0, 2)  // Deprecated
Math.random().toString(36).substr(2, 9)

// After
hex.substring(0, 2)  // or hex.slice(0, 2)
Math.random().toString(36).slice(2, 11)  // slice(2, 11) = substr(2, 9)
```

**Risk:** Very Low - Simple string method replacement**Test:** Verify mermaid diagrams still render, IDs still unique**Estimated Time:** 15 minutes---

## Part 4: Error Handling Improvements

### 4.1 Add Error Handling to `applyEdit()`

**Location:** `src/editor/MarkdownEditorProvider.ts:866-888`**Current:**

```typescript
private applyEdit(content: string, document: vscode.TextDocument) {
  // ... validation ...
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, fullRange, unwrappedContent);
  return vscode.workspace.applyEdit(edit);  // ❌ No error handling
}
```

**Fix:**

```typescript
private async applyEdit(content: string, document: vscode.TextDocument): Promise<boolean> {
  // ... validation ...
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, fullRange, unwrappedContent);
  
  try {
    const success = await vscode.workspace.applyEdit(edit);
    if (!success) {
      const errorMsg = 'Failed to apply edit to document. The file may be read-only or locked.';
      vscode.window.showErrorMessage(errorMsg);
      logger.error('[MD4H] applyEdit failed:', { uri: document.uri.toString() });
    }
    return success;
  } catch (error) {
    const errorMsg = error instanceof Error 
      ? `Failed to save changes: ${error.message}`
      : 'Failed to save changes: Unknown error';
    vscode.window.showErrorMessage(errorMsg);
    logger.error('[MD4H] applyEdit exception:', error);
    return false;
  }
}
```

**Risk:** Low - Adds error handling, doesn't change behavior on success**Test:**

- Normal save still works
- Test with read-only file (should show error)
- Test with locked file (should show error)

**Estimated Time:** 30 minutes---

### 4.2 Improve Error Messages Throughout

**Current:** Many `console.error()` without user-facing messages**Strategy:**

- Critical errors → Show VS Code error message
- Non-critical errors → Log only
- Add context (file path, operation) to error messages

**Files to Update:**

- `MarkdownEditorProvider.ts` - Image save/export errors
- `editor.ts` - Editor initialization errors
- `imageDragDrop.ts` - Image insertion errors

**Risk:** Low**Estimated Time:** 1-2 hours---

## Part 5: Memory Leak Fixes

### 5.1 Mermaid Listener Leak (High Priority)

**Location:** `src/webview/extensions/mermaid.ts:251-255`**Current:**

```typescript
// Click outside: Remove highlight
document.addEventListener('click', e => {
  if (!container.contains(e.target as HTMLElement) && isHighlighted) {
    removeHighlight();
  }
});
// ❌ Never removed!
```

**Fix:**

```typescript
addNodeView() {
  return ({ node, getPos, editor }) => {
    // ... existing code ...
    
    const handleDocumentClick = (e: MouseEvent) => {
      if (!container.contains(e.target as HTMLElement) && isHighlighted) {
        removeHighlight();
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return {
      dom: container,
      update: (updatedNode) => { /* ... */ },
      destroy: () => {
        // ✅ Clean up listener
        document.removeEventListener('click', handleDocumentClick);
      },
    };
  };
}
```

**Risk:** Low - Adds cleanup, no functional change**Test:**

- Create multiple mermaid diagrams
- Verify highlight still works
- Verify no memory leak (check DevTools Performance monitor)

**Estimated Time:** 30 minutes---

### 5.2 Editor Global Listeners (High Priority)

**Location:** `src/webview/editor.ts:447, 466, 472`**Current:**

```typescript
document.addEventListener('contextmenu', (e: MouseEvent) => { /* ... */ });
document.addEventListener('click', () => { /* ... */ });
document.addEventListener('keydown', (e: KeyboardEvent) => { /* ... */ });
// ❌ Never removed!
```

**Issue:** These listeners are added during editor initialization but never cleaned up when editor is destroyed or webview is disposed.**Fix:**

```typescript
let contextMenuHandler: ((e: MouseEvent) => void) | null = null;
let documentClickHandler: (() => void) | null = null;
let documentKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

function initializeEditor(initialContent: string) {
  // ... existing code ...
  
  // Store handlers for cleanup
  contextMenuHandler = (e: MouseEvent) => { /* ... */ };
  documentClickHandler = () => { /* ... */ };
  documentKeydownHandler = (e: KeyboardEvent) => { /* ... */ };
  
  document.addEventListener('contextmenu', contextMenuHandler);
  document.addEventListener('click', documentClickHandler);
  document.addEventListener('keydown', documentKeydownHandler);
  
  // Clean up on destroy
  editor.on('destroy', () => {
    if (contextMenuHandler) {
      document.removeEventListener('contextmenu', contextMenuHandler);
      contextMenuHandler = null;
    }
    if (documentClickHandler) {
      document.removeEventListener('click', documentClickHandler);
      documentClickHandler = null;
    }
    if (documentKeydownHandler) {
      document.removeEventListener('keydown', documentKeydownHandler);
      documentKeydownHandler = null;
    }
  });
}
```

**Risk:** Medium - Need to ensure cleanup doesn't break functionality**Test:**

- Verify context menu still works
- Verify click/keydown handlers still work
- Open/close editor multiple times, check for listener accumulation
- Use VS Code DevTools Performance monitor to verify no leaks

**Estimated Time:** 1-2 hours---

### 5.3 Window-Level Listeners

**Location:** `src/webview/features/imageDragDrop.ts:125-129`**Current:**

```typescript
window.addEventListener('dragover', blockWindowDrop);
window.addEventListener('drop', blockWindowDrop);
window.addEventListener('dragleave', e => { /* ... */ });
// ❌ Never removed!
```

**Fix:** Store handlers and remove on cleanup:

```typescript
let windowDragHandlers: Array<{ type: string; handler: EventListener }> = [];

function setupImageDragDrop(editor: Editor, vscodeApi: VsCodeApi) {
  // ... existing code ...
  
  const handlers = [
    { type: 'dragover', handler: blockWindowDrop },
    { type: 'drop', handler: blockWindowDrop },
    { type: 'dragleave', handler: handleWindowDragLeave },
  ];
  
  handlers.forEach(({ type, handler }) => {
    window.addEventListener(type, handler);
    windowDragHandlers.push({ type, handler });
  });
  
  // Clean up when editor destroyed
  editor.on('destroy', () => {
    windowDragHandlers.forEach(({ type, handler }) => {
      window.removeEventListener(type, handler);
    });
    windowDragHandlers = [];
  });
}
```

**Risk:** Low**Test:** Verify drag-drop still works, no leaks**Estimated Time:** 30 minutes---

## Part 6: Race Condition Fixes

### 6.1 Replace `ignoreNextUpdate` Boolean with Hash-Based Deduplication

**Location:** `src/webview/editor.ts:83, 95-104, 790-792, 981-984`**Current:**

```typescript
let ignoreNextUpdate = false; // ❌ Boolean flag - can miss rapid updates

const setIgnoreNextUpdateWindow = () => {
  ignoreNextUpdate = true;
  // Reset after 1 second
  ignoreResetTimeout = window.setTimeout(() => {
    ignoreNextUpdate = false;
  }, 1000);
};
```

**Problem:**

- Boolean flag can be reset between rapid updates
- Time-based window (1s) is arbitrary
- Doesn't track content hash, so identical content updates are still ignored

**Fix:**

```typescript
// Track last content hash sent to extension
let lastSentContentHash: string | null = null;
let lastSentTimestamp: number = 0;

function debouncedUpdate(markdown: string) {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = window.setTimeout(() => {
    try {
      // Check if any images are currently being saved
      if (hasPendingImageSaves()) {
        const count = getPendingImageCount();
        logger.debug(`Delaying document sync - ${count} image(s) still being saved`);
        debouncedUpdate(markdown);
        return;
      }

      // Compute content hash
      const contentHash = hashString(markdown);
      
      // Skip if content unchanged (already sent this exact content)
      if (contentHash === lastSentContentHash) {
        logger.debug('Skipping update - content unchanged');
        return;
      }

      // Skip if we just sent an update very recently (< 100ms) to avoid feedback loops
      const timeSinceLastSend = Date.now() - lastSentTimestamp;
      if (timeSinceLastSend < 100) {
        logger.debug(`Skipping update - sent ${timeSinceLastSend}ms ago`);
        return;
      }

      lastSentContentHash = contentHash;
      lastSentTimestamp = Date.now();

      vscode.postMessage({
        type: 'edit',
        content: markdown,
      });
    } catch (error) {
      logger.error('Error sending update:', error);
    }
  }, 500);
}

// Simple hash function (djb2 algorithm)
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash.toString(36);
}

// Update logic to check hash instead of boolean
function updateEditorContent(markdown: string) {
  // ... existing checks ...
  
  // Skip if this is the same content we just sent
  const incomingHash = hashString(markdown);
  if (incomingHash === lastSentContentHash) {
    logger.debug('Skipping update - incoming content matches last sent');
    return;
  }
  
  // ... rest of update logic ...
}
```

**Risk:** Medium - Changes sync logic, need thorough testing**Test:**

- Normal editing still syncs
- Rapid typing doesn't cause feedback loops
- External file changes (git pull) still sync
- Undo/redo still works correctly
- Multiple rapid saves don't cause issues

**Estimated Time:** 2-3 hours (including testing)---

### 6.2 Extension-Side Hash Tracking (Already Good)

**Location:** `src/editor/MarkdownEditorProvider.ts:14-16, 176-198`**Status:** ✅ Already uses `lastWebviewContent` Map with content comparison**Note:** This is good - keep as-is. Webview side should match this pattern.---

## Part 7: Word Export Remote Images

### 7.1 Current State

**Location:** `src/features/documentExport.ts:314-373` (parseParagraphChildren)**Issue:** Remote images (HTTP/HTTPS) are explicitly skipped in Word export:

```typescript
// Remote fetch commented out
// if (src.startsWith('http://') || src.startsWith('https://')) {
//   // Skip remote images for now
//   return null;
// }
```

**Options:**

1. **Implement remote fetch** (complex, network dependency)
2. **Document limitation** (simple, honest)
3. **Show warning dialog** (user-friendly)

**Recommendation:** Option 2 + 3 (document + warn)**Fix:**

```typescript
// In parseParagraphChildren
if (src.startsWith('http://') || src.startsWith('https://')) {
  // Remote images cannot be embedded in Word documents
  // Return placeholder or skip
  logger.warn('Skipping remote image in Word export:', src);
  return {
    type: 'paragraph',
    children: [
      {
        type: 'text',
        text: `[Image: ${src}]`,
        formatting: { italic: true },
      },
    ],
  };
}
```

**And add user-facing warning:**

```typescript
// In exportDocument function, before Word export
if (format === 'docx') {
  const hasRemoteImages = html.includes('src="http://') || html.includes('src="https://');
  if (hasRemoteImages) {
    const proceed = await vscode.window.showWarningMessage(
      'This document contains remote images. They will be replaced with placeholders in the Word export. Continue?',
      'Continue',
      'Cancel'
    );
    if (proceed !== 'Continue') {
      return;
    }
  }
}
```

**Risk:** Low - Adds warning, documents limitation**Test:**

- Export document with remote images
- Verify warning appears
- Verify placeholder text in Word doc

**Estimated Time:** 1 hour---

## Part 8: Testing Strategy

### 8.1 Unit Tests for Critical Fixes

**Priority Tests to Add:**

1. **Listener Cleanup Tests**

- Test mermaid node view removes listeners on destroy
- Test editor removes global listeners on destroy
- Test image drag-drop removes window listeners

2. **Hash-Based Sync Tests**

- Test identical content doesn't trigger update
- Test rapid updates are debounced correctly
- Test external changes still sync

3. **Error Handling Tests**

- Test applyEdit shows error on failure
- Test error messages are user-friendly

4. **Type Safety Tests**

- Verify TypeScript compiles with strict mode
- Verify no runtime type errors

5. **BubbleMenuView Tests** (from audit)

- Test `setCodeBlockNormalized()`:
    - Empty selection → creates code block
    - Existing code block → updates language
    - Selection with marks → strips marks and creates code block
    - Selection spanning multiple blocks → normalizes to single block
- Test `positionBubbleMenu()` positioning logic
- Test `createTableMenu()` menu creation
- Test dropdown menu interactions (opening/closing)
- Test error scenarios (e.g., editor destroyed during action)

**Test Files to Create/Update:**

- `src/__tests__/webview/listener-cleanup.test.ts` (new)
- `src/__tests__/webview/sync-hash.test.ts` (new)
- `src/__tests__/editor/applyEdit-error-handling.test.ts` (new)
- `src/__tests__/webview/toolbarIconRefresh.test.ts` (expand with BubbleMenuView audit findings)
- Update existing tests to verify no regressions

**Estimated Time:** 4-6 hours---

## Part 9: Implementation Phases

### Phase 1: Quick Wins (Week 1) - Low Risk, High Impact

**Goal:** Fix obvious issues without changing behavior

1. ✅ Replace `substr()` → `substring()`/`slice()` (15 min)
2. ✅ Add conditional logger, remove debug logs (2-3 hours)
3. ✅ Fix mermaid listener leak (30 min)
4. ✅ Add error handling to `applyEdit()` (30 min)
5. ✅ Document Word export remote image limitation (1 hour)

**Total:** ~5 hours**Risk:** Very Low**Impact:** Cleaner console, no memory leaks, better error messages---

### Phase 2: Type Safety (Week 2) - Medium Risk

**Goal:** Improve type safety incrementally

1. ✅ Fix `BubbleMenuView.ts` `any` types + docs + logging (1.5 hours)

- Fix 3 `any` type instances (editor params, window.vscode)
- Add file-level documentation header
- Add JSDoc to exported functions
- Remove development `console.log()` statements

2. ✅ Fix dialog `any` types (1 hour)
3. ✅ Add message type interfaces (1 hour)
4. ✅ Fix `editor.ts` window properties (1 hour)
5. ✅ Document remaining `any` with reasons (1 hour)

**Total:** ~5 hours**Risk:** Low-Medium (type changes, need testing)**Impact:** Better IDE support, catch bugs at compile time---

### Phase 3: Memory Leaks & Race Conditions (Week 3) - Higher Risk

**Goal:** Fix stability issues

1. ✅ Fix editor global listeners (1-2 hours)
2. ✅ Fix window drag-drop listeners (30 min)
3. ✅ Replace `ignoreNextUpdate` with hash-based sync (2-3 hours + testing)
4. ✅ Add comprehensive tests (4-6 hours)

**Total:** ~8-12 hours**Risk:** Medium (changes sync logic)**Impact:** No memory leaks, more reliable sync---

## Part 10: Testing Checklist

### Before Each Fix:

- [ ] Read current implementation
- [ ] Understand the issue
- [ ] Write test (if applicable)
- [ ] Make minimal change
- [ ] Verify existing tests still pass
- [ ] Test manually in extension
- [ ] Check for console errors/warnings

### After All Fixes:

- [ ] Run full test suite: `npm test`
- [ ] Manual test: Open large document (5000+ lines)
- [ ] Manual test: Open/close editor multiple times
- [ ] Manual test: Rapid typing, undo/redo
- [ ] Manual test: External file change (git pull simulation)
- [ ] Performance test: Check DevTools for memory leaks
- [ ] TypeScript: Verify `tsc --noEmit` passes
- [ ] Linter: Verify no new warnings

---

## Part 11: Risk Assessment

### Low Risk (Safe to Do First)

- Replace `substr()` → `substring()`/`slice()`
- Add conditional logger
- Fix mermaid listener leak
- Add error handling to `applyEdit()`
- Document Word export limitation
- Fix `BubbleMenuView.ts` types + docs + logging (from audit)
- Fix dialog types

### Medium Risk (Need Careful Testing)

- Fix editor global listeners
- Replace `ignoreNextUpdate` with hash-based sync
- Fix window drag-drop listeners
- Fix `editor.ts` window properties

### Higher Risk (Requires Extensive Testing)

- Hash-based sync (changes core sync logic)
- Any changes to `imageEnterSpacing.ts` (complex ProseMirror code)

---

## Part 12: Success Criteria

### Code Quality Metrics

| Metric | Current | Target ||--------|---------|--------|| TypeScript `any` usage | 125 | <20 (document remaining) || Console.log in production | 141 | <30 (errors/warnings only) || Deprecated APIs | 6 (`substr`) | 0 || Unhandled promise rejections | Unknown | 0 || Memory leaks (listeners) | 5+ known | 0 |

### Stability Metrics

| Metric | Target ||--------|--------|| No listener leaks after 10 open/close cycles | ✅ || Sync works correctly with rapid edits | ✅ || External file changes sync correctly | ✅ || Error messages are user-friendly | ✅ || TypeScript compiles with strict mode | ✅ |---

## Part 13: Documentation Updates

### Files to Update

1. **`docs/opus-audit.md`**

- Mark fixed issues as resolved
- Update status for each item
- Add notes on decisions made

2. **`prompts/vibe-coding-guides/common-pitfalls.md`**

- Add section on listener cleanup patterns
- Add section on hash-based sync
- Update error handling patterns

3. **Code Comments**

- Document why remaining `any` types exist
- Add JSDoc to new functions
- Update file headers if needed

---

## Part 14: Rollback Plan

### If Issues Arise

1. **Type Errors:** Revert type changes, keep functionality
2. **Sync Issues:** Revert hash-based sync, keep boolean flag temporarily
3. **Listener Issues:** Revert listener cleanup, investigate separately
4. **Performance:** Profile before/after, identify regression

### Git Strategy

- Create feature branch: `code-quality-improvements`
- Commit each phase separately
- Tag before Phase 3 (hash-based sync)
- Test thoroughly before merging

---

## Conclusion

**Total Estimated Time:** 18-22 hours over 3 weeks**Priority Order:**

1. **Week 1:** Quick wins (5 hours) - Immediate improvements
2. **Week 2:** Type safety (5 hours) - Better maintainability  
3. **Week 3:** Stability fixes (8-12 hours) - Core reliability

**Key Principles:**

- ✅ Test-driven: Write tests before/alongside fixes
- ✅ Incremental: Small, reviewable changes
- ✅ Non-breaking: Maintain existing functionality
- ✅ Documented: Explain decisions, document remaining debt

**Expected Outcome:**

- Cleaner codebase
- No memory leaks
- Better error handling
- Improved type safety
- More reliable sync