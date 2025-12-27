# Task: Mermaid Template Gallery UI

## 1. Task Metadata

- **Task name:** Mermaid Template Gallery UI
- **Slug:** mermaid-template-gallery
- **Status:** planned
- **Created:** 2025-11-29
- **Last updated:** 2025-11-29
- **Shipped:** *(pending)*

---

## 2. Context & Problem

**Current state:**

- Mermaid templates accessible via text-based quick-pick menu (task-mermaid-templates.md)
- No visual preview of what templates look like before insertion
- Users must insert template, see render, then decide if it's what they wanted (undo if not)

**Pain points:**

- **Uncertainty:** Text description "Flowchart (Decision Tree)" doesn't show the actual diagram structure
- **Trial and error:** Users insert template → render → "not what I wanted" → undo → try another
- **Slow discovery:** Can't browse templates visually to get inspiration for diagram types
- **UX pattern:** Template systems with visual previews are a common pattern in modern editors

**Why it matters:**

- **Confidence:** Seeing rendered preview before insertion reduces uncertainty and trial-and-error
- **Learning:** Visual gallery teaches diagram types better than text descriptions
- **Delight factor:** Polished template gallery feels premium, reinforces "better than paid tools" positioning
- **Efficiency:** Users find the right template faster with visual browsing

---

## 3. Desired Outcome & Scope

**Success criteria:**

- Users can browse Mermaid templates in a visual gallery with rendered previews
- Gallery shows template name, description, and thumbnail render of the diagram
- Clicking template inserts it into the document at cursor position
- Gallery is responsive, keyboard-navigable, and works in light/dark themes
- Performance: Gallery loads &lt;500ms, template previews render &lt;300ms each

**In scope:**

- Visual template gallery UI with grid layout
- Template cards showing:
  - Template name (e.g., "Flowchart - Decision Tree")
  - Brief description (1-2 sentences)
  - Thumbnail preview (rendered SVG, \~200x150px)
  - "Use Template" button
- Gallery modal/sidebar accessible via command palette, toolbar, or slash command
- Keyboard navigation: Arrow keys to browse, Enter to insert, Esc to close
- Search/filter box to narrow templates by name or type

**Out of scope:**

- User-created custom templates (v2 feature)
- Template editing within gallery (gallery is for browsing/inserting only)
- Community template marketplace or sharing
- Template favorites/recents tracking
- Multi-template insertion (inserting multiple templates at once)

---

## 4. UX & Behavior

**Entry points:**

- **Toolbar button:** "Templates" button → opens gallery (instead of quick-pick menu)

**User flows:**

### Flow 1: Browsing and inserting template

1. Template gallery modal appears, centered on screen
2. Gallery shows grid of template cards (2-3 columns depending on width):

   ```plaintext
   ┌─────────────────────────────────────────────────────┐
   │  🔍 Search templates...                    [Close X]│
   ├─────────────────────────────────────────────────────┤
   │                                                     │
   │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
   │  │ Flowchart  │  │ Sequence   │  │ Class      │   │
   │  │ Decision   │  │ API Call   │  │ UML Model  │   │
   │  │ Tree       │  │            │  │            │   │
   │  │ [Preview]  │  │ [Preview]  │  │ [Preview]  │   │
   │  │            │  │            │  │            │   │
   │  │ [Insert]   │  │ [Insert]   │  │ [Insert]   │   │
   │  └────────────┘  └────────────┘  └────────────┘   │
   │                                                     │
   │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
   │  │ State      │  │ Gantt      │  │ Pie Chart  │   │
   │  │ Diagram    │  │ Project    │  │ Data Viz   │   │
   │  │ Workflow   │  │ Timeline   │  │            │   │
   │  │ [Preview]  │  │ [Preview]  │  │ [Preview]  │   │
   │  │            │  │            │  │            │   │
   │  │ [Insert]   │  │ [Insert]   │  │ [Insert]   │   │
   │  └────────────┘  └────────────┘  └────────────┘   │
   │                                                     │
   └─────────────────────────────────────────────────────┘
   ```
3. User hovers over "Flowchart" card → card highlights, preview enlarges slightly
4. User clicks "Insert" button
5. Gallery closes, template inserted at cursor position
6. Diagram renders in document

### Flow 2: Searching templates

1. User opens template gallery
2. Gallery shows all 8-10 templates in grid
3. User types "sequence" in search box
4. Gallery filters to show only "Sequence Diagram" template cards
5. User selects filtered template → inserts

### Flow 3: Keyboard navigation

1. User opens gallery via `Ctrl+Shift+G`
2. Gallery appears with first template card focused (highlighted border)
3. User presses → arrow key → focus moves to next template
4. User presses ↓ arrow key → focus moves to template below
5. User presses Enter → focused template inserts into document
6. Gallery closes automatically

### Flow 4: Preview interaction

1. User opens gallery, hovers over template card
2. Clicking preview area enlarges it in a modal overlay:
   - Full-size rendered diagram
   - Template code shown below preview
   - "Use Template" and "Close" buttons
3. User can inspect before deciding to insert
4. User clicks "Use Template" → inserts and closes both modals

**Behavior rules:**

- **Performance budget:** Gallery loads &lt;500ms, template thumbnails render progressively
- **Lazy rendering:** Only render visible template previews (virtual scrolling if &gt;20 templates)
- **Theme sync:** Template previews render in current VS Code theme (dark/light)
- **Responsive:** Gallery adapts to editor width (2 columns on narrow, 3 on wide)
- **Accessibility:**
  - All templates keyboard-navigable with focus indicators
  - Screen reader announces template name and description on focus
  - ARIA labels for all buttons
- **Error handling:** If template preview fails to render, show placeholder icon + "Preview unavailable"
- **Undo-friendly:** Inserting template is single undo operation, closing gallery without insert doesn't affect document

**Template card design:**

- **Card size:** \~250px width × 300px height
- **Layout:**
  - Header: Template name (bold, 16px)
  - Subtitle: Category (e.g., "Flowchart · 5 nodes")
  - Preview: Rendered SVG thumbnail (200x150px, centered)
  - Footer: Description (2 lines, truncated) + "Insert" button
- **Hover state:** Card elevation increases (subtle shadow), "Insert" button highlights
- **Focus state:** Thick border for keyboard navigation visibility

---

## 5. Technical Plan

*(To be filled during task refinement)*

---

## 6. Work Breakdown

*(To be filled during task refinement)*

---

## 7. Implementation Log

*(To be filled during implementation)*

---

## 8. Decisions & Tradeoffs

*(To be filled during implementation)*

---

## 9. Follow-up & Future Work

- User-created custom templates saved to workspace
- Template tagging/categorization (e.g., "Business", "Technical", "Educational")
- Template favorites and recently-used section
- Community template marketplace with rating/comments
- Template editing mode (modify template in gallery, save changes)
- Export/import template collections
- Template analytics (track most-used templates, improve defaults)