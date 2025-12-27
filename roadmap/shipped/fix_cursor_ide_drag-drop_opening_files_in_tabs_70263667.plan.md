---
name: Fix Cursor IDE drag-drop opening files in tabs
overview: Prevent Cursor IDE from opening image files in tabs when dragging them into the markdown editor by adding capture-phase event listeners that intercept drag events before Cursor's handlers can process them.
todos:
  - id: add-capture-phase-listeners
    content: Add capture-phase event listeners on document and window for dragover events in setupImageDragDrop function
    status: completed
  - id: update-cleanup
    content: Update cleanup code to remove both capture and non-capture listeners when editor is destroyed
    status: completed
  - id: test-cursor
    content: Test drag-drop in Cursor IDE from both Workspace and External Finder to verify files no longer open in tabs
    status: completed
  - id: test-vscode
    content: Test drag-drop in VS Code to ensure existing functionality still works
    status: completed
---

# Fix Cursor IDE Drag-Drop Opening Files in Tabs

## Problem

When dragging images from Workspace or External Finder in Cursor IDE, files open in tabs instead of being inserted into the markdown editor. This works correctly in VS Code and Windsurf.

## Root Cause

Cursor IDE likely handles drag-drop events earlier in the event chain (possibly with capture phase or at document level) before our current window-level listeners can prevent the default behavior.

## Solution

Add capture-phase event listeners on both `document` and `window` for `dragover` events to intercept them before Cursor's handlers. This ensures `preventDefault()` is called early enough to stop Cursor from opening files in tabs.

## Implementation

### File: `src/webview/features/imageDragDrop.ts`

**Changes to `setupImageDragDrop` function (lines 120-147):**

1. **Add capture-phase listeners for `dragover` on document and window:**

   - Use capture phase (`{ capture: true }`) to catch events before they bubble
   - Prevent default on `dragover` when images are detected
   - This tells the browser/IDE early that we want to handle the drop

2. **Keep existing window-level listeners** (non-capture) for compatibility

3. **Update cleanup** to remove both capture and non-capture listeners

**Specific changes:**

```typescript
// Guard against VS Code/Cursor opening files in tabs when dropping images
const blockWindowDrop = (e: DragEvent) => {
  if (hasImageFiles(e.dataTransfer) || extractImagePathFromDataTransfer(e.dataTransfer)) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'none';
    }
  }
};

// Capture-phase handler to catch events before Cursor IDE processes them
const blockWindowDropCapture = (e: DragEvent) => {
  if (hasImageFiles(e.dataTransfer) || extractImagePathFromDataTransfer(e.dataTransfer)) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'none';
    }
  }
};

// Add capture-phase listeners on document and window for dragover (critical for Cursor)
document.addEventListener('dragover', blockWindowDropCapture, { capture: true });
window.addEventListener('dragover', blockWindowDropCapture, { capture: true });

// Keep existing non-capture listeners for compatibility
window.addEventListener('dragover', blockWindowDrop);
window.addEventListener('drop', blockWindowDrop);
window.addEventListener('dragleave', handleWindowDragLeave as EventListener);

// Clean up all listeners when editor is destroyed
editor.on('destroy', () => {
  document.removeEventListener('dragover', blockWindowDropCapture, { capture: true });
  window.removeEventListener('dragover', blockWindowDropCapture, { capture: true });
  window.removeEventListener('dragover', blockWindowDrop);
  window.removeEventListener('drop', blockWindowDrop);
  window.removeEventListener('dragleave', handleWindowDragLeave as EventListener);
});
```

## Testing

1. Test in Cursor IDE: Drag images from Workspace file explorer - should insert into editor, not open in tabs
2. Test in Cursor IDE: Drag images from External Finder - should insert into editor, not open in tabs
3. Verify VS Code still works: Drag images from Workspace and External Finder - should continue working as before
4. Verify Windsurf still works: Drag images should continue working as before

## Notes

- Capture phase listeners run during the capture phase (before target phase), allowing us to intercept events before Cursor's handlers
- We keep both capture and non-capture listeners to ensure compatibility across different IDEs
- The `preventDefault()` on `dragover` is critical - it tells the browser/IDE that we want to handle the drop, preventing the default file-opening behavior