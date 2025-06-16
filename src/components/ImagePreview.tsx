import { forwardRef } from 'react';
import { PaddingValue, StylePreset } from '@/pages/Editor';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
    image: string | null;
    padding: PaddingValue;
    stylePreset: StylePreset;
    isDragging: boolean;
    onClick: () => void;
}

const getStyleConfig = (stylePreset: StylePreset, padding: PaddingValue) => {
    const paddingValue = parseInt(padding);
    const containerRadius = paddingValue; // Container radius now matches padding value
    
    // Define radius values based on padding size
    let mainRadius, smallerRadius;
    if (paddingValue === 11) {
        mainRadius = 11; // Updated to 11px for aligned corners
        smallerRadius = 8; // smaller for opposite corners
    } else if (paddingValue === 22) {
        mainRadius = 22; // Updated to 22px for aligned corners
        smallerRadius = 11; // smaller for opposite corners
    } else if (paddingValue === 44) {
        mainRadius = 44; // Updated to 44px for aligned corners
        smallerRadius = 32; // smaller for opposite corners
    } else {
        // For other padding sizes, we'll use the old logic for now
        mainRadius = paddingValue - 1;
        smallerRadius = Math.max(0, paddingValue - 5);
    }
    
    switch (stylePreset) {
        case 'centered':
            return {
                containerPadding: padding,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: paddingValue === 11 ? '11px' : paddingValue === 22 ? '11px' : paddingValue === 44 ? '32px' : `${Math.max(0, paddingValue - 4)}px`
            };
        case 'top-left':
            return {
                containerPadding: `0 ${padding} ${padding} 0`,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `${mainRadius}px 0 ${smallerRadius}px 0` // top-left main, bottom-right smaller
            };
        case 'top-right':
            return {
                containerPadding: `0 0 ${padding} ${padding}`,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `0 ${mainRadius}px 0 ${smallerRadius}px` // top-right main, bottom-left smaller
            };
        case 'bottom-left':
            return {
                containerPadding: `${padding} ${padding} 0 0`,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `0 ${smallerRadius}px 0 ${mainRadius}px` // bottom-left main, top-right smaller
            };
        case 'bottom-right':
            return {
                containerPadding: `${padding} 0 0 ${padding}`,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `${smallerRadius}px 0 ${mainRadius}px 0` // bottom-right main, top-left smaller
            };
        default:
            return {
                containerPadding: padding,
                containerBorderRadius: `${containerRadius}px`,
                innerBorderRadius: `${containerRadius - paddingValue}px`
            };
    }
};

const ImagePreview = forwardRef<HTMLDivElement, ImagePreviewProps>(({ image, padding, stylePreset, isDragging, onClick }, ref) => {
    const styleConfig = getStyleConfig(stylePreset, padding);

    return (
        <div className="h-full flex items-center justify-center p-4">
            <div
                ref={ref}
                onClick={onClick}
                className={cn(
                    "bg-branded-bg border border-branded-border transition-all duration-300 ease-in-out shadow-lg cursor-pointer hover:shadow-xl",
                    isDragging && "ring-4 ring-primary/20 border-primary"
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
                        className="max-w-[50vw] max-h-[50vh] object-contain"
                        style={{ borderRadius: styleConfig.innerBorderRadius }}
                    />
                ) : (
                    <div
                        className="w-[50vw] max-w-[500px] h-[35vh] max-h-[250px] bg-white/50 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
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
});

export default ImagePreview;
