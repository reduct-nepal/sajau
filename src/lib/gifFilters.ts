/** FFmpeg video filter chain — scale and fps only; branding is applied in canvas. */
export function buildGifVideoFilter(scale: number, fps: number) {
  return [`scale=${scale}:-1:flags=lanczos`, `fps=${fps}`].join(",");
}
