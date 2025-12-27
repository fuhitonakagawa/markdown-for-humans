# 1. Task Metadata

- **Task name:** P1: Fix newline rendering in plain-text markdown blocks
- **Slug:** p1-email-markdown-newline-rendering
- **Status:** shipped
- **Created:** 2025-12-01
- **Last updated:** 2025-12-01
- **Shipped:** 2025-12-01

---

## 2. Context & Problem

- **Current state:**

  - Users often write multiple plain-text lines (one per line, not list items) for quick option sets like:

    ```plaintext
    Subject Option 1: Markdown is broken. I fixed it.
    Subject Option 2: Stop writing raw Markdown (seriously)
    Subject Option 3: Write Markdown like a human 🧠
    Subject Option 4: The VS Code extension you didn't know you needed
    Subject Option 5: Finally: A free WYSIWYG editor for VS Code
    ```

    When opened in the md-human WYSIWYG editor, those newline-separated lines are rendered as one flowing paragraph with inline spaces between them (as seen in the provided screenshot). It comes like this: 

    ![image](./images/image-1764580981207.png)

- **Pain points:**

  - Visually, all lines appear merged, which makes it harder to scan and compare or edit individual options.
  - The rendered view does not reflect the underlying markdown/newline structure.

- **Why it matters:**

  - The editor should be a trustworthy representation of the markdown document, especially when users depend on one-line-per-option flows.
  - Collapsing single newlines in these plain-text sections hurts readability and makes comparing options slower.

---

## 3. Desired Outcome & Scope

- **Success criteria:**
  - Newline-separated plain-text lines (not part of a list, heading, or block element) render as visually separated lines/paragraphs in the WYSIWYG editor.
  - The example block above displays each option as a distinct line/paragraph rather than one long paragraph.
  - Existing behavior for proper markdown paragraphs and lists is preserved (no regressions).
  - Behavior is covered by automated tests, including a regression test for this newline rendering behavior.
- **In scope:**
  - Parsing/rendering rules for how single newlines vs double newlines are treated in plain-text blocks.
  - Any TipTap/ProseMirror or markdown-to-doc conversions that currently collapse these newlines.
  - Minimal UX adjustments needed so that common "multiple options on separate lines" flows look correct.
- **Out of scope:**
  - Broader typography changes or layout redesigns.
  - New formatting options for subject lines or other dedicated block types.
  - Import/export semantics beyond standard markdown behavior.

---

## 4. UX & Behavior

- **Entry points:**
  - Opening any markdown file in the md-human WYSIWYG editor where the user has authored newline-separated plain-text options (like the subject-option block above).
- **User flows:**
  - User writes several options as separate lines in markdown (no bullets, just plain text with newlines).
  - User opens or switches to the WYSIWYG view.
  - User sees each logical line as a visually distinct line or paragraph, with clear separation that matches the markdown’s line breaks.
- **Behavior rules:**
  - For these plain-text blocks, a single newline between lines should result in a visual break (line or paragraph) rather than collapsing into a single paragraph.
  - Should continue to honor markdown semantics for lists, headings, and paragraphs (e.g., not turning every soft wrap in a normal paragraph into a new visual line).

---

## 5. Technical Plan

- **Surfaces:**
  - Webview TipTap editor (rendering and serialization)
  - Extension side remains unchanged (TextDocument stays source of truth)
- **Key changes:**
  - `src/webview/editor.ts` – Adjust TipTap configuration/Markdown extension options to preserve single newlines in plain-text blocks instead of collapsing to a single paragraph.
  - `src/webview/extensions/` (new helper if needed) – Optional lightweight TipTap extension to interpret single `\n` in bare text blocks as hard breaks or separate paragraph nodes without touching lists/headings.
  - `src/webview/markdown/` (parser/serializer utilities, if present) – Ensure markdown → doc → markdown keeps single-newline separation for bare text blocks while leaving standard paragraph/list semantics intact.
  - `src/webview/editor.css` – Minor spacing tweak only if necessary to make separated lines readable without altering overall typography.
