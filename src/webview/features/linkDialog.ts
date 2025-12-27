/**
 * Copyright (c) 2025-2026 Concret.io
 *
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

/**
 * @file linkDialog.ts - Link insertion/editing dialog UI
 * @description Provides a modal dialog for inserting and editing hyperlinks.
 */
import { getMarkRange, Editor } from '@tiptap/core';
import { TextSelection } from 'prosemirror-state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

type Range = { from: number; to: number };
type ParentContext = { parentStart: number; parentText: string };

/**
 * Link Dialog state
 */
let linkDialogElement: HTMLElement | null = null;
let isVisible = false;
let currentEditor: Editor | null = null;
let workingRange: Range | null = null;
let initialLinkRange: Range | null = null;
let previousSelection: Range | null = null;
let shouldRestoreSelectionOnHide = true;

const isWhitespace = (char: string) => /\s/.test(char);

const getParentContext = (
  range: Range | null,
  doc: ProseMirrorNode | null
): ParentContext | null => {
  if (!range) return null;
  if (typeof doc?.resolve !== 'function') return null;
  const $from = doc.resolve(range.from);
  const $to = doc.resolve(Math.max(range.to - 1, range.from));
  if ($from.depth !== $to.depth || $from.parent !== $to.parent) return null;
  const parentStart = $from.start($from.depth);
  const parentText = $from.parent.textContent;
  return { parentStart, parentText };
};

const clampOffset = (offset: number, max: number) => Math.max(0, Math.min(offset, max));

const findPrevWordStart = (text: string, offset: number) => {
  let i = clampOffset(offset, text.length) - 1;
  while (i >= 0 && isWhitespace(text[i])) i--;
  while (i >= 0 && !isWhitespace(text[i])) i--;
  return i + 1;
};

const findNextWordStart = (text: string, offset: number) => {
  let i = clampOffset(offset, text.length);
  while (i < text.length && !isWhitespace(text[i])) i++;
  while (i < text.length && isWhitespace(text[i])) i++;
  return i;
};

const findNextWordEnd = (text: string, offset: number) => {
  let i = clampOffset(offset, text.length);
  while (i < text.length && isWhitespace(text[i])) i++;
  while (i < text.length && !isWhitespace(text[i])) i++;
  return i;
};

const trimTrailingWhitespace = (text: string, offset: number) => {
  let i = clampOffset(offset, text.length);
  while (i > 0 && isWhitespace(text[i - 1])) i--;
  return i;
};

const updateTextInputFromRange = (textInput: HTMLInputElement) => {
  if (!currentEditor || !workingRange) return;
  const { doc } = currentEditor.state;
  textInput.value = doc.textBetween(workingRange.from, workingRange.to, ' ');
};

const adjustLinkBoundary = (
  direction: 'left' | 'right',
  action: 'expand' | 'shrink',
  textInput: HTMLInputElement
) => {
  if (!currentEditor || !workingRange) return;

  const { doc } = currentEditor.state;
  const context = getParentContext(workingRange, doc);
  if (!context) return;

  const { parentStart, parentText } = context;
  const relFrom = clampOffset(workingRange.from - parentStart, parentText.length);
  const relTo = clampOffset(workingRange.to - parentStart, parentText.length);

  let newFrom = workingRange.from;
  let newTo = workingRange.to;

  if (direction === 'left' && action === 'expand') {
    newFrom = parentStart + findPrevWordStart(parentText, relFrom);
  } else if (direction === 'left' && action === 'shrink') {
    const nextStart = parentStart + findNextWordStart(parentText, relFrom);
    if (nextStart < newTo) {
      newFrom = nextStart;
    }
  } else if (direction === 'right' && action === 'expand') {
    newTo = parentStart + findNextWordEnd(parentText, relTo);
  } else if (direction === 'right' && action === 'shrink') {
    const startOfLastWord = findPrevWordStart(parentText, relTo);
    const boundary = parentStart + trimTrailingWhitespace(parentText, startOfLastWord);
    if (boundary > newFrom) {
      newTo = boundary;
    }
  }

  if (newFrom >= newTo) return;
  if (newFrom === workingRange.from && newTo === workingRange.to) return;

  workingRange = { from: newFrom, to: newTo };
  updateTextInputFromRange(textInput);
  setSelectionHighlight(workingRange);
};

