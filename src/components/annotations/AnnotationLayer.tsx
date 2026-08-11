import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import {
    ALL_HANDLES,
    ANNOTATION_COLOR,
    Annotation,
    AnnotationTool,
    Box,
    Handle,
    MIN_SIZE,
    NUMBER_HANDLES,
    NUMBER_MIN_LENGTH_RATIO,
    PivotMode,
    clampToBounds,
    defaultBoxFor,
    isLengthHandle,
    pinPivot,
    pivotOf,
    resizeBox,
    toLocal,
} from '@/lib/annotations';
import { AnnotationController } from '@/hooks/useAnnotations';
import { ContentRect } from '@/hooks/useImageContentRect';
import NumberArrowMarker from './NumberArrowMarker';
import CursorMarker from './CursorMarker';
import HandCursorMarker from './HandCursorMarker';

/** Cursor-like markers that always scale uniformly, never stretch. */
const isCursorLike = (type: AnnotationTool) => type === 'cursor' || type === 'hand';

const SELECTION_COLOR = '#2F6FED';
/** Drawn size of a resize handle. */
const HANDLE_SIZE = 10;
/** Invisible grab area around each handle — comfortably clickable, same look. */
const HIT_SIZE = 24;
const ROTATE_DOT_SIZE = 12;
const ROTATE_HIT_SIZE = 34;
const DELETE_SIZE = 18;
const ROTATE_OFFSET = 26;
const STROKE_WIDTH = 3;

type Point = { x: number; y: number };

type DragState =
    | { mode: 'create'; id: string; tool: AnnotationTool; origin: Point; moved: boolean }
    | { mode: 'move'; id: string; grab: Point; start: Box; rotation: number; pivot: PivotMode }
    | {
          mode: 'resize';
          id: string;
          type: AnnotationTool;
          handle: Handle;
          origin: Point;
          start: Box;
          rotation: number;
          pivot: PivotMode;
          /** Locked ratio while resizing (numbered markers from a corner). */
          aspect?: number;
          /** Arrow length only — the badge keeps its size. */
          lengthOnly: boolean;
          minWidth: number;
      }
    | {
          mode: 'rotate';
          id: string;
          center: Point;
          start: Box;
          pointerAngle: number;
          startRotation: number;
          pivot: PivotMode;
      };

const HANDLE_CURSOR: Record<Handle, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
};

const HANDLE_POSITION: Record<Handle, { left: string; top: string }> = {
    nw: { left: '0%', top: '0%' },
    n: { left: '50%', top: '0%' },
    ne: { left: '100%', top: '0%' },
    e: { left: '100%', top: '50%' },
    se: { left: '100%', top: '100%' },
    s: { left: '50%', top: '100%' },
    sw: { left: '0%', top: '100%' },
    w: { left: '0%', top: '50%' },
};

const angleOf = (from: Point, to: Point) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

/** Numbered markers turn about their badge; boxes about their centre. */
const pivotModeFor = (type: AnnotationTool): PivotMode => (type === 'number' ? 'badge' : 'center');

interface AnnotationLayerProps {
    controller: AnnotationController;
    /** The image's visible pixel box, relative to the layer's positioned parent. */
    bounds: ContentRect;
}

