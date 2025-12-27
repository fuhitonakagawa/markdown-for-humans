# Performance Guidelines

> Bundle size, startup time, and memory usage targets.
> Index: See `AGENTS.md` for canonical instructions.

---

## Bundle Size

**Current:**
- Extension: 6.8KB (excellent)
- WebView: 9.3MB (acceptable but could improve)
- CSS: 20KB (excellent)

**Future optimizations:**
- Code splitting (load Mermaid/Math on demand)
- Tree shaking (remove unused highlight.js languages)
- Compression (gzip/brotli for webview bundle)

**Target:** <5MB webview bundle

---

## Startup Time

**Current:** <500ms from file open to editor ready

**Target:** Maintain <500ms as features are added

**Monitor:** Large documents (10,000+ lines) should not increase startup time

---

## Memory Usage

**Guidelines:**
- Dispose of subscriptions in `deactivate()`
- Clear event listeners when webview disposed
- Don't cache entire document in memory (use VS Code's TextDocument)
- Profile with Chrome DevTools (webview is just a browser)

---

## Performance Budget

| Metric | Target |
|--------|--------|
| Editor initialization | <500ms |
| Typing latency | <16ms (keystrokes) |
| Other interactions (cursor/formatting) | <50ms |
| Menu/toolbar actions | <300ms |
| Large document handling | 10,000+ lines smooth |
| Debounce on sync | 500ms |

---

## Key Optimizations

- **500ms debounce** on document sync (balance responsiveness vs. performance)
- **Skip redundant updates** (check if content actually changed)
- **Respect user editing state** (don't interrupt typing with external updates)

**Future (if needed):**
- Virtual scrolling (only render visible content)
- Lazy loading (images, diagrams)
- Web Workers (background parsing)
