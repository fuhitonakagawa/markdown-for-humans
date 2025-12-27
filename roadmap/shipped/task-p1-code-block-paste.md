# 1. Task Metadata

- **Task name:** Code block paste fidelity
- **Slug:** code-block-paste
- **Status:** shipped
- **Created:** 2025-12-11
- **Last updated:** 2025-12-13
- **Shipped:** 2025-12-13

---

## 2. Context & Problem

- **Problem:** Code pasted or converted into code blocks spills outside the block, picks up extra blank lines, or keeps rich-text styling that makes the code unreadable.
- **Current state:** The Code block toolbar dropdown simply toggles TipTap's `codeBlock` node for the selection; existing marks and multi-paragraph selections are not normalized before the block is created.
- **Current state (paste):** The global paste handler normalizes markdown/HTML for rich text but is not code-block aware, so pasting into a code block can introduce paragraphs or break indentation.
- **Current state (fenced code paste):** Pasted triple-backtick fenced blocks are treated like normal markdown inserts, which can result in nested blocks or unexpected spacing inside the WYSIWYG block.
- **Current state (selection cleanup):** Multi-node selections can end up as mixed paragraphs and code blocks because nothing flattens the selection into a single block before applying the Code block command.
- **Why it matters:** Technical writers expect code to paste cleanly; broken code blocks slow editing, force manual cleanup, and undermine trust in the WYSIWYG experience.
- **Reading impact:** Extra whitespace and escaped formatting disrupt the prose-first reading experience and make long docs harder to scan.
- **Workflow impact:** Messy code pastes inflate diff noise and make Git reviews of markdown documents harder.

---

## 3. Desired Outcome & Scope

- **Success criteria:**
  - Selecting any text (rich or plain) and choosing a language from the Code block dropdown wraps the entire selection into a single fenced code block, strips inline formatting, and preserves raw text/indentation.
  - Pasting code while the cursor is inside an existing code block keeps all pasted content inside that block, inserted as plain text without turning into paragraphs or losing whitespace.
  - Pasting fenced code from VS Code, browsers, or other editors does not double-convert markdown/HTML when the target is a code block, and does not duplicate content because of other handlers.
  - Switching languages via the Code block dropdown updates the existing block without clearing or reformatting its contents.
  - Undo/redo works with code-block conversions and pastes without duplicating content or losing the block.
  - Code-block operations respect performance budgets (no noticeable lag on paste or conversion; sync debounce remains stable).
- **Out of scope:** Language auto-detection or auto-formatting, new syntax themes, multi-cursor editing changes, or automatic code linting/formatting.

---

## 4. UX & Behavior

- **Entry points:** Code block dropdown in the toolbar; keyboard focus inside an existing code block; standard paste (Cmd/Ctrl+V).
- **Flow (convert selection):** User selects text → chooses a language in the Code block dropdown → selection becomes one code block with that language; text loses rich styling but keeps literal characters and spacing; caret remains inside the block for immediate edits.
- **Flow (paste into block):** Cursor inside a code block → Cmd/Ctrl+V → pasted code inserts inline at the caret, stays within the same block, preserves indentation/newlines, and does not create surrounding paragraphs.
- **Flow (empty block):** In an empty code block, first paste fills the block; subsequent pastes append inside it rather than creating new blocks or escaping to normal paragraphs.
- **Flow (external fenced code):** Pasting a fenced snippet (e.g., ```js ... ``` ) while in a code block inserts the inner code only, without nesting fences or duplicating language labels.
- **Flow (language change):** Cursor inside a code block → select a different language from the dropdown → block updates its language attribute without rebuilding the block or moving the cursor.
- **Undo/redo:** Undo after paste or block conversion restores the previous state cleanly (no orphan paragraphs or duplicated code); redo re-applies the operation without shifting selection.
- **Mixed selection:** Converting lists/tables/paragraph mixes to a code block collapses them into a single block with preserved raw text order, rather than fragmenting into multiple nodes.
- **Error states:** If paste payload is binary/image, existing image handling still wins; non-code rich text pasted into a code block should default to plain text rather than HTML conversion.

### Current Functionality (Source of Truth)

