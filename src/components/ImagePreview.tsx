import { forwardRef, useEffect } from 'react';
import { PaddingValue, StylePreset } from '@/pages/Editor';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';
import { toast } from '@/components/ui/sonner';
import { getStyleConfig } from '@/lib/stylePresets';

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
                        // silent fail
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
                    className={cn(
                        'bg-branded-bg border border-branded-border transition-all duration-300 ease-in-out cursor-pointer hover:shadow-xl shadow-lg',
                        'max-w-full overflow-hidden',
                        isDragging && 'ring-4 ring-primary/20 border-primary'
                    )}
                    style={{
                        padding: styleConfig.containerPadding,
                        borderRadius: styleConfig.containerBorderRadius
                    }}
                >
                    {image ? (
                        <img
                            src={image}
                            alt="User screenshot"
                            className="w-full object-contain md:max-w-[600px]"
                            style={{
                                borderRadius: styleConfig.innerBorderRadius,
                                maxWidth: '100%',
                                maxHeight: 'min(400px, 70vh)'
                            }}
                        />
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
            </div>
        );
    }
);

export default ImagePreview;
