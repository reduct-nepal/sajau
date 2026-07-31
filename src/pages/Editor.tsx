import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ImagePreview from "@/components/ImagePreview";
import GifPreview from "@/components/GifPreview";
import Controls from "@/components/Controls";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ExportFormat } from "@/components/FormatToggle";
import { useFfmpeg } from "@/hooks/useFfmpeg";
import {
  validateGifModeFile,
  validateVideoDuration,
} from "@/lib/mediaValidation";
import type { QualityPreset } from "@/lib/gifExport";
import type { GifInputType } from "@/lib/gifExport";
import { toast } from "sonner";

export type PaddingValue = "11px" | "22px" | "44px";
export type StylePreset = "centered" | "top-left" | "bottom-left" | "bottom-right" | "top-right";

const Editor = () => {
  const [searchParams] = useSearchParams();
  const initialFormat: ExportFormat =
    searchParams.get("format") === "gif" ? "gif" : "png";

  const [exportFormat, setExportFormat] = useState<ExportFormat>(initialFormat);
  const [image, setImage] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<GifInputType | null>(null);
  const [padding, setPadding] = useState<PaddingValue>("22px");
  const [stylePreset, setStylePreset] = useState<StylePreset>("centered");
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>("balanced");
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mediaSrcRef = useRef<string | null>(null);

  const {
    isLoading,
    isLoaded,
    progress,
    isProcessing,
    hasConvertedGif,
    clearConverted,
    convert,
    downloadConverted,
  } = useFfmpeg({
    enabled: exportFormat === "gif",
  });

  const clearGifMedia = useCallback(() => {
    if (mediaSrcRef.current) {
      URL.revokeObjectURL(mediaSrcRef.current);
      mediaSrcRef.current = null;
    }
    setMediaFile(null);
    setMediaSrc(null);
    setMediaType(null);
  }, []);

  const clearPngMedia = useCallback(() => {
    setImage(null);
  }, []);

  const handleExportFormatChange = useCallback(
    (format: ExportFormat) => {
      setExportFormat(format);
    },
    []
  );

  useEffect(() => {
    if (exportFormat === "png") {
      clearGifMedia();
    } else {
      clearPngMedia();
    }
  }, [exportFormat, clearGifMedia, clearPngMedia]);

  const handlePngFile = (file: File) => {
    if (file && file.type === "image/png") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload a PNG file.");
    }
  };

  const handleGifModeFile = useCallback(
    (file: File) => {
      const { error, type } = validateGifModeFile(file);
      if (error || !type) {
        toast.error(error ?? "Please upload a video or GIF file.");
        return;
      }

      if (mediaSrcRef.current) {
        URL.revokeObjectURL(mediaSrcRef.current);
      }

      const url = URL.createObjectURL(file);
      mediaSrcRef.current = url;
      setMediaFile(file);
      setMediaSrc(url);
      setMediaType(type);
      toast.success(
        type === "video"
          ? "Video uploaded! Adjust settings and click Convert."
          : "GIF uploaded! Adjust settings and click Convert."
      );
    },
    []
  );

  const handleFile = useCallback(
    (file: File) => {
      if (exportFormat === "png") {
        handlePngFile(file);
      } else {
        handleGifModeFile(file);
      }
    },
    [exportFormat, handleGifModeFile]
  );

  const handleVideoLoadedMetadata = useCallback(() => {
    if (!videoRef.current || mediaType !== "video") return;

    const duration = videoRef.current.duration;
    const error = validateVideoDuration(duration);
    if (error) {
      toast.error(error);
      clearGifMedia();
    }
  }, [mediaType, clearGifMedia]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    event.target.value = "";
  };

  const handleGifConvert = useCallback(() => {
    if (!mediaFile || !mediaType) return;
    convert(mediaFile, mediaType, padding, stylePreset, qualityPreset);
  }, [mediaFile, mediaType, padding, stylePreset, qualityPreset, convert]);

  const handleGifDownload = useCallback(() => {
    downloadConverted();
  }, [downloadConverted]);

  useEffect(() => {
    clearConverted();
  }, [mediaFile, padding, stylePreset, qualityPreset, exportFormat, clearConverted]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (exportFormat === "png" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            return;
          }
        }
        if (exportFormat === "gif") {
          if (item.type.startsWith("video/") || item.type === "image/gif") {
            const file = item.getAsFile();
            if (file) {
              handleFile(file);
              return;
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [exportFormat, handleFile]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  useEffect(() => {
    return () => {
      if (mediaSrcRef.current) {
        URL.revokeObjectURL(mediaSrcRef.current);
      }
    };
  }, []);

  return (
    <div
      className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept={exportFormat === "png" ? "image/png" : "video/*,image/gif"}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl flex-grow flex flex-col overflow-auto">
        <header className="mb-6">
          <Link
            to="/"
            className="text-primary hover:underline inline-flex w-fit items-center text-sm font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-grow">
          <div className="xl:col-span-2 order-2 xl:order-1">
            <Controls
              setPadding={setPadding}
              padding={padding}
              stylePreset={stylePreset}
              setStylePreset={setStylePreset}
              image={image}
              previewRef={previewRef}
              exportFormat={exportFormat}
              onExportFormatChange={handleExportFormatChange}
              mediaFile={mediaFile}
              mediaType={mediaType}
              isFfmpegLoaded={isLoaded}
              isFfmpegLoading={isLoading}
              isProcessing={isProcessing}
              progress={progress}
              qualityPreset={qualityPreset}
              setQualityPreset={setQualityPreset}
              hasConvertedGif={hasConvertedGif}
              onGifConvert={handleGifConvert}
              onGifDownload={handleGifDownload}
            />
          </div>

          <div className="xl:col-span-3 order-1 xl:order-2 flex items-start justify-center w-full">
            {exportFormat === "png" ? (
              <ImagePreview
                image={image}
                padding={padding}
                stylePreset={stylePreset}
                ref={previewRef}
                isDragging={isDragging}
                onClick={handleClick}
              />
            ) : (
              <GifPreview
                ref={previewRef}
                mediaSrc={mediaSrc}
                mediaType={mediaType}
                padding={padding}
                stylePreset={stylePreset}
                isDragging={isDragging}
                isFfmpegLoading={isLoading}
                onClick={handleClick}
                onVideoLoadedMetadata={handleVideoLoadedMetadata}
                videoRef={videoRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
