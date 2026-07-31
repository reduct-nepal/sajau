import { useState } from "react";
import { PaddingValue, StylePreset } from "@/pages/Editor";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { captureNode, copyNodeToClipboard } from "@/lib/exportImage";
import { Download, Copy, Loader2, Settings, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import StylePresetSelector from "./StylePresetSelector";
import FormatToggle, { ExportFormat } from "./FormatToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QualityPreset, GifInputType } from "@/lib/gifExport";

interface ControlsProps {
  setPadding: (padding: PaddingValue) => void;
  padding: PaddingValue;
  stylePreset: StylePreset;
  setStylePreset: (preset: StylePreset) => void;
  image: string | null;
  previewRef: React.RefObject<HTMLDivElement>;
  exportFormat?: ExportFormat;
  onExportFormatChange?: (format: ExportFormat) => void;
  mediaFile?: File | null;
  mediaType?: GifInputType | null;
  isFfmpegLoaded?: boolean;
  isFfmpegLoading?: boolean;
  isProcessing?: boolean;
  progress?: number;
  qualityPreset?: QualityPreset;
  setQualityPreset?: (preset: QualityPreset) => void;
  hasConvertedGif?: boolean;
  onGifConvert?: () => void;
  onGifDownload?: () => void;
  colorOption?: string;
  setColorOption?: (option: string) => void;
  colorOptions?: { label: string; value: string; bg: string; border: string }[];
}

const Controls = ({
  setPadding,
  padding,
  stylePreset,
  setStylePreset,
  image,
  previewRef,
  exportFormat = "png",
  onExportFormatChange,
  mediaFile,
  mediaType,
  isFfmpegLoaded,
  isFfmpegLoading,
  isProcessing,
  progress = 0,
  qualityPreset = "balanced",
  setQualityPreset,
  hasConvertedGif = false,
  onGifConvert,
  onGifDownload,
  colorOption,
  setColorOption,
  colorOptions,
}: ControlsProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDownload = () => {
    if (previewRef.current) {
      captureNode(previewRef.current)
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = "branded-screenshot.png";
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error("Oops, something went wrong!", err);
        });
    }
  };

  const handleCopy = async () => {
    if (previewRef.current) {
      try {
        await copyNodeToClipboard(previewRef.current);
        toast("Image copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy image:", err);
      }
    }
  };

  const readableTextOn = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6 ? "#111827" : "#FFFFFF";
  };

  const canConvertGif =
    !!mediaFile && !!mediaType && !!isFfmpegLoaded && !isFfmpegLoading && !isProcessing;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
      <div className="p-4 space-y-4">
        {onExportFormatChange && (
          <FormatToggle
            value={exportFormat}
            onChange={onExportFormatChange}
            disabled={isProcessing}
          />
        )}

        {exportFormat === "png" ? (
          <div className="flex flex-col md:flex-row gap-2">
            <Button onClick={handleDownload} disabled={!image} className="w-full md:flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!image}
              variant="outline"
              className="w-full md:flex-1"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        ) : hasConvertedGif ? (
          <Button onClick={onGifDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download GIF
          </Button>
        ) : (
          <Button onClick={onGifConvert} disabled={!canConvertGif} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {progress > 0
                  ? `Converting (${Math.round(progress * 100)}%)`
                  : "Converting..."}
              </>
            ) : isFfmpegLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading converter...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Convert
              </>
            )}
          </Button>
        )}

        <div className="border-t pt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Padding Size</Label>
            <RadioGroup
              value={padding}
              onValueChange={(value: PaddingValue) => setPadding(value)}
              className="flex flex-row space-x-4"
              disabled={isProcessing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="11px" id="r1" />
                <Label htmlFor="r1">Small</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="22px" id="r2" />
                <Label htmlFor="r2">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="44px" id="r3" />
                <Label htmlFor="r3">Large</Label>
              </div>
            </RadioGroup>
          </div>

          <StylePresetSelector stylePreset={stylePreset} setStylePreset={setStylePreset} />

          {exportFormat === "gif" && setQualityPreset && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-0 hover:bg-transparent"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4" />
                Advanced Settings
              </Button>
              {showAdvanced && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium shrink-0">Quality:</Label>
                  <Select
                    value={qualityPreset}
                    onValueChange={(v) => setQualityPreset(v as QualityPreset)}
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="optimized">Optimized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {colorOption !== undefined && setColorOption && exportFormat === "png" && (
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold text-gray-700">Color</Label>
              <div className="flex gap-4">
                {colorOptions ? (
                  colorOptions.map((opt) => {
                    const isActive = colorOption === opt.value;
                    const style: React.CSSProperties = {
                      border: isActive ? `2px solid ${opt.border}` : undefined,
                      background: isActive ? opt.bg : undefined,
                      color: isActive ? readableTextOn(opt.bg) : undefined,
                    };
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`flex-1 rounded-lg border px-4 py-2 font-medium text-sm transition-colors focus:outline-none ${isActive ? "" : "border-gray-200 bg-white"}`}
                        style={style}
                        onClick={() => setColorOption(opt.value)}
                      >
                        {opt.label}{" "}
                        <span
                          className="ml-1 inline-block rounded-full w-4 h-4 align-middle"
                          style={{ background: opt.bg, border: `1px solid ${opt.border}` }}
                        />
                      </button>
                    );
                  })
                ) : (
                  <>
                    <button
                      type="button"
                      className={`flex-1 rounded-lg border px-4 py-2 font-medium text-sm transition-colors focus:outline-none ${colorOption === "light" ? "border-orange-400 bg-orange-100" : "border-gray-200 bg-white"}`}
                      onClick={() => setColorOption("light")}
                    >
                      Light{" "}
                      <span
                        className="ml-1 inline-block rounded-full w-4 h-4 align-middle"
                        style={{ background: "#FFDDC6", border: "1px solid #FFD1B3" }}
                      />
                    </button>
                    <button
                      type="button"
                      className={`flex-1 rounded-lg border px-4 py-2 font-medium text-sm transition-colors focus:outline-none ${colorOption === "bright" ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white"}`}
                      onClick={() => setColorOption("bright")}
                    >
                      Bright{" "}
                      <span
                        className="ml-1 inline-block rounded-full w-4 h-4 align-middle"
                        style={{ background: "#FF4D00", border: "1px solid #FF4D00" }}
                      />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Controls;