const AnnotationLayer = ({ controller, bounds }: AnnotationLayerProps) => {
    const surfaceRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const controllerRef = useRef(controller);
    controllerRef.current = controller;
    const boundsRef = useRef(bounds);
    boundsRef.current = bounds;
    const previousSize = useRef<{ width: number; height: number } | null>(null);

    // Keep annotations glued to the same spot when padding or the viewport changes.
    useEffect(() => {
        const previous = previousSize.current;
        if (
            previous &&
            previous.width > 0 &&
            previous.height > 0 &&
            bounds.width > 0 &&
            bounds.height > 0 &&
            (Math.abs(previous.width - bounds.width) > 0.5 || Math.abs(previous.height - bounds.height) > 0.5)
        ) {
            controllerRef.current.rescale(bounds.width / previous.width, bounds.height / previous.height);
        }
        if (bounds.width > 0 && bounds.height > 0) {
            previousSize.current = { width: bounds.width, height: bounds.height };
        }
    }, [bounds.width, bounds.height]);

    const pointFrom = (event: { clientX: number; clientY: number }): Point => {
        const rect = surfaceRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    useEffect(() => {
        const handleMove = (event: PointerEvent) => {
            const drag = dragRef.current;
            if (!drag) return;
            const { update, annotations } = controllerRef.current;
            const area = boundsRef.current;
            const point = pointFrom(event);

            if (drag.mode === 'create') {
                const x = Math.min(Math.max(point.x, 0), area.width);
                const y = Math.min(Math.max(point.y, 0), area.height);
                let width = Math.abs(x - drag.origin.x);
                let height = Math.abs(y - drag.origin.y);
                if (width > 4 || height > 4) drag.moved = true;
                // Shift draws a perfect square / circle.
                if (event.shiftKey) {
                    const size = Math.max(width, height);
                    width = size;
                    height = size;
                }
                const box = {
                    x: x < drag.origin.x ? drag.origin.x - width : drag.origin.x,
                    y: y < drag.origin.y ? drag.origin.y - height : drag.origin.y,
                    width,
                    height,
                };
                update(drag.id, clampToBounds(box, 0, area, event.shiftKey ? { aspect: 1 } : undefined));
                return;
            }

            if (drag.mode === 'move') {
                const moved = clampToBounds(
                    {
                        ...drag.start,
                        x: drag.start.x + (point.x - drag.grab.x),
                        y: drag.start.y + (point.y - drag.grab.y),
                    },
                    drag.rotation,
                    area,
                    { pivot: drag.pivot }
                );
                update(drag.id, moved);
                return;
            }

            if (drag.mode === 'resize') {
                const local = toLocal(point.x - drag.origin.x, point.y - drag.origin.y, drag.rotation);
                // Shift keeps boxes square; numbered markers and cursors keep their own ratio.
                const square = event.shiftKey && drag.type !== 'number' && !isCursorLike(drag.type);
                const aspect = square ? 1 : drag.aspect;
                let resized = resizeBox(drag.start, drag.rotation, drag.handle, local.x, local.y, {
                    aspect,
                    minWidth: drag.minWidth,
                });
                // A marker grows away from its badge, never dragging the badge along.
                if (drag.pivot === 'badge') resized = pinPivot(resized, drag.start, 'badge');
                update(
                    drag.id,
                    clampToBounds(resized, drag.rotation, area, {
                        aspect,
                        lockHeight: drag.lengthOnly,
                        minWidth: drag.minWidth,
                        pivot: drag.pivot,
                    })
                );
                return;
            }

            const raw = drag.startRotation + (angleOf(drag.center, point) - drag.pointerAngle);
            const rotation = event.shiftKey ? Math.round(raw / 15) * 15 : Math.round(raw);
            const current = annotations.find((a) => a.id === drag.id);
            const box = current ? { x: current.x, y: current.y, width: current.width, height: current.height } : drag.start;
            update(drag.id, { rotation, ...clampToBounds(box, rotation, area, { pivot: drag.pivot }) });
        };

        const handleUp = () => {
            const drag = dragRef.current;
            controllerRef.current.endGesture();
            if (!drag) return;
            dragRef.current = null;

            if (drag.mode === 'create' && !drag.moved) {
                // A plain click drops a sensibly sized shape instead of a zero-size one.
                const { update } = controllerRef.current;
                const box = defaultBoxFor(drag.tool, drag.origin, boundsRef.current);
                update(drag.id, clampToBounds(box, 0, boundsRef.current));
            } else if (drag.mode === 'create') {
                const { update, remove, annotations } = controllerRef.current;
                const current = annotations.find((a) => a.id === drag.id);
                if (current && (current.width < MIN_SIZE || current.height < MIN_SIZE)) {
                    if (current.width < 4 || current.height < 4) {
                        remove(drag.id);
                    } else {
                        update(drag.id, {
                            width: Math.max(MIN_SIZE, current.width),
                            height: Math.max(MIN_SIZE, current.height),
                        });
                    }
                }
            }
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
        };
    }, []);

    const stop = (event: React.SyntheticEvent) => {
        event.stopPropagation();
        event.preventDefault();
    };

    const handleSurfacePointerDown = (event: React.PointerEvent) => {
        stop(event);
        const { activeTool, selectedId, select, add, nextNumber } = controller;
        // Clicking off a selected shape only drops the selection — the next click
        // is the one that adds something, so finishing an edit can't spawn a shape.
        if (!activeTool || selectedId) {
            select(null);
            return;
        }

        const origin = pointFrom(event);
        if (activeTool === 'number') {
            const box = clampToBounds(defaultBoxFor('number', origin, bounds), 0, bounds);
            const id = add({ type: 'number', rotation: 0, number: nextNumber, ...box });
            // Let the user keep dragging to place the marker precisely.
            dragRef.current = { mode: 'move', id, grab: origin, start: box, rotation: 0, pivot: 'badge' };
            return;
        }

        const id = add({ type: activeTool, rotation: 0, x: origin.x, y: origin.y, width: 0, height: 0 });
        dragRef.current = { mode: 'create', id, tool: activeTool, origin, moved: false };
    };

    const startMove = (event: React.PointerEvent, annotation: Annotation) => {
        stop(event);
        controller.select(annotation.id);
        controller.beginGesture();
        dragRef.current = {
            mode: 'move',
            id: annotation.id,
            grab: pointFrom(event),
            start: { x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height },
            rotation: annotation.rotation,
            pivot: pivotModeFor(annotation.type),
        };
    };

    const startResize = (event: React.PointerEvent, annotation: Annotation, handle: Handle) => {
        stop(event);
        controller.select(annotation.id);
        controller.beginGesture();
        const isNumber = annotation.type === 'number';
        // Side handles stretch the arrow, corners scale the whole marker.
        const lengthOnly = isNumber && isLengthHandle(handle);
        dragRef.current = {
            mode: 'resize',
            id: annotation.id,
            type: annotation.type,
            handle,
            origin: pointFrom(event),
            start: { x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height },
            rotation: annotation.rotation,
            pivot: pivotModeFor(annotation.type),
            // Cursor markers always scale uniformly; a numbered marker only from its corners.
            aspect: isCursorLike(annotation.type) || (isNumber && !lengthOnly) ? annotation.width / annotation.height : undefined,
            lengthOnly,
            minWidth: isNumber ? annotation.height * NUMBER_MIN_LENGTH_RATIO : MIN_SIZE,
        };
    };

    const startRotate = (event: React.PointerEvent, annotation: Annotation) => {
        stop(event);
        controller.select(annotation.id);
        controller.beginGesture();
        const pivot = pivotModeFor(annotation.type);
        const local = pivotOf(annotation.width, annotation.height, pivot);
        const center = { x: annotation.x + local.x, y: annotation.y + local.y };
        dragRef.current = {
            mode: 'rotate',
            id: annotation.id,
            center,
            start: { x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height },
            pointerAngle: angleOf(center, pointFrom(event)),
            startRotation: annotation.rotation,
            pivot,
        };
    };

    if (bounds.width <= 0 || bounds.height <= 0) return null;

    const { annotations, activeTool, selectedId } = controller;
    const surfaceActive = Boolean(activeTool) || selectedId !== null;

    return (
        <div
            ref={surfaceRef}
            className="absolute"
            style={{
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                pointerEvents: 'none',
                touchAction: 'none',
            }}
        >
            {surfaceActive && (
                <div
                    data-export-hide="true"
                    className="absolute inset-0"
                    style={{ pointerEvents: 'auto', cursor: activeTool ? 'crosshair' : 'default' }}
                    onPointerDown={handleSurfacePointerDown}
                    onClick={stop}
                />
            )}

            {annotations.map((annotation) => {
                const isSelected = annotation.id === selectedId;
                const isNumber = annotation.type === 'number';
                const handles = isNumber ? NUMBER_HANDLES : ALL_HANDLES;
                const canRotate = annotation.type !== 'circle';
                const pivot = pivotOf(annotation.width, annotation.height, pivotModeFor(annotation.type));

                return (
                    <div
                        key={annotation.id}
                        className="absolute"
                        style={{
                            left: annotation.x,
                            top: annotation.y,
                            width: annotation.width,
                            height: annotation.height,
                            transform: `rotate(${annotation.rotation}deg)`,
                            // Markers swing about their badge, boxes about their centre.
                            transformOrigin: `${pivot.x}px ${pivot.y}px`,
                            pointerEvents: 'auto',
                            cursor: 'move',
                            touchAction: 'none',
                            // Declared on the HTML wrapper as well: html-to-image only
                            // embeds fonts it finds while walking HTML elements.
                            fontFamily: isNumber ? 'Inter, sans-serif' : undefined,
                        }}
                        onPointerDown={(event) => startMove(event, annotation)}
                        onClick={stop}
                    >
                        {isNumber ? (
                            <NumberArrowMarker
                                width={annotation.width}
                                height={annotation.height}
                                value={annotation.number ?? 1}
                                rotation={annotation.rotation}
                            />
                        ) : annotation.type === 'cursor' ? (
                            <CursorMarker width={annotation.width} height={annotation.height} />
                        ) : annotation.type === 'hand' ? (
                            <HandCursorMarker width={annotation.width} height={annotation.height} />
                        ) : (
                            <div
                                className="absolute inset-0"
                                style={{
                                    border: `${STROKE_WIDTH}px solid ${ANNOTATION_COLOR}`,
                                    borderRadius: annotation.type === 'circle' ? '50%' : 6,
                                    boxSizing: 'border-box',
                                }}
                            />
                        )}

                        {isSelected && (
                            <div data-export-hide="true" className="absolute inset-0">
                                <div
                                    className="absolute inset-0"
                                    style={{ outline: `1px solid ${SELECTION_COLOR}`, outlineOffset: 1 }}
                                />

                                {canRotate && (
                                    <>
                                        <div
                                            className="absolute"
                                            style={{
                                                left: '50%',
                                                top: -ROTATE_OFFSET,
                                                width: 1,
                                                height: ROTATE_OFFSET,
                                                background: SELECTION_COLOR,
                                                // Never intercept the rotate grab.
                                                pointerEvents: 'none',
                                            }}
                                        />
                                        {/* Generous grab area around a small dot: the whole band
                                            above the shape rotates, so a near miss never lands on
                                            the canvas and drops a new annotation. */}
                                        <div
                                            title="Drag to rotate (hold Shift to snap)"
                                            className="absolute flex items-center justify-center"
                                            style={{
                                                left: '50%',
                                                top: -ROTATE_OFFSET,
                                                width: ROTATE_HIT_SIZE,
                                                height: ROTATE_HIT_SIZE,
                                                marginLeft: -ROTATE_HIT_SIZE / 2,
                                                marginTop: -ROTATE_HIT_SIZE / 2,
                                                cursor: 'grab',
                                                touchAction: 'none',
                                            }}
                                            onPointerDown={(event) => startRotate(event, annotation)}
                                        >
                                            <div
                                                className="rounded-full"
                                                style={{
                                                    width: ROTATE_DOT_SIZE,
                                                    height: ROTATE_DOT_SIZE,
                                                    background: '#FFFFFF',
                                                    border: `1.5px solid ${SELECTION_COLOR}`,
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        </div>
                                    </>
                                )}

                                <button
                                    type="button"
                                    title="Delete"
                                    className="absolute flex items-center justify-center"
                                    style={{
                                        left: '100%',
                                        top: -ROTATE_OFFSET,
                                        width: HIT_SIZE,
                                        height: HIT_SIZE,
                                        marginLeft: -HIT_SIZE / 2,
                                        marginTop: -HIT_SIZE / 2,
                                        cursor: 'pointer',
                                    }}
                                    onPointerDown={stop}
                                    onClick={(event) => {
                                        stop(event);
                                        controller.remove(annotation.id);
                                    }}
                                >
                                    <span
                                        className="flex items-center justify-center rounded-full text-white"
                                        style={{
                                            width: DELETE_SIZE,
                                            height: DELETE_SIZE,
                                            background: ANNOTATION_COLOR,
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <X size={12} strokeWidth={3} />
                                    </span>
                                </button>

                                {handles.map((handle) => (
                                    <div
                                        key={handle}
                                        className="absolute flex items-center justify-center"
                                        style={{
                                            ...HANDLE_POSITION[handle],
                                            width: HIT_SIZE,
                                            height: HIT_SIZE,
                                            marginLeft: -HIT_SIZE / 2,
                                            marginTop: -HIT_SIZE / 2,
                                            cursor: HANDLE_CURSOR[handle],
                                            touchAction: 'none',
                                        }}
                                        onPointerDown={(event) => startResize(event, annotation, handle)}
                                    >
                                        <div
                                            style={{
                                                width: HANDLE_SIZE,
                                                height: HANDLE_SIZE,
                                                background: '#FFFFFF',
                                                border: `1.5px solid ${SELECTION_COLOR}`,
                                                borderRadius: 2,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AnnotationLayer;
