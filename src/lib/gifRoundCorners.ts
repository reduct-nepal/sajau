import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { PaddingValue, StylePreset } from "@/pages/Editor";
import {
  getContainerRadiusPx,
  getInnerRadiiPx,
  getPaddingFfmpegValues,
  type CornerRadii,
} from "@/lib/stylePresets";
const OUT_BG_COLOR = "#FFE2CC";

const GIF_PIXEL_FORMAT = "rgba4444" as const;

/** Cuts the square corner regions outside the outer rounded rect to transparency. */
function clearOuterCorners(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number
) {
  if (radius <= 0) return;
  const r = radius;
  const w = width;
  const h = height;

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(r, 0);
  ctx.arcTo(0, 0, 0, r, r);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w, h);
  ctx.lineTo(w - r, h);
  ctx.arcTo(w, h, w, h - r, r);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h - r);
  ctx.arcTo(0, h, r, h, r);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function findTransparentPaletteIndex(palette: number[][]): number {
  return palette.findIndex((color) => (color[3] ?? 255) === 0);
}

function fillInnerCorners(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cw: number,
  ch: number,
  radii: CornerRadii,
  color: string
) {
  ctx.fillStyle = color;
  const { tl, tr, br, bl } = radii;

  if (tl > 0) {
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + tl, py);
    ctx.arcTo(px, py, px, py + tl, tl);
    ctx.closePath();
    ctx.fill();
  }

  if (tr > 0) {
    ctx.beginPath();
    ctx.moveTo(px + cw, py);
    ctx.lineTo(px + cw - tr, py);
    ctx.arcTo(px + cw, py, px + cw, py + tr, tr);
    ctx.closePath();
    ctx.fill();
  }

  if (br > 0) {
    ctx.beginPath();
    ctx.moveTo(px + cw, py + ch);
    ctx.lineTo(px + cw - br, py + ch);
    ctx.arcTo(px + cw, py + ch, px + cw, py + ch - br, br);
    ctx.closePath();
    ctx.fill();
  }

  if (bl > 0) {
    ctx.beginPath();
    ctx.moveTo(px, py + ch);
    ctx.lineTo(px, py + ch - bl);
    ctx.arcTo(px, py + ch, px + bl, py + ch, bl);
    ctx.closePath();
    ctx.fill();
  }
}

function roundFrameOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  px: number,
  py: number,
  wPad: number,
  hPad: number,
  outerRadius: number,
  innerRadii: CornerRadii,
  bgColor: string
) {
  const cw = width - wPad;
  const ch = height - hPad;
  clearOuterCorners(ctx, width, height, outerRadius);
  fillInnerCorners(ctx, px, py, cw, ch, innerRadii, bgColor);
}

export function isGifCornerRoundingSupported(): boolean {
  return typeof ImageDecoder !== "undefined";
}

export async function applyRoundedCornersToGif(
  gifBlob: Blob,
  padding: PaddingValue,
  stylePreset: StylePreset,
  bgColor: string = OUT_BG_COLOR
): Promise<Blob> {
  if (!isGifCornerRoundingSupported()) {
    return gifBlob;
  }

  const { w, h, x, y } = getPaddingFfmpegValues(padding, stylePreset);
  const outerRadius = getContainerRadiusPx(padding);
  const innerRadii = getInnerRadiiPx(stylePreset, padding);

  const buffer = new Uint8Array(await gifBlob.arrayBuffer());
  const decoder = new ImageDecoder({ data: buffer, type: "image/gif" });
  await decoder.tracks.ready;

  const track = decoder.tracks.selectedTrack;
  if (!track) {
    decoder.close();
    return gifBlob;
  }

  const encoder = GIFEncoder();
  let width = 0;
  let height = 0;

  for (let i = 0; i < track.frameCount; i++) {
    const { image } = await decoder.decode({ frameIndex: i });
    width = image.displayWidth;
    height = image.displayHeight;
    const delayMs = image.duration ? Math.max(20, Math.round(image.duration / 1000)) : 42;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      image.close();
      throw new Error("Could not create canvas for GIF rounding.");
    }

    ctx.drawImage(image, 0, 0);
    image.close();

    roundFrameOnCanvas(ctx, width, height, x, y, w, h, outerRadius, innerRadii, bgColor);

    const imageData = ctx.getImageData(0, 0, width, height);
    const palette = quantize(imageData.data, 256, {
      format: GIF_PIXEL_FORMAT,
      oneBitAlpha: true,
    });
    const index = applyPalette(imageData.data, palette, GIF_PIXEL_FORMAT);
    const transparentIndex = findTransparentPaletteIndex(palette);

    encoder.writeFrame(index, width, height, {
      palette,
      delay: delayMs,
      transparent: transparentIndex >= 0,
      transparentIndex: transparentIndex >= 0 ? transparentIndex : 0,
    });
  }

  decoder.close();
  encoder.finish();

  return new Blob([encoder.bytes()], { type: "image/gif" });
}
