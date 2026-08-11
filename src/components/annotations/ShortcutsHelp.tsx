import { Keyboard } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const SHORTCUTS: { keys: string[]; label: string }[] = [
    { keys: ['⌘', 'Z'], label: 'Undo' },
    { keys: ['⇧', '⌘', 'Z'], label: 'Redo' },
    { keys: ['⌘', 'C'], label: 'Copy shape (or image, if none selected)' },
    { keys: ['⌘', 'V'], label: 'Paste shape' },
    { keys: ['⌥', 'Drag'], label: 'Duplicate shape' },
    { keys: ['⇧', 'N'], label: 'Upload new image' },
    { keys: ['C'], label: 'Circle tool' },
    { keys: ['R'], label: 'Rectangle tool' },
    { keys: ['A'], label: 'Numbered arrow tool' },
    { keys: ['P'], label: 'Cursor tool' },
    { keys: ['H'], label: 'Hand cursor tool' },
    { keys: ['Delete'], label: 'Remove selected shape' },
    { keys: ['Esc'], label: 'Deselect / cancel tool' },
];

/** A floating help button, fixed to the bottom-right of the viewport. */
const ShortcutsHelp = () => (
    <Popover>
        <PopoverTrigger asChild>
            <button
                type="button"
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts"
                className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#1C1C1E] text-white shadow-lg transition-transform hover:scale-105"
            >
                <Keyboard size={18} strokeWidth={2} />
            </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-64">
            <p className="mb-2 text-sm font-semibold text-gray-700">Keyboard shortcuts</p>
            <ul>
                {SHORTCUTS.map(({ keys, label }, i) => (
                    <li
                        key={label}
                        className={cn(
                            'flex items-center justify-between gap-3 py-1.5 text-sm',
                            i > 0 && 'border-t border-dotted border-gray-300'
                        )}
                    >
                        <span className="text-gray-600">{label}</span>
                        <span className="flex shrink-0 gap-1">
                            {keys.map((key, k) => (
                                <kbd
                                    key={k}
                                    className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-700"
                                >
                                    {key}
                                </kbd>
                            ))}
                        </span>
                    </li>
                ))}
            </ul>
        </PopoverContent>
    </Popover>
);

export default ShortcutsHelp;
