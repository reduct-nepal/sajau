import { useEffect } from 'react';
import { Size } from '@/lib/annotations';
import { AnnotationController } from './useAnnotations';

export interface EditorShortcutsOptions {
    /** Copies the exported image to the clipboard (⌘C) — only when no shape is selected. */
    onCopy: () => void;
    /** Opens the file picker to replace the screenshot (⇧N). */
    onUploadNew: () => void;
    /** Tool shortcuts (C/R/A) only make sense once there's something to draw on. */
    hasImage: boolean;
    /** The image's visible box, so a pasted shape lands and clamps inside it. */
    bounds: Size;
}

/**
 * Global shortcuts for the annotation editor, layered on top of the ones
 * useAnnotations already owns (⌘Z undo, ⇧⌘Z redo, Delete, Esc):
 *   ⌘C copy (shape if one's selected, else the image) · ⌘V paste shape ·
 *   ⇧N upload new · C circle · R rectangle · A numbered arrow ·
 *   P cursor · H hand cursor
 */
export const useEditorShortcuts = (
    controller: AnnotationController,
    { onCopy, onUploadNew, hasImage, bounds }: EditorShortcutsOptions
) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;

            const modifier = event.metaKey || event.ctrlKey;
            const key = event.key.toLowerCase();

            if (modifier && !event.shiftKey && key === 'c') {
                event.preventDefault();
                // A selected shape takes priority — copying it, not the whole image.
                if (controller.selectedId) controller.copySelected();
                else onCopy();
                return;
            }
            if (modifier && !event.shiftKey && key === 'v') {
                // Only claim the keystroke when a shape was actually pasted — otherwise
                // let the browser's default paste action through so an image on the
                // clipboard (e.g. the very first screenshot) still lands in the frame.
                if (controller.paste(bounds)) event.preventDefault();
                return;
            }
            if (event.shiftKey && !modifier && key === 'n') {
                event.preventDefault();
                onUploadNew();
                return;
            }
            // Leave every other modifier combo alone (e.g. don't hijack Cmd+R reload).
            if (modifier || event.altKey || event.shiftKey || !hasImage) return;

            if (key === 'c') {
                event.preventDefault();
                controller.toggleTool('circle');
            } else if (key === 'r') {
                event.preventDefault();
                controller.toggleTool('rect');
            } else if (key === 'a') {
                event.preventDefault();
                controller.toggleTool('number');
            } else if (key === 'p') {
                event.preventDefault();
                controller.toggleTool('cursor');
            } else if (key === 'h') {
                event.preventDefault();
                controller.toggleTool('hand');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [controller, onCopy, onUploadNew, hasImage, bounds]);
};
