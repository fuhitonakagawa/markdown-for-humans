# Task: [Task Name]

## 1. Task Metadata

- **Task name:** [Brief descriptive name]
- **Slug:** [kebab-case-identifier]
- **Status:** planned | in-progress | shipped
- **Created:** YYYY-MM-DD
- **Last updated:** YYYY-MM-DD
- **Shipped:** _(pending)_ | YYYY-MM-DD

---

## 2. Context & Problem

**Current state:**
- [What exists today? What's the baseline?]

**Pain points:**
- **[User frustration 1]:** [Why this hurts the user experience]
- **[User frustration 2]:** [Another specific pain point]
- **[User need]:** [What users are trying to accomplish]

**Why it matters:**
- **[Impact 1]:** [Why solving this improves the product]
- **[Impact 2]:** [Business/user value]
- **[Industry standard]:** [How other tools handle this]

---

## 3. Desired Outcome & Scope

**Success criteria:**
- [Measurable outcome 1 - e.g., "Users can X in <Y seconds"]
- [Measurable outcome 2 - e.g., "Feature works with Z scenarios"]
- [Quality bar - e.g., "No regression in existing functionality"]

**In scope:**
- [Feature/component 1]
- [Feature/component 2]
- [Edge case handling]

**Out of scope:**
- [What we're explicitly NOT building]
- [Future enhancements to defer]

---

## 4. UX & Behavior

**Entry points:**
- [How users discover/access this feature - e.g., "Command palette", "Toolbar button", "Keyboard shortcut"]

**User flows:**

### Flow 1: [Primary use case]
1. [Step 1 - what user does]
2. [Step 2 - system response]
3. [Step 3 - user action]
4. [Expected outcome]

### Flow 2: [Secondary use case]
1. [Alternative path]
2. [Different outcome]

**Behavior rules:**
- [Edge case handling - e.g., "If X, then Y"]
- [Error handling - e.g., "Show error message if Z fails"]
- [Accessibility - e.g., "Keyboard navigation supported"]

---

## 5. Technical Plan

**Surfaces:**
- [Where code changes live - e.g., "Webview (TipTap editor)", "Extension host (VS Code API)"]

**Key changes:**
- `[file-path]` – [What this file does - e.g., "New TipTap extension for X"]
- `[file-path]` – [Another file change - e.g., "Update editor.ts to register extension"]
- `[file-path]` – [Styling/UI changes - e.g., "Add CSS for new component"]

**Architecture notes:**
- [Design decisions - e.g., "Runs entirely in webview", "Uses existing Y pattern"]
- [Dependencies - e.g., "Requires Z library"]

**Performance considerations:**
- [Performance budget - e.g., "<16ms for typing", "Debounce at 500ms"]

---

## 6. Work Breakdown

- [ ] **Phase 1: [Name]** - [What gets done]
  - [ ] Subtask 1
  - [ ] Subtask 2
- [ ] **Phase 2: [Name]** - [Next milestone]
  - [ ] Subtask 1
- [ ] **Testing** - [Test approach]
  - [ ] Unit tests for [component]
  - [ ] Integration tests for [flow]
  - [ ] Manual testing checklist

---

## 7. Implementation Log

_(Fill in as you implement - track progress, decisions, blockers)_

### YYYY-MM-DD – [Milestone/Update]

- **What:** [What was done]
- **Files:** [Files changed]
- **Notes:** [Key learnings, blockers, decisions]

---

## 8. Decisions & Tradeoffs

_(Document important decisions made during implementation)_

- **[Decision 1]:** [What was decided and why]
- **[Tradeoff 1]:** [What was chosen vs. what was rejected]

---

## 9. Follow-up & Future Work

- [Future enhancement 1]
- [Future enhancement 2]
- [Related features to consider]

---

## Quick Reference

**Template hints:**
- Keep sections concise - use bullet points, not paragraphs
- Focus on **what** and **why**, not **how** (implementation details go in Technical Plan)
- Success criteria should be **measurable** and **testable**
- Out of scope helps prevent scope creep
- Implementation log is your working journal - update as you go

**For AI coding tools:**
- Prompt: "Create a task plan using roadmap/task-plan-template.md for [feature name]"
- Fill in each section with your tool's help
- Move to `roadmap/pipeline/` when ready: `git mv [source]/[name].md roadmap/pipeline/[name].md`

**When shipping:**
- Move plan to `roadmap/shipped/`: `git mv roadmap/pipeline/[name].md roadmap/shipped/`

