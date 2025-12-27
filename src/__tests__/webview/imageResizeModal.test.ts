/** @jest-environment jsdom */

/**
 * Image Resize Modal Tests
 *
 * Focuses on the logic we can unit test without a full browser:
 * - External image detection
 * - External image guard (error message)
 * - History tracking + undo/redo limits
 */

import {
  handleImageResized,
  hideImageResizeModal,
  isExternalImage,
  redoImageResize,
  showImageResizeModal,
  undoImageResize,
} from '../../webview/features/imageResizeModal';
import { Editor } from '@tiptap/core';

describe('imageResizeModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    hideImageResizeModal();
    (window as unknown as { _workspaceCheckCallbacks?: unknown })._workspaceCheckCallbacks =
      undefined;
  });

  describe('isExternalImage', () => {
    it('detects http/https as external', () => {
      expect(isExternalImage('http://example.com/img.png')).toBe(true);
      expect(isExternalImage('https://example.com/img.png')).toBe(true);
    });

    it('treats local and data URIs as non-external', () => {
      expect(isExternalImage('/images/pic.png')).toBe(false);
      expect(isExternalImage('vscode-webview://resource')).toBe(false);
      expect(isExternalImage('data:image/png;base64,abc')).toBe(false);
      expect(isExternalImage('')).toBe(false);
    });
  });

  describe('external image guard', () => {
    it('shows error message instead of opening modal for external images', async () => {
      const img = document.createElement('img');
      img.setAttribute('data-markdown-src', 'https://example.com/photo.png');

      const postMessage = jest.fn();
      const vscodeApi = { postMessage };
      const editor = {} as unknown as Editor;

      await showImageResizeModal(img, editor, vscodeApi);

      expect(postMessage).toHaveBeenCalledWith({
        type: 'showError',
        message:
          'Cannot resize external images. Please download the image to your workspace first, then you can resize it.',
      });
      expect(document.querySelector('.image-resize-modal-overlay')).toBeNull();
    });
  });

  describe('workspace check fallback', () => {
    it('opens the resize modal even if the workspace check never responds', async () => {
      jest.useFakeTimers();

      const img = document.createElement('img');
      img.setAttribute('data-markdown-src', './images/foo.png');
      Object.defineProperty(img, 'naturalWidth', { value: 120 });
      Object.defineProperty(img, 'naturalHeight', { value: 80 });

      const vscodeApi = { postMessage: jest.fn() };
      const editor = {} as unknown as Editor;

      const openPromise = showImageResizeModal(img, editor, vscodeApi);

      // No imageWorkspaceCheck message will arrive in this test; the modal should still open.
      jest.advanceTimersByTime(2000);
      await openPromise;

      expect(document.querySelector('.image-resize-modal-overlay')).not.toBeNull();
      jest.useRealTimers();
    });
  });

  describe('history + undo/redo', () => {
    const createImage = () => {
      const img = document.createElement('img');
      img.setAttribute('data-markdown-src', '/foo.png');
      Object.defineProperty(img, 'naturalWidth', { value: 120 });
      Object.defineProperty(img, 'naturalHeight', { value: 80 });
      return img;
    };

    it('caps history at 10 entries and undoes the latest resize', () => {
      const img = createImage();

      // Build history with more than 10 entries
      for (let i = 0; i < 12; i++) {
        img.style.width = `${120 - i}px`;
        img.style.height = `${80 - i}px`;
        handleImageResized(`backup-${i}.png`, img);
      }

      const vscodeApi = { postMessage: jest.fn() };

      // First undo should use the most recent backup
      undoImageResize(img, vscodeApi);
      expect(vscodeApi.postMessage).toHaveBeenCalledWith({
        type: 'undoResize',
        imagePath: '/foo.png',
        backupPath: 'backup-11.png',
      });

      vscodeApi.postMessage.mockClear();

      // Only 10 history entries should be undoable
      for (let i = 0; i < 12; i++) {
        undoImageResize(img, vscodeApi);
      }
      expect(vscodeApi.postMessage).toHaveBeenCalledTimes(9);
    });

    it('replays redo after an undo using stored dimensions', () => {
      const img = createImage();

      img.style.width = '110px';
      img.style.height = '70px';
      (img as unknown as { _pendingResizeDataUrl?: string })._pendingResizeDataUrl =
        'data:image/png;base64,AAA=';
      handleImageResized('backup-1.png', img);

      img.style.width = '100px';
      img.style.height = '60px';
      const resizedDataUrl = 'data:image/png;base64,BBB=';
      (img as unknown as { _pendingResizeDataUrl?: string })._pendingResizeDataUrl = resizedDataUrl;
      handleImageResized('backup-2.png', img);

      const vscodeApi = { postMessage: jest.fn() };

      // Undo the last change, then redo it
      undoImageResize(img, vscodeApi);
      vscodeApi.postMessage.mockClear();

      redoImageResize(img, vscodeApi);

      expect(vscodeApi.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'redoResize',
          imagePath: '/foo.png',
          newWidth: 100,
          newHeight: 60,
          imageData: resizedDataUrl,
        })
      );
    });
  });

  // Inactivity auto-close removed per UX request; covered implicitly by modal close tests
});
