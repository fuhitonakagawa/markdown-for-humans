/**
 * Copyright (c) 2025-2026 Concret.io
 *
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import { Extension } from '@tiptap/core';
import { dropCursor } from '@tiptap/pm/dropcursor';

/**
 * Shows a drop insertion indicator line while dragging files/text in the editor.
 */
export const EditorDropCursor = Extension.create({
  name: 'editorDropCursor',

  addProseMirrorPlugins() {
    return [
      dropCursor({
        width: 2,
        color: 'var(--vscode-focusBorder)',
      }),
    ];
  },
});
