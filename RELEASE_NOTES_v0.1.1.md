# Markdown for Humans v0.1.1 Release Notes

## 🎯 What's New

### Critical Bug Fix
**Fixed Auto-Linking Bug** — Previously, typing text ending with file extensions (like `.md`, `.txt`, `.pdf`) would automatically convert them into links. This has been fixed! File extensions now remain as plain text, giving you complete control over when text becomes a link.

### Enhanced Link Creation Experience
**Completely Redesigned Link Dialog** — Creating links is now faster and more intuitive:

- **Three Link Modes**: Switch between URL, File, and Headings with radio buttons positioned right after the Link Text input
- **Smart File Search**: Type to search workspace files with fuzzy matching and category filters (Markdown, Images, Code, Config)
- **In-Document Headings**: Instantly link to any heading (H1-H6) within your current document
- **Cleaner Display**: Shows only the filename or heading name in the input field, while storing the full path correctly
- **Better Navigation**: Fixed image and file link clicking - images now open in VS Code's preview, files open correctly in both development and packaged builds

### Documentation & Discovery
- **Enhanced README** — Added comparison table showing how Markdown for Humans differs from other markdown editors
- **Improved Marketplace Listing** — Better keywords and descriptions to help users discover the extension more easily

## 🛠️ Technical Improvements

This release includes several under-the-hood improvements that make the extension more stable and reliable:
- Enhanced test coverage for better reliability
- Improved CI/CD pipeline for faster packaging
- Code quality improvements

## 📝 What's Next

We're continuously working to improve Markdown for Humans. Your feedback helps us prioritize what to build next!

---

**For Developers:** Full technical changelog available in [CHANGELOG.md](https://github.com/concretios/markdown-for-humans/blob/main/CHANGELOG.md)

