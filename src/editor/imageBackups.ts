import * as path from 'path';
import * as vscode from 'vscode';

export function formatBackupTimestamp(date: Date): string {
  // Use UTC for deterministic, timezone-agnostic timestamps.
  // Format: YYYYMMDD-HHmmss
  const iso = date.toISOString(); // e.g. 2025-12-15T12:34:56.000Z
  const yyyymmdd = iso.slice(0, 10).replace(/-/g, '');
  const hhmmss = iso.slice(11, 19).replace(/:/g, '');
  return `${yyyymmdd}-${hhmmss}`;
}

function sanitizeStem(stem: string): string {
  const sanitized = stem
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return sanitized || 'image';
}

export function cleanStemForBackup(stem: string): string {
  let result = stem;

  // Strip repeated "backup_" / "original_" prefixes.
  // Example: backup_original_cat_800x600px -> cat_800x600px
  while (result.startsWith('backup_') || result.startsWith('original_')) {
    if (result.startsWith('backup_')) {
      result = result.slice('backup_'.length);
      continue;
    }
    if (result.startsWith('original_')) {
      result = result.slice('original_'.length);
      continue;
    }
  }

  // Strip legacy resize patterns with timestamp+dimensions:
  // {name}_{13digits}_{w}x{h}px
  result = result.replace(/_\d{13}_\d+x\d+px$/, '');

  // Strip trailing _{w}x{h}px
  result = result.replace(/_\d+x\d+px$/, '');

  // Strip older backup naming: {name}-backup-{YYYYMMDDHHmmss} or {name}-backup-{13digits}
  result = result.replace(/-backup-\d{13,14}$/, '');

  return sanitizeStem(result);
}

/**
 * Resolves backup file path with collision detection.
 * If the initial path exists, appends -2, -3, etc. before the extension until a unique path is found.
 */
export async function resolveBackupPathWithCollisionDetection(
  initialPath: string
): Promise<string> {
  let candidatePath = initialPath;
  let counter = 1;

  while (true) {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(candidatePath));
      // File exists, try next counter
      counter++;
      const ext = path.extname(initialPath);
      const baseWithoutExt = ext ? initialPath.slice(0, -ext.length) : initialPath;
      candidatePath = `${baseWithoutExt}-${counter}${ext}`;
    } catch {
      // File doesn't exist, this path is available
      return candidatePath;
    }
  }
}

export function buildResizeBackupLocation(params: {
  backupWorkspaceRoot: string;
  imageAbsolutePath: string;
  oldWidth: number;
  oldHeight: number;
  now: Date;
}): {
  backupRoot: string;
  relativeImageDir: string;
  cleanStem: string;
  timestamp: string;
  backupDir: string;
  backupFilename: string;
  backupFilePath: string;
} {
  const { backupWorkspaceRoot, imageAbsolutePath, oldWidth, oldHeight, now } = params;

  const backupRoot = path.join(backupWorkspaceRoot, '.md4h', 'image-backups');
  const imageDir = path.dirname(imageAbsolutePath);

  // Determine if image is external (outside workspace root)
  const relativeImageDir = path.relative(backupWorkspaceRoot, imageDir);
  const isExternal = relativeImageDir.startsWith('..');
  // Keep relativeImageDir for return value (backward compatibility), but don't use it in path
  const relativeImageDirForReturn = isExternal ? '_external' : '';

  const ext = path.extname(imageAbsolutePath) || '';
  const rawStem = path.basename(imageAbsolutePath, ext);
  const cleanStem = cleanStemForBackup(rawStem);
  const timestamp = formatBackupTimestamp(now);

  // Flat structure: backupDir is just backupRoot, filename includes timestamp
  const backupDir = backupRoot;
  const externalSuffix = isExternal ? '_external' : '';
  const backupFilename = `original_${cleanStem}_${oldWidth}x${oldHeight}px_${timestamp}${externalSuffix}${ext}`;
  const backupFilePath = path.join(backupDir, backupFilename);

  return {
    backupRoot,
    relativeImageDir: relativeImageDirForReturn,
    cleanStem,
    timestamp,
    backupDir,
    backupFilename,
    backupFilePath,
  };
}
