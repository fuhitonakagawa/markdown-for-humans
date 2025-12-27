# Task: Mermaid Double-Click to Edit

<!--
LLM INSTRUCTIONS (do not remove):

LEAN PRINCIPLE: Sections 1-4 must be ~35-45 lines TOTAL. Focus on WHAT not HOW.
-->

---

## 1. Task Metadata

- **Task name:** Mermaid Double-Click to Edit
- **Slug:** `mermaid-double-click-edit`
- **Status:** `shipped`
- **Created:** 2025-12-07
- **Last updated:** 2025-12-07
- **Shipped:** 2025-12-07

---

## 2. Context & Problem

- **Problem:** Users accidentally toggle to edit mode when simply clicking to scroll or interact with mermaid diagrams, disrupting their reading flow.
- **Current state:** Single-click on a mermaid diagram toggles between rendered preview and editable source code.
- **Why it matters:** Accidental mode switches are jarring and require an extra click to return to preview, degrading the user experience especially for users who primarily view (not edit) diagrams.

---

## 3. Desired Outcome & Scope

- **Success criteria:**
  - Single-click highlights diagram border and shows "Double-click to edit" tooltip (provides context without mode switch)
  - Double-click enters edit mode (shows source code)
  - While in edit mode, clicking a "Preview" button or clicking outside returns to preview mode
  - Visual indicator (hover state) shows diagram is editable

- **Out of scope:** Custom keyboard shortcuts for toggling (future enhancement)

---

## 4. UX & Behavior

- **Entry points:** Any rendered mermaid diagram in the editor
- **Flow:**
  1. User hovers over rendered diagram → Subtle visual feedback indicates editability
  2. User double-clicks diagram → Source code appears (edit mode)
  3. User clicks "Preview" button (or clicks outside) → Returns to rendered diagram
  4. Visual indicator clearly shows which mode user is in (edit vs preview)

### Current Functionality (Source of Truth)

