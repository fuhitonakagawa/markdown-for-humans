# Fix Image Drag & Drop Bugs

## 1. Task Metadata

- **Task name:** Fix Image Drag & Drop Bugs
- **Slug:** `fix-image-drag-drop-bugs`
- **Status:** `shipped`
- **Created:** 2025-12-01
- **Last updated:** 2025-12-01
- **Shipped:** 2025-12-01
- 

  ![image](./images/image-1764575385045.png)

---

## 2. Context & Problem

Users are experiencing two critical bugs when dragging and dropping images into markdown documents:

- **Current state:**

  - Image drag & drop works when files are dragged from the desktop/Finder
  - Drag & drop from VS Code's Explorer view fails to insert images
  - External file system drag & drop sometimes opens a new VS Code window instead of inserting the image

- **Pain points:**

  - Users cannot drag images from the VS Code Explorer sidebar (common workflow)
  - External drag-drop behavior is unpredictable and disruptive
  - No visual feedback when drag-drop fails

- **Why it matters:**

  - Image insertion is a core feature for markdown writing
  - VS Code Explorer is the most natural source for workspace images
  - Unreliable drag-drop breaks user trust and workflow

---

## 3. Desired Outcome & Scope

What does "done" look like?

- **Success criteria:**

  - Images can be dragged from VS Code Explorer view and inserted correctly
  - External file system drag & drop reliably inserts images without opening new VS Code instances
  - All drag & drop sources work consistently (desktop, Finder, VS Code Explorer, external file managers)
  - Existing automated tests pass
  - New tests cover the fixed scenarios

- **In scope:**

  - Fix VS Code Explorer drag-drop detection (vscode-resource URI handling)
  - Ensure preventDefault is called in all code paths for image drops
  - Add logging to debug drag-drop data formats
  - Update/add tests for new scenarios

- **Out of scope:**

  - Redesigning the image confirmation dialog
  - Adding drag & drop for non-image files
  - Performance optimizations beyond bug fixes

---

## 4. UX & Behavior

High-level user experience (what, not how).

- **Entry points:**

  - Drag image file from VS Code Explorer sidebar
  - Drag image file from desktop/Finder
  - Drag image file from external file manager

- **User flows:**

  - **VS Code Explorer → Editor:**

    1. User drags image file from Explorer sidebar
    2. Editor shows drag-over styling ("Drop image here")
    3. User drops image in editor
    4. Image is inserted via relative path (no confirmation dialog)

  - **External File System → Editor:**

    1. User drags image from desktop/Finder/file manager
    2. Editor shows drag-over styling
    3. User drops image (screenshot and other external files prompt confirmation if no remembered folder)
    4. Image is processed without opening new VS Code window
    5. Image is saved to the chosen folder (or remembered folder) and inserted correctly
  - **Paste from other tools:**
    1. User copies image content or file from external app
    2. On paste, editor prompts for save location if no remembered folder
    3. If the paste includes a workspace file path (rare), prefer relative path insertion with no dialog

- **Behavior rules:**

  - All image drops must call preventDefault() to avoid default browser/VS Code handling
  - Drop events must detect images from all common data transfer formats
  - Workspace images (from Explorer) should use relative paths, not copy files
  - External images should be copied to the configured image folder
  - Pasted images follow the same rules: external pastes prompt for save; workspace-referenced pastes insert via relative path when detectable

---

## Current Behavior (code reconciliation)

- **Desktop/Finder drag-drop (File objects):**
  - Overlay: shows (drag-over class) because `hasImageFiles` checks `DataTransfer.files`.
  - Handling: `handleDrop` prevents default, prompts confirmation if no remembered folder, inserts base64 preview, sends `saveImage` to extension, replaces with saved path on `imageSaved`.
  - Copy/save: always copies to chosen folder (even if file already in repo).
- **VS Code Explorer drag-drop (text/uri-list or text/plain paths):**
  - Overlay: does not show because current dragover guard only checks `Files`.
  - Handling: `handleDrop` detects image path regex, calls `handleWorkspaceImageDrop`, sends `handleWorkspaceImage` with cursor position; extension computes relative path and posts `insertWorkspaceImage`.
  - Dialog: none; uses relative path, no copy.
- **External drag-drop opening new window:**
  - Guard: DOM drop handler on `.ProseMirror` calls `preventDefault`, and TipTap `handleDrop` returns `true` for image payloads; there is no window-level drop guard, so drops outside the editor can still trigger VS Code’s default window-opening behavior.
- **Paste (clipboard image binary):**
  - Detection: only when clipboard items include `image/*`.
  - Handling: prompts confirmation if no remembered folder, inserts base64 preview, sends `saveImage`.
  - Workspace-aware paste: not supported; pasted file paths/URIs are ignored unless they are actual image binaries.
- **What matches desired spec:**
  - Explorer drops insert via relative path without dialog or copying.
  - External/screenshot drops prompt confirmation (if no remembered folder) before saving.
- **Gaps vs desired spec:**
  - Explorer drops lack visual overlay/feedback.
  - External drops can open a new VS Code window if dropped outside the editor area (no window-level preventDefault).
  - Paste path intelligence: cannot currently detect if a pasted image refers to an existing workspace file; all pasted images are treated as external binaries to copy/save.

---

## 5. Technical Plan

- **Surfaces:**
  - Webview (TipTap editor drop/paste handlers, drag overlay styling)
  - Extension side (image message routing and path normalization)
