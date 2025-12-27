/** @jest-environment jsdom */

import { showImageResizeWarning } from '../../webview/features/imageResizeWarning';

describe('imageResizeWarning', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves with confirmation when user clicks Resize', async () => {
    const promise = showImageResizeWarning();

    const resizeButton = document.querySelector('#resize-btn') as HTMLButtonElement;
    expect(resizeButton).not.toBeNull();

    resizeButton.click();

    await expect(promise).resolves.toEqual({
      confirmed: true,
      neverAskAgain: false,
    });
    expect(document.querySelector('.image-resize-warning-overlay')).toBeNull();
  });

  it('returns neverAskAgain when checkbox is selected', async () => {
    const promise = showImageResizeWarning();

    const checkbox = document.querySelector('#never-ask-again') as HTMLInputElement;
    const resizeButton = document.querySelector('#resize-btn') as HTMLButtonElement;

    checkbox.checked = true;
    resizeButton.click();

    await expect(promise).resolves.toEqual({
      confirmed: true,
      neverAskAgain: true,
    });
  });

  it('returns null when user cancels', async () => {
    const promise = showImageResizeWarning();

    const cancelButton = document.querySelector('#cancel-btn') as HTMLButtonElement;
    cancelButton.click();

    await expect(promise).resolves.toBeNull();
    expect(document.querySelector('.image-resize-warning-overlay')).toBeNull();
  });
});
