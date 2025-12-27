---
name: Fix bold markdown rendering
overview: Fix the bug where `**` wrapped text (bold markdown syntax) is not rendering correctly in the editor. The issue likely stems from TipTap's Markdown extension not properly parsing bold syntax or CSS not targeting the correct DOM structure.
todos:
  - id: investigate-dom
    content: Investigate actual DOM structure rendered by ProseMirror for bold text - check if <strong> tags are created or if marks use different structure
    status: completed
  - id: add-css-selectors
    content: Verify CSS selectors in editor.css apply to the actual DOM structure (TipTap renders bold as <strong>)
    status: completed
  - id: verify-markdown-config
    content: Verify Markdown extension configuration in editor.ts - ensure it's properly parsing ** syntax and not being interfered with by custom extensions
    status: completed
  - id: create-tests
    content: Create test file bold-rendering.test.ts to verify markdown parsing creates correct ProseMirror structure and renders as bold
    status: completed
  - id: manual-verification
    content: Manually test with the user's example document (Untitled-1) to verify **text** renders correctly as bold
    status: pending
---

# Fix Bold Markdown Rendering Bug

## Problem Analysis

The user reports that `**` wrapped text (bold markdown syntax) is not rendering correctly in the editor. Based on codebase audit:

1. **CSS exists**: `src/webview/editor.css` has `.markdown-editor strong { font-weight: 700; }` (line 1215)
2. **StarterKit includes Bold**: TipTap StarterKit should include Bold extension by default
3. **Markdown extension configured**: `@tiptap/markdown` is configured with GFM enabled
4. **Toolbar works**: Bold toggle button uses `editor.chain().focus().toggleBold().run()` which suggests Bold extension is available

**Root Cause Hypothesis:**

- TipTap's Markdown extension may not be properly parsing `**` syntax into bold marks when content is set via `setContent(markdown, { contentType: 'markdown' })`
- CSS selector `.markdown-editor strong` may not be matching ProseMirror's rendered structure
- There may be a conflict with custom extensions (MarkdownParagraph, GitHubAlerts) that intercept markdown parsing

## Findings

- Root cause: `@tiptap/extension-list`’s ordered list markdown parsing drops inline tokens when list items come from marked.js as `text` tokens (this happens for CommonMark `1)` ordered-list markers). Result: raw markdown like `**bold**` renders literally on first load.
- Fix: register a small override extension `OrderedListMarkdownFix` that parses ordered list items via `helpers.parseChildren(items)` (so ListItem parsing handles inline marks), and disable the default `orderedList` inside `ListKit`.
- Regression tests added/expanded: `src/__tests__/webview/bold-rendering.test.ts` (covers ordered list `1)` + frontmatter-at-top repro).

## Investigation Steps

1. **Verify DOM structure**: Check what HTML ProseMirror actually renders for bold text
2. **Test Markdown parsing**: Verify if `**text**` is being parsed correctly by TipTap's Markdown extension
3. **Check CSS specificity**: Ensure CSS selectors match the actual DOM structure
4. **Review extension order**: Verify extension registration order doesn't interfere with bold parsing

## Implementation Plan

### Step 1: Add CSS for ProseMirror mark structure

**File**: `src/webview/editor.css`

TipTap/ProseMirror may render bold as marks with different structure. Add comprehensive selectors:

```css
/* Ensure bold works in all contexts */
.markdown-editor strong,
.markdown-editor .ProseMirror strong,
.markdown-editor [data-type="bold"],
.markdown-editor mark[data-type="bold"] {
  font-weight: 700;
}
```

### Step 2: Verify Markdown extension configuration

**File**: `src/webview/editor.ts`

Check if Markdown extension needs explicit Bold extension reference or additional configuration. The Markdown extension should automatically handle `**` syntax if Bold is in StarterKit, but we may need to:

- Ensure Markdown extension is registered after StarterKit (current order looks correct)
- Verify `markedOptions` configuration supports bold parsing
- Check if custom extensions are interfering with inline mark parsing

### Step 3: Test markdown parsing

**File**: `src/__tests__/webview/bold-rendering.test.ts` (new)

Create test to verify:

- `**text**` is parsed into bold marks
- Bold marks render as `<strong>` tags in DOM
- CSS applies correctly to rendered bold text

### Step 4: Debug actual rendering

Add temporary console logging in `updateEditorContent` to inspect:

- What ProseMirror JSON structure is created from `**text**`
- What HTML is rendered in the DOM
- Whether bold marks are present in the document

## Files to Modify

1. **`src/webview/editor.css`** - Add comprehensive CSS selectors for bold rendering
2. **`src/webview/editor.ts`** - Review Markdown extension configuration, add debugging if needed
3. **`src/__tests__/webview/bold-rendering.test.ts`** - New test file to verify bold parsing and rendering

## Testing Strategy

1. **Unit tests**: Verify markdown parsing creates correct ProseMirror structure
2. **Integration tests**: Verify bold text renders correctly in editor DOM
3. **Manual testing**: Open document with `**bold**` text and verify it appears bold
4. **Edge cases**: Test bold in lists, blockquotes, headings, nested formatting

## Success Criteria

- `**text**` markdown syntax renders as bold text in the editor
- Bold text has `font-weight: 700` applied
- Bold works in all contexts (paragraphs, lists, blockquotes, etc.)
- Bold toolbar button and keyboard shortcut continue to work
- Bold serializes back to `**text**` in markdown output

## Notes

- TipTap v3's Markdown extension should handle `**` syntax automatically
- StarterKit includes Bold extension by default
- CSS selector `.markdown-editor strong` should work if ProseMirror renders `<strong>` tags
- May need to check if custom paragraph extension interferes with inline mark parsing
