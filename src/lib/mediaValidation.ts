export const MAX_MEDIA_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SEC = 30;

export function validateVideoFile(file: File) {
  if (!file.type.startsWith("video/")) {
    return "Please upload a video file.";
  }
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    return "File must be under 100 MB.";
  }
  return null;
}

export function validateGifFile(file: File) {
  if (file.type !== "image/gif") {
    return "Please upload a GIF file.";
  }
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    return "File must be under 100 MB.";
  }
  return null;
}

export function validateVideoDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds > MAX_VIDEO_DURATION_SEC) {
    return "Video must be 30 seconds or shorter.";
  }
  return null;
}

export function validateGifModeFile(file: File) {
  if (file.type.startsWith("video/")) {
    return { error: validateVideoFile(file), type: "video" };
  }
  if (file.type === "image/gif") {
    return { error: validateGifFile(file), type: "gif" };
  }
  return { error: "Please upload a video or GIF file.", type: null };
}
