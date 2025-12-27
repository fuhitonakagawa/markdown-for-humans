# Task: Polish Image Cursor Styling

## 1. Task Metadata

- **Task name:** Polish Image Cursor Styling
- **Slug:** polish-image-cursor-styling
- **Status:** shipped
- **Created:** 2025-12-13
- **Last updated:** 2025-12-13
- **Shipped:** 2025-12-13

---

## 2. Context & Problem

**Problem:** Image cursor movement feedback is visually cluttered and inconsistent:
- When cursor is on left/right of image, redundant borders appear (outline + border + base border in box-shadow)
- Hover state conflicts with cursor-based states, creating visual noise
- Glow effects aren't optimized for all themes (light/dark/high-contrast)

**Current state:** Images show outline, directional border, and full base border simultaneously when cursor is positioned beside them, making the feedback unclear and distracting.

**Why it matters:** Clear, subtle visual feedback is essential for the reading/writing experience. Apple-like polish means users understand cursor position without visual clutter.

---

## 3. Desired Outcome & Scope

**Success criteria:**
- Cursor left of image: Only left border (2px) + left glow visible (no outline, no other borders)
- Cursor right of image: Only right border (2px) + right glow visible (no outline, no other borders)
- Hover state: Subtle full border glow appears only when no cursor state is active
- Selected image: Full border glow (unchanged behavior)
- Theme-aware: Glows are visible and subtle in light, dark, and high-contrast themes
- Smooth transitions: 0.15s ease transitions between all states

**Out of scope:**
- Changing selected image behavior (already polished)
- Changing pending deletion state (red warning is intentional)
- Adding new cursor states beyond left/right/selected

---

## 4. UX & Behavior

**Entry points:** None (automatic visual feedback based on cursor position)

**Flow:**
1. User moves cursor with arrow keys or mouse near an image
2. System detects cursor position (left, right, or on image)
3. Visual feedback appears:
   - Left: Only left border + left glow
   - Right: Only right border + right glow
   - On image: Full border glow (selected state)
   - Hover (no cursor state): Subtle full border glow
4. Transitions smoothly between states as cursor moves

### Current Functionality (Source of Truth)

**Current behavior (user-facing):** Images show visual feedback when cursor is positioned beside them via decoration system (`image-caret-before`, `image-caret-after`, `image-caret-selected` classes). Hover state shows full border glow.

**Current implementation (technical):** Decoration system in `imageEnterSpacing.ts` adds wrapper classes based on cursor position. CSS in `editor.css` applies styles with redundant borders (outline + border + base border in box-shadow).

**Key files:** `src/webview/extensions/imageEnterSpacing.ts`, `src/webview/editor.css`

**Pattern to follow:** CSS refinement following existing decoration-based state system.

---

## 5. Technical Plan

**Surfaces:** Webview (CSS styling only)

**Key changes:**
- `src/webview/editor.css` – Refine one-sided cursor states (remove redundant outline/base border), make hover conditional, optimize theme glows

**Architecture notes:**
- No changes to decoration system logic (already working correctly)
- Pure CSS refinement to remove visual redundancy
- Uses `:not()` selectors to prevent hover from conflicting with cursor states

**Performance:** No performance impact (CSS-only changes, transitions already optimized)

---

## 6. Work Breakdown

| Status | Task | Notes |
|--------|------|-------|
| `done` | **Refine one-sided cursor CSS** | Remove outline and base border, keep only directional border and glow |
| `done` | **Enhance hover state** | Make hover conditional (only when no cursor state) |
| `done` | **Optimize theme support** | Refine glow colors/opacity for light/dark/high-contrast themes |
| `done` | **Verify visual feedback** | Manual testing of all cursor positions and theme variations |

### How to Verify

**Refine one-sided cursor CSS:**
1. Open markdown file with images
2. Position cursor left of image (arrow keys or click)
3. Verify: Only left border (2px) and left glow visible, no outline or other borders
4. Position cursor right of image
5. Verify: Only right border (2px) and right glow visible, no outline or other borders

**Enhance hover state:**
1. Hover over image when cursor is NOT beside it
2. Verify: Subtle full border glow appears
3. Position cursor beside image, then hover
4. Verify: Cursor state takes priority, hover doesn't conflict

**Optimize theme support:**
1. Switch to light theme
2. Verify: Glows are visible but subtle
3. Switch to dark theme
4. Verify: Glows are bright enough to see clearly
5. Switch to high-contrast theme
6. Verify: Glows maintain visibility

**Visual feedback:**
1. Test all cursor positions (left, right, on image)
2. Test hover in all states
3. Test transitions between states (should be smooth)
4. Read a 3000+ word doc with images for 10+ minutes in both themes

---

## 7. Implementation Log

### 2025-12-13 – Polish Image Cursor Styling

- **What:** Refined CSS for image cursor movement and focus styling to be more polished and Apple-like
- **Files:** `src/webview/editor.css` (lines 723-733, 811-817, 862-888, 989-1007)

**Changes made:**

1. **Refined one-sided cursor states** (lines 862-888):
   - Removed `outline` and `outline-offset` from `.image-caret-before` and `.image-caret-after`
   - Removed base border from `box-shadow` (the `0 0 0 2px var(--md-focus)` part)
   - Changed border width from 3px to 2px for more subtle Apple-like appearance
   - Explicitly set other borders to `none` for clarity
   - Reduced glow blur radius slightly (10px/5px instead of 12px/6px) for cleaner look
   - Reduced glow opacity slightly (0.6/0.4 instead of 0.7/0.5) for subtlety

2. **Enhanced hover state** (lines 723-733, 811-817):
   - Made hover conditional using `:not()` selectors
   - Hover only applies when wrapper doesn't have cursor state classes
   - Prevents visual conflicts between hover and cursor-based states
   - Added `outline` to transition for smooth state changes

3. **Optimized theme support** (lines 989-1007):
   - Refined dark theme glow values (0.8/0.5 opacity instead of 0.9/0.6)
   - Reduced blur radius for dark theme (10px/5px instead of 12px/6px)
   - Explicitly set borders to `none` for clarity in dark theme overrides

**Decisions:**
- Used 2px borders instead of 3px for more subtle Apple-like appearance
- Kept glow effects but made them softer and more refined
- Used `:not()` selectors for hover to prevent conflicts (cleaner than increasing specificity)
- Maintained existing transition timing (0.15s ease) for consistency

**Issues:** None

**Follow-up:** None - styling is complete and polished
