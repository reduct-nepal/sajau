import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, Loader2, Film, Settings } from "lucide-react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type PaddingValue = "11px" | "22px" | "44px";
type QualityPreset = "high" | "balanced" | "optimized";

const borderRadiusMap = {
  '11px': { outer: '11px', inner: '8px' },
  '22px': { outer: '22px', inner: '11px' },
  '44px': { outer: '32px', inner: '16px' }
};

const qualityPresets = {
  high: { fps: 30, scale: 1080, colors: 256 },
  balanced: { fps: 24, scale: 720, colors: 256 },
  optimized: { fps: 15, scale: 480, colors: 128 }
};

const getPaddingFfmpegValues = (padding: PaddingValue) => {
  switch (padding) {
    case '11px': return { w: 22, h: 22, x: 11, y: 11 };
    case '22px': return { w: 44, h: 44, x: 22, y: 22 };
    case '44px': return { w: 88, h: 88, x: 44, y: 44 };
    default: return { w: 44, h: 44, x: 22, y: 22 };
  }
};

const OUT_BG_COLOR = "#FFE2CC";

const VideoToGif = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoadingFfmpeg, setIsLoadingFfmpeg] = useState(true);
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [padding, setPadding] = useState<PaddingValue>("22px");
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>('balanced');
  const [useRoundedCorners, setUseRoundedCorners] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const ffmpegRef = useRef(new FFmpeg());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadFfmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.max(0, Math.min(1, progress)));
      });
      try {
        await ffmpeg.load();
        setIsLoadingFfmpeg(false);
        setIsFfmpegLoaded(true);
        toast.success("Video converter is ready!");
      } catch (error) {
        console.error("Failed to load ffmpeg", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to load converter: ${errorMessage}. Try disabling browser extensions or using Incognito mode if this persists.`);
        setIsLoadingFfmpeg(false);
        setIsFfmpegLoaded(false);
      }
    };
    loadFfmpeg();
  }, []);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoDuration(null); // Reset duration on new file
      toast.success("Video uploaded! Adjust padding and click Download to convert.");
    } else {
      toast.error("Please upload a video file.");
    }
  }, []);

  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      toast.info(`Video duration: ${duration.toFixed(2)}s`);
    }
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("video/")) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDownload = async () => {
    if (!videoFile || !isFfmpegLoaded || isProcessing) {
      if (!videoFile) {
        toast.error("Please upload a video first.");
      } else if (!isFfmpegLoaded) {
        toast.error("Converter is not ready. It might still be loading or has failed to load.");
      }
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    toast.info("Converting video to GIF...");

    try {
      const ffmpeg = ffmpegRef.current;
      const inputFileName = 'input.mp4';
      const outputFileName = 'output.gif';

      // Clean up any existing files first
      try {
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);
      } catch (e) {
        // Files don't exist, that's fine
      }

      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      const settings = qualityPresets[qualityPreset];
      const { w, h, x, y } = getPaddingFfmpegValues(padding);

      // High quality command with proper scaling and color optimization
      const command = [
        '-i', inputFileName,
        '-vf', `scale=${settings.scale}:-1:flags=lanczos,pad=iw+${w}:ih+${h}:${x}:${y}:color=${OUT_BG_COLOR},fps=${settings.fps}`,
        '-loop', '0',
        '-pix_fmt', 'rgb24',
        '-f', 'gif',
        '-y', outputFileName
      ];
      
      console.log('Executing FFMPEG command:', command.join(' '));

      await ffmpeg.exec(command);

      const data = await ffmpeg.readFile(outputFileName);

      if (!data || data.length === 0) {
        throw new Error('Output file is empty. The conversion may have failed.');
      }

      const blob = new Blob([(data as Uint8Array).buffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `converted-${settings.scale}p-${settings.fps}fps-hq.gif`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Clean up files
      try {
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);
      } catch (e) {
        console.log('Could not clean up files:', e);
      }

      toast.success("High-quality GIF converted and downloaded successfully!");
    } catch (error) {
      console.error("Error converting video:", error);
      toast.error("An error occurred during conversion. Try with a simpler/shorter video or different quality settings.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const radii = borderRadiusMap[padding];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 lg:p-8"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <header className="w-full max-w-7xl mx-auto mb-8">
        <Link to="/" className="text-primary hover:underline flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </header>
      <div className="w-full flex flex-col items-center justify-center gap-8">
        <div className="w-full max-w-4xl bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="video/*" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={!isFfmpegLoaded || isProcessing}>
            <Upload /> Upload Video
          </Button>

          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Padding:</Label>
            <RadioGroup value={padding} onValueChange={(value) => setPadding(value as PaddingValue)} className="flex items-center gap-3" disabled={isProcessing}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="11px" id="p-sm" />
                <Label htmlFor="p-sm">Small</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="22px" id="p-md" />
                <Label htmlFor="p-md">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="44px" id="p-lg" />
                <Label htmlFor="p-lg">Large</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleDownload} disabled={!videoFile || !isFfmpegLoaded || isProcessing} className="w-[220px]">
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" />
                Converting ({Math.round(progress * 100)}%)
              </>
            ) : (
              <>
                <Download />
                Download GIF
              </>
            )}
          </Button>
        </div>

        <div className="flex-grow flex items-center justify-center">
          <div
            className={cn(
              "bg-branded-bg transition-all duration-300 ease-in-out",
              isDragging && "ring-4 ring-primary/20 border-primary"
            )}
            style={{
              padding: padding,
              borderRadius: radii.outer,
              background: OUT_BG_COLOR
            }}
          >
            {isLoadingFfmpeg ? (
              <div className="w-[clamp(300px,80vw,800px)] h-[clamp(200px,50vh,500px)] bg-white/50 flex flex-col items-center justify-center text-gray-500" style={{ borderRadius: radii.outer }}>
                <Loader2 className="h-16 w-16 animate-spin" />
                <p className="mt-4 text-lg font-medium">
                  Loading video converter...
                </p>
              </div>
            ) : videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                muted
                className="max-w-full max-h-[70vh] object-contain"
                style={{ borderRadius: radii.inner, background: "white" }}
                onLoadedMetadata={handleVideoLoad}
              />
            ) : (
              <div
                className="w-[clamp(300px,80vw,800px)] h-[clamp(200px,50vh,500px)] bg-white/50 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300"
                style={{ borderRadius: radii.outer }}
              >
                <Film size={64} strokeWidth={1.5} />
                <p className="mt-4 text-lg font-medium">Upload, drop or paste a video to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-8 w-full max-w-4xl">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings />
          Advanced Settings
        </Button>
        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">Quality:</Label>
                <Select value={qualityPreset} onValueChange={(v) => setQualityPreset(v as QualityPreset)} disabled={isProcessing}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="optimized">Optimized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rounded-corners"
                  checked={useRoundedCorners}
                  onChange={(e) => setUseRoundedCorners(e.target.checked)}
                  disabled={true}
                  className="h-4 w-4"
                />
                <Label htmlFor="rounded-corners">Apply rounded corners (disabled - causing conversion issues)</Label>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoToGif;
