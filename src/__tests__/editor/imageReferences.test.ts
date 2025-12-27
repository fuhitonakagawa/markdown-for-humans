import { MarkdownEditorProvider } from '../../editor/MarkdownEditorProvider';
import * as vscode from 'vscode';

jest.mock('vscode', () => ({
  window: {
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
  },
  workspace: {
    getWorkspaceFolder: jest.fn(),
    workspaceFolders: undefined,
    getConfiguration: jest.fn(() => ({
      get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
      update: jest.fn(),
    })),
    onDidChangeTextDocument: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    applyEdit: jest.fn(),
    findFiles: jest.fn(),
    openTextDocument: jest.fn(),
    fs: {
      stat: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      createDirectory: jest.fn(),
      delete: jest.fn(),
      rename: jest.fn(),
    },
  },
  Uri: {
    file: jest.fn((p: string) => ({ fsPath: p, scheme: 'file' })),
  },
  TreeItem: class TreeItem {
    public iconPath: any;
    public description?: string;
    public command?: any;
    public contextValue?: string;
    constructor(
      public label: any,
      public collapsibleState?: any
    ) {}
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: class ThemeIcon {
    constructor(
      public id: string,
      public color?: any
    ) {}
  },
  ThemeColor: class ThemeColor {
    constructor(public id: string) {}
  },
  EventEmitter: class EventEmitter<T> {
    public event = jest.fn();
    fire = jest.fn((_data?: T) => {});
    dispose = jest.fn();
  },
  ViewColumn: {
    Beside: 2,
  },
  commands: {
    executeCommand: jest.fn(),
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  },
  WorkspaceEdit: jest.fn(),
  Range: jest.fn(),
  Position: jest.fn(),
}));

function createMockTextDocument(content: string): any {
  return {
    getText: jest.fn(() => content),
    uri: {
      scheme: 'file',
      fsPath: '/workspace/docs/doc.md',
      toString: () => 'file:/workspace/docs/doc.md',
    },
    fileName: '/workspace/docs/doc.md',
    lineCount: content.split('\n').length,
  };
}

describe('MarkdownEditorProvider - Image reference lookup', () => {
  let provider: MarkdownEditorProvider;
  let mockWebview: any;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new MarkdownEditorProvider({
      extensionUri: { fsPath: '/extension' } as any,
      subscriptions: [],
    } as any);
    mockWebview = { postMessage: jest.fn() };
  });

  it('returns current file count and other-file references for an image', async () => {
    const document = createMockTextDocument(
      ['# Doc', '![A](./images/cat.png)', '', '![B](./images/cat.png)'].join('\n')
    );

    const files = [
      { fsPath: '/workspace/docs/doc.md', scheme: 'file' },
      { fsPath: '/workspace/docs/other.md', scheme: 'file' },
      { fsPath: '/workspace/README.md', scheme: 'file' },
    ];

    const fileContents = new Map<string, string>([
      ['/workspace/docs/doc.md', document.getText()],
      ['/workspace/docs/other.md', '![X](./images/cat.png)'],
      ['/workspace/README.md', '![X](docs/images/cat.png)'],
    ]);

    (vscode.workspace.findFiles as jest.Mock).mockResolvedValue(files);
    (vscode.workspace.openTextDocument as jest.Mock).mockImplementation(async (uri: any) => {
      const text = fileContents.get(uri.fsPath) ?? '';
      return {
        uri,
        getText: () => text,
        lineCount: text.split('\n').length,
      };
    });

    (provider as any).handleWebviewMessage(
      { type: 'getImageReferences', requestId: 'req-1', imagePath: './images/cat.png' },
      document,
      mockWebview
    );

    // Let the async handler run
    await new Promise<void>(resolve => setImmediate(() => resolve()));

    const response = mockWebview.postMessage.mock.calls.find(
      (call: any[]) => call[0]?.type === 'imageReferences' && call[0]?.requestId === 'req-1'
    )?.[0];

    expect(response).toBeDefined();
    expect(response.currentFileCount).toBe(2);
    expect(response.otherFiles).toHaveLength(2);
  });
});
