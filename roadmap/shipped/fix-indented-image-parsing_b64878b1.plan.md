---
name: fix-indented-image-parsing
overview: Fix markdown image parsing to handle images with leading tabs or spaces by intercepting code block tokens and preserving indentation in image attributes.
status: DONE
todos: []
---

# Fix Indented Image Parsing

## Resolution (Dec 14, 2025)

**Root cause:** `@tiptap/markdown` builds its `MarkdownManager` from `editor.extensionManager.baseExtensions` (raw, unsorted) and registers `parseMarkdown` handlers in that order. `CodeBlockLowlight` (via `CodeBlock`) consumes all `code` tokens first, so our interceptor never ran even though it was loaded.

**Fix:** Add a dedicated `code` token handler that runs **before** `CodeBlockLowlight` and converts **indented** code blocks that contain **only** markdown image lines into real image nodes, while preserving the original indentation for round-trip serialization.

**Implemented:**
- `src/webview/extensions/indentedImageCodeBlock.ts` — `Extension.create({ markdownTokenName: 'code' })` that intercepts `token.codeBlockStyle === 'indented'` and rewrites image-only blocks into a `paragraph` containing `image` + `hardBreak` nodes.
- `src/webview/editor.ts` — registers `IndentedImageCodeBlock` before `CodeBlockLowlight`.
- `src/webview/extensions/customImage.ts` — adds `indent-prefix` attribute, uses it in `renderMarkdown`, and applies visual indentation in the NodeView.
- `src/__tests__/webview/indentedImageCodeBlock.test.ts` — integration test via `MarkdownManager` parse/serialize.
- `src/__tests__/webview/customImageIndentation.test.ts` — jsdom test for NodeView indentation styles.

**Verify:** `npm test` ✅

## Problem Statement

