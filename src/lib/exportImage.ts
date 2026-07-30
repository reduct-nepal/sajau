import { toPng } from 'html-to-image';

/**
 * Editor-only chrome (selection outlines, resize handles) is marked with
 * `data-export-hide="true"` so it never lands in the exported image.
 */
const includeInExport = (node: HTMLElement) => {
    const dataset = (node as HTMLElement | undefined)?.dataset;
    return !dataset || dataset.exportHide !== 'true';
};

export const captureNode = (node: HTMLElement) =>
    toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        style: {
            boxShadow: 'none', // Remove shadow from export
        },
        filter: includeInExport,
    });

export const copyNodeToClipboard = async (node: HTMLElement) => {
    const dataUrl = await captureNode(node);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
};
