import * as fs from 'node:fs';
import * as path from 'path';

describe('package manifest editor title action', () => {
  it('contributes markdown toggle commands with editor/title menu entries', () => {
    const manifestPath = path.resolve(__dirname, '../../../package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
      contributes?: {
        commands?: Array<{ command: string; icon?: string; title?: string }>;
        menus?: {
          ['editor/title']?: Array<{ command: string; when?: string; group?: string }>;
        };
      };
    };

    const commands = manifest?.contributes?.commands;
    const openFileCommand = commands?.find(item => item.command === 'markdownForHumans.openFile');
    expect(openFileCommand).toBeDefined();
    expect(openFileCommand?.icon).toBe('$(edit)');

    const command = commands?.find(item => item.command === 'markdownForHumans.backToMarkdown');
    expect(command).toBeDefined();
    expect(command?.icon).toBe('$(edit)');

    const editorTitleMenus = manifest?.contributes?.menus?.['editor/title'];
    const enableItem = editorTitleMenus?.find(
      item => item.command === 'markdownForHumans.openFile'
    );
    const menuItem = editorTitleMenus?.find(
      item => item.command === 'markdownForHumans.backToMarkdown'
    );

    expect(enableItem).toBeDefined();
    expect(enableItem?.when).toBe(
      '(resourceExtname == .md || resourceExtname == .markdown || resourceLangId == markdown) && activeCustomEditorId != markdownForHumansLocalFork.editor'
    );
    expect(enableItem?.group).toBe('navigation@1');

    expect(menuItem).toBeDefined();
    expect(menuItem?.when).toBe('activeCustomEditorId == markdownForHumansLocalFork.editor');
    expect(menuItem?.group).toBe('navigation@2');
  });
});
