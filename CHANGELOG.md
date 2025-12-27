# Changelog

All notable changes to Markdown for Humans will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Initial Release

### Added
- WYSIWYG markdown editing with TipTap
- Headers (H1-H6)
- Inline formatting (bold, italic, strikethrough, code)
- Lists (ordered, unordered, task lists)
- Links and images
- Blockquotes
- Code blocks with syntax highlighting (11 languages)
- Tables with resize, context menu, and toolbar dropdown
- Mermaid diagrams with toggle view
- Compact formatting toolbar
- Theme support (light, dark, system)
- VS Code custom editor integration
- Two-way document synchronization
- Cursor position preservation
- Git integration (text-based diffs)
- Document outline sidebar with navigation, filtering, and auto-reveal
- Word count status bar with detailed statistics
- Image resize handles with modal editor and undo/redo
- PDF and Word document export functionality
- Mermaid diagram templates (15 diagram types)
- Mermaid double-click editing in modal
- Tab indentation support for lists and code blocks
- Image enter spacing and cursor styling improvements
- GitHub alerts callout support
- In-memory file support (untitled files)
- Image drag-drop reliability improvements
- Image path robustness (URL-encoded path handling)
- Source view button (opens VS Code native editor)
- Copy/paste support with HTML→Markdown conversion
- Toolbar icon refresh with Codicon-based icons

### Changed
- Enhanced undo reliability and dirty state handling
- Improved frontmatter rendering (no false dirty indicators)
- Better image handling with workspace path resolution

### Fixed
- Fixed image drag-drop bugs preventing VS Code from opening files
- Fixed frontmatter dirty state on document open
- Fixed undo stack synchronization with VS Code
- Fixed image path resolution for URL-encoded paths

---

[Unreleased]: https://github.com/concretios/markdown-for-humans/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/concretios/markdown-for-humans/releases/tag/v0.1.0
