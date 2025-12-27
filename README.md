# Markdown for Humans

**Seamless WYSIWYG markdown editing for VS Code** — Write markdown the way humans think.

![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visual-studio-code) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

## Why We Built This

> **📌 Note:** *100% free. No trials. No limits. No paywalls, ever.*

### Writer-First, Human-First

Markdown for Humans is built on a simple belief: **writing should feel natural, not technical**. You shouldn't need to memorize syntax, dig through command palettes, or fight with your tools. You should just write.

We bring true WYSIWYG editing directly into VS Code with a **human-first design philosophy**:

- **Persistent formatting bar** — See your options, click what you need. No hunting through menus. 
- **Floating shortcuts** — Actions appear where you need them, when you need them, i.e. on Tables (right click), Images (More icon)
- **No command palette overload** — We keep actions visible and accessible, not buried in `/commands` or keyboard shortcuts you'll forget.
- **No context switching** — Everything you need is right there. Focus on your content, not syntax.

### The Problem We Solved

Existing markdown editors force writers to choose between:

- **Split-pane previews** that waste screen space and break your flow
- **Plain text editing** that requires memorizing syntax and breaks your concentration
- **Standalone apps** that don't integrate with your workflow
- **Command-heavy interfaces** that bury actions in overloaded palettes, requiring too much typing and mental overhead
- **Images:** Handling resolution, in-place resizing, size optimisation for large images, workspace directory storage and much more.

### Vibe Coded its way

This extension was built through AI / **vibe coding**, with minimal human effort focused on fixes and stability. The basic functional model came together in minutes, but what took days and hours was **testing each feature** to ensure everything works smoothly in real-world use. 

It's the classic 80:20 rule in action: that final 20% of polish, edge cases, and real-world testing takes 80% of the time, and that's where the real value lives.

We're open-sourcing this because in AI era, **code has limited value**, the real work was in the creativity in planning, design, and relentless testing. 

Countless hours went into vibe-coded wireframes, user experience design, and polish to create something that feels natural and intuitive.

---

## Quick Start

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=concretio.markdown-for-humans)
2. Open any `.md` file → Right-click → **"Open with Markdown for Humans"**
3. Start writing!

**Toggle between WYSIWYG and source**: Click the `</>` Source button in the toolbar

---

## Key Features

### True WYSIWYG Editing

![WYSIWYG Editing](https://raw.githubusercontent.com/concretios/markdown-for-humans/main/marketplace-assets/screenshots/Hero%20Image.png)

*See rendered output as you type, no preview pane needed. Focus on your content, not syntax.*

### Advanced Table Editing

![Table Editing](https://raw.githubusercontent.com/concretios/markdown-for-humans/main/marketplace-assets/screenshots/Rich%20Table%20Editing.png)

*Drag column borders to resize, use the toolbar dropdown to add/remove rows and columns, right-click for quick actions.*

### Mermaid Diagrams

![Mermaid Diagrams](https://raw.githubusercontent.com/concretios/markdown-for-humans/main/marketplace-assets/screenshots/Mermaid%20Diagram%20Support.png)

*Create flowcharts, sequence diagrams, Gantt charts, and more with 15 built-in templates.*

### Drag & Drop Images

It asks a local folder in workspace to save the same, to keep your MD assets organised.

![Drag Drop Images](https://raw.githubusercontent.com/concretios/markdown-for-humans/main/marketplace-assets/screenshots/Drag%20Drop%20Image%20Insertions.png)

*Just drag images into your document. Resize with handles, view metadata overlay.*

---

## What's Included

Markdown for Humans includes everything you need for a modern writing experience:

- **True WYSIWYG editing** powered by TipTap—see your formatted output as you type
- **Advanced table editing** with drag-to-resize columns, context menus, and toolbar controls
- **Mermaid diagrams** with 15 built-in templates and double-click editing
- **Code blocks** with syntax highlighting for 11+ languages
- **Math support** with beautiful LaTeX rendering via KaTeX
- **PDF and DOCX export** for sharing your documents
- **Document outline** with sidebar navigation for quick heading access
- **Theme support** for Light, Dark, and System themes (inherits your VS Code theme)
- **Word count and reading time** to track your writing progress

[Full feature list → Wiki](https://github.com/concretios/markdown-for-humans/wiki)

---

## Documentation

### For Users
- [User Guide](https://github.com/concretios/markdown-for-humans/wiki)
- [Known Issues](./KNOWN_ISSUES.md) - Known issues and workarounds
- [Report Issues](https://github.com/concretios/markdown-for-humans/issues)

### For Developers
- [Contributing](./CONTRIBUTING.md) - Developer setup and guidelines
- [Architecture](./docs/ARCHITECTURE.md) - Technical deep dive
- [Development Guide](./docs/DEVELOPMENT.md) - Philosophy and roadmap
- [Build Guide](./docs/BUILD.md) - Build and packaging
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Technical troubleshooting

### For Maintainers
- [Release Checklist](./docs/RELEASE_CHECKLIST.md) - Release process
- [QA Manual](./docs/QA_MANUAL.md) - Testing procedures

---

## Contributing

> **⚡ Built on open source, for the community.**
>
> Markdown for Humans exists because open source software empowers everyone. We believe that the best tools should be built, improved, and maintained by the whole community—not limited by a few. By embracing collaboration and transparency, we keep innovation moving forward for everyone.

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Ways to contribute:

- Report bugs
- Suggest features
- Improve documentation
- Submit pull requests
- Star the repo

---

## License

MIT © [Concret.io](https://concret.io)

---

## Credits

Built with:

- [TipTap](https://tiptap.dev/) - Headless editor framework
- [KaTeX](https://katex.org/) - Fast math rendering
- [Mermaid](https://mermaid.js.org/) - Diagram generation
- [VS Code Extension API](https://code.visualstudio.com/api)

---

**Made with ❤️ for Markdown lovers, by Team [Concret.io](https://concret.io)**