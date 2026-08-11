export const ANNOTATION_COLOR = '#EC5341';

export type AnnotationTool = 'rect' | 'circle' | 'number' | 'cursor' | 'hand';

export interface Annotation {
    id: string;
    type: AnnotationTool;
    /** Top-left of the unrotated box, in px relative to the image content box. */
    x: number;
    y: number;
    width: number;
    height: number;
    /** Degrees, clockwise. */
    rotation: number;
    /** Auto-incrementing badge label, only for the `number` tool. */
    number?: number;
}

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Size {
    width: number;
    height: number;
}

export const MIN_SIZE = 16;
/** Default width / height of the numbered arrow marker. */
export const NUMBER_ASPECT = 2.6;
export const DEFAULT_NUMBER_HEIGHT = 30;
/** Shortest arrow, as a multiple of the badge size, so the head never eats the badge. */
export const NUMBER_MIN_LENGTH_RATIO = 1.45;
/** Width / height of the cursor marker — a classic pointer arrow, taller than wide. */
export const CURSOR_ASPECT = 0.68;
export const DEFAULT_CURSOR_HEIGHT = 40;
/** The hand-pointer marker's source art is a square viewBox. */
export const HAND_ASPECT = 1;
export const DEFAULT_HAND_HEIGHT = 44;

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const HANDLE_DIRECTION: Record<Handle, { sx: -1 | 0 | 1; sy: -1 | 0 | 1 }> = {
    nw: { sx: -1, sy: -1 },
    n: { sx: 0, sy: -1 },
    ne: { sx: 1, sy: -1 },
    e: { sx: 1, sy: 0 },
    se: { sx: 1, sy: 1 },
    s: { sx: 0, sy: 1 },
    sw: { sx: -1, sy: 1 },
    w: { sx: -1, sy: 0 },
};

export const ALL_HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const clamp = (value: number, min: number, max: number) =>
    max < min ? min : Math.min(Math.max(value, min), max);

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Convert a world-space delta into the shape's own (unrotated) space. */
export const toLocal = (dx: number, dy: number, rotation: number) => {
    const r = toRad(rotation);
    const c = Math.cos(r);
    const s = Math.sin(r);
    return { x: dx * c + dy * s, y: -dx * s + dy * c };
};

/** Convert a delta in the shape's own space back into world space. */
export const toWorld = (dx: number, dy: number, rotation: number) => {
    const r = toRad(rotation);
    const c = Math.cos(r);
    const s = Math.sin(r);
    return { x: dx * c - dy * s, y: dx * s + dy * c };
};

/** Half-extents of the axis-aligned box that encloses a rotated shape. */
export const rotatedExtents = (width: number, height: number, rotation: number) => {
    const r = toRad(rotation);
    const c = Math.abs(Math.cos(r));
    const s = Math.abs(Math.sin(r));
    return { hw: (width * c + height * s) / 2, hh: (width * s + height * c) / 2 };
};

/**
 * What a shape turns around. Boxes spin about their centre; a numbered marker
 * spins about its badge, so the badge stays put and only the arrow sweeps.
 */
export type PivotMode = 'center' | 'badge';

export const pivotOf = (width: number, height: number, mode: PivotMode = 'center') =>
    mode === 'badge' ? { x: width - height / 2, y: height / 2 } : { x: width / 2, y: height / 2 };

/**
 * Where the rotated shape actually sits, as offsets from the box's own origin.
 * The size of that footprint doesn't depend on the pivot, but its offset does.
 */
export const footprintOffsets = (box: Box, rotation: number, mode: PivotMode = 'center') => {
    const pivot = pivotOf(box.width, box.height, mode);
    const r = toRad(rotation);
    const c = Math.cos(r);
    const s = Math.sin(r);
    const corners = [
        [0, 0],
        [box.width, 0],
        [box.width, box.height],
        [0, box.height],
    ];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [lx, ly] of corners) {
        const dx = lx - pivot.x;
        const dy = ly - pivot.y;
        const rx = pivot.x + dx * c - dy * s;
        const ry = pivot.y + dx * s + dy * c;
        minX = Math.min(minX, rx);
        maxX = Math.max(maxX, rx);
        minY = Math.min(minY, ry);
        maxY = Math.max(maxY, ry);
    }
    return { minX, minY, maxX, maxY };
};

/** Re-anchors a resized box so its pivot stays where it was. */
export const pinPivot = (next: Box, start: Box, mode: PivotMode): Box => {
    const from = pivotOf(start.width, start.height, mode);
    const to = pivotOf(next.width, next.height, mode);
    return { ...next, x: start.x + from.x - to.x, y: start.y + from.y - to.y };
};

export interface ClampOptions {
    /** Keep width / height locked to this ratio when the shape has to shrink. */
    aspect?: number;
    /** Only trim the width — used when lengthening an arrow must not resize its badge. */
    lockHeight?: boolean;
    minWidth?: number;
    pivot?: PivotMode;
}

/**
 * Keeps a shape fully inside the image: shrinks it if its rotated footprint is
 * larger than the image, then slides it so no edge can cross the boundary.
 */