const findNearestTextRange = (text: string, range: Range, doc: any): Range | null => {
  if (!text) return null;
  const context = getParentContext(range, doc);
  if (!context) return null;

  const { parentStart, parentText } = context;
  const matches: Range[] = [];
  let index = parentText.indexOf(text);

  while (index !== -1) {
    matches.push({ from: parentStart + index, to: parentStart + index + text.length });
    index = parentText.indexOf(text, index + text.length);
  }

  if (!matches.length) return null;

  const distance = (candidate: Range) =>
    Math.abs(candidate.from - range.from) + Math.abs(candidate.to - range.to);

  return matches.sort((a, b) => distance(a) - distance(b))[0] || null;
};

const applyLinkAtRange = (url: string, text: string) => {
  if (!currentEditor) return;

  const { state } = currentEditor;
  const { doc, schema } = state;
  const linkType = schema.marks.link;
  if (!linkType) return;

  const baseRange: Range = workingRange || { from: state.selection.from, to: state.selection.to };
  const trimmedText = text.trim();
  const hasText = Boolean(trimmedText);

  let targetRange: Range = baseRange;
  let shouldReplaceText = false;

  if (hasText) {
    const nearest = findNearestTextRange(trimmedText, baseRange, doc);
    if (nearest) {
      targetRange = nearest;
    } else {
      shouldReplaceText = true;
    }
  }

  if (targetRange.from === targetRange.to && !hasText) {
    return; // Nothing to link
  }

  const tr = state.tr;

  const clearFrom = initialLinkRange
    ? Math.min(initialLinkRange.from, targetRange.from)
    : targetRange.from;
  const clearTo = initialLinkRange ? Math.max(initialLinkRange.to, targetRange.to) : targetRange.to;

  tr.removeMark(clearFrom, clearTo, linkType);

  let finalTo = targetRange.to;
  if (hasText && shouldReplaceText) {
    tr.insertText(trimmedText, targetRange.from, targetRange.to);
    finalTo = targetRange.from + trimmedText.length;
  } else if (hasText) {
    finalTo = targetRange.to;
  }

  tr.addMark(targetRange.from, finalTo, linkType.create({ href: url }));
  tr.setSelection(TextSelection.create(tr.doc, targetRange.from, finalTo));

  workingRange = { from: targetRange.from, to: finalTo };

  currentEditor.view.dispatch(tr);
  currentEditor.view.focus();
};

const clearWorkingRanges = () => {
  workingRange = null;
  initialLinkRange = null;
  previousSelection = null;
  shouldRestoreSelectionOnHide = true;
};

function focusEditor(editor: Editor | null) {
  try {
    const chain = editor?.chain?.();
    const maybeFocused = typeof chain?.focus === 'function' ? chain.focus() : chain;
    if (typeof maybeFocused?.run === 'function') {
      maybeFocused.run();
    }
  } catch (error) {
    console.warn('[MD4H] Failed to restore focus to editor after link dialog', error);
  }
}

const setSelectionHighlight = (range: Range | null) => {
  if (!currentEditor || !range) return;
  try {
    currentEditor.commands.setTextSelection({ from: range.from, to: range.to });
  } catch (error) {
    console.warn('[MD4H] Failed to set selection highlight for link dialog', error);
  }
};

