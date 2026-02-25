/**
 * UpNote-compatible shortcut mapping for the WYSIWYG editor.
 *
 * This module intentionally stays framework-light so it can be unit-tested
 * without booting the full editor/webview runtime.
 */

export type UpnoteShortcutCommand =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'bulletList'
  | 'orderedList'
  | 'taskList';

export type UpnoteShortcutEvent = {
  metaKey: boolean;
  ctrlKey: boolean;
  key: string;
  isComposing?: boolean;
};

export type UpnoteShortcutRunner = {
  focus: () => UpnoteShortcutRunner;
  toggleHeading: (attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 }) => UpnoteShortcutRunner;
  toggleBulletList: () => UpnoteShortcutRunner;
  toggleOrderedList: () => UpnoteShortcutRunner;
  toggleTaskList: () => UpnoteShortcutRunner;
  run: () => boolean;
};

export type UpnoteShortcutEditor = {
  chain: () => UpnoteShortcutRunner;
};

/**
 * Resolve a keyboard event into an UpNote shortcut command.
 * Returns null when the event should not be handled by the editor.
 */
export function resolveUpnoteShortcut(
  event: UpnoteShortcutEvent,
  isEditorFocused: boolean
): UpnoteShortcutCommand | null {
  if (!isEditorFocused) {
    return null;
  }

  if (event.isComposing) {
    return null;
  }

  const isMod = event.metaKey || event.ctrlKey;
  if (!isMod) {
    return null;
  }

  switch (event.key) {
    case '1':
      return 'heading1';
    case '2':
      return 'heading2';
    case '3':
      return 'heading3';
    case '4':
      return 'heading4';
    case '5':
      return 'heading5';
    case '6':
      return 'heading6';
    case '7':
      return 'bulletList';
    case '8':
      return 'orderedList';
    case '9':
      return 'taskList';
    default:
      return null;
  }
}

/**
 * Execute the given UpNote shortcut command against TipTap editor commands.
 */
export function runUpnoteShortcut(
  editor: UpnoteShortcutEditor,
  command: UpnoteShortcutCommand
): boolean {
  const chain = editor.chain().focus();

  switch (command) {
    case 'heading1':
      return chain.toggleHeading({ level: 1 }).run();
    case 'heading2':
      return chain.toggleHeading({ level: 2 }).run();
    case 'heading3':
      return chain.toggleHeading({ level: 3 }).run();
    case 'heading4':
      return chain.toggleHeading({ level: 4 }).run();
    case 'heading5':
      return chain.toggleHeading({ level: 5 }).run();
    case 'heading6':
      return chain.toggleHeading({ level: 6 }).run();
    case 'bulletList':
      return chain.toggleBulletList().run();
    case 'orderedList':
      return chain.toggleOrderedList().run();
    case 'taskList':
      return chain.toggleTaskList().run();
    default:
      return false;
  }
}
