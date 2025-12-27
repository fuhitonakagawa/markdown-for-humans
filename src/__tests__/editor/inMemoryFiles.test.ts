/**
 * In-Memory File Support Tests
 *
 * Tests for untitled (unsaved) file support in Markdown Editor.
 * Verifies that untitled files work correctly with and without workspace folders,
 * including image resolution, warning dialogs, and all image operations.
 */

import { MarkdownEditorProvider } from '../../editor/MarkdownEditorProvider';
import * as vscode from 'vscode';
import * as os from 'os';

// Mock vscode module
jest.mock('vscode', () => ({
  commands: {
    executeCommand: jest.fn(),
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  },
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
  },
  workspace: {
    getWorkspaceFolder: jest.fn(),
    workspaceFolders: undefined,
    getConfiguration: jest.fn(() => ({
      get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
      update: jest.fn(),
    })),
    applyEdit: jest.fn(),
    onDidChangeTextDocument: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    fs: {
      createDirectory: jest.fn(),
      writeFile: jest.fn(),
      readFile: jest.fn(),
      stat: jest.fn(),
    },
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
    joinPath: jest.fn((base: any, ...paths: string[]) => {
      const basePath = base?.fsPath ?? '';
      const joined = [basePath, ...paths].filter(Boolean).join('/');
      return { fsPath: joined, scheme: base?.scheme ?? 'file' };
    }),
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
  Range: jest.fn(),
  Position: jest.fn(),
  WorkspaceEdit: jest.fn(),
  ConfigurationTarget: {
    Global: 1,
  },
}));

function createMockTextDocument(content: string, languageId = 'markdown'): any {
  return {
    getText: jest.fn(() => content),
    languageId,
    uri: { scheme: 'file', fsPath: '/test/document.md', toString: () => 'file:/test/document.md' },
    fileName: '/test/document.md',
  };
}

