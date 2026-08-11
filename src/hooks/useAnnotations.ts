import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
    Annotation,
    AnnotationTool,
    PASTE_OFFSET,
    Size,
    clampToBounds,
    minWidthFor,
    pivotModeFor,
} from '@/lib/annotations';

let idCounter = 0;
const nextId = () => `annotation-${++idCounter}`;

const HISTORY_LIMIT = 50;

interface HistoryState {
    past: Annotation[][];
    present: Annotation[];
    future: Annotation[][];
}

type Action =
    | { type: 'add'; annotation: Annotation }
    /** `commit` starts a new history entry — set on the first change of a drag. */
    | { type: 'update'; id: string; patch: Partial<Annotation>; commit: boolean }
    | { type: 'remove'; id: string }
    | { type: 'clear' }
    | { type: 'reset' }
    | { type: 'rescale'; ratioX: number; ratioY: number }
    | { type: 'undo' }
    | { type: 'redo' };

const EMPTY: HistoryState = { past: [], present: [], future: [] };

const commit = (state: HistoryState, present: Annotation[]): HistoryState => ({
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    present,
    future: [],
});

const scale = (annotations: Annotation[], ratioX: number, ratioY: number) => {
    const uniform = Math.min(ratioX, ratioY);
    const keepsAspect = (type: Annotation['type']) => type === 'number' || type === 'cursor' || type === 'hand';
    return annotations.map((a) => ({
        ...a,
        x: a.x * ratioX,
        y: a.y * ratioY,
        // Numbered markers and cursors keep their aspect ratio, boxes follow the image.
        width: a.width * (keepsAspect(a.type) ? uniform : ratioX),
        height: a.height * (keepsAspect(a.type) ? uniform : ratioY),
    }));
};

const reducer = (state: HistoryState, action: Action): HistoryState => {
    switch (action.type) {
        case 'add':
            return commit(state, [...state.present, action.annotation]);
        case 'update': {
            const present = state.present.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a));
            return action.commit ? commit(state, present) : { ...state, present };
        }
        case 'remove':
            if (!state.present.some((a) => a.id === action.id)) return state;
            return commit(
                state,
                state.present.filter((a) => a.id !== action.id)
            );
        case 'clear':
            return state.present.length === 0 ? state : commit(state, []);
        case 'reset':
            // A new screenshot starts a new document — nothing to undo back into.
            return state === EMPTY ? state : EMPTY;
        case 'rescale': {
            // A re-layout is not an edit: remap history too, so undo stays aligned.
            const map = (list: Annotation[]) => scale(list, action.ratioX, action.ratioY);
            return {
                past: state.past.map(map),
                present: map(state.present),
                future: state.future.map(map),
            };
        }
        case 'undo': {
            if (state.past.length === 0) return state;
            return {
                past: state.past.slice(0, -1),
                present: state.past[state.past.length - 1],
                future: [state.present, ...state.future],
            };
        }
        case 'redo': {
            if (state.future.length === 0) return state;
            return {
                past: [...state.past, state.present].slice(-HISTORY_LIMIT),
                present: state.future[0],
                future: state.future.slice(1),
            };
        }
        default:
            return state;
    }
};

export interface AnnotationController {
    annotations: Annotation[];
    activeTool: AnnotationTool | null;
    selectedId: string | null;
    /** Next badge label for the numbered-arrow tool. */
    nextNumber: number;
    canUndo: boolean;
    canRedo: boolean;
    toggleTool: (tool: AnnotationTool) => void;
    setActiveTool: (tool: AnnotationTool | null) => void;
    select: (id: string | null) => void;
    add: (annotation: Omit<Annotation, 'id'>) => string;
    update: (id: string, patch: Partial<Annotation>) => void;
    remove: (id: string) => void;
    /** Undoable "remove everything". */
    clear: () => void;
    /** Drops the annotations and their history — for when the screenshot changes. */
    reset: () => void;
    undo: () => void;
    redo: () => void;
    /** Marks the start of a drag so the whole gesture is a single undo step. */
    beginGesture: () => void;
    endGesture: () => void;
    /** Keeps annotations aligned when the image is re-laid out (padding, resize). */
    rescale: (ratioX: number, ratioY: number) => void;
    /** Copies the selected shape onto an internal clipboard; no-ops if nothing is selected. */
    copySelected: () => void;
    /** Drops the clipboard's shape nudged from its original spot, clamped to `bounds`. */
    paste: (bounds: Size) => void;
}

