import { ArrowUpFromDot, Circle, Hand, MousePointer2, Redo2, Square, Trash2, Undo2 } from 'lucide-react';
import { AnnotationTool } from '@/lib/annotations';
import { AnnotationController } from '@/hooks/useAnnotations';
import { cn } from '@/lib/utils';

const TOOLS: { tool: AnnotationTool; label: string; icon: typeof Square }[] = [
    { tool: 'rect', label: 'Rectangle — drag to draw (hold Shift for a square), rotate and resize', icon: Square },
    { tool: 'circle', label: 'Circle — drag to draw (hold Shift for a perfect circle)', icon: Circle },
    { tool: 'number', label: 'Numbered arrow — click to drop 1, 2, 3…, side handles set the length', icon: ArrowUpFromDot },
    { tool: 'cursor', label: 'Cursor — click to drop a mouse pointer, drag to reposition or rotate', icon: MousePointer2 },
    { tool: 'hand', label: 'Hand cursor — click to drop a pointing hand, drag to reposition or rotate', icon: Hand },
];

const ACTION_CLASS =
    'flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:text-white/25 disabled:hover:bg-transparent';

interface AnnotationToolbarProps {
    controller: AnnotationController;
}

const AnnotationToolbar = ({ controller }: AnnotationToolbarProps) => (
    <div
        data-export-hide="true"
        className="flex flex-col items-center gap-1 rounded-xl bg-[#1C1C1E] p-1.5 shadow-lg"
    >
        {TOOLS.map(({ tool, label, icon: Icon }) => {
            const isActive = controller.activeTool === tool;
            return (
                <button
                    key={tool}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={isActive}
                    onClick={() => controller.toggleTool(tool)}
                    className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        isActive ? 'text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                    style={isActive ? { background: '#EC5341' } : undefined}
                >
                    <Icon size={18} strokeWidth={2} />
                </button>
            );
        })}

        <div className="my-0.5 h-px w-6 bg-white/15" />

        <button
            type="button"
            title="Undo (⌘Z)"
            aria-label="Undo"
            disabled={!controller.canUndo}
            onClick={() => controller.undo()}
            className={ACTION_CLASS}
        >
            <Undo2 size={17} strokeWidth={2} />
        </button>

        <button
            type="button"
            title="Redo (⇧⌘Z)"
            aria-label="Redo"
            disabled={!controller.canRedo}
            onClick={() => controller.redo()}
            className={ACTION_CLASS}
        >
            <Redo2 size={17} strokeWidth={2} />
        </button>

        <button
            type="button"
            title="Remove all annotations"
            aria-label="Remove all annotations"
            disabled={controller.annotations.length === 0}
            onClick={() => controller.clear()}
            className={ACTION_CLASS}
        >
            <Trash2 size={17} strokeWidth={2} />
        </button>
    </div>
);

export default AnnotationToolbar;
