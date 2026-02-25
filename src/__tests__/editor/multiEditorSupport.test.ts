import * as vscode from 'vscode';
import { Position, WorkspaceEdit, workspace, window } from 'vscode';
import { MarkdownEditorProvider } from '../../editor/MarkdownEditorProvider';

function createDocument(initialContent: string, uri = 'file://test.md') {
  let content = initialContent;

  return {
    getText: jest.fn(() => content),
    setContent: (next: string) => {
      content = next;
    },
    uri: {
      toString: () => uri,
    },
    positionAt: jest.fn((offset: number) => new Position(0, offset)),
  };
}

describe('MarkdownEditorProvider multiple editor support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (workspace.getConfiguration as jest.Mock).mockImplementation(() => ({
      get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
      update: jest.fn(),
    }));
  });

  it('registers provider with supportsMultipleEditorsPerDocument enabled', () => {
    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;

    MarkdownEditorProvider.register(context);

    expect(window.registerCustomEditorProvider).toHaveBeenCalledTimes(1);
    const options = (window.registerCustomEditorProvider as jest.Mock).mock.calls[0][2];

    expect(options).toMatchObject({
      supportsMultipleEditorsPerDocument: true,
    });
  });

  it('registers editor zoom commands', () => {
    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;

    MarkdownEditorProvider.register(context);

    const registeredCommandIds = (vscode.commands.registerCommand as jest.Mock).mock.calls.map(
      call => call[0]
    );
    expect(registeredCommandIds).toContain('markdownForHumans.editorZoomIn');
    expect(registeredCommandIds).toContain('markdownForHumans.editorZoomOut');
    expect(registeredCommandIds).toContain('markdownForHumans.editorZoomReset');
  });

  it('sends initial update independently to each webview for the same document', () => {
    const provider = new MarkdownEditorProvider({} as unknown as vscode.ExtensionContext);
    const document = createDocument('same content');

    const leftWebview = { postMessage: jest.fn() };
    const rightWebview = { postMessage: jest.fn() };

    (
      provider as unknown as {
        updateWebview: (doc: vscode.TextDocument, wv: { postMessage: jest.Mock }) => void;
      }
    ).updateWebview(document as unknown as vscode.TextDocument, leftWebview);

    (
      provider as unknown as {
        updateWebview: (doc: vscode.TextDocument, wv: { postMessage: jest.Mock }) => void;
      }
    ).updateWebview(document as unknown as vscode.TextDocument, rightWebview);

    expect(leftWebview.postMessage).toHaveBeenCalledTimes(1);
    expect(rightWebview.postMessage).toHaveBeenCalledTimes(1);
  });

  it('propagates edits to non-origin webviews while suppressing echo to the source webview', async () => {
    const provider = new MarkdownEditorProvider({} as unknown as vscode.ExtensionContext);
    const document = createDocument('alpha');

    const sourceWebview = { postMessage: jest.fn() };
    const mirrorWebview = { postMessage: jest.fn() };

    (workspace.applyEdit as jest.Mock).mockImplementation(async (edit: WorkspaceEdit) => {
      const replaces = (edit as unknown as { replaces?: Array<{ text: string }> }).replaces ?? [];
      if (replaces.length > 0) {
        document.setContent(replaces[0].text);
      }
      return true;
    });

    await (
      provider as unknown as {
        applyEdit: (
          content: string,
          doc: vscode.TextDocument,
          sourceWebview?: { postMessage: jest.Mock }
        ) => Promise<boolean>;
      }
    ).applyEdit('beta', document as unknown as vscode.TextDocument, sourceWebview);

    (
      provider as unknown as {
        updateWebview: (doc: vscode.TextDocument, wv: { postMessage: jest.Mock }) => void;
      }
    ).updateWebview(document as unknown as vscode.TextDocument, sourceWebview);

    (
      provider as unknown as {
        updateWebview: (doc: vscode.TextDocument, wv: { postMessage: jest.Mock }) => void;
      }
    ).updateWebview(document as unknown as vscode.TextDocument, mirrorWebview);

    expect(sourceWebview.postMessage).toHaveBeenCalledTimes(0);
    expect(mirrorWebview.postMessage).toHaveBeenCalledTimes(1);
  });

  it('resends update on ready even when the same content was already posted earlier', () => {
    (workspace.getConfiguration as jest.Mock).mockImplementation(() => ({
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'editorZoomLevel' || key === 'markdownForHumans.editorZoomLevel') {
          return 2;
        }
        return defaultValue;
      }),
      update: jest.fn(),
    }));

    const provider = new MarkdownEditorProvider({} as unknown as vscode.ExtensionContext);
    const document = createDocument('initial');
    const webview = { postMessage: jest.fn() };

    const webviewKey = (
      provider as unknown as {
        getWebviewKey: (wv: { postMessage: jest.Mock }) => string;
      }
    ).getWebviewKey(webview);

    (
      provider as unknown as { lastWebviewContentByView: Map<string, string> }
    ).lastWebviewContentByView.set(webviewKey, 'initial');

    (
      provider as unknown as {
        handleWebviewMessage: (
          message: { type: string; [key: string]: unknown },
          doc: vscode.TextDocument,
          wv: { postMessage: jest.Mock }
        ) => void;
      }
    ).handleWebviewMessage({ type: 'ready' }, document as unknown as vscode.TextDocument, webview);

    const messageTypes = (webview.postMessage as jest.Mock).mock.calls.map(call => call[0].type);
    expect(messageTypes).toContain('update');
    expect(messageTypes).toContain('settingsUpdate');
    expect(messageTypes).toContain('setEditorZoom');
    expect(webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setEditorZoom',
        zoomLevel: 2,
        zoomScale: 1.2,
      })
    );
  });

  it('broadcasts zoom updates to all active webviews and persists zoom level to settings', async () => {
    const zoomUpdateMock = jest.fn().mockResolvedValue(undefined);
    (workspace.getConfiguration as jest.Mock).mockImplementation(() => ({
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'editorZoomLevel' || key === 'markdownForHumans.editorZoomLevel') {
          return 0;
        }
        return defaultValue;
      }),
      update: zoomUpdateMock,
    }));

    const provider = new MarkdownEditorProvider({} as unknown as vscode.ExtensionContext);

    const document = createDocument('same content', 'file://zoom.md');
    const leftWebview = { postMessage: jest.fn() };
    const rightWebview = { postMessage: jest.fn() };

    (
      provider as unknown as {
        registerWebviewForDocument: (
          doc: vscode.TextDocument,
          wv: { postMessage: jest.Mock }
        ) => void;
      }
    ).registerWebviewForDocument(document as unknown as vscode.TextDocument, leftWebview);

    (
      provider as unknown as {
        registerWebviewForDocument: (
          doc: vscode.TextDocument,
          wv: { postMessage: jest.Mock }
        ) => void;
      }
    ).registerWebviewForDocument(document as unknown as vscode.TextDocument, rightWebview);

    await (
      provider as unknown as {
        adjustEditorZoom: (delta: number) => Promise<void>;
      }
    ).adjustEditorZoom(1);

    expect(zoomUpdateMock).toHaveBeenCalledWith(
      'editorZoomLevel',
      1,
      vscode.ConfigurationTarget.Global
    );
    expect(leftWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setEditorZoom',
        zoomLevel: 1,
        zoomScale: 1.1,
      })
    );
    expect(rightWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setEditorZoom',
        zoomLevel: 1,
        zoomScale: 1.1,
      })
    );
  });
});