- **Current behavior (user-facing):** Code block dropdown creates code blocks via TipTap defaults; applying to formatted text keeps styling artifacts, and pasting code into a code block can spill outside or add blank lines because paste is treated like rich text.
- **Current implementation (technical):** A capture-phase `document` paste listener in `src/webview/editor.ts` calls `processPasteContent` to convert markdown/HTML and inserts HTML without checking if a code block is active; image pastes are handled separately in `src/webview/features/imageDragDrop.ts`; code block toolbar items in `src/webview/BubbleMenuView.ts` just call `setCodeBlock` with a language; `CodeBlockLowlight` in `src/webview/editor.ts` configures highlighting but adds no paste rules.
- **Key files:** `src/webview/editor.ts`, `src/webview/utils/pasteHandler.ts`, `src/webview/BubbleMenuView.ts`, `src/webview/extensions/tabIndentation.ts`.
- **Existing tests:** `src/__tests__/webview/pasteHandler.test.ts` exercises markdown/HTML normalization paths but does not cover code-block-aware paste behavior inside TipTap.
- **Pattern to follow:** Reuse the capture-phase paste interception pattern (e.g., `processPasteContent` and image paste guards) but add code-block-aware branching; extend the toolbar command pattern in `BubbleMenuView` with a selection normalization step similar to other feature-specific transforms.
- **Related behavior:** The TabIndentation extension defers to `codeBlock` for Tab/Shift+Tab, so any code-block paste fixes need to avoid interfering with keyboard handling.

---

## 5. Technical Plan

- **Surfaces:**
  - Webview (TipTap editor, toolbar, paste handling)
- **Key changes:**
  - `src/webview/editor.ts` – Make capture-phase paste handling code-block-aware: if active selection is inside `codeBlock`, bypass markdown/HTML conversion, unwrap fenced payloads to raw code, and insert as plain text; keep image handling precedence.
  - `src/webview/utils/pasteHandler.ts` – Add helper to detect fenced snippets and return language + raw content; expose a flag for code-block-safe plain insertion to avoid HTML routes.
  - `src/webview/BubbleMenuView.ts` – Normalize selection before applying code block: strip marks, extract selection text as plain, replace with a single `codeBlock` node with language; add language-change path that updates attrs without rebuilding the node.
  - `src/webview/extensions/tabIndentation.ts` (if needed) – Verify Tab/Shift+Tab still delegates to CodeBlockLowlight after paste/normalize changes; adjust only if regression appears.
  - Tests in `src/__tests__/webview/pasteHandler.test.ts` (and new toolbar-focused test file) – Add TDD coverage for fenced detection, code-block-aware paste, and toolbar conversion behavior.
- **Architecture notes:**
  - Webview-only changes; no extension messaging required.
  - Keep existing capture-phase interception; short-circuit early for code blocks to avoid double handling with rich HTML.
  - Reuse `CodeBlockLowlight` node; avoid new node types.
- **Performance considerations:**
  - Favor plain text insertion inside code blocks to keep paste under 50ms.
  - Ensure no duplicate sync events; current 500ms debounce remains.
  - Avoid extra DOM thrash—use TipTap commands (`insertContent`, `setNode`, `setCodeBlock`) instead of manual edits.

---

## 6. Work Breakdown

| Status | Task | Notes |
|--------|------|-------|
| `completed` | **Update feature-inventory.md** | Add task to “🚧 In Progress” |
| `completed` | Add fenced-code detection helper | `src/webview/utils/pasteHandler.ts` |
| `completed` | Make document-level paste handling code-block-aware | `src/webview/editor.ts`; ensure image path stays highest priority |
| `completed` | Normalize toolbar code-block action for selections | `src/webview/BubbleMenuView.ts`; collapse selection into single block, preserve text |
| `completed` | Verify/adjust TabIndentation after changes | TabIndentation already delegates to CodeBlockLowlight; no changes needed |
| `completed` | **Write unit tests** | `src/__tests__/webview/pasteHandler.test.ts` - 12 tests for `parseFencedCode()` |
| `completed` | **Ship task & update inventory** | Moved to shipped/, updated feature-inventory ✅ |

### How to Verify

**Feature inventory updated:**
1. Edit `roadmap/feature-inventory.md` → add “Code block paste fidelity” under “🚧 In Progress”.
2. Verify slug/status match this task file.

