# Task: Image Enter Spacing

## 1. Task Metadata

- **Task name:** Image Enter Spacing
- **Slug:** image-enter-spacing
- **Status:** shipped
- **Created:** 2025-12-10
- **Last updated:** 2025-12-11
- **Shipped:** 2025-12-11

---

## 2. Context & Problem

- **Problem:** Adding blank space around images is clumsy; pressing Enter on a selected image often does nothing or keeps the cursor glued to the same line.
- **Current state:** Images appear as blocky nodes with a hover resize icon, but the caret can get stuck before/after the node, making spacing unpredictable.
- **Why it matters:** Screenshot-heavy docs need quick breathing room to read well; friction here slows writing and layout cleanup.
- **Industry standard:** Modern markdown editors allow clicking an image (or gap cursor) and hitting Enter to instantly create a new paragraph above or below.
- **Frustration:** Users hack around it by typing random characters, adding spaces, or toggling to source, then deleting, just to open a line.
- **Quality impact:** Awkward spacing leads to cramped sections and discourages image use.
- **Source workaround:** Some users jump to source view to add blank lines, breaking the WYSIWYG flow and mental model.
- **Export fragility:** Manual spacing hacks can change markdown structure, risking odd export layout.
- **Lists/quotes:** When an image sits inside a list item or blockquote, it is hard to break out cleanly without wrecking list structure.
- **Reliability:** Caret jumps make it unclear where text will land, adding undo/redo churn.

## 3. Desired Outcome & Scope

- **Success criteria:**
  - Clicking an image clearly indicates whether the caret is before or after; pressing Enter inserts a blank paragraph on that side.
  - With the cursor beside an inline image, Enter splits cleanly: surrounding text stays intact, new paragraph appears at the cursor side.
  - Works for consecutive images, images inside lists/quotes, and images with alt text; undo/redo behaves predictably.
  - Drag-drop/paste flows, resize modal, and export continue to work without regression.
  - Keyboard-only users can do the same via arrowing to the image edge and pressing Enter.
  - Visual affordance (gap cursor or highlight) matches existing editor theme.
  - Behavior matches industry-standard editors: Enter on an image yields a clean new block.
  - Works on macOS/Windows without feature flags or settings fiddling.
- **Out of scope:** Image zoom/lightbox, captions/styling changes, new toolbar buttons.

## 4. UX & Behavior

- **Entry points:** Click the image body or gap next to it; arrow keys to move caret before/after; Enter triggers insertion.
- **Flow – Enter after image:** User clicks image (node highlight) → right-side caret/gap cursor shows → presses Enter → empty paragraph appears below image; focus moves into it.
- **Flow – Enter before image:** User arrows left/up to show caret before image (or clicks left gutter) → presses Enter → blank paragraph inserted above image; cursor stays there.
- **Flow – Inline with text:** Paragraph reads "Intro ![pic] text" → clicking after the image and pressing Enter splits at the image boundary: "Intro" stays above, new paragraph below with "text" preserved.
- **Flow – Multiple images stacked:** Navigating between two adjacent images, Enter drops a spacer paragraph between them without needing placeholder text.
- **Flow – Images in lists/quotes:** If the image sits inside a list item or blockquote, Enter creates a new paragraph at the same indentation; Shift+Enter still inserts a soft break if available.
- **Flow – Start/end of document:** Enter before the first image adds a top paragraph; Enter after the last image adds a trailing paragraph so users can keep typing.
- **Caret cues:** Gap cursor or subtle highlight appears when hovering near image edges, so users know where Enter will act.
- **Undo/redo:** A single undo removes the inserted spacer and returns focus to the prior selection.
- **No extra chrome:** No modals or popovers; only caret/gap visuals already familiar in the editor.
- **Flow – Broken/missing image:** Even if the image fails to load, pressing Enter near it still inserts a normal paragraph so editing can continue.
- **Resize interaction:** Clicking the resize icon still opens the modal; pressing Enter while the icon is focused should not insert paragraphs until the user returns focus to the editor.
- **Accessibility:** Selected images show a focus ring; inserted paragraphs inherit theme fonts/colors with no unexpected indent.

### Current Functionality (Source of Truth)

- **Current behavior (user-facing):** Images render as block-level (`.markdown-image` with hover resize icon) and insert via drop/paste, but Enter on a selected image relies on TipTap defaults, so users must arrow or type/delete text to open space.
- **Current implementation (technical):** `CustomImage` extends TipTap Image with a wrapper + hover resize button and resolves workspace paths; no custom keymap or gap-cursor tweaks for Enter around images (`src/webview/extensions/customImage.ts`, `src/webview/editor.ts`). Insertions call `insertContentAt` during drop/paste (`src/webview/features/imageDragDrop.ts`).
- **Gap cursor:** StarterKit brings the default gap-cursor, but it is not tuned for image-specific Enter handling or for clearly exposing before/after caret states.
- **Key files:** `src/webview/extensions/customImage.ts`; `src/webview/editor.ts`; `src/webview/features/imageDragDrop.ts`.
- **Pattern to follow:** Add a small TipTap/ProseMirror plugin with keymap + selection handling (similar to `TabIndentation` extension style) to intercept Enter and inject paragraphs relative to node selection.

## 5. Technical Plan

- **Surfaces:**
  - Webview (TipTap editor keyboard handling and caret cues)
  - Stylesheet for gap-cursor/selection affordance