export const useAnnotations = (): AnnotationController => {
    const [history, dispatch] = useReducer(reducer, EMPTY);
    const [activeTool, setActiveTool] = useState<AnnotationTool | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    /** True between a drag's pointerdown and its first change. */
    const pendingCommit = useRef(false);

    const annotations = history.present;
    /** Holds the last copied shape (sans id) between a copy and however many pastes follow. */
    const clipboardRef = useRef<Omit<Annotation, 'id'> | null>(null);
    /** Cascades repeated pastes of the same clipboard further from the original each time. */
    const pasteCountRef = useRef(0);

    const nextNumber = useMemo(
        () => annotations.reduce((max, a) => (a.type === 'number' ? Math.max(max, a.number ?? 0) : max), 0) + 1,
        [annotations]
    );

    const add = useCallback((annotation: Omit<Annotation, 'id'>) => {
        const id = nextId();
        dispatch({ type: 'add', annotation: { ...annotation, id } });
        setSelectedId(id);
        return id;
    }, []);

    const update = useCallback((id: string, patch: Partial<Annotation>) => {
        dispatch({ type: 'update', id, patch, commit: pendingCommit.current });
        pendingCommit.current = false;
    }, []);

    const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), []);

    const clear = useCallback(() => {
        dispatch({ type: 'clear' });
        setSelectedId(null);
        setActiveTool(null);
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'reset' });
        setSelectedId(null);
        setActiveTool(null);
    }, []);

    const undo = useCallback(() => dispatch({ type: 'undo' }), []);
    const redo = useCallback(() => dispatch({ type: 'redo' }), []);

    const beginGesture = useCallback(() => {
        pendingCommit.current = true;
    }, []);

    const endGesture = useCallback(() => {
        pendingCommit.current = false;
    }, []);

    const toggleTool = useCallback((tool: AnnotationTool) => {
        setActiveTool((current) => (current === tool ? null : tool));
        setSelectedId(null);
    }, []);

    const rescale = useCallback((ratioX: number, ratioY: number) => {
        if (!Number.isFinite(ratioX) || !Number.isFinite(ratioY) || ratioX <= 0 || ratioY <= 0) return;
        dispatch({ type: 'rescale', ratioX, ratioY });
    }, []);

    const copySelected = useCallback(() => {
        const selected = annotations.find((a) => a.id === selectedId);
        if (!selected) return;
        const { id, ...rest } = selected;
        clipboardRef.current = rest;
        pasteCountRef.current = 0;
    }, [annotations, selectedId]);

    const paste = useCallback(
        (bounds: Size) => {
            const clip = clipboardRef.current;
            if (!clip) return;
            pasteCountRef.current += 1;
            const offset = PASTE_OFFSET * pasteCountRef.current;
            const box = { x: clip.x + offset, y: clip.y + offset, width: clip.width, height: clip.height };
            const clamped = clampToBounds(box, clip.rotation, bounds, {
                pivot: pivotModeFor(clip.type),
                minWidth: minWidthFor(clip),
            });
            // A pasted numbered marker gets its own badge, not a duplicate of the original's.
            add({ ...clip, ...clamped, number: clip.type === 'number' ? nextNumber : clip.number });
        },
        [add, nextNumber]
    );

    // Undo/redo can remove the selected shape.
    useEffect(() => {
        if (selectedId && !annotations.some((a) => a.id === selectedId)) setSelectedId(null);
    }, [annotations, selectedId]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

            const modifier = event.metaKey || event.ctrlKey;
            const key = event.key.toLowerCase();

            if (modifier && (key === 'z' || key === 'y')) {
                event.preventDefault();
                if (key === 'y' || event.shiftKey) redo();
                else undo();
                return;
            }
            if (event.key === 'Escape') {
                setSelectedId(null);
                setActiveTool(null);
                return;
            }
            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
                event.preventDefault();
                remove(selectedId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [redo, remove, selectedId, undo]);

    return {
        annotations,
        activeTool,
        selectedId,
        nextNumber,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        toggleTool,
        setActiveTool,
        select: setSelectedId,
        add,
        update,
        remove,
        clear,
        reset,
        undo,
        redo,
        beginGesture,
        endGesture,
        rescale,
        copySelected,
        paste,
    };
};
