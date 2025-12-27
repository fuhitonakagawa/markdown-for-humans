# Task: WikiLinks Support

## 1. Task Metadata

- **Task name:** WikiLinks Support
- **Slug:** wikilinks
- **Status:** planned
- **Created:** 2025-11-29
- **Last updated:** 2025-11-29
- **Shipped:** _(pending)_

---

## 2. Context & Problem

**Current state:**
- Only standard markdown links supported: `[text](url)`
- No support for wiki-style links: `[[filename]]`
- Users from Obsidian, Roam, Notion workflows can't use familiar syntax
- Internal document linking requires full relative paths

**Pain points:**
- **Workflow friction:** Users from Obsidian/Roam/Foam must change linking habits
- **Verbosity:** Standard links verbose for internal references: `[My Doc](./docs/my-doc.md)` vs `[[my-doc]]`
- **Refactoring difficulty:** Renaming files breaks standard markdown links
- **No autocomplete:** Can't discover other documents while linking
- **User need:** Wikilinks provide easier document linking and refactoring compared to standard markdown links

**Why it matters:**
- **Popular workflow:** WikiLinks standard in personal knowledge management (PKM) tools
- **User migration:** Attract users from Obsidian, Roam, Foam, Logseq
- **Faster linking:** `[[filename]]` quicker than `[text](path)`
- **Better discoverability:** Autocomplete shows available documents
- **Future-proof:** Enables backlinks, graph view features later

---

## 3. Desired Outcome & Scope

**Success criteria:**
- Typing `[[` opens autocomplete menu showing markdown files in workspace
- Select file from menu → inserts `[[filename]]`
- WikiLinks render as clickable links in WYSIWYG mode
- Click WikiLink → opens referenced file
- Supports aliases: `[[filename|display text]]`
- Supports header links: `[[filename#section]]`
- Autocomplete filters as user types
- Works with relative paths and workspace-wide search
- Renders gracefully when file not found (broken link indicator)

**In scope:**
- **WikiLink syntax:**
  - Basic: `[[filename]]` (without .md extension)
  - With extension: `[[filename.md]]` (also valid)
  - Alias: `[[filename|Display Text]]`
  - Header: `[[filename#Header Name]]`
  - Combined: `[[filename#header|Display]]`
- **Autocomplete:**
  - Triggered by `[[`
  - Shows all `.md` files in workspace
  - Filter-as-you-type
  - Keyboard navigation (arrows, Enter, Esc)
  - Shows file path for disambiguation
- **Rendering:**
  - WikiLinks display as underlined links
  - Hover shows file path/preview
  - Click opens file in VS Code
  - Broken links show warning (red/dashed underline)
- **File resolution:**
  - Search current directory first
  - Then search entire workspace
  - Case-insensitive matching
  - Handles spaces in filenames
- **Integration:**
  - Works in WYSIWYG mode
  - Works in source mode (syntax highlighting)
  - Command: "Insert WikiLink" (`Ctrl+[` or similar)

**Out of scope:**
- Backlinks panel (which files link here) - future feature
- Graph view visualization - future feature
- Automatic link updating on file rename - future feature
- WikiLinks to non-markdown files - markdown only
- WikiLinks in frontmatter - focus on body content
- Transclusion (`![[filename]]`) - future feature
- Block references (`[[file#^block]]`) - future feature

---

## 4. UX & Behavior

**Entry points:**
- **Primary:** Type `[[` in editor → autocomplete appears
- **Command:** "Insert WikiLink" command → opens file picker
- **Paste:** Detect filename in clipboard, suggest converting to wikilink

**User flows:**

### Flow 1: Creating basic wikilink
1. User typing document, wants to reference "getting-started.md"
2. User types `[[`
3. Autocomplete menu appears showing workspace markdown files:
   ```
   🔍 [[

   📄 getting-started            docs/getting-started.md
   📄 api-reference              docs/api/api-reference.md
   📄 installation               installation.md
   📄 troubleshooting            guides/troubleshooting.md
   ```
4. User types `gett` → filters to "getting-started"
5. User presses Enter → inserts `[[getting-started]]`
6. Link renders as clickable: <u>getting-started</u>
7. User clicks link → opens getting-started.md in VS Code

### Flow 2: Wikilink with alias
1. User wants link to display different text than filename
2. User types `[[getting-started|Quick Start Guide]]`
3. Link renders as: <u>Quick Start Guide</u>
4. Clicking opens getting-started.md (filename, not alias)

