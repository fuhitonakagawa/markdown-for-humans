## 1. Task Metadata

- **Task name:** Toolbar icon refresh
- **Slug:** toolbar-icon-refresh
- **Status:** shipped
- **Created:** 2025-12-07
- **Last updated:** 2025-12-09
- **Shipped:** 2025-12-07

---

## 2. Context & Problem

- **Problem:** The formatting toolbar relies on plain text glyphs, so controls feel dull, inconsistent, and hard to scan quickly.
- **Current state:** Buttons render single characters (e.g., “B”, “H1”, “•”) pulled directly from `createFormattingToolbar`, with no shared iconography or visual language.
- **Why it matters:** Authors spend most of their time in this toolbar; without recognizable icons they lose visual affordances, reducing efficiency and undermining the premium feel of the md-human editor.
- **User impact:** Power users resort to keyboard shortcuts, while newer users hesitate because the toolbar fails to communicate actions clearly.
- **Business impact:** Polished visuals are critical for differentiating md-human from the stock VS Code markdown preview.

---

## 3. Desired Outcome & Scope

- **Success criteria:**
  - Buttons use a cohesive icon set (e.g., Codicons or similar) so formatting actions are understood at a glance.
  - Hover / active states highlight icons clearly, matching VS Code theming tokens and maintaining accessibility contrast ratios.
  - Hover interactions include a subtle zoom (e.g., scale to 110%) that enlarges the icon and reveals its label for readability without shifting layout.
  - Documentation (task log + release notes entry) explains the new icon approach for future contributors.
- **Out of scope:** Reordering toolbar features or adding brand-new actions; this task purely upgrades the visual system of existing controls.

---

## 4. UX & Behavior

- **Entry points:** Sticky formatting toolbar in the custom editor webview; future-proof for BubbleMenu or command palette references.
- **Flow (desktop):**
  1. User opens an `.md` file with md-human.
  2. Toolbar renders with iconographic buttons grouped by formatting type.
  3. Hovering triggers a smooth zoom animation that magnifies the icon and fades in a label tooltip; active states toggle with filled/outlined icon variants.
  4. Keyboard shortcuts continue to work, but the iconography now communicates the same affordances visually.
- **Flow (touch / pen):**
  1. User taps a button; icon provides clear target size (min 32px hit area) with visual feedback.
  2. Dropdown menus (tables, code block languages) display icons next to labels for fast recognition.

### Current Functionality (Source of Truth)

- **Current behavior (user-facing):** Toolbar buttons show single-letter labels, optional emoji, and simple hover states; dropdowns list text-only items.
- **Current implementation (technical):** `createFormattingToolbar` in `src/webview/BubbleMenuView.ts` builds button metadata (label/title/action) and injects it into the DOM; styles live in `src/webview/editor.css` under the “Toolbar – Compact Style” section.
- **Key files:** `src/webview/BubbleMenuView.ts`, `src/webview/editor.css`, `src/webview/editor.ts` (toolbar mounting).
- **Pattern to follow:** Reuse existing button metadata array + dropdown structure, but swap textual labels for icon components akin to VS Code Codicons used in `package.json` contributes.

---

## 5. Technical Plan

- **Surfaces:**
  - Webview (BubbleMenu toolbar, TipTap UI)
  - Extension (only for packaging Codicon asset if needed)
- **Key changes:**
  - `src/webview/BubbleMenuView.ts` – Replace string `label` values with semantic icon descriptors, render both icon element and accessible text span, and expose hover/tooltip metadata.
  - `src/webview/editor.css` – Introduce `.toolbar-icon`, `.toolbar-label`, and hover/active zoom animations (scale, opacity transitions); ensure reduced-motion support via media query.
  - `src/webview/editor.ts` – Confirm toolbar initialization handles new DOM structure; no major logic change, but ensure event handlers still work after markup tweaks.
  - `docs/` or `roadmap/feature-inventory.md` – Update release notes / inventory entry to mention icon refresh (documentation requirement).
- **Architecture notes:**
  - Continue building toolbar entirely client-side; no new VS Code messages required.
  - Use Codicons (already bundled with VS Code) via `<span class="codicon codicon-bold">` to stay light-weight; fallback to emoji/text when codicon font missing.
  - Keep button metadata declarative to simplify future icon swaps; consider `icon` + `label` keys.