- **Architecture notes:**
  - Entirely webview-scoped; no new extension messages. Keep transformations symmetrical so serialization does not re-collapse lines.
  - Scope the behavior to bare text blocks; guard lists, headings, blockquotes, and normal paragraphs from unintended splits.
- **Performance considerations:**
  - Prefer configuration or a small extension over heavy post-processing; keep render-time work minimal to stay within the <16ms interaction budget and existing 500ms sync debounce.

---

## 6. Work Breakdown

| Status | Task | Notes |
|--------|------|-------|
| `done` | Inspect current Markdown parser/serializer behavior for single newlines in plain-text blocks | Found `breaks: false` in `editor.ts:208` and `pasteHandler.ts:112` |
| `done` | Implement newline preservation for plain-text blocks | Changed `breaks: false` → `breaks: true` in both files (single-line fix) |
| `done` | Add/minimize CSS spacing if needed | Not needed—`<br>` tags render correctly with existing styles |
| `done` | **Write unit tests** | Added 5 regression tests in `src/__tests__/webview/pasteHandler.test.ts` under `single newline preservation (breaks: true)` ✅ |
| `done` | Manual verification in WYSIWYG | Verified by user with `email-newsletter.md` ✅ |

### How to Verify

**Inspect current behavior:**
1. Open `src/webview/editor.ts` and markdown parser/serializer utilities.
2. Trace how single `\n` is transformed markdown → doc → markdown.
3. Confirm where collapsing occurs.

**Implement newline preservation:**
1. Apply code changes to parser/serializer or a new TipTap extension.
2. Reload the extension and open a sample with the subject-option block.
3. Expect each line to render separately with no change to lists/headings.

**CSS spacing (if used):**
1. Verify spacing between separated lines matches surrounding typography.
2. Ensure no layout shift for other block types.

**Unit tests:**
1. Run `npm test`.
2. New tests assert single-newline plain-text blocks render as separate lines; lists/paragraphs unaffected.
3. Tests pass.

**Manual verification:**
1. Open the WYSIWYG view for `email-newsletter.md` (or a similar sample block).
2. Confirm each option renders as its own line/paragraph, not one long paragraph.
3. Check lists/headings still render normally.

---

## 7. Implementation Log

### 2025-12-01 – Task refined

- **What:** Technical plan and work breakdown added
- **Ready for:** Implementation
- **First task:** Inspect current Markdown parser/serializer behavior for single newlines in plain-text blocks

### 2025-12-01 – Bug fixed

- **What:** Changed `breaks: false` to `breaks: true` in markdown config
- **Files:**
  - `src/webview/editor.ts:208` – TipTap Markdown extension config
  - `src/webview/utils/pasteHandler.ts:112` – markdown-it instance for paste handling
- **Root cause:** CommonMark spec treats single newlines as spaces when `breaks: false`. Setting `breaks: true` converts single `\n` to `<br>` tags, preserving visual line separation.
- **Tests:** Added 5 regression tests in `src/__tests__/webview/pasteHandler.test.ts`:
  - `should convert single newlines to <br> in plain text blocks`
  - `should preserve newlines in email subject options (real-world example)`
  - `should still create paragraph breaks for double newlines`
  - `should not affect list rendering`
  - `should not affect heading rendering`
- **Result:** All 166 tests pass, no regressions

---

## 8. Decisions & Tradeoffs

- **Single config change over custom extension:** The fix required only changing `breaks: false` → `breaks: true` in two places. No new TipTap extension or parser changes were needed—this is the simplest solution that works.
- **`breaks: true` semantic:** This deviates from strict CommonMark (which treats single newlines as spaces) but matches user expectations for plain-text blocks where each line is a discrete item. This is the same behavior as GitHub-Flavored Markdown's `hard_wrap` option.

---

## 9. Follow-up & Future Work

- `[Future enhancements TBD once core behavior is fixed]`
