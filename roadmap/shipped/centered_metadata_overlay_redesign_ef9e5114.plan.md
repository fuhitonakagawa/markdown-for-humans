---
name: Centered Metadata Overlay Redesign
overview: Redesign image metadata display from bottom backdrop strip to full-image overlay with centered card-style metadata panel. This eliminates the "patchy" appearance and provides a cleaner, more polished image viewer experience.
todos: []
---

# Centered Metadata Overlay Redesign

## Overview

Redesign the image metadata display to use a full-image overlay with a centered card-style metadata panel instead of the current bottom backdrop strip. This eliminates the "patchy" appearance where the backdrop only covers the bottom portion of the image.

## Current Implementation

**Current Design:**

- Backdrop (`::before` pseudo-element) only covers bottom 18% of image
- Metadata footer positioned at bottom (absolute, bottom: 0)
- Creates visual break/patchy appearance
- Metadata content varies by image size (small/medium/large)

## Target Design (Option 1: Centered Card)

**New Design:**

- Full-image backdrop overlay (covers entire image)
- Centered metadata card/panel
- Card has background, border-radius, padding, shadow
- Metadata content inside card (still adaptive by image size)
- Smooth fade-in/out animation

## Visual Specification

```
┌─────────────────────────────────────┐
│                                     │
│    [Full semi-transparent backdrop] │
│                                     │
│         ┌─────────────────┐        │
│         │  800×451        │        │
│         │  · 576.0 KB     │        │
│         │                  │        │
│         │ ./images/        │        │
│         │ pop_800x451px.png│        │
│         │                  │        │
│         │ Modified: Today  │        │
│         └─────────────────┘        │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Card Specifications:**

- Background: `var(--vscode-editorWidget-background)` or semi-transparent dark
- Border: `1px solid var(--vscode-widget-border)`
- Border-radius: `8px`
- Padding: Adaptive based on image size (12px-16px)
- Box-shadow: `0 4px 16px rgba(0, 0, 0, 0.4)`
- Max-width: 300px (prevents card from being too wide on large images)
- Centered: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)`

**Backdrop Specifications:**

- Full image coverage: `top: 0; left: 0; right: 0; bottom: 0`
- Background: `rgba(0, 0, 0, 0.6)` (adjustable opacity)
- Smooth fade transition: `opacity 0.2s ease-in-out`

## Implementation Details

### 1. Update CSS Backdrop

**File:** `src/webview/editor.css`

**Current (lines 2122-2140):**

```css
.image-wrapper::before {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0;  /* Only bottom portion */
  background: rgba(0, 0, 0, 0.7);
}

.image-wrapper.image-hover-active::before {
  height: 30%;  /* Only 30% height */
}
```

**New:**

```css
.image-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;  /* Full image coverage */
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  pointer-events: none;
  z-index: 10;
  border-radius: inherit;  /* Match image border-radius if any */
}

.image-wrapper.image-hover-active::before {
  opacity: 1;  /* Full overlay visible */
}
```

### 2. Update Metadata Footer Positioning

**File:** `src/webview/editor.css`

**Current (lines 2142-2164):**

```css
.image-metadata-footer {
  position: absolute;
  bottom: 0;  /* Bottom aligned */
  left: 0;
  right: 0;
  /* ... */
}
```

**New:**

```css
.image-metadata-footer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);  /* Centered */
  max-width: 300px;
  width: auto;
  background: var(--vscode-editorWidget-background);
  border: 1px solid var(--vscode-widget-border);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 11;
  display: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
}

.image-wrapper.image-hover-active .image-metadata-footer {
  display: block;
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);  /* Smooth scale-in */
}
```

### 3. Update Adaptive Sizing for Card

**File:** `src/webview/editor.css`

Adjust padding and font sizes for card layout:

```css
/* Small images - compact card */
.image-metadata-footer[data-image-size="small"] {
  font-size: 10px;
  padding: 8px 12px;
  max-width: 200px;
}

/* Medium images - standard card */
.image-metadata-footer[data-image-size="medium"] {
  font-size: clamp(11px, 1.2vw, 12px);
  padding: 10px 14px;
  max-width: 280px;
}

/* Large images - full card */
.image-metadata-footer[data-image-size="large"] {
  font-size: clamp(12px, 1.3vw, 13px);
  padding: 12px 16px;
  max-width: 300px;
}
```

### 4. Update Metadata Content (Remove Filename)

**File:** `src/webview/features/imageMetadata.ts`

The content structure is already updated (filename removed), but ensure it works well in centered card:

- Small: Just path (compact)
- Medium: Dimensions + size on line 1, path + date on line 2
- Large: Dimensions + size, path, date (3 lines)

### 5. Handle Very Small Images

**File:** `src/webview/features/imageMetadata.ts` or CSS

For very small images (< 150px), consider:

- Hiding metadata completely, OR
- Showing minimal card with just path

**CSS approach:**

```css
/* Hide metadata for very small images */
.image-wrapper:has(img[width][width < 150]) .image-metadata-footer {
  display: none !important;
}
```

**Note:** CSS `:has()` with attribute selectors may not work. Alternative: Use JavaScript to add data attribute and use CSS attribute selector.

## Edge Cases

1. **Very small images**: Card might be larger than image - hide metadata or show minimal version
2. **Very large images**: Card max-width prevents it from being too wide
3. **Long paths**: Text truncation with ellipsis (already implemented)
4. **Image loading**: Metadata should only show when image is loaded (already handled)
5. **External images**: No metadata shown (already handled)

## Animation Details

**Backdrop:**

- Fade in: `opacity: 0 → 1` over 0.2s
- Fade out: `opacity: 1 → 0` over 0.2s

**Card:**

- Fade in: `opacity: 0 → 1` over 0.2s
- Scale in: `transform: translate(-50%, -50%) scale(0.95) → scale(1)` over 0.2s
- Smooth easing: `cubic-bezier(0.4, 0, 0.2, 1)`

## Files to Modify

1. **`src/webview/editor.css`**

   - Update `.image-wrapper::before` to full-image backdrop
   - Update `.image-metadata-footer` positioning to centered
   - Add card styling (background, border, border-radius, shadow)
   - Update adaptive sizing for card layout
   - Add scale animation

2. **`src/webview/features/imageMetadata.ts`** (optional)

   - Verify content structure works well in centered card
   - Consider adding logic to hide metadata for very small images

## Testing Strategy

1. **Visual testing:**

   - Hover small image (< 200px) → verify centered card appears
   - Hover medium image (200-600px) → verify card size and content
   - Hover large image (> 600px) → verify card doesn't exceed max-width
   - Verify backdrop covers full image (not patchy)
   - Verify card is centered both horizontally and vertically

2. **Animation testing:**

   - Verify smooth fade-in/out of backdrop
   - Verify smooth scale-in of card
   - Test hover on/off multiple times

3. **Edge cases:**

   - Very small images (< 150px) → verify handling
   - Very large images → verify card max-width
   - Long file paths → verify truncation
   - External images → verify no metadata shown

## Success Criteria

- Full-image backdrop overlay (no patchy appearance)
- Metadata card centered on image
- Card has proper styling (background, border, shadow)
- Adaptive sizing still works (small/medium/large)
- Smooth animations (fade + scale)
- No visual glitches or layout issues
- Works on all image sizes

## Alternative Considerations

If centered card feels too intrusive, we can:

- Adjust card opacity (more transparent)
- Adjust backdrop opacity (lighter overlay)
- Add option to position card in corner instead (Option 2)
- Make card smaller for small images