- **Performance considerations:**
  - Keep hover animation purely CSS (transform/opacity) to leverage GPU compositing.
  - Avoid increasing DOM depth unnecessarily; reuse existing buttons to maintain fast mounting.
  - Ensure icons degrade gracefully if fonts fail to load—no blocking network requests.

---

## 6. Work Breakdown

| Status | Task | Notes |
|--------|------|-------|
| `done` | **Update feature-inventory.md** | Added shipped entry + toolbar icon refresh description |
| `done` | Audit current toolbar rendering | Replaced glyph-only buttons with icon + label structure |
| `done` | Swap button metadata to icon descriptors | `BubbleMenuView.ts` now builds icon spans + accessible labels |
| `done` | Implement hover zoom/label styles | `editor.css` animates icons/labels with reduced-motion guard |
| `done` | Wire label reveal + icon scaling in DOM | Toolbar buttons render `.toolbar-icon` + `.toolbar-label` |
| `done` | **Write unit tests** | Jest DOM test validates icon+label scaffolding and active states |
| `done` | Update docs & release notes | Feature inventory + `docs/RELEASE_NOTES.md` updated |
| `done` | **Ship & update inventory** | Task moved to `shipped/` and dist assets built |

### How to Verify

- **Audit current toolbar rendering:**
  1. Run the extension (`npm run watch` + F5).
  2. Open `.md` file with md-human editor.
  3. Confirm baseline toolbar screenshot captured for comparison.
- **Swap metadata to icon descriptors:**
  1. Reload webview.
  2. Check DOM for `.codicon` spans + hidden text labels.
  3. Ensure buttons still trigger formatting commands.
- **Implement hover zoom/label styles:**
  1. Hover each button; expect ~110% scale animation and label fade-in without layout jump.
  2. Toggle `prefers-reduced-motion` via DevTools to confirm animation disables gracefully.
- **Unit tests:**
  1. Add Jest DOM test for toolbar builder verifying icon + label structure.
  2. Run `npm test`; ensure new tests cover both hover class toggle logic and accessibility attributes.
- **Docs & release notes:**
  1. Update `roadmap/feature-inventory.md` and release notes (if applicable).
  2. Confirm reviewers can trace change from task file.
- **Ship & update inventory:**
  1. Follow `task-ship.md` workflow once merged.
  2. Move task file to `roadmap/shipped/`.

---

## 7. Implementation Log

### 2025-12-07 – Task refined

- **What:** Added technical plan, work breakdown, and verification steps for toolbar icon refresh.
- **Ready for:** Updating `BubbleMenuView.ts`, `editor.css`, and associated tests.
- **First task:** Update `roadmap/feature-inventory.md` to mark “Toolbar icon refresh” as in progress.

### 2025-12-07 – Shipped

- **Implemented:** Codicon-based toolbar icons with hover zoom + label reveal, dropdown item icons, and active state refresh tied to TipTap selection updates.
- **Styles:** New `.toolbar-icon`/`.toolbar-label` styling, reduced-motion guardrails, and Codicon font fallback for environments without the bundled font.
- **Docs/Tests:** Added `docs/RELEASE_NOTES.md` entry, updated feature inventory, and introduced `toolbarIconRefresh.test.ts` to cover DOM structure + active states.

### 2025-12-08 – Polish and behavior fixes

- **Toolbar focus gating:** Buttons that require selection now stay usable when you click the toolbar (focus is not dropped on blur), and disabled states explain “Click in document to edit.”
- **Link dialog UX:** Link dialog now expands to the full link mark (no missing first character), respects explicit selections, and updates link text when the user edits the field before saving.
- **Table insert dialog:** Added modal-based table insertion with row/column inputs and keyboard support, wired into the Table dropdown.
- **Build pipeline:** `build:webview`/`watch:webview` now bundle CSS/TTF via esbuild loaders to ship Codicon assets (`codicon.css`/`codicon.ttf`) with the webview.
- **Listener hygiene:** Toolbar focus listener is deduped and cleaned up on editor destroy to avoid stale handlers when the editor is recreated.
- **Tests:** Added `linkDialog.test.ts` to verify link-text prefill (link and selection cases) and that edited link text is written back into the document; added `tableInsert.test.ts` for clamping and invalid-input handling.

### 2025-12-09 – Link boundary controls

- **Link boundary pills:** Added +/- controls next to the link text field to expand or trim link boundaries one word at a time without deleting surrounding text.
- **Smart relink:** When users edit link text to a substring (e.g., “ding”), the dialog now retargets the link to the matching text in the document instead of removing the extra characters.

---