- **Current behavior (user-facing):** Single-click on mermaid diagram toggles between rendered diagram and source code ([mermaid.ts:184-187](file:///Users/abhinav/code/md-human/src/webview/extensions/mermaid.ts#L184-L187))
- **Current implementation (technical):** Click event listener toggles `.hidden` class on both `.mermaid-source` and `.mermaid-render` elements
- **Key files:** [mermaid.ts](file:///Users/abhinav/code/md-human/src/webview/extensions/mermaid.ts) (node view with click handler), [editor.css](file:///Users/abhinav/code/md-human/src/webview/editor.css#L567-L620) (mermaid styles with hover state)
- **Pattern to follow:** Replace single-click with double-click detection, add explicit "Preview" button in edit mode (similar to toolbar button pattern)

---

## 5. Technical Plan

- **Surfaces:**
  - Webview only (no extension-side changes)

- **Key changes:**
  - `mermaid.ts` – Replace single-click event listener with double-click (`dblclick`) event
  - `mermaid.ts` – Add single-click handler to show border highlight + tooltip
  - `mermaid.ts` – Add "Preview" button element when in edit mode
  - `editor.css` – Add CSS for `.mermaid-wrapper.highlighted` state (border + subtle background)
  - `editor.css` – Add CSS for `.mermaid-tooltip` (positioned tooltip with ARIA attributes)
  - `editor.css` – Add CSS for `.mermaid-preview-btn` (button in edit mode)

- **Architecture notes:**
  - No new TipTap extension needed – all changes within existing `Mermaid` node view
  - Tooltip uses native ARIA attributes (`aria-describedby`, `role="tooltip"`)
  - Double-click detection uses standard `dblclick` event (browser-native)
  - State management: track if wrapper is in "highlighted" mode (boolean flag)
  - Preview button removes highlighted state and returns to rendered view
  - Click outside diagram (blur) also removes highlighted state

- **Performance considerations:**
  - No performance impact – simple DOM event handlers and CSS classes
  - Tooltip is created once and toggled with display:none/block
  - No debouncing needed (instant UI feedback)

---

## 6. Work Breakdown

| Status | Task | Notes |
|--------|------|-------|
| `done` | **Update feature-inventory.md** | ✅ Added to "🚧 In Progress" |
| `done` | Update click handler to double-click | ✅ Replaced `click` with `dblclick` in mermaid.ts |
| `done` | Add single-click highlight behavior | ✅ Implemented highlighted state + tooltip |
| `done` | Add Preview button in edit mode | ✅ Button appears in edit mode |
| `done` | Add CSS for highlighted state | ✅ Border + shadow for `.mermaid-wrapper.highlighted` |
| `done` | Add CSS for tooltip | ✅ Accessible tooltip with ARIA |
| `done` | Add CSS for Preview button | ✅ Button styled with VS Code theme variables |
| `done` | **Write unit tests** | ✅ 19 DOM interaction tests passing (jsdom) |
| `done` | Manual testing in extension | ✅ Verified by user: editing works, duplicate bug fixed |
| `done` | **Ship task & update inventory** | ✅ Shipping now |

**Status:** `pending` → `in-progress` → `done`

### How to Verify

**Update feature-inventory.md:**
1. Open `roadmap/feature-inventory.md`
2. Add task to "🚧 In Progress" table
3. Verify: Task name, slug, priority, status correct

**Update click handler to double-click:**
1. Open any `.md` file with mermaid diagram
2. Single-click diagram → No toggle (stays in current mode)
3. Double-click diagram → Toggles to edit mode (source code visible)

**Add single-click highlight behavior:**
1. Single-click diagram → Border highlights with subtle color
2. Tooltip appears: "Double-click to edit"
3. Click elsewhere → Highlight and tooltip disappear

**Add Preview button in edit mode:**
1. Double-click to enter edit mode
2. Verify "Preview" button appears above or inside code view
3. Click Preview button → Returns to rendered diagram
4. Highlight and tooltip removed

**CSS verification:**
1. Check highlighted state has visible border (e.g., 2px solid accent color)
2. Tooltip is readable with sufficient contrast
3. Preview button matches toolbar button styling

**Unit tests:**
1. Run `npm test src/__tests__/webview/mermaid-extension.test.ts`
2. All tests pass (existing + new)
3. Coverage includes:
   - Double-click enters edit mode
   - Single-click shows highlight + tooltip
   - Preview button returns to render mode
   - Click outside removes highlight

**Manual testing in extension:**
1. Install extension in VS Code
2. Open markdown file with mermaid diagram
3. Test flow: hover → single-click (highlight) → double-click (edit) → preview (render)
4. Verify: No accidental mode switches on single-click
5. Test with multiple diagrams in same document

---

## 7. Implementation Log

### 2025-12-07 – Task refined

- **What:** Technical plan and work breakdown added after researching web best practices and codebase patterns
- **Research findings:**
  - `dblclick` event is standard for double-click detection (no manual timing needed)
  - Accessible tooltips require `role="tooltip"`, `aria-describedby`, keyboard dismissible (Escape key)
  - Existing mermaid.ts uses simple click toggle (lines 184-187)
  - CSS already has hover state (`.mermaid-wrapper:hover`)
  - Test file exists: `mermaid-extension.test.ts`
- **Ready for:** Implementation
- **First task:** Update feature-inventory.md
- **Key decisions:**
  - Use native `dblclick` event (simpler than manual timing)
  - Tooltip with ARIA for accessibility
  - Preview button (not "click outside") for explicit mode exit

### 2025-12-07 – Implementation complete

- **What:** All code changes implemented, build successful, existing tests passing
- **Changes:**
  - Updated `feature-inventory.md` with task in-progress
  - Modified `mermaid.ts` (lines 183-259): Replaced single-click toggle with comprehensive interaction system
    - Double-click enters edit mode
    - Single-click highlights diagram + shows tooltip
    - Preview button exits edit mode
    - Click outside removes highlight
    - Fixed TypeScript lint error (Node vs HTMLElement type)
  - Added CSS to `editor.css` (lines 622-666):
    - `.mermaid-wrapper.highlighted` - Border + shadow effect
    - `.mermaid-tooltip` - Accessible tooltip with VS Code theme variables
    - `.mermaid-preview-btn` - Button styled consistently with toolbar
- **Testing:** 
  - Existing mermaid tests: 27/27 passing
  - New DOM interaction tests: 19/19 passing (jsdom)
  - Installed `jest-environment-jsdom` for proper DOM testing
  - Tests cover: initial state, single-click highlight, double-click edit, preview button, click outside, accessibility, state management
- **Build:** Successful (~700ms, dist/webview.js 4.2mb)
- **Ready for:** Manual verification in VS Code

### 2025-12-07 – Fixed edit mode editability

- **Issue:** User couldn't type in edit mode - codeElement wasn't editable
- **Fix:**
  - Added `contentEditable="true"` attribute when entering edit mode (line 220)
  - Added automatic focus to codeElement when entering edit mode (line 221)
  - Set `contentDOM: codeElement` in node view return (line 272) - this connects TipTap's editing to the pre element
  - Removed contentEditable when exiting edit mode to prevent accidental edits
  - Re-render diagram automatically when exiting edit mode
- **Testing:** Build successful, ready for user verification
- **Technical:** `contentDOM` tells TipTap where the editable content lives, enabling proper text synchronization

---
