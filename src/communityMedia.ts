import { newId, type Attachment } from "./communityStore";
export const MEDIA_HINT =
  "照片≤3张 · 每张≤12MB；视频≤1个 · ≤30MB / 90秒。";
const MB = 1024 * 1024;
export async function prepareAttachment(file: File): Promise<Attachment> {
  const kind = file.type.startsWith("image/") ? "image" : "video";
  const imageType = ["image/jpeg", "image/png", "image/webp"].includes(
    file.type,
  );
  const videoType = ["video/mp4", "video/webm"].includes(file.type);
  if (!imageType && !videoType)
    throw new Error(
      `${file.name}：格式不支持，照片请转为JPG、PNG或WebP，视频请使用MP4或WebM。`,
    );
  if (!file.size || file.size > (imageType ? 12 : 30) * MB)
    throw new Error(
      `${file.name}：文件为空或超过${imageType ? 12 : 30}MB限制。`,
    );
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const text = String.fromCharCode(...bytes);
  const valid =
    file.type === "image/jpeg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : file.type === "image/png"
        ? bytes[0] === 137 && text.slice(1, 4) === "PNG"
        : file.type === "image/webp"
          ? text.startsWith("RIFF") && text.slice(8, 12) === "WEBP"
          : file.type === "video/mp4"
            ? text.slice(4, 8) === "ftyp"
            : bytes[0] === 26 &&
              bytes[1] === 69 &&
              bytes[2] === 223 &&
              bytes[3] === 163;
  if (!valid) throw new Error(`${file.name}：文件内容与格式不符，请重新选择。`);
  const blob = imageType
    ? await optimizeImage(file)
    : await validateVideo(file);
  return { id: newId(), name: file.name, kind, blob };
}
async function optimizeImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const width = image.naturalWidth,
      height = image.naturalHeight;
    if (!width || !height || width * height > 80_000_000)
      throw new Error("图片尺寸过大或无法读取，请缩小后重试。");
    const scale = Math.min(1, 1920 / Math.max(width, height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("此浏览器无法处理图片，请换一张较小的照片。");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.86),
    );
    if (!blob) throw new Error("图片优化失败，请重试或选择较小照片。");
    return blob.size < file.size ? blob : file;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "图片无法读取，请重新选择。",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function validateVideo(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  try {
    if (!video.canPlayType(file.type))
      throw new Error("此浏览器不支持该视频，建议转为H.264编码的MP4。");
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("视频读取超时，请检查文件或使用较短的视频。")),
        10000,
      );
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timer);
        reject(new Error("视频无法读取，建议转为H.264编码的MP4。"));
      };
      video.preload = "metadata";
      video.src = url;
    });
    if (
      !Number.isFinite(video.duration) ||
      video.duration <= 0 ||
      video.duration > 90
    )
      throw new Error("请上传90秒以内的短视频。");
    return file;
  } finally {
    video.onloadedmetadata = null;
    video.onerror = null;
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
