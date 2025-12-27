import * as path from 'path';
import * as vscode from 'vscode';
import {
  buildResizeBackupLocation,
  cleanStemForBackup,
  formatBackupTimestamp,
  resolveBackupPathWithCollisionDetection,
} from '../../editor/imageBackups';

jest.mock('vscode', () => ({
  workspace: {
    fs: {
      stat: jest.fn(),
    },
  },
  Uri: {
    file: jest.fn((p: string) => ({ fsPath: p, scheme: 'file' })),
  },
}));

describe('formatBackupTimestamp', () => {
  it('formats as YYYYMMDD-HHmmss', () => {
    const result = formatBackupTimestamp(new Date('2025-12-15T12:34:56.000Z'));
    expect(result).toBe('20251215-123456');
  });
});

describe('cleanStemForBackup', () => {
  it('strips trailing _{width}x{height}px', () => {
    expect(cleanStemForBackup('cat_800x600px')).toBe('cat');
  });

  it('strips trailing _{timestamp}_{width}x{height}px', () => {
    expect(cleanStemForBackup('pasted_cat_1700000000000_800x600px')).toBe('pasted_cat');
  });

  it('strips backup/original prefixes (repeated)', () => {
    expect(cleanStemForBackup('backup_original_cat_800x600px')).toBe('cat');
  });

  it('strips legacy -backup-{timestamp}', () => {
    expect(cleanStemForBackup('cat-backup-20251215123456')).toBe('cat');
  });
});

describe('buildResizeBackupLocation', () => {
  it('creates flat backup path in single directory', () => {
    const location = buildResizeBackupLocation({
      backupWorkspaceRoot: '/workspace',
      imageAbsolutePath: '/workspace/docs/images/cat.png',
      oldWidth: 800,
      oldHeight: 600,
      now: new Date('2025-12-15T12:34:56.000Z'),
    });

    expect(location.backupDir).toBe(path.join('/workspace', '.md4h', 'image-backups'));
    expect(location.backupFilename).toBe('original_cat_800x600px_20251215-123456.png');
    expect(location.backupFilePath).toBe(
      path.join(
        '/workspace',
        '.md4h',
        'image-backups',
        'original_cat_800x600px_20251215-123456.png'
      )
    );
  });

  it('adds _external suffix when the image is outside the workspace root', () => {
    const location = buildResizeBackupLocation({
      backupWorkspaceRoot: '/workspace',
      imageAbsolutePath: '/Users/me/Pictures/cat.png',
      oldWidth: 800,
      oldHeight: 600,
      now: new Date('2025-12-15T12:34:56.000Z'),
    });

    expect(location.backupDir).toBe(path.join('/workspace', '.md4h', 'image-backups'));
    expect(location.backupFilename).toBe('original_cat_800x600px_20251215-123456_external.png');
    expect(location.backupFilePath).toBe(
      path.join(
        '/workspace',
        '.md4h',
        'image-backups',
        'original_cat_800x600px_20251215-123456_external.png'
      )
    );
  });

  it('handles root-level images without directory prefix', () => {
    const location = buildResizeBackupLocation({
      backupWorkspaceRoot: '/workspace',
      imageAbsolutePath: '/workspace/image.png',
      oldWidth: 400,
      oldHeight: 300,
      now: new Date('2025-12-15T12:34:56.000Z'),
    });

    expect(location.backupDir).toBe(path.join('/workspace', '.md4h', 'image-backups'));
    expect(location.backupFilename).toBe('original_image_400x300px_20251215-123456.png');
    expect(location.backupFilePath).toBe(
      path.join(
        '/workspace',
        '.md4h',
        'image-backups',
        'original_image_400x300px_20251215-123456.png'
      )
    );
  });

  it('handles images with special characters in filename', () => {
    const location = buildResizeBackupLocation({
      backupWorkspaceRoot: '/workspace',
      imageAbsolutePath: '/workspace/images/my image (1).png',
      oldWidth: 1920,
      oldHeight: 1080,
      now: new Date('2025-12-15T12:34:56.000Z'),
    });

    expect(location.backupDir).toBe(path.join('/workspace', '.md4h', 'image-backups'));
    // Special characters should be sanitized by cleanStemForBackup
    expect(location.backupFilename).toMatch(/^original_my-image-1_\d+x\d+px_20251215-123456\.png$/);
    expect(location.backupFilePath).toContain('.md4h/image-backups');
  });

  it('handles images in deeply nested directories', () => {
    const location = buildResizeBackupLocation({
      backupWorkspaceRoot: '/workspace',
      imageAbsolutePath: '/workspace/docs/projects/2025/images/photo.jpg',
      oldWidth: 1600,
      oldHeight: 1200,
      now: new Date('2025-12-15T12:34:56.000Z'),
    });

    expect(location.backupDir).toBe(path.join('/workspace', '.md4h', 'image-backups'));
    // Should still be flat, not nested
    expect(location.backupFilename).toBe('original_photo_1600x1200px_20251215-123456.jpg');
    expect(location.backupFilePath).toBe(
      path.join(
        '/workspace',
        '.md4h',
        'image-backups',
        'original_photo_1600x1200px_20251215-123456.jpg'
      )
    );
  });

  it('handles images with no extension', () => {
    const location = buildResizeBackupLocation({
      backupWorkspaceRoot: '/workspace',
      imageAbsolutePath: '/workspace/images/raw-image',
      oldWidth: 800,
      oldHeight: 600,
      now: new Date('2025-12-15T12:34:56.000Z'),
    });

    expect(location.backupDir).toBe(path.join('/workspace', '.md4h', 'image-backups'));
    expect(location.backupFilename).toBe('original_raw-image_800x600px_20251215-123456');
    expect(location.backupFilePath).toBe(
      path.join(
        '/workspace',
        '.md4h',
        'image-backups',
        'original_raw-image_800x600px_20251215-123456'
      )
    );
  });

  it('preserves return value structure for backward compatibility', () => {
    const location = buildResizeBackupLocation({
      backupWorkspaceRoot: '/workspace',
      imageAbsolutePath: '/workspace/images/cat.png',
      oldWidth: 800,
      oldHeight: 600,
      now: new Date('2025-12-15T12:34:56.000Z'),
    });

    // All expected return values should be present
    expect(location).toHaveProperty('backupRoot');
    expect(location).toHaveProperty('relativeImageDir');
    expect(location).toHaveProperty('cleanStem');
    expect(location).toHaveProperty('timestamp');
    expect(location).toHaveProperty('backupDir');
    expect(location).toHaveProperty('backupFilename');
    expect(location).toHaveProperty('backupFilePath');

    // backupDir should equal backupRoot for flat structure
    expect(location.backupDir).toBe(location.backupRoot);
  });
});

describe('resolveBackupPathWithCollisionDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns original path if file does not exist', async () => {
    (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

    const result = await resolveBackupPathWithCollisionDetection(
      '/backup/original_cat_800x600px_20251215-123456.png'
    );

    expect(result).toBe('/backup/original_cat_800x600px_20251215-123456.png');
    expect(vscode.workspace.fs.stat).toHaveBeenCalledTimes(1);
  });

  it('appends -2 if original path exists', async () => {
    (vscode.workspace.fs.stat as jest.Mock)
      .mockResolvedValueOnce({} as vscode.FileStat) // First call: file exists
      .mockRejectedValueOnce(new Error('File not found')); // Second call: -2 version doesn't exist

    const result = await resolveBackupPathWithCollisionDetection(
      '/backup/original_cat_800x600px_20251215-123456.png'
    );

    expect(result).toBe('/backup/original_cat_800x600px_20251215-123456-2.png');
    expect(vscode.workspace.fs.stat).toHaveBeenCalledTimes(2);
  });

  it('appends -3 if -2 also exists', async () => {
    (vscode.workspace.fs.stat as jest.Mock)
      .mockResolvedValueOnce({} as vscode.FileStat) // Original exists
      .mockResolvedValueOnce({} as vscode.FileStat) // -2 exists
      .mockRejectedValueOnce(new Error('File not found')); // -3 doesn't exist

    const result = await resolveBackupPathWithCollisionDetection(
      '/backup/original_cat_800x600px_20251215-123456.png'
    );

    expect(result).toBe('/backup/original_cat_800x600px_20251215-123456-3.png');
    expect(vscode.workspace.fs.stat).toHaveBeenCalledTimes(3);
  });

  it('handles files without extension', async () => {
    (vscode.workspace.fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

    const result = await resolveBackupPathWithCollisionDetection(
      '/backup/original_cat_800x600px_20251215-123456'
    );

    expect(result).toBe('/backup/original_cat_800x600px_20251215-123456');
  });

  it('handles collision for files without extension', async () => {
    (vscode.workspace.fs.stat as jest.Mock)
      .mockResolvedValueOnce({} as vscode.FileStat)
      .mockRejectedValueOnce(new Error('File not found'));

    const result = await resolveBackupPathWithCollisionDetection(
      '/backup/original_cat_800x600px_20251215-123456'
    );

    expect(result).toBe('/backup/original_cat_800x600px_20251215-123456-2');
  });

  it('handles multiple collisions sequentially', async () => {
    (vscode.workspace.fs.stat as jest.Mock)
      .mockResolvedValueOnce({} as vscode.FileStat) // Original exists
      .mockResolvedValueOnce({} as vscode.FileStat) // -2 exists
      .mockResolvedValueOnce({} as vscode.FileStat) // -3 exists
      .mockResolvedValueOnce({} as vscode.FileStat) // -4 exists
      .mockRejectedValueOnce(new Error('File not found')); // -5 doesn't exist

    const result = await resolveBackupPathWithCollisionDetection(
      '/backup/original_cat_800x600px_20251215-123456.png'
    );

    expect(result).toBe('/backup/original_cat_800x600px_20251215-123456-5.png');
    expect(vscode.workspace.fs.stat).toHaveBeenCalledTimes(5);
  });

  it('handles files with multiple dots (path.extname returns last extension)', async () => {
    (vscode.workspace.fs.stat as jest.Mock)
      .mockResolvedValueOnce({} as vscode.FileStat)
      .mockRejectedValueOnce(new Error('File not found'));

    const result = await resolveBackupPathWithCollisionDetection(
      '/backup/original_cat_800x600px_20251215-123456.tar.gz'
    );

    // path.extname('.tar.gz') returns '.gz', so counter is inserted before .gz
    // This is acceptable behavior for image files which typically have single extensions
    expect(result).toBe('/backup/original_cat_800x600px_20251215-123456.tar-2.gz');
  });
});
