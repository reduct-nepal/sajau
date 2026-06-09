import type { PaddingValue, StylePreset } from "@/pages/Editor";
import { getPaddingFfmpegValues } from "@/lib/stylePresets";
const OUT_BG_COLOR = "#FFE2CC";

/** FFmpeg video filter chain for branded GIF export (pad only — wasm-safe). */
export function buildGifVideoFilter(
  scale: number,
  fps: number,
  padding: PaddingValue,
  stylePreset: StylePreset
): string {
  const { w, h, x, y } = getPaddingFfmpegValues(padding, stylePreset);

  return [
    `scale=${scale}:-1:flags=lanczos`,
    `pad=iw+${w}:ih+${h}:${x}:${y}:color=${OUT_BG_COLOR}`,
    `fps=${fps}`,
  ].join(",");
}
