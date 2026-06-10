import type { PaddingValue, StylePreset } from "@/pages/Editor";

export function getStyleConfig(
  stylePreset: StylePreset,
  padding: PaddingValue,
) {
  const paddingValue = parseInt(padding);
  const containerRadius = paddingValue;
  let mainRadius: number;
  let smallerRadius: number;

  if (paddingValue === 11) {
    mainRadius = 11;
    smallerRadius = 8;
  } else if (paddingValue === 22) {
    mainRadius = 22;
    smallerRadius = 11;
  } else if (paddingValue === 44) {
    mainRadius = 44;
    smallerRadius = 32;
  } else {
    mainRadius = paddingValue - 1;
    smallerRadius = Math.max(0, paddingValue - 5);
  }

  switch (stylePreset) {
    case "centered":
      return {
        containerPadding: padding,
        containerBorderRadius: `${containerRadius}px`,
        innerBorderRadius:
          paddingValue === 11
            ? "11px"
            : paddingValue === 22
              ? "11px"
              : paddingValue === 44
                ? "32px"
                : `${Math.max(0, paddingValue - 4)}px`,
      };
    case "top-left":
      return {
        containerPadding: `0 ${padding} ${padding} 0`,
        containerBorderRadius: `${containerRadius}px`,
        innerBorderRadius: `${mainRadius}px 0 ${smallerRadius}px 0`,
      };
    case "top-right":
      return {
        containerPadding: `0 0 ${padding} ${padding}`,
        containerBorderRadius: `${containerRadius}px`,
        // Flush top-right stays sharp; outer frame border-radius clips it.
        innerBorderRadius: `0 0 0 ${smallerRadius}px`,
      };
    case "bottom-left":
      return {
        containerPadding: `${padding} ${padding} 0 0`,
        containerBorderRadius: `${containerRadius}px`,
        innerBorderRadius: `0 ${smallerRadius}px 0 ${mainRadius}px`,
      };
    case "bottom-right":
      return {
        containerPadding: `${padding} 0 0 ${padding}`,
        containerBorderRadius: `${containerRadius}px`,
        // Flush bottom-right stays sharp; outer frame border-radius clips it.
        innerBorderRadius: `${smallerRadius}px 0 0 0`,
      };
    default:
      return {
        containerPadding: padding,
        containerBorderRadius: `${containerRadius}px`,
        innerBorderRadius: `${containerRadius - paddingValue}px`,
      };
  }
}

export type CornerRadii = {
  tl: number;
  tr: number;
  br: number;
  bl: number;
};

export function getContainerRadiusPx(padding: PaddingValue) {
  return parseInt(padding, 10);
}

export function getInnerRadiiPx(
  stylePreset: StylePreset,
  padding: PaddingValue,
) {
  const { innerBorderRadius } = getStyleConfig(stylePreset, padding);
  const parts = innerBorderRadius
    .split(/\s+/)
    .map((value) => parseInt(value, 10) || 0);

  if (parts.length === 1) {
    return { tl: parts[0], tr: parts[0], br: parts[0], bl: parts[0] };
  }

  return {
    tl: parts[0] ?? 0,
    tr: parts[1] ?? 0,
    br: parts[2] ?? 0,
    bl: parts[3] ?? 0,
  };
}

/** FFmpeg pad filter values matching PNG position presets */
export function getPaddingFfmpegValues(
  padding: PaddingValue,
  stylePreset: StylePreset,
) {
  const p = parseInt(padding);

  switch (stylePreset) {
    case "centered":
      return { w: p * 2, h: p * 2, x: p, y: p };
    case "top-left":
      return { w: p, h: p, x: 0, y: 0 };
    case "top-right":
      return { w: p, h: p, x: p, y: 0 };
    case "bottom-left":
      return { w: p, h: p, x: 0, y: p };
    case "bottom-right":
      return { w: p, h: p, x: p, y: p };
    default:
      return { w: p * 2, h: p * 2, x: p, y: p };
  }
}
