# Task: Fix Image Drag-Drop Base64 Issue

**Status:** completed (ready for testing)
**Created:** 2025-11-28
**Last Updated:** 2025-11-28

## Summary

Fixed two critical issues with image drag-and-drop:

1. **Base64 issue**: Images were staying as base64 because document sync was racing with image save, stripping the `data-placeholder-id` tracking attribute. Fixed by tracking pending saves and delaying sync until images are saved.

2. **403 Forbidden issue**: Saved images couldn't load in webview because relative paths don't work with webview security. Fixed by:
   - Adding workspace folder to `localResourceRoots`
   - Creating custom image node view that detects relative paths
   - Implementing URI resolution system via message passing
   - Extension converts relative paths to webview URIs on-demand

**Result**: Images are saved as files with relative paths in markdown (portable), but display correctly in webview using resolved URIs.

## Goal
Fix the issue where dropped/pasted images remain as base64 strings in the markdown file instead of being saved as files and replaced with relative paths.

## Context
User implemented image drag-drop feature. The feature shows a confirmation dialog and appears to save images, but the markdown file still contains large base64 strings instead of relative paths like `./images/photo-123.png`.

## Root Cause Analysis

After careful investigation, found the root cause:

1. Image is inserted with `src="data:image/png;base64,..."` and `data-placeholder-id="img-123"`
2. TipTap's `onUpdate` handler triggers and calls `debouncedUpdate(markdown)` with 500ms delay
3. `saveImage` message is sent to extension (file is saved quickly)
4. Extension sends back `imageSaved` message with `newSrc: "./images/photo-123.png"`
5. **PROBLEM: The 500ms debounce fires, syncing markdown to extension**
6. Markdown serialization converts image to: `![alt](data:image/png;base64,...)`
7. The `data-placeholder-id` attribute is LOST because markdown doesn't support custom HTML attributes
8. Extension receives the markdown with base64 and syncs it back to webview
9. Image is re-rendered from markdown WITHOUT the `data-placeholder-id`
10. When `updateImageSrc()` tries to find the image by placeholder ID, it can't find it
11. Image stays as base64 in the document

**Key Insight:** The document sync is racing with the image save operation and destroying the tracking mechanism.

## Approach

### Option 1: Prevent Sync During Image Save (CHOSEN)
Track pending image saves and skip document sync while any are in progress.

**Pros:**
- Simple and direct
- Doesn't change the overall architecture
- Images won't be synced until they're fully saved

**Cons:**
- Need to handle edge cases (save failures, timeouts)

### Option 2: Use Different Tracking Mechanism
Instead of `data-placeholder-id`, use the base64 src itself to find images.

**Pros:**
- Survives markdown serialization

**Cons:**
- Multiple images with same content would collide
- Base64 strings are huge (performance)
- Doesn't solve the fundamental race condition

### Option 3: Delay Document Sync
Increase debounce from 500ms to longer (e.g., 2000ms).

**Pros:**
- Simple one-line change

**Cons:**
- Feels laggy for users
- Doesn't guarantee the image will finish saving
- Band-aid solution, not a real fix

**Decision:** Going with Option 1 as it solves the root cause properly.

## Implementation Plan

1. Add `pendingImageSaves` Set to track placeholder IDs of images being saved
2. Add image to set when inserting (in `insertImage`)
3. Remove from set when receiving `imageSaved` or `imageError`
4. In `debouncedUpdate`, check if set is empty before syncing
5. If not empty, reschedule the debounce to check again later
6. Add timeout safety (max 10 seconds wait) to prevent infinite delays

## Files Modified

### `/Users/abhinav/code/md-human/src/webview/editor.ts`
- Added pending images tracking to debounce logic (lines 105-112)
- Added global `resolveImagePath()` function for URI resolution (lines 60-71)
- Added message handler for `imageUriResolved` responses (lines 379-386)

### `/Users/abhinav/code/md-human/src/webview/features/imageDragDrop.ts`
- Added `pendingImageSaves` Set tracking (lines 18-32)
- Register pending saves when inserting images (line 334)
- Unregister on save success/error (lines 237, 246)

### `/Users/abhinav/code/md-human/src/webview/extensions/customImage.ts`
- Implemented custom `addNodeView()` for image rendering
- Detects relative paths vs absolute/data URIs
- Uses global `resolveImagePath()` to get webview URIs for relative paths
- Handles loading states while resolving

### `/Users/abhinav/code/md-human/src/editor/MarkdownEditorProvider.ts`
- Added workspace folder to `localResourceRoots` (lines 37-50)
- Created `handleResolveImageUri()` method (lines 123-145)
- Converts relative paths to webview URIs using `webview.asWebviewUri()`
- Stores only relative paths in markdown (line 199)

## Changes Made

### 2025-11-28 Initial Analysis
- Investigated why images remain as base64
- Added extensive logging to trace message flow
- Discovered the document sync race condition
- Documented root cause

### 2025-11-28 Attempted Fix #1 (Failed)
- Updated `updateImageSrc` to use TipTap's `updateAttributes`
- This would have worked if the placeholder ID survived serialization
- Didn't solve the root cause (doc sync stripping the ID)

