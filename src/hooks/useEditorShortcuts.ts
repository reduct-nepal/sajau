import { useEffect } from 'react';
import { AnnotationController } from './useAnnotations';

export interface EditorShortcutsOptions {
    /** Copies the exported image to the clipboard (⌘C). */
    onCopy: () => void;
    /** Opens the file picker to replace the screenshot (⇧N). */
    onUploadNew: () => void;
    /** Tool shortcuts (C/R/A) only make sense once there's something to draw on. */
    hasImage: boolean;
}

/**
 * Global shortcuts for the annotation editor, layered on top of the ones
 * useAnnotations already owns (⌘Z undo, ⇧⌘Z redo, Delete, Esc):
 *   ⌘C copy · ⇧N upload new · C circle · R rectangle · A numbered arrow
 */
export const useEditorShortcuts = (
    controller: AnnotationController,
    { onCopy, onUploadNew, hasImage }: EditorShortcutsOptions
) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;

            const modifier = event.metaKey || event.ctrlKey;
            const key = event.key.toLowerCase();

            if (modifier && !event.shiftKey && key === 'c') {
                event.preventDefault();
                onCopy();
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
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [controller, onCopy, onUploadNew, hasImage]);
};