### Flow 3: Wikilink to header section
1. User wants to link to specific section in another file
2. User types `[[api-reference#`
3. After typing `#`, autocomplete shows headers from that file:
   ```
   Headers in api-reference.md:

   📌 Authentication
   📌 Endpoints
   📍   GET /users
   📍   POST /users
   📌 Error Handling
   ```
4. User selects "Authentication"
5. Inserts: `[[api-reference#Authentication]]`
6. Clicking opens api-reference.md and scrolls to "Authentication" header

### Flow 4: Combined header and alias
1. User types: `[[api-reference#Authentication|How to Authenticate]]`
2. Link displays: <u>How to Authenticate</u>
3. Clicking opens api-reference.md at "Authentication" section

### Flow 5: Broken link handling
1. User creates link: `[[non-existent-file]]`
2. Link renders with warning style (red/dashed underline)
3. Hover shows tooltip: "File not found: non-existent-file.md"
4. Clicking shows error: "Cannot open file. Would you like to create it?"
5. User clicks "Create" → new file created with that name

### Flow 6: Autocomplete workflow
1. User types `[[inst`
2. Autocomplete filters to:
   ```
   📄 installation               installation.md
   📄 instructions               guides/instructions.md
   ```
3. User presses Down arrow → highlights "instructions"
4. User presses Enter → inserts `[[instructions]]`
5. Autocomplete closes automatically

### Flow 7: File with spaces in name
1. User has file: "My Important Document.md"
2. User types `[[My Imp`
3. Autocomplete shows: `📄 My Important Document`
4. User selects → inserts: `[[My Important Document]]`
5. Link works correctly (handles spaces)

### Flow 8: Disambiguating duplicate filenames
1. Workspace has:
   - `docs/api-reference.md`
   - `guides/api-reference.md`
2. User types `[[api-reference]]`
3. Autocomplete shows both with paths:
   ```
   📄 api-reference              docs/api-reference.md
   📄 api-reference              guides/api-reference.md
   ```
4. User selects first one
5. Link resolves to `docs/api-reference.md` (inserts path if needed)

**Behavior rules:**
- **Autocomplete trigger:** `[[` opens menu, `]]` closes it
- **Filter matching:** Case-insensitive, prefix or substring
- **File resolution order:**
  1. Exact match in current directory
  2. Exact match in workspace (closest path first)
  3. Case-insensitive match
  4. Fuzzy match (if no exact match)
- **Rendering:**
  - Underline style (like standard links)
  - Different color for broken links (red/orange)
  - Hover shows full path and preview (first few lines)
- **Click behavior:**
  - Opens file in new editor tab
  - If header specified, scrolls to header
  - If file not found, prompt to create
- **Keyboard shortcuts:**
  - `Ctrl+Click` opens in split editor
  - `Alt+Click` opens in new window
- **Markdown compatibility:**
  - Source view shows literal `[[filename]]`
  - Export/preview may convert to standard links
  - Other markdown parsers see as plain text (graceful degradation)

**Visual design:**
- **WikiLink appearance:**
  - Color: Link color (matches standard links)
  - Decoration: Underline
  - Hover: Brighter color, tooltip with preview
  - Broken: Red/orange color, dashed underline

- **Autocomplete menu:**
  - Width: 400px
  - Max height: 300px (scrollable)
  - File icon (📄) + filename
  - File path (muted, smaller text)
  - Highlight: Background color for selected item
  - Keyboard indicator: Arrow keys, Enter, Esc instructions

- **Hover preview:**
  - Shows full file path
  - First 3-5 lines of file content
  - If header link, shows header + content below it
  - Preview limited to 200px height

**Edge cases:**
- **Empty wikilink:** `[[]]` renders as plain text, no link
- **Unclosed wikilink:** `[[filename` (missing `]]`) renders as plain text
- **Special characters:** Handle filenames with `-`, `_`, spaces, numbers
- **URL-like text:** `[[https://example.com]]` treated as wikilink (weird but allowed)
- **Nested brackets:** `[[ [[nested]] ]]` - parse as literal text (invalid)
- **Very long filenames:** Truncate in autocomplete, show full name in tooltip
- **No .md files in workspace:** Autocomplete shows "No markdown files found"

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

- Backlinks panel (show files that link to current file)
- Graph view (visualize connections between documents)
- Auto-update links on file rename
- Transclusion: `![[filename]]` embeds content
- Block references: `[[file#^blockid]]`
- Alias autocomplete (suggest existing aliases)
- WikiLinks to images, PDFs, other file types
- Export handling (convert wikilinks to standard links)
- Link validation (warn about broken links)
- Smart paste (auto-convert file paths to wikilinks)
