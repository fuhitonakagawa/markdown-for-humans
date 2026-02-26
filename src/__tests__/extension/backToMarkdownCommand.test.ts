import * as vscode from 'vscode';
import { activate } from '../../extension';

jest.mock('../../editor/MarkdownEditorProvider', () => ({
  MarkdownEditorProvider: {
    register: jest.fn(() => ({ dispose: jest.fn() })),
  },
}));

jest.mock('../../features/wordCount', () => ({
  WordCountFeature: jest.fn().mockImplementation(() => ({
    activate: jest.fn(),
    showDetailedStats: jest.fn(),
  })),
}));

jest.mock('../../activeWebview', () => ({
  getActiveWebviewPanel: jest.fn(() => undefined),
}));

jest.mock('../../features/outlineView', () => ({
  outlineViewProvider: {
    setTreeView: jest.fn(),
    revealActive: jest.fn(),
    showFilterInput: jest.fn(),
    clearFilter: jest.fn(),
  },
}));

describe('extension back-to-markdown command registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
    Object.assign(vscode.window, {
      createTreeView: jest.fn(() => ({ dispose: jest.fn() })),
    });
  });

  it('registers markdownForHumans.backToMarkdown command', () => {
    activate({ subscriptions: [] } as unknown as vscode.ExtensionContext);

    const commandIds = (vscode.commands.registerCommand as jest.Mock).mock.calls.map(
      call => call[0]
    );
    expect(commandIds).toContain('markdownForHumans.backToMarkdown');
  });

  it('opens the provided URI with the default editor when command is invoked', async () => {
    activate({ subscriptions: [] } as unknown as vscode.ExtensionContext);

    const registerCall = (vscode.commands.registerCommand as jest.Mock).mock.calls.find(
      call => call[0] === 'markdownForHumans.backToMarkdown'
    );
    const commandHandler = registerCall?.[1] as ((uri?: vscode.Uri) => Promise<void>) | undefined;
    expect(commandHandler).toBeDefined();

    const uri = vscode.Uri.parse('file:///tmp/sample.md');
    await commandHandler?.(uri);

    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('vscode.openWith', uri, 'default');
  });
});