**Fenced-code helper:**
1. Run `npm test -- --testNamePattern="fenced code"`.
2. Expect helper returns language (if any) and raw code content; empty when not fenced.

**Paste inside code block:**
1. Cursor inside a code block → paste multi-line code (with/without backticks).
2. Expect content stays inside same block, preserves indentation/newlines, no extra paragraphs; latency <300ms.

**Toolbar conversion:**
1. Select mixed formatted text (bold, list, table) → toolbar Code block > language.
2. Expect a single code block with raw text (no marks), language set, cursor remains in block.

**TabIndentation sanity:**
1. In code block, Tab/Shift+Tab behave unchanged (delegated to CodeBlockLowlight).
2. No console noise/regressions.

**Unit tests:**
1. Run `npm test`.
2. All suites pass; new tests cover code-block paste + toolbar conversion; coverage not reduced.

**Ship:**
1. Tag task-ship → move task to `roadmap/shipped/`.
2. Update feature-inventory “✅ Shipped”.

---

## 7. Implementation Log

### 2025-12-11 – Task refined

- **What:** Added technical plan, work breakdown, and verification steps for code-block paste fidelity.
- **Ready for:** Implementing fenced detection, code-block-aware paste handling, and toolbar normalization with tests.
- **First task:** Update feature-inventory to mark "Code block paste fidelity" in progress.

### 2025-12-11 – Implementation complete (partial)

- **What:** Implemented toolbar normalization for code blocks.
- **Changes:**
  1. **[BubbleMenuView.ts](../../src/webview/BubbleMenuView.ts:19-56)** – Added `setCodeBlockNormalized()` helper that strips marks from selection, extracts plain text, and creates a single code block; supports language changes without rebuilding.
  2. **[BubbleMenuView.ts](../../src/webview/BubbleMenuView.ts:443-496)** – Updated all 13 code block dropdown items to use `setCodeBlockNormalized()` instead of direct `setCodeBlock()`.
- **Status:** Toolbar normalization complete. Paste handling and tests still pending.

### 2025-12-13 – Implementation complete (full)

- **What:** Completed code-block paste fidelity implementation following TDD principles.
- **Changes:**
  1. **[pasteHandler.ts](../../src/webview/utils/pasteHandler.ts:249-280)** – Added `parseFencedCode()` helper that detects and extracts language + raw code from fenced blocks (supports both ``` and ~~~ fences, preserves indentation and blank lines, handles empty blocks).
  2. **[pasteHandler.test.ts](../../src/__tests__/webview/pasteHandler.test.ts:414-476)** – Added 12 comprehensive tests for `parseFencedCode()` covering edge cases (empty blocks, missing fences, language detection with hyphens, indentation preservation, backticks inside code).
  3. **[editor.ts](../../src/webview/editor.ts:35)** – Added `parseFencedCode` import from `./utils/pasteHandler`.
  4. **[editor.ts](../../src/webview/editor.ts:937-964)** – Made paste handler code-block-aware: when pasting into a code block, checks `editor.isActive('codeBlock')`, unwraps fenced code using `parseFencedCode()`, and inserts plain text without HTML conversion. Image handling precedence maintained.
- **Tests:** All 12 `parseFencedCode()` tests pass. Full test suite passes (479 tests, 34 suites). No TypeScript errors. TabIndentation verified to still delegate to CodeBlockLowlight (no changes needed).
- **Status:** Implementation complete. Ready for manual verification and shipping.

### 2025-12-13 – Fix: Cursor positioning after code block creation

- **What:** Fixed issue where pasting immediately after creating a code block from toolbar would remove the code block.
- **Problem:** When creating an empty code block via toolbar, cursor was not positioned inside the block, causing `editor.isActive('codeBlock')` to return false, so paste handler treated it as normal paste.
- **Solution:** Changed empty code block creation to use TipTap's `setCodeBlock()` command instead of `insertContent()`, which properly positions cursor inside the block and makes it immediately active.
- **Changes:**
  1. **[BubbleMenuView.ts](../../src/webview/BubbleMenuView.ts:36-45)** – Replaced complex `insertContent` + manual cursor positioning with `setCodeBlock()` command for empty selections.
- **Status:** Fixed. Cursor is now properly positioned inside code block immediately after creation, allowing paste to work correctly.

