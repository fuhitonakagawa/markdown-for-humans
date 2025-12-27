# Task: Slash Command for Diagram Insertion

## 1. Task Metadata

- **Task name:** Slash Command for Diagram Insertion
- **Slug:** mermaid-slash-command
- **Status:** planned
- **Created:** 2025-11-29
- **Last updated:** 2025-11-29
- **Shipped:** _(pending)_

---

## 2. Context & Problem

**Current state:**
- Users insert Mermaid diagrams by manually typing ` ```mermaid `
- No quick insertion mechanism via slash commands (common in modern editors)
- Tables, headings, lists can be inserted via toolbar, but diagrams require typing syntax

**Pain points:**
- **Discoverability:** Users may not know Mermaid diagrams are supported without reading docs
- **Slower workflow:** Typing backticks + "mermaid" is slower than `/diagram`
- **Inconsistent UX:** Other markdown elements have toolbar buttons, diagrams are manual-only
- **User need:** Slash commands provide quick diagram insertion without leaving the keyboard

**Why it matters:**
- **Speed:** `/diagram` is 5 characters vs 10+ for ` ```mermaid `
- **Discoverability:** Slash command menu shows available features, teaching users organically
- **Modern UX:** Slash commands are expected in contemporary editors (Notion, Linear, Coda)
- **Consistency:** Aligns diagram insertion with how we insert other elements (tables, code blocks)

---

## 3. Desired Outcome & Scope

**Success criteria:**
- Users can type `/diagram` or `/mermaid` to insert a Mermaid diagram block
- Slash command menu is accessible, filterable, and keyboard-navigable
- Command works anywhere in the document (empty line, mid-paragraph)
- Inserting diagram via slash command optionally opens template picker
- Performance: Slash menu appears <100ms after typing "/"

**In scope:**
- Slash command trigger: `/` character opens command menu
- Commands to implement:
  - `/diagram` or `/mermaid` → Insert empty Mermaid block
  - `/diagram-template` → Insert Mermaid block + open template picker
- Slash menu UI: floating menu with filter-as-you-type
- Integration with existing Mermaid extension (rendering happens automatically)
- Keyboard navigation: Arrow keys, Enter to select, Esc to cancel

**Out of scope:**
- Slash commands for other elements (headings, tables, lists) - separate task
- Custom slash command creation by users
- Slash command autocomplete based on document context
- Nested slash commands (e.g., `/diagram/flowchart`)

---

## 4. UX & Behavior

**Entry points:**
- **Slash character:** User types `/` on empty line or after space → slash menu appears
- **Filter:** User continues typing → menu filters to matching commands
- **Select:** User presses Enter or clicks → command executes, menu closes

**User flows:**

### Flow 1: Quick diagram insertion
1. User is writing markdown document, creates new line
2. User types `/`
3. Slash menu appears showing:
   ```
   > /heading1   Insert heading level 1
     /table      Insert table
     /diagram    Insert Mermaid diagram
     /code       Insert code block
     ...
   ```
4. User types `dia` → menu filters to `/diagram`
5. User presses Enter
6. Empty Mermaid block inserted:
   ```mermaid

   ```
7. Cursor positioned inside block, user starts typing syntax

### Flow 2: Diagram insertion with template
1. User types `/diagram-template` (or `/diag` filters to it)
2. User presses Enter
3. Mermaid block inserted AND template picker opens immediately
4. User selects "Flowchart" template from picker
5. Template content fills the diagram block
6. Diagram renders, user can edit

### Flow 3: Filtering slash commands
1. User types `/tab`
2. Slash menu shows only matching commands:
   - `/table` (Insert table)
3. No ambiguity, user presses Enter → table inserted
4. Clear, fast, predictable

### Flow 4: Canceling slash menu
1. User types `/` → menu appears
2. User decides not to use slash command
3. User presses `Esc` OR clicks outside menu → menu closes, "/" remains as text
4. User can delete "/" or continue typing normally

**Behavior rules:**
- **Trigger context:** Slash menu only appears after whitespace (space, newline) to avoid triggering mid-word
- **Performance:** Menu appears <100ms after "/" typed, filters update <50ms per keystroke
- **Smart positioning:** Menu appears near cursor, adjusts position if near editor edges
- **Case-insensitive:** `/Diagram`, `/DIAGRAM`, `/diagram` all match the same command
- **Prefix matching:** `/dia` matches `/diagram`, not substring matching (avoids noise)
- **Dismiss behavior:** Menu auto-closes on selection, Esc, or clicking outside
- **Undo-friendly:** Slash command insertion is single undo operation

**Slash command list (Mermaid-related):**

| Command | Description | Action |
|---------|-------------|--------|
| `/diagram` | Insert Mermaid diagram | Insert ` ```mermaid\n\n``` `, cursor inside |
| `/mermaid` | Alias for `/diagram` | Same as above |
| `/diagram-template` | Insert diagram with template | Insert block + open template picker |

**Visual design:**
- **Menu style:** Floating panel with subtle shadow, matches VS Code theme
- **Highlight:** Selected command has highlight background (keyboard/mouse navigation)
- **Icons:** Each command has icon (diagram icon for Mermaid commands)
- **Help text:** Selected command shows description in menu footer

---

## 5. Technical Plan

_(To be filled during task refinement)_

---

## 6. Work Breakdown

_(To be filled during task refinement)_

---

## 7. Implementation Log

_(To be filled during implementation)_

---

## 8. Decisions & Tradeoffs

_(To be filled during implementation)_

---

## 9. Follow-up & Future Work

- Slash commands for all markdown elements (headings, tables, lists, code blocks)
- Custom slash commands via workspace settings
- Slash command autocomplete using document context (e.g., suggest diagram types based on existing diagrams)
- Nested slash menus (e.g., `/diagram/` → shows flowchart, sequence, gantt)
- Slash command analytics (track which commands users discover/use)