const positionPopover = (panel: HTMLElement) => {
  if (!currentEditor || !workingRange) return;
  const view = currentEditor.view;
  if (!view || typeof view.coordsAtPos !== 'function') return;

  const pos = Math.max(
    Math.min(Math.floor((workingRange.from + workingRange.to) / 2), workingRange.to),
    workingRange.from
  );

  let coords;
  try {
    coords = view.coordsAtPos(pos);
  } catch (error) {
    console.warn('[MD4H] coordsAtPos failed for link dialog', error);
    return;
  }

  const panelRect = panel.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gutter = 12;
  const lineHeight =
    parseFloat(getComputedStyle(document.documentElement).lineHeight || '20') || 20;
  const offset = lineHeight * 1.5;

  const preferredTop = coords.top - panelRect.height - offset;
  const fallbackTop = coords.bottom + offset;
  const top = preferredTop > gutter ? preferredTop : fallbackTop;

  const preferredLeft = coords.left - panelRect.width / 2;
  const clampedLeft = Math.max(
    gutter,
    Math.min(preferredLeft, viewportWidth - panelRect.width - gutter)
  );
  const clampedTop = Math.max(gutter, Math.min(top, viewportHeight - panelRect.height - gutter));

  panel.style.position = 'absolute';
  panel.style.left = `${clampedLeft}px`;
  panel.style.top = `${clampedTop}px`;
};

window.addEventListener('resize', () => {
  if (!isVisible || !linkDialogElement) return;
  const panel = linkDialogElement.querySelector(
    '.export-settings-overlay-panel'
  ) as HTMLElement | null;
  if (panel) {
    positionPopover(panel);
  }
});

window.addEventListener(
  'scroll',
  () => {
    if (!isVisible || !linkDialogElement) return;
    const panel = linkDialogElement.querySelector(
      '.export-settings-overlay-panel'
    ) as HTMLElement | null;
    if (panel) {
      positionPopover(panel);
    }
  },
  true
);

/**
 * Create the Link Dialog element
 */
