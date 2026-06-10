import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { PaddingValue, StylePreset } from "@/pages/Editor";
import {
  getContainerRadiusPx,
  getInnerRadiiPx,
  getPaddingFfmpegValues,
  type CornerRadii,
} from "@/lib/stylePresets";

const OUT_BG_COLOR = "#FFE2CC";
/** Reserved palette slot for transparency — unlikely to appear in UI screenshots. */
const TRANSPARENT_KEY_RGB = [0xff, 0x00, 0xff] as const;

function uniformRadii(radius: number): CornerRadii {
  return { tl: radius, tr: radius, br: radius, bl: radius };
}

function traceRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: CornerRadii,
) {
  const { tl, tr, br, bl } = radii;
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

/** Brand-colored frame drawn on top of media (outer round rect minus media cutout). */
function drawBorderOverlay(
  ctx: CanvasRenderingContext2D,
  frameW: number,
  frameH: number,
  outerRadius: number,
  mediaX: number,
  mediaY: number,
  mediaW: number,
  mediaH: number,
  innerRadii: CornerRadii,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  traceRoundRect(ctx, 0, 0, frameW, frameH, uniformRadii(outerRadius));
  traceRoundRect(ctx, mediaX, mediaY, mediaW, mediaH, innerRadii);
  ctx.fill("evenodd");
}

function colorDistanceRgb(r: number, g: number, b: number, entry: number[]) {
  const dr = r - entry[0];
  const dg = g - entry[1];
  const db = b - entry[2];
  return dr * dr + dg * dg + db * db;
}

function findNearestPaletteIndex(
  r: number,
  g: number,
  b: number,
  palette: number[][],
  skipIndex: number,
) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    if (i === skipIndex) continue;
    const dist = colorDistanceRgb(r, g, b, palette[i]);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/**
 * Quantize to an opaque palette and assign transparency via a reserved chroma-key
 * index. Avoids rgba4444 + oneBitAlpha, which treated anti-aliased white fringe
 * pixels (common with large border radii) as fully transparent.
 */
function encodeFramePixels(imageData: ImageData): {
  index: Uint8Array;
  palette: number[][];
  transparentIndex: number;
} {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const opaqueRgba = new Uint8ClampedArray(data);
  const transparentMask = new Uint8Array(pixelCount);

  for (let p = 0; p < pixelCount; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) {
      transparentMask[p] = 1;
      opaqueRgba[i] = TRANSPARENT_KEY_RGB[0];
      opaqueRgba[i + 1] = TRANSPARENT_KEY_RGB[1];
      opaqueRgba[i + 2] = TRANSPARENT_KEY_RGB[2];
      opaqueRgba[i + 3] = 255;
    } else {
      // Snap anti-aliased fringe to fully opaque so it is not dropped later.
      opaqueRgba[i + 3] = 255;
    }
  }

  // Leave one slot for the reserved transparent chroma key if needed.
  let palette = quantize(opaqueRgba, 255, { format: "rgb565" });

  let transparentIndex = palette.findIndex(
    (c) =>
      c[0] === TRANSPARENT_KEY_RGB[0] &&
      c[1] === TRANSPARENT_KEY_RGB[1] &&
      c[2] === TRANSPARENT_KEY_RGB[2],
  );
  if (transparentIndex < 0) {
    transparentIndex = palette.length;
    palette = [...palette, [...TRANSPARENT_KEY_RGB]];
  }

  const index = applyPalette(opaqueRgba, palette, "rgb565");

  for (let p = 0; p < pixelCount; p++) {
    const i = p * 4;
    if (transparentMask[p]) {
      index[p] = transparentIndex;
    } else if (index[p] === transparentIndex) {
      index[p] = findNearestPaletteIndex(
        data[i],
        data[i + 1],
        data[i + 2],
        palette,
        transparentIndex,
      );
    }
  }

  return { index, palette, transparentIndex };
}

function composeBrandedFrame(
  ctx: CanvasRenderingContext2D,
  frameW: number,
  frameH: number,
  media: CanvasImageSource,
  mediaX: number,
  mediaY: number,
  mediaW: number,
  mediaH: number,
  outerRadius: number,
  innerRadii: CornerRadii,
  borderColor: string,
) {
  ctx.clearRect(0, 0, frameW, frameH);

  // Clip to the outer rounded rect so corners stay transparent without
  // punching holes through media (destination-out was erasing white pixels
  // that extended into the corner wedges on flush edges).
  ctx.save();
  ctx.beginPath();
  traceRoundRect(ctx, 0, 0, frameW, frameH, uniformRadii(outerRadius));
  ctx.clip();

  ctx.drawImage(media, mediaX, mediaY, mediaW, mediaH);
  drawBorderOverlay(
    ctx,
    frameW,
    frameH,
    outerRadius,
    mediaX,
    mediaY,
    mediaW,
    mediaH,
    innerRadii,
    borderColor,
  );
  ctx.restore();
}

export function isGifCornerRoundingSupported() {
  return typeof ImageDecoder !== "undefined";
}

export async function applyRoundedCornersToGif(
  gifBlob: Blob,
  padding: PaddingValue,
  stylePreset: StylePreset,
  bgColor: string = OUT_BG_COLOR,
) {
  if (!isGifCornerRoundingSupported()) {
    return gifBlob;
  }

  const {
    w: padW,
    h: padH,
    x: mediaX,
    y: mediaY,
  } = getPaddingFfmpegValues(padding, stylePreset);
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
  let frameW = 0;
  let frameH = 0;

  for (let i = 0; i < track.frameCount; i++) {
    const { image } = await decoder.decode({ frameIndex: i });
    const mediaW = image.displayWidth;
    const mediaH = image.displayHeight;
    frameW = mediaW + padW;
    frameH = mediaH + padH;
    const delayMs = image.duration
      ? Math.max(20, Math.round(image.duration / 1000))
      : 42;

    const canvas = document.createElement("canvas");
    canvas.width = frameW;
    canvas.height = frameH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      image.close();
      throw new Error("Could not create canvas for GIF branding.");
    }

    composeBrandedFrame(
      ctx,
      frameW,
      frameH,
      image,
      mediaX,
      mediaY,
      mediaW,
      mediaH,
      outerRadius,
      innerRadii,
      bgColor,
    );
    image.close();

    const imageData = ctx.getImageData(0, 0, frameW, frameH);
    const { index, palette, transparentIndex } = encodeFramePixels(imageData);

    encoder.writeFrame(index, frameW, frameH, {
      palette,
      delay: delayMs,
      transparent: true,
      transparentIndex,
    });
  }

  decoder.close();
  encoder.finish();

  return new Blob([encoder.bytes()], { type: "image/gif" });
}