export const clampToBounds = (box: Box, rotation: number, bounds: Size, options: ClampOptions = {}): Box => {
    if (bounds.width <= 0 || bounds.height <= 0) return box;

    const { aspect, lockHeight, minWidth = MIN_SIZE, pivot = 'center' } = options;
    let { width, height } = box;

    let extents = rotatedExtents(width, height, rotation);
    if (lockHeight) {
        const r = toRad(rotation);
        const c = Math.abs(Math.cos(r));
        const s = Math.abs(Math.sin(r));
        let maxWidth = Infinity;
        if (c > 1e-6) maxWidth = Math.min(maxWidth, (bounds.width - height * s) / c);
        if (s > 1e-6) maxWidth = Math.min(maxWidth, (bounds.height - height * c) / s);
        width = Math.max(minWidth, Math.min(width, maxWidth));
        extents = rotatedExtents(width, height, rotation);
    } else {
        const scale = Math.min(1, bounds.width / (extents.hw * 2), bounds.height / (extents.hh * 2));
        if (scale < 1) {
            if (aspect) {
                width = Math.max(Math.max(minWidth, MIN_SIZE * aspect), width * scale);
                height = width / aspect;
            } else {
                width = Math.max(minWidth, width * scale);
                height = Math.max(MIN_SIZE, height * scale);
            }
            extents = rotatedExtents(width, height, rotation);
        }
    }

    // Shrinking keeps the pivot where it was, so the badge doesn't drift.
    const resized = pinPivot({ x: box.x, y: box.y, width, height }, box, pivot);
    const offsets = footprintOffsets(resized, rotation, pivot);

    return {
        ...resized,
        x: clamp(resized.x, -offsets.minX, bounds.width - offsets.maxX),
        y: clamp(resized.y, -offsets.minY, bounds.height - offsets.maxY),
    };
};

export interface ResizeOptions {
    /** Lock width / height to this ratio (1 = perfect square, Shift-drag). */
    aspect?: number;
    minWidth?: number;
}

/**
 * Resizes a box from one of its handles, in the shape's own space, keeping the
 * opposite edge/corner visually anchored even when the shape is rotated.
 */
export const resizeBox = (
    start: Box,
    rotation: number,
    handle: Handle,
    localDx: number,
    localDy: number,
    options: ResizeOptions = {}
): Box => {
    const { sx, sy } = HANDLE_DIRECTION[handle];
    const { aspect, minWidth = MIN_SIZE } = options;

    let width = start.width;
    let height = start.height;

    if (aspect) {
        // Uniform scale: drive it from whichever axis the pointer moved most.
        const byX = sx === 0 ? null : start.width + sx * localDx;
        const byY = sy === 0 ? null : (start.height + sy * localDy) * aspect;
        const candidates = [byX, byY].filter((v): v is number => v !== null);
        const nextWidth = candidates.length
            ? candidates.reduce((a, b) => (Math.abs(b - start.width) > Math.abs(a - start.width) ? b : a))
            : start.width;
        width = Math.max(Math.max(minWidth, MIN_SIZE * aspect), nextWidth);
        height = width / aspect;
    } else {
        if (sx !== 0) width = Math.max(minWidth, start.width + sx * localDx);
        if (sy !== 0) height = Math.max(MIN_SIZE, start.height + sy * localDy);
    }

    // The grabbed edge moves, the opposite one stays put: the centre travels half
    // the size change, along the shape's own axes.
    const shift = toWorld((sx * (width - start.width)) / 2, (sy * (height - start.height)) / 2, rotation);

    const cx = start.x + start.width / 2 + shift.x;
    const cy = start.y + start.height / 2 + shift.y;

    return { x: cx - width / 2, y: cy - height / 2, width, height };
};

export const defaultBoxFor = (tool: AnnotationTool, point: { x: number; y: number }, bounds: Size): Box => {
    if (tool === 'number') {
        const height = DEFAULT_NUMBER_HEIGHT;
        const width = height * NUMBER_ASPECT;
        // Drop the badge under the cursor, arrow pointing away to the left.
        return { x: point.x - width + height / 2, y: point.y - height / 2, width, height };
    }
    if (tool === 'circle') {
        const size = Math.max(MIN_SIZE, Math.min(bounds.width, bounds.height) * 0.22);
        return { x: point.x - size / 2, y: point.y - size / 2, width: size, height: size };
    }
    if (tool === 'cursor') {
        const height = DEFAULT_CURSOR_HEIGHT;
        const width = height * CURSOR_ASPECT;
        // Drop the tip under the cursor, same as a real pointer would land.
        return { x: point.x, y: point.y, width, height };
    }
    if (tool === 'hand') {
        const height = DEFAULT_HAND_HEIGHT;
        const width = height * HAND_ASPECT;
        // Centre the hand under the click, same as the arrow cursor's landing spot.
        return { x: point.x - width / 2, y: point.y - height / 2, width, height };
    }
    const width = Math.max(MIN_SIZE, bounds.width * 0.28);
    const height = Math.max(MIN_SIZE, bounds.height * 0.2);
    return { x: point.x - width / 2, y: point.y - height / 2, width, height };
};

/** Numbered markers stretch lengthwise from their side handles, uniformly from the corners. */
export const NUMBER_HANDLES: Handle[] = ['nw', 'ne', 'se', 'sw', 'e', 'w'];
export const isLengthHandle = (handle: Handle) => handle === 'e' || handle === 'w';
