# Task: Copy/Paste Support & Toolbar Buttons

**Status:** completed
**Created:** 2025-11-29
**Last Updated:** 2025-11-29 10:35 IST

## Goal

Implement copy/paste support and toolbar buttons for the markdown editor:
1. Add Copy & Source View buttons to toolbar
2. Implement smart paste (HTML→Markdown conversion with turndown.js)

## Context

Part of feature-copy-paste-support phase-1-mvp. Users need to:
- Copy selected content as clean markdown
- Paste rich content from Word/Google Docs/web and have it converted to markdown
- Open source view in split panel

## Approach

1. Add toolbar buttons that dispatch custom events
2. Create pasteHandler utility using turndown.js for HTML→Markdown
3. Wire up event handlers in editor.ts
4. Write unit tests for the paste handler

## Files Modified

- `package.json` – Add turndown dependency
- `src/webview/BubbleMenuView.ts` – Add Copy and Source View buttons
- `src/webview/editor.ts` – Wire up copy and paste event handlers
- `src/webview/utils/pasteHandler.ts` – New file for HTML→Markdown conversion
- `src/__tests__/webview/pasteHandler.test.ts` – Unit tests

## Changes Made

### 2025-11-29 10:15 - Initial implementation
- Creating task log file
- Planning implementation approach
- Starting with turndown dependency and paste handler utility

### 2025-11-29 10:35 - Completed implementation
- Added `turndown` and `@types/turndown` dependencies to package.json
- Created `src/webview/utils/pasteHandler.ts` with:
  - Turndown configuration for ATX headings, fenced code blocks, strikethrough
  - Custom rules for task lists and code blocks with language detection
  - Word-specific markup cleanup
  - `htmlToMarkdown()`, `processPasteContent()`, helper functions
- Updated `src/webview/BubbleMenuView.ts`:
  - Added Copy button (📋) with `copyAsMarkdown` event dispatch
  - Added Source View button (`</>`) with `openSourceView` event dispatch
  - Added separator before utility buttons
- Updated `src/webview/editor.ts`:
  - Added `copyAsMarkdown` event handler with markdown serialization
  - Added `openSourceView` event handler to post message to extension
  - Added paste event listener with HTML→Markdown conversion
- Added CSS styles in `src/webview/editor.css`:
  - `.copy-button` and `.copied` feedback state (green highlight)
  - `.source-button` with monospace font styling
- Created comprehensive unit tests in `src/__tests__/webview/pasteHandler.test.ts`:
  - 20+ test cases for HTML→Markdown conversion
  - Tests for clipboard detection helpers
  - Tests for processPasteContent flow

## Decisions

- **turndown.js over custom conversion**: Battle-tested library with good markdown output
- **Custom events for toolbar actions**: Allows decoupling toolbar UI from implementation
- **Paste interception via TipTap editorProps**: Clean integration with existing editor

## Issues Encountered

(None yet)

## Follow-up Tasks

- [ ] task-copy-markdown.md - Implement the actual copy logic
- [ ] task-source-view-command.md - Implement VS Code split view command
- [ ] task-image-paste.md - Handle image paste

## Notes

Related spec: `specs/copy-paste-support/phase-1-mvp.md`
