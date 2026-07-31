import { forwardRef, useEffect, useRef } from 'react';
import { PaddingValue, StylePreset } from '@/pages/Editor';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { getStyleConfig } from '@/lib/stylePresets';
import { copyNodeToClipboard } from '@/lib/exportImage';
import { useAnnotations } from '@/hooks/useAnnotations';
import { useImageContentRect } from '@/hooks/useImageContentRect';
import AnnotationLayer from '@/components/annotations/AnnotationLayer';
import AnnotationToolbar from '@/components/annotations/AnnotationToolbar';

interface ImagePreviewProps {
    image: string | null;
    padding: PaddingValue;
    stylePreset: StylePreset;
    isDragging: boolean;
    onClick: () => void;
}

const ImagePreview = forwardRef<HTMLDivElement, ImagePreviewProps>(
    ({ image, padding, stylePreset, isDragging, onClick }, ref) => {
        const styleConfig = getStyleConfig(stylePreset, padding);
        const imgRef = useRef<HTMLImageElement>(null);
        const annotations = useAnnotations();
        const imageRect = useImageContentRect(imgRef, Boolean(image));

        // Annotations belong to the screenshot they were drawn on.
        const { reset } = annotations;
        useEffect(() => {
            reset();
        }, [image, reset]);

        useEffect(() => {
            const handleKeyDown = async (event: KeyboardEvent) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'c' && image && ref && typeof ref !== 'function' && ref.current) {
                    event.preventDefault();
                    try {
                        await copyNodeToClipboard(ref.current);
                        toast("Image copied to clipboard!");
                    } catch (err) {
                        // silent fail
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [image, ref]);

        return (
            <div className="flex justify-center items-start gap-4 px-4 md:px-0 w-full">
                <div
                    ref={ref}
                    // Once a screenshot is in place the frame is a canvas, not an upload button.
                    onClick={image ? undefined : onClick}
                    className={cn(
                        'bg-branded-bg border border-branded-border transition-all duration-300 ease-in-out hover:shadow-xl shadow-lg',
                        'max-w-full overflow-hidden',
                        !image && 'cursor-pointer',
                        isDragging && 'ring-4 ring-primary/20 border-primary'
                    )}
                    style={{
                        padding: styleConfig.containerPadding,
                        borderRadius: styleConfig.containerBorderRadius
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
                                    borderRadius: styleConfig.innerBorderRadius,
                                    maxWidth: '100%',
                                    maxHeight: 'min(400px, 70vh)'
                                }}
                            />
                            <AnnotationLayer controller={annotations} bounds={imageRect} />
                        </div>
                    ) : (
                        <div
                            className="w-full h-[300px] bg-white/50 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors md:w-[500px]"
                            style={{ borderRadius: styleConfig.innerBorderRadius }}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <Upload size={32} strokeWidth={1.5} />
                                <div className="text-center">
                                    <p className="text-base font-medium">Click to upload a PNG</p>
                                    <p className="text-xs text-gray-500 mt-1">or drag and drop, or paste from clipboard</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {image && <AnnotationToolbar controller={annotations} />}
            </div>
        );
    }
);

export default ImagePreview;
