import {
  resolveUpnoteShortcut,
  runUpnoteShortcut,
  type UpnoteShortcutCommand,
} from '../../webview/utils/upnoteShortcuts';

type MockShortcutEvent = {
  metaKey: boolean;
  ctrlKey: boolean;
  key: string;
  isComposing?: boolean;
};

describe('resolveUpnoteShortcut', () => {
  it('maps Cmd+2 to heading level 2 when editor is focused', () => {
    const event: MockShortcutEvent = { metaKey: true, ctrlKey: false, key: '2' };
    expect(resolveUpnoteShortcut(event, true)).toBe('heading2');
  });

  it('maps Ctrl+3 to heading level 3 on non-mac layouts', () => {
    const event: MockShortcutEvent = { metaKey: false, ctrlKey: true, key: '3' };
    expect(resolveUpnoteShortcut(event, true)).toBe('heading3');
  });

  it('maps Cmd+1..9 to heading and list commands', () => {
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '1' }, true)).toBe(
      'heading1'
    );
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '2' }, true)).toBe(
      'heading2'
    );
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '3' }, true)).toBe(
      'heading3'
    );
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '4' }, true)).toBe(
      'heading4'
    );
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '5' }, true)).toBe(
      'heading5'
    );
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '6' }, true)).toBe(
      'heading6'
    );
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '7' }, true)).toBe(
      'bulletList'
    );
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '8' }, true)).toBe(
      'orderedList'
    );
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '9' }, true)).toBe(
      'taskList'
    );
  });

  it('returns null when editor is not focused', () => {
    const event: MockShortcutEvent = { metaKey: true, ctrlKey: false, key: '2' };
    expect(resolveUpnoteShortcut(event, false)).toBeNull();
  });

  it('returns null while IME composition is active', () => {
    const event: MockShortcutEvent = { metaKey: true, ctrlKey: false, key: '7', isComposing: true };
    expect(resolveUpnoteShortcut(event, true)).toBeNull();
  });

  it('returns null for unsupported key combinations', () => {
    expect(resolveUpnoteShortcut({ metaKey: true, ctrlKey: false, key: '0' }, true)).toBeNull();
    expect(resolveUpnoteShortcut({ metaKey: false, ctrlKey: false, key: '2' }, true)).toBeNull();
  });
});

describe('runUpnoteShortcut', () => {
  function createEditorMock() {
    const chainApi = {
      focus: jest.fn().mockReturnThis(),
      toggleHeading: jest.fn().mockReturnThis(),
      toggleBulletList: jest.fn().mockReturnThis(),
      toggleOrderedList: jest.fn().mockReturnThis(),
      toggleTaskList: jest.fn().mockReturnThis(),
      run: jest.fn().mockReturnValue(true),
    };

    return {
      chainApi,
      editor: {
        chain: jest.fn(() => chainApi),
      },
    };
  }

  it.each<
    [
      UpnoteShortcutCommand,
      'toggleHeading' | 'toggleBulletList' | 'toggleOrderedList' | 'toggleTaskList',
      unknown,
    ]
  >([
    ['heading1', 'toggleHeading', { level: 1 }],
    ['heading2', 'toggleHeading', { level: 2 }],
    ['heading3', 'toggleHeading', { level: 3 }],
    ['heading4', 'toggleHeading', { level: 4 }],
    ['heading5', 'toggleHeading', { level: 5 }],
    ['heading6', 'toggleHeading', { level: 6 }],
    ['bulletList', 'toggleBulletList', undefined],
    ['orderedList', 'toggleOrderedList', undefined],
    ['taskList', 'toggleTaskList', undefined],
  ])('runs %s with the expected tiptap command', (command, method, args) => {
    const { editor, chainApi } = createEditorMock();

    runUpnoteShortcut(editor, command);

    expect(editor.chain).toHaveBeenCalledTimes(1);
    expect(chainApi.focus).toHaveBeenCalledTimes(1);

    if (args === undefined) {
      expect(chainApi[method] as jest.Mock).toHaveBeenCalledTimes(1);
    } else {
      expect(chainApi[method] as jest.Mock).toHaveBeenCalledWith(args);
    }

    expect(chainApi.run).toHaveBeenCalledTimes(1);
  });
});
