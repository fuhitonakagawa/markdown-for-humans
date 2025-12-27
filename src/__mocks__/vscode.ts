/**
 * Mock VS Code API for unit testing
 *
 * This provides minimal mocks for VS Code APIs used in our extension.
 * For integration tests that need real VS Code, use @vscode/test-electron.
 */

// Mock StatusBarItem
export const mockStatusBarItem = {
  text: '',
  tooltip: '',
  command: undefined as string | undefined,
  show: jest.fn(),
  hide: jest.fn(),
  dispose: jest.fn(),
};

// Mock StatusBarAlignment enum
export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15,
}

// Mock window API
export const window = {
  createStatusBarItem: jest.fn(() => mockStatusBarItem),
  activeTextEditor: undefined as unknown,
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeTextEditorSelection: jest.fn(() => ({ dispose: jest.fn() })),
  withProgress: jest.fn((_options, task) => {
    return task(
      {
        report: jest.fn(),
      },
      { isCancellationRequested: false, onCancellationRequested: jest.fn() }
    );
  }),
  showSaveDialog: jest.fn(),
  showOpenDialog: jest.fn(),
};

// Mock workspace API
export const workspace = {
  onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  getWorkspaceFolder: jest.fn(),
  workspaceFolders: undefined as any,
  getConfiguration: jest.fn(() => ({
    get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
    update: jest.fn(),
  })),
  applyEdit: jest.fn(async (_edit?: unknown) => true),
};

// Mock commands API
export const commands = {
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  executeCommand: jest.fn(),
};

// Mock Uri
export const Uri = {
  file: jest.fn((path: string) => ({ fsPath: path, path, scheme: 'file' })),
  parse: jest.fn((uri: string) => ({
    fsPath: uri,
    path: uri,
    uri,
    scheme: 'file',
    toString: () => uri,
  })),
};

// Mock env API
export const env = {
  openExternal: jest.fn(),
};

// Mock ConfigurationTarget enum
export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

// Mock TextDocument
export function createMockTextDocument(content: string, languageId = 'markdown'): any {
  return {
    getText: jest.fn((range?: any) => {
      if (range) {
        // Simplified range extraction
        return content;
      }
      return content;
    }),
    languageId,
    uri: Uri.file('/test/document.md'),
    fileName: '/test/document.md',
    lineCount: content.split('\n').length,
    lineAt: jest.fn((line: number) => ({
      text: content.split('\n')[line] || '',
      lineNumber: line,
    })),
  };
}

// Mock Selection
export class Selection {
  constructor(
    public anchor: { line: number; character: number },
    public active: { line: number; character: number }
  ) {}

  get isEmpty(): boolean {
    return this.anchor.line === this.active.line && this.anchor.character === this.active.character;
  }
}

// Mock TextEditor
export function createMockTextEditor(document: any, selection?: Selection): any {
  return {
    document,
    selection: selection || new Selection({ line: 0, character: 0 }, { line: 0, character: 0 }),
    selections: [selection || new Selection({ line: 0, character: 0 }, { line: 0, character: 0 })],
  };
}

// Reset all mocks helper
export function resetAllMocks() {
  jest.clearAllMocks();
  mockStatusBarItem.text = '';
  mockStatusBarItem.tooltip = '';
  mockStatusBarItem.command = undefined;
  window.activeTextEditor = undefined;
}

// Default export for module mock
// Minimal Position class
export class Position {
  constructor(
    public line: number,
    public character: number
  ) {}
}

// Tree item + visuals
export class TreeItem {
  public iconPath: any;
  public description?: string;
  public command?: any;
  public contextValue?: string;
  constructor(
    public label: string,
    public collapsibleState?: any
  ) {}
}

export class EventEmitter<T> {
  public event = jest.fn();
  fire = jest.fn((_data?: T) => {});
  dispose = jest.fn();
}

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2,
};

export class ThemeIcon {
  constructor(
    public id: string,
    public color?: any
  ) {}
}

export class ThemeColor {
  constructor(public id: string) {}
}

export default {
  window,
  workspace,
  commands,
  Uri,
  StatusBarAlignment,
  ProgressLocation,
  Selection,
  TreeItem,
  EventEmitter,
  TreeItemCollapsibleState,
  ThemeIcon,
  ThemeColor,
};

// Minimal Range class
export class Range {
  constructor(
    public start: Position,
    public end: Position
  ) {}
}

// Minimal WorkspaceEdit mock
export class WorkspaceEdit {
  public replaces: Array<{ uri: any; range: Range; text: string }> = [];

  replace(uri: any, range: Range, text: string) {
    this.replaces.push({ uri, range, text });
  }
}
