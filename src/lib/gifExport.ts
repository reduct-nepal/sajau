import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { buildGifVideoFilter } from "@/lib/gifFilters";
import type { PaddingValue, StylePreset } from "@/pages/Editor";
import { applyRoundedCornersToGif } from "@/lib/gifRoundCorners";

export type QualityPreset = "high" | "balanced" | "optimized";
export type GifInputType = "video" | "gif";

export const OUT_BG_COLOR = "#FFE2CC";

export const borderRadiusMap = {
  "11px": { outer: "11px", inner: "8px" },
  "22px": { outer: "22px", inner: "11px" },
  "44px": { outer: "32px", inner: "16px" },
} as const;

export const qualityPresets = {
  high: { fps: 30, scale: 1080, colors: 256 },
  balanced: { fps: 24, scale: 720, colors: 256 },
  optimized: { fps: 15, scale: 480, colors: 128 },
} as const;

export interface ConvertToBrandedGifOptions {
  padding: PaddingValue;
  stylePreset: StylePreset;
  quality: QualityPreset;
  inputType: GifInputType;
}

export async function convertToBrandedGif(
  ffmpeg: FFmpeg,
  file: File,
  options: ConvertToBrandedGifOptions,
) {
  const inputFileName = options.inputType === "gif" ? "input.gif" : "input.mp4";
  const outputFileName = "output.gif";

  try {
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
  } catch {
    // Files don't exist yet
  }

  await ffmpeg.writeFile(inputFileName, await fetchFile(file));

  const settings = qualityPresets[options.quality];
  const videoFilter = buildGifVideoFilter(settings.scale, settings.fps);

  const command = [
    "-i",
    inputFileName,
    "-vf",
    videoFilter,
    "-loop",
    "0",
    "-pix_fmt",
    "rgb24",
    "-f",
    "gif",
    "-y",
    outputFileName,
  ];

  const exitCode = await ffmpeg.exec(command);
  if (exitCode !== 0) {
    throw new Error(`FFmpeg exited with code ${exitCode}`);
  }

  const data = await ffmpeg.readFile(outputFileName);

  if (!data || data.length === 0) {
    throw new Error("Output file is empty. The conversion may have failed.");
  }

  try {
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
  } catch (error) {
    console.error("Failed to delete files:", error);
    throw error;
  }

  const bytes =
    data instanceof Uint8Array
      ? new Uint8Array(data)
      : new TextEncoder().encode(data);

  const rectangularGif = new Blob([bytes], { type: "image/gif" });

  return applyRoundedCornersToGif(
    rectangularGif,
    options.padding,
    options.stylePreset,
  );
}

export function getBrandedGifFilename(originalFileName: string) {
  const base = originalFileName.replace(/\.[^.]+$/, "").trim() || "download";
  const safe =
    base
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "download";
  return `${safe}-branded.gif`;
}

export function downloadGifBlob(blob: Blob, originalFileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = getBrandedGifFilename(originalFileName);
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
