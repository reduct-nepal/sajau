import { useCallback, useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toast } from "sonner";
import {
  convertToBrandedGif,
  downloadGifBlob,
  type ConvertToBrandedGifOptions,
  type GifInputType,
  type QualityPreset,
} from "@/lib/gifExport";
import type { PaddingValue, StylePreset } from "@/pages/Editor";

interface UseFfmpegOptions {
  enabled: boolean;
}

export function useFfmpeg({ enabled }: UseFfmpegOptions) {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const isConvertingRef = useRef(false);
  const progressRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);

  const resetProgress = useCallback(() => {
    progressRef.current = 0;
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!enabled || isLoaded || isLoading || error) {
      return;
    }

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on("log", ({ message }) => {
      console.log("[ffmpeg]", message);
    });

    ffmpeg.on("progress", ({ progress: p }) => {
      if (!isConvertingRef.current) return;

      const clamped = Math.max(0, Math.min(1, p));
      // ffmpeg.wasm often emits a spurious 100% before real frame progress begins
      if (clamped >= 1 && progressRef.current < 0.05) return;
      if (clamped < progressRef.current) return;

      progressRef.current = clamped;
      setProgress(clamped);
    });

    const loadFfmpeg = async () => {
      setIsLoading(true);
      try {
        await ffmpeg.load();
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load ffmpeg", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        toast.error(
          `Failed to load converter: ${message}. Try disabling browser extensions or using Incognito mode if this persists.`
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFfmpeg();
  }, [enabled, isLoaded, isLoading, error]);

  const clearConverted = useCallback(() => {
    setConvertedBlob(null);
    setSourceFileName(null);
  }, []);

  const convert = useCallback(
    async (
      file: File,
      inputType: GifInputType,
      padding: PaddingValue,
      stylePreset: StylePreset,
      quality: QualityPreset
    ) => {
      if (!file) {
        toast.error("Please upload a video or GIF first.");
        return;
      }
      if (!isLoaded || !ffmpegRef.current) {
        toast.error(
          "Converter is not ready. It might still be loading or has failed to load."
        );
        return;
      }
      if (isProcessing) {
        return;
      }

      isConvertingRef.current = true;
      setIsProcessing(true);
      resetProgress();
      clearConverted();

      const options: ConvertToBrandedGifOptions = {
        padding,
        stylePreset,
        quality,
        inputType,
      };

      try {
        const blob = await convertToBrandedGif(ffmpegRef.current, file, options);
        setConvertedBlob(blob);
        setSourceFileName(file.name);
        toast.success("GIF converted! You can now download it.");
      } catch (err) {
        console.error("Error converting to GIF:", err);
        toast.error(
          "An error occurred during conversion. Try with a simpler/shorter video or different quality settings."
        );
      } finally {
        isConvertingRef.current = false;
        setIsProcessing(false);
        resetProgress();
      }
    },
    [isLoaded, isProcessing, clearConverted, resetProgress]
  );

  const downloadConverted = useCallback(() => {
    if (!convertedBlob || !sourceFileName) {
      toast.error("Please convert your GIF first.");
      return;
    }
    downloadGifBlob(convertedBlob, sourceFileName);
    toast.success("GIF downloaded successfully!");
  }, [convertedBlob, sourceFileName]);

  return {
    isLoading,
    isLoaded,
    error,
    progress,
    isProcessing,
    hasConvertedGif: convertedBlob !== null,
    clearConverted,
    convert,
    downloadConverted,
  };
}
