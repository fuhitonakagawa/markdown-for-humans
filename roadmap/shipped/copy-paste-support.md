# Changelog: Copy/Paste Support & Source View

**Spec:** `../specs/copy-paste-support.md`

---

## 2025-11-29 – Phase 1 MVP completed

- Implemented toolbar Copy and Source View buttons.
- Implemented copy selection as markdown.
- Implemented smart paste (HTML→Markdown conversion using turndown.js).
- Implemented image paste and drag/drop fixes so images are saved as files with relative paths.
- See detailed task logs:
  - `./task-copy-paste-toolbar.md`
  - `./task-image-drag-drop-fix.md`

---

## 2025-11-29 – Spec consolidation

- Created canonical feature spec at `specs/copy-paste-support.md` based on `specs/copy-paste-support/phase-1-mvp.md` and related task docs.
- Centralized tasks and testing checklist into spec section 10/11 per `feature-spec-template.md`.
