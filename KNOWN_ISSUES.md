# Known Issues

This document tracks known issues, limitations, and workarounds for Markdown for Humans. If you encounter an issue not listed here, please [report it](https://github.com/concretios/markdown-for-humans/issues).

> **Note:** This document is for both users (known issues and workarounds) and developers (tracking status). For technical troubleshooting during development, see [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

---

## 🔴 High Priority Issues

_None currently. All critical issues have been resolved._

---

## 🟡 Medium Priority Issues

### Enter Key at Gap Cursor Before Image
**Type:** Bug  
**Description:** When navigating with arrow keys on a selected image, pressing ArrowLeft moves the cursor to the left of the image (with left highlight visible). However, pressing Enter at this position creates a new paragraph to the right of the image instead of to the left.  
**Status:** Under investigation  
**Plan:** [Fix Enter Key at Gap Cursor Before Image](roadmap/shipped/fix_enter_key_at_gap_cursor_before_image_6b029688.plan.md)  
**Workaround:** Use source view to manually add blank lines, or position cursor after the image and press Enter.

### Enter Key in Table Cells
**Type:** Bug  
**Description:** Pressing Enter in table cells creates new paragraphs within the cell, which breaks markdown table formatting when serialized. Markdown tables require single-line cells or `<br>` tags for line breaks, not multiple paragraphs.  
**Status:** Under consideration  
**Current Behavior:** TipTap's TableKit extension allows Enter key to create paragraphs in table cells by default.  
**Workaround:** Use source view to edit table cells, or use Shift+Enter for line breaks within cells (if supported). Avoid pressing Enter in table cells to prevent formatting issues.  
**Future Consideration:** Enter key in table cells should be disabled or converted to `<br>` tags to preserve markdown table structure.

### Workspace File Drag-Drop in Cursor IDE
**Type:** Bug  
**Description:** Dragging image files from the workspace file explorer into the markdown editor does not work in Cursor IDE. The drag-drop functionality works correctly in VS Code and Windsurf, but in Cursor, workspace file drops are not detected or processed.  
**Status:** Under investigation  
**Related Fix:** A previous fix ([Fix Cursor IDE drag-drop opening files in tabs](roadmap/shipped/fix_cursor_ide_drag-drop_opening_files_in_tabs_70263667.plan.md)) prevented files from opening in tabs, but workspace file drag-drop detection still fails in Cursor.  
**Current Behavior:** Workspace file drag-drop is not detected in Cursor IDE, so images are not inserted into the editor. External file drag-drop (from Finder/desktop) may work, but workspace file explorer drag-drop does not.  
**Workaround:** Use the image insert dialog (click the image button in the toolbar) or use source view to manually add image references. Alternatively, use external file drag-drop from Finder/desktop if the file is accessible outside the workspace.  
**Future Consideration:** Cursor IDE may handle drag-drop events differently than VS Code/Windsurf, requiring additional event handling or data transfer format detection for workspace files.

---

## 🟢 Low Priority / Minor Issues

### Code Block Language Indicator and Picker
**Type:** Feature Gap  
**Description:** Code blocks don't display their language indicator, and there's no easy way to see or change the language of an existing code block. Users must use source view to manually edit the language tag in the markdown syntax.  
**Status:** Under consideration  
**Proposed Solution:** Show the language label on hover over code blocks, with a dropdown menu to easily change the language.  
**Workaround:** Use source view (click the `</>` Source button) to manually edit the language tag in code block syntax (e.g., change ` ```javascript` to ` ```typescript`).  
**Future Consideration:** A hover-based language indicator with dropdown picker is planned for code blocks.

---

## 📝 Limitations & Design Decisions

### Large Document Performance
**Type:** Design Limitation  
**Description:** Documents with 10,000+ lines may experience slower performance during editing. This is due to TipTap's document model processing.  
**Workaround:** Consider splitting very large documents into multiple files.  
**Future Consideration:** Virtual scrolling and lazy loading are planned for future releases.

### Image Processing
**Type:** Design Limitation  
**Description:** Very large images (>10MB) may take longer to process during drag-and-drop or resize operations, even with automatic resizing.  
**Current Behavior:** Images larger than 2MB or 2000px automatically trigger a resize dialog offering to downsize them to a suggested resolution.  
**Workaround:** Use the built-in resize dialog when prompted, or resize extremely large images externally before adding them to documents.

### PDF and Word Export - Images and Diagrams
**Type:** Design Limitation  
**Description:** PDF and Word exports have limited support for images and Mermaid diagrams.  
**Current Behavior:**
- **PDF Export:** Images with relative paths may not resolve correctly. Remote images (HTTP/HTTPS URLs) are not embedded. Image conversion to data URLs is currently disabled.
- **Word Export:** Remote images (HTTP/HTTPS URLs) are explicitly skipped and not embedded. Images using `vscode-webview://` URLs may fail to resolve. Only data URLs and local file paths are reliably supported.
- **Mermaid Diagrams:** While converted to PNG in the webview, they may not render correctly in exported documents if the conversion process fails.
**Workaround:** 
- For PDF: Use absolute paths or ensure images are in the same directory as the document. Download remote images locally before exporting.
- For Word: Download remote images locally before exporting. Ensure images use relative paths from the document location.
- For Mermaid: Verify diagrams render correctly in the editor before exporting. If issues occur, try recreating the diagram.
**Future Consideration:** Image conversion to data URLs will be re-enabled, and remote image fetching will be added for both export formats.

---

## 🔧 Common Workarounds

### Extension Not Opening Files
**Issue:** Right-click → "Open with Markdown for Humans" doesn't work  
**Workaround:**
1. Open VS Code Command Palette (Cmd/Ctrl + Shift + P)
2. Type "Markdown for Humans: Open File"
3. Select the command

### Theme Colors Not Matching
**Issue:** Editor colors don't match VS Code theme  
**Workaround:**
1. Reload VS Code window (Cmd/Ctrl + Shift + P → "Reload Window")
2. If issue persists, check VS Code theme settings

---

## 📊 Issue Statistics

- **Total Known Issues:** 4
- **High Priority:** 0
- **Medium Priority:** 3
- **Low Priority:** 1
- **Limitations:** 3

---

## Contributing

If you find a workaround for a known issue or have additional information, please:
1. Update this document via a pull request
2. Or comment on the related GitHub issue

---

**Note:** This document is maintained manually. For the most up-to-date issue tracking, see [GitHub Issues](https://github.com/concretios/markdown-for-humans/issues).

