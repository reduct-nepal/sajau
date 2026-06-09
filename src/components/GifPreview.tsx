import { forwardRef } from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaddingValue, StylePreset } from "@/pages/Editor";
import { OUT_BG_COLOR } from "@/lib/gifExport";
import { getStyleConfig } from "@/lib/stylePresets";

interface GifPreviewProps {
  mediaSrc: string | null;
  mediaType: "video" | "gif" | null;
  padding: PaddingValue;
  stylePreset: StylePreset;
  isDragging: boolean;
  isFfmpegLoading: boolean;
  onClick: () => void;
  onVideoLoadedMetadata?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const GifPreview = forwardRef<HTMLDivElement, GifPreviewProps>(
  (
    {
      mediaSrc,
      mediaType,
      padding,
      stylePreset,
      isDragging,
      isFfmpegLoading,
      onClick,
      onVideoLoadedMetadata,
      videoRef,
    },
    ref
  ) => {
    const styleConfig = getStyleConfig(stylePreset, padding);

    const mediaStyle = {
      borderRadius: styleConfig.innerBorderRadius,
      background: OUT_BG_COLOR,
      maxWidth: "100%",
      maxHeight: "min(400px, 70vh)",
    };

    return (
      <div className="flex justify-center items-start px-4 md:px-0 w-full">
        <div
          ref={ref}
          onClick={onClick}
          className={cn(
            "bg-branded-bg border border-branded-border transition-all duration-300 ease-in-out cursor-pointer hover:shadow-xl shadow-lg",
            "max-w-full overflow-hidden",
            isDragging && "ring-4 ring-primary/20 border-primary"
          )}
          style={{
            padding: styleConfig.containerPadding,
            borderRadius: styleConfig.containerBorderRadius,
            background: OUT_BG_COLOR,
          }}
        >
          {isFfmpegLoading ? (
            <div
              className="w-full h-[300px] md:w-[500px] bg-white/50 flex flex-col items-center justify-center text-gray-500"
              style={{ borderRadius: styleConfig.innerBorderRadius }}
            >
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-base font-medium">Loading GIF converter...</p>
            </div>
          ) : mediaSrc && mediaType === "video" ? (
            <video
              ref={videoRef}
              src={mediaSrc}
              controls
              muted
              className="w-full object-contain md:max-w-[600px]"
              style={mediaStyle}
              onLoadedMetadata={onVideoLoadedMetadata}
            />
          ) : mediaSrc && mediaType === "gif" ? (
            <img
              src={mediaSrc}
              alt="Uploaded GIF"
              className="w-full object-contain md:max-w-[600px]"
              style={mediaStyle}
            />
          ) : (
            <div
              className="w-full h-[300px] bg-white/50 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors md:w-[500px]"
              style={{ borderRadius: styleConfig.innerBorderRadius }}
            >
              <div className="flex flex-col items-center gap-3">
                <Film size={32} strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-base font-medium">Click to upload a video or GIF</p>
                  <p className="text-xs text-gray-500 mt-1">
                    or drag and drop, or paste from clipboard
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Videos: max 30s, under 100 MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

GifPreview.displayName = "GifPreview";

export default GifPreview;
