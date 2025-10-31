import { forwardRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from '@/components/ui/sonner';

export type PaddingValue = "11px" | "22px" | "44px";
export type StylePreset = "centered" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface DocsToHelpPreviewProps {
    image: string | null;
    padding: PaddingValue;
    stylePreset: StylePreset;
    isDragging: boolean;
    onClick: () => void;
    colorOption: string;
}

const FRAME_COLORS: Record<string, { bg: string; border: string; }> = {
    light:  {
        bg: '#FFDDC6',
        border: '#FFD1B3',
    },
    bright: {
        bg: '#FF4D00',
        border: '#FFFFFF',
    },
};

const getStyleConfig = (stylePreset: StylePreset, padding: PaddingValue) => {
    const paddingValue = parseInt(padding);
    const containerRadius = paddingValue;
    let mainRadius, smallerRadius;
    if (paddingValue === 11) {
        mainRadius = 11;
        smallerRadius = 8;
    } else if (paddingValue === 22) {
        mainRadius = 22;
        smallerRadius = 11;
    } else if (paddingValue === 44) {
        mainRadius = 44;
        smallerRadius = 32;
    } else {
        mainRadius = paddingValue - 1;
        smallerRadius = Math.max(0, paddingValue - 5);
    }
    switch (stylePreset) {
        case 'centered':
            return {
                containerPadding: padding,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: paddingValue === 11 ? '11px' : paddingValue === 22 ? '11px' : paddingValue === 44 ? '32px' : `${Math.max(0, paddingValue - 4)}px`,
            };
        case 'top-left':
            return {
                containerPadding: `0 ${padding} ${padding} 0`,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `${mainRadius}px 0 ${smallerRadius}px 0`,
            };
        case 'top-right':
            return {
                containerPadding: `0 0 ${padding} ${padding}`,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `0 ${mainRadius}px 0 ${smallerRadius}px`,
            };
        case 'bottom-left':
            return {
                containerPadding: `${padding} ${padding} 0 0`,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `0 ${smallerRadius}px 0 ${mainRadius}px`,
            };
        case 'bottom-right':
            return {
                containerPadding: `${padding} 0 0 ${padding}`,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `${smallerRadius}px 0 ${mainRadius}px 0`,
            };
        default:
            return {
                containerPadding: padding,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `${containerRadius - paddingValue}px`,
            };
    }
};

const DocsToHelpPreview = forwardRef<HTMLDivElement, DocsToHelpPreviewProps>(
    ({ image, padding, stylePreset, isDragging, onClick, colorOption }, ref) => {
        const styleConfig = getStyleConfig(stylePreset, padding);
        const frame = FRAME_COLORS[colorOption] ?? FRAME_COLORS.bright;

        useEffect(() => {
            const handleKeyDown = async (event: KeyboardEvent) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'c' && image && ref && typeof ref !== 'function' && ref.current) {
                    event.preventDefault();
                    try {
                        const dataUrl = await toPng(ref.current, {
                            cacheBust: true,
                            pixelRatio: 2,
                            style: { boxShadow: 'none' },
                        });
                        const response = await fetch(dataUrl);
                        const blob = await response.blob();
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        toast("Image copied to clipboard!");
                    } catch (err) {
                        // Optional: show error
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [image, ref]);

        return (
            <div className="flex justify-center items-start px-4 md:px-0 w-full">
                <div
                    ref={ref}
                    onClick={onClick}
                    className={[
                        'transition-all duration-300 ease-in-out cursor-pointer hover:shadow-xl shadow-lg',
                        isDragging ? 'ring-4 ring-primary/20 border-primary' : ''
                    ].join(' ')}
                    style={{
                        background: frame.bg,
                        border: `1px solid ${frame.border}`,
                        padding: styleConfig.containerPadding,
                        borderRadius: styleConfig.containerBorderRadius,
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                    }}
                >
                    {image ? (
                        <img
                            src={image}
                            alt="User screenshot"
                            className="w-full object-contain md:max-w-[600px]"
                            style={{
                                background: '#FFF',
                                borderRadius: styleConfig.innerBorderRadius,
                                maxWidth: '100%',
                                maxHeight: 'min(400px, 70vh)'
                            }}
                        />
                    ) : (
                        <div
                            className="w-full h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors md:w-[500px]"
                            style={{
                                borderRadius: styleConfig.innerBorderRadius,
                                background: 'rgba(255,255,255,0.95)',
                                color: '#222',
                            }}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <Upload size={32} strokeWidth={1.5} />
                                <div className="text-center">
                                    <p className="text-base font-semibold">Click to upload a PNG</p>
                                    <p className="text-xs mt-1">or drag and drop, or paste from clipboard</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

export default DocsToHelpPreview;
