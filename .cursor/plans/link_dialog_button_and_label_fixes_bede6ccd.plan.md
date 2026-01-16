---
name: Link Dialog Button and Label Fixes
overview: "Two UI fixes: align Cancel/OK buttons to the right, and make the URL label dynamic based on selected mode (URL/File/Headings)"
todos:
  - id: align-buttons-right
    content: Change button container to use flex-end instead of space-between to align Cancel/OK to the right
    status: completed
  - id: add-url-label-id
    content: Add ID to URL label element so it can be updated dynamically
    status: completed
  - id: update-label-in-mode
    content: Update updateMode() function to change label text based on selected mode (URL/File/Headings)
    status: completed
    dependencies:
      - add-url-label-id
  - id: update-label-on-show
    content: Update showLinkDialog() to set correct label when dialog opens
    status: completed
    dependencies:
      - add-url-label-id
---

# Link Dialog Button and Label Fixes

## Overview

Two UI improvements:

1. Align Cancel and OK buttons to the right (remove space-between, use flex-end)
2. Make URL label dynamic based on selected mode (URL/File/Headings)

## Changes Required

### 1. Align Buttons to Right

**File:** `src/webview/features/linkDialog.ts`

- Change button container from `justify-content: space-between` to `justify-content: flex-end`
- This will move Cancel and OK buttons to the right side
- Remove Link button can stay on the left or be removed from the flex container

**Current structure:**

```html
<div style="display: flex; gap: 12px; justify-content: space-between;">
  <button id="link-remove-btn">Remove Link</button>
  <div style="display: flex; gap: 12px;">
    <button id="link-cancel-btn">Cancel</button>
    <button id="link-ok-btn">OK</button>
  </div>
</div>
```

**New structure:**

```html
<div style="display: flex; gap: 12px; justify-content: flex-end; align-items: center;">
  <button id="link-remove-btn" style="margin-right: auto;">Remove Link</button>
  <button id="link-cancel-btn">Cancel</button>
  <button id="link-ok-btn">OK</button>
</div>
```

### 2. Dynamic URL Label

**File:** `src/webview/features/linkDialog.ts`

- Add an ID to the URL label element: `id="link-url-label"`
- Update `updateMode()` function to change the label text based on mode:
  - URL mode: "URL"
  - File mode: "File Path" or "File"
  - Headings mode: "Heading" or "Select Heading"
- Update the label text when mode changes

**Implementation:**

- In `updateMode()` function, get the label element and update its textContent
- Also update when dialog is shown (in `showLinkDialog()`)

## Files to Modify

1. `src/webview/features/linkDialog.ts` - Button alignment and dynamic label

## Testing Checklist

- [ ] Cancel and OK buttons appear on the right side
- [ ] Remove Link button (if visible) stays on the left
- [ ] URL label shows "URL" in URL mode
- [ ] URL label shows "File" or "File Path" in File mode
- [ ] URL label shows "Heading" or "Select Heading" in Headings mode
- [ ] Label updates correctly when switching between modes