export function createLinkDialog(): HTMLElement {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'link-dialog-popover';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '50';
  overlay.style.display = 'none';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Insert/Edit Link');
  overlay.setAttribute('aria-modal', 'true');

  // Create content panel
  const panel = document.createElement('div');
  panel.className = 'export-settings-overlay-panel';
  panel.style.maxWidth = '520px';
  panel.style.pointerEvents = 'auto';
  panel.style.position = 'absolute';
  panel.style.boxShadow = '0 12px 32px rgba(0,0,0,0.24)';

  // Create header
  const header = document.createElement('div');
  header.className = 'export-settings-overlay-header';
  header.innerHTML = `
    <h2 class="export-settings-overlay-title" id="link-dialog-title">Insert Link</h2>
    <button class="export-settings-overlay-close" aria-label="Close dialog" title="Close (Esc)">×</button>
  `;

  const closeBtn = header.querySelector('.export-settings-overlay-close') as HTMLElement;
  closeBtn.onclick = () => hideLinkDialog();

  // Create dialog content
  const content = document.createElement('div');
  content.className = 'export-settings-content';
  content.innerHTML = `
    <div class="export-settings-section" style="margin-bottom: 16px;">
      <label class="export-settings-label" for="link-text-input">Link Text</label>
      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: nowrap;">
        <div style="display: flex; gap: 4px;">
          <button
            id="link-trim-left-btn"
            class="export-settings-select"
            style="padding: 6px 10px; font-size: 12px;"
            title="Trim left boundary by one word"
          >
            -
          </button>
          <button
            id="link-expand-left-btn"
            class="export-settings-select"
            style="padding: 6px 10px; font-size: 12px;"
            title="Expand left boundary to previous word"
          >
            +
          </button>
        </div>
        <input
          type="text"
          id="link-text-input"
          class="export-settings-select"
          style="padding: 8px 12px; flex: 1; min-width: 0;"
          placeholder="Text to display"
        />
        <div style="display: flex; gap: 4px;">
          <button
            id="link-expand-right-btn"
            class="export-settings-select"
            style="padding: 6px 10px; font-size: 12px;"
            title="Expand right boundary to next word"
          >
            +
          </button>
          <button
            id="link-trim-right-btn"
            class="export-settings-select"
            style="padding: 6px 10px; font-size: 12px;"
            title="Trim right boundary by one word"
          >
            -
          </button>
        </div>
      </div>
      <p class="export-settings-hint">The text that will be shown in the document</p>
    </div>
    <div class="export-settings-section" style="margin-bottom: 24px;">
      <label class="export-settings-label" for="link-url-input">
        URL
        <input
          type="url"
          id="link-url-input"
          class="export-settings-select"
          style="padding: 8px 12px;"
          placeholder="https://example.com"
        />
      </label>
      <p class="export-settings-hint">The web address or file path</p>
    </div>
    <div style="display: flex; gap: 12px; justify-content: space-between;">
      <button
        id="link-remove-btn"
        class="export-settings-select"
        style="padding: 8px 16px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 4px;"
      >
        Remove Link
      </button>
      <div style="display: flex; gap: 12px;">
        <button
          id="link-cancel-btn"
          class="export-settings-select"
          style="padding: 8px 24px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 4px;"
        >
          Cancel
        </button>
        <button
          id="link-ok-btn"
          class="export-settings-select"
          style="padding: 8px 24px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; border-radius: 4px;"
        >
          OK
        </button>
      </div>
    </div>
  `;

  // Handle button clicks
  const okBtn = content.querySelector('#link-ok-btn') as HTMLButtonElement;
  const cancelBtn = content.querySelector('#link-cancel-btn') as HTMLButtonElement;
  const removeBtn = content.querySelector('#link-remove-btn') as HTMLButtonElement;
  const textInput = content.querySelector('#link-text-input') as HTMLInputElement;
  const urlInput = content.querySelector('#link-url-input') as HTMLInputElement;
  const trimLeftBtn = content.querySelector('#link-trim-left-btn') as HTMLButtonElement | null;
  const expandLeftBtn = content.querySelector('#link-expand-left-btn') as HTMLButtonElement | null;
  const expandRightBtn = content.querySelector(
    '#link-expand-right-btn'
  ) as HTMLButtonElement | null;
  const trimRightBtn = content.querySelector('#link-trim-right-btn') as HTMLButtonElement | null;

  const boundaryButtons = [
    { button: trimLeftBtn, direction: 'left' as const, action: 'shrink' as const },
    { button: expandLeftBtn, direction: 'left' as const, action: 'expand' as const },
    { button: expandRightBtn, direction: 'right' as const, action: 'expand' as const },
    { button: trimRightBtn, direction: 'right' as const, action: 'shrink' as const },
  ];

  boundaryButtons.forEach(({ button, direction, action }) => {
    if (!button) return;
    button.onclick = () => adjustLinkBoundary(direction, action, textInput);
  });

  okBtn.onclick = () => {
    const url = urlInput.value.trim();
    const text = textInput.value;

    if (!url) {
      urlInput.focus();
      return;
    }

    shouldRestoreSelectionOnHide = false;
    applyLinkAtRange(url, text);
    hideLinkDialog();
  };

  cancelBtn.onclick = () => hideLinkDialog();

  removeBtn.onclick = () => {
    if (currentEditor) {
      const { state } = currentEditor;
      const linkType = state.schema.marks.link;
      if (linkType) {
        const baseRange = workingRange ||
          initialLinkRange || { from: state.selection.from, to: state.selection.to };
        const clearFrom = initialLinkRange
          ? Math.min(initialLinkRange.from, baseRange.from)
          : baseRange.from;
        const clearTo = initialLinkRange
          ? Math.max(initialLinkRange.to, baseRange.to)
          : baseRange.to;
        const tr = state.tr.removeMark(clearFrom, clearTo, linkType);
        currentEditor.view.dispatch(tr);
      }
    }
    shouldRestoreSelectionOnHide = false;
    hideLinkDialog();
  };

  // Handle keyboard navigation
  overlay.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hideLinkDialog();
    } else if (e.key === 'Enter' && (e.target === textInput || e.target === urlInput)) {
      e.preventDefault();
      okBtn.click();
    }
  });

  panel.appendChild(header);
  panel.appendChild(content);
  overlay.appendChild(panel);

  document.body.appendChild(overlay);
  linkDialogElement = overlay;

  return overlay;
}

