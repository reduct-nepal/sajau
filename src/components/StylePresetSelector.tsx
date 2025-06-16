import { StylePreset } from '@/pages/Editor';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StylePresetSelectorProps {
    stylePreset: StylePreset;
    setStylePreset: (preset: StylePreset) => void;
}

const stylePresets = [
    {
        value: 'centered' as const,
        label: 'Centered',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="2" fill="#FFE2CC"/>
                <rect x="0.1" y="0.1" width="23.8" height="23.8" rx="1.9" stroke="black" strokeOpacity="0.12" strokeWidth="0.2"/>
                <rect x="3" y="3" width="18" height="18" rx="1" fill="#F2F3F3"/>
                <path d="M18 17H6L9 13L11.25 16L14.25 12L18 17Z" fill="#A88B8B"/>
            </svg>
        )
    },
    {
        value: 'top-left' as const,
        label: 'Top Left',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="2" fill="#FFE2CC"/>
                <rect x="0.1" y="0.1" width="23.8" height="23.8" rx="1.9" stroke="black" strokeOpacity="0.12" strokeWidth="0.2"/>
                <path d="M0 1C0 0.447715 0.447715 0 1 0H21V20C21 20.5523 20.5523 21 20 21H0V1Z" fill="#F2F3F3"/>
                <path d="M16 17H4L7 13L9.25 16L12.25 12L16 17Z" fill="#A88B8B"/>
            </svg>
        )
    },
    {
        value: 'bottom-left' as const,
        label: 'Bottom Left',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="2" fill="#FFE2CC"/>
                <rect x="0.1" y="0.1" width="23.8" height="23.8" rx="1.9" stroke="black" strokeOpacity="0.12" strokeWidth="0.2"/>
                <path d="M0 3H20C20.5523 3 21 3.44772 21 4V24H1C0.447715 24 0 23.5523 0 23V3Z" fill="#F2F3F3"/>
                <path d="M16 20H4L7 16L9.25 19L12.25 15L16 20Z" fill="#A88B8B"/>
            </svg>
        )
    },
    {
        value: 'bottom-right' as const,
        label: 'Bottom Right',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="2" fill="#FFE2CC"/>
                <rect x="0.1" y="0.1" width="23.8" height="23.8" rx="1.9" stroke="black" strokeOpacity="0.12" strokeWidth="0.2"/>
                <path d="M3 4C3 3.44772 3.44772 3 4 3H24V24H3V4Z" fill="#F2F3F3"/>
                <path d="M19 20H7L10 16L12.25 19L15.25 15L19 20Z" fill="#A88B8B"/>
            </svg>
        )
    },
    {
        value: 'top-right' as const,
        label: 'Top Right',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="2" fill="#FFE2CC"/>
                <rect x="0.1" y="0.1" width="23.8" height="23.8" rx="1.9" stroke="black" strokeOpacity="0.12" strokeWidth="0.2"/>
                <path d="M3 0H24V21H4C3.44772 21 3 20.5523 3 20V0Z" fill="#F2F3F3"/>
                <path d="M19 17H7L10 13L12.25 16L15.25 12L19 17Z" fill="#A88B8B"/>
            </svg>
        )
    }
];

const StylePresetSelector = ({ stylePreset, setStylePreset }: StylePresetSelectorProps) => {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Image Position</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-3 gap-2">
                {stylePresets.map((preset) => (
                    <button
                        key={preset.value}
                        onClick={() => setStylePreset(preset.value)}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all hover:bg-gray-50",
                            stylePreset === preset.value
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-gray-200"
                        )}
                        title={preset.label}
                    >
                        <div className="w-5 h-5 flex-shrink-0">
                            {preset.icon}
                        </div>
                        <span className="text-xs font-medium text-gray-600 text-center">{preset.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StylePresetSelector;
