# UX Principles

> Response times, visual feedback, error handling, and accessibility.
> Index: See `AGENTS.md` for canonical instructions.

---

## Response Time Expectations

| Category | Target | Examples |
|----------|--------|----------|
| **Immediate** | <100ms | Typing, cursor movement, formatting buttons |
| **Quick** | <300ms | Menu opening, toolbar actions |
| **Acceptable** | <1s | File open, save, large document operations |
| **Background** | >1s | Mermaid rendering, syntax highlighting |

---

## Visual Feedback

- Show loading states for operations >300ms
- Confirm destructive actions (delete table, clear formatting)
- Provide undo for all operations (leverage VS Code's undo stack)
- Active states for toolbar buttons (bold, italic, etc.)

---

## Error Handling

**User-Friendly Errors:**
```typescript
// ✅ Good - Helpful error message
vscode.window.showErrorMessage(
  'Failed to render Mermaid diagram. Check syntax at line 42.',
  'View Syntax Guide'
).then(action => {
  if (action === 'View Syntax Guide') {
    vscode.env.openExternal(vscode.Uri.parse('https://mermaid.js.org/'));
  }
});

// ❌ Bad - Cryptic technical error
vscode.window.showErrorMessage('Error: MermaidRenderException at parser.js:156');
```

**Principles:**
- Never show stack traces to users
- Explain what went wrong and how to fix it
- Provide actionable next steps
- Log technical details using `console.error()` (always kept). Use `console.log()` for development debugging (removed in production). See `AGENTS.md` for logging rules.

---

## Accessibility

**Requirements:**
- Keyboard navigation for all features
- ARIA labels for toolbar buttons
- Screen reader announcements for state changes
- High contrast theme support
- Focus indicators visible

---

## Manual Testing Checklist

- [ ] 3000+ word doc, read 10+ minutes
- [ ] Tables, code blocks, mermaid, images (all types)
- [ ] Save/reload, undo/redo
- [ ] Light/dark themes
- [ ] Keyboard shortcuts, cursor position
