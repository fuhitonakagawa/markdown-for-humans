/** @jest-environment jsdom */

import { CustomImage } from '../../webview/extensions/customImage';

describe('CustomImage indentation', () => {
  beforeEach(() => {
    delete (window as any).resolveImagePath;
    delete (window as any)._imageCacheBust;
  });

  it('applies indentation styles based on indent-prefix attr', () => {
    const extension = CustomImage.configure({
      allowBase64: true,
      HTMLAttributes: { class: 'markdown-image' },
    });

    const nodeViewFactory = (extension as any).config?.addNodeView?.();
    expect(typeof nodeViewFactory).toBe('function');

    const node = {
      attrs: {
        src: './img.png',
        alt: 'alt',
        'indent-prefix': '    ', // 4 spaces
      },
    };

    const nodeView = nodeViewFactory({
      node,
      HTMLAttributes: { class: 'markdown-image' },
      editor: {},
    });

    const wrapper = nodeView.dom as HTMLElement;
    expect(wrapper.style.marginLeft).toBe('30px');
    expect(wrapper.style.maxWidth).toBe('calc(100% - 30px)');
  });

  it('does not apply indentation styles when indent-prefix is missing', () => {
    const extension = CustomImage.configure({
      allowBase64: true,
      HTMLAttributes: { class: 'markdown-image' },
    });

    const nodeViewFactory = (extension as any).config?.addNodeView?.();
    expect(typeof nodeViewFactory).toBe('function');

    const node = {
      attrs: {
        src: './img.png',
        alt: 'alt',
      },
    };

    const nodeView = nodeViewFactory({
      node,
      HTMLAttributes: { class: 'markdown-image' },
      editor: {},
    });

    const wrapper = nodeView.dom as HTMLElement;
    expect(wrapper.style.marginLeft).toBe('');
    expect(wrapper.style.maxWidth).toBe('');
  });

  it('adds a cache-busting query param when a timestamp exists for the markdown path', async () => {
    (window as any)._imageCacheBust = new Map([['./img.png', 123]]);
    (window as any).resolveImagePath = jest.fn().mockResolvedValue('vscode-webview://test/img.png');

    const extension = CustomImage.configure({
      allowBase64: true,
      HTMLAttributes: { class: 'markdown-image' },
    });

    const nodeViewFactory = (extension as any).config?.addNodeView?.();
    expect(typeof nodeViewFactory).toBe('function');

    const node = {
      attrs: {
        src: './img.png',
        alt: 'alt',
      },
    };

    const nodeView = nodeViewFactory({
      node,
      HTMLAttributes: { class: 'markdown-image' },
      editor: {},
    });

    const wrapper = nodeView.dom as HTMLElement;
    const img = wrapper.querySelector('img') as HTMLImageElement | null;
    expect(img).not.toBeNull();

    // Flush the resolveImagePath promise microtask.
    await Promise.resolve();

    expect(img!.src).toContain('t=123');
  });
});