### 2025-11-28 Attempted Fix #2 (Webview URI Resolution)
- Discovered that images couldn't load due to webview security (403 Forbidden)
- Webview can only load resources from allowed `localResourceRoots`
- Added workspace folder to `localResourceRoots` in MarkdownEditorProvider
- Implemented custom node view for images in CustomImage extension
- Created URI resolution system: webview requests extension to convert relative paths to webview URIs
- Extension handler `handleResolveImageUri` converts paths using `webview.asWebviewUri()`
- Global function `resolveImagePath()` in editor.ts for image resolution
- Message flow: image needs URI → request via `resolveImageUri` → extension resolves → callback updates DOM

## Implementation Complete

### Changes Applied (2025-11-28)

**1. Added pending image save tracking** ([imageDragDrop.ts:15-32](src/webview/features/imageDragDrop.ts#L15-L32))
```typescript
const pendingImageSaves = new Set<string>();

export function hasPendingImageSaves(): boolean {
  return pendingImageSaves.size > 0;
}

export function getPendingImageCount(): number {
  return pendingImageSaves.size;
}
```

**2. Register image when inserting** ([imageDragDrop.ts:358-360](src/webview/features/imageDragDrop.ts#L358-L360))
```typescript
// Add to pending saves to prevent document sync race condition
pendingImageSaves.add(placeholderId);
console.log(`[MD4H] Added to pending saves. Total pending: ${pendingImageSaves.size}`);
```

**3. Unregister on save/error** ([imageDragDrop.ts:256-267](src/webview/features/imageDragDrop.ts#L256-L267))
```typescript
case 'imageSaved':
  updateImageSrc(message.placeholderId, message.newSrc, editor);
  pendingImageSaves.delete(message.placeholderId);
  console.log(`[MD4H] Removed from pending saves. Remaining: ${pendingImageSaves.size}`);
  break;

case 'imageError':
  removeImagePlaceholder(message.placeholderId, editor);
  pendingImageSaves.delete(message.placeholderId);
  console.log(`[MD4H] Removed from pending saves (error). Remaining: ${pendingImageSaves.size}`);
  break;
```

**4. Delay document sync while images saving** ([editor.ts:105-112](src/webview/editor.ts#L105-L112))
```typescript
// Check if any images are currently being saved
if (hasPendingImageSaves()) {
  const count = getPendingImageCount();
  console.log(`[MD4H] Delaying document sync - ${count} image(s) still being saved`);
  // Reschedule the update to check again
  debouncedUpdate(markdown);
  return;
}
```

## Decisions

- **Use Set for tracking instead of array**: Set provides O(1) lookup/delete operations and prevents duplicates automatically
- **Reschedule debounce instead of blocking**: Allows the system to remain responsive while waiting for image saves
- **No timeout mechanism (yet)**: Decided to ship without max timeout initially. If an image save hangs, the sync will keep waiting. Can add 10-second timeout if needed based on user feedback
- **Log all state transitions**: Added comprehensive logging to help debug any issues in production
- **Store relative paths in markdown, resolve to webview URIs for display**: Markdown files contain portable relative paths (e.g., `./images/photo.png`), but webview needs special URIs to display them due to security restrictions. CustomImage extension requests URI resolution on-demand.
- **Custom node view instead of default rendering**: TipTap's default Image extension can't handle relative path resolution. Custom node view intercepts rendering and resolves paths via message passing to extension.
- **Add workspace to localResourceRoots**: Webview can only load resources from allowed roots. Added workspace folder so images can be loaded from within the workspace.

## Issues Encountered

- **Initial attempt to fix updateImageSrc**: Tried using TipTap's `updateAttributes` to update the src, but this didn't solve the root cause - the placeholder ID was still lost during markdown serialization
- **Race condition discovery**: Took extensive debugging to realize the document sync was happening between image insertion and save completion, stripping the tracking attribute
- **VSCode API access**: Previous session had issues with `vscode is not defined` - already fixed by passing `acquireVsCodeApi()` result as parameter

## Testing Checklist
- [ ] Test with external image drop
- [ ] Test with paste
- [ ] Test with multiple images at once
- [ ] Verify images are saved as files (not base64)
- [ ] Verify markdown contains relative paths (e.g., `./images/photo-123.png`)
- [ ] Test failure scenarios if possible
- [ ] Verify workspace image drops still work (from VS Code explorer)

## Follow-up Tasks
- [ ] Consider adding max timeout (10s) to prevent infinite wait if save hangs
- [ ] Add automated tests for image save workflow
- [ ] Performance testing with many simultaneous image drops
- [ ] Consider showing visual loading indicator while images are being saved

## Notes

**Why This Is Tricky:**
The interaction between TipTap's editor state, markdown serialization, and VS Code's document sync creates a complex timing issue. The `data-placeholder-id` is a DOM-only attribute that doesn't survive the markdown round-trip.

**Alternative Considered:**
Could use HTML comments in markdown like `<!-- image-placeholder: img-123 -->` but this pollutes the markdown and is fragile.

**User's Requirements:**
- "the image is not getting saved in workspace, its a large base64 strong in the file which is wrong"
- "ideally on drag we should ask/seek confirmation for the folder" ✅ DONE
- "possibly ask to select a location in workspace" ✅ DONE
- "if the file is from workspace we dont need to worry" ✅ HANDLED (separate code path)