/**
 * Show the Link Dialog
 */
export function showLinkDialog(editor: Editor): void {
  currentEditor = editor;
  shouldRestoreSelectionOnHide = true;

  if (!linkDialogElement) {
    createLinkDialog();
  }

  if (!linkDialogElement) return;

  // Get current selection and link state
  const { state } = editor;
  const { selection, doc, schema } = state;
  previousSelection = { from: selection.from, to: selection.to };
  const linkType = schema.marks.link;
  const linkMark = editor.getAttributes('link');
  const currentUrl = linkMark.href || '';

  // If we're inside a link, expand to full mark range so we capture the whole link text
  const linkRange = getMarkRange(selection.$from, linkType, linkMark);
  const selectionRange: Range = linkRange
    ? { from: linkRange.from, to: linkRange.to }
    : { from: selection.from, to: selection.to };
  workingRange = selectionRange;
  initialLinkRange = linkRange ? { from: linkRange.from, to: linkRange.to } : null;
  const selectedText = doc.textBetween(selectionRange.from, selectionRange.to, ' ');
  setSelectionHighlight(workingRange);

  // Update dialog title and button visibility
  const title = linkDialogElement.querySelector('#link-dialog-title') as HTMLElement;
  const removeBtn = linkDialogElement.querySelector('#link-remove-btn') as HTMLButtonElement;
  const textInput = linkDialogElement.querySelector('#link-text-input') as HTMLInputElement;
  const urlInput = linkDialogElement.querySelector('#link-url-input') as HTMLInputElement;

  if (currentUrl) {
    title.textContent = 'Edit Link';
    removeBtn.style.display = 'block';
  } else {
    title.textContent = 'Insert Link';
    removeBtn.style.display = 'none';
  }

  // Pre-fill inputs
  textInput.value = selectedText || '';
  urlInput.value = currentUrl || '';

  // Show overlay
  linkDialogElement.classList.add('visible');
  linkDialogElement.style.display = 'block';
  isVisible = true;
  const panelElement = linkDialogElement.querySelector(
    '.export-settings-overlay-panel'
  ) as HTMLElement | null;

  // Focus appropriate input
  requestAnimationFrame(() => {
    if (!currentUrl && !selectedText) {
      // New link with no selection: focus text input
      textInput.focus();
    } else {
      // Editing or has selection: focus URL input
      urlInput.select();
      urlInput.focus();
    }

    if (panelElement) {
      positionPopover(panelElement);
    }
  });
}

/**
 * Hide the Link Dialog
 */
export function hideLinkDialog(): void {
  const editorRef = currentEditor;
  const restoreSelection = shouldRestoreSelectionOnHide;
  const originalSelection = previousSelection;

  if (!linkDialogElement) return;

  linkDialogElement.classList.remove('visible');
  linkDialogElement.style.display = 'none';
  isVisible = false;

  if (restoreSelection && editorRef && originalSelection) {
    try {
      editorRef.commands.setTextSelection({
        from: originalSelection.from,
        to: originalSelection.to,
      });
    } catch (error) {
      console.warn('[MD4H] Failed to restore selection after link dialog', error);
    }
  }

  currentEditor = null;
  clearWorkingRanges();

  if (editorRef) {
    focusEditor(editorRef);
  }
}

/**
 * Check if Link Dialog is visible
 */
export function isLinkDialogVisible(): boolean {
  return isVisible;
}