- **Key changes:**
  - `src/webview/extensions/imageEnterSpacing.ts` – TipTap/ProseMirror extension with keymap handling Enter on image node/gap selections; inserts paragraphs before/after and splits inline contexts without mangling surrounding text.
  - `src/webview/editor.ts` – Register the new extension alongside StarterKit (gap-cursor) and TabIndentation; ensure existing drag-drop/paste/resize flows keep working.
  - `src/webview/editor.css` – Add styling for gap cursor / selected image edges so before/after position is visible and matches current theme; keep resize icon hover states intact; add blink animation for gap cursor to aid keyboard navigation visibility.
  - `src/__tests__/webview/imageEnterSpacing.test.ts` – Cover Enter behavior for standalone images, inline images, consecutive images, lists/quotes, and undo/redo.
- **Architecture notes:**
  - Runs entirely in the webview; no extension-side messaging changes.
  - Use ProseMirror commands (`splitBlock`, `insertContentAt`, `Selection.near`/gap cursor) to respect list/blockquote structure and preserve surrounding text.
  - Keymap should bail for non-image contexts and when focus is on the resize icon to avoid stealing Enter from dialogs/toolbars.
- **Performance considerations:**
  - Narrow keymap: only runs on Enter when selection involves an image/gap, keeping typing latency within budget.
  - Reuse existing selection state instead of DOM queries; avoid extra renders or timers.
  - Lightweight CSS (no animations) to keep scrolling and selection snappy.

## 6. Work Breakdown

| Status | Task | Notes |
|--------|------|-------|
| `done` | **Update feature-inventory.md** | Add image-enter-spacing to "🚧 In Progress" before coding |
| `done` | Implement image Enter key handling extension | `src/webview/extensions/imageEnterSpacing.ts` keymap for NodeSelection/GapCursor/inline cases; follow TabIndentation pattern |
| `done` | Wire extension and caret cues | Register in `src/webview/editor.ts`; add gap-cursor/selection styling in `src/webview/editor.css`; ensure resize icon behavior unchanged |
| `done` | **Write unit tests** | `src/__tests__/webview/imageEnterSpacing.test.ts` covering block, inline, list/quote, consecutive images, undo/redo |
| `done` | **Ship & update inventory** | Follow task-ship.md; move task file to shipped/ and update inventory |

**Status:** `pending` → `in-progress` → `done`

### How to Verify

**Update feature-inventory.md:**
1. Open `roadmap/feature-inventory.md`.
2. Add Image Enter Spacing under "🚧 In Progress" with slug/status.
3. Confirm table renders correctly in markdown preview.

**Implement image Enter key handling extension:**
1. Insert a standalone image; click before/after (gap cursor) and press Enter → blank paragraph appears on that side with focus inside.
2. In a paragraph with inline image text, click after the image and press Enter → paragraph splits, preserving text before/after image.
3. Place two adjacent images; navigate between them and press Enter → single empty paragraph inserted between.
4. Inside a list item/blockquote containing an image, press Enter at image edge → new paragraph at same indent; Shift+Enter still soft-breaks.
5. Navigate with keyboard (arrow keys) to the gap before/after an image and observe the blinking gap cursor; press Enter to insert a paragraph while retaining correct focus.

**Wire extension and caret cues:**
1. Click image edges and hover to see gap cursor/highlight matches theme and does not obscure resize icon.
2. Press Enter in non-image contexts (plain paragraphs, code blocks) → behavior unchanged.
3. Resize icon focus: pressing Enter on the icon does not insert paragraphs.

**Write unit tests:**
1. Run `npm test -- imageEnterSpacing` (or `npm test`); ensure suite passes.
2. Tests cover block, inline, list/quote, consecutive images, and undo/redo paths.
3. Confirm mocks capture Enter routing (node selection, gap cursor, text selection) and no resize icon interference.

**Ship & update inventory:**
1. Tag `prompts/features-and-tasks/task-ship.md`.
2. Move file to `roadmap/shipped/` and update feature-inventory.md "✅ Shipped".
3. Verify task status/date fields updated.

## 7. Implementation Log

### 2025-12-11 – Task refined

- **What:** Added technical plan, work breakdown, and verification steps for image Enter spacing.
- **Ready for:** Implementing image Enter key handling and caret cues.
- **First task:** Update feature-inventory.md to mark image-enter-spacing in progress.

### 2025-12-11 – Enter handling implemented

- **What:** Added ImageEnterSpacing TipTap plugin to handle Enter on images/gap cursor, wired extension in `editor.ts`, added gap-cursor/selection styling (with blink for keyboard navigation), and created targeted unit tests.
- **Files:** `src/webview/extensions/imageEnterSpacing.ts`; `src/webview/editor.ts`; `src/webview/editor.css`; `src/__tests__/webview/imageEnterSpacing.test.ts`; `roadmap/feature-inventory.md`.
- **Tests:** `npm test -- imageEnterSpacing`.

### 2025-12-11 – Arrow navigation & cursor affordance

- **What:** Added ArrowLeft/ArrowRight handling from selected images to drop a gap cursor before/after for keyboard navigation; improved gap-cursor blink styling; expanded tests for arrow paths and resize-icon guard; added side-specific image highlight (before/after/selected) to give clear visual cues near images.
- **Files:** `src/webview/extensions/imageEnterSpacing.ts`; `src/webview/editor.css`; `src/__tests__/webview/imageEnterSpacing.test.ts`.
- **Tests:** `npm test -- imageEnterSpacing`.

### 2025-12-11 – Shipped

- **What:** Marked task shipped, updated inventory entry, and verified side-specific caret highlights with Enter behavior. Added decoration-level tests for highlight direction.
- **Files:** `roadmap/shipped/task-image-enter-spacing.md`; `roadmap/feature-inventory.md`; `src/__tests__/webview/imageEnterSpacing.test.ts`.
- **Tests:** `npm test -- imageEnterSpacing`.