Images with leading tabs/spaces (4+ spaces or tabs) render as code blocks instead of images because `marked.js` (used by TipTap's Markdown extension) treats indented lines as code blocks.

**Sample input:**
```markdown
	     ![Gemini_Generated_Image](./new-images/pasted_Gemini.png)
		![attemp1_700x395px](./new-images/pasted_attemp1.png)
```

**Expected:** Images render as `<img>` elements  
**Actual:** Images render as `<pre><code>` blocks (monospace, gray background)

**Constraint:** Cannot trim whitespace - users may intentionally indent images (e.g., in lists), and trimming would modify source markdown.

---

## Attempts Made

### Attempt 1: Add `markdownTokenName: 'code'` to CustomImage Extension ❌ FAILED

**Approach:** Added `markdownTokenName: 'code'` and `parseMarkdown` directly to `CustomImage` extension to intercept indented code blocks containing image syntax.

**Why it failed:** `CustomImage` extends `@tiptap/extension-image` which handles 'image' tokens. Setting `markdownTokenName: 'code'` overrides this, breaking regular image parsing. TipTap only allows ONE `markdownTokenName` per extension.

**Files modified:**
- `src/webview/extensions/customImage.ts`

---

### Attempt 2: Separate `IndentedImageCodeBlock` Extension ❌ FAILED

**Approach:** Created a new block-level extension (`Node.create()`) that:
1. Has `priority: 250` (higher than Mermaid's 200, CodeBlockLowlight's 100)
2. Sets `markdownTokenName: 'code'` to intercept code tokens
3. Sets `code: true` (matching Mermaid pattern)
4. Implements `parseMarkdown` to detect indented image syntax
5. Creates image nodes via `helpers.createNode('image', {...})` with `indent-prefix` attribute

**Files created:**
- `src/webview/extensions/indentedImageCodeBlock.ts`
- `src/__tests__/webview/customImageIndented.test.ts` (19 tests, all pass ✅)

**Files modified:**
- `src/webview/editor.ts` - registered `IndentedImageCodeBlock` before Mermaid in extensions array
- `src/webview/extensions/customImage.ts` - added `indent-prefix` attribute and updated `renderMarkdown`

**Build status:** ✅ Passes  
**Test status:** ✅ 565 tests pass (including 19 new indented image tests)  
**Manual test:** ❌ FAILED - images still render as code blocks

**Debugging added:**
- Console logs at module load: `[IndentedImageCodeBlock] Extension module loaded`
- Console logs in `parseMarkdown`: `[IndentedImageCodeBlock] ⚠️ parseMarkdown FUNCTION CALLED! ⚠️`
- Console logs in editor init: `[MD4H] IndentedImageCodeBlock extension:`

**Result:** No console logs from `parseMarkdown` function - TipTap's Markdown extension is **not calling** `parseMarkdown` on our extension.

---

## Technical Details

### Pattern Used (Copied from Mermaid)

The implementation follows the exact pattern from `src/webview/extensions/mermaid.ts`:

```typescript
export const Mermaid = Node.create({
  name: 'mermaid',
  priority: 200,
  group: 'block',
  content: 'text*',
  code: true,  // ← Key property
  markdownTokenName: 'code',
  parseMarkdown: (token, helpers) => {
    // Intercepts code tokens
  },
});
```

Our extension used the same structure:
```typescript
export const IndentedImageCodeBlock = Node.create({
  name: 'indentedImageCodeBlock',
  priority: 250,  // Higher than Mermaid
  group: 'block',
  content: 'text*',
  code: true,  // ← Added this
  markdownTokenName: 'code',
  parseMarkdown: (token, helpers) => {
    // Never called - no console logs
  },
});
```

### Extension Registration Order

Registered in `src/webview/editor.ts`:
```typescript
extensions: [
  IndentedImageCodeBlock,  // First - priority 250
  CustomImage.configure({...}),
  Mermaid,  // Priority 200
  // ... other extensions
]
```

---

## Unknowns / Questions for Expert

1. **Is `parseMarkdown` being called at all?**
   - No console logs from `parseMarkdown` function despite:
     - Extension module loading (confirmed via console)
     - Extension registered in editor (confirmed via console)
     - Tests passing (logic works in isolation)
   - **Question:** Does TipTap's Markdown extension require something else to invoke `parseMarkdown`?

2. **Extension priority vs registration order:**
   - We set `priority: 250` (higher than Mermaid's 200)
   - We registered it first in the extensions array
   - **Question:** Does TipTap use priority or registration order for `parseMarkdown` invocation? Does it stop at first extension that matches `markdownTokenName`?

3. **Token processing flow:**
   - Mermaid's `parseMarkdown` returns `[]` for non-mermaid code blocks
   - **Question:** Does TipTap continue to other extensions when one returns `[]`, or does it stop?

4. **Alternative approaches:**
   - Pre-process markdown before TipTap parsing? (User rejected - modifies source)
   - Custom `marked.js` tokenizer? (Would need to hook into TipTap's Markdown extension)
   - ProseMirror plugin instead of TipTap extension? (Lower-level, more complex)
   - Hook into TipTap's Markdown extension's token processing directly?

5. **Extension structure:**
   - We create 'image' nodes, not 'indentedImageCodeBlock' nodes
   - **Question:** Does TipTap require extensions to create nodes of their own type for `parseMarkdown` to work?

---

## Test Results

**Unit tests:** ✅ 19/19 pass
- Tests `parseMarkdown` logic in isolation
- Tests `renderMarkdown` serialization
- Covers tabs, spaces, mixed whitespace, edge cases

**Integration:** ❌ Fails in actual editor
- Extension loads (module-level console log works)
- Extension registers (editor init console log works)
- `parseMarkdown` never called (no function-level console logs)

**Conclusion:** Logic is correct, but TipTap's Markdown extension is not invoking our `parseMarkdown` function.

---

## Files Referenced

- `src/webview/extensions/mermaid.ts` - Working example of code token interception
- `src/webview/extensions/githubAlerts.ts` - Working example of blockquote token interception
- `src/webview/extensions/customImage.ts` - Image extension (inline, handles 'image' tokens)
- `src/webview/editor.ts` - Extension registration

---

## Next Steps

1. **Consult expert** on TipTap Markdown extension internals
2. **Verify** if `parseMarkdown` invocation requires specific conditions
3. **Explore** alternative approaches if extension-based interception isn't possible
4. **Consider** if this is a TipTap limitation or configuration issue