describe('MarkdownEditorProvider - In-Memory File Support', () => {
  let provider: MarkdownEditorProvider;
  let mockContext: vscode.ExtensionContext;
  let mockWebview: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      extensionUri: { fsPath: '/extension' } as vscode.Uri,
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;

    mockWebview = {
      postMessage: jest.fn(),
      asWebviewUri: jest.fn((uri: any) => ({
        toString: () => `vscode-webview://${uri.fsPath}`,
      })),
      onDidReceiveMessage: jest.fn(() => ({ dispose: jest.fn() })),
      options: {},
    };

    provider = new MarkdownEditorProvider(mockContext);
  });

  describe('getDocumentDirectory', () => {
    it('should return document directory for file scheme', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'file', fsPath: '/workspace/test.md' } as any;
      const docDir = (provider as any).getDocumentDirectory(document);
      expect(docDir).toBe('/workspace');
    });

    it('should return workspace folder for untitled file in workspace', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      const docDir = (provider as any).getDocumentDirectory(document);
      expect(docDir).toBe('/workspace');
    });

    it('should return null for untitled file without workspace', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = undefined;
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      const docDir = (provider as any).getDocumentDirectory(document);
      expect(docDir).toBeNull();
    });

    it('should prioritize workspaceFolders over getWorkspaceFolder for untitled files', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue({
        uri: { fsPath: '/wrong-workspace' },
      });

      const docDir = (provider as any).getDocumentDirectory(document);
      // Should use workspaceFolders[0], not getWorkspaceFolder result
      expect(docDir).toBe('/workspace');
    });
  });

  describe('getImageBasePath', () => {
    it('should return document directory for file scheme', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'file', fsPath: '/workspace/test.md' } as any;
      const basePath = (provider as any).getImageBasePath(document);
      expect(basePath).toBe('/workspace');
    });

    it('should return workspace folder for untitled file in workspace', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      const basePath = (provider as any).getImageBasePath(document);
      expect(basePath).toBe('/workspace');
    });

    it('should return home directory for untitled file without workspace', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = undefined;
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      const basePath = (provider as any).getImageBasePath(document);
      expect(basePath).toBe(os.homedir());
    });
  });

  describe('resolveCustomTextEditor - localResourceRoots', () => {
    it('should include workspace folder for untitled file in workspace', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      const webviewPanel = {
        webview: mockWebview,
        onDidChangeViewState: jest.fn(),
        onDidDispose: jest.fn(),
      } as any;

      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      await (provider as any).resolveCustomTextEditor(
        document,
        webviewPanel,
        {} as vscode.CancellationToken
      );

      expect(webviewPanel.webview.options.localResourceRoots).toContainEqual(
        expect.objectContaining({ fsPath: '/workspace' })
      );
    });

    it('should include home directory for untitled file without workspace', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      const webviewPanel = {
        webview: mockWebview,
        onDidChangeViewState: jest.fn(),
        onDidDispose: jest.fn(),
      } as any;

      (vscode.workspace.workspaceFolders as any) = undefined;
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      await (provider as any).resolveCustomTextEditor(
        document,
        webviewPanel,
        {} as vscode.CancellationToken
      );

      const homeDir = os.homedir();
      expect(webviewPanel.webview.options.localResourceRoots).toContainEqual(
        expect.objectContaining({ fsPath: homeDir })
      );
    });

    it('should show warning dialog for untitled file without workspace', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      const webviewPanel = {
        webview: mockWebview,
        onDidChangeViewState: jest.fn(),
        onDidDispose: jest.fn(),
      } as any;

      (vscode.workspace.workspaceFolders as any) = undefined;
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      await (provider as any).resolveCustomTextEditor(
        document,
        webviewPanel,
        {} as vscode.CancellationToken
      );

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('You are working without a workspace')
      );
    });

    it('should not show warning dialog for untitled file with workspace', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      const webviewPanel = {
        webview: mockWebview,
        onDidChangeViewState: jest.fn(),
        onDidDispose: jest.fn(),
      } as any;

      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      await (provider as any).resolveCustomTextEditor(
        document,
        webviewPanel,
        {} as vscode.CancellationToken
      );

      expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleResolveImageUri', () => {
    it('should resolve relative image path using workspace folder for untitled file in workspace', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      const message = {
        type: 'resolveImageUri',
        relativePath: './images/test.jpg',
        requestId: 'test-123',
      };

      (provider as any).handleResolveImageUri(message, document, mockWebview);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageUriResolved',
          requestId: 'test-123',
          webviewUri: expect.stringContaining('vscode-webview://'),
        })
      );
    });

    it('should resolve relative image path using home directory for untitled file without workspace', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = undefined;
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      const message = {
        type: 'resolveImageUri',
        relativePath: './images/test.jpg',
        requestId: 'test-123',
      };

      (provider as any).handleResolveImageUri(message, document, mockWebview);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageUriResolved',
          requestId: 'test-123',
        })
      );
    });

    it('should handle error when no base path available', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      // Mock getImageBasePath to return null
      jest.spyOn(provider as any, 'getImageBasePath').mockReturnValue(null);

      const message = {
        type: 'resolveImageUri',
        relativePath: './images/test.jpg',
        requestId: 'test-123',
      };

      (provider as any).handleResolveImageUri(message, document, mockWebview);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageUriResolved',
          requestId: 'test-123',
          webviewUri: '',
          error: 'Cannot resolve image path: no base directory available',
        })
      );
    });
  });

  describe('handleSaveImage', () => {
    it('should save image relative to the document folder when imagePathBase=relativeToDocument', async () => {
      const document = createMockTextDocument('content');
      document.uri = {
        scheme: 'file',
        fsPath: '/workspace/docs/document.md',
        toString: () => 'file:/workspace/docs/document.md',
      } as any;

      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue({
        uri: { fsPath: '/workspace' },
      });
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
        get: jest.fn((key: string, defaultValue?: unknown) => {
          if (key === 'markdownForHumans.imagePathBase') return 'relativeToDocument';
          return defaultValue;
        }),
        update: jest.fn(),
      });

      (vscode.workspace.fs.createDirectory as jest.Mock).mockResolvedValue(undefined);
      (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const message = {
        type: 'saveImage',
        placeholderId: 'placeholder-1',
        name: 'test.jpg',
        data: [1, 2, 3],
        targetFolder: 'images',
      };

      await (provider as any).handleSaveImage(message, document, mockWebview);

      expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining('/workspace/docs/images') })
      );
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageSaved',
          newSrc: './images/test.jpg',
        })
      );
    });

    it('should save image under workspace folder when imagePathBase=workspaceFolder and return a relative markdown link', async () => {
      const document = createMockTextDocument('content');
      document.uri = {
        scheme: 'file',
        fsPath: '/workspace/docs/document.md',
        toString: () => 'file:/workspace/docs/document.md',
      } as any;

      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue({
        uri: { fsPath: '/workspace' },
      });
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
        get: jest.fn((key: string, defaultValue?: unknown) => {
          if (key === 'markdownForHumans.imagePathBase') return 'workspaceFolder';
          return defaultValue;
        }),
        update: jest.fn(),
      });

      (vscode.workspace.fs.createDirectory as jest.Mock).mockResolvedValue(undefined);
      (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const message = {
        type: 'saveImage',
        placeholderId: 'placeholder-1',
        name: 'test.jpg',
        data: [1, 2, 3],
        targetFolder: 'images',
      };

      await (provider as any).handleSaveImage(message, document, mockWebview);

      expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining('/workspace/images') })
      );
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageSaved',
          newSrc: '../images/test.jpg',
        })
      );
    });

    it('should save image to workspace folder for untitled file in workspace', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);
      (vscode.workspace.fs.createDirectory as jest.Mock).mockResolvedValue(undefined);
      (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const message = {
        type: 'saveImage',
        placeholderId: 'placeholder-1',
        name: 'test.jpg',
        data: [1, 2, 3],
        targetFolder: 'images',
      };

      await (provider as any).handleSaveImage(message, document, mockWebview);

      expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining('/workspace/images') })
      );
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageSaved',
          newSrc: './images/test.jpg',
        })
      );
    });

    it('should avoid overwriting an existing image by suffixing the filename', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);
      (vscode.workspace.fs.createDirectory as jest.Mock).mockResolvedValue(undefined);
      (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (vscode.workspace.fs.stat as jest.Mock).mockImplementation((uri: any) => {
        if (uri.fsPath === '/workspace/images/test.jpg') {
          return Promise.resolve({} as any);
        }
        if (uri.fsPath === '/workspace/images/test-2.jpg') {
          return Promise.reject(new Error('ENOENT'));
        }
        return Promise.reject(new Error(`Unexpected path: ${uri.fsPath}`));
      });

      const message = {
        type: 'saveImage',
        placeholderId: 'placeholder-1',
        name: 'test.jpg',
        data: [1, 2, 3],
        targetFolder: 'images',
      };

      await (provider as any).handleSaveImage(message, document, mockWebview);

      expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: '/workspace/images/test-2.jpg' }),
        expect.any(Uint8Array)
      );
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageSaved',
          newSrc: './images/test-2.jpg',
        })
      );
    });

    it('should save image to home directory for untitled file without workspace', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = undefined;
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);
      (vscode.workspace.fs.createDirectory as jest.Mock).mockResolvedValue(undefined);
      (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const message = {
        type: 'saveImage',
        placeholderId: 'placeholder-1',
        name: 'test.jpg',
        data: [1, 2, 3],
        targetFolder: 'images',
      };

      await (provider as any).handleSaveImage(message, document, mockWebview);

      const homeDir = os.homedir();
      expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining(homeDir) })
      );
    });

    it('should show error when no base path available', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      jest.spyOn(provider as any, 'getImageBasePath').mockReturnValue(null);

      const message = {
        type: 'saveImage',
        placeholderId: 'placeholder-1',
        name: 'test.jpg',
        data: [1, 2, 3],
      };

      await (provider as any).handleSaveImage(message, document, mockWebview);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Cannot save image')
      );
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageError',
          error: expect.stringContaining('no base directory'),
        })
      );
    });
  });

  describe('handleCopyLocalImageToWorkspace', () => {
    it('should copy image under workspace folder when imagePathBase=workspaceFolder and return a relative markdown link', async () => {
      const document = createMockTextDocument('content');
      document.uri = {
        scheme: 'file',
        fsPath: '/workspace/docs/document.md',
        toString: () => 'file:/workspace/docs/document.md',
      } as any;

      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue({
        uri: { fsPath: '/workspace' },
      });
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
        get: jest.fn((key: string, defaultValue?: unknown) => {
          if (key === 'markdownForHumans.imagePathBase') return 'workspaceFolder';
          return defaultValue;
        }),
        update: jest.fn(),
      });

      (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(new Uint8Array([1, 2, 3]));
      (vscode.workspace.fs.createDirectory as jest.Mock).mockResolvedValue(undefined);
      (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const message = {
        type: 'copyLocalImageToWorkspace',
        absolutePath: '/external/pic.png',
        placeholderId: 'placeholder-1',
        targetFolder: 'images',
      };

      await (provider as any).handleCopyLocalImageToWorkspace(message, document, mockWebview);

      expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: expect.stringContaining('/workspace/images') })
      );
      expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({ fsPath: '/workspace/images/pic.png' }),
        expect.any(Uint8Array)
      );
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'localImageCopied',
          relativePath: '../images/pic.png',
          originalPath: '/external/pic.png',
        })
      );
    });
  });

  describe('handleWorkspaceImage', () => {
    it('should compute relative path from workspace folder for untitled file', () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);

      const message = {
        type: 'handleWorkspaceImage',
        sourcePath: '/workspace/images/photo.jpg',
        fileName: 'photo.jpg',
        insertPosition: 0,
      };

      (provider as any).handleWorkspaceImage(message, document, mockWebview);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'insertWorkspaceImage',
          relativePath: expect.stringContaining('images/photo.jpg'),
        })
      );
    });
  });

  describe('Integration - Full workflow', () => {
    it('should handle complete image workflow for untitled file in workspace', async () => {
      const document = createMockTextDocument('content');
      document.uri = { scheme: 'untitled', toString: () => 'untitled:Untitled-1' } as any;
      (vscode.workspace.workspaceFolders as any) = [{ uri: { fsPath: '/workspace' } }];
      (vscode.workspace.getWorkspaceFolder as jest.Mock).mockReturnValue(null);
      (vscode.workspace.fs.createDirectory as jest.Mock).mockResolvedValue(undefined);
      (vscode.workspace.fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      // First stat call during save should treat file as non-existent,
      // subsequent calls (e.g. workspace image check) should succeed.
      (vscode.workspace.fs.stat as jest.Mock)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValue({} as any);

      // 1. Resolve image URI
      const resolveMessage = {
        type: 'resolveImageUri',
        relativePath: './images/test.jpg',
        requestId: 'resolve-1',
      };
      (provider as any).handleResolveImageUri(resolveMessage, document, mockWebview);
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'imageUriResolved' })
      );

      // 2. Save image
      const saveMessage = {
        type: 'saveImage',
        placeholderId: 'placeholder-1',
        name: 'test.jpg',
        data: [1, 2, 3],
        targetFolder: 'images',
      };
      await (provider as any).handleSaveImage(saveMessage, document, mockWebview);
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'imageSaved' })
      );

      // 3. Check image in workspace
      const checkMessage = {
        type: 'checkImageInWorkspace',
        imagePath: './images/test.jpg',
        requestId: 'check-1',
      };
      await (provider as any).handleCheckImageInWorkspace(checkMessage, document, mockWebview);
      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'imageWorkspaceCheck' })
      );
    });
  });
});