- **Key changes:**
  - `src/webview/features/imageDragDrop.ts` – Normalize VS Code Explorer drop payloads (text/uri-list, text/plain, vscode-file/resource URIs), always preventDefault at window/editor level to stop VS Code from opening windows, and route workspace drops with cursor position.
  - `src/webview/editor.ts` – Ensure TipTap drop handling defers to the custom image handler and blocks default processing for Explorer drops before ProseMirror sees them.
  - `src/editor/MarkdownEditorProvider.ts` – Normalize incoming workspace paths (file://, vscode-file, vscode-resource), compute safe relative paths, and send `insertWorkspaceImage` with consistent logging when payloads are unexpected.
  - `src/webview/features/imageConfirmation.ts` / `src/webview/editor.css` – Keep drag-over affordance consistent for Explorer drops and clear overlay when drop is cancelled or rejected.
  - `src/__tests__/features/imageDragDrop.test.ts`, `src/__tests__/editor/imagePathResolution.test.ts` – Add coverage for Explorer URI parsing, preventDefault handling, and relative path computation.
- **Architecture notes:**
  - Webview normalizes drop payloads and forwards workspace drops via `handleWorkspaceImage`; extension returns `insertWorkspaceImage` with a relative path while external drops continue through `saveImage`.
  - Window-level drag/drop guards prevent VS Code from hijacking drops; editor-level handlers keep TipTap from swallowing Explorer-specific payloads.
- **Performance considerations:**
  - Keep drop handlers lightweight (string parsing only), reuse existing message flow, and gate verbose logging to drops to avoid slowing typing/render.

## 6. Work Breakdown

| Status | Task | Notes |
|--------|------|-------|
| `done` | **Update feature-inventory.md** | Move task to 🚧 In Progress with P0 status |
| `done` | Block VS Code default drop handling | `src/webview/features/imageDragDrop.ts`, `src/webview/editor.ts` |
| `done` | Normalize Explorer drop payloads & paths | `src/webview/features/imageDragDrop.ts`, `src/editor/MarkdownEditorProvider.ts` |
| `done` | Improve drop UX feedback & logging | `src/webview/features/imageConfirmation.ts`, `src/webview/editor.css` |
| `done` | **Write unit tests** | Cover Explorer vs external drops, preventDefault edge cases ⚠️ REQUIRED |
| `done` | **Ship & update inventory** | Follow task-ship.md workflow ⚠️ DO LAST |

### How to Verify

**Update feature-inventory.md:**
1. Edit `roadmap/feature-inventory.md` → move Fix Image Drag-Drop Bugs to "🚧 In Progress".
2. Confirm priority P0 and slug `task-fix-image-drag-drop-bugs`.

**Block VS Code default drop handling:**
1. Drag an image from desktop onto the editor; VS Code should not open a new window.
2. Drag from VS Code Explorer; overlay appears and drop inserts instead of opening file.
3. Confirm no console errors and dropEffect shows "copy".

**Normalize Explorer drop payloads & paths:**
1. Drag image from Explorer with spaces/special chars; inserted markdown uses relative path (./images/foo bar.png).
2. Drop multiple images; each uses relative path with correct cursor placement.
3. Inspect console/logging for normalized URIs (file://, vscode-file) without warnings.

**Improve drop UX feedback & logging:**
1. Trigger drag-over and cancel (leave editor); overlay clears.
2. Simulate unsupported drop (non-image); overlay clears and no orphan styling remains.
3. Check console logs show payload type summary for debugging.

**Write unit tests:**
1. Add/adjust tests in `src/__tests__/features/imageDragDrop.test.ts` and related helpers.
2. Add path normalization cases in `src/__tests__/editor/imagePathResolution.test.ts`.
3. Run `npm test` → all suites pass.

**Ship & update inventory:**
1. Move task file to `roadmap/shipped/` via `git mv`.
2. Update `roadmap/feature-inventory.md` shipped table.
3. Note final status/log in section 7.

## 7. Implementation Log

### 2025-12-01 – Task refined

- **What:** Added technical plan, work breakdown, and verification steps for image drag-drop fixes.
- **Ready for:** Implementation work on drop handling + path normalization.
- **First task:** Update `roadmap/feature-inventory.md` to mark this task in progress.

### 2025-12-01 – Drop/paste handling fixes started

- **What:** Implemented window-level drop guards to stop VS Code from opening new windows on image drops outside the editor; Explorer drops now trigger overlay via text/uri detection and reuse path parsing helper; pasted image paths insert via relative path when detected, while clipboard files prompt confirmation/copy.
- **Files:** `src/webview/features/imageDragDrop.ts` (window drop guard, Explorer overlay detection, workspace-aware paste paths, helper `extractImagePathFromDataTransfer`, position override), `roadmap/feature-inventory.md` (status to in-progress), `src/__tests__/features/imageDragDrop.test.ts` (coverage for path extraction).
- **Tests:** `npm test -- --runInBand`.
- **Follow-up:** Improve drop UX feedback/logging (overlay polish and diagnostic logs).

### 2025-12-01 – Drop UX polish & shipping

- **What:** Added dragleave guard to clear overlay when leaving window; added drop payload diagnostics to quickly debug sources; completed shipping steps and metadata updates.
- **Files:** `src/webview/features/imageDragDrop.ts` (overlay clearing, drop logging), `roadmap/feature-inventory.md`, `roadmap/shipped/task-fix-image-drag-drop-bugs.md`.
- **Tests:** `npm test -- --runInBand`.
