import { forwardRef, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { copyNodeToClipboard } from '@/lib/exportImage';
import { useAnnotations } from '@/hooks/useAnnotations';
import { useImageContentRect } from '@/hooks/useImageContentRect';
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts';
import AnnotationLayer from '@/components/annotations/AnnotationLayer';
import AnnotationToolbar from '@/components/annotations/AnnotationToolbar';
import ShortcutsHelp from '@/components/annotations/ShortcutsHelp';

export type PaddingValue = "11px" | "22px" | "44px";
export type StylePreset = "centered" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface DocsToHelpPreviewProps {
    image: string | null;
    padding: PaddingValue;
    stylePreset: StylePreset;
    isDragging: boolean;
    onClick: () => void;
    colorOption: string;
    frameColors?: Record<string, { bg: string; border: string }>;
}

const DEFAULT_FRAME_COLORS: Record<string, { bg: string; border: string }> = {
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
                innerBorderRadius: `0 0 0 ${smallerRadius}px`,
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
                innerBorderRadius: `${smallerRadius}px 0 0 0`,
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
    ({ image, padding, stylePreset, isDragging, onClick, colorOption, frameColors }, ref) => {
        const styleConfig = getStyleConfig(stylePreset, padding);
        const colors = frameColors ?? DEFAULT_FRAME_COLORS;
        const frame = colors[colorOption] ?? colors.bright;
        const imgRef = useRef<HTMLImageElement>(null);
        const annotations = useAnnotations();
        const imageRect = useImageContentRect(imgRef, Boolean(image));

        // Annotations belong to the screenshot they were drawn on.
        const { reset } = annotations;
        useEffect(() => {
            reset();
        }, [image, reset]);

        const handleCopy = async () => {
            if (!image || !ref || typeof ref === 'function' || !ref.current) return;
            try {
                await copyNodeToClipboard(ref.current);
                toast("Image copied to clipboard!");
            } catch (err) {
                // Optional: show error
            }
        };

        useEditorShortcuts(annotations, {
            onCopy: handleCopy,
            onUploadNew: onClick,
            hasImage: Boolean(image),
        });

        return (
            <div className="flex justify-center items-start gap-4 px-4 md:px-0 w-full">
                <div
                    ref={ref}
                    // Once a screenshot is in place the frame is a canvas, not an upload button.
                    onClick={image ? undefined : onClick}
                    className={[
                        'transition-all duration-300 ease-in-out hover:shadow-xl shadow-lg overflow-hidden',
                        image ? '' : 'cursor-pointer',
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
                        <div className="relative w-full">
                            <img
                                ref={imgRef}
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
                            <AnnotationLayer controller={annotations} bounds={imageRect} />
                        </div>
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

                {image && <AnnotationToolbar controller={annotations} />}
                {image && <ShortcutsHelp />}
            </div>
        );
    }
);

export default DocsToHelpPreview;
