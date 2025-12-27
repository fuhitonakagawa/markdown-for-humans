# Task: Fix Undo Reliability & Dirty State

## 1. Task Metadata

- **Task name:** Fix undo reliability & dirty state
- **Slug:** undo-stack-fix
- **Status:** shipped
- **Created:** 2025-12-01
- **Last updated:** 2025-12-01
- **Shipped:** 2025-12-01

## 2. Context & Problem

- **Problem:** Repeated undo in the custom editor can wipe the document, and undoing all changes still leaves the file dirty.
- **Current state:** TipTap edits are sent as full-document replacements, and VS Code sees every sync as a new change.
- **Why it matters:** Users lose content through normal undo usage and cannot trust dirty indicators, risking accidental data loss.

## 3. Desired Outcome & Scope

- **Success criteria:**
  - Undo/redo never produces an empty document unless the user explicitly deleted everything.
  - Undoing all edits returns the file to clean state (no dirty indicator or pending diff).
  - Undo/redo history aligns between TipTap and VS Code so round-tripping edits is predictable.
- **Out of scope:** Collaborative editing; changing VS Code’s native undo UI.

## 4. UX & Behavior

- **Entry points:** Standard undo/redo shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z), VS Code dirty indicator, save command.
- **Flow:** User types in WYSIWYG → undo steps back through their actions without jumping to blank content → redo re-applies correctly → if all edits are undone, dirty flag clears and file matches disk.
- **Error handling:** If sync fails, show a visible error and keep history intact; never clear content silently.

### Current Functionality (Source of Truth)

- **Current behavior (user-facing):** Edits sync from TipTap to the backing markdown file; undo works but can collapse to an empty doc after multiple steps and dirty flag stays on even after undoing everything.
- **Current implementation (technical):** Webview posts full markdown on each update (`type: 'edit'`), extension replaces entire document via `WorkspaceEdit`, TipTap history depth set to 100 with debounced updates.
- **Key files:** `src/webview/editor.ts` (TipTap sync + history), `src/editor/MarkdownEditorProvider.ts` (applies edits to VS Code doc).
- **Pattern to follow:** Align TipTap history with VS Code undo stack similar to other custom text editors (minimize full-document replacements; debounce with addToHistory controls).

## 5. Technical Plan

- **Surfaces:**
  - Webview (TipTap editor sync, history management)
  - Extension side (WorkspaceEdit application, message flow)
- **Key changes:**
  - `src/webview/editor.ts` – seed initial content before history starts, ignore redundant updates, bound the ignore-next-update window, avoid emitting edits when markdown unchanged, and ensure undo/redo shortcuts stay TipTap-native.
  - `src/editor/MarkdownEditorProvider.ts` – track last webview payload and skip identical updates; only apply edits when content truly differs to keep VS Code history clean; consider `WorkspaceEdit` options to preserve undo grouping.
  - `tests/webview/undo-sync.test.ts` (new) – regression around undo → blank doc and dirty flag clearing.
  - `tests/extension/markdownEditorProvider.test.ts` (new) – ensure edits that round-trip to identical content clear the dirty indicator.
- **Architecture notes:**
  - Webview continues to be source of user edits; extension remains single writer to TextDocument.
  - Sync flow stays message-based (`type: 'edit'` / `type: 'update'`) with debounce; avoid feedback loops by tagging self-originating edits.
  - Use minimal edits (content equality and possibly range diffs) to keep VS Code’s undo stack aligned with TipTap history events.
- **Performance considerations:**
  - Maintain 500ms debounce for normal typing; immediate flush on save.
  - Equality short-circuit prevents unnecessary full-document replacements on each keystroke.
  - Keep ignore window tight (≤1s) to avoid missed external updates.

## 6. Work Breakdown

| Status | Task | Notes |
|--------|------|-------|
| `done` | **Update feature-inventory.md** | Add task to "In Progress" |
| `done` | Analyze current sync points | Instrument logging to confirm when updates are skipped/applied (`editor.ts`, `MarkdownEditorProvider.ts`) |
| `done` | Tighten webview undo safety | Seed initial content before history, skip identical markdown, bounded ignore window, ensure undo/redo shortcuts stay local |
| `done` | Tighten extension apply behavior | Skip edits when content identical; evaluate minimal edit vs full replace for undo grouping |
| `done` | Tests: webview undo/redo | Add regression for undo → blank doc and redo restoration (`src/__tests__/webview/undo-sync.test.ts`) |
| `done` | Tests: dirty flag clearing | Ensure full undo returns clean state when content matches disk (`tests/__tests__/editor/undoSync.test.ts`) |
| `done` | Manual verification | Type/undo/redo sequences; undo to clean; external change sync; save shortcut |
| `done` | **Ship task & update inventory** | Move to shipped/, update feature-inventory |

### How to Verify

- **Analyze current sync points:** run editor, capture logs around edits/updates; confirm ignore window only suppresses self-originated updates.
- **Tighten webview undo safety:** type paragraphs, undo repeatedly; expect no empty doc; redo restores; no extra edits emitted when content unchanged.
- **Tighten extension apply behavior:** make an edit, undo to original; dirty indicator clears; VS Code undo stack steps match TipTap steps.
- **Tests (webview + extension):** run `npm test`; new suites cover blank-doc regression and dirty-flag reset.
- **Manual verification:** open markdown file → type → undo back to original → dirty badge clears; redo restores; save shortcut still works; external file change still syncs correctly.

## 7. Implementation Log

### 2025-12-01 – Task refined

- **What:** Added technical plan, work breakdown, and verification steps.
- **Ready for:** Implementation.
- **First task:** Update feature-inventory.md and capture current sync logging.

### 2025-12-01 – Undo reliability fixes implemented

- **What:** Implemented webview/extension undo safety (initial content seeding, ignore-window bounding, duplicate-content skipping on both sides), added dirty-state guard, updated feature inventory, and ran `npm test` (all suites passing).
- **Files:** `src/webview/editor.ts`, `src/editor/MarkdownEditorProvider.ts`, `roadmap/feature-inventory.md`.
- **Next:** Add regression tests for undo/redo blank-doc and dirty-flag clearing; perform manual verification in VS Code.

### 2025-12-01 – Added undo sync regression test

- **What:** Added `src/__tests__/editor/undoSync.test.ts` to validate no-op edits are skipped, pending edit tracking, and webview update suppression when content unchanged; extended VS Code mock with Position/Range/WorkspaceEdit/applyEdit.
- **Files:** `src/__tests__/editor/undoSync.test.ts`, `src/__mocks__/vscode.ts`.
- **Next:** Add webview-focused undo/redo regression and complete manual verification.

### 2025-12-01 – Webview undo regression test added

- **What:** Added `src/__tests__/webview/undo-sync.test.ts` with mocks to isolate TipTap and VS Code API, covering ignore-window skips, unchanged-content skips, and content-change cursor restoration; exported testing hooks from `src/webview/editor.ts` to drive the unit test.
- **Files:** `src/__tests__/webview/undo-sync.test.ts`, `src/webview/editor.ts`.
- **Next:** Perform manual verification in VS Code, then ship and update inventory.

### 2025-12-01 – Manual verification completed & task shipped

- **What:** Verified end-to-end in VS Code: multi-edit undo/redo, dirty flag clearing after undo, save shortcut, and external sync sanity. Marked manual verification and shipping tasks done.
- **Files:** `roadmap/shipped/task-undo-stack-fix.md`.
- **Next:** Monitor for image-drop undo edge cases in real usage